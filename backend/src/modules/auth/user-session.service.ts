import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

export interface UserSession {
  sessionId: string;
  userId: string;
  createdAt: number;
  lastActiveAt: number;
  deviceInfo?: string;
}

@Injectable()
export class UserSessionService {
  // Map of userId -> array of active UserSession objects (sorted oldest -> newest)
  private readonly userSessions = new Map<string, UserSession[]>();
  private readonly revokedSessionIds = new Set<string>();
  private readonly revokedBeforeEpochSec = new Map<string, number>();
  private readonly lastSeenAt = new Map<string, number>();
  private readonly onlineSocketCounts = new Map<string, number>();

  /**
   * Creates/registers a new session.
   * Enforces rules:
   * 1. >1 active session -> triggers multiple logins warning alert flag.
   * 2. >2 active sessions -> automatically evicts oldest active session(s) so max 2 remain.
   */
  createSession(userId: string, deviceInfo?: string): {
    sessionId: string;
    totalActiveSessions: number;
    hasMultipleLogins: boolean;
    warningMessage?: string;
    evictedOldest: boolean;
  } {
    let sessions = this.userSessions.get(userId) || [];
    const newSessionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    const newSession: UserSession = {
      sessionId: newSessionId,
      userId,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      deviceInfo,
    };

    sessions.push(newSession);

    let evictedOldest = false;
    // Auto-logout oldest logins if count exceeds 2
    while (sessions.length > 2) {
      const evicted = sessions.shift(); // remove oldest session
      if (evicted?.sessionId) {
        this.revokedSessionIds.add(evicted.sessionId);
      }
      evictedOldest = true;
    }

    this.userSessions.set(userId, sessions);
    this.lastSeenAt.set(userId, Date.now());

    const totalActiveSessions = sessions.length;
    const hasMultipleLogins = totalActiveSessions > 1;
    let warningMessage: string | undefined;

    if (evictedOldest) {
      warningMessage = '⚠️ Maximum 2 logins allowed! Your oldest session on another device was automatically logged out.';
    } else if (hasMultipleLogins) {
      warningMessage = '⚠️ Warning: Account logged in on 2 devices! You can logout from other devices in Settings.';
    }

    return {
      sessionId: newSessionId,
      totalActiveSessions,
      hasMultipleLogins,
      warningMessage,
      evictedOldest,
    };
  }

  /**
   * Validates whether a specific sessionId is still active for the user.
   */
  isValidSession(userId: string, sessionId?: string, tokenIatSec?: number): boolean {
    const revokedBefore = this.revokedBeforeEpochSec.get(userId);
    if (revokedBefore && tokenIatSec && tokenIatSec < revokedBefore) {
      return false;
    }
    if (!sessionId) return true; // backward compatibility for tokens without sid
    if (this.revokedSessionIds.has(sessionId)) {
      return false;
    }

    if (!this.userSessions.has(userId)) {
      // First request after fresh process restart: hydrate this active session cleanly unless revoked
      this.userSessions.set(userId, [
        {
          sessionId,
          userId,
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
        },
      ]);
      return true;
    }

    const sessions = this.userSessions.get(userId)!;
    return sessions.some((s) => s.sessionId === sessionId);
  }

  touchActivity(userId: string): void {
    this.lastSeenAt.set(userId, Date.now());
  }

  /**
   * Update last active timestamp for a session.
   */
  touchSession(userId: string, sessionId?: string): void {
    const now = Date.now();
    this.lastSeenAt.set(userId, now);
    if (!sessionId) return;
    const sessions = this.userSessions.get(userId);
    if (sessions) {
      const session = sessions.find((s) => s.sessionId === sessionId);
      if (session) {
        session.lastActiveAt = now;
      }
    }
  }

  setSocketConnected(userId: string, connected: boolean): void {
    const current = this.onlineSocketCounts.get(userId) ?? 0;
    if (connected) {
      this.onlineSocketCounts.set(userId, current + 1);
      this.lastSeenAt.set(userId, Date.now());
    } else if (current <= 1) {
      this.onlineSocketCounts.delete(userId);
    } else {
      this.onlineSocketCounts.set(userId, current - 1);
    }
  }

  getUserPresence(userId: string, onlineWindowMs = 5 * 60 * 1000): { isOnline: boolean; lastSeenAt: number | null } {
    const sockets = this.onlineSocketCounts.get(userId) ?? 0;
    const lastSeen = this.lastSeenAt.get(userId) ?? null;
    const isOnline = sockets > 0 || (lastSeen !== null && Date.now() - lastSeen <= onlineWindowMs);
    return { isOnline, lastSeenAt: lastSeen };
  }

  /**
   * Logs out all other active sessions for userId except currentSessionId.
   */
  logoutOtherSessions(userId: string, currentSessionId: string): { loggedOutCount: number } {
    const sessions = this.userSessions.get(userId) || [];
    for (const s of sessions) {
      if (s.sessionId !== currentSessionId) {
        this.revokedSessionIds.add(s.sessionId);
      }
    }
    const remaining = sessions.filter((s) => s.sessionId === currentSessionId);
    const count = sessions.length - remaining.length;
    this.userSessions.set(userId, remaining);
    return { loggedOutCount: count };
  }

  /**
   * Removes a specific session for userId on explicit logout.
   */
  logoutSession(userId: string, sessionId: string): void {
    if (sessionId) {
      this.revokedSessionIds.add(sessionId);
    }
    const sessions = this.userSessions.get(userId) || [];
    const remaining = sessions.filter((s) => s.sessionId !== sessionId);
    this.userSessions.set(userId, remaining);
    if (remaining.length === 0) {
      this.lastSeenAt.delete(userId);
    }
  }

  /**
   * Invalidates all active sessions and tokens issued before now (used after password reset or lock).
   */
  clearAllSessions(userId: string): void {
    const sessions = this.userSessions.get(userId) || [];
    for (const s of sessions) {
      this.revokedSessionIds.add(s.sessionId);
    }
    this.userSessions.set(userId, []);
    this.revokedBeforeEpochSec.set(userId, Math.floor(Date.now() / 1000) + 1);
    this.lastSeenAt.delete(userId);
    this.onlineSocketCounts.delete(userId);
  }

  /**
   * Returns current active sessions for a user.
   */
  getActiveSessions(userId: string): UserSession[] {
    return this.userSessions.get(userId) || [];
  }
}
