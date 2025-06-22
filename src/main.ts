import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';
import * as cookieParser from 'cookie-parser';
import { cookieTokenMiddleware } from './auth/middleware/cookie-token.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: ['https://next-line-trash.vercel.app', "http://localhost:3000"],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.use(cookieTokenMiddleware);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'keyboard cat',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60, // 1 ชั่วโมง
        sameSite: 'lax',
        secure: true,
      },
    }),
  );
  await app.listen(process.env.PORT ?? 8080);
  console.log(`Server is running on ${process.env.PORT ?? 8080}`);
}
bootstrap();
