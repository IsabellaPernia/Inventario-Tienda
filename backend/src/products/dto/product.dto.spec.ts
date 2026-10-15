import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateProductDto, QueryProductsDto } from './product.dto.js';

const valid = {
  name: 'Arroz 1 kg',
  sku: 'ARR-001',
  price: 1.25,
  stock: 10,
  categoryId: 1,
};

async function errorsFor(cls: new () => object, plain: object) {
  const errors = await validate(plainToInstance(cls, plain));
  return errors.map((e) => e.property);
}

describe('CreateProductDto', () => {
  it('acepta un producto valido', async () => {
    expect(await errorsFor(CreateProductDto, valid)).toEqual([]);
  });

  it('rechaza price 0 o negativo', async () => {
    expect(await errorsFor(CreateProductDto, { ...valid, price: 0 })).toContain('price');
    expect(await errorsFor(CreateProductDto, { ...valid, price: -5 })).toContain('price');
  });

  it('rechaza price con mas de 2 decimales', async () => {
    expect(await errorsFor(CreateProductDto, { ...valid, price: 1.999 })).toContain('price');
  });

  it('rechaza stock negativo pero acepta 0', async () => {
    expect(await errorsFor(CreateProductDto, { ...valid, stock: -1 })).toContain('stock');
    expect(await errorsFor(CreateProductDto, { ...valid, stock: 0 })).toEqual([]);
  });

  it('exige name, sku y categoryId', async () => {
    const errors = await errorsFor(CreateProductDto, { price: 1, stock: 1 });
    expect(errors).toEqual(expect.arrayContaining(['name', 'sku', 'categoryId']));
  });

  it('rechaza name vacio o solo espacios', async () => {
    expect(await errorsFor(CreateProductDto, { ...valid, name: '   ' })).toContain('name');
  });
});

describe('QueryProductsDto', () => {
  it('usa page=1 y limit=10 por defecto', () => {
    const dto = plainToInstance(QueryProductsDto, {});
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(10);
  });

  it('convierte isActive y categoryId desde el query string', () => {
    const dto = plainToInstance(QueryProductsDto, { isActive: 'false', categoryId: '3' });
    expect(dto.isActive).toBe(false);
    expect(dto.categoryId).toBe(3);
  });

  it('limita limit a 100', async () => {
    expect(await errorsFor(QueryProductsDto, { limit: '500' })).toContain('limit');
  });
});
