/**
 * Quick script to delete a verifier account
 * Usage: node delete-verifier.mjs
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define MONGODB_URI in .env.local');
    process.exit(1);
}

async function deleteUser(email) {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected!');

        // Delete verifier
        const verifierResult = await mongoose.connection.collection('verifiers').deleteOne({ email: email.toLowerCase() });
        console.log('Verifier delete result:', verifierResult);

        // Delete any OTPs for this email
        const otpResult = await mongoose.connection.collection('otps').deleteMany({ email: email.toLowerCase() });
        console.log('OTP cleanup result:', otpResult);

        console.log(`\n✅ User ${email} has been deleted. They can now create a new account.`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Delete the specified user
deleteUser('aditya.mathan@codemateai.dev');
