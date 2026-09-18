import { Request, Response, NextFunction } from 'express';
import { AddressService } from './address.service';
import { ApiResponse } from '../../utils/apiResponse';
import { CreateAddressInput, UpdateAddressInput } from './address.validation';

export class AddressController {
  /**
   * POST /api/addresses
   * Add a new delivery address
   */
  static async createAddress(
    req: Request<unknown, unknown, CreateAddressInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const address = await AddressService.createAddress(
        req.user!._id.toString(),
        req.body
      );
      ApiResponse.created(res, address, 'Delivery address added successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/addresses
   * Get all active addresses for logged-in user
   */
  static async getUserAddresses(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const addresses = await AddressService.getUserAddresses(
        req.user!._id.toString()
      );
      ApiResponse.success(res, addresses, 'Addresses fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/addresses/:id
   * Get a specific address by ID
   */
  static async getAddressById(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const address = await AddressService.getAddressById(
        req.user!._id.toString(),
        req.params.id
      );
      ApiResponse.success(res, address, 'Address fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/addresses/:id
   * Update address details
   */
  static async updateAddress(
    req: Request<{ id: string }, unknown, UpdateAddressInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const updatedAddress = await AddressService.updateAddress(
        req.user!._id.toString(),
        req.params.id,
        req.body
      );
      ApiResponse.success(res, updatedAddress, 'Address updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/addresses/:id/default
   * Mark address as the primary/default delivery address
   */
  static async setDefaultAddress(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const address = await AddressService.setDefaultAddress(
        req.user!._id.toString(),
        req.params.id
      );
      ApiResponse.success(
        res,
        address,
        'Default delivery address updated successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/addresses/:id
   * Soft-delete an address
   */
  static async deleteAddress(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await AddressService.deleteAddress(
        req.user!._id.toString(),
        req.params.id
      );
      ApiResponse.success(res, null, 'Address deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
