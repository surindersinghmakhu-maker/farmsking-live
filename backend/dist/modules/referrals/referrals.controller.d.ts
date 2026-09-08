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
                id: string;
                kingId: string | null;
                mobile: string;
                name: string;
                createdAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            referrerId: string;
            referredUserId: string;
            level: number;
            isGuarantor: boolean;
            trustScoreBonus: number;
        })[];
        extendedReferrals: ({
            referredUser: {
                id: string;
                kingId: string | null;
                name: string;
                createdAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            referrerId: string;
            referredUserId: string;
            level: number;
            isGuarantor: boolean;
            trustScoreBonus: number;
        })[];
        royaltiesHistory: ({
            sourceUser: {
                id: string;
                kingId: string | null;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            sourceUserId: string;
            royaltyType: string;
            referenceCode: string | null;
        })[];
    }>;
    linkReferralOnSignUp(user: AuthUser, dto: LinkReferralDto): Promise<{
        id: string;
        createdAt: Date;
        referrerId: string;
        referredUserId: string;
        level: number;
        isGuarantor: boolean;
        trustScoreBonus: number;
    } | null>;
}
