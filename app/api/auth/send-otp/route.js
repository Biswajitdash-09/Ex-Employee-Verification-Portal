import { NextResponse } from 'next/server';
import { generateOTP, storeOTP, canRequestOTP, OTP_EXPIRY_MINUTES } from '@/lib/services/otp.service';
import { sendOTPEmail } from '@/lib/services/emailService';
import { sendOTPEmailResend } from '@/lib/services/resendService';

/**
 * Send OTP to verifier email
 * POST /api/auth/send-otp
 * Body: { email: string }
 * 
 * Uses Resend if RESEND_API_KEY is configured, otherwise falls back to SendGrid
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { email } = body;

        // Validate email
        if (!email) {
            return NextResponse.json({
                success: false,
                message: 'Email is required'
            }, { status: 400 });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({
                success: false,
                message: 'Please enter a valid email address'
            }, { status: 400 });
        }

        // Block personal email domains
        const blockedDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
        const emailDomain = email.split('@')[1].toLowerCase();
        if (blockedDomains.includes(emailDomain)) {
            return NextResponse.json({
                success: false,
                message: 'Please use your company email address. Personal emails are not allowed.'
            }, { status: 400 });
        }

        // Check rate limiting
        const rateLimitCheck = await canRequestOTP(email);
        if (!rateLimitCheck.canRequest) {
            return NextResponse.json({
                success: false,
                message: rateLimitCheck.message,
                cooldownSeconds: rateLimitCheck.cooldownSeconds
            }, { status: 429 });
        }

        // Generate OTP
        const otp = generateOTP();

        // Store OTP
        const storeResult = await storeOTP(email, otp);
        if (!storeResult.success) {
            return NextResponse.json({
                success: false,
                message: 'Failed to generate OTP. Please try again.'
            }, { status: 500 });
        }

        // Send OTP via email - try Resend first, then SendGrid
        let emailSent = false;

        // Try Resend first (if configured)
        if (process.env.RESEND_API_KEY) {
            try {
                console.log(`[RESEND] Attempting to send OTP to ${email}`);
                await sendOTPEmailResend(email, otp);
                console.log(`[RESEND] OTP sent successfully to ${email}`);
                emailSent = true;
            } catch (resendError) {
                console.error('[RESEND] Error:', resendError.message);
            }
        }

        // Try SendGrid as fallback
        if (!emailSent && process.env.SENDGRID_API_KEY) {
            try {
                console.log(`[SENDGRID] Attempting to send OTP to ${email}`);
                await sendOTPEmail(email, otp);
                console.log(`[SENDGRID] OTP sent successfully to ${email}`);
                emailSent = true;
            } catch (sendgridError) {
                console.error('[SENDGRID] Error:', sendgridError.message);
            }
        }

        // Log OTP to console for development/fallback
        if (!emailSent) {
            console.log(`[DEV] Email not sent. OTP for ${email}: ${otp}`);
        }

        return NextResponse.json({
            success: true,
            message: `OTP sent to ${email}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
            expiryMinutes: OTP_EXPIRY_MINUTES
        }, { status: 200 });

    } catch (error) {
        console.error('Send OTP error:', error);

        return NextResponse.json({
            success: false,
            message: 'Failed to send OTP. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
