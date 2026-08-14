import { z } from 'zod';

export const profileUpdateSchema = z.object({
  username: z.string().max(50).optional().nullable(),
  fullName: z.string().max(100, 'Name is too long').optional().nullable(),
  phone: z.string().max(30, 'Phone number is too long').optional().nullable(),
  avatarUrl: z
    .string()
    .refine(
      (val) => !val || val.startsWith('http://') || val.startsWith('https://'),
      {
        message: 'Avatar URL must be a valid HTTP or HTTPS storage URL',
      }
    )
    .optional()
    .nullable()
    .or(z.literal('')),
  newPassword: z.string().min(6, 'Password must be at least 6 characters').optional().nullable().or(z.literal('')),
});
