import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { FarmsModule } from './modules/farms/farms.module';
import { PlotsModule } from './modules/plots/plots.module';
import { CropsModule } from './modules/crops/crops.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { MarketRatesModule } from './modules/market-rates/market-rates.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { AdvisorAssignmentModule } from './modules/advisor-assignment/advisor-assignment.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { CropActivitySchedulesModule } from './modules/crop-activity-schedules/crop-activity-schedules.module';
import { CropProblemsModule } from './modules/crop-problems/crop-problems.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    PrismaModule,
    AuthModule,
    FarmsModule,
    PlotsModule,
    CropsModule,
    DashboardModule,
    MarketRatesModule,
    ExpensesModule,
    UploadsModule,
    AdvisorAssignmentModule,
    SubscriptionsModule,
    CropActivitySchedulesModule,
    CropProblemsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
  ],
})
export class AppModule {}
