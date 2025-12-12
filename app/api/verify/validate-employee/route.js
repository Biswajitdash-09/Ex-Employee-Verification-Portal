import { NextResponse } from 'next/server';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import {
    findEmployeeById,
    isVerificationBlocked,
    incrementVerificationAttempt,
    resetVerificationAttempt,
    getBlockedMessage,
    getVerificationAttempt
} from '@/lib/mongodb.data.service';
import { VERIFICATION_ATTEMPT_CONFIG } from '@/lib/models/VerificationAttempt';

/**
 * Validate Employee ID and Name match before proceeding to next step
 * POST /api/verify/validate-employee
 * Body: { employeeId: string, name: string }
 * 
 * Features:
 * - Blocks after 3 consecutive failed attempts per verifier+employee
 * - Resets count on successful validation
 */
export async function POST(request) {
    try {
        // Authenticate the verifier
        const token = extractTokenFromHeader(request);

        if (!token) {
            return NextResponse.json({
                success: false,
                message: 'Access token is required'
            }, { status: 401 });
        }

        // Verify token
        let decoded;
        try {
            decoded = verifyToken(token);

            if (decoded.role !== 'verifier') {
                return NextResponse.json({
                    success: false,
                    message: 'Verifier access required'
                }, { status: 403 });
            }
        } catch (tokenError) {
            return NextResponse.json({
                success: false,
                message: 'Invalid or expired token'
            }, { status: 401 });
        }

        // Parse request body
        const body = await request.json();
        const { employeeId, name } = body;

        // Validate required fields
        if (!employeeId || !name) {
            return NextResponse.json({
                success: false,
                message: 'Employee ID and Name are required'
            }, { status: 400 });
        }

        const normalizedEmployeeId = employeeId.toUpperCase().trim();

        // Check if verifier is blocked for this employee
        const isBlocked = await isVerificationBlocked(decoded.id, normalizedEmployeeId);
        if (isBlocked) {
            return NextResponse.json({
                success: false,
                message: getBlockedMessage(),
                isBlocked: true
            }, { status: 403 });
        }

        // Find employee in MongoDB
        const employee = await findEmployeeById(normalizedEmployeeId);

        if (!employee) {
            // Increment failed attempt
            const attemptResult = await incrementVerificationAttempt(decoded.id, normalizedEmployeeId);
            const remainingAttempts = VERIFICATION_ATTEMPT_CONFIG.MAX_ATTEMPTS - attemptResult.attemptCount;

            if (attemptResult.justBlocked) {
                return NextResponse.json({
                    success: false,
                    message: getBlockedMessage(),
                    isBlocked: true
                }, { status: 403 });
            }

            return NextResponse.json({
                success: false,
                message: `Employee ID and Name do not match. Please check and try again. (${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining)`,
                remainingAttempts
            }, { status: 404 });
        }

        // Compare names (case-insensitive, trim whitespace)
        const submittedName = name.toLowerCase().trim();
        const officialName = employee.name.toLowerCase().trim();

        // Check for exact match or partial match (handles variations like "S Sathish" vs "S. Sathish")
        const namesMatch =
            submittedName === officialName ||
            submittedName.replace(/\./g, '') === officialName.replace(/\./g, '') ||
            submittedName.split(' ').join('') === officialName.split(' ').join('');

        if (!namesMatch) {
            // Increment failed attempt
            const attemptResult = await incrementVerificationAttempt(decoded.id, normalizedEmployeeId);
            const remainingAttempts = VERIFICATION_ATTEMPT_CONFIG.MAX_ATTEMPTS - attemptResult.attemptCount;

            if (attemptResult.justBlocked) {
                return NextResponse.json({
                    success: false,
                    message: getBlockedMessage(),
                    isBlocked: true
                }, { status: 403 });
            }

            return NextResponse.json({
                success: false,
                message: `Employee ID and Name do not match. Please check and try again. (${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining)`,
                remainingAttempts
            }, { status: 400 });
        }

        // Validation successful - reset attempt counter
        await resetVerificationAttempt(decoded.id, normalizedEmployeeId);

        return NextResponse.json({
            success: true,
            message: 'Employee validated successfully'
        }, { status: 200 });

    } catch (error) {
        console.error('Employee validation error:', error);

        return NextResponse.json({
            success: false,
            message: 'Validation failed. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
