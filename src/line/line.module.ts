import { Module, forwardRef } from '@nestjs/common';
import { LineController } from './line.controller';
import { LineService } from './line.service';
import { ComplaintModule } from '../complaint/complaint.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [forwardRef(() => ComplaintModule), StorageModule],
  controllers: [LineController],
  providers: [LineService],
  exports: [LineService],
})
export class LineModule {}
