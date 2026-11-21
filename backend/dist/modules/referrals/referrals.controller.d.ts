import type { AuthUser } from '../../common/types/auth-user.type';
import { ReferralsService } from './referrals.service';
export declare class LinkReferralDto {
    referrerKingId: string;
}
export declare class ReferralsController {
    private readonly referralsService;
    constructor(referralsService: ReferralsService);
    getMyReferralNetwork(user: AuthUser): Promise<{
        kingId: string;
        inviteUrl: string;
        directCount: number;
        extendedCount: number;
        totalNetworkCount: number;
        totalRoyaltiesEarned: number;
        directReferrals: ({
            referredUser: {
                name: string;
                mobile: string;
                id: string;
                kingId: string | null;
                createdAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            level: number;
            referrerId: string;
            referredUserId: string;
            isGuarantor: boolean;
            trustScoreBonus: number;
        })[];
        extendedReferrals: ({
            referredUser: {
                name: string;
                id: string;
                kingId: string | null;
                createdAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            level: number;
            referrerId: string;
            referredUserId: string;
            isGuarantor: boolean;
            trustScoreBonus: number;
        })[];
        royaltiesHistory: ({
            sourceUser: {
                name: string;
                id: string;
                kingId: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            userId: string;
            sourceUserId: string;
            royaltyType: string;
            referenceCode: string | null;
        })[];
    }>;
    linkReferralOnSignUp(user: AuthUser, dto: LinkReferralDto): Promise<{
        id: string;
        createdAt: Date;
        level: number;
        referrerId: string;
        referredUserId: string;
        isGuarantor: boolean;
        trustScoreBonus: number;
    } | null>;
}
