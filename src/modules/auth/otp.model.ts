import mongoose, { Document, Schema } from 'mongoose';

export interface IOtp extends Document {
  phone: string;
  otp: string;
  createdAt: Date;
}

/**
 * CRASH RISK & SECURITY MITIGATION:
 * 1. Disk & Memory Leak (Abandoned OTPs):
 *    - Risk: Thousands of unverified OTP requests accumulate over time, bloating the database collection.
 *    - Mitigation: MongoDB TTL index ({ expires: 300 }) automatically evicts OTP documents 5 minutes after creation.
 * 2. Replay Attacks:
 *    - Risk: An attacker intercepting an OTP reuses it within the validity window.
 *    - Mitigation: The OTP document is deleted immediately upon successful verification via atomic findOneAndDelete.
 */
const OtpSchema = new Schema<IOtp>(
  {
    phone: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300, // 5 minutes TTL
    },
  },
  {
    timestamps: false,
  }
);

export const Otp = mongoose.model<IOtp>('Otp', OtpSchema);
