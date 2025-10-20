import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('EV Trading Platform API')
    .setDescription('The EV Trading Platform API description')
    .setVersion('1.0')
    .addBearerAuth() // Auth configuration first
    .addTag('Auth')
    .addTag('listings')
    .addTag('transactions')
    .addTag('reviews')
    .addTag('contacts')
    .addTag('evdetails')
    .addTag('models')
    .addTag('pricesuggestions')
    .addTag('favorites')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger UI available at: http://localhost:${port}/docs`);
}
bootstrap();
