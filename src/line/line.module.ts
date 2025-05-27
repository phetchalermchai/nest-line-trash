import { Module } from '@nestjs/common';
import { LineController } from './line.controller';
import { LineService } from './line.service';
import { ComplaintModule } from '../complaint/complaint.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [ComplaintModule, StorageModule],
  controllers: [LineController],
  providers: [LineService],
})
export class LineModule {}
