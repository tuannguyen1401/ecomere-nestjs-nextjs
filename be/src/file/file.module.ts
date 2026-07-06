import { Module, Global } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';

@Global()
@Module({
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
