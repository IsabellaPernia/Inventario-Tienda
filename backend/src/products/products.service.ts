import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../categories/category.entity.js';
import {
  CreateProductDto,
  QueryProductsDto,
  UpdateProductDto,
} from './dto/product.dto.js';
import { Product } from './product.entity.js';

export interface Page<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
  ) {}

  async findAll(query: QueryProductsDto): Promise<Page<Product>> {
    const { search, categoryId, isActive, page, limit } = query;

    const qb = this.products
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .orderBy('product.name', 'ASC')
      .addOrderBy('product.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.andWhere('(product.name LIKE :term OR product.sku LIKE :term)', {
        term: `%${escapeLike(search)}%`,
      });
    }
    if (categoryId !== undefined) {
      qb.andWhere('product.categoryId = :categoryId', { categoryId });
    }
    if (isActive !== undefined) {
      qb.andWhere('product.isActive = :isActive', { isActive });
    }

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.products.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!product) {
      throw new NotFoundException(`Producto ${id} no encontrado`);
    }
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    await this.assertCategoryExists(dto.categoryId);
    await this.assertSkuFree(dto.sku);
    const saved = await this.products.save(this.products.create(dto));
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    if (dto.sku !== undefined && dto.sku !== product.sku) {
      await this.assertSkuFree(dto.sku);
    }
    if (dto.categoryId !== undefined && dto.categoryId !== product.categoryId) {
      await this.assertCategoryExists(dto.categoryId);
    }
    // Se quita la relacion cargada para que TypeORM use categoryId.
    delete product.category;
    Object.assign(product, dto);
    await this.products.save(product);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.products.delete(id);
  }

  private async assertCategoryExists(categoryId: number): Promise<void> {
    if (!(await this.categories.existsBy({ id: categoryId }))) {
      throw new BadRequestException(`La categoria ${categoryId} no existe`);
    }
  }

  private async assertSkuFree(sku: string): Promise<void> {
    if (await this.products.existsBy({ sku })) {
      throw new ConflictException(`Ya existe un producto con SKU "${sku}"`);
    }
  }
}

/** Evita que % y _ del texto del usuario funcionen como comodines de LIKE. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}
