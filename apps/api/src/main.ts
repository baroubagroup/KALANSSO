import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Préfixe global des routes d'API
  app.setGlobalPrefix('api/v1');

  // Validation automatique des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Activation CORS pour le Web Admin, l'app Mobile et les Webhooks
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Documentation Swagger interactive
  const config = new DocumentBuilder()
    .setTitle('kalansso os - API Core')
    .setDescription("Spécification OpenAPI du Système d'Exploitation Scolaire Africain")
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const PORT = process.env.PORT || 4000;
  await app.listen(PORT);
  console.log(`🚀 kalansso os Backend démarré sur : http://localhost:${PORT}/api/v1`);
  console.log(`📚 Documentation Swagger sur : http://localhost:${PORT}/api/docs`);
}
bootstrap();
