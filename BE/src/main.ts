import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import type { INestApplication } from '@nestjs/common';
import type { Model } from 'mongoose';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole, UserStatus } from './model/users.schema';
dotenv.config();

async function ensureDetailIndexes(app: any) {
  // Attempt to drop legacy non-partial indexes on evdetails and batterydetails
  try {
    const evModel: Model<any> | undefined = app.get(getModelToken('EVDetail'));
    const batModel: Model<any> | undefined = app.get(
      getModelToken('BatteryDetail'),
    );

    for (const model of [evModel, batModel]) {
      if (!model || !model.collection) continue;
      try {
        const indexes = await model.collection.indexes();
        for (const idx of indexes) {
          if (
            idx.key &&
            (idx.key.auction_id !== undefined ||
              idx.key.listing_id !== undefined)
          ) {
            // If index has no partialFilterExpression, it's the legacy problematic unique index
            if (!idx.partialFilterExpression) {
              try {
                await model.collection.dropIndex(idx.name as string);
                console.log(
                  `Dropped legacy index ${idx.name as string} on ${model.collection.collectionName}`,
                );
              } catch (err) {
                console.warn(
                  `Failed to drop index ${idx.name} on ${model.collection.collectionName}:`,
                  err?.message || err,
                );
              }
            }
          }
        }
        // Ensure indexes defined on schema are created (partial unique indexes)
        await model.syncIndexes();
      } catch (err) {
        console.warn(
          'Error ensuring indexes for detail model',
          err?.message || err,
        );
      }
    }
  } catch (err) {
    console.warn('Failed to run detail index migration:', err?.message || err);
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Ensure detail collections have correct partial indexes before any
  // services create documents. This will drop legacy non-partial unique
  // indexes (which cause duplicate-key errors for null values) and sync
  // the schema-defined partial indexes.
  await ensureDetailIndexes(app);

  await seedDefaultUsers(app);

  // Enable CORS
  app.enableCors();

  // Sanitize incoming request payloads: convert string "null"/"undefined" to actual undefined
  // This avoids Mongoose CastErrors when clients send query/body values like "null".
  const sanitizeValue = (val: any): any => {
    if (val === 'null' || val === 'undefined') return undefined;
    if (Array.isArray(val)) return val.map(sanitizeValue);
    if (val && typeof val === 'object') {
      const out: any = {};
      for (const [k, v] of Object.entries(val)) {
        out[k] = sanitizeValue(v);
      }
      return out;
    }
    return val;
  };

  app.use((req: any, _res: any, next: any) => {
    try {
      // mutate in-place to avoid assigning to read-only getters (IncomingMessage)
      if (req.query && typeof req.query === 'object') {
        for (const k of Object.keys(req.query)) {
          try {
            req.query[k] = sanitizeValue(req.query[k]);
          } catch (e) {
            // ignore individual key failures
          }
        }
      }

      if (req.body && typeof req.body === 'object') {
        for (const k of Object.keys(req.body)) {
          try {
            req.body[k] = sanitizeValue(req.body[k]);
          } catch (e) {
            // ignore
          }
        }
      }

      if (req.params && typeof req.params === 'object') {
        for (const k of Object.keys(req.params)) {
          try {
            req.params[k] = sanitizeValue(req.params[k]);
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (err) {
      // non-fatal
      console.warn('Failed to sanitize request payload', err?.message || err);
    }
    next();
  });

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
    .addTag('pricesuggestions')
    .addTag('favorites')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  // Serve uploaded files from /uploads
  try {
    app.useStaticAssets(path.join(process.cwd(), 'uploads'), {
      prefix: '/uploads',
    });
  } catch (err) {
    console.warn(
      'Failed to configure static assets for uploads',
      err?.message || err,
    );
  }
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger UI available at: http://localhost:${port}/docs`);
}

bootstrap();
interface SeedUserConfig {
  fallbackEmail: string;
  fallbackPassword: string;
  fallbackName: string;
  role: UserRole;
}

async function seedDefaultUsers(app: INestApplication) {
  try {
    const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
    const defaults: Array<
      SeedUserConfig & {
        emailEnv: string;
        passwordEnv: string;
        nameEnv?: string;
        status: UserStatus;
        logLabel: string;
      }
    > = [
      {
        fallbackEmail: 'admin@example.com',
        fallbackPassword: 'admin123',
        fallbackName: 'Quản trị viên',
        role: UserRole.ADMIN,
        emailEnv: 'DEFAULT_ADMIN_EMAIL',
        passwordEnv: 'DEFAULT_ADMIN_PASSWORD',
        nameEnv: 'DEFAULT_ADMIN_NAME',
        status: UserStatus.ACTIVE,
        logLabel: 'admin',
      },
      {
        fallbackEmail: 'tuan@demo.com',
        fallbackPassword: '123456',
        fallbackName: 'Lê Minh Tuấn',
        role: UserRole.USER,
        emailEnv: 'DEFAULT_MEMBER_EMAIL',
        passwordEnv: 'DEFAULT_MEMBER_PASSWORD',
        nameEnv: 'DEFAULT_MEMBER_NAME',
        status: UserStatus.ACTIVE,
        logLabel: 'demo member',
      },
    ];

    for (const config of defaults) {
      const email = process.env[config.emailEnv] ?? config.fallbackEmail;
      const password =
        process.env[config.passwordEnv] ?? config.fallbackPassword;
      const name = process.env[config.nameEnv ?? ''] ?? config.fallbackName;

      const exists = await userModel.findOne({ email }).lean();
      if (exists) {
        continue;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await userModel.create({
        name,
        email,
        password: hashedPassword,
        role: config.role,
        status: config.status,
        profileCompleted: true,
        isEmailVerified: true,
      });

      console.log(
        `Seeded default ${config.logLabel} account. Email: ${email}, Password: ${password}`,
      );
    }
  } catch (error) {
    console.error('Failed to seed default users:', error);
  }
}
