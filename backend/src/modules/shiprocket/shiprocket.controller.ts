import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ShiprocketService } from './shiprocket.service';
import { CreateShiprocketOrderDto, GenerateAwbDto } from './dto/shiprocket.dto';

@Controller('shiprocket')
export class ShiprocketController {
  constructor(private readonly shiprocketService: ShiprocketService) {}

  /** Add Seller Store Pickup Location */
  @UseGuards(JwtAuthGuard)
  @Post('pickup-location/:storeId')
  addPickupLocation(@Param('storeId') storeId: string) {
    return this.shiprocketService.addPickupLocation(storeId);
  }

  /** Create Multi-Vendor Shipment Order */
  @UseGuards(JwtAuthGuard)
  @Post('orders')
  createOrder(@Body() dto: CreateShiprocketOrderDto) {
    return this.shiprocketService.createShipmentOrder(dto);
  }

  /** Assign AWB Tracking Number */
  @UseGuards(JwtAuthGuard)
  @Post('awb')
  assignAwb(@Body() dto: GenerateAwbDto) {
    return this.shiprocketService.assignAwb(dto);
  }

  /** Shiprocket Real-time Tracking Webhook */
  @Post('webhook')
  handleWebhook(@Body() body: any) {
    return this.shiprocketService.handleWebhook(body);
  }
}
