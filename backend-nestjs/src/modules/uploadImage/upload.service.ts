import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';

@Injectable()
export class UploadService {
  private storage = new Storage({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS, // ./gcs-key.json
  });

  private bucketName = process.env.GCS_BUCKET as string;       // vd: my-bucket

  async uploadBufferWithKey(buffer: Buffer, mime: string, objectKey: string) {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(objectKey);

      await file.save(buffer, {
        contentType: mime,
        resumable: false,
        public: true, // nếu bucket đã bật public
        metadata: { cacheControl: 'public, max-age=31536000' },
      });

      return `https://storage.googleapis.com/${this.bucketName}/${objectKey}`;
    } catch (e: any) {
      throw new InternalServerErrorException(e.message || 'Upload thất bại');
    }
  }
}
