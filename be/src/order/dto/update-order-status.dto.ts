import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const VALID_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

export class UpdateOrderStatusDto {
  @IsString()
  @IsIn(VALID_STATUSES)
  status: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
