import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ImageFeedback,
  ImageFeedbackSchema,
} from './schemas/image-feedback.shema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ImageFeedback.name, schema: ImageFeedbackSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class ImageFeedbackModule {}
