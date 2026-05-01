import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

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
