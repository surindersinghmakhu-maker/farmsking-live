"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ShiprocketService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiprocketService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let ShiprocketService = ShiprocketService_1 = class ShiprocketService {
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(ShiprocketService_1.name);
        this.token = null;
        this.tokenExpiresAt = 0;
        this.baseUrl = 'https://apiv2.shiprocket.in/v1/external';
    }
    async getAuthToken() {
        const now = Date.now();
        if (this.token && now < this.tokenExpiresAt) {
            return this.token;
        }
        const email = this.configService.get('SHIPROCKET_EMAIL');
        const password = this.configService.get('SHIPROCKET_PASSWORD');
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
                throw new common_1.BadRequestException(data?.message || 'Shiprocket authentication failed.');
            }
            this.token = data.token || 'MOCK_SHIPROCKET_TOKEN';
            this.tokenExpiresAt = now + 9 * 24 * 60 * 60 * 1000;
            return this.token;
        }
        catch (error) {
            this.logger.error('Error authenticating with Shiprocket:', error);
            throw new common_1.InternalServerErrorException('Shiprocket auth error');
        }
    }
    async addPickupLocation(storeId) {
        const store = await this.prisma.sellerStore.findUnique({ where: { id: storeId } });
        if (!store) {
            throw new common_1.BadRequestException('Seller store not found.');
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
        }
        catch (error) {
            this.logger.error('Error adding Shiprocket pickup location:', error);
            return { status: 'FALLBACK', pickup_location: pickupLocationName };
        }
    }
    async createShipmentOrder(dto, sellerStoreId) {
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
            const order = await this.prisma.customerOrder.findUnique({ where: { orderNumber: dto.orderId } });
            if (order) {
                await this.prisma.shippingLog.create({
                    data: {
                        orderId: order.id,
                        sellerStoreId,
                        shiprocketOrderId,
                        shiprocketShipmentId: shipmentId,
                        status: client_1.ShipmentStatus.MANIFESTED,
                    },
                });
            }
            return resData;
        }
        catch (error) {
            this.logger.error('Error creating Shiprocket order:', error);
            throw new common_1.InternalServerErrorException('Failed to create Shiprocket shipment');
        }
    }
    async assignAwb(dto) {
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
                        status: client_1.ShipmentStatus.PICKUP_SCHEDULED,
                    },
                });
            }
            return resData;
        }
        catch (error) {
            this.logger.error('Error assigning AWB:', error);
            throw new common_1.InternalServerErrorException('Failed to assign AWB');
        }
    }
    async handleWebhook(body) {
        this.logger.log(`Shiprocket Webhook received: ${JSON.stringify(body)}`);
        const awbCode = body?.awb;
        const currentStatus = body?.current_status?.toUpperCase();
        if (!awbCode)
            return { status: 'NO_AWB' };
        let dbStatus = client_1.ShipmentStatus.IN_TRANSIT;
        let orderStatus = client_1.OrderStatus.DISPATCHED;
        if (currentStatus.includes('DELIVERED')) {
            dbStatus = client_1.ShipmentStatus.DELIVERED;
            orderStatus = client_1.OrderStatus.DELIVERED;
        }
        else if (currentStatus.includes('OUT FOR DELIVERY')) {
            dbStatus = client_1.ShipmentStatus.OUT_FOR_DELIVERY;
        }
        else if (currentStatus.includes('RTO')) {
            dbStatus = client_1.ShipmentStatus.RTO_INITIATED;
        }
        const log = await this.prisma.shippingLog.findFirst({ where: { awbCode } });
        if (log) {
            await this.prisma.shippingLog.update({
                where: { id: log.id },
                data: {
                    status: dbStatus,
                    deliveredAt: dbStatus === client_1.ShipmentStatus.DELIVERED ? new Date() : log.deliveredAt,
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
};
exports.ShiprocketService = ShiprocketService;
exports.ShiprocketService = ShiprocketService = ShiprocketService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], ShiprocketService);
//# sourceMappingURL=shiprocket.service.js.map