import { PrismaService } from '../prisma/prisma.service';
export declare class DashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getFarmerDashboard(): Promise<{
        profile: {
            name: string;
            location: string;
            avatarUrl: string;
        };
        netProfit: {
            amount: number;
            formattedAmount: string;
            changePercent: number;
            comparisonPeriod: string;
            trend: number[];
        };
        metrics: {
            totalSales: string;
            totalExpenses: string;
            roi: string;
        };
        farmOverview: {
            totalFarms: number;
            totalLandAcres: number;
            activeCropsCount: number;
        };
        todaySchedule: {
            id: string;
            title: string;
            subtitle: string;
            time: string;
            type: string;
        }[];
        alerts: {
            id: string;
            title: string;
            subtitle: string;
            severity: string;
        }[];
    }>;
    getAdvisorDashboard(): Promise<{
        profile: {
            name: string;
            roleTitle: string;
            avatarUrl: string;
        };
        assignedFarmers: {
            count: number;
            periodText: string;
            trend: number[];
        };
        metrics: {
            activeFarms: number;
            cropConsultations: number;
            followUps: number;
        };
        todayTasks: {
            id: string;
            title: string;
            subtitle: string;
            time: string;
        }[];
        farmHealth: {
            healthy: number;
            attention: number;
            critical: number;
        };
        recentActivities: {
            id: string;
            title: string;
            detail: string;
            timeAgo: string;
        }[];
    }>;
    getGardenAdvisorDashboard(): Promise<{
        profile: {
            name: string;
            roleTitle: string;
            avatarUrl: string;
        };
        assignedGardeners: {
            count: number;
            periodText: string;
            trend: number[];
        };
        metrics: {
            activeGardens: number;
            consultations: number;
            followUps: number;
        };
        todayTasks: {
            id: string;
            title: string;
            client: string;
            time: string;
            color: string;
        }[];
        gardenHealth: {
            excellent: number;
            attention: number;
            critical: number;
        };
        recentActivities: {
            id: string;
            title: string;
            desc: string;
            time: string;
        }[];
    }>;
    getGardenerDashboard(): Promise<{
        profile: {
            name: string;
            roleTitle: string;
            avatarUrl: string;
        };
        todayVisits: {
            count: number;
            statusText: string;
        };
        metrics: {
            activeGardens: number;
            maintenance: number;
            completed: number;
        };
        todaySchedule: {
            id: string;
            title: string;
            location: string;
            time: string;
        }[];
        gardenHealthScore: {
            score: number;
            ratingText: string;
            breakdown: {
                excellent: number;
                good: number;
                attention: number;
                poor: number;
            };
        };
        toolsInventory: {
            id: string;
            label: string;
            icon: string;
        }[];
    }>;
    getCustomerDashboard(): Promise<{
        profile: {
            name: string;
            roleTitle: string;
            avatarUrl: string;
        };
        myOrdersSummary: {
            inProgressCount: number;
        };
        topCategories: {
            id: string;
            name: string;
            icon: string;
        }[];
        myOrders: {
            id: string;
            orderNumber: string;
            title: string;
            price: string;
            status: string;
            statusColor: string;
        }[];
        recentProducts: {
            id: string;
            name: string;
            price: string;
            rating: number;
            imageUrl: string;
        }[];
        supportShortcuts: {
            id: string;
            title: string;
            icon: string;
        }[];
    }>;
    getPartnerDashboard(): Promise<{
        profile: {
            name: string;
            roleTitle: string;
            avatarUrl: string;
        };
        thisMonthEarnings: {
            amount: number;
            formattedAmount: string;
            changePercent: number;
            comparisonPeriod: string;
            chartData: number[];
        };
        metrics: {
            totalReferrals: number;
            activeReferrals: number;
            totalEarnings: string;
        };
        earningsOverview: {
            commission: string;
            paid: string;
            pending: string;
        };
        recentReferrals: {
            id: string;
            name: string;
            joinedDate: string;
            commission: string;
        }[];
        marketingTools: {
            id: string;
            title: string;
            icon: string;
        }[];
    }>;
}
