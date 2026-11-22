import { PrismaService } from '../prisma/prisma.service';
import { GardenerPlansService } from '../gardener-plans/gardener-plans.service';
import { AiChatService } from '../ai-chat/ai-chat.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateGardenDto } from './dto/create-garden.dto';
import { CreatePlantDto } from './dto/create-plant.dto';
import { CreateGardenExpenseDto } from './dto/create-garden-expense.dto';
import { CreatePlantCareScheduleDto } from './dto/create-plant-care-schedule.dto';
import { LogPlantHealthDto } from './dto/log-plant-health.dto';
import { DiagnosePlantDto } from './dto/diagnose-plant.dto';
import { DoctorConsultationNoteDto, PrescribePlantCareDto } from './dto/prescribe-plant-care.dto';
export declare class GardensService {
    private readonly prisma;
    private readonly gardenerPlansService;
    private readonly aiChatService;
    constructor(prisma: PrismaService, gardenerPlansService: GardenerPlansService, aiChatService: AiChatService);
    create(user: AuthUser, dto: CreateGardenDto): import(".prisma/client").Prisma.Prisma__GardenClient<{
        id: string;
        name: string;
        gardenType: import(".prisma/client").$Enums.GardenType;
        location: string | null;
        area: number | null;
        sunlightExposure: string | null;
        wateringSource: string | null;
        healthScore: number;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        gardenerId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    findAll(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
        plants: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            gardenerId: string | null;
            deletedAt: Date | null;
            gardenId: string | null;
            customName: string | null;
            species: string | null;
            variety: string | null;
            photoUrl: string | null;
            locationType: string | null;
            potSizeInches: number | null;
            potType: string | null;
            healthStatus: string;
            plantedDate: Date | null;
            healthNotes: string | null;
        }[];
        schedules: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            gardenerId: string;
            nextDueDate: Date;
            gardenId: string | null;
            plantId: string;
            careType: import(".prisma/client").$Enums.PlantCareType;
            title: string;
            instructions: string | null;
            intervalDays: number;
            lastCompletedDate: Date | null;
            isReminderActive: boolean;
        }[];
    } & {
        id: string;
        name: string;
        gardenType: import(".prisma/client").$Enums.GardenType;
        location: string | null;
        area: number | null;
        sunlightExposure: string | null;
        wateringSource: string | null;
        healthScore: number;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        gardenerId: string;
    })[]>;
    findOneOrThrow(user: AuthUser, id: string): Promise<{
        plants: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            gardenerId: string | null;
            deletedAt: Date | null;
            gardenId: string | null;
            customName: string | null;
            species: string | null;
            variety: string | null;
            photoUrl: string | null;
            locationType: string | null;
            potSizeInches: number | null;
            potType: string | null;
            healthStatus: string;
            plantedDate: Date | null;
            healthNotes: string | null;
        }[];
        schedules: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            gardenerId: string;
            nextDueDate: Date;
            gardenId: string | null;
            plantId: string;
            careType: import(".prisma/client").$Enums.PlantCareType;
            title: string;
            instructions: string | null;
            intervalDays: number;
            lastCompletedDate: Date | null;
            isReminderActive: boolean;
        }[];
    } & {
        id: string;
        name: string;
        gardenType: import(".prisma/client").$Enums.GardenType;
        location: string | null;
        area: number | null;
        sunlightExposure: string | null;
        wateringSource: string | null;
        healthScore: number;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        gardenerId: string;
    }>;
    addPlant(user: AuthUser, gardenIdOrNull: string | undefined | null, dto: CreatePlantDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        gardenerId: string | null;
        deletedAt: Date | null;
        gardenId: string | null;
        customName: string | null;
        species: string | null;
        variety: string | null;
        photoUrl: string | null;
        locationType: string | null;
        potSizeInches: number | null;
        potType: string | null;
        healthStatus: string;
        plantedDate: Date | null;
        healthNotes: string | null;
    }>;
    listPlants(user: AuthUser, gardenId: string): Promise<({
        schedules: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            gardenerId: string;
            nextDueDate: Date;
            gardenId: string | null;
            plantId: string;
            careType: import(".prisma/client").$Enums.PlantCareType;
            title: string;
            instructions: string | null;
            intervalDays: number;
            lastCompletedDate: Date | null;
            isReminderActive: boolean;
        }[];
        healthLogs: {
            id: string;
            photoUrl: string;
            plantId: string;
            loggedAt: Date;
            conditionStatus: string;
            notes: string | null;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        gardenerId: string | null;
        deletedAt: Date | null;
        gardenId: string | null;
        customName: string | null;
        species: string | null;
        variety: string | null;
        photoUrl: string | null;
        locationType: string | null;
        potSizeInches: number | null;
        potType: string | null;
        healthStatus: string;
        plantedDate: Date | null;
        healthNotes: string | null;
    })[]>;
    listAllPlants(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
        schedules: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            gardenerId: string;
            nextDueDate: Date;
            gardenId: string | null;
            plantId: string;
            careType: import(".prisma/client").$Enums.PlantCareType;
            title: string;
            instructions: string | null;
            intervalDays: number;
            lastCompletedDate: Date | null;
            isReminderActive: boolean;
        }[];
        garden: {
            id: string;
            name: string;
            gardenType: import(".prisma/client").$Enums.GardenType;
        } | null;
        healthLogs: {
            id: string;
            photoUrl: string;
            plantId: string;
            loggedAt: Date;
            conditionStatus: string;
            notes: string | null;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        gardenerId: string | null;
        deletedAt: Date | null;
        gardenId: string | null;
        customName: string | null;
        species: string | null;
        variety: string | null;
        photoUrl: string | null;
        locationType: string | null;
        potSizeInches: number | null;
        potType: string | null;
        healthStatus: string;
        plantedDate: Date | null;
        healthNotes: string | null;
    })[]>;
    getPlantOrThrow(user: AuthUser, plantId: string): Promise<{
        schedules: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            gardenerId: string;
            nextDueDate: Date;
            gardenId: string | null;
            plantId: string;
            careType: import(".prisma/client").$Enums.PlantCareType;
            title: string;
            instructions: string | null;
            intervalDays: number;
            lastCompletedDate: Date | null;
            isReminderActive: boolean;
        }[];
        garden: {
            id: string;
            name: string;
            gardenType: import(".prisma/client").$Enums.GardenType;
            location: string | null;
            area: number | null;
            sunlightExposure: string | null;
            wateringSource: string | null;
            healthScore: number;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            gardenerId: string;
        } | null;
        healthLogs: {
            id: string;
            photoUrl: string;
            plantId: string;
            loggedAt: Date;
            conditionStatus: string;
            notes: string | null;
        }[];
        diagnoses: {
            id: string;
            createdAt: Date;
            gardenerId: string;
            plantId: string | null;
            leafPhotoUrl: string;
            detectedIssue: string;
            category: string;
            confidence: string;
            organicRemedy: string;
            chemicalRemedy: string | null;
            preventiveCare: string | null;
            expertConsultationId: string | null;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        gardenerId: string | null;
        deletedAt: Date | null;
        gardenId: string | null;
        customName: string | null;
        species: string | null;
        variety: string | null;
        photoUrl: string | null;
        locationType: string | null;
        potSizeInches: number | null;
        potType: string | null;
        healthStatus: string;
        plantedDate: Date | null;
        healthNotes: string | null;
    }>;
    addCareSchedule(user: AuthUser, dto: CreatePlantCareScheduleDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        gardenerId: string;
        nextDueDate: Date;
        gardenId: string | null;
        plantId: string;
        careType: import(".prisma/client").$Enums.PlantCareType;
        title: string;
        instructions: string | null;
        intervalDays: number;
        lastCompletedDate: Date | null;
        isReminderActive: boolean;
    }>;
    completeCareTask(user: AuthUser, scheduleId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        gardenerId: string;
        nextDueDate: Date;
        gardenId: string | null;
        plantId: string;
        careType: import(".prisma/client").$Enums.PlantCareType;
        title: string;
        instructions: string | null;
        intervalDays: number;
        lastCompletedDate: Date | null;
        isReminderActive: boolean;
    }>;
    listCareTasks(user: AuthUser, query?: {
        dueToday?: boolean;
    }): import(".prisma/client").Prisma.PrismaPromise<({
        garden: {
            id: string;
            name: string;
        } | null;
        plant: {
            id: string;
            name: string;
            photoUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        gardenerId: string;
        nextDueDate: Date;
        gardenId: string | null;
        plantId: string;
        careType: import(".prisma/client").$Enums.PlantCareType;
        title: string;
        instructions: string | null;
        intervalDays: number;
        lastCompletedDate: Date | null;
        isReminderActive: boolean;
    })[]>;
    logPlantHealth(user: AuthUser, dto: LogPlantHealthDto): Promise<{
        id: string;
        photoUrl: string;
        plantId: string;
        loggedAt: Date;
        conditionStatus: string;
        notes: string | null;
    }>;
    getAiCreditStatus(user: AuthUser): Promise<{
        monthlyQuota: number;
        usedThisMonth: number;
        bonusCredits: number;
        remainingCredits: number;
        resetDate: Date;
        isUnlimited: boolean;
    }>;
    diagnoseAndRecord(user: AuthUser, dto: DiagnosePlantDto): Promise<{
        aiResult: import("../ai-chat/ai-chat.service").LeafDiagnosisResult;
        diagnosis: {
            id: string;
            createdAt: Date;
            gardenerId: string;
            plantId: string | null;
            leafPhotoUrl: string;
            detectedIssue: string;
            category: string;
            confidence: string;
            organicRemedy: string;
            chemicalRemedy: string | null;
            preventiveCare: string | null;
            expertConsultationId: string | null;
        };
        creditStatus: {
            monthlyQuota: number;
            usedThisMonth: number;
            bonusCredits: number;
            remainingCredits: number;
            resetDate: Date;
            isUnlimited: boolean;
        };
    }>;
    recordPlantDiagnosis(user: AuthUser, dto: DiagnosePlantDto, aiResult: any): Promise<{
        id: string;
        createdAt: Date;
        gardenerId: string;
        plantId: string | null;
        leafPhotoUrl: string;
        detectedIssue: string;
        category: string;
        confidence: string;
        organicRemedy: string;
        chemicalRemedy: string | null;
        preventiveCare: string | null;
        expertConsultationId: string | null;
    }>;
    listDiagnoses(user: AuthUser, plantId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        plant: {
            id: string;
            name: string;
            locationType: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        gardenerId: string;
        plantId: string | null;
        leafPhotoUrl: string;
        detectedIssue: string;
        category: string;
        confidence: string;
        organicRemedy: string;
        chemicalRemedy: string | null;
        preventiveCare: string | null;
        expertConsultationId: string | null;
    })[]>;
    addExpense(user: AuthUser, dto: CreateGardenExpenseDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        gardenId: string;
        plantId: string | null;
        categoryName: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        expenseDate: Date;
        description: string | null;
        receiptPhotoUrl: string | null;
        recordedById: string;
    }>;
    listExpenses(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
        garden: {
            id: string;
            name: string;
        };
        plant: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        gardenId: string;
        plantId: string | null;
        categoryName: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        expenseDate: Date;
        description: string | null;
        receiptPhotoUrl: string | null;
        recordedById: string;
    })[]>;
    deleteExpense(user: AuthUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        gardenId: string;
        plantId: string | null;
        categoryName: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        expenseDate: Date;
        description: string | null;
        receiptPhotoUrl: string | null;
        recordedById: string;
    }>;
    verifyDoctorAccessOrThrow(doctorUser: AuthUser, gardenerId: string): Promise<boolean>;
    getBotanicalProfileForDoctor(doctorUser: AuthUser, gardenerId: string): Promise<{
        gardener: {
            id: string;
            name: string;
            mobile: string;
            photoUrl: string | null;
            kingId: string | null;
            village: string | null;
            district: string | null;
            state: string | null;
            gardenerPlan: {
                plan: import(".prisma/client").$Enums.GardenerSubscriptionPlan;
                startDate: Date;
                endDate: Date | null;
            } | null;
        };
        gardens: ({
            visits: {
                id: string;
                status: string;
                createdAt: Date;
                gardenId: string;
                notes: string | null;
                scheduledTime: Date;
                visitTitle: string;
            }[];
            plants: ({
                schedules: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    gardenerId: string;
                    nextDueDate: Date;
                    gardenId: string | null;
                    plantId: string;
                    careType: import(".prisma/client").$Enums.PlantCareType;
                    title: string;
                    instructions: string | null;
                    intervalDays: number;
                    lastCompletedDate: Date | null;
                    isReminderActive: boolean;
                }[];
                healthLogs: {
                    id: string;
                    photoUrl: string;
                    plantId: string;
                    loggedAt: Date;
                    conditionStatus: string;
                    notes: string | null;
                }[];
                diagnoses: {
                    id: string;
                    createdAt: Date;
                    gardenerId: string;
                    plantId: string | null;
                    leafPhotoUrl: string;
                    detectedIssue: string;
                    category: string;
                    confidence: string;
                    organicRemedy: string;
                    chemicalRemedy: string | null;
                    preventiveCare: string | null;
                    expertConsultationId: string | null;
                }[];
            } & {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                gardenerId: string | null;
                deletedAt: Date | null;
                gardenId: string | null;
                customName: string | null;
                species: string | null;
                variety: string | null;
                photoUrl: string | null;
                locationType: string | null;
                potSizeInches: number | null;
                potType: string | null;
                healthStatus: string;
                plantedDate: Date | null;
                healthNotes: string | null;
            })[];
            schedules: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                gardenerId: string;
                nextDueDate: Date;
                gardenId: string | null;
                plantId: string;
                careType: import(".prisma/client").$Enums.PlantCareType;
                title: string;
                instructions: string | null;
                intervalDays: number;
                lastCompletedDate: Date | null;
                isReminderActive: boolean;
            }[];
        } & {
            id: string;
            name: string;
            gardenType: import(".prisma/client").$Enums.GardenType;
            location: string | null;
            area: number | null;
            sunlightExposure: string | null;
            wateringSource: string | null;
            healthScore: number;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            gardenerId: string;
        })[];
        standalonePlants: ({
            schedules: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                gardenerId: string;
                nextDueDate: Date;
                gardenId: string | null;
                plantId: string;
                careType: import(".prisma/client").$Enums.PlantCareType;
                title: string;
                instructions: string | null;
                intervalDays: number;
                lastCompletedDate: Date | null;
                isReminderActive: boolean;
            }[];
            healthLogs: {
                id: string;
                photoUrl: string;
                plantId: string;
                loggedAt: Date;
                conditionStatus: string;
                notes: string | null;
            }[];
            diagnoses: {
                id: string;
                createdAt: Date;
                gardenerId: string;
                plantId: string | null;
                leafPhotoUrl: string;
                detectedIssue: string;
                category: string;
                confidence: string;
                organicRemedy: string;
                chemicalRemedy: string | null;
                preventiveCare: string | null;
                expertConsultationId: string | null;
            }[];
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            gardenerId: string | null;
            deletedAt: Date | null;
            gardenId: string | null;
            customName: string | null;
            species: string | null;
            variety: string | null;
            photoUrl: string | null;
            locationType: string | null;
            potSizeInches: number | null;
            potType: string | null;
            healthStatus: string;
            plantedDate: Date | null;
            healthNotes: string | null;
        })[];
        diagnoses: ({
            plant: {
                id: string;
                name: string;
                locationType: string | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            gardenerId: string;
            plantId: string | null;
            leafPhotoUrl: string;
            detectedIssue: string;
            category: string;
            confidence: string;
            organicRemedy: string;
            chemicalRemedy: string | null;
            preventiveCare: string | null;
            expertConsultationId: string | null;
        })[];
    }>;
    prescribeCareSchedule(doctorUser: AuthUser, dto: PrescribePlantCareDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        gardenerId: string;
        nextDueDate: Date;
        gardenId: string | null;
        plantId: string;
        careType: import(".prisma/client").$Enums.PlantCareType;
        title: string;
        instructions: string | null;
        intervalDays: number;
        lastCompletedDate: Date | null;
        isReminderActive: boolean;
    }>;
    recordDoctorConsultationNote(doctorUser: AuthUser, dto: DoctorConsultationNoteDto): Promise<{
        id: string;
        photoUrl: string;
        plantId: string;
        loggedAt: Date;
        conditionStatus: string;
        notes: string | null;
    }>;
    getDoctorGardenDashboard(doctorUser: AuthUser): Promise<{
        activeGardenersCount: number;
        pendingRequestsCount: number;
        monitoredGardensCount: number;
        monitoredPlantsCount: number;
        criticalPlantsCount: number;
        activeAssignments: ({
            farmer: {
                id: string;
                name: string;
                plants: {
                    id: string;
                    name: string;
                    healthStatus: string;
                }[];
                mobile: string;
                photoUrl: string | null;
                kingId: string | null;
                village: string | null;
                district: string | null;
                state: string | null;
                gardens: {
                    id: string;
                    name: string;
                    gardenType: import(".prisma/client").$Enums.GardenType;
                    healthScore: number;
                    plants: {
                        id: string;
                        name: string;
                        healthStatus: string;
                    }[];
                }[];
                gardenerPlan: {
                    plan: import(".prisma/client").$Enums.GardenerSubscriptionPlan;
                    endDate: Date | null;
                } | null;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            notes: string | null;
            startDate: Date;
            endDate: Date | null;
            advisorId: string;
            farmerId: string;
            assignedById: string | null;
            subscriptionId: string | null;
        })[];
        pendingAssignments: ({
            farmer: {
                id: string;
                name: string;
                mobile: string;
                photoUrl: string | null;
                kingId: string | null;
                village: string | null;
                district: string | null;
                state: string | null;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            notes: string | null;
            startDate: Date;
            endDate: Date | null;
            advisorId: string;
            farmerId: string;
            assignedById: string | null;
            subscriptionId: string | null;
        })[];
        recentDiagnoses: ({
            gardener: {
                id: string;
                name: string;
                mobile: string;
            };
            plant: {
                id: string;
                name: string;
                locationType: string | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            gardenerId: string;
            plantId: string | null;
            leafPhotoUrl: string;
            detectedIssue: string;
            category: string;
            confidence: string;
            organicRemedy: string;
            chemicalRemedy: string | null;
            preventiveCare: string | null;
            expertConsultationId: string | null;
        })[];
        wallet: {
            balance: number;
            totalEarnings: number;
        };
    }>;
}
