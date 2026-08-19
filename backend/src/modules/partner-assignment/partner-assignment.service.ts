import { Injectable } from '@nestjs/common';
import { PartnerAssignmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';

@Injectable()
export class PartnerAssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  /** The logged-in customer's linked business partner, if any (linked automatically on first coupon redemption). */
  findMyPartner(user: AuthUser) {
    return this.prisma.partnerAssignment.findFirst({
      where: { customerId: user.id, status: PartnerAssignmentStatus.ACTIVE },
      include: {
        businessPartner: { select: { id: true, name: true, mobile: true, photoUrl: true } },
      },
    });
  }

  /** The logged-in business partner's roster of linked customers. */
  findMyCustomers(user: AuthUser) {
    return this.prisma.partnerAssignment.findMany({
      where: { businessPartnerId: user.id, status: PartnerAssignmentStatus.ACTIVE },
      include: {
        customer: { select: { id: true, name: true, mobile: true, photoUrl: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }
}
