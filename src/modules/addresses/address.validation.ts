import { z } from 'zod';

const coordinatesSchema = z
  .tuple([
    z
      .number()
      .min(-180, 'Longitude must be between -180 and 180')
      .max(180, 'Longitude must be between -180 and 180'),
    z
      .number()
      .min(-90, 'Latitude must be between -90 and 90')
      .max(90, 'Latitude must be between -90 and 90'),
  ])
  .refine((coords) => coords.length === 2, {
    message: 'Coordinates must be exactly [longitude, latitude]',
  });

export const createAddressSchema = z.object({
  houseNumber: z
    .string()
    .trim()
    .min(1, 'House / Flat / Floor number is required')
    .max(100, 'House number too long'),
  buildingName: z.string().trim().max(100).optional(),
  streetName: z
    .string()
    .trim()
    .min(1, 'Street or Area name is required')
    .max(150, 'Street name too long'),
  landmark: z.string().trim().max(150).optional(),
  city: z
    .string()
    .trim()
    .min(1, 'City is required')
    .max(100),
  state: z
    .string()
    .trim()
    .min(1, 'State is required')
    .max(100),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/, 'Invalid Indian Pincode (must be 6 digits)'),
  addressType: z
    .enum(['HOME', 'WORK', 'OFFICE', 'WAREHOUSE', 'OTHER'])
    .default('HOME'),
  recipientName: z
    .string()
    .trim()
    .min(1, 'Recipient name is required')
    .max(100),
  recipientPhone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Recipient phone must be a valid 10-digit Indian mobile number'),
  deliveryInstructions: z
    .string()
    .trim()
    .max(250, 'Delivery instructions cannot exceed 250 characters')
    .optional(),
  location: z.object({
    type: z.literal('Point').default('Point'),
    coordinates: coordinatesSchema,
  }),
  isDefault: z.boolean().optional().default(false),
});

export const updateAddressSchema = z
  .object({
    houseNumber: z.string().trim().min(1).max(100).optional(),
    buildingName: z.string().trim().max(100).optional(),
    streetName: z.string().trim().min(1).max(150).optional(),
    landmark: z.string().trim().max(150).optional(),
    city: z.string().trim().min(1).max(100).optional(),
    state: z.string().trim().min(1).max(100).optional(),
    pincode: z
      .string()
      .trim()
      .regex(/^[1-9][0-9]{5}$/, 'Invalid Indian Pincode (must be 6 digits)')
      .optional(),
    addressType: z.enum(['HOME', 'WORK', 'OFFICE', 'WAREHOUSE', 'OTHER']).optional(),
    recipientName: z.string().trim().min(1).max(100).optional(),
    recipientPhone: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, 'Recipient phone must be a valid 10-digit Indian mobile number')
      .optional(),
    deliveryInstructions: z.string().trim().max(250).optional(),
    location: z
      .object({
        type: z.literal('Point').default('Point'),
        coordinates: coordinatesSchema,
      })
      .optional(),
    isDefault: z.boolean().optional(),
  })
  .strict();

export const addressIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Address ID format (must be 24-character ObjectId)'),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
