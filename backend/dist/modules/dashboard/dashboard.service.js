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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getFarmerDashboard() {
        return {
            profile: {
                name: 'Balwinder Singh',
                location: 'Bathinda, Punjab',
                avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            },
            netProfit: {
                amount: 220000,
                formattedAmount: '₹2,20,000',
                changePercent: 18.5,
                comparisonPeriod: 'vs Last Season',
                trend: [120000, 140000, 160000, 150000, 190000, 220000],
            },
            metrics: {
                totalSales: '₹4,65,000',
                totalExpenses: '₹2,45,000',
                roi: '89.8%',
            },
            farmOverview: {
                totalFarms: 3,
                totalLandAcres: 12.5,
                activeCropsCount: 5,
            },
            todaySchedule: [
                { id: '1', title: 'Spray Schedule', subtitle: 'Marigold - Plot A', time: '10:00 AM', type: 'SPRAY' },
                { id: '2', title: 'Fertilizer Application', subtitle: 'Rose - Plot B', time: '02:00 PM', type: 'FERTILIZER' },
                { id: '3', title: 'Irrigation', subtitle: 'Wheat - Plot C', time: '04:00 PM', type: 'IRRIGATION' },
            ],
            alerts: [
                { id: 'a1', title: '2 Payments are Overdue', subtitle: 'Total Amount: ₹25,000', severity: 'HIGH' },
                { id: 'a2', title: 'Spray Due Tomorrow', subtitle: 'Marigold - Plot A', severity: 'MEDIUM' },
                { id: 'a3', title: 'Low Stock Alert', subtitle: 'DAP Fertilizer (10 Bags Left)', severity: 'LOW' },
            ],
        };
    }
    async getAdvisorDashboard() {
        return {
            profile: {
                name: 'Gurpreet Singh',
                roleTitle: 'Agriculture Advisor',
                avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
            },
            assignedFarmers: {
                count: 25,
                periodText: 'Active This Month',
                trend: [18, 20, 21, 23, 24, 25],
            },
            metrics: {
                activeFarms: 42,
                cropConsultations: 128,
                followUps: 36,
            },
            todayTasks: [
                { id: 't1', title: 'Farm Visit', subtitle: 'Kartar Singh Farm', time: '10:00 AM' },
                { id: 't2', title: 'Crop Problem Review', subtitle: 'Harjeet Singh', time: '11:30 AM' },
                { id: 't3', title: 'Schedule Spray', subtitle: 'Balwinder Singh Farm', time: '02:00 PM' },
                { id: 't4', title: 'Follow-up', subtitle: 'Rakesh Kumar', time: '04:30 PM' },
            ],
            farmHealth: {
                healthy: 28,
                attention: 10,
                critical: 4,
            },
            recentActivities: [
                { id: 'r1', title: 'New Problem Report', detail: 'Balwinder Singh - Marigold', timeAgo: '2m ago' },
                { id: 'r2', title: 'Spray Schedule Added', detail: 'Kartar Singh Farm', timeAgo: '15m ago' },
                { id: 'r3', title: 'Recommendation Sent', detail: 'Rakesh Kumar', timeAgo: '45m ago' },
            ],
        };
    }
    async getGardenAdvisorDashboard() {
        return {
            profile: {
                name: 'Meena Sharma',
                roleTitle: 'My Gardeners Specialist',
                avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
            },
            assignedGardeners: {
                count: 18,
                periodText: 'Active This Month',
                trend: [10, 12, 14, 15, 17, 18],
            },
            metrics: {
                activeGardens: 29,
                consultations: 76,
                followUps: 21,
            },
            todayTasks: [
                { id: 'gt1', title: 'Garden Visit & Assessment', client: 'Sukh Villas - Rose Garden', time: '09:30 AM', color: '#10b981' },
                { id: 'gt2', title: 'Plant Health Review', client: 'Ranjeet Kumar', time: '11:00 AM', color: '#3b82f6' },
                { id: 'gt3', title: 'Schedule Pruning & Care', client: 'Green Valley Lawn', time: '01:30 PM', color: '#166534' },
                { id: 'gt4', title: 'Landscape Follow-up', client: 'Palm Resort Landscape', time: '04:00 PM', color: '#a855f7' },
            ],
            gardenHealth: {
                excellent: 21,
                attention: 6,
                critical: 2,
            },
            recentActivities: [
                { id: 'ga1', title: 'New Care Request', desc: 'Ranjeet Kumar - Rose Garden', time: '5m ago' },
                { id: 'ga2', title: 'Pruning Schedule Added', desc: 'Green Valley Lawn', time: '20m ago' },
                { id: 'ga3', title: 'Recommendation Sent', desc: 'Palm Resort Landscape', time: '1h ago' },
            ],
        };
    }
    async getGardenerDashboard() {
        return {
            profile: {
                name: 'Ranjeet Kumar',
                roleTitle: 'My Garden Care Expert',
                avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
            },
            todayVisits: {
                count: 8,
                statusText: 'Scheduled',
            },
            metrics: {
                activeGardens: 16,
                maintenance: 5,
                completed: 11,
            },
            todaySchedule: [
                { id: 'g1', title: 'Garden Maintenance', location: 'Sukh Villas - Rose Garden', time: '09:00 AM' },
                { id: 'g2', title: 'Plant Pruning', location: 'Green Valley - Lawn Area', time: '11:00 AM' },
                { id: 'g3', title: 'Fertilizer Application', location: 'City Park - Flower Beds', time: '02:00 PM' },
                { id: 'g4', title: 'Irrigation Check', location: 'Palm Resort - Landscape', time: '04:00 PM' },
            ],
            gardenHealthScore: {
                score: 85,
                ratingText: 'Excellent',
                breakdown: {
                    excellent: 10,
                    good: 4,
                    attention: 2,
                    poor: 0,
                },
            },
            toolsInventory: [
                { id: 'ti1', label: 'My Tools', icon: 'wrench' },
                { id: 'ti2', label: 'Inventory', icon: 'box' },
                { id: 'ti3', label: '+ Add Usage', icon: 'plus-square' },
                { id: 'ti4', label: 'Requests', icon: 'file-text' },
            ],
        };
    }
    async getCustomerDashboard() {
        return {
            profile: {
                name: 'Aman Verma',
                roleTitle: 'Happy Customer',
                avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
            },
            myOrdersSummary: {
                inProgressCount: 3,
            },
            topCategories: [
                { id: 'c1', name: 'Seeds', icon: 'leaf' },
                { id: 'c2', name: 'Fertilizers', icon: 'flask' },
                { id: 'c3', name: 'Pesticides', icon: 'shield-alert' },
                { id: 'c4', name: 'Tools', icon: 'tool' },
                { id: 'c5', name: 'More', icon: 'grid' },
            ],
            myOrders: [
                { id: 'o1', orderNumber: '#ORD1234', title: 'Marigold Seeds - 1kg', price: '₹450', status: 'In Transit', statusColor: '#1e5aa8' },
                { id: 'o2', orderNumber: '#ORD1235', title: 'Organic Compost - 5kg', price: '₹350', status: 'Processing', statusColor: '#d96b27' },
                { id: 'o3', orderNumber: '#ORD1236', title: 'Neem Oil - 1L', price: '₹280', status: 'Confirmed', statusColor: '#106e40' },
            ],
            recentProducts: [
                { id: 'p1', name: 'Marigold Seeds', price: '₹450', rating: 4.5, imageUrl: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=200' },
                { id: 'p2', name: 'Organic Compost', price: '₹350', rating: 4.4, imageUrl: 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?w=200' },
                { id: 'p3', name: 'Neem Oil', price: '₹280', rating: 4.4, imageUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=200' },
            ],
            supportShortcuts: [
                { id: 's1', title: 'Track Order', icon: 'map-pin' },
                { id: 's2', title: 'My Addresses', icon: 'navigation' },
                { id: 's3', title: 'Contact Us', icon: 'phone-call' },
                { id: 's4', title: 'Help Center', icon: 'help-circle' },
            ],
        };
    }
    async getPartnerDashboard() {
        return {
            profile: {
                name: 'Vikram Malhotra',
                roleTitle: 'Business Partner',
                avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            },
            thisMonthEarnings: {
                amount: 18750,
                formattedAmount: '₹18,750',
                changePercent: 22.4,
                comparisonPeriod: 'vs Last Month',
                chartData: [8500, 11200, 14000, 12500, 16800, 18750],
            },
            metrics: {
                totalReferrals: 56,
                activeReferrals: 34,
                totalEarnings: '₹1,25,000',
            },
            earningsOverview: {
                commission: '₹18,750',
                paid: '₹15,200',
                pending: '₹3,550',
            },
            recentReferrals: [
                { id: 'rf1', name: 'Rakesh Kumar', joinedDate: 'Joined on 18 May 2026', commission: '₹750' },
                { id: 'rf2', name: 'Sukhdeep Singh', joinedDate: 'Joined on 17 May 2026', commission: '₹750' },
                { id: 'rf3', name: 'Harpreet Kaur', joinedDate: 'Joined on 16 May 2026', commission: '₹750' },
            ],
            marketingTools: [
                { id: 'm1', title: 'Referral Link', icon: 'link' },
                { id: 'm2', title: 'Share Poster', icon: 'share-2' },
                { id: 'm3', title: 'Social Share', icon: 'globe' },
                { id: 'm4', title: 'Banners', icon: 'image' },
            ],
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map