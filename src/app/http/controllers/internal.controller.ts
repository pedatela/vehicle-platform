import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { createVehiclesService } from '../../factories/vehicles.factory';
import { vehicleSaleSyncSchema } from '../validation/vehicle.schema';

const vehiclesService = createVehiclesService();

export const syncVehicleSaleStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const payload = vehicleSaleSyncSchema.parse(req.body ?? {});
    const buyerId = payload.isSold ? payload.buyerId ?? null : null;
    const buyerEmail = payload.isSold ? payload.buyerEmail ?? null : null;
    const buyerName = payload.isSold ? payload.buyerName ?? null : null;

    const updated = await vehiclesService.update(id, {
      isSold: payload.isSold,
      buyerId,
      buyerEmail,
      buyerName,
    });

    if (!updated) {
      return res.status(404).json({ message: 'Veículo não encontrado' });
    }

    return res.json({
      message: 'Status de venda sincronizado',
      vehicle: updated.toJSON(),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Payload inválido', details: error.flatten() });
    }

    throw error;
  }
};
