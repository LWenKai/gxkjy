import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { AiInterpretationsModule } from './modules/ai-interpretations/ai-interpretations.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { ClientDashboardModule } from './modules/client-dashboard/client-dashboard.module';
import { ClientScreenModule } from './modules/client-screen/client-screen.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { CompanyProfilesModule } from './modules/company-profiles/company-profiles.module';
import { CompanyUsersModule } from './modules/company-users/company-users.module';
import { CustomersModule } from './modules/customers/customers.module';
import { CustomerQuoteAttachmentsModule } from './modules/customer-quote-attachments/customer-quote-attachments.module';
import { PurchaseOrdersModule } from './modules/customer-purchase-orders/purchase-orders.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DetectionRecordsModule } from './modules/detection-records/detection-records.module';
import { DevicesModule } from './modules/devices/devices.module';
import { HealthController } from './modules/health.controller';
import { ManufacturerInterfacesModule } from './modules/manufacturer-interfaces/manufacturer-interfaces.module';
import { ManufacturerUploadLogsModule } from './modules/manufacturer-upload-logs/manufacturer-upload-logs.module';
import { MiniappPreviewModule } from './modules/miniapp-preview/miniapp-preview.module';
import { OperationLogsModule } from './modules/operation-logs/operation-logs.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { PrintersModule } from './modules/printers/printers.module';
import { ProductsModule } from './modules/products/products.module';
import { SalesProductPackagesModule } from './modules/sales-product-packages/sales-product-packages.module';
import { SalesProductsModule } from './modules/sales-products/sales-products.module';
import { SalesQuotesModule } from './modules/sales-quotes/sales-quotes.module';
import { SystemSettingsModule } from './modules/system-settings/system-settings.module';
import { WebsiteModule } from './modules/website/website.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    PrismaModule,
    AuthModule,
    AiInterpretationsModule,
    OperationLogsModule,
    DashboardModule,
    CompaniesModule,
    CompanyProfilesModule,
    CompanyUsersModule,
    CustomersModule,
    CustomerQuoteAttachmentsModule,
    PurchaseOrdersModule,
    ManufacturerInterfacesModule,
    ManufacturerUploadLogsModule,
    DevicesModule,
    DetectionRecordsModule,
    CertificatesModule,
    MiniappPreviewModule,
    ClientDashboardModule,
    ClientScreenModule,
    ProductsModule,
    SalesProductPackagesModule,
    SalesProductsModule,
    SalesQuotesModule,
    PrintersModule,
    SystemSettingsModule,
    WebsiteModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
