/**
 * WebSocket Service
 * 
 * Manages WebSocket server for real-time queue and circuit-breaker updates.
 * Authenticates clients, maintains connection pool, and broadcasts
 * events with <5s latency.
 * 
 * @module websocketService
 * @created 2026-03-31
 * @task US_020 TASK_004, US_041 TASK_002 (circuit-breaker path)
 */

import { Server as HttpServer, IncomingMessage } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { URL } from 'url';
import { verifyToken } from '../utils/tokenGenerator';
import logger from '../utils/logger';
import type { QueueUpdateEvent, WebSocketClient } from '../types/websocket.types';

/** Accepted WebSocket paths */
const ALLOWED_PATHS = new Set(['/queue', '/circuit-breaker']);

/** Connected client pool */
const clients: Set<WebSocketClient> = new Set();

/** Heartbeat interval reference */
let heartbeatInterval: NodeJS.Timeout | null = null;

/** WebSocket server instance */
let wss: WebSocketServer | null = null;

/**
 * Initialize WebSocket server attached to the HTTP server
 */
export function initWebSocketServer(httpServer: HttpServer): void {
  wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
    handleConnection(ws, request);
  });

  // Handle HTTP upgrade for both /queue and /circuit-breaker paths
  httpServer.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
    if (ALLOWED_PATHS.has(pathname) && wss) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss!.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // Heartbeat: ping every 30s, terminate dead connections
  heartbeatInterval = setInterval(() => {
    clients.forEach((client) => {
      if (!client.isAlive) {
        logger.debug('Terminating dead WebSocket connection', { userId: client.userId });
        client.ws.terminate();
        clients.delete(client);
        return;
      }
      client.isAlive = false;
      client.ws.ping();
    });
  }, 30_000);

  wss.on('close', () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  });

  logger.info('✓ WebSocket server initialized on /queue and /circuit-breaker');
}

/**
 * Handle new WebSocket connection with authentication
 */
function handleConnection(ws: WebSocket, request: IncomingMessage): void {
  try {
    // Extract token from query params: ws://host/queue?token=xxx
    const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(4001, 'Authentication required');
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      ws.close(4001, 'Invalid or expired token');
      return;
    }

    // Only allow staff and admin roles
    if (payload.role !== 'staff' && payload.role !== 'admin') {
      ws.close(4003, 'Insufficient permissions');
      return;
    }

    const client: WebSocketClient = {
      ws,
      userId: payload.userId,
      role: payload.role,
      isAlive: true,
    };

    clients.add(client);

    logger.info('WebSocket client connected', {
      userId: payload.userId,
      role: payload.role,
      totalClients: clients.size,
    });

    // Send welcome message
    ws.send(JSON.stringify({
      event: 'connected',
      data: { message: 'Connected to queue updates', userId: payload.userId },
      timestamp: new Date().toISOString(),
    }));

    // Handle pong (heartbeat response)
    ws.on('pong', () => {
      client.isAlive = true;
    });

    // Handle client disconnect
    ws.on('close', () => {
      clients.delete(client);
      logger.info('WebSocket client disconnected', {
        userId: payload.userId,
        totalClients: clients.size,
      });
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error('WebSocket client error', { userId: payload.userId, error: error.message });
      clients.delete(client);
    });
  } catch (error) {
    logger.error('WebSocket connection handling error', { error });
    ws.close(4000, 'Connection error');
  }
}

/**
 * Broadcast queue update event to all connected staff clients
 */
export function broadcastQueueUpdate(event: QueueUpdateEvent): void {
  const message = JSON.stringify({
    event: 'queue:update',
    data: event,
    timestamp: new Date().toISOString(),
  });

  let sentCount = 0;
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      sentCount++;
    }
  });

  logger.debug('Queue update broadcast', {
    event: event.type,
    appointmentId: event.appointmentId,
    sentTo: sentCount,
    totalClients: clients.size,
  });
}

/**
 * Broadcast circuit breaker state change to all connected clients
 */
export function broadcastCircuitBreakerEvent(data: { service: string; model: string; state: string; [key: string]: unknown }): void {
  const message = JSON.stringify({
    event: 'circuit-breaker:update',
    data,
    timestamp: new Date().toISOString(),
  });

  let sentCount = 0;
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      sentCount++;
    }
  });

  logger.debug('Circuit breaker broadcast', {
    service: data.service,
    state: data.state,
    sentTo: sentCount,
    totalClients: clients.size,
  });
}

/**
 * Get count of connected clients
 */
export function getConnectedClients(): number {
  return clients.size;
}

/**
 * Cleanup: close all connections and stop heartbeat
 */
export function closeWebSocketServer(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  clients.forEach((client) => {
    client.ws.close(1000, 'Server shutting down');
  });
  clients.clear();

  if (wss) {
    wss.close();
    wss = null;
  }

  logger.info('WebSocket server closed');
}
