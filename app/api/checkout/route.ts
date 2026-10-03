import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Resend } from 'resend';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

function getFirebaseServices() {
  const encodedServiceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64
    || process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const serviceAccount = encodedServiceAccount
    ? JSON.parse(Buffer.from(encodedServiceAccount, 'base64').toString())
    : {};
  const projectId = serviceAccount.project_id
    || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    || 'd7leos';
  const clientEmail = serviceAccount.client_email
    || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    || process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL;
  const privateKey = (serviceAccount.private_key
    || process.env.GOOGLE_PRIVATE_KEY
    || process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY)?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('Firebase service account credentials are not configured');
  }

  const app = getApps()[0] || initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    storageBucket: `${projectId}.firebasestorage.app`,
  });

  return {
    db: getFirestore(app),
    bucket: getStorage(app).bucket(),
    clientEmail,
    privateKey,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { db, bucket, clientEmail, privateKey } = getFirebaseServices();
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const clubType = formData.get('clubType') as string;
    const clubName = formData.get('clubName') as string;
    const cartJson = formData.get('cart') as string;
    const totalAmount = formData.get('totalAmount') as string;
    const receipt = formData.get('receipt') as File;

    if (!name || !email || !clubName || !cartJson || !receipt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cart = JSON.parse(cartJson);
    const colomboTime = new Date().toLocaleString('en-US', { 
      timeZone: 'Asia/Colombo',
      dateStyle: 'medium',
      timeStyle: 'medium'
    });

    // 1. Upload Receipt to Firebase Storage
    const cleanClubName = clubName.replace(/\s+/g, '_');
    const fileName = `merch_receipts/${cleanClubName}/${Date.now()}_${name.replace(/\s+/g, '_')}`;
    const file = bucket.file(fileName);
    const buffer = Buffer.from(await receipt.arrayBuffer());

    await file.save(buffer, { metadata: { contentType: receipt.type } });
    try { await file.makePublic(); } catch {}
    const receiptUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // 2. Save to Firestore (Internal Backup)
    await db.collection('merch_orders').add({
      createdAt: new Date(),
      colomboTime,
      name, email, clubType, clubName, cart, totalAmount: parseInt(totalAmount), receiptUrl, status: 'pending'
    });

    // 3. Prepare Rows for Google Sheets
    // Requested Format: Date | Name | Email | Club | Color | Qty & Size | Total Rs | Receipt Link
    const blackItems = cart.filter((item: any) => item.productId.includes('black'));
    const whiteItems = cart.filter((item: any) => item.productId.includes('white'));

    const sheetRows = [];

    if (blackItems.length > 0) {
      const summary = blackItems.map((item: any) => `${item.size}(${item.quantity})`).join(', ');
      const subtotal = blackItems.reduce((sum: number, item: any) => sum + item.quantity * 2000, 0);
      sheetRows.push([colomboTime, name, email, clubName, 'Black', summary, subtotal, receiptUrl]);
    }

    if (whiteItems.length > 0) {
      const summary = whiteItems.map((item: any) => `${item.size}(${item.quantity})`).join(', ');
      const subtotal = whiteItems.reduce((sum: number, item: any) => sum + item.quantity * 2000, 0);
      sheetRows.push([colomboTime, name, email, clubName, 'White', summary, subtotal, receiptUrl]);
    }

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:H', 
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: sheetRows },
    });

    // 4. Send Branded Confirmation Email
    const cartItemsHtml = cart.map((item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee; font-family: sans-serif; font-size: 14px;">
          <strong>${item.productId.includes('black') ? 'Black' : 'White'} District T-Shirt</strong><br>
          <span style="color: #666; font-size: 12px;">Size: ${item.size}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center; font-family: sans-serif; font-size: 14px;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-family: sans-serif; font-size: 14px; font-weight: bold;">Rs. ${item.quantity * 2000}</td>
      </tr>
    `).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 16px; overflow: hidden; }
          .header { background-color: #710F38; padding: 40px 20px; text-align: center; }
          .accent-bar { height: 6px; background: linear-gradient(to right, #710F38, #E1AD36); }
          .content { padding: 40px; background-color: #ffffff; color: #333333; line-height: 1.6; }
          .order-box { background-color: #fcfcfc; border: 1px solid #f0f0f0; border-radius: 12px; padding: 20px; margin: 20px 0; }
          .footer { background-color: #fafafa; padding: 30px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; }
          .status-badge { display: inline-block; padding: 4px 12px; background-color: #fff8e1; color: #b2722a; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://d7leos.org/logos/dp.png" alt="Leo District 306 D7" style="width: 80px; height: auto;">
            <h1 style="color: #ffffff; margin: 20px 0 0 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Order Confirmed</h1>
          </div>
          <div class="accent-bar"></div>
          <div class="content">
            <div class="status-badge">Payment Verification Pending</div>
            <h2 style="color: #710F38; margin-top: 0;">Hi ${name},</h2>
            <p>Thank you for purchasing the official District 306 D7 Merchandise. Your order has been successfully recorded and is now being processed by our team.</p>
            
            <div class="order-box">
              <h3 style="color: #710F38; margin-top: 0; font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 10px;">Order Summary</h3>
              <p style="margin: 10px 0; font-size: 14px;"><strong>Club:</strong> ${clubName}</p>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="text-align: left; font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1px;">
                    <th style="padding: 10px 0; border-bottom: 2px solid #f0f0f0;">Item</th>
                    <th style="padding: 10px 0; border-bottom: 2px solid #f0f0f0; text-align: center;">Qty</th>
                    <th style="padding: 10px 0; border-bottom: 2px solid #f0f0f0; text-align: right;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${cartItemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding: 20px 0 0 0; font-weight: bold; text-align: right; font-family: sans-serif;">Total Amount</td>
                    <td style="padding: 20px 0 0 0; font-weight: bold; text-align: right; color: #710F38; font-size: 18px; font-family: sans-serif;">Rs. ${totalAmount}.00</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <p style="font-size: 14px; color: #666;">Our district officials will verify your bank slip. Once confirmed, we will process your order for delivery.</p>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="margin: 0; font-weight: bold; color: #710F38;">Forge the Future!</p>
              <p style="margin: 0; font-size: 14px; color: #999;">Leo District 306 D7 — Sri Lanka</p>
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Leo District 306 D7. All rights reserved.</p>
            <p>Leadership • Experience • Opportunity</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const fromEmail = process.env.RESEND_FROM || 'noreply@d7leos.org';
    const finalFrom = fromEmail.includes('<') ? fromEmail : `Leo District 306 D7 <${fromEmail}>`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: finalFrom,
      to: email,
      subject: `Official Merch Order - ${clubName}`,
      html: emailHtml,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
