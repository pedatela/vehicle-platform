import { Pool } from 'pg';
import { Vehicle } from '../../../domain/vehicles/entities/vehicle';
import { VehiclesRepository } from '../../../domain/vehicles/repositories/vehicles-repository';
import { getPostgresPool } from '../../database/postgres';

type VehicleRow = {
  id: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  price: string | number;
  is_sold: boolean;
  buyer_id: string | null;
  buyer_email: string | null;
  buyer_name: string | null;
};

export class PostgresVehiclesRepository implements VehiclesRepository {
  private schemaReady: Promise<void> | null = null;

  constructor(private readonly pool: Pool = getPostgresPool()) {}

  async list(): Promise<Vehicle[]> {
    await this.ensureSchemaReady();

    const { rows } = await this.pool.query<VehicleRow>(
      `
        SELECT
          id,
          brand,
          model,
          year,
          color,
          price,
          is_sold,
          buyer_id,
          buyer_email,
          buyer_name
        FROM vehicles
        ORDER BY created_at ASC
      `
    );

    return rows.map((row) => this.mapRowToEntity(row));
  }

  async findById(id: string): Promise<Vehicle | null> {
    await this.ensureSchemaReady();

    const { rows } = await this.pool.query<VehicleRow>(
      `
        SELECT
          id,
          brand,
          model,
          year,
          color,
          price,
          is_sold,
          buyer_id,
          buyer_email,
          buyer_name
        FROM vehicles
        WHERE id = $1
        LIMIT 1
      `,
      [id]
    );

    const row = rows[0];
    return row ? this.mapRowToEntity(row) : null;
  }

  async create(vehicle: Vehicle): Promise<void> {
    await this.ensureSchemaReady();
    const payload = vehicle.toJSON();

    await this.pool.query(
      `
        INSERT INTO vehicles (
          id,
          brand,
          model,
          year,
          color,
          price,
          is_sold,
          buyer_id,
          buyer_email,
          buyer_name
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        vehicle.id,
        payload.brand,
        payload.model,
        payload.year,
        payload.color,
        payload.price,
        payload.isSold,
        payload.buyerId,
        payload.buyerEmail,
        payload.buyerName
      ]
    );
  }

  async update(vehicle: Vehicle): Promise<void> {
    await this.ensureSchemaReady();
    const payload = vehicle.toJSON();

    const result = await this.pool.query(
      `
        UPDATE vehicles
        SET
          brand = $2,
          model = $3,
          year = $4,
          color = $5,
          price = $6,
          is_sold = $7,
          buyer_id = $8,
          buyer_email = $9,
          buyer_name = $10,
          updated_at = NOW()
        WHERE id = $1
      `,
      [
        vehicle.id,
        payload.brand,
        payload.model,
        payload.year,
        payload.color,
        payload.price,
        payload.isSold,
        payload.buyerId,
        payload.buyerEmail,
        payload.buyerName
      ]
    );

    if (result.rowCount === 0) {
      throw new Error('Veículo não encontrado');
    }
  }

  async delete(id: string): Promise<Vehicle | null> {
    await this.ensureSchemaReady();

    const { rows } = await this.pool.query<VehicleRow>(
      `
        DELETE FROM vehicles
        WHERE id = $1
        RETURNING
          id,
          brand,
          model,
          year,
          color,
          price,
          is_sold,
          buyer_id,
          buyer_email,
          buyer_name
      `,
      [id]
    );

    const row = rows[0];
    return row ? this.mapRowToEntity(row) : null;
  }

  private async ensureSchemaReady(): Promise<void> {
    if (!this.schemaReady) {
      this.schemaReady = this.createSchema();
    }

    await this.schemaReady;
  }

  private async createSchema(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        year INTEGER NOT NULL,
        color TEXT NOT NULL,
        price NUMERIC(12, 2) NOT NULL,
        is_sold BOOLEAN NOT NULL DEFAULT FALSE,
        buyer_id TEXT NULL,
        buyer_email TEXT NULL,
        buyer_name TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  private mapRowToEntity(row: VehicleRow): Vehicle {
    return Vehicle.create(
      {
        brand: row.brand,
        model: row.model,
        year: row.year,
        color: row.color,
        price: Number(row.price),
        isSold: row.is_sold,
        buyerId: row.buyer_id,
        buyerEmail: row.buyer_email,
        buyerName: row.buyer_name
      },
      row.id
    );
  }
}
