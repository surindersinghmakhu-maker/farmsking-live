import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { NurseryService } from './nursery.service';
import { CreateNurseryBatchDto } from './dto/create-nursery-batch.dto';
import { CreateNurseryOrderDto } from './dto/create-nursery-order.dto';
import { ConfirmDeliveryDto } from './dto/confirm-delivery.dto';
import { ExtendDateDto } from './dto/extend-date.dto';
import { CancelNurseryOrderDto } from './dto/cancel-nursery-order.dto';
import { LogEnquiryDto } from './dto/log-enquiry.dto';
import { UpdateDispatchDto } from './dto/update-dispatch.dto';
import { NurseryCategoryType } from '@prisma/client';

@ApiTags('Nursery Marketplace')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('nursery')
export class NurseryController {
  constructor(private readonly nurseryService: NurseryService) {}

  // ─── Buyer / General Nursery Endpoints ───

  @Get('batches')
  @ApiOperation({ summary: 'List ready-for-sale nursery seedling batches' })
  async listBatches(
    @Query('category') category?: NurseryCategoryType,
    @Query('search') search?: string,
    @Query('isFlashSaleOnly') isFlashSaleOnly?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.nurseryService.listBatches({
      category,
      search,
      isFlashSaleOnly: isFlashSaleOnly === 'true',
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('batches/:id')
  @ApiOperation({ summary: 'Get details of a specific nursery batch' })
  async getBatchById(@Param('id') id: string) {
    return this.nurseryService.getBatchById(id);
  }

  @Post('orders')
  @ApiOperation({ summary: 'Book nursery seedlings with central escrow protection' })
  async createOrder(@CurrentUser() user: AuthUser, @Body() dto: CreateNurseryOrderDto) {
    return this.nurseryService.createOrder(user.id, dto);
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'List orders placed by the current logged-in buyer' })
  async getMyOrders(@CurrentUser() user: AuthUser) {
    return this.nurseryService.getMyOrders(user.id);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get detailed order tracking and delivery details' })
  async getOrderById(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.nurseryService.getOrderById(user.id, id);
  }

  @Post('orders/:id/confirm-delivery')
  @ApiOperation({ summary: 'Confirm delivery via 4-digit OTP and trigger escrow payout release' })
  async confirmDeliveryReceived(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ConfirmDeliveryDto,
  ) {
    return this.nurseryService.confirmDeliveryReceived(user.id, id, dto);
  }

  @Post('orders/:id/extend-date')
  @ApiOperation({ summary: 'Extend delivery date for free (>48h notice required)' })
  async extendOrderDate(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ExtendDateDto,
  ) {
    return this.nurseryService.extendOrderDate(user.id, id, dto);
  }

  @Post('orders/:id/cancel')
  @ApiOperation({ summary: 'Cancel order subject to 3-tier cancellation fine schedule' })
  async cancelOrder(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CancelNurseryOrderDto,
  ) {
    return this.nurseryService.cancelOrder(user.id, id, dto);
  }

  // ─── Nursery Grower Management Endpoints ───

  @Post('grower/batches')
  @ApiOperation({ summary: 'List a new seedling/plug batch for sale' })
  async createBatch(@CurrentUser() user: AuthUser, @Body() dto: CreateNurseryBatchDto) {
    return this.nurseryService.createBatch(user.id, dto);
  }

  @Get('grower/batches')
  @ApiOperation({ summary: 'List all batches owned by the logged-in grower' })
  async getMyGrowerBatches(@CurrentUser() user: AuthUser) {
    return this.nurseryService.getMyGrowerBatches(user.id);
  }

  @Get('grower/orders')
  @ApiOperation({ summary: 'List incoming orders for the logged-in grower' })
  async getMyGrowerOrders(@CurrentUser() user: AuthUser) {
    return this.nurseryService.getMyGrowerOrders(user.id);
  }

  @Patch('grower/orders/:id/dispatch')
  @ApiOperation({ summary: 'Update bus/railway parcel tracking info and mark dispatched' })
  async updateDispatchDetails(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateDispatchDto,
  ) {
    return this.nurseryService.updateDispatchDetails(user.id, id, dto);
  }

  // ─── Local Field Partner (Agent) Endpoints ───

  @Post('agent/enquiry')
  @ApiOperation({ summary: 'Agent logs enquiry/issue on behalf of farmer' })
  async logEnquiryTicket(@CurrentUser() user: AuthUser, @Body() dto: LogEnquiryDto) {
    return this.nurseryService.logEnquiryTicket(user.id, dto);
  }

  @Get('agent/orders')
  @ApiOperation({ summary: 'Get assigned orders for field agent coordination' })
  async getAgentOrders(@CurrentUser() user: AuthUser) {
    return this.nurseryService.getAgentOrders(user.id);
  }
}

