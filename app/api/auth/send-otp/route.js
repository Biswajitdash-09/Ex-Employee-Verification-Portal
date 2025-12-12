import { NextResponse } from 'next/server';
import { generateOTP, storeOTP, canRequestOTP, OTP_EXPIRY_MINUTES } from '@/lib/services/otp.service';
import { sendOTPEmail } from '@/lib/services/emailService';

/**
 * Send OTP to verifier email
 * POST /api/auth/send-otp
 * Body: { email: string }
 * 
 * Optimized for fast response - uses fire-and-forget pattern for email sending
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
        console.error('Send OTP error:', error);

        return NextResponse.json({
            success: false,
            message: 'Failed to send OTP. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}

/**
 * Send email with detailed logging for debugging
 */
async function sendEmailAsync(email, otp) {
    console.log(`\n========== OTP EMAIL DEBUG ==========`);
    console.log(`[OTP] Target email: ${email}`);
    console.log(`[OTP] OTP code: ${otp}`);
    console.log(`[OTP] BREVO_API_KEY exists: ${!!process.env.BREVO_API_KEY}`);
    console.log(`[OTP] SENDGRID_API_KEY exists: ${!!process.env.SENDGRID_API_KEY}`);
    console.log(`[OTP] EMAIL_PROVIDER: ${process.env.EMAIL_PROVIDER}`);
    console.log(`[OTP] FROM_EMAIL: ${process.env.FROM_EMAIL}`);

    try {
        // Check if any email provider is configured
        const hasEmailProvider = process.env.BREVO_API_KEY || process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY;

        if (!hasEmailProvider) {
            console.error(`[OTP] ❌ No email provider API key configured!`);
            console.log(`[OTP] Fallback - OTP for ${email}: ${otp}`);
            return;
        }

        console.log(`[OTP] 📧 Calling sendOTPEmail...`);

        // Call the email service
        const result = await sendOTPEmail(email, otp);

        console.log(`[OTP] ✅ Email sent successfully!`);
        console.log(`[OTP] Result:`, JSON.stringify(result, null, 2));
        console.log(`========== END OTP EMAIL DEBUG ==========\n`);

    } catch (error) {
        console.error(`[OTP] ❌ Failed to send email!`);
        console.error(`[OTP] Error name: ${error.name}`);
        console.error(`[OTP] Error message: ${error.message}`);
        console.error(`[OTP] Full error:`, error);
        console.log(`[OTP] Fallback - OTP for ${email}: ${otp}`);
        console.log(`========== END OTP EMAIL DEBUG ==========\n`);
    }
}
