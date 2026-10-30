import { ShiprocketService } from './shiprocket.service';
import { CreateShiprocketOrderDto, GenerateAwbDto } from './dto/shiprocket.dto';
export declare class ShiprocketController {
    private readonly shiprocketService;
    constructor(shiprocketService: ShiprocketService);
    addPickupLocation(storeId: string): Promise<any>;
    createOrder(dto: CreateShiprocketOrderDto): Promise<any>;
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
