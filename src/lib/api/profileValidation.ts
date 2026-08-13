import { z } from 'zod';

export const profileUpdateSchema = z.object({
  username: z.string().min(1, 'Username is required').max(50, 'Username is too long').optional(),
  fullName: z.string().min(1, 'Full name is required').max(100, 'Name is too long').optional(),
  phone: z.string().max(20, 'Phone number is too long').optional().nullable(),
  avatarUrl: z.string().url('Invalid avatar URL').optional().nullable().or(z.literal('')),
  newPassword: z.string().min(6, 'Password must be at least 6 characters').optional().nullable().or(z.literal('')),
});
