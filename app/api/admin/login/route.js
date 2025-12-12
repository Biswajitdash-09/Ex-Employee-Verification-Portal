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

    // Debug logging only in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Admin login attempt for:', username);
    }

    // Try to find admin by username
    let admin = await findAdminByUsername(username);

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Admin lookup result:', admin ? 'FOUND' : 'NOT FOUND');
    }

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

    // Verify password - only bcrypt hashed passwords are supported
    let isPasswordValid = false;
    if (admin.password && (admin.password.startsWith('$2') || admin.password.startsWith('$2a') || admin.password.startsWith('$2b'))) {
      // Hashed password - use bcrypt
      isPasswordValid = await bcrypt.compare(password, admin.password);
    } else {
      // No valid password hash found - reject login
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Admin password is not properly hashed for:', username);
      }
      isPasswordValid = false;
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
      permissions: admin.permissions
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
      createdAt: admin.createdAt
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Admin login successful:', admin.username);
    }

    return NextResponse.json({
      success: true,
      message: 'Admin login successful',
      data: {
        admin: adminResponse,
        token
      }
    }, { status: 200 });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Admin login error:', error);
    }

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