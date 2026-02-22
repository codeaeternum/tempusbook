import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(FirebaseAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    async getMe(@CurrentUser() user: any) {
        return this.usersService.findByFirebaseUid(user.uid);
    }

    @Get('me/b2c-hub')
    async getB2CHub(@CurrentUser() user: any) {
        const dbUser = await this.usersService.findByFirebaseUid(user.uid);
        return this.usersService.getB2CHubData(dbUser!.id);
    }

    @Get('me/b2c-hub/:businessId')
    async getContextualB2CHub(@CurrentUser() user: any, @Param('businessId') businessId: string) {
        const dbUser = await this.usersService.findByFirebaseUid(user.uid);
        return this.usersService.getContextualB2CHubData(dbUser!.id, businessId);
    }

    @Post('sync')
    async syncUser(@CurrentUser() user: any, @Body() body: any) {
        return this.usersService.createOrUpdate({
            firebaseUid: user.uid,
            email: user.email || body.email,
            phone: body.phone,
            firstName: body.firstName,
            lastName: body.lastName,
            avatarUrl: body.avatarUrl,
        });
    }

    @Patch('me/preferences')
    async updatePreferences(@CurrentUser() user: any, @Body() body: any) {
        const dbUser = await this.usersService.findByFirebaseUid(user.uid);
        return this.usersService.updatePreferences(dbUser!.id, body);
    }

    @Post('me/favorites/:businessId')
    async toggleFavorite(@CurrentUser() user: any, @Param('businessId') businessId: string) {
        const dbUser = await this.usersService.findByFirebaseUid(user.uid);
        return this.usersService.toggleFavorite(dbUser!.id, businessId);
    }

    @Get('me/favorites')
    async getFavorites(@CurrentUser() user: any) {
        const dbUser = await this.usersService.findByFirebaseUid(user.uid);
        return this.usersService.getFavorites(dbUser!.id);
    }
}
