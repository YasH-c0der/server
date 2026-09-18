import { Router } from 'express';
import { AddressController } from './address.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import {
  createAddressSchema,
  updateAddressSchema,
  addressIdParamSchema,
} from './address.validation';

const router = Router();

// All address operations require an active authenticated user session
router.use(authenticate);

router.post(
  '/',
  validateRequest({ body: createAddressSchema }),
  AddressController.createAddress
);

router.get('/', AddressController.getUserAddresses);

router.get(
  '/:id',
  validateRequest({ params: addressIdParamSchema }),
  AddressController.getAddressById
);

router.patch(
  '/:id',
  validateRequest({ params: addressIdParamSchema, body: updateAddressSchema }),
  AddressController.updateAddress
);

router.patch(
  '/:id/default',
  validateRequest({ params: addressIdParamSchema }),
  AddressController.setDefaultAddress
);

router.delete(
  '/:id',
  validateRequest({ params: addressIdParamSchema }),
  AddressController.deleteAddress
);

export default router;
