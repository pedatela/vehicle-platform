import { Router } from 'express';
import { syncVehicleSaleStatus } from '../controllers/internal.controller';
import { requireInternalToken } from '../middlewares/internal-auth';

const internalRouter = Router();

internalRouter.use(requireInternalToken);
internalRouter.put('/vehicles/:id/sale-status', syncVehicleSaleStatus);

export default internalRouter;
