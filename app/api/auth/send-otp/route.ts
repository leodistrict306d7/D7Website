import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Expires in 10 minutes

    // Store in Firestore
    await db.collection('otps').doc(email.toLowerCase()).set({
      otp,
      expiresAt,
      createdAt: new Date(),
    });

    // Send using Resend
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM || 'no-reply@d7leos.org',
      to: email,
      subject: 'Your Login Code for D7 Leos KPI Portal',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
          <h2 style="color: #710F38;">D7 Leos KPI Portal</h2>
          <p>Please use the following 6-digit code to securely log in:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 20px; background: #FFF4F8; color: #C41D66; text-align: center; border-radius: 8px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `
    });

    if (result.error) {
      console.error('Resend error:', result.error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('OTP Send API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
