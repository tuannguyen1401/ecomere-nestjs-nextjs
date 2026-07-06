import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

/**
 * Map error type → errorCode machine-readable.
 * Frontend dùng errorCode để switch-case xử lý mà không cần parse message.
 */
const ERROR_CODES: Record<string, string> = {
  // HTTP
  BadRequestException: 'BAD_REQUEST',
  UnauthorizedException: 'UNAUTHORIZED',
  ForbiddenException: 'FORBIDDEN',
  NotFoundException: 'NOT_FOUND',
  ConflictException: 'CONFLICT',
  ValidationError: 'VALIDATION_ERROR',
  // Prisma
  P2002: 'DUPLICATE_ENTRY',
  P2025: 'NOT_FOUND',
  P2003: 'FOREIGN_KEY_VIOLATION',
};

/**
 * Global Exception Filter
 *
 * - Bắt MỌI lỗi (HttpException, Prisma error, unknown)
 * - Trả về JSON format chuẩn đồng bộ với TransformInterceptor
 * - Log 4xx (warning), 5xx (error)
 * - Map error code máy đọc được
 * - Ẩn stack trace ở production
 */
@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isProduction = process.env.NODE_ENV === 'production';

    let status: number;
    let message: string;
    let error: string;
    let errorCode: string | null = null;

    if (exception instanceof HttpException) {
      // ─── NestJS HttpException ───
      status = exception.getStatus();
      const res = exception.getResponse();
      errorCode = ERROR_CODES[exception.name] || null;

      if (typeof res === 'string') {
        message = res;
        error = exception.name;
      } else {
        const resObj = res as Record<string, any>;
        message = Array.isArray(resObj.message)
          ? resObj.message.join('; ')
          : (resObj.message || exception.message);
        error = resObj.error || exception.name;
      }

      this.logger.warn(
        `${request.method} ${request.url} → ${status} ${error}: ${message}`,
      );
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // ─── Prisma known errors (unique constraint, not found, ...) ───
      status = HttpStatus.CONFLICT;
      errorCode = ERROR_CODES[exception.code] || 'DATABASE_ERROR';
      error = 'Database Error';

      switch (exception.code) {
        case 'P2002': {
          // Unique constraint violation – ví dụ: duplicate slug
          const target = (exception.meta?.target as string[])?.join(', ') || 'field';
          message = `Duplicate "${target}". This value already exists.`;
          status = HttpStatus.CONFLICT;
          break;
        }
        case 'P2025': {
          // Record not found
          message = 'Record not found.';
          status = HttpStatus.NOT_FOUND;
          break;
        }
        case 'P2003': {
          // Foreign key constraint – xoá category nhưng còn product tham chiếu
          message = 'Cannot delete because related records still exist.';
          status = HttpStatus.CONFLICT;
          break;
        }
        default: {
          message = 'Database operation failed.';
          status = HttpStatus.INTERNAL_SERVER_ERROR;
        }
      }

      this.logger.warn(
        `${request.method} ${request.url} → Prisma ${exception.code}: ${message}`,
      );
    } else if (exception instanceof Error) {
      // ─── Unknown runtime error (500) ───
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = isProduction ? 'Internal server error' : exception.message;
      error = 'Internal Server Error';

      this.logger.error(
        `Unhandled Error: ${exception.message}`,
        exception.stack,
        `${request.method} ${request.url}`,
      );
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'Internal Server Error';
    }

    const errorResponse: Record<string, any> = {
      statusCode: status,
      message,
      error,
    };

    // Chỉ thêm metadata trong development, tránh leak info
    if (!isProduction) {
      errorResponse.timestamp = new Date().toISOString();
      errorResponse.path = request.url;
    }

    // Thêm errorCode nếu có
    if (errorCode) {
      errorResponse.errorCode = errorCode;
    }

    response.status(status).json(errorResponse);
  }
}
