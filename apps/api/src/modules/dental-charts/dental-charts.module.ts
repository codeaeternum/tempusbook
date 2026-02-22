import { Module } from '@nestjs/common';
import { DentalChartsController } from './dental-charts.controller';
import { DentalChartsService } from './dental-charts.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [DentalChartsController],
    providers: [DentalChartsService],
    exports: [DentalChartsService],
})
export class DentalChartsModule { }
