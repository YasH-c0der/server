import { Types } from 'mongoose';
import { Address, IAddress } from './address.model';
import { CreateAddressInput, UpdateAddressInput } from './address.validation';
import { AppError } from '../../utils/appError';

export class AddressService {
  /**
   * Create a new delivery address
   */
  static async createAddress(userId: string, input: CreateAddressInput): Promise<IAddress> {
    const existingCount = await Address.countDocuments({
      userId: new Types.ObjectId(userId),
      isDeleted: false,
    });

    // If this is the user's first address, force it to be default
    const shouldBeDefault = existingCount === 0 || input.isDefault === true;

    if (shouldBeDefault && existingCount > 0) {
      // Unset previous defaults atomically to prevent multiple default addresses
      await Address.updateMany(
        { userId: new Types.ObjectId(userId), isDeleted: false },
        { isDefault: false }
      );
    }

    const address = await Address.create({
      ...input,
      userId: new Types.ObjectId(userId),
      isDefault: shouldBeDefault,
      isDeleted: false,
    });

    return address;
  }

  /**
   * List all active addresses of the logged-in user
   * Returns default address first, followed by newest additions
   */
  static async getUserAddresses(userId: string): Promise<IAddress[]> {
    return Address.find({
      userId: new Types.ObjectId(userId),
      isDeleted: false,
    }).sort({ isDefault: -1, createdAt: -1 });
  }

  /**
   * Get a single address by ID (with strict user ownership verification)
   */
  static async getAddressById(userId: string, addressId: string): Promise<IAddress> {
    const address = await Address.findOne({
      _id: new Types.ObjectId(addressId),
      userId: new Types.ObjectId(userId),
      isDeleted: false,
    });

    if (!address) {
      throw new AppError('Delivery address not found or access denied', 404);
    }

    return address;
  }

  /**
   * Update address details
   */
  static async updateAddress(
    userId: string,
    addressId: string,
    input: UpdateAddressInput
  ): Promise<IAddress> {
    const address = await this.getAddressById(userId, addressId);

    if (input.isDefault === true) {
      // Unset other defaults before setting this one
      await Address.updateMany(
        {
          userId: new Types.ObjectId(userId),
          _id: { $ne: new Types.ObjectId(addressId) },
          isDeleted: false,
        },
        { isDefault: false }
      );
    }

    Object.assign(address, input);
    await address.save();

    return address;
  }

  /**
   * Set an address as the default delivery address
   */
  static async setDefaultAddress(userId: string, addressId: string): Promise<IAddress> {
    const address = await this.getAddressById(userId, addressId);

    // Atomically reset all other addresses
    await Address.updateMany(
      {
        userId: new Types.ObjectId(userId),
        _id: { $ne: new Types.ObjectId(addressId) },
        isDeleted: false,
      },
      { isDefault: false }
    );

    address.isDefault = true;
    await address.save();

    return address;
  }

  /**
   * Soft-delete an address
   * If the deleted address was the default, promote the next active address to default
   */
  static async deleteAddress(userId: string, addressId: string): Promise<void> {
    const address = await this.getAddressById(userId, addressId);

    const wasDefault = address.isDefault;

    address.isDeleted = true;
    address.isDefault = false;
    await address.save();

    // If the deleted address was default, auto-promote the most recent active address
    if (wasDefault) {
      const nextAddress = await Address.findOne({
        userId: new Types.ObjectId(userId),
        isDeleted: false,
      }).sort({ updatedAt: -1 });

      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }
  }
}
