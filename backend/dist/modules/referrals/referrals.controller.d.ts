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
            referredUserId: string;
            referrerId: string;
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
            referredUserId: string;
            referrerId: string;
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
            userId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            royaltyType: string;
            referenceCode: string | null;
            sourceUserId: string;
        })[];
    }>;
    linkReferralOnSignUp(user: AuthUser, dto: LinkReferralDto): Promise<{
        id: string;
        createdAt: Date;
        level: number;
        referredUserId: string;
        referrerId: string;
        isGuarantor: boolean;
        trustScoreBonus: number;
    } | null>;
}
