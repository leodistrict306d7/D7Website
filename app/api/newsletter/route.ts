import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    // TODO: Integrate with Mailchimp or Firestore
    // - Mailchimp: use process.env.MAILCHIMP_API_KEY and AUDIENCE_ID
    // - Firestore (server/admin): store subscribers for Newsletters

    return NextResponse.json({ ok: true });
  } catch {

    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}