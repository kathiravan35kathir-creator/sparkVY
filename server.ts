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
import { getFirestore } from 'firebase-admin/firestore';
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
let db;
if (!getApps().length) {
  try {
    const app = initializeApp({
      credential: applicationDefault(),
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || fallbackConfig.projectId
    });
    db = getFirestore(app);
  } catch (error) {
    console.error('Firebase Admin init error', error);
  }
} else {
  db = getFirestore();
}

if (db && fallbackConfig.firestoreDatabaseId) {
    db.settings({ databaseId: fallbackConfig.firestoreDatabaseId });
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
        from: process.env.DEFAULT_FROM_EMAIL || 'no-reply@labbiz.in',
        to: normalizedEmail,
        subject: 'Your LabBiz Login Code',
        text: `Your 6-digit LabBiz login code is: ${otp}\n\nIt expires in 10 minutes.\n\nIf you did not request this, please ignore this message.`
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
    if (!user) {
      user = { 
        id: decodedToken.uid, 
        email: normalizedEmail, 
        full_name: decodedToken.name || '', 
        profile_photo: decodedToken.picture || '',
        onboardingCompleted: false,
        isAdmin: true
      };
      users.set(normalizedEmail, user);
    } else {
      user.full_name = user.full_name || decodedToken.name;
      user.profile_photo = user.profile_photo || decodedToken.picture;
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

    // Mark as completed
    user.onboardingCompleted = true;
    user.full_name = req.body.full_name || user.full_name;
    
    // Update Firestore
    console.log("[DEBUG] /api/auth/onboarding: Firestore setDoc started");
    await db.collection('users').doc(payload.userId).set({ onboardingCompleted: true }, { merge: true });
    console.log("[DEBUG] /api/auth/onboarding: Firestore setDoc finished");
    
    res.json({ success: true, user });
  } catch (err) {
    console.error("[DEBUG] /api/auth/onboarding error:", err);
    res.status(500).json({ error: 'Internal server error: ' + err });
  }
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

startServer();
