import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Ensure Node.js runtime for Nodemailer
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper to verify Google reCAPTCHA token
async function verifyRecaptcha(token: string) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    return { success: false, error: 'Missing RECAPTCHA_SECRET_KEY on server' };
  }

  const params = new URLSearchParams();
  params.append('secret', secret);
  params.append('response', token);

  let data: any = { success: false };
  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    data = await res.json();
  } catch (error) {
    console.error('reCAPTCHA verification failed:', error);
    return { success: false, error: 'recaptcha_request_failed' } as any;
  }
  return data as { success: boolean; score?: number; action?: string; [k: string]: any };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<{
      firstName: string; email: string; phone?: string; message: string; token: string;
    }>;
    const { firstName, email, phone, message, token } = body ?? {};

    if (!token) {
      return NextResponse.json({ ok: false, error: 'Missing reCAPTCHA token' }, { status: 400 });
    }

    const recaptcha = await verifyRecaptcha(token);
    if (!recaptcha.success) {
      return NextResponse.json({ ok: false, error: 'reCAPTCHA verification failed' }, { status: 400 });
    }

    // Optional: if using reCAPTCHA v3, enforce a minimum score
    if (typeof recaptcha.score === 'number' && recaptcha.score < 0.5) {
      return NextResponse.json({ ok: false, error: 'Low reCAPTCHA score' }, { status: 400 });
    }

    if (!firstName || !email || !message) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
    }

    const toEmail = process.env.DISTRICT_CONTACT_EMAIL || 'leodistrict306d7@gmail.com';
    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM || 'noreply@example.com';

    if (!resendKey) {
      return NextResponse.json({ ok: false, error: 'Missing RESEND_API_KEY' }, { status: 500 });
    }

    const html = `
      <h2>New Contact Submission</h2>
      <p><strong>Name:</strong> ${firstName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || '-'} </p>
      <p><strong>Message:</strong></p>
      <p>${(message || '').replace(/\n/g, '<br/>')}</p>
    `;

    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      reply_to: email,
      subject: 'Website Contact Form Submission',
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Contact form error:', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
