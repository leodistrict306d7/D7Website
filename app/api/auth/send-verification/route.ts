import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { Resend } from 'resend';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { email, displayName } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const auth = getAdminAuth();
    if (!auth) {
      console.error('[Verification API] Error: Firebase Admin Auth not initialized.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // 1. Generate Link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://d7leos.org';
    const actionCodeSettings = {
      url: `${baseUrl}/lms`,
      handleCodeInApp: true,
    };

    let link;
    try {
      link = await auth.generateEmailVerificationLink(email, actionCodeSettings);
    } catch (linkError: any) {
      console.error('[Verification API] Firebase link generation FAILED:', linkError.message);
      return NextResponse.json({ error: `Firebase error: ${linkError.message}` }, { status: 500 });
    }

    // 2. Prepare Resend
    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM || 'noreply@d7leos.org';
    
    if (!resendKey) {
      console.error('[Verification API] Error: RESEND_API_KEY is missing');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const resend = new Resend(resendKey);
    const finalFrom = fromEmail.includes('<') ? fromEmail : `Leo District 306 D7 <${fromEmail}>`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; }
          .header { background-color: #800020; padding: 30px; text-align: center; }
          .logo { width: 100px; height: 100px; }
          .content { padding: 40px; background-color: #ffffff; color: #333333; line-height: 1.6; }
          .footer { background-color: #fafafa; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; }
          .button { display: inline-block; padding: 14px 30px; background-color: #800020; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
          .accent-bar { height: 4px; background: linear-gradient(to right, #800020, #FFD700); }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://d7leos.org/logos/dp.png" alt="Leo District 306 D7" class="logo">
          </div>
          <div class="accent-bar"></div>
          <div class="content">
            <h2 style="color: #800020; margin-top: 0;">Welcome to the D7 LMS, ${displayName || 'Leo'}!</h2>
            <p>Thank you for registering with the official Learning Management System of Leo District 306 D7. We're excited to have you join our community of young leaders.</p>
            <p>To access your courses and start tracking your progress, please verify your email address by clicking the button below:</p>
            <div style="text-align: center;">
              <a href="${link}" class="button">Verify Email Address</a>
            </div>
            <p style="margin-top: 30px; font-size: 14px; opacity: 0.8;">If you didn't create this account, you can safely ignore this email.</p>
            <p><strong>Leo District 306 D7 Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Leo District 306 D7 — Sri Lanka</p>
            <p>Leadership, Experience, Opportunity</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: finalFrom,
      to: email,
      subject: 'Verify Your Email - Leo District 306 D7 LMS',
      html,
    });

    if (error) {
      console.error('[Verification API] Resend API returned an ERROR:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (error: any) {
    console.error('[Verification API] UNEXPECTED error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
