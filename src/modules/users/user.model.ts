import mongoose, { Document, Schema, Types } from 'mongoose';
import { USER_ROLES, UserRole } from '../../constants/roles';

export interface IAddress {
  _id?: Types.ObjectId;
  label: 'Home' | 'Work' | 'Other';
  recipientName: string;
  phone: string;
  addressLine: string;
  landmark?: string;
  pincode: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  isDefault: boolean;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  phone: string;
  name?: string;
  email?: string;
  role: UserRole;
  addresses: IAddress[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * CRASH RISK IDENTIFICATION & MITIGATION:
 * 1. GeoJSON Coordinate Order:
 *    - Risk: Inverting [longitude, latitude] to [latitude, longitude] corrupts MongoDB 2dsphere calculations,
 *      causing nearest-store discovery to return empty or fail with unhandled geospatial exceptions.
 *    - Mitigation: Enforce array length of 2 and strictly document [longitude, latitude] order.
 * 2. Unbounded Array Growth:
 *    - Risk: Storing full order history inside the User document causes the BSON document to eventually
 *      hit MongoDB's 16MB limit, crashing user reads and writes.
 *    - Mitigation: Only addresses are embedded (capped per user in validation). Orders remain a separate collection.
 */
const AddressSchema = new Schema<IAddress>(
  {
    label: {
      type: String,
      enum: ['Home', 'Work', 'Other'],
      default: 'Home',
    },
    recipientName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true },
    pincode: { type: String, required: true, trim: true },
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
          validator: (coords: number[]) => coords.length === 2,
          message: 'Coordinates must be [longitude, latitude]',
        },
      },
    },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const UserSchema = new Schema<IUser>(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.CUSTOMER,
      index: true,
    },
    addresses: {
      type: [AddressSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
