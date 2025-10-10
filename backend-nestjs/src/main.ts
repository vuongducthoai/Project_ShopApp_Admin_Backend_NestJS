import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

   app.enableCors({
    // Cho phép frontend của bạn truy cập
    origin: ['http://localhost:4000',
            'http://192.168.1.5:4000'
    ]
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
