import { Test, TestingModule } from '@nestjs/testing';
import {
  getConnectionToken,
  getModelToken,
  MongooseModule,
} from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model, Types } from 'mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TransactionComplaintsModule } from '../src/transaction-complaints/transaction-complaints.module';
import { TransactionComplaintsService } from '../src/transaction-complaints/transaction-complaints.service';
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
import { User, UserDocument } from '../src/model/users.schema';
import {
  Notification,
  NotificationDocument,
  NotificationType,
} from '../src/model/notifications';
import { CreateTransactionComplaintDto } from '../src/transaction-complaints/dto/create-transaction-complaint.dto';

const uniqueEmail = (prefix: string) =>
  `${prefix}-${new Types.ObjectId().toString()}@example.com`;

describe('TransactionComplaintsService (integration)', () => {
  let mongoServer: MongoMemoryServer;
  let moduleRef: TestingModule;
  let connection: Connection;
  let service: TransactionComplaintsService;
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
    }).compile();

    connection = moduleRef.get<Connection>(getConnectionToken());
    service = moduleRef.get<TransactionComplaintsService>(
      TransactionComplaintsService,
    );
    complaintModel = moduleRef.get(getModelToken(TransactionComplaint.name));
    transactionModel = moduleRef.get(getModelToken(Transaction.name));
    userModel = moduleRef.get(getModelToken(User.name));
    notificationModel = moduleRef.get(getModelToken(Notification.name));
  });

  afterAll(async () => {
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

  const seedTransaction = async () => {
    const buyer = await userModel.create({
      email: uniqueEmail('buyer'),
      password: 'Password1!',
    });
    const seller = await userModel.create({
      email: uniqueEmail('seller'),
      password: 'Password1!',
    });

    const transaction = await transactionModel.create({
      buyer_id: buyer._id,
      seller_id: seller._id,
      price: 32000,
      status: TransactionStatus.COMPLETED,
    });

    return { buyer, seller, transaction };
  };

  it('allows a participant to file a complaint and notifies counterpart', async () => {
    const { buyer, seller, transaction } = await seedTransaction();

    const transactionId = (transaction._id as Types.ObjectId).toHexString();
    const dto: CreateTransactionComplaintDto = {
      reason: TransactionComplaintReason.QUALITY_ISSUE,
      description: 'Received vehicle with undisclosed damage details',
    };

    const complaint = await service.create(
      buyer._id.toHexString(),
      transactionId,
      dto,
    );

    expect(complaint.status).toBe(TransactionComplaintStatus.OPEN);
    const stored = await complaintModel.findById(complaint._id).lean();
    expect(stored).toBeTruthy();
    expect(stored?.complainant_id?.toString()).toBe(buyer._id.toHexString());
    expect(stored?.respondent_id?.toString()).toBe(seller._id.toHexString());

    const notifications = await notificationModel
      .find({ user_id: seller._id })
      .lean();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe(NotificationType.COMPLAINT_SUBMITTED);
    expect(notifications[0].related_id).toBe(complaint._id.toString());
  });

  it('rejects complaints from non participants', async () => {
    const { seller, transaction } = await seedTransaction();
    const outsider = await userModel.create({
      email: uniqueEmail('outsider'),
      password: 'Password1!',
    });

    const transactionId = (transaction._id as Types.ObjectId).toHexString();

    await expect(
      service.create(outsider._id.toHexString(), transactionId, {
        reason: TransactionComplaintReason.OTHER,
        description: 'Trying to report without participation',
      }),
    ).rejects.toThrow();
  });

  it('allows admin to update status and notifies both parties', async () => {
    const { buyer, seller, transaction } = await seedTransaction();

    const transactionId = (transaction._id as Types.ObjectId).toHexString();

    const complaint = await service.create(
      buyer._id.toHexString(),
      transactionId,
      {
        reason: TransactionComplaintReason.FRAUD,
        description: 'Evidence of tampered odometer provided',
      },
    );

    const adminId = new Types.ObjectId().toHexString();

    const updated = await service.updateByAdmin(
      complaint._id.toString(),
      {
        status: TransactionComplaintStatus.RESOLVED,
        resolution: TransactionComplaintResolution.REFUND,
        admin_notes: 'Refund issued to buyer after verification.',
      },
      adminId,
    );

    expect(updated.status).toBe(TransactionComplaintStatus.RESOLVED);
    expect(updated.resolution).toBe(TransactionComplaintResolution.REFUND);
    expect(updated.resolved_at).toBeDefined();

    const notifications = await notificationModel
      .find({ related_id: complaint._id.toString() })
      .lean();
    expect(notifications.length).toBeGreaterThanOrEqual(2);
    const types = notifications.map((item) => item.type);
    expect(types).toContain(NotificationType.COMPLAINT_UPDATED);
  });
});
