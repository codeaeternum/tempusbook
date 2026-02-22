import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ServicesModule } from './modules/services/services.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { HealthModule } from './modules/health/health.module';
import { SuperAdminModule } from './modules/superadmin/superadmin.module';
import { PosModule } from './modules/pos/pos.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { FormsModule } from './modules/forms/forms.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { BusinessMembersModule } from './modules/business-members/business-members.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ReportsModule } from './modules/reports/reports.module';
import { GalleryModule } from './modules/gallery/gallery.module';

// Automotive Vertical & Quotes
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { WorkOrdersModule } from './modules/work-orders/work-orders.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { DevicesModule } from './modules/devices/devices.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MedicalRecordsModule } from './modules/medical-records/medical-records.module';
import { DentalChartsModule } from './modules/dental-charts/dental-charts.module';
import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';
import { BodyChartsModule } from './modules/body-charts/body-charts.module';

// Public Endpoints (B2C)
import { PublicModule } from './modules/public/public.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { BillingModule } from './modules/billing/billing.module';
import { PackagesModule } from './modules/packages/packages.module';
import { GiftCardsModule } from './modules/gift-cards/gift-cards.module';

@Module({
    imports: [
        // Global config
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),

        // Serve Static Files (Gallery/Avatars)
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'uploads'),
            serveRoot: '/uploads', // e.g. http://localhost:3001/uploads/gallery/archivo.jpg
        }),

        // Database
        PrismaModule,

        // Background Jobs
        ScheduleModule.forRoot(),

        // Core modules
        HealthModule,
        AuthModule,
        UsersModule,
        BusinessesModule,
        CategoriesModule,
        ServicesModule,
        BookingsModule,
        BusinessMembersModule,

        // Platform administration
        SuperAdminModule,

        PosModule,

        InventoryModule,

        FormsModule,

        LoyaltyModule,

        PaymentsModule,
        ReviewsModule,
        ReportsModule,
        GalleryModule,

        // Automotive Vertical
        MedicalRecordsModule,
        DentalChartsModule,
        PrescriptionsModule,
        BodyChartsModule,
        DevicesModule,
        NotificationsModule,

        // Public API
        PublicModule,

        SubscriptionsModule,

        DashboardModule,

        BillingModule,

        PackagesModule,

        GiftCardsModule,

        GalleryModule,
    ],
})
export class AppModule { }
