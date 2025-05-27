import { Controller, Post, Req } from '@nestjs/common';
import { LineService } from './line.service';

@Controller('webhook/line')
export class LineController {
    constructor(private readonly lineService: LineService) { }

    @Post()
    handleWebhook(@Req() req: any) {
        return this.lineService.handleWebhook(req.body);
    }
}
