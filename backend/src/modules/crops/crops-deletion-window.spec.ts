import { ForbiddenException } from '@nestjs/common';
import { CropsService } from './crops.service';
import { Role } from '@prisma/client';
import { AuthUser } from '../../common/types/auth-user.type';

describe('CropsService - Dynamic Crop Deletion Window', () => {
  let cropsService: CropsService;
  let mockPrisma: any;
  let mockPlotsService: any;
  let mockFarmerPlansService: any;
  let mockAdvisorAssignmentService: any;
  let mockNotificationsService: any;
  let mockAppSettingsService: any;

  const farmerUser: AuthUser = {
    id: 'farmer-1',
    mobile: '9876543210',
    role: Role.FARMER,
    roles: [Role.FARMER],
  };

  const adminUser: AuthUser = {
    id: 'admin-1',
    mobile: '9872066901',
    role: Role.SUPER_ADMIN,
    roles: [Role.SUPER_ADMIN],
  };

  beforeEach(() => {
    mockPrisma = {
      cropCycle: {
        findFirst: jest.fn(),
        update: jest.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
      },
    };

    mockPlotsService = {};
    mockFarmerPlansService = {};
    mockAdvisorAssignmentService = {};
    mockNotificationsService = {};
    mockAppSettingsService = {
      get: jest.fn().mockResolvedValue({
        cropDeletionWindowDays: 7,
      }),
    };

    cropsService = new CropsService(
      mockPrisma,
      mockPlotsService,
      mockFarmerPlansService,
      mockAdvisorAssignmentService,
      mockNotificationsService,
      mockAppSettingsService,
    );
  });

  it('allows a farmer to delete a crop within the configured 7-day deletion window', async () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const mockCrop = {
      id: 'crop-1',
      cropName: 'Wheat PBW-826',
      createdAt: threeDaysAgo,
      deletedAt: null,
      plot: { farm: { ownerId: 'farmer-1' } },
    };

    jest.spyOn(cropsService, 'findOneOrThrow').mockResolvedValue(mockCrop as any);

    const result = await cropsService.remove(farmerUser, 'crop-1');
    expect(result).toBeDefined();
    expect(mockPrisma.cropCycle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'crop-1' },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    );
  });

  it('rejects deletion with ForbiddenException when crop creation exceeds the 7-day window', async () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const mockCrop = {
      id: 'crop-2',
      cropName: 'Basmati 1509',
      createdAt: tenDaysAgo,
      deletedAt: null,
      plot: { farm: { ownerId: 'farmer-1' } },
    };

    jest.spyOn(cropsService, 'findOneOrThrow').mockResolvedValue(mockCrop as any);

    await expect(cropsService.remove(farmerUser, 'crop-2')).rejects.toThrow(ForbiddenException);
    await expect(cropsService.remove(farmerUser, 'crop-2')).rejects.toThrow(/Crops can only be deleted within 7 days/);
  });

  it('allows deletion of 10-day old crop when admin configures window to 14 days', async () => {
    mockAppSettingsService.get.mockResolvedValue({
      cropDeletionWindowDays: 14,
    });

    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const mockCrop = {
      id: 'crop-3',
      cropName: 'Mustard Sarson',
      createdAt: tenDaysAgo,
      deletedAt: null,
      plot: { farm: { ownerId: 'farmer-1' } },
    };

    jest.spyOn(cropsService, 'findOneOrThrow').mockResolvedValue(mockCrop as any);

    const result = await cropsService.remove(farmerUser, 'crop-3');
    expect(result).toBeDefined();
    expect(mockPrisma.cropCycle.update).toHaveBeenCalled();
  });

  it('allows Super Admin to bypass crop deletion window restrictions', async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const mockCrop = {
      id: 'crop-4',
      cropName: 'Old Crop',
      createdAt: thirtyDaysAgo,
      deletedAt: null,
      plot: { farm: { ownerId: 'farmer-1' } },
    };

    jest.spyOn(cropsService, 'findOneOrThrow').mockResolvedValue(mockCrop as any);

    const result = await cropsService.remove(adminUser, 'crop-4');
    expect(result).toBeDefined();
    expect(mockPrisma.cropCycle.update).toHaveBeenCalled();
  });
});
