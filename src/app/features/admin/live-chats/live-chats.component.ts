import { Component, inject, signal, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { SocketService } from '../../../core/services/socket.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Ticket, Agent, Message } from '../../../core/models';

@Component({
  selector: 'app-live-chats',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './live-chats.component.html'
})
export class LiveChatsComponent implements OnInit, OnDestroy, AfterViewChecked {
  private api = inject(ApiService);
  private socket = inject(SocketService);
  private notif = inject(NotificationService);

  @ViewChild('messagesEnd') messagesEnd?: ElementRef;

  tickets = signal<Ticket[]>([]);
  agents = signal<Agent[]>([]);
  assignments = signal<Record<string, string>>({});
  selectedTicket = signal<Ticket | null>(null);
  messages = signal<Message[]>([]);
  loading = signal(true);
  showChat = signal(false);
  fullscreenImage = signal<string | null>(null);
  transferringId = signal<string | null>(null);
  selectedAgentForTransfer = '';

  private unsubNewTicket?: () => void;
  private unsubMessage?: () => void;
  private unsubSolved?: () => void;
  private shouldScroll = false;

  get activeTickets() { return this.tickets().filter(t => t.status === 'pending'); }

  async ngOnInit(): Promise<void> {
    try {
      const [ticketList, agentList] = await Promise.all([
        this.api.getTickets(),
        this.api.fetchAgents()
      ]);
      this.tickets.set(ticketList);
      this.agents.set(agentList.filter(a => a.role === 'agent'));
      const pending = ticketList.filter(t => t.status === 'pending');
      if (pending.length > 0) this.selectTicket(pending[0], false);
    } catch (err) {
      console.error('Error initializing live chats:', err);
    } finally {
      this.loading.set(false);
    }

    this.socket.connect();

    this.unsubNewTicket = this.socket.onNewTicket((t) => {
      this.tickets.update(prev => {
        if (prev.some(x => x._id === t._id)) return prev;
        this.api.autoRouteTicket(t);
        this.assignments.set(this.api.getAssignments());
        return [t, ...prev];
      });
    });

    this.unsubMessage = this.socket.onReceiveMessage((msg) => {
      const sel = this.selectedTicket();
      if (sel && sel._id === msg.ticketId) {
        this.messages.update(prev => {
          if (prev.some(m => m.createdAt === msg.createdAt && m.text === msg.text)) return prev;
          this.shouldScroll = true;
          return [...prev, msg];
        });
      }
      this.tickets.update(prev => prev.map(t => {
        if (t._id === msg.ticketId) {
          const msgs = t.messages || [];
          if (!msgs.some(m => m.createdAt === msg.createdAt && m.text === msg.text))
            return { ...t, messages: [...msgs, msg] };
        }
        return t;
      }));
    });

    this.unsubSolved = this.socket.onTicketSolved((data) => {
      this.tickets.update(prev => prev.map(t => t._id === data.ticketId ? { ...t, status: 'solved' as const } : t));
      const sel = this.selectedTicket();
      if (sel && sel._id === data.ticketId) this.selectedTicket.set({ ...sel, status: 'solved' });
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    this.unsubNewTicket?.();
    this.unsubMessage?.();
    this.unsubSolved?.();
    this.socket.disconnect();
  }

  async selectTicket(ticket: Ticket, mobile = true): Promise<void> {
    this.selectedTicket.set(ticket);
    if (mobile) this.showChat.set(true);
    this.messages.set([]);
    try {
      const chats = await this.api.getChats(ticket._id);
      this.messages.set(chats);
      this.shouldScroll = true;
      this.socket.joinTicket(ticket._id);
    } catch (err) {
      console.error('Failed to load chats:', err);
    }
  }

  handleTransfer(): void {
    const sel = this.selectedTicket();
    if (!sel || !this.selectedAgentForTransfer) return;
    const oldAgent = this.agents().find(a => a.id === this.assignments()[sel._id]);
    const newAgent = this.agents().find(a => a.id === this.selectedAgentForTransfer);
    this.api.assignTicket(sel._id, this.selectedAgentForTransfer);
    this.assignments.set(this.api.getAssignments());
    this.api.logActivity(`Chat transferred from ${oldAgent?.name || 'Unassigned'} to ${newAgent?.name}`, 'System Administrator', 'admin');
    this.transferringId.set(null);
    this.selectedAgentForTransfer = '';
  }

  async handleEndChat(ticketId: string): Promise<void> {
    const confirmed = await this.notif.confirm('Are you sure you want to end this conversation?', {
      title: 'End conversation', confirmText: 'End chat', cancelText: 'Cancel', intent: 'danger'
    });
    if (!confirmed) return;
    try {
      await this.api.updateTicketStatus(ticketId, 'solved');
      this.tickets.update(prev => prev.map(t => t._id === ticketId ? { ...t, status: 'solved' as const } : t));
      const sel = this.selectedTicket();
      if (sel && sel._id === ticketId) this.selectedTicket.set({ ...sel, status: 'solved' });
      this.api.logActivity(`Chat session ended for ticket #${ticketId.slice(-6)}`, 'System Administrator', 'admin');
    } catch (err) {
      this.notif.error('Failed to update ticket status. Check server connection.');
    }
  }

  getAgentName(ticketId: string): string {
    const agentId = this.assignments()[ticketId];
    if (!agentId) return 'Unassigned';
    return this.agents().find(a => a.id === agentId)?.name || 'Unassigned';
  }

  formatTime(d: string): string {
    return new Date(d).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
}
