import { z } from 'zod';

export const templateCreateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(100),
  description: z.string().optional().or(z.literal('')),
  isDefault: z.boolean().default(false),
  config: z.record(z.any()).default({}),
  isActive: z.boolean().default(true),
});

export const templateUpdateSchema = templateCreateSchema.partial();
