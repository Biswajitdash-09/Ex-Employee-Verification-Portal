import { NextResponse } from 'next/server';
import { generateOTP, storeOTP, canRequestOTP, OTP_EXPIRY_MINUTES } from '@/lib/services/otp.service';
import { sendOTPEmail } from '@/lib/services/emailService';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Send OTP to verifier email
 * POST /api/auth/send-otp
 * Body: { email: string }
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

        // Store OTP in database
        const storeResult = await storeOTP(email, otp);
        if (!storeResult.success) {
            return NextResponse.json({
                success: false,
                message: 'Failed to generate OTP. Please try again.'
            }, { status: 500 });
        }

        // Send email asynchronously (fire-and-forget)
        sendEmailAsync(email, otp);

        // Return success immediately
        return NextResponse.json({
            success: true,
            message: `OTP sent to ${email}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
            expiryMinutes: OTP_EXPIRY_MINUTES
        }, { status: 200 });

    } catch (error) {
        if (isDev) {
            console.error('Send OTP error:', error);
        }

        return NextResponse.json({
            success: false,
            message: 'Failed to send OTP. Please try again.',
            error: isDev ? error.message : undefined
        }, { status: 500 });
    }
}

/**
 * Send email with logging (development only for detailed logs)
 */
async function sendEmailAsync(email, otp) {
    if (isDev) {
        console.log(`[OTP] Sending OTP to ${email}`);
    }

    try {
        // Check if any email provider is configured
        const hasEmailProvider = process.env.BREVO_API_KEY || process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY;

        if (!hasEmailProvider) {
            if (isDev) {
                console.warn(`[OTP] No email provider configured. OTP for ${email}: ${otp}`);
            }
            return;
        }

        // Call the email service
        const result = await sendOTPEmail(email, otp);

        if (isDev) {
            console.log(`[OTP] ✅ Email sent successfully to ${email}`);
        }

    } catch (error) {
        if (isDev) {
            console.error(`[OTP] ❌ Failed to send email to ${email}:`, error.message);
            console.log(`[OTP] Fallback - OTP for ${email}: ${otp}`);
        }
    }
}
