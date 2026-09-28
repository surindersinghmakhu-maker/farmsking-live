import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiprocketOrderDto, GenerateAwbDto } from './dto/shiprocket.dto';
import { ShipmentStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class ShiprocketService {
  private readonly logger = new Logger(ShiprocketService.name);
  private token: string | null = null;
  private tokenExpiresAt: number = 0;
  private readonly baseUrl = 'https://apiv2.shiprocket.in/v1/external';

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /** Get active Shiprocket bearer auth token */
  private async getAuthToken(): Promise<string> {
    const now = Date.now();
    if (this.token && now < this.tokenExpiresAt) {
      return this.token;
    }

    const email = this.configService.get<string>('SHIPROCKET_EMAIL');
    const password = this.configService.get<string>('SHIPROCKET_PASSWORD');

    if (!email || !password) {
      this.logger.warn('SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD missing from .env');
      return 'MOCK_SHIPROCKET_TOKEN';
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new BadRequestException(data?.message || 'Shiprocket authentication failed.');
      }

      this.token = data.token || 'MOCK_SHIPROCKET_TOKEN';
      this.tokenExpiresAt = now + 9 * 24 * 60 * 60 * 1000; // 9 days cache
      return this.token as string;
    } catch (error) {
      this.logger.error('Error authenticating with Shiprocket:', error);
      throw new InternalServerErrorException('Shiprocket auth error');
    }
  }

  /**
   * Register Seller Store Pickup Address on Shiprocket
   */
  async addPickupLocation(storeId: string) {
    const store = await this.prisma.sellerStore.findUnique({ where: { id: storeId } });
    if (!store) {
      throw new BadRequestException('Seller store not found.');
    }

    const token = await this.getAuthToken();
    const pickupLocationName = `HUB_${store.slug.substring(0, 10).toUpperCase()}`;

    const payload = {
      pickup_location: pickupLocationName,
      name: store.storeName,
      email: `${store.slug}@farmsking.in`,
      phone: '9876543210',
      address: store.pickupAddress || 'FarmsKing Hub',
      city: store.pickupCity || 'Ludhiana',
      state: store.pickupState || 'Punjab',
      country: 'India',
      pin_code: store.pickupPincode || '141001',
    };

    try {
      const response = await fetch(`${this.baseUrl}/settings/company/addpickup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (response.ok || resData?.success) {
        await this.prisma.sellerStore.update({
          where: { id: storeId },
          data: { shiprocketPickupLocationId: pickupLocationName },
        });
      }

      return resData;
    } catch (error) {
      this.logger.error('Error adding Shiprocket pickup location:', error);
      return { status: 'FALLBACK', pickup_location: pickupLocationName };
    }
  }

  /**
   * Create Multi-Vendor Shipment Order on Shiprocket
   */
  async createShipmentOrder(dto: CreateShiprocketOrderDto, sellerStoreId?: string) {
    const token = await this.getAuthToken();

    const payload = {
      order_id: dto.orderId,
      order_date: dto.orderDate,
      pickup_location: dto.pickupLocation,
      billing_customer_name: dto.billingCustomerName,
      billing_last_name: '',
      billing_address: dto.billingAddress,
      billing_city: dto.billingCity,
      billing_pincode: dto.billingPincode,
      billing_state: dto.billingState,
      billing_country: dto.billingCountry,
      billing_email: 'customer@farmsking.in',
      billing_phone: dto.billingPhone,
      shipping_is_billing: true,
      order_items: dto.orderItems.map((item) => ({
        name: item.name,
        sku: item.sku || 'FK-PROD',
        units: item.units,
        selling_price: item.sellingPrice,
        hsn: item.hsn || '120991',
      })),
      payment_method: 'Prepaid',
      sub_total: dto.orderItems.reduce((acc, curr) => acc + curr.sellingPrice * curr.units, 0),
      length: dto.length || 10,
      breadth: dto.width || 10,
      height: dto.height || 10,
      weight: dto.weight || 0.5,
    };

    try {
      const response = await fetch(`${this.baseUrl}/orders/create/adhoc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      const shiprocketOrderId = resData?.order_id?.toString() || dto.orderId;
      const shipmentId = resData?.shipment_id?.toString() || `SHIP-${dto.orderId}`;

      // Save Shipping Log in Database
      const order = await this.prisma.customerOrder.findUnique({ where: { orderNumber: dto.orderId } });

      if (order) {
        await this.prisma.shippingLog.create({
          data: {
            orderId: order.id,
            sellerStoreId,
            shiprocketOrderId,
            shiprocketShipmentId: shipmentId,
            status: ShipmentStatus.MANIFESTED,
          },
        });
      }

      return resData;
    } catch (error) {
      this.logger.error('Error creating Shiprocket order:', error);
      throw new InternalServerErrorException('Failed to create Shiprocket shipment');
    }
  }

  /**
   * Assign AWB Tracking Number to Shipment
   */
  async assignAwb(dto: GenerateAwbDto) {
    const token = await this.getAuthToken();

    try {
      const response = await fetch(`${this.baseUrl}/courier/assign/awb`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shipment_id: dto.shipmentId,
          courier_id: dto.courierId,
        }),
      });

      const resData = await response.json();

      if (resData?.response?.data?.awb_code) {
        const awbCode = resData.response.data.awb_code;
        const courierName = resData.response.data.courier_name;

        await this.prisma.shippingLog.updateMany({
          where: { shiprocketShipmentId: dto.shipmentId },
          data: {
            awbCode,
            courierName,
            status: ShipmentStatus.PICKUP_SCHEDULED,
          },
        });
      }

      return resData;
    } catch (error) {
      this.logger.error('Error assigning AWB:', error);
      throw new InternalServerErrorException('Failed to assign AWB');
    }
  }

  /**
   * Real-time Tracking & Status Webhook Handler
   */
  async handleWebhook(body: any) {
    this.logger.log(`Shiprocket Webhook received: ${JSON.stringify(body)}`);

    const awbCode = body?.awb;
    const currentStatus = body?.current_status?.toUpperCase();

    if (!awbCode) return { status: 'NO_AWB' };

    let dbStatus: ShipmentStatus = ShipmentStatus.IN_TRANSIT;
    let orderStatus: OrderStatus = OrderStatus.DISPATCHED;

    if (currentStatus.includes('DELIVERED')) {
      dbStatus = ShipmentStatus.DELIVERED;
      orderStatus = OrderStatus.DELIVERED;
    } else if (currentStatus.includes('OUT FOR DELIVERY')) {
      dbStatus = ShipmentStatus.OUT_FOR_DELIVERY;
    } else if (currentStatus.includes('RTO')) {
      dbStatus = ShipmentStatus.RTO_INITIATED;
    }

    const log = await this.prisma.shippingLog.findFirst({ where: { awbCode } });

    if (log) {
      await this.prisma.shippingLog.update({
        where: { id: log.id },
        data: {
          status: dbStatus,
          deliveredAt: dbStatus === ShipmentStatus.DELIVERED ? new Date() : log.deliveredAt,
        },
      });

      await this.prisma.customerOrder.update({
        where: { id: log.orderId },
        data: {
          status: orderStatus,
          courierName: log.courierName || 'Shiprocket Courier',
          trackingId: awbCode,
        },
      });
    }

    return { status: 'PROCESSED', awbCode, currentStatus };
  }
}
