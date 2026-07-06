import { PaginationQueryDto, parsePagination } from '../dto/pagination-query.dto';

/**
 * Kết quả trả về từ hàm paginate dùng chung.
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Tuỳ chọn cấu hình phân trang cho một Prisma model bất kỳ.
 */
export interface PaginateOptions {
  where?: any;
  orderBy?: any;
  include?: any;
  select?: any;
  query?: PaginationQueryDto;
  defaultLimit?: number;
}

/**
 * Hàm paginate dùng chung cho mọi Prisma model delegate.
 *
 * Sử dụng Cursor-offset pagination:
 *   1. Đếm tổng số bản ghi (count).
 *   2. Tìm cursor ID bằng index-only scan (select: { id: true }, skip).
 *   3. Query bản ghi đầy đủ bắt đầu từ cursor ID (where: id lte/gte).
 *
 * @param modelDelegate - Prisma model delegate (vd: prisma.product, prisma.category)
 * @param options - Cấu hình truy vấn (where, orderBy, include, query, defaultLimit)
 * @returns PaginatedResult<T> hoặc T[] nếu không có tham số phân trang
 */
export async function paginate<T = any>(
  modelDelegate: any,
  options: PaginateOptions,
): Promise<PaginatedResult<T> | T[]> {
  const { where, orderBy = { id: 'desc' }, include, query, defaultLimit = 8 } = options;
  const { page, limit: take, skip } = parsePagination(query, defaultLimit);

  // Nếu có tham số phân trang → trả về dạng PaginatedResult
  if (page !== undefined && skip !== undefined) {
    const total: number = await modelDelegate.count({ where });
    let items: T[] = [];

    if (total > 0 && skip < total) {
      const isByIdOnly = isSortedByIdOnly(orderBy);

      if (isByIdOnly) {
        // Bước 1: Index-only scan để tìm cursor ID tại vị trí offset (Chỉ dùng khi sort theo id)
        const cursorRecord = await modelDelegate.findMany({
          where,
          skip,
          take: 1,
          select: { id: true },
          orderBy,
        });

        if (cursorRecord.length > 0) {
          const cursorId = cursorRecord[0].id;

          // Xác định hướng so sánh dựa trên orderBy
          const orderDirection = getOrderDirection(orderBy);
          const idCondition = orderDirection === 'desc'
            ? { lte: cursorId }
            : { gte: cursorId };

          // Bước 2: Query bản ghi đầy đủ từ cursor ID
          items = await modelDelegate.findMany({
            where: {
              ...where,
              id: idCondition,
            },
            take,
            orderBy,
            include,
          });
        }
      } else {
        // Fallback: Sử dụng phân trang offset truyền thống nếu sort theo trường khác (như stock, price,...)
        items = await modelDelegate.findMany({
          where,
          skip,
          take,
          orderBy,
          include,
        });
      }
    }

    const totalPages = Math.ceil(total / take);

    return {
      items,
      total,
      page,
      limit: take,
      totalPages,
    };
  }

  // Không có tham số phân trang → trả về toàn bộ bản ghi
  return modelDelegate.findMany({
    where,
    orderBy,
    include,
  });
}

/**
 * Kiểm tra xem orderBy có phải chỉ sắp xếp theo trường 'id' hay không.
 */
function isSortedByIdOnly(orderBy: any): boolean {
  if (!orderBy) return true;

  // Ví dụ: { id: 'desc' }
  if (typeof orderBy === 'object' && !Array.isArray(orderBy)) {
    const keys = Object.keys(orderBy);
    return keys.length === 1 && keys[0] === 'id';
  }

  // Ví dụ: [{ id: 'desc' }]
  if (Array.isArray(orderBy) && orderBy.length > 0) {
    const first = orderBy[0];
    if (typeof first === 'object') {
      const keys = Object.keys(first);
      return keys.length === 1 && keys[0] === 'id';
    }
  }

  return false;
}

/**
 * Trích xuất hướng sắp xếp (asc/desc) từ orderBy object.
 * Mặc định trả về 'desc' nếu không xác định được.
 */
function getOrderDirection(orderBy: any): 'asc' | 'desc' {
  if (!orderBy) return 'desc';

  // Trường hợp orderBy là object: { id: 'desc' }
  if (typeof orderBy === 'object' && !Array.isArray(orderBy)) {
    const values = Object.values(orderBy);
    if (values.length > 0) {
      return values[0] === 'asc' ? 'asc' : 'desc';
    }
  }

  // Trường hợp orderBy là mảng: [{ id: 'desc' }]
  if (Array.isArray(orderBy) && orderBy.length > 0) {
    const first = orderBy[0];
    const values = Object.values(first);
    if (values.length > 0) {
      return values[0] === 'asc' ? 'asc' : 'desc';
    }
  }

  return 'desc';
}
