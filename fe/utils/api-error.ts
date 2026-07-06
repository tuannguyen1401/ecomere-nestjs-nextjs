/**
 * ApiError – error class chứa thêm statusCode + errorCode từ server.
 *
 * Dùng để:
 * - Component chỉ cần catch(err) và showToast(err.message)
 * - Có thể check err.statusCode để biết 401 → redirect login
 * - errorCode máy đọc được (DUPLICATE_ENTRY, VALIDATION_ERROR...)
 */
export class ApiError extends Error {
  statusCode: number;
  errorCode: string | null;

  constructor(message: string, statusCode = 500, errorCode: string | null = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }

  /** Token hết hạn? */
  get isUnauthorized(): boolean {
    return this.statusCode === 401;
  }

  /** Trùng dữ liệu? (vd: duplicate slug) */
  get isDuplicate(): boolean {
    return this.errorCode === 'DUPLICATE_ENTRY';
  }

  /** Lỗi validation? */
  get isValidationError(): boolean {
    return this.errorCode === 'VALIDATION_ERROR' || this.statusCode === 400;
  }
}
