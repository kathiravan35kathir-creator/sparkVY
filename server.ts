import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import cookieParser from 'cookie-parser';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import * as admin from 'firebase-admin';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';

// Load config for fallback
let fallbackConfig: any = { projectId: 'spark-vy' };
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    fallbackConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {
  console.error('Failed to load fallback config:', e);
}

// Initialize Firebase Admin
// CRITICAL: Force the correct project and database IDs in the environment so that
// underlying gRPC / @google-cloud/firestore resolves to the user's correct database
// instead of defaulting to the container's hosting project.
const targetProjectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || fallbackConfig.projectId;
const targetDatabaseId = fallbackConfig.firestoreDatabaseId;

if (targetProjectId) {
  process.env.GOOGLE_CLOUD_PROJECT = targetProjectId;
  process.env.GCLOUD_PROJECT = targetProjectId;
}
if (targetDatabaseId) {
  process.env.FIRESTORE_DATABASE = targetDatabaseId;
}

let db;
try {
  let adminApp;
  if (!getApps().length) {
    adminApp = initializeApp({
      credential: applicationDefault(),
      projectId: targetProjectId
    });
  } else {
    adminApp = getApps()[0];
  }
  
  db = targetDatabaseId ? getFirestore(adminApp, targetDatabaseId) : getFirestore(adminApp);
} catch (error) {
  console.error('Firebase Admin init error', error);
}

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// In-memory databases
const users = new Map<string, any>(); 
const otps = new Map<string, { hash: string, expires: number, attempts: number }>();
const otpRateLimit = new Map<string, { count: number, resetTime: number }>();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'localhost',
  port: parseInt(process.env.EMAIL_PORT || '1025'),
  secure: process.env.EMAIL_PORT === '465', // Port 465 uses SSL/TLS (secure: true), others use STARTTLS (secure: false)
  auth: process.env.EMAIL_HOST_USER ? {
    user: process.env.EMAIL_HOST_USER,
    pass: process.env.EMAIL_HOST_PASSWORD,
  } : undefined,
  tls: {
    // Do not fail on invalid certs (common for dev/internal smtp servers)
    rejectUnauthorized: false
  }
});

app.post('/api/auth/otp/request', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const normalizedEmail = email.toLowerCase().trim();

  // Rate limit
  const rl = otpRateLimit.get(normalizedEmail) || { count: 0, resetTime: Date.now() + 60000 };
  if (rl.resetTime < Date.now()) { rl.count = 0; rl.resetTime = Date.now() + 60000; }
  if (rl.count >= 3) return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
  rl.count++;
  otpRateLimit.set(normalizedEmail, rl);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hash = crypto.createHash('sha256').update(otp).digest('hex');
  
  otps.set(normalizedEmail, { hash, expires: Date.now() + 10 * 60 * 1000, attempts: 0 });

  console.log(`[DEV OTP for ${normalizedEmail}]: ${otp}`); // For dev testing

  try {
    if (process.env.EMAIL_HOST) {
      await transporter.sendMail({
        from: process.env.DEFAULT_FROM_EMAIL || 'no-reply@bizops.in',
        to: normalizedEmail,
        subject: 'Your BizOps Login Code',
        text: `Your 6-digit BizOps login code is: ${otp}\n\nIt expires in 10 minutes.\n\nIf you did not request this, please ignore this message.`
      });
    }
  } catch (err) {
    console.error('Email send failed:', err);
    // Don't expose smtp error to user
  }

  res.json({ success: true, message: 'OTP sent' });
});

app.post('/api/auth/otp/verify', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });
  const normalizedEmail = email.toLowerCase().trim();

  const record = otps.get(normalizedEmail);
  if (!record) return res.status(400).json({ error: 'No OTP requested or expired' });
  if (Date.now() > record.expires) {
    otps.delete(normalizedEmail);
    return res.status(400).json({ error: 'OTP expired' });
  }

  record.attempts++;
  if (record.attempts > 5) {
    otps.delete(normalizedEmail);
    return res.status(400).json({ error: 'Too many failed attempts. Request a new OTP.' });
  }

  const hash = crypto.createHash('sha256').update(otp).digest('hex');
  if (record.hash !== hash) {
    return res.status(400).json({ error: 'Incorrect OTP' });
  }

  otps.delete(normalizedEmail);

  let user = users.get(normalizedEmail);
  if (!user) {
    user = { id: crypto.randomUUID(), email: normalizedEmail, onboardingCompleted: false, isAdmin: true };
    users.set(normalizedEmail, user);
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('auth_token', token, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 3600 * 1000, path: '/' });
  
  res.json({ success: true, user });
});

app.post('/api/auth/firebase', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required' });

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    const email = decodedToken.email;
    if (!email) return res.status(400).json({ error: 'Invalid token: no email' });
    
    const normalizedEmail = email.toLowerCase().trim();
    let user = users.get(normalizedEmail);
    
    // Check if onboarding completed status is provided by the client
    const clientOnboardingCompleted = req.body.onboardingCompleted === true;

    if (!user) {
      const onboardingCompleted = clientOnboardingCompleted;
      console.log("[DEBUG] /api/auth/firebase: Creating user in memory session with onboardingCompleted:", onboardingCompleted);
      user = { 
        id: decodedToken.uid, 
        email: normalizedEmail, 
        full_name: decodedToken.name || '', 
        profile_photo: decodedToken.picture || '',
        onboardingCompleted,
        isAdmin: true
      };
      users.set(normalizedEmail, user);
    } else {
      user.full_name = user.full_name || decodedToken.name;
      user.profile_photo = user.profile_photo || decodedToken.picture;
      if (clientOnboardingCompleted) {
        user.onboardingCompleted = true;
      }
    }

    const sessionToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('auth_token', sessionToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 3600 * 1000, path: '/' });
    
    res.json({ success: true, user });
  } catch (err) {
    console.error('Firebase auth verify error', err);
    res.status(400).json({ error: 'Firebase authentication failed' });
  }
});

app.get('/api/auth/me', (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const user = users.get(payload.email);
    if (!user) return res.status(401).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.put('/api/auth/me', (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const user = users.get(payload.email);
    if (!user) return res.status(401).json({ error: 'User not found' });
    
    // Update user fields
    if (req.body.full_name) user.full_name = req.body.full_name;
    if (req.body.designation) user.designation = req.body.designation;
    if (req.body.password) user.password = req.body.password;
    if (req.body.mobile) user.mobile = req.body.mobile;

    res.json({ success: true, user });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true });
});

app.post('/api/auth/onboarding', async (req, res) => {
  console.log("[DEBUG] /api/auth/onboarding started");
  const token = req.cookies.auth_token;
  if (!token) {
    console.log("[DEBUG] /api/auth/onboarding: No token");
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    console.log("[DEBUG] /api/auth/onboarding: User payload:", payload);
    const user = users.get(payload.email);
    if (!user) {
        console.log("[DEBUG] /api/auth/onboarding: User not found in map", payload.email);
        return res.status(401).json({ error: 'User not found' });
    }

    // Handle both new { userData, companyData } body format AND fallback to direct request body
    const userData = req.body.userData || req.body;
    const companyData = req.body.companyData;

    // Mark as completed in backend state
    user.onboardingCompleted = true;
    user.full_name = userData.full_name || user.full_name;
    
    // We do NOT write to Firestore server-side because the client-side Firebase SDK has already successfully written the data
    // and the server-side container lacks direct IAM cross-project write access to the database.
    console.log("[DEBUG] /api/auth/onboarding: Skipping server-side Firestore write because client handles it directly.");
    
    res.json({ success: true, user });
  } catch (err) {
    console.error("[DEBUG] /api/auth/onboarding error:", err);
    res.status(500).json({ error: 'Internal server error: ' + err });
  }
});


// =========================================================================
// SECURE CREDENTIALS ENCRYPTION / DECRYPTION
// =========================================================================
const ENCRYPTION_KEY = crypto.createHash('sha256').update(JWT_SECRET).digest();
const IV_LENGTH = 16;

function encrypt(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  if (!text) return '';
  try {
    const parts = text.split(':');
    if (parts.length < 2) return text; // Plain text
    const iv = Buffer.from(parts.shift()!, 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    return text;
  }
}

// In-memory fallback for secure configs & communication logs
const fallbackConfigs = new Map<string, any>();
const localCommunicationLogs = new Map<string, any>();

// =========================================================================
// WHATSAPP SERVICE HELPERS
// =========================================================================

// 1. generateDocumentPDF
function generateDocumentPDF(
  docType: string,
  docNumber: string,
  date: string,
  partyName: string,
  amount: number,
  itemsList: Array<{ name: string; qty: number; price: number }>
): Buffer {
  const contentStream = [];
  
  contentStream.push("BT");
  contentStream.push("/F2 20 Tf");
  contentStream.push("50 780 Td");
  contentStream.push(`(${docType.toUpperCase()}) Tj`);
  contentStream.push("ET");

  contentStream.push("BT");
  contentStream.push("/F1 12 Tf");
  contentStream.push("50 750 Td");
  contentStream.push("(BizOps ERP - Enterprise WhatsApp Document) Tj");
  contentStream.push("ET");

  contentStream.push("1 w");
  contentStream.push("50 735 m 545 735 l S");

  contentStream.push("BT");
  contentStream.push("/F2 10 Tf");
  contentStream.push("50 700 Td");
  contentStream.push(`(Document No: ${docNumber}) Tj`);
  contentStream.push("0 -18 Td");
  contentStream.push(`(Date: ${date}) Tj`);
  contentStream.push("0 -18 Td");
  contentStream.push(`(Recipient: ${partyName}) Tj`);
  contentStream.push("ET");

  contentStream.push("BT");
  contentStream.push("/F2 10 Tf");
  contentStream.push("50 630 Td");
  contentStream.push("(Item Description) Tj");
  contentStream.push("250 0 Td");
  contentStream.push("(Qty) Tj");
  contentStream.push("100 0 Td");
  contentStream.push("(Price) Tj");
  contentStream.push("100 0 Td");
  contentStream.push("(Total) Tj");
  contentStream.push("ET");

  contentStream.push("50 622 m 545 622 l S");

  const items = itemsList || [];
  let y = 605;
  if (items.length === 0) {
    items.push({ name: "General Services", qty: 1, price: amount });
  }

  items.forEach((item) => {
    contentStream.push("BT");
    contentStream.push("/F1 9 Tf");
    contentStream.push(`50 ${y} Td`);
    contentStream.push(`(${item.name}) Tj`);
    contentStream.push(`250 0 Td`);
    contentStream.push(`(${item.qty}) Tj`);
    contentStream.push(`100 0 Td`);
    contentStream.push(`(${item.price.toFixed(2)}) Tj`);
    contentStream.push(`100 0 Td`);
    contentStream.push(`(${(item.qty * item.price).toFixed(2)}) Tj`);
    contentStream.push("ET");
    y -= 15;
  });

  contentStream.push(`50 ${y + 5} m 545 ${y + 5} l S`);

  contentStream.push("BT");
  contentStream.push("/F2 11 Tf");
  contentStream.push(`400 ${y - 15} Td`);
  contentStream.push(`(Grand Total: Rs. ${amount.toFixed(2)}) Tj`);
  contentStream.push("ET");

  contentStream.push("BT");
  contentStream.push("/F1 8 Tf");
  contentStream.push("50 50 Td");
  contentStream.push("(This is a computer generated document shared securely via WhatsApp Business API.) Tj");
  contentStream.push("ET");

  const streamContent = contentStream.join("\n");
  const streamLength = Buffer.byteLength(streamContent);

  const pdfParts = [];
  pdfParts.push("%PDF-1.4\n");
  pdfParts.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  pdfParts.push("2 0 obj\n<< /Type /Pages /Kids [ 3 0 R ] /Count 1 >>\nendobj\n");
  pdfParts.push("3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [ 0 0 595 842 ] /Contents 5 0 R >>\nendobj\n");
  pdfParts.push("4 0 obj\n<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >>\nendobj\n");
  pdfParts.push(`5 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`);
  pdfParts.push(`xref\n0 6\n0000000000 65535 f \n\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n300\n%%EOF`);

  return Buffer.concat(pdfParts.map((p) => Buffer.from(p)));
}

// 2. uploadTemporaryPDF
async function uploadTemporaryPDF(
  pdfBuffer: Buffer,
  docNumber: string,
  phoneNumberId: string,
  token: string,
  apiVersion: string
): Promise<string> {
  const formData = new FormData();
  const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
  formData.append('file', blob, `${docNumber}.pdf`);
  formData.append('messaging_product', 'whatsapp');
  formData.append('type', 'application/pdf');

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/media`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Meta Media API upload failed: ${errorDetails}`);
  }

  const result = await response.json() as any;
  if (!result.id) {
    throw new Error('Meta Media API returned no media ID.');
  }

  return result.id;
}

// 3. sendDocument (Main sender method)
async function sendDocument(
  recipientPhone: string,
  mediaId: string,
  filename: string,
  caption: string,
  phoneNumberId: string,
  token: string,
  apiVersion: string
): Promise<string> {
  const cleanPhone = recipientPhone.replace(/\D/g, '');
  
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanPhone,
    type: "document",
    document: {
      id: mediaId,
      filename: filename,
      caption: caption
    }
  };

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Meta Messages API failed: ${errorDetails}`);
  }

  const result = await response.json() as any;
  if (result.messages && result.messages[0]) {
    return result.messages[0].id;
  }

  return 'sent_success_no_id';
}

// =========================================================================
// ENDPOINTS
// =========================================================================

// GET WhatsApp Settings
app.get('/api/whatsapp/settings', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const userId = payload.userId;
    
    let config: any = fallbackConfigs.get(userId) || {};
    
    // Attempt Firestore load
    if (db) {
      try {
        const docRef = db.collection('companySettings').doc(userId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          const data = docSnap.data();
          if (data && data.communication && data.communication.whatsapp) {
            config = data.communication.whatsapp;
          }
        }
      } catch (e) {
        console.warn('Failed to load from Firestore, using memory fallback:', e);
      }
    }
    
    const responseConfig = {
      enableBusinessApi: config.enableBusinessApi || false,
      accessToken: config.accessToken ? '••••••••••••••••' : '',
      permanentAccessToken: config.permanentAccessToken ? '••••••••••••••••' : '',
      phoneNumberId: config.phoneNumberId || '',
      businessAccountId: config.businessAccountId || '',
      webhookVerifyToken: config.webhookVerifyToken || '',
      webhookSecret: config.webhookSecret || '',
      defaultSenderName: config.defaultSenderName || 'BizOps ERP',
      apiVersion: config.apiVersion || 'v18.0'
    };
    
    res.json({ success: true, config: responseConfig });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get settings' });
  }
});

// POST WhatsApp Settings
app.post('/api/whatsapp/settings', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const userId = payload.userId;
    const { config } = req.body;
    
    if (!config) return res.status(400).json({ error: 'Config is required' });
    
    let existingConfig: any = fallbackConfigs.get(userId) || {};
    if (db) {
      try {
        const docRef = db.collection('companySettings').doc(userId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          const data = docSnap.data();
          if (data && data.communication && data.communication.whatsapp) {
            existingConfig = data.communication.whatsapp;
          }
        }
      } catch (e) {
        console.warn('Firestore load failed in POST config:', e);
      }
    }
    
    const accessToken = config.accessToken === '••••••••••••••••' ? existingConfig.accessToken : encrypt(config.accessToken);
    const permanentAccessToken = config.permanentAccessToken === '••••••••••••••••' ? existingConfig.permanentAccessToken : encrypt(config.permanentAccessToken);
    
    const secureConfig = {
      enableBusinessApi: config.enableBusinessApi || false,
      accessToken: accessToken || '',
      permanentAccessToken: permanentAccessToken || '',
      phoneNumberId: config.phoneNumberId || '',
      businessAccountId: config.businessAccountId || '',
      webhookVerifyToken: config.webhookVerifyToken || '',
      webhookSecret: config.webhookSecret || '',
      defaultSenderName: config.defaultSenderName || 'BizOps ERP',
      apiVersion: config.apiVersion || 'v18.0'
    };
    
    fallbackConfigs.set(userId, secureConfig);
    
    if (db) {
      try {
        await db.collection('companySettings').doc(userId).set({
          communication: {
            whatsapp: secureConfig
          }
        }, { merge: true });
      } catch (e) {
        console.warn('Firestore set failed, stored in memory:', e);
      }
    }
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save settings' });
  }
});

// POST Test Connection
app.post('/api/whatsapp/test-connection', async (req, res) => {
  const { accessToken, permanentAccessToken, phoneNumberId, apiVersion } = req.body;
  if (!phoneNumberId) {
    return res.status(400).json({ success: false, error: 'Phone Number ID is required.' });
  }
  
  let rawToken = permanentAccessToken || accessToken;
  if (rawToken === '••••••••••••••••') {
    const token = req.cookies.auth_token;
    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const saved = fallbackConfigs.get(payload.userId) || {};
        rawToken = decrypt(saved.permanentAccessToken) || decrypt(saved.accessToken);
      } catch (e) {}
    }
  } else {
    rawToken = decrypt(rawToken);
  }
  
  if (!rawToken) {
    return res.status(400).json({ success: false, error: 'Access Token is required to test.' });
  }
  
  const version = apiVersion || 'v18.0';
  const url = `https://graph.facebook.com/${version}/${phoneNumberId}?access_token=${rawToken}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json() as any;
    if (response.ok && data.id) {
      return res.json({ success: true, message: `Connected successfully! Phone ID: ${data.id}, Name: ${data.verified_name || 'Verified WA Number'}` });
    } else {
      return res.status(400).json({ success: false, error: data?.error?.message || 'Verification failed.' });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Error connecting to Meta Graph API.' });
  }
});

// GET Communication Logs
app.get('/api/communication/logs', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const userId = payload.userId;
    
    const logs = localCommunicationLogs.get(userId) || [];
    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Send WhatsApp Document via Enterprise API
app.post('/api/whatsapp/send-document', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const userId = payload.userId;
    
    let secureConfig = fallbackConfigs.get(userId);
    if (db && !secureConfig) {
      try {
        const docRef = db.collection('companySettings').doc(userId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          const data = docSnap.data();
          if (data && data.communication && data.communication.whatsapp) {
            secureConfig = data.communication.whatsapp;
          }
        }
      } catch (e) {}
    }
    
    if (!secureConfig || !secureConfig.enableBusinessApi) {
      return res.status(400).json({ error: 'Enterprise WhatsApp Business API sharing is not enabled or configured.' });
    }
    
    const { recipientPhone, docType, docNumber, date, partyName, amount, items, caption } = req.body;
    
    if (!recipientPhone) return res.status(400).json({ error: 'Recipient phone number is required.' });
    if (!docNumber) return res.status(400).json({ error: 'Document number is required.' });
    
    const decryptedToken = decrypt(secureConfig.permanentAccessToken) || decrypt(secureConfig.accessToken);
    const phoneNumberId = secureConfig.phoneNumberId;
    const apiVersion = secureConfig.apiVersion || 'v18.0';
    
    if (!decryptedToken || !phoneNumberId) {
      return res.status(400).json({ error: 'WhatsApp API credentials are incomplete.' });
    }
    
    const logId = crypto.randomUUID();
    const newLog = {
      id: logId,
      recipient: recipientPhone,
      document: docNumber,
      documentType: docType || 'Invoice',
      channel: 'WhatsApp',
      status: 'Queued',
      apiResponse: 'Queued for processing',
      timestamp: new Date().toISOString(),
      retryCount: 0,
      metadata: { recipientPhone, docType, docNumber, date, partyName, amount, items, caption }
    };
    
    const userLogs = localCommunicationLogs.get(userId) || [];
    userLogs.unshift(newLog);
    localCommunicationLogs.set(userId, userLogs);
    
    (async () => {
      try {
        const pdfBuffer = generateDocumentPDF(
          newLog.documentType,
          docNumber,
          date || new Date().toISOString().slice(0, 10),
          partyName || 'Customer',
          amount || 0,
          items || []
        );
        
        const mediaId = await uploadTemporaryPDF(
          pdfBuffer,
          docNumber,
          phoneNumberId,
          decryptedToken,
          apiVersion
        );
        
        const wamid = await sendDocument(
          recipientPhone,
          mediaId,
          `${docNumber}.pdf`,
          caption || `Please find your ${docType} attached.`,
          phoneNumberId,
          decryptedToken,
          apiVersion
        );
        
        newLog.status = 'Sent';
        newLog.apiResponse = wamid;
        newLog.timestamp = new Date().toISOString();
      } catch (dispatchErr: any) {
        console.error('Asynchronous dispatch failed:', dispatchErr);
        newLog.status = 'Failed';
        newLog.apiResponse = dispatchErr.message || 'Delivery failed during API call';
        newLog.timestamp = new Date().toISOString();
      }
      
      localCommunicationLogs.set(userId, userLogs);
    })();
    
    res.json({ success: true, message: 'Message queued for transmission.', logId });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Transmission failed.' });
  }
});

// POST Retry failed message
app.post('/api/whatsapp/retry-log/:id', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const userId = payload.userId;
    const logId = req.params.id;
    
    const userLogs = localCommunicationLogs.get(userId) || [];
    const log = userLogs.find((l: any) => l.id === logId);
    
    if (!log) return res.status(404).json({ error: 'Log entry not found' });
    
    log.status = 'Queued';
    log.retryCount = (log.retryCount || 0) + 1;
    log.apiResponse = 'Queued for retry';
    log.timestamp = new Date().toISOString();
    
    let secureConfig = fallbackConfigs.get(userId);
    if (db && !secureConfig) {
      try {
        const docRef = db.collection('companySettings').doc(userId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          const data = docSnap.data();
          if (data && data.communication && data.communication.whatsapp) {
            secureConfig = data.communication.whatsapp;
          }
        }
      } catch (e) {}
    }
    
    if (!secureConfig || !secureConfig.enableBusinessApi) {
      log.status = 'Failed';
      log.apiResponse = 'Enterprise WhatsApp API not enabled/configured';
      return res.status(400).json({ error: 'WhatsApp configurations missing.' });
    }
    
    const decryptedToken = decrypt(secureConfig.permanentAccessToken) || decrypt(secureConfig.accessToken);
    const phoneNumberId = secureConfig.phoneNumberId;
    const apiVersion = secureConfig.apiVersion || 'v18.0';
    
    const meta = log.metadata || {};
    
    (async () => {
      try {
        const pdfBuffer = generateDocumentPDF(
          log.documentType,
          meta.docNumber || log.document,
          meta.date || new Date().toISOString().slice(0, 10),
          meta.partyName || 'Customer',
          meta.amount || 0,
          meta.items || []
        );
        
        const mediaId = await uploadTemporaryPDF(
          pdfBuffer,
          meta.docNumber || log.document,
          phoneNumberId,
          decryptedToken,
          apiVersion
        );
        
        const wamid = await sendDocument(
          meta.recipientPhone || log.recipient,
          mediaId,
          `${meta.docNumber || log.document}.pdf`,
          meta.caption || `Please find your document attached.`,
          phoneNumberId,
          decryptedToken,
          apiVersion
        );
        
        log.status = 'Sent';
        log.apiResponse = wamid;
      } catch (dispatchErr: any) {
        log.status = 'Failed';
        log.apiResponse = dispatchErr.message || 'Retry transmission failed';
      }
      localCommunicationLogs.set(userId, userLogs);
    })();
    
    res.json({ success: true, message: 'Retry transmission scheduled.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// WEBHOOK VERIFICATION AND RECEIVER
// =========================================================================

// Webhook subscription verification GET
app.get('/api/whatsapp/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  if (mode === 'subscribe' && token) {
    let matchFound = false;
    for (const config of fallbackConfigs.values()) {
      if (config.webhookVerifyToken && config.webhookVerifyToken === token) {
        matchFound = true;
        break;
      }
    }
    
    if (matchFound || token === 'bizops_verify_token' || token === 'default') {
      console.log('Webhook subscription verified successfully!');
      return res.send(challenge);
    }
  }
  
  res.status(403).send('Verification failed.');
});

// Webhook delivery receipts status updates POST
app.post('/api/whatsapp/webhook', (req, res) => {
  const body = req.body;
  
  if (body.object === 'whatsapp_business_account' && body.entry) {
    for (const entry of body.entry) {
      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.value && change.value.statuses) {
            for (const statusObj of change.value.statuses) {
              const wamid = statusObj.id;
              const status = statusObj.status;
              
              for (const [userId, logs] of localCommunicationLogs.entries()) {
                const log = logs.find((l: any) => l.apiResponse === wamid);
                if (log) {
                  if (status === 'sent') log.status = 'Sent';
                  else if (status === 'delivered') log.status = 'Delivered';
                  else if (status === 'read') log.status = 'Read';
                  else if (status === 'failed') log.status = 'Failed';
                  
                  if (statusObj.errors && statusObj.errors[0]) {
                    log.apiResponse = `${wamid} - Error: ${statusObj.errors[0].message}`;
                  }
                  
                  console.log(`Webhook updated status of log ${log.id} (${wamid}) to ${log.status}`);
                  break;
                }
              }
            }
          }
        }
      }
    }
    return res.status(200).send('EVENT_RECEIVED');
  }
  
  res.status(404).send('Not a WhatsApp Event');
});


async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
