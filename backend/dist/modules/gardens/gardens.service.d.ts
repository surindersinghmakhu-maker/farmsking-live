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
        createdAt: Date;
        updatedAt: Date;
        area: number | null;
        status: string;
        gardenerId: string;
        gardenType: import(".prisma/client").$Enums.GardenType;
        location: string | null;
        sunlightExposure: string | null;
        wateringSource: string | null;
        healthScore: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    findAll(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
        plants: {
            id: string;
            name: string;
            photoUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            gardenerId: string | null;
            gardenId: string | null;
            variety: string | null;
            customName: string | null;
            species: string | null;
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
            title: string;
            gardenerId: string;
            nextDueDate: Date;
            gardenId: string | null;
            plantId: string;
            careType: import(".prisma/client").$Enums.PlantCareType;
            instructions: string | null;
            intervalDays: number;
            lastCompletedDate: Date | null;
            isReminderActive: boolean;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        area: number | null;
        status: string;
        gardenerId: string;
        gardenType: import(".prisma/client").$Enums.GardenType;
        location: string | null;
        sunlightExposure: string | null;
        wateringSource: string | null;
        healthScore: number;
    })[]>;
    findOneOrThrow(user: AuthUser, id: string): Promise<{
        plants: {
            id: string;
            name: string;
            photoUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            gardenerId: string | null;
            gardenId: string | null;
            variety: string | null;
            customName: string | null;
            species: string | null;
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
            title: string;
            gardenerId: string;
            nextDueDate: Date;
            gardenId: string | null;
            plantId: string;
            careType: import(".prisma/client").$Enums.PlantCareType;
            instructions: string | null;
            intervalDays: number;
            lastCompletedDate: Date | null;
            isReminderActive: boolean;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        area: number | null;
        status: string;
        gardenerId: string;
        gardenType: import(".prisma/client").$Enums.GardenType;
        location: string | null;
        sunlightExposure: string | null;
        wateringSource: string | null;
        healthScore: number;
    }>;
    addPlant(user: AuthUser, gardenIdOrNull: string | undefined | null, dto: CreatePlantDto): Promise<{
        id: string;
        name: string;
        photoUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        gardenerId: string | null;
        gardenId: string | null;
        variety: string | null;
        customName: string | null;
        species: string | null;
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
            title: string;
            gardenerId: string;
            nextDueDate: Date;
            gardenId: string | null;
            plantId: string;
            careType: import(".prisma/client").$Enums.PlantCareType;
            instructions: string | null;
            intervalDays: number;
            lastCompletedDate: Date | null;
            isReminderActive: boolean;
        }[];
        healthLogs: {
            id: string;
            photoUrl: string;
            notes: string | null;
            loggedAt: Date;
            plantId: string;
            conditionStatus: string;
        }[];
    } & {
        id: string;
        name: string;
        photoUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        gardenerId: string | null;
        gardenId: string | null;
        variety: string | null;
        customName: string | null;
        species: string | null;
        locationType: string | null;
        potSizeInches: number | null;
        potType: string | null;
        healthStatus: string;
        plantedDate: Date | null;
        healthNotes: string | null;
    })[]>;
    listAllPlants(user: AuthUser): import(".prisma/client").Prisma.PrismaPromise<({
        garden: {
            id: string;
            name: string;
            gardenType: import(".prisma/client").$Enums.GardenType;
        } | null;
        schedules: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            gardenerId: string;
            nextDueDate: Date;
            gardenId: string | null;
            plantId: string;
            careType: import(".prisma/client").$Enums.PlantCareType;
            instructions: string | null;
            intervalDays: number;
            lastCompletedDate: Date | null;
            isReminderActive: boolean;
        }[];
        healthLogs: {
            id: string;
            photoUrl: string;
            notes: string | null;
            loggedAt: Date;
            plantId: string;
            conditionStatus: string;
        }[];
    } & {
        id: string;
        name: string;
        photoUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        gardenerId: string | null;
        gardenId: string | null;
        variety: string | null;
        customName: string | null;
        species: string | null;
        locationType: string | null;
        potSizeInches: number | null;
        potType: string | null;
        healthStatus: string;
        plantedDate: Date | null;
        healthNotes: string | null;
    })[]>;
    getPlantOrThrow(user: AuthUser, plantId: string): Promise<{
        garden: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            area: number | null;
            status: string;
            gardenerId: string;
            gardenType: import(".prisma/client").$Enums.GardenType;
            location: string | null;
            sunlightExposure: string | null;
            wateringSource: string | null;
            healthScore: number;
        } | null;
        schedules: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            gardenerId: string;
            nextDueDate: Date;
            gardenId: string | null;
            plantId: string;
            careType: import(".prisma/client").$Enums.PlantCareType;
            instructions: string | null;
            intervalDays: number;
            lastCompletedDate: Date | null;
            isReminderActive: boolean;
        }[];
        healthLogs: {
            id: string;
            photoUrl: string;
            notes: string | null;
            loggedAt: Date;
            plantId: string;
            conditionStatus: string;
        }[];
        diagnoses: {
            id: string;
            createdAt: Date;
            gardenerId: string;
            category: string;
            plantId: string | null;
            leafPhotoUrl: string;
            detectedIssue: string;
            confidence: string;
            organicRemedy: string;
            chemicalRemedy: string | null;
            preventiveCare: string | null;
            expertConsultationId: string | null;
        }[];
    } & {
        id: string;
        name: string;
        photoUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        gardenerId: string | null;
        gardenId: string | null;
        variety: string | null;
        customName: string | null;
        species: string | null;
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
        title: string;
        gardenerId: string;
        nextDueDate: Date;
        gardenId: string | null;
        plantId: string;
        careType: import(".prisma/client").$Enums.PlantCareType;
        instructions: string | null;
        intervalDays: number;
        lastCompletedDate: Date | null;
        isReminderActive: boolean;
    }>;
    completeCareTask(user: AuthUser, scheduleId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        gardenerId: string;
        nextDueDate: Date;
        gardenId: string | null;
        plantId: string;
        careType: import(".prisma/client").$Enums.PlantCareType;
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
        title: string;
        gardenerId: string;
        nextDueDate: Date;
        gardenId: string | null;
        plantId: string;
        careType: import(".prisma/client").$Enums.PlantCareType;
        instructions: string | null;
        intervalDays: number;
        lastCompletedDate: Date | null;
        isReminderActive: boolean;
    })[]>;
    logPlantHealth(user: AuthUser, dto: LogPlantHealthDto): Promise<{
        id: string;
        photoUrl: string;
        notes: string | null;
        loggedAt: Date;
        plantId: string;
        conditionStatus: string;
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
            category: string;
            plantId: string | null;
            leafPhotoUrl: string;
            detectedIssue: string;
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
        category: string;
        plantId: string | null;
        leafPhotoUrl: string;
        detectedIssue: string;
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
        category: string;
        plantId: string | null;
        leafPhotoUrl: string;
        detectedIssue: string;
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
        description: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        recordedById: string;
        expenseDate: Date;
        receiptPhotoUrl: string | null;
        gardenId: string;
        plantId: string | null;
        categoryName: string;
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
        description: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        recordedById: string;
        expenseDate: Date;
        receiptPhotoUrl: string | null;
        gardenId: string;
        plantId: string | null;
        categoryName: string;
    })[]>;
    deleteExpense(user: AuthUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        recordedById: string;
        expenseDate: Date;
        receiptPhotoUrl: string | null;
        gardenId: string;
        plantId: string | null;
        categoryName: string;
    }>;
    verifyDoctorAccessOrThrow(doctorUser: AuthUser, gardenerId: string): Promise<boolean>;
    getBotanicalProfileForDoctor(doctorUser: AuthUser, gardenerId: string): Promise<{
        gardener: {
            gardenerPlan: {
                startDate: Date;
                endDate: Date | null;
                plan: import(".prisma/client").$Enums.GardenerSubscriptionPlan;
            } | null;
            id: string;
            kingId: string | null;
            mobile: string;
            name: string;
            village: string | null;
            district: string | null;
            state: string | null;
            photoUrl: string | null;
        };
        gardens: ({
            plants: ({
                schedules: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    title: string;
                    gardenerId: string;
                    nextDueDate: Date;
                    gardenId: string | null;
                    plantId: string;
                    careType: import(".prisma/client").$Enums.PlantCareType;
                    instructions: string | null;
                    intervalDays: number;
                    lastCompletedDate: Date | null;
                    isReminderActive: boolean;
                }[];
                healthLogs: {
                    id: string;
                    photoUrl: string;
                    notes: string | null;
                    loggedAt: Date;
                    plantId: string;
                    conditionStatus: string;
                }[];
                diagnoses: {
                    id: string;
                    createdAt: Date;
                    gardenerId: string;
                    category: string;
                    plantId: string | null;
                    leafPhotoUrl: string;
                    detectedIssue: string;
                    confidence: string;
                    organicRemedy: string;
                    chemicalRemedy: string | null;
                    preventiveCare: string | null;
                    expertConsultationId: string | null;
                }[];
            } & {
                id: string;
                name: string;
                photoUrl: string | null;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                gardenerId: string | null;
                gardenId: string | null;
                variety: string | null;
                customName: string | null;
                species: string | null;
                locationType: string | null;
                potSizeInches: number | null;
                potType: string | null;
                healthStatus: string;
                plantedDate: Date | null;
                healthNotes: string | null;
            })[];
            visits: {
                id: string;
                createdAt: Date;
                status: string;
                notes: string | null;
                gardenId: string;
                scheduledTime: Date;
                visitTitle: string;
            }[];
            schedules: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                title: string;
                gardenerId: string;
                nextDueDate: Date;
                gardenId: string | null;
                plantId: string;
                careType: import(".prisma/client").$Enums.PlantCareType;
                instructions: string | null;
                intervalDays: number;
                lastCompletedDate: Date | null;
                isReminderActive: boolean;
            }[];
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            area: number | null;
            status: string;
            gardenerId: string;
            gardenType: import(".prisma/client").$Enums.GardenType;
            location: string | null;
            sunlightExposure: string | null;
            wateringSource: string | null;
            healthScore: number;
        })[];
        standalonePlants: ({
            schedules: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                title: string;
                gardenerId: string;
                nextDueDate: Date;
                gardenId: string | null;
                plantId: string;
                careType: import(".prisma/client").$Enums.PlantCareType;
                instructions: string | null;
                intervalDays: number;
                lastCompletedDate: Date | null;
                isReminderActive: boolean;
            }[];
            healthLogs: {
                id: string;
                photoUrl: string;
                notes: string | null;
                loggedAt: Date;
                plantId: string;
                conditionStatus: string;
            }[];
            diagnoses: {
                id: string;
                createdAt: Date;
                gardenerId: string;
                category: string;
                plantId: string | null;
                leafPhotoUrl: string;
                detectedIssue: string;
                confidence: string;
                organicRemedy: string;
                chemicalRemedy: string | null;
                preventiveCare: string | null;
                expertConsultationId: string | null;
            }[];
        } & {
            id: string;
            name: string;
            photoUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            gardenerId: string | null;
            gardenId: string | null;
            variety: string | null;
            customName: string | null;
            species: string | null;
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
            category: string;
            plantId: string | null;
            leafPhotoUrl: string;
            detectedIssue: string;
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
        title: string;
        gardenerId: string;
        nextDueDate: Date;
        gardenId: string | null;
        plantId: string;
        careType: import(".prisma/client").$Enums.PlantCareType;
        instructions: string | null;
        intervalDays: number;
        lastCompletedDate: Date | null;
        isReminderActive: boolean;
    }>;
    recordDoctorConsultationNote(doctorUser: AuthUser, dto: DoctorConsultationNoteDto): Promise<{
        id: string;
        photoUrl: string;
        notes: string | null;
        loggedAt: Date;
        plantId: string;
        conditionStatus: string;
    }>;
    getDoctorGardenDashboard(doctorUser: AuthUser): Promise<{
        activeGardenersCount: number;
        pendingRequestsCount: number;
        monitoredGardensCount: number;
        monitoredPlantsCount: number;
        criticalPlantsCount: number;
        activeAssignments: ({
            farmer: {
                gardenerPlan: {
                    endDate: Date | null;
                    plan: import(".prisma/client").$Enums.GardenerSubscriptionPlan;
                } | null;
                id: string;
                kingId: string | null;
                mobile: string;
                name: string;
                village: string | null;
                district: string | null;
                state: string | null;
                photoUrl: string | null;
                gardens: {
                    id: string;
                    name: string;
                    plants: {
                        id: string;
                        name: string;
                        healthStatus: string;
                    }[];
                    gardenType: import(".prisma/client").$Enums.GardenType;
                    healthScore: number;
                }[];
                plants: {
                    id: string;
                    name: string;
                    healthStatus: string;
                }[];
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            startDate: Date;
            endDate: Date | null;
            status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
            notes: string | null;
            farmerId: string;
            advisorId: string;
            subscriptionId: string | null;
            assignedById: string | null;
        })[];
        pendingAssignments: ({
            farmer: {
                id: string;
                kingId: string | null;
                mobile: string;
                name: string;
                village: string | null;
                district: string | null;
                state: string | null;
                photoUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            startDate: Date;
            endDate: Date | null;
            status: import(".prisma/client").$Enums.AdvisorAssignmentStatus;
            notes: string | null;
            farmerId: string;
            advisorId: string;
            subscriptionId: string | null;
            assignedById: string | null;
        })[];
        recentDiagnoses: ({
            plant: {
                id: string;
                name: string;
                locationType: string | null;
            } | null;
            gardener: {
                id: string;
                mobile: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            gardenerId: string;
            category: string;
            plantId: string | null;
            leafPhotoUrl: string;
            detectedIssue: string;
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
