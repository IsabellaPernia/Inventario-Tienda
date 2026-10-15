import { PartialType } from '@nestjs/mapped-types';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// "true"/"false" llegan como string desde el query string.
const toBoolean = ({ value }: { value: unknown }) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

export class CreateProductDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'name no puede estar vacio' })
  @MaxLength(150)
  name: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'sku no puede estar vacio' })
  @MaxLength(100)
  sku: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'price admite hasta 2 decimales' })
  @IsPositive({ message: 'price debe ser mayor que 0' })
  @Max(99999999.99)
  price: number;

  @IsInt()
  @Min(0, { message: 'stock debe ser mayor o igual a 0' })
  stock: number;

  @IsInt()
  @IsPositive()
  categoryId: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class QueryProductsDto {
  /** Texto a buscar en name o sku. */
  @IsOptional()
  @Transform(trim)
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  categoryId?: number;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
}
