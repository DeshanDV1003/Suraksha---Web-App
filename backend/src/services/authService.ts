import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const registerUser = async (data: any) => {
  const { email, password, name, role, phone, region } = data;
  const cleanEmail = email.toLowerCase().trim();

  const existingUser = await prisma.user.findFirst({ where: { email: cleanEmail } });
  if (existingUser) throw new Error('User already exists');

  const hashedPassword = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: {
      email: cleanEmail,
      password: hashedPassword,
      name,
      role: role || 'CITIZEN',
      phone,
      region,
    },
  });
};

export const loginUser = async (data: any) => {
  const { email, password } = data;
  const user = await prisma.user.findFirst({ where: { email: email.toLowerCase().trim() } });
  
  if (!user) throw new Error('Invalid credentials');

  if (!user.password) throw new Error('This account uses Google Sign-In. Please sign in with Google.');
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Invalid credentials');

  if (user.twoFactorEnabled) {
    if (data.token2fa) {
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret!,
        encoding: 'base32',
        token: data.token2fa
      });
      if (!verified) throw new Error('Invalid 2FA token');
    } else {
      return {
        requires2FA: true,
        userId: user.id
      };
    }
  }

  // Create session log
  await prisma.userSessionLog.create({
    data: {
      userId: user.id,
      ipAddress: data.ipAddress,
      device: data.device,
      location: data.location
    }
  });

  const jwtPayload: Record<string, any> = { userId: user.id, role: user.role };
  if (user.role === 'HOSPITAL_STAFF' && user.hospitalId) {
    jwtPayload.hospitalId = user.hospitalId;
  }

  const token = jwt.sign(
    jwtPayload,
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '6h' }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      region: user.region,
      phone: user.phone,
      profilePicture: user.profilePicture,
      twoFactorEnabled: user.twoFactorEnabled,
      hospitalId: user.hospitalId ?? null,
    },
  };
};

export const updatePassword = async (userId: string, currentPassword: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  if (!user.password) throw new Error('This account uses Google Sign-In. Password cannot be changed here.');
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new Error('Current password is incorrect');

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  return prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });
};

export const setup2FA = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const secret = speakeasy.generateSecret({ length: 20, name: `Suraksha (${user.email})` });
  
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret.base32 }
  });

  const dataURL = await qrcode.toDataURL(secret.otpauth_url!);
  return {
    secret: secret.base32,
    qrCode: dataURL
  };
};

export const verify2FA = async (userId: string, token: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.twoFactorSecret) throw new Error('User or 2FA secret not found');

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token
  });

  if (verified) {
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true }
    });
    return { success: true };
  }

  throw new Error('Invalid 2FA token');
};

const GOOGLE_ALLOWED_ROLES = ['CITIZEN', 'VOLUNTEER'];

export const googleLoginUser = async (idToken: string, ipAddress?: string, device?: string) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error('Google Sign-In is not configured on this server.');
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.email) throw new Error('Invalid Google token');

  const email = payload.email.toLowerCase().trim();
  const googleId = payload.sub;
  const name = payload.name || email.split('@')[0];
  const profilePicture = payload.picture || null;

  // Find by googleId first, then by email
  let user = await prisma.user.findFirst({ where: { googleId } })
    ?? await prisma.user.findFirst({ where: { email } });

  if (user) {
    if (!GOOGLE_ALLOWED_ROLES.includes(user.role)) {
      throw new Error('Google Sign-In is only available for citizens and volunteers. Please use your email and password to log in.');
    }
    // Always refresh googleId and profile picture from the current Google token
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId,
        profilePicture: profilePicture || user.profilePicture,
      },
    });
  } else {
    // New user — create as CITIZEN
    user = await prisma.user.create({
      data: { email, name, googleId, profilePicture, role: 'CITIZEN', password: null },
    });
  }

  await prisma.userSessionLog.create({
    data: { userId: user.id, ipAddress, device, location: 'Google OAuth' },
  });

  const googleJwtPayload: Record<string, any> = { userId: user.id, role: user.role };
  if (user.role === 'HOSPITAL_STAFF' && user.hospitalId) {
    googleJwtPayload.hospitalId = user.hospitalId;
  }

  const token = jwt.sign(
    googleJwtPayload,
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '6h' }
  );

  return {
    token,
    user: {
      id: user.id, email: user.email, name: user.name, role: user.role,
      region: user.region, phone: user.phone, profilePicture: user.profilePicture,
      twoFactorEnabled: user.twoFactorEnabled,
      hospitalId: user.hospitalId ?? null,
    },
  };
};
