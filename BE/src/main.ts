import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import type { INestApplication } from '@nestjs/common';
import type { Model } from 'mongoose';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole, UserStatus } from './model/users.schema';
dotenv.config();

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    await seedDefaultUsers(app);

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