import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';
import { UploadService } from './upload.service';

@Module({
  imports: [
    // dùng memory storage để đọc file.buffer từ interceptor
    MulterModule.register({ storage: multer.memoryStorage() }),
  ],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadImageModule {}
