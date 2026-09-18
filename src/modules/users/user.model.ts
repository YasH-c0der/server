import mongoose, { Document, Schema, Types } from 'mongoose';
import { USER_ROLES, UserRole } from '../../constants/roles';
import { ACCOUNT_TYPES, AccountType } from '../../constants/accountTypes';

export interface IUser extends Document {
  _id: Types.ObjectId;
  phone: string;
  name?: string;
  email?: string;
  role: UserRole;
  accountType: AccountType;
  companyName?: string;
  gstNumber?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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
    accountType: {
      type: String,
      enum: Object.values(ACCOUNT_TYPES),
      default: ACCOUNT_TYPES.INDIVIDUAL,
      index: true,
    },
    companyName: {
      type: String,
      trim: true,
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
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
