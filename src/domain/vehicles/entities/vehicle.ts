import { randomUUID } from 'crypto';

export type VehicleAttributes = {
  brand: string;
  model: string;
  year: number;
  color: string;
  price: number;
  isSold: boolean;
  buyerId?: string | null;
  buyerEmail?: string | null;
  buyerName?: string | null;
};

export class Vehicle {
  private constructor(
    private readonly _id: string,
    private props: VehicleAttributes
  ) {}

  static create(attrs: VehicleAttributes, id: string = randomUUID()): Vehicle {
    const props: VehicleAttributes = {
      ...attrs,
      isSold: attrs.isSold ?? false,
      buyerId: attrs.buyerId ?? null,
      buyerEmail: attrs.buyerEmail ?? null,
      buyerName: attrs.buyerName ?? null
    };
    return new Vehicle(id, props);
  }

  get id(): string {
    return this._id;
  }

  get brand(): string {
    return this.props.brand;
  }

  get model(): string {
    return this.props.model;
  }

  get year(): number {
    return this.props.year;
  }

  get color(): string {
    return this.props.color;
  }

  get price(): number {
    return this.props.price;
  }

  get isSold(): boolean {
    return this.props.isSold;
  }

  get buyerId(): string | null | undefined {
    return this.props.buyerId;
  }

  get buyerEmail(): string | null | undefined {
    return this.props.buyerEmail;
  }

  get buyerName(): string | null | undefined {
    return this.props.buyerName;
  }

  update(attrs: Partial<VehicleAttributes>): void {
    const sanitized = Object.fromEntries(
      Object.entries(attrs).filter(([, value]) => value !== undefined)
    ) as Partial<VehicleAttributes>;

    this.props = { ...this.props, ...sanitized };
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      brand: this.brand,
      model: this.model,
      year: this.year,
      color: this.color,
      price: this.price,
      isSold: this.isSold,
      buyerId: this.buyerId ?? null,
      buyerEmail: this.buyerEmail ?? null,
      buyerName: this.buyerName ?? null
    };
  }
}
