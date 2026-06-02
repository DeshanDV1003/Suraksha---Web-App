import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

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

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      region: user.region,
      twoFactorEnabled: user.twoFactorEnabled
    },
  };
};

export const updatePassword = async (userId: string, currentPassword: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

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
