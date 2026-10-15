import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/product.entity.js';
import { Category } from './category.entity.js';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
  ) {}

  async findAll(): Promise<Category[]> {
    const [categories, counts] = await Promise.all([
      this.categories.find({ order: { name: 'ASC' } }),
      this.products
        .createQueryBuilder('product')
        .select('product.categoryId', 'categoryId')
        .addSelect('COUNT(*)', 'total')
        .groupBy('product.categoryId')
        .getRawMany<{ categoryId: number; total: string }>(),
    ]);
    const totals = new Map(counts.map((c) => [Number(c.categoryId), Number(c.total)]));
    for (const category of categories) {
      category.productCount = totals.get(category.id) ?? 0;
    }
    return categories;
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categories.findOneBy({ id });
    if (!category) {
      throw new NotFoundException(`Categoria ${id} no encontrada`);
    }
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    await this.assertNameFree(dto.name);
    return this.categories.save(this.categories.create(dto));
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);
    if (dto.name !== undefined && dto.name !== category.name) {
      await this.assertNameFree(dto.name);
    }
    Object.assign(category, dto);
    return this.categories.save(category);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    const inUse = await this.products.countBy({ categoryId: id });
    if (inUse > 0) {
      throw new ConflictException(
        `No se puede eliminar: la categoria tiene ${inUse} producto(s) asociado(s)`,
      );
    }
    await this.categories.delete(id);
  }

  private async assertNameFree(name: string): Promise<void> {
    if (await this.categories.existsBy({ name })) {
      throw new ConflictException(`Ya existe una categoria llamada "${name}"`);
    }
  }
}
