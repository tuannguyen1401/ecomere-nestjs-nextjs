import { Injectable, Logger } from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private readonly uploadDir = join(process.cwd(), 'uploads');

  /**
   * Xoá một file trong thư mục uploads.
   * Không throw error nếu file không tồn tại – silent fail.
   */
  deleteFile(filename: string): void {
    if (!filename) return;

    // Chỉ extract tên file từ path (vd: /uploads/abc.jpg → abc.jpg)
    const name = filename.replace(/^\/?uploads\//, '');
    if (!name) return;

    const fullPath = join(this.uploadDir, name);

    try {
      if (existsSync(fullPath)) {
        unlinkSync(fullPath);
        this.logger.log(`Deleted file: ${name}`);
      }
    } catch (error) {
      // Log warning nhưng không throw – không muốn crash request vì lỗi xoá file
      this.logger.warn(`Failed to delete file ${name}: ${(error as Error).message}`);
    }
  }
}
