import { Body, Controller, Headers, Param, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ShiprocketService } from './shiprocket.service';
import { CreateShiprocketOrderDto, GenerateAwbDto } from './dto/shiprocket.dto';

@Controller('shiprocket')
export class ShiprocketController {
  constructor(private readonly shiprocketService: ShiprocketService) {}

  /** Add Seller Store Pickup Location (Staff/Admin Only) */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.OPERATOR)
  @Post('pickup-location/:storeId')
  addPickupLocation(@Param('storeId') storeId: string) {
    return this.shiprocketService.addPickupLocation(storeId);
  }

  /** Create Multi-Vendor Shipment Order (Staff/Admin Only) */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.OPERATOR)
  @Post('orders')
  createOrder(@Body() dto: CreateShiprocketOrderDto) {
    return this.shiprocketService.createShipmentOrder(dto);
  }

  /** Assign AWB Tracking Number (Staff/Admin Only) */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.OPERATOR)
  @Post('awb')
  assignAwb(@Body() dto: GenerateAwbDto) {
    return this.shiprocketService.assignAwb(dto);
  }

  /** Shiprocket Real-time Tracking Webhook */
  @Post('webhook')
  handleWebhook(@Body() body: any, @Headers('x-api-key') apiKey?: string) {
    const expectedSecret = process.env.SHIPROCKET_WEBHOOK_SECRET;
    if (expectedSecret && apiKey !== expectedSecret) {
      throw new UnauthorizedException('Invalid Shiprocket webhook signature.');
    }
    return this.shiprocketService.handleWebhook(body);
  }
}
