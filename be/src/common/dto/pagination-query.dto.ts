import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export function parsePagination(query?: PaginationQueryDto, defaultLimit = 8) {
  const page = query?.page;
  const limit = query?.limit;

  const validPage = page && page > 0 ? page : 1;
  const validLimit = limit && limit > 0 ? limit : defaultLimit;

  return {
    page: validPage,
    limit: validLimit,
    skip: (validPage - 1) * validLimit,
  };
}
