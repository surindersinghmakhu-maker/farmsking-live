// @ts-ignore
import { io as ioFunc, Socket } from 'socket.io-client/dist/socket.io.js';
import * as Storage from './storage';
import { apiClient, TOKEN_KEY } from '../api/client';
import { getActiveApiUrl } from '../constants/config';

let socket: Socket | null = null;
let socketToken: string | null = null;

/**
 * Lazily connects (or reuses) the shared chat WebSocket, authenticated with the current session token.
 * Reconnects whenever the stored token differs from the one the live socket was opened with — otherwise
 * a socket left open from a previous account (e.g. across logout/login) would keep sending/receiving
 * under the old account's identity, since socket.io auth is only read once at connect time.
 */
export async function getChatSocket(): Promise<Socket> {
  const apiUrl = apiClient.defaults.baseURL || (await getActiveApiUrl());
  const serverUrl = apiUrl.replace(/\/api\/v1\/?$/, '');
  const token = await Storage.getItemAsync(TOKEN_KEY);

  if (socket?.connected && token === socketToken) return socket;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socketToken = token;
  socket = ioFunc(`${serverUrl}/chat`, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
  });

  return socket;
}

export function disconnectChatSocket() {
  socket?.disconnect();
  socket = null;
  socketToken = null;
}
