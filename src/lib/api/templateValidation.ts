import { z } from 'zod';

export const templateCreateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(100, 'Template name is too long'),
  description: z.string().optional().nullable(),
  isDefault: z.boolean().optional().default(false),
  config: z.record(z.any()).optional().default({}),
});

export const templateUpdateSchema = templateCreateSchema.partial();
