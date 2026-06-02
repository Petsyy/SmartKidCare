import { Model, UpdateQuery, QueryOptions } from "mongoose";

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

  async updateById(
    id: string,
    data: UpdateQuery<T>,
    options: QueryOptions = { new: true },
  ): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, options).exec();
  }

  async updateOne(
    query: Record<string, unknown>,
    data: UpdateQuery<T>,
  ): Promise<void> {
    await this.model.updateOne(query, data).exec();
  }

  async updateMany(
    query: Record<string, unknown>,
    data: UpdateQuery<T>,
  ): Promise<void> {
    await this.model.updateMany(query, data).exec();
  }

  async countDocuments(query: Record<string, unknown> = {}): Promise<number> {
    return this.model.countDocuments(query).exec();
  }

  async distinct(
    field: string,
    query: Record<string, unknown> = {},
  ): Promise<unknown[]> {
    return this.model.distinct(field, query).exec();
  }

  async deleteOne(query: Record<string, unknown>): Promise<void> {
    await this.model.deleteOne(query).exec();
  }

  async deleteMany(query: Record<string, unknown>): Promise<void> {
    await this.model.deleteMany(query).exec();
  }
}
