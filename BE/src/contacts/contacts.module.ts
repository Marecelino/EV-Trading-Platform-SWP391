import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Contract, ContractSchema } from '../model/contacts';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Contract.name, schema: ContractSchema },
    ]),
    // Import SignnowModule with forwardRef to avoid circular dependency
    forwardRef(() => require('../signnow/signnow.module').SignnowModule),
  ],
  controllers: [ContactsController],
  providers: [
    ContactsService,
    require('./contacts-pdf.service').ContactsPdfService,
  ],
  exports: [
    ContactsService,
    require('./contacts-pdf.service').ContactsPdfService,
  ],
})
export class ContactsModule {}
