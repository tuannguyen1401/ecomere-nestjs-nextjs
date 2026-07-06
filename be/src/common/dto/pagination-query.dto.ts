export class PaginationQueryDto {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
  search?: string;
}

export function parsePagination(query?: PaginationQueryDto, defaultLimit = 8) {
  const page = query?.page ? parseInt(query.page, 10) : undefined;
  const limit = query?.limit ? parseInt(query.limit, 10) : undefined;

  const validPage = page && !isNaN(page) && page > 0 ? page : 1;
  const validLimit = limit && !isNaN(limit) && limit > 0 ? limit : defaultLimit;

  return {
    page: validPage,
    limit: validLimit,
    skip: (validPage - 1) * validLimit,
  };
}
