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
      sessions.shift(); // remove oldest session
      evictedOldest = true;
    }

    this.userSessions.set(userId, sessions);

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
  isValidSession(userId: string, sessionId?: string): boolean {
    if (!sessionId) return true; // backward compatibility for tokens without sid
    const sessions = this.userSessions.get(userId);
    // If no sessions registered yet for user (e.g. server restarted), treat as valid and register
    if (!sessions || sessions.length === 0) {
      this.userSessions.set(userId, [{
        sessionId,
        userId,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      }]);
      return true;
    }
    return sessions.some((s) => s.sessionId === sessionId);
  }

  /**
   * Update last active timestamp for a session.
   */
  touchSession(userId: string, sessionId?: string): void {
    if (!sessionId) return;
    const sessions = this.userSessions.get(userId);
    if (sessions) {
      const session = sessions.find((s) => s.sessionId === sessionId);
      if (session) {
        session.lastActiveAt = Date.now();
      }
    }
  }

  /**
   * Logs out all other active sessions for userId except currentSessionId.
   */
  logoutOtherSessions(userId: string, currentSessionId: string): { loggedOutCount: number } {
    const sessions = this.userSessions.get(userId) || [];
    const remaining = sessions.filter((s) => s.sessionId === currentSessionId);
    const count = sessions.length - remaining.length;
    this.userSessions.set(userId, remaining);
    return { loggedOutCount: count };
  }

  /**
   * Removes a specific session for userId on explicit logout.
   */
  logoutSession(userId: string, sessionId: string): void {
    const sessions = this.userSessions.get(userId) || [];
    const remaining = sessions.filter((s) => s.sessionId !== sessionId);
    this.userSessions.set(userId, remaining);
  }

  /**
   * Returns current active sessions for a user.
   */
  getActiveSessions(userId: string): UserSession[] {
    return this.userSessions.get(userId) || [];
  }
}
