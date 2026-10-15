import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateCategoryDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'name no puede estar vacio' })
  @MaxLength(100)
  name: string;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
