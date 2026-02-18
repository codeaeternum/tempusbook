import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    async getMe(@Req() req: any) {
        const firebaseUid = req.user.uid;
        return this.usersService.findByFirebaseUid(firebaseUid);
    }

    @Post('sync')
    async syncUser(@Req() req: any, @Body() body: any) {
        return this.usersService.createOrUpdate({
            firebaseUid: req.user.uid,
            email: req.user.email || body.email,
            phone: body.phone,
            firstName: body.firstName,
            lastName: body.lastName,
            avatarUrl: body.avatarUrl,
        });
    }

    @Patch('me/preferences')
    async updatePreferences(@Req() req: any, @Body() body: any) {
        const user = await this.usersService.findByFirebaseUid(req.user.uid);
        return this.usersService.updatePreferences(user!.id, body);
    }

    @Post('me/favorites/:businessId')
    async toggleFavorite(@Req() req: any, @Param('businessId') businessId: string) {
        const user = await this.usersService.findByFirebaseUid(req.user.uid);
        return this.usersService.toggleFavorite(user!.id, businessId);
    }

    @Get('me/favorites')
    async getFavorites(@Req() req: any) {
        const user = await this.usersService.findByFirebaseUid(req.user.uid);
        return this.usersService.getFavorites(user!.id);
    }
}
