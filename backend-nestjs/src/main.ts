import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: 'http://localhost:4000', // Thay thế bằng domain chính thức khi triển khai
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Quan trọng nếu bạn dùng cookie, session, hoặc authorization header
  });
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
