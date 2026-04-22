import { Model } from "mongoose";

export abstract class BaseRepository<T> {
  constructor(protected model: Model<T>) {}

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }

  async findOne(query: Record<string, unknown>): Promise<T | null> {
    return this.model.findOne(query).exec();
  }

  async find(query: Record<string, unknown>): Promise<T[]> {
    return this.model.find(query).exec();
  }

  async deleteById(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
