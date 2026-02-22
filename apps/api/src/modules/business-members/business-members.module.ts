import { Module } from '@nestjs/common';
import { BusinessMembersController } from './business-members.controller';
import { BusinessMembersService } from './business-members.service';

@Module({
    controllers: [BusinessMembersController],
    providers: [BusinessMembersService],
    exports: [BusinessMembersService],
})
export class BusinessMembersModule { }
