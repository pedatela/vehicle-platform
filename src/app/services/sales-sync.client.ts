import { URL } from "node:url";
import { RequestInit, fetch as undiciFetch } from "undici";
import { Vehicle } from "../../domain/vehicles/entities/vehicle";
import { logger } from "../logger";
import {
  SalesSyncClientOptions,
  SalesSyncPort,
} from "./interfaces/sales-sync.interface";

type FetchFn = typeof undiciFetch;

type HttpSalesSyncClientOptions = SalesSyncClientOptions & {
  fetchFn?: FetchFn | undefined;
};

const serializeVehicle = (vehicle: Vehicle) => {
  const payload = vehicle.toJSON() as Record<string, unknown>;

  return {
    vehicleId: payload.id as string,
    brand: payload.brand as string,
    model: payload.model as string,
    year: payload.year as number,
    color: payload.color as string,
    price: payload.price as number,
    isSold: payload.isSold as boolean,
    buyerId: (payload.buyerId as string | null | undefined) ?? null,
  };
};

export class HttpSalesSyncClient implements SalesSyncPort {
  private readonly fetchFn: FetchFn;

  constructor(private readonly options: HttpSalesSyncClientOptions) {
    this.fetchFn = options.fetchFn ?? undiciFetch;

    if (!options.baseUrl) {
      logger.warn(
        "[sales-sync] base URL não configurada. Notificações desabilitadas.",
      );
    }
  }

  async notifyVehicleCreated(vehicle: Vehicle): Promise<void> {
    await this.send("POST", "/internal/vehicles", serializeVehicle(vehicle));
  }

  async notifyVehicleUpdated(vehicle: Vehicle): Promise<void> {
    await this.send(
      "PUT",
      `/internal/vehicles/${vehicle.id}`,
      serializeVehicle(vehicle),
    );
  }

  async notifyVehicleDeleted(vehicleId: string): Promise<void> {
    await this.send("DELETE", `/internal/vehicles/${vehicleId}`);
  }

  private async send(
    method: "POST" | "PUT" | "DELETE",
    path: string,
    body?: Record<string, unknown>,
  ): Promise<void> {
    const url = this.buildUrl(path);

    if (!url) {
      return;
    }

    try {
      const headers: Record<string, string> = {
        "content-type": "application/json",
      };

      if (this.options.token) {
        headers["x-internal-token"] = this.options.token;
      }

      const init: RequestInit = {
        method,
        headers,
      };

      if (body) {
        init.body = JSON.stringify(body);
      }

      const response = await this.fetchFn(url, init);

      if (!response.ok) {
        const message = await response.text();
        throw new Error(`status=${response.status} body=${message}`);
      }

      logger.debug("[sales-sync] evento enviado", {
        method,
        path: url.pathname,
      });
    } catch (error) {
      logger.warn("[sales-sync] falha ao notificar Sales", {
        path,
        error: (error as Error).message,
      });
    }
  }
  private buildUrl(path: string): URL | null {
    if (!this.options.baseUrl) {
      return null;
    }

    const trimmedPath = path.replace(/^\//, "");
    return new URL(trimmedPath, this.ensureTrailingSlash(this.options.baseUrl));
  }

  private ensureTrailingSlash(url: string): string {
    return url.endsWith("/") ? url : `${url}/`;
  }
}
