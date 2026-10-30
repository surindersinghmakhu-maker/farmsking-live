// @ts-ignore
import { io as ioFunc, Socket } from 'socket.io-client/dist/socket.io.js';
import * as Storage from './storage';
import { apiClient, TOKEN_KEY } from '../api/client';
import { getActiveApiUrl } from '../constants/config';

let socket: Socket | null = null;

/** Lazily connects (or reuses) the shared chat WebSocket, authenticated with the current session token. */
export async function getChatSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  const apiUrl = apiClient.defaults.baseURL || (await getActiveApiUrl());
  const serverUrl = apiUrl.replace(/\/api\/v1\/?$/, '');
  const token = await Storage.getItemAsync(TOKEN_KEY);

  if (socket) {
    socket.disconnect();
    socket = null;
  }

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
}
