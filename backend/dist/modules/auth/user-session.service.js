"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSessionService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
let UserSessionService = class UserSessionService {
    constructor() {
        this.userSessions = new Map();
    }
    createSession(userId, deviceInfo) {
        let sessions = this.userSessions.get(userId) || [];
        const newSessionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
        const newSession = {
            sessionId: newSessionId,
            userId,
            createdAt: Date.now(),
            lastActiveAt: Date.now(),
            deviceInfo,
        };
        sessions.push(newSession);
        let evictedOldest = false;
        while (sessions.length > 2) {
            sessions.shift();
            evictedOldest = true;
        }
        this.userSessions.set(userId, sessions);
        const totalActiveSessions = sessions.length;
        const hasMultipleLogins = totalActiveSessions > 1;
        let warningMessage;
        if (evictedOldest) {
            warningMessage = '⚠️ Maximum 2 logins allowed! Your oldest session on another device was automatically logged out.';
        }
        else if (hasMultipleLogins) {
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
    isValidSession(userId, sessionId) {
        if (!sessionId)
            return true;
        let sessions = this.userSessions.get(userId);
        if (!sessions) {
            sessions = [];
            this.userSessions.set(userId, sessions);
        }
        const exists = sessions.some((s) => s.sessionId === sessionId);
        if (exists) {
            return true;
        }
        if (sessions.length < 2) {
            sessions.push({
                sessionId,
                userId,
                createdAt: Date.now(),
                lastActiveAt: Date.now(),
            });
            return true;
        }
        return false;
    }
    touchSession(userId, sessionId) {
        if (!sessionId)
            return;
        const sessions = this.userSessions.get(userId);
        if (sessions) {
            const session = sessions.find((s) => s.sessionId === sessionId);
            if (session) {
                session.lastActiveAt = Date.now();
            }
        }
    }
    logoutOtherSessions(userId, currentSessionId) {
        const sessions = this.userSessions.get(userId) || [];
        const remaining = sessions.filter((s) => s.sessionId === currentSessionId);
        const count = sessions.length - remaining.length;
        this.userSessions.set(userId, remaining);
        return { loggedOutCount: count };
    }
    logoutSession(userId, sessionId) {
        const sessions = this.userSessions.get(userId) || [];
        const remaining = sessions.filter((s) => s.sessionId !== sessionId);
        this.userSessions.set(userId, remaining);
    }
    getActiveSessions(userId) {
        return this.userSessions.get(userId) || [];
    }
};
exports.UserSessionService = UserSessionService;
exports.UserSessionService = UserSessionService = __decorate([
    (0, common_1.Injectable)()
], UserSessionService);
//# sourceMappingURL=user-session.service.js.map