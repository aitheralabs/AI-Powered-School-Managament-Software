/**
 * Socket.io Server
 *
 * Handles real-time WebSocket connections for:
 *   - In-app notification delivery
 *   - Auto-reconnect (handled by Socket.io client)
 *   - Per-user rooms for targeted notifications
 */

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import env from '../config/env';

let io: SocketIOServer;

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN || 'http://localhost:4200',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // JWT authentication middleware for socket connections
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        id?: string;
        userId?: string;
        email: string;
        role: string;
      };
      const userId = decoded.id || decoded.userId;
      if (!userId) return next(new Error('Invalid token'));

      (socket as any).userId = userId;
      (socket as any).userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId as string;
    console.log(`[Socket] User ${userId} connected (${socket.id})`);

    // Join user-specific room for targeted notifications
    socket.join(`user:${userId}`);

    // Handle manual room join (e.g. admin joining school room)
    socket.on('join:school', (schoolId: string) => {
      socket.join(`school:${schoolId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User ${userId} disconnected (${socket.id})`);
    });
  });

  console.log('✅ Socket.io server initialized');
  return io;
}

/** Emit notification to a specific user */
export function emitToUser(userId: string, event: string, payload: any): void {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

/** Emit notification to all users in a school */
export function emitToSchool(schoolId: string, event: string, payload: any): void {
  if (!io) return;
  io.to(`school:${schoolId}`).emit(event, payload);
}

export { io };
