export interface UserSession {
    sessionId: string;
    userId: string;
    createdAt: number;
    lastActiveAt: number;
    deviceInfo?: string;
}
export declare class UserSessionService {
    private readonly userSessions;
    private readonly revokedSessionIds;
    private readonly revokedBeforeEpochSec;
    createSession(userId: string, deviceInfo?: string): {
        sessionId: string;
        totalActiveSessions: number;
        hasMultipleLogins: boolean;
        warningMessage?: string;
        evictedOldest: boolean;
    };
    isValidSession(userId: string, sessionId?: string, tokenIatSec?: number): boolean;
    touchSession(userId: string, sessionId?: string): void;
    logoutOtherSessions(userId: string, currentSessionId: string): {
        loggedOutCount: number;
    };
    logoutSession(userId: string, sessionId: string): void;
    clearAllSessions(userId: string): void;
    getActiveSessions(userId: string): UserSession[];
}
