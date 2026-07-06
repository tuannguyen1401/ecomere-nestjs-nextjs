import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

/** Interface mô tả file từ multer (tránh lỗi thiếu @types/multer) */
interface UploadedFileInfo {
  filename: string;
  size: number;
}

@Controller('file')
export class FileController {
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (_req, file: any, cb) => {
          // Tạo tên file unique: timestamp-random.ext
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (_req, file: any, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const ext = extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`Chỉ chấp nhận file ảnh: ${allowed.join(', ')}`), false);
        }
      },
    }),
  )
  uploadFile(@UploadedFile() file: UploadedFileInfo) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file ảnh');
    }

    // Trả về URL tương đối để frontend có thể dùng
    return {
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      size: file.size,
    };
  }
}
