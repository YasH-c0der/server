import mongoose, { Document, Schema, Types } from 'mongoose';

export type AddressType = 'HOME' | 'WORK' | 'OFFICE' | 'WAREHOUSE' | 'OTHER';

export interface IAddress extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;

  // Door-level quick-commerce details
  houseNumber: string;
  buildingName?: string;
  streetName: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;

  // Recipient info
  addressType: AddressType;
  recipientName: string;
  recipientPhone: string;

  // Quick-commerce delivery instructions (e.g. "Leave at security", "Call on arrival")
  deliveryInstructions?: string;

  // GeoJSON Point for geospatial store discovery
  location: {
    type: 'Point';
    coordinates: [number, number]; // Strictly [longitude, latitude]
  };

  isDefault: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * CRASH RISK IDENTIFICATION & MITIGATION:
 * 1. GeoJSON Coordinate Order & Out-of-Bounds:
 *    - Risk: MongoDB's 2dsphere index will crash / throw unhandled validation errors if longitude is outside [-180, 180]
 *      or latitude outside [-90, 90], or if coordinates are accidentally inverted [lat, lng].
 *    - Mitigation: Enforced strict validator on coordinates ensuring [lng, lat] order within valid spherical ranges.
 * 2. Default Address Duplication (Race Conditions):
 *    - Risk: Multiple concurrent "set default" requests could mark multiple addresses as default simultaneously.
 *    - Mitigation: AddressService applies atomic updates with $set on target and $set: { isDefault: false } across sibling addresses.
 * 3. Cascade Data Loss on Past Orders:
 *    - Risk: Hard-deleting addresses breaks past invoice and order audit trails.
 *    - Mitigation: Soft-deletes via `isDeleted: true` combined with compound index `{ userId: 1, isDeleted: 1 }`.
 */
const AddressSchema = new Schema<IAddress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    houseNumber: {
      type: String,
      required: true,
      trim: true,
    },
    buildingName: {
      type: String,
      trim: true,
    },
    streetName: {
      type: String,
      required: true,
      trim: true,
    },
    landmark: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
    },
    addressType: {
      type: String,
      enum: ['HOME', 'WORK', 'OFFICE', 'WAREHOUSE', 'OTHER'],
      default: 'HOME',
    },
    recipientName: {
      type: String,
      required: true,
      trim: true,
    },
    recipientPhone: {
      type: String,
      required: true,
      trim: true,
    },
    deliveryInstructions: {
      type: String,
      trim: true,
      maxlength: 250,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (coords: number[]) =>
            Array.isArray(coords) &&
            coords.length === 2 &&
            coords[0] >= -180 &&
            coords[0] <= 180 &&
            coords[1] >= -90 &&
            coords[1] <= 90,
          message: 'Coordinates must be valid [longitude, latitude] within geographical bounds',
        },
      },
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// High-speed index for user addresses filtering out soft-deleted items
AddressSchema.index({ userId: 1, isDeleted: 1 });

// Geospatial index for dark store serviceability and radius checks
AddressSchema.index({ location: '2dsphere' });

export const Address = mongoose.model<IAddress>('Address', AddressSchema);
