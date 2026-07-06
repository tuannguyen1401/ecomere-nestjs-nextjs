import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalInterceptors(new TransformInterceptor());
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT_BE') ?? 3000;
  await app.listen(port);
}
bootstrap();

