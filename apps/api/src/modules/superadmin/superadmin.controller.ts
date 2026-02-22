import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus,
    ForbiddenException,
} from '@nestjs/common';
import { SuperAdminService } from './superadmin.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('SuperAdmin — Code Aeternum')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('PLATFORM_ADMIN')
@Controller('superadmin')
export class SuperAdminController {
    constructor(private readonly superAdminService: SuperAdminService) { }

    // ==========================================
    // Feature Flags
    // ==========================================

    @Get('flags')
    @ApiOperation({ summary: 'List all feature flags' })
    async listFlags() {
        return this.superAdminService.listFlags();
    }

    @Post('flags')
    @ApiOperation({ summary: 'Create a new feature flag' })
    async createFlag(
        @Body() data: {
            key: string;
            name: string;
            description?: string;
            enabled?: boolean;
            environment?: string;
            targetPlans?: string[];
            targetCategories?: string[];
        },
    ) {
        return this.superAdminService.createFlag(data);
    }

    @Patch('flags/:id/toggle')
    @ApiOperation({ summary: 'Toggle a feature flag on/off' })
    async toggleFlag(
        @Param('id') id: string,
        @Body() data: { enabled: boolean },
    ) {
        return this.superAdminService.toggleFlag(id, data.enabled);
    }

    // ==========================================
    // Platform Ads
    // ==========================================

    @Get('ads')
    @ApiOperation({ summary: 'List all platform ads' })
    async listAds() {
        return this.superAdminService.listAds();
    }

    @Post('ads')
    @ApiOperation({ summary: 'Create a new platform ad' })
    async createAd(
        @Body() data: {
            title: string;
            body?: string;
            imageUrl?: string;
            linkUrl?: string;
            placement?: string;
            targetPlans?: string[];
            targetCategories?: string[];
            startsAt?: Date;
            endsAt?: Date;
        },
    ) {
        return this.superAdminService.createAd(data);
    }

    @Patch('ads/:id/toggle')
    @ApiOperation({ summary: 'Activate/deactivate a platform ad' })
    async toggleAd(
        @Param('id') id: string,
        @Body() data: { isActive: boolean },
    ) {
        return this.superAdminService.toggleAd(id, data.isActive);
    }

    // ==========================================
    // Platform Overview
    // ==========================================

    @Get('overview')
    @ApiOperation({ summary: 'Platform-wide stats for Code Aeternum dashboard' })
    async getOverview() {
        return this.superAdminService.getPlatformOverview();
    }

    @Get('businesses')
    @ApiOperation({ summary: 'List all businesses with subscription info' })
    async listBusinesses() {
        return this.superAdminService.listBusinesses();
    }

    @Get('users')
    @ApiOperation({ summary: 'List all platform users' })
    async listUsers() {
        return this.superAdminService.listUsers();
    }

    @Get('audit-log')
    @ApiOperation({ summary: 'Recent audit log entries' })
    async getAuditLog() {
        return this.superAdminService.getAuditLog();
    }

    // ==========================================
    // Business Management
    // ==========================================

    @Patch('businesses/:id/status')
    @ApiOperation({ summary: 'Suspend or reactivate a business' })
    async changeBusinessStatus(
        @Param('id') id: string,
        @Body() data: { status: 'ACTIVE' | 'SUSPENDED' },
    ) {
        return this.superAdminService.changeBusinessStatus(id, data.status);
    }

    @Patch('subscriptions/:businessId/plan')
    @ApiOperation({ summary: 'Change subscription plan for a business' })
    async changeSubscriptionPlan(
        @Param('businessId') businessId: string,
        @Body() data: { plan: 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS' },
    ) {
        return this.superAdminService.changeSubscriptionPlan(businessId, data.plan);
    }

    // ==========================================
    // Subscriptions
    // ==========================================

    @Get('subscriptions')
    @ApiOperation({ summary: 'List all subscriptions with business info' })
    async listSubscriptions() {
        return this.superAdminService.listSubscriptions();
    }

    // ==========================================
    // Platform Feedback
    // ==========================================

    @Get('feedback')
    @ApiOperation({ summary: 'List all platform feedback' })
    async listFeedback() {
        return this.superAdminService.listFeedback();
    }

    @Post('feedback')
    @ApiOperation({ summary: 'Create internal feedback entry' })
    async createFeedback(
        @Body() data: {
            title: string;
            description: string;
            type?: string;
            priority?: string;
            businessId?: string;
        },
    ) {
        return this.superAdminService.createFeedback(data);
    }

    @Patch('feedback/:id/status')
    @ApiOperation({ summary: 'Update feedback status' })
    async updateFeedbackStatus(
        @Param('id') id: string,
        @Body() data: { status: string; adminNotes?: string },
    ) {
        return this.superAdminService.updateFeedbackStatus(id, data.status, data.adminNotes);
    }
}
