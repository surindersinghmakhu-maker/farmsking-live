import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiprocketOrderDto, GenerateAwbDto } from './dto/shiprocket.dto';
export declare class ShiprocketService {
    private readonly configService;
    private readonly prisma;
    private readonly logger;
    private token;
    private tokenExpiresAt;
    private readonly baseUrl;
    constructor(configService: ConfigService, prisma: PrismaService);
    private getAuthToken;
    addPickupLocation(storeId: string): Promise<any>;
    createShipmentOrder(dto: CreateShiprocketOrderDto, sellerStoreId?: string): Promise<any>;
    assignAwb(dto: GenerateAwbDto): Promise<any>;
    handleWebhook(body: any): Promise<{
        status: string;
        awbCode?: undefined;
        currentStatus?: undefined;
    } | {
        status: string;
        awbCode: any;
        currentStatus: any;
    }>;
}
