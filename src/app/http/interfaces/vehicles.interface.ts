import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import type { ZodError } from 'zod';
import { VehicleAttributes } from '../../../domain/vehicles/entities/vehicle';
import { VehicleStatusFilter } from '../../services/vehicles.service';

export interface VehicleParams extends ParamsDictionary {
  id: string;
}

export interface VehicleQuery extends ParsedQs {
  status?: VehicleStatusFilter;
}

export type VehicleBuyerDTO = {
  id: string;
  email?: string | null;
  name?: string | null;
};

export type VehicleDTO = VehicleAttributes & {
  id: string;
  buyer: VehicleBuyerDTO | null;
};

export interface VehiclesListResponse {
  total: number;
  data: VehicleDTO[];
}

export interface ValidationErrorPayload {
  message: string;
  errors: ReturnType<ZodError['flatten']>;
}
