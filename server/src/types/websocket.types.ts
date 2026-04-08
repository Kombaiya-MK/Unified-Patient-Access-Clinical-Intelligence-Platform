/**
 * WebSocket Types
 * 
 * TypeScript interfaces for WebSocket communication
 * in queue management real-time updates.
 * 
 * @module websocket.types
 * @created 2026-03-31
 * @task US_020 TASK_004
 */

import type WebSocket from 'ws';

export interface QueueUpdateEvent {
  type: 'status_change';
  appointmentId: string;
  newStatus: string;
  staffName: string;
  timestamp: Date;
}

export interface WebSocketMessage {
  event: string;
  data: any;
  timestamp: string;
}

export interface WebSocketClient {
  ws: WebSocket;
  userId: number;
  role: string;
  isAlive: boolean;
}
