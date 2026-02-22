import { Module } from '@nestjs/common';
import { BodyChartsController } from './body-charts.controller';
import { BodyChartsService } from './body-charts.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [BodyChartsController],
    providers: [BodyChartsService],
    exports: [BodyChartsService],
})
export class BodyChartsModule { }
