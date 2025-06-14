import { forwardRef, Module } from '@nestjs/common';
import { ComplaintController } from './complaint.controller';
import { ComplaintService } from './complaint.service';
import { StorageModule } from '../storage/storage.module';
import { LineModule } from '../line/line.module';

@Module({
  imports: [StorageModule, forwardRef(() => LineModule)],
  controllers: [ComplaintController],
  providers: [ComplaintService],
  exports: [ComplaintService],
})
export class ComplaintModule {}
