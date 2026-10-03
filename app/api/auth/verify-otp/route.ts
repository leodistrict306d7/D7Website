import { NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();
    
    if (!email || !otp || typeof email !== 'string' || typeof otp !== 'string') {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }
    
    const db = getAdminDb();
    const auth = getAdminAuth();
    if (!db || !auth) {
      return NextResponse.json({ error: 'Service error' }, { status: 500 });
    }

    const docRef = db.collection('otps').doc(email.toLowerCase());
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    const data = doc.data();
    if (!data) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    if (data.otp !== otp) {
      return NextResponse.json({ error: 'Incorrect OTP' }, { status: 400 });
    }

    // Check expiration
    const expiresAt = data.expiresAt.toDate();
    if (new Date() > expiresAt) {
      await docRef.delete();
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
    }

    // OTP is valid. Delete it so it can't be reused.
    await docRef.delete();

    // Create a Custom Token for this email
    const customToken = await auth.createCustomToken(email.toLowerCase());

    return NextResponse.json({ success: true, token: customToken });
  } catch (error) {
    console.error('OTP Verify API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
