import { NextResponse } from 'next/server';
import { schemas } from '@/lib/validation';
import { generateToken } from '@/lib/auth';
import { findAdminByUsername, updateAdminLastLogin } from '@/lib/mongodb.data.service';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { error, value } = schemas.adminLogin.validate(body);

    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(d => ({ field: d.path[0], message: d.message }))
      }, { status: 400 });
    }

    const { username, password } = value;

    // Debug: Log login attempt
    console.log('🔐 Admin login attempt for:', username);

    // Try to find admin by username
    let admin = await findAdminByUsername(username);

    // Debug: Log admin lookup result
    console.log('🔍 Admin lookup result:', admin ? 'FOUND' : 'NOT FOUND');

    if (!admin) {
      return NextResponse.json({
        success: false,
        message: 'Invalid username or password'
      }, { status: 401 });
    }

    // Check if account is active
    if (!admin.isActive) {
      return NextResponse.json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      }, { status: 403 });
    }

    // Verify password - handle both bcrypt and plaintext for demo
    let isPasswordValid = false;
    if (admin.password.startsWith('$2') || admin.password.startsWith('$2a') || admin.password.startsWith('$2b')) {
      // Hashed password - use bcrypt
      isPasswordValid = await bcrypt.compare(password, admin.password);
    } else {
      // Plain text password for demo
      isPasswordValid = password === admin.password;
    }

    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        message: 'Invalid username or password'
      }, { status: 401 });
    }

    // Update last login time
    await updateAdminLastLogin(admin._id.toString());

    // Generate JWT token
    const token = generateToken({
      id: admin._id.toString(),
      username: admin.username,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      permissions: admin.permissions,
      testMode: admin.testMode || false
    });

    // Return response without sensitive data
    const adminResponse = {
      id: admin._id.toString(),
      username: admin.username,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      department: admin.department,
      permissions: admin.permissions,
      lastLoginAt: new Date(),
      createdAt: admin.createdAt,
      testMode: admin.testMode || false
    };

    console.log('✅ Admin login successful:', admin.username);

    return NextResponse.json({
      success: true,
      message: admin.testMode ? 'Test admin login successful' : 'Admin login successful',
      data: {
        admin: adminResponse,
        token,
        testMode: admin.testMode || false
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Admin login error:', error);

    return NextResponse.json({
      success: false,
      message: 'Login failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: false,
    message: 'Method not allowed'
  }, { status: 405 });
}