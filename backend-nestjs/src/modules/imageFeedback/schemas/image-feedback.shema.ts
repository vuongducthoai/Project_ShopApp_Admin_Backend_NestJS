import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {Document, Types} from 'mongoose';

@Schema({ timestamps: true })
export class ImageFeedback extends Document {
  @Prop({ type: String, required: true })
  imageFeedback: string;

  @Prop({ type: Types.ObjectId, ref: 'Feedback', required: true })
  feedback: Types.ObjectId;
}

export const ImageFeedbackSchema = SchemaFactory.createForClass(ImageFeedback);

ImageFeedbackSchema.virtual('id').get(function (this: any) {
  return this._id.toString();
});

ImageFeedbackSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
  },
});