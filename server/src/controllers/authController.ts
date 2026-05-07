import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';

const generateToken = (id: string, role: string): string => {
  return jwt.sign({ id, role }, env.JWT_SECRET, { expiresIn: '30d' });
};

// Typed interface for the user document with methods
interface UserDocument {
  _id: { toString(): string };
  name: string;
  email: string;
  role: string;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ message: 'User already exists' });
      return;
    }

    const user = await User.create({ name, email, password, role });

    res.status(201).json({
      _id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(String(user._id), user.role),
    });
  } catch (error) {
    res.status(400).json({ message: 'Registration failed', error: (error as Error).message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }) as UserDocument | null;
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    res.json({
      _id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(String(user._id), user.role),
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: (error as Error).message });
  }
};