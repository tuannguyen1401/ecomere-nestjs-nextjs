import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CheckoutDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  shippingAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
