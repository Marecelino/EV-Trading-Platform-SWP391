import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  getConnectionToken,
  getModelToken,
  MongooseModule,
} from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model, Types } from 'mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import request from 'supertest';
import { TransactionComplaintsModule } from '../src/transaction-complaints/transaction-complaints.module';
import {
  TransactionComplaint,
  TransactionComplaintDocument,
  TransactionComplaintReason,
  TransactionComplaintResolution,
  TransactionComplaintStatus,
} from '../src/model/transactioncomplaints';
import {
  Transaction,
  TransactionDocument,
  TransactionStatus,
} from '../src/model/transactions';
import { User, UserDocument, UserRole } from '../src/model/users.schema';
import {
  Notification,
  NotificationDocument,
  NotificationType,
} from '../src/model/notifications';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { ROLES_KEY } from '../src/auth/decorators/roles.decorator';
import { Reflector } from '@nestjs/core';

@Injectable()
class TestAuthGuard {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const userId = (request.headers['x-test-user'] as string) ?? '';
    const role = (request.headers['x-test-role'] as string) ?? UserRole.USER;

    if (!userId) {
      throw new ForbiddenException('Missing test user header');
    }

    request.user = {
      userId,
      role,
    };

    return true;
  }
}

@Injectable()
class TestRolesGuard {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    if (!request.user?.role || !requiredRoles.includes(request.user.role)) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}

describe('TransactionComplaintsController (HTTP) e2e', () => {
  let mongoServer: MongoMemoryServer;
  let moduleRef: TestingModule;
  let connection: Connection;
  let app: any;
  let complaintModel: Model<TransactionComplaintDocument>;
  let transactionModel: Model<TransactionDocument>;
  let userModel: Model<UserDocument>;
  let notificationModel: Model<NotificationDocument>;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    moduleRef = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot(),
        MongooseModule.forRoot(uri),
        TransactionComplaintsModule,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestAuthGuard)
      .overrideGuard(RolesGuard)
      .useClass(TestRolesGuard)
      .compile();

    connection = moduleRef.get<Connection>(getConnectionToken());
    complaintModel = moduleRef.get(getModelToken(TransactionComplaint.name));
    transactionModel = moduleRef.get(getModelToken(Transaction.name));
    userModel = moduleRef.get(getModelToken(User.name));
    notificationModel = moduleRef.get(getModelToken(Notification.name));

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await moduleRef.close();
    await connection.close();
    await mongoServer.stop();
  });

  afterEach(async () => {
    const collections = connection.collections;
    await Promise.all(
      Object.values(collections).map((collection) => collection.deleteMany({})),
    );
  });

  const uniqueEmail = (prefix: string) =>
    `${prefix}-${new Types.ObjectId().toString()}@example.com`;

  const normalizeId = (value: any) =>
    value instanceof Types.ObjectId ? value.toHexString() : String(value);

  const seedTransaction = async () => {
    const buyer = await userModel.create({
      email: uniqueEmail('buyer'),
      password: 'Password1!',
    });
    const seller = await userModel.create({
      email: uniqueEmail('seller'),
      password: 'Password1!',
    });
    const admin = await userModel.create({
      email: uniqueEmail('admin'),
      password: 'Password1!',
      role: UserRole.ADMIN,
    });

    const transaction = await transactionModel.create({
      buyer_id: buyer._id,
      seller_id: seller._id,
      price: 25000,
      status: TransactionStatus.COMPLETED,
    });

    return { buyer, seller, admin, transaction };
  };

  it('allows a participant to file a complaint via HTTP API', async () => {
    const { buyer, seller, transaction } = await seedTransaction();
    const transactionId = normalizeId(transaction._id);

    const response = await request(app.getHttpServer())
      .post(`/transactions/${transactionId}/complaints`)
      .set('x-test-user', buyer._id.toString())
      .send({
        reason: TransactionComplaintReason.QUALITY_ISSUE,
        description: 'Serious damage discovered after delivery',
      })
      .expect(201);

    expect(response.body.status).toBe(TransactionComplaintStatus.OPEN);
    expect(response.body.transaction_id).toBeDefined();

    const stored = await complaintModel.findById(response.body._id).lean();
    expect(stored?.complainant_id?.toString()).toBe(buyer._id.toString());
    expect(stored?.respondent_id?.toString()).toBe(seller._id.toString());

    const sellerNotifications = await notificationModel
      .find({ user_id: seller._id })
      .lean();
    expect(sellerNotifications).toHaveLength(1);
    expect(sellerNotifications[0].type).toBe(
      NotificationType.COMPLAINT_SUBMITTED,
    );
  });

  it('rejects complaint creation from non participants', async () => {
    const { seller, transaction } = await seedTransaction();
    const transactionId = normalizeId(transaction._id);
    const outsider = await userModel.create({
      email: uniqueEmail('outsider'),
      password: 'Password1!',
    });

    await request(app.getHttpServer())
      .post(`/transactions/${transactionId}/complaints`)
      .set('x-test-user', outsider._id.toString())
      .send({
        reason: TransactionComplaintReason.OTHER,
        description: 'Attempting unauthorized complaint',
      })
      .expect(401);

    const count = await complaintModel.countDocuments();
    expect(count).toBe(0);

    const sellerNotifications = await notificationModel
      .find({ user_id: seller._id })
      .lean();
    expect(sellerNotifications).toHaveLength(0);
  });

  it('allows admin to list and resolve complaints via admin endpoints', async () => {
    const { buyer, seller, admin, transaction } = await seedTransaction();
    const transactionId = normalizeId(transaction._id);

    const complaint = await request(app.getHttpServer())
      .post(`/transactions/${transactionId}/complaints`)
      .set('x-test-user', buyer._id.toString())
      .send({
        reason: TransactionComplaintReason.FRAUD,
        description: 'Mileage was rolled back intentionally',
      })
      .expect(201)
      .then((res) => res.body);

    const listResponse = await request(app.getHttpServer())
      .get('/admin/transaction-complaints')
      .set('x-test-user', admin._id.toString())
      .set('x-test-role', UserRole.ADMIN)
      .expect(200);

    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0]._id).toBe(complaint._id);

    const updateResponse = await request(app.getHttpServer())
      .patch(`/admin/transaction-complaints/${complaint._id}`)
      .set('x-test-user', admin._id.toString())
      .set('x-test-role', UserRole.ADMIN)
      .send({
        status: TransactionComplaintStatus.RESOLVED,
        resolution: TransactionComplaintResolution.REFUND,
        admin_notes: 'Refund has been processed.',
      })
      .expect(200);

    expect(updateResponse.body.status).toBe(
      TransactionComplaintStatus.RESOLVED,
    );
    expect(updateResponse.body.resolution).toBe(
      TransactionComplaintResolution.REFUND,
    );

    const notifications = await notificationModel
      .find({ related_id: complaint._id })
      .lean();
    expect(notifications.length).toBeGreaterThanOrEqual(2);
    const types = notifications.map((note) => note.type);
    expect(types).toContain(NotificationType.COMPLAINT_UPDATED);
  });
});
