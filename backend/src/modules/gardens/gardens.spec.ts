import { Test, TestingModule } from '@nestjs/testing';
import { GardensService } from './gardens.service';
import { PrismaService } from '../prisma/prisma.service';
import { GardenerPlansService } from '../gardener-plans/gardener-plans.service';
import { AiChatService } from '../ai-chat/ai-chat.service';
import { GardenerSubscriptionPlan, GardenType, PlantCareType, Role } from '@prisma/client';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../../common/types/auth-user.type';

describe('GardensService (Phase 2 Comprehensive Test Suite)', () => {
  let service: GardensService;
  let prisma: PrismaService;
  let plansService: GardenerPlansService;

  const mockUser: AuthUser = {
    id: 'user-gardener-1',
    mobile: '9000000016',
    role: Role.GARDENER,
    roles: [Role.GARDENER],
    status: 'ACTIVE',
  };

  const mockPrisma = {
    garden: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    plant: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    plantCareSchedule: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    plantHealthLog: {
      create: jest.fn(),
    },
    plantDiagnosis: {
      create: jest.fn(),
    },
    aiCreditLedger: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    gardenExpense: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((promises) => Promise.all(promises)),
  };

  const mockPlansService = {
    getEffectivePlan: jest.fn().mockResolvedValue({ plan: GardenerSubscriptionPlan.FREE }),
  };

  const mockAiChatService = {
    diagnoseLeaf: jest.fn().mockResolvedValue({
      cropRecognized: true,
      cropName: 'Monstera (Monstera deliciosa)',
      diseaseName: 'Root Rot & Overwatering Chlorosis',
      category: 'FUNGAL',
      severity: 'HIGH',
      confidenceScore: 97.5,
      organicRemedy: 'Prune dead roots and apply cinnamon powder.',
      firstAidSpray: 'Diluted Hydrogen Peroxide 3% Root Drench',
      dosageInstructions: 'Mix 1 part 3% H2O2 with 4 parts water.',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GardensService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GardenerPlansService, useValue: mockPlansService },
        { provide: AiChatService, useValue: mockAiChatService },
      ],
    }).compile();

    service = module.get<GardensService>(GardensService);
    prisma = module.get<PrismaService>(PrismaService);
    plansService = module.get<GardenerPlansService>(GardenerPlansService);
    jest.clearAllMocks();
  });

  describe('1. Garden Creation & Type Assignment', () => {
    it('should create a garden with custom type (BALCONY, TERRACE, INDOOR)', async () => {
      mockPrisma.garden.create.mockResolvedValue({
        id: 'garden-1',
        name: 'My Terrace Oasis',
        gardenType: GardenType.TERRACE,
        gardenerId: mockUser.id,
      });

      const res = await service.create(mockUser, {
        name: 'My Terrace Oasis',
        gardenType: GardenType.TERRACE,
        area: 450,
      });

      expect(prisma.garden.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'My Terrace Oasis',
          gardenType: GardenType.TERRACE,
          gardenerId: mockUser.id,
        }),
      });
      expect(res.gardenType).toBe(GardenType.TERRACE);
    });
  });

  describe('2. Standalone & Garden Plants Support', () => {
    it('should allow adding a standalone plant without a garden (gardenId: null)', async () => {
      mockPrisma.plant.count.mockResolvedValue(2);
      mockPrisma.plant.create.mockResolvedValue({
        id: 'plant-1',
        name: 'Fiddle Leaf Fig',
        gardenId: null,
        gardenerId: mockUser.id,
      });

      const res = await service.addPlant(mockUser, null, {
        name: 'Fiddle Leaf Fig',
        species: 'Ficus lyrata',
        locationType: 'Living Room Corner',
      });

      expect(prisma.plant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Fiddle Leaf Fig',
          gardenId: null,
          gardenerId: mockUser.id,
        }),
      });
      expect(res.gardenId).toBeNull();
    });

    it('should enforce free plan limit of 10 plants', async () => {
      mockPrisma.plant.count.mockResolvedValue(10); // Already at 10 max
      await expect(
        service.addPlant(mockUser, null, { name: 'Eleventh Plant' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('3. Plant Care Scheduling & Recurring Tasks', () => {
    it('should create a recurring care schedule (WATERING)', async () => {
      mockPrisma.plant.findUnique.mockResolvedValue({
        id: 'plant-1',
        gardenerId: mockUser.id,
        gardenId: null,
      });
      mockPrisma.plantCareSchedule.create.mockResolvedValue({
        id: 'sched-1',
        plantId: 'plant-1',
        careType: PlantCareType.WATERING,
        intervalDays: 2,
        nextDueDate: new Date('2026-11-25T08:00:00Z'),
      });

      const res = await service.addCareSchedule(mockUser, {
        plantId: 'plant-1',
        careType: PlantCareType.WATERING,
        title: 'Morning Deep Watering',
        intervalDays: 2,
        nextDueDate: '2026-11-25T08:00:00Z',
      });

      expect(prisma.plantCareSchedule.create).toHaveBeenCalled();
      expect(res.careType).toBe(PlantCareType.WATERING);
    });

    it('should complete task and roll nextDueDate forward by intervalDays', async () => {
      const now = new Date('2026-11-23T10:00:00Z');
      mockPrisma.plantCareSchedule.findUnique.mockResolvedValue({
        id: 'sched-1',
        gardenerId: mockUser.id,
        intervalDays: 3,
      });
      mockPrisma.plantCareSchedule.update.mockResolvedValue({
        id: 'sched-1',
        lastCompletedDate: now,
      });

      await service.completeCareTask(mockUser, 'sched-1');

      expect(prisma.plantCareSchedule.update).toHaveBeenCalledWith({
        where: { id: 'sched-1' },
        data: expect.objectContaining({
          lastCompletedDate: expect.any(Date),
          nextDueDate: expect.any(Date),
        }),
      });
    });
  });

  describe('4. AI Credit Ledger Tracking', () => {
    it('should initialize and return free quota of 5 scans for free gardener', async () => {
      mockPrisma.aiCreditLedger.findUnique.mockResolvedValue(null);
      mockPrisma.aiCreditLedger.create.mockResolvedValue({
        userId: mockUser.id,
        monthlyQuota: 5,
        usedThisMonth: 1,
        bonusCredits: 0,
        resetDate: new Date('2026-12-23T00:00:00Z'),
      });

      const status = await service.getAiCreditStatus(mockUser);
      expect(status.monthlyQuota).toBe(5);
      expect(status.remainingCredits).toBe(4);
      expect(status.isUnlimited).toBe(false);
    });

    it('should reject AI plant diagnosis when free quota is exhausted', async () => {
      mockPrisma.aiCreditLedger.findUnique.mockResolvedValue({
        userId: mockUser.id,
        monthlyQuota: 5,
        usedThisMonth: 5, // Exhausted
        bonusCredits: 0,
        resetDate: new Date(Date.now() + 10000000),
      });

      await expect(
        service.recordPlantDiagnosis(
          mockUser,
          { leafPhotoUrl: 'https://example.com/leaf.jpg' },
          { diseaseName: 'Leaf Spot' },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should diagnose leaf in domestic garden mode and record diagnosis', async () => {
      mockPrisma.aiCreditLedger.findUnique.mockResolvedValue({
        userId: mockUser.id,
        monthlyQuota: 5,
        usedThisMonth: 1,
        bonusCredits: 0,
        resetDate: new Date(Date.now() + 10000000),
      });
      mockPrisma.plantDiagnosis.create.mockResolvedValue({
        id: 'diag-1',
        detectedIssue: 'Monstera (Monstera deliciosa): Root Rot & Overwatering Chlorosis',
      });
      mockPrisma.aiCreditLedger.update.mockResolvedValue({
        userId: mockUser.id,
        monthlyQuota: 5,
        usedThisMonth: 2,
        bonusCredits: 0,
        resetDate: new Date(Date.now() + 10000000),
      });

      const res = await service.diagnoseAndRecord(mockUser, {
        leafPhotoUrl: 'https://example.com/monstera.jpg',
      });

      expect(mockAiChatService.diagnoseLeaf).toHaveBeenCalledWith(
        'https://example.com/monstera.jpg',
        'GARDEN',
      );
      expect(res.diagnosis.detectedIssue).toContain('Root Rot');
      expect(mockPrisma.aiCreditLedger.update).toHaveBeenCalled();
    });
  });
});
