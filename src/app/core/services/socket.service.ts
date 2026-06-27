import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Ticket, Message } from '../models';
import { SOCKET_URL } from '../config';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;
  private currentRoom: string | null = null;

  connect(): Socket {
    if (this.socket?.connected) return this.socket;
    if (this.socket) { this.socket.connect(); return this.socket; }

    this.socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      if (this.currentRoom) {
        this.socket?.emit('join_company', { companyId: this.currentRoom });
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) { this.socket.disconnect(); this.socket = null; }
    this.currentRoom = null;
  }

  getSocket(): Socket | null { return this.socket; }

  joinCompany(companyId: string | null): void {
    const room = companyId || 'global';
    this.currentRoom = room;
    if (!this.socket) this.connect();
    this.socket?.emit('join_company', { companyId: room });
  }

  joinTicket(ticketId: string): void {
    if (!this.socket) this.connect();
    this.socket?.emit('join_ticket', { ticketId });
  }

  leaveTicket(ticketId: string): void {
    this.socket?.emit('leave_ticket', { ticketId });
  }

  sendMessage(ticketId: string, sender: 'user' | 'support', text: string, imageUrl?: string | null, agentName?: string | null, companyId?: string | null): void {
    if (!this.socket?.connected) this.connect();
    this.socket?.emit('send_message', {
      ticketId, sender, text,
      imageUrl: imageUrl ?? null,
      agentName: agentName ?? null,
      companyId: companyId ?? null
    });
  }

  onNewTicket(callback: (ticket: Ticket) => void): () => void {
    if (!this.socket) this.connect();
    this.socket?.on('new_ticket', callback);
    return () => this.socket?.off('new_ticket', callback);
  }

  onReceiveMessage(callback: (message: Message & { ticketId: string }) => void): () => void {
    if (!this.socket) this.connect();
    this.socket?.on('receive_message', callback);
    return () => this.socket?.off('receive_message', callback);
  }

  onTicketSolved(callback: (data: { ticketId: string }) => void): () => void {
    if (!this.socket) this.connect();
    this.socket?.on('ticket_solved', callback);
    return () => this.socket?.off('ticket_solved', callback);
  }
}
