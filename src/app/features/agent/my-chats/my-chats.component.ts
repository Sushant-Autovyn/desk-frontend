import {
  Component, inject, signal, computed, OnInit, OnDestroy,
  AfterViewChecked, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { SocketService } from '../../../core/services/socket.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { Ticket, Message, Agent, Department } from '../../../core/models';

const QUICK_PHRASES = [
  'Hello! How can I help you today?',
  'Thank you for reaching out to us.',
  'I understand your concern. Let me help you with that.',
  'Could you please provide more details?',
  'I\'m looking into this for you right now.',
  'I apologize for the inconvenience.',
  'Is there anything else I can help you with?',
  'Your issue has been resolved. Have a great day!',
];

const EMOJIS = ['😊','👍','🙏','✅','❌','⚠️','🔧','💡','📧','📞','🎉','😔','🤔','💬','🚀','✨'];

@Component({
  selector: 'app-my-chats',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './my-chats.component.html',
})
export class MyChatsComponent implements OnInit, OnDestroy, AfterViewChecked {
  private api = inject(ApiService);
  private socket = inject(SocketService);
  private auth = inject(AuthService);
  private notif = inject(NotificationService);

  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  tickets = signal<Ticket[]>([]);
  messages = signal<Message[]>([]);
  selectedTicket = signal<Ticket | null>(null);
  agents = signal<Agent[]>([]);
  departments = signal<Department[]>([]);
  assignments = signal<Record<string, string>>({});
  loading = signal(true);
  sending = signal(false);
  messageText = signal('');
  searchQuery = signal('');
  statusFilter = signal('pending');
  showEmoji = signal(false);
  showPhrases = signal(false);
  showImageModal = signal(false);
  fullscreenImage = signal<string | null>(null);
  transferModal = signal(false);
  transferTarget = signal('');
  showDetails = signal(true);
  shouldScroll = false;

  quickPhrases = QUICK_PHRASES;
  emojis = EMOJIS;

  private unsubs: Array<() => void> = [];

  get user() { return this.auth.user(); }

  assignedAgentName(ticketId: string): string {
    const agentId = this.assignments()[ticketId];
    if (!agentId) return 'Unassigned';
    return this.agents().find(a => a.id === agentId)?.name || 'Unassigned';
  }

  get imageCount(): number {
    return this.messages().filter(m => !!m.imageUrl).length;
  }

  get customerInitials(): string {
    const n = this.selectedTicket()?.name?.trim() || '';
    const parts = n.split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
  }

  get filteredTickets() {
    const q = this.searchQuery().toLowerCase();
    return this.tickets().filter(t => {
      const assigned = this.assignments()[t._id] === this.user?.agentId;
      if (!assigned) return false;
      if (this.statusFilter() !== 'all' && t.status !== this.statusFilter()) return false;
      if (q && !t.name.toLowerCase().includes(q) && !t.email.toLowerCase().includes(q)) return false;
      return true;
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      const [t, a, d] = await Promise.all([
        this.api.getTickets(),
        this.api.fetchAgents(),
        this.api.getDepartments(),
      ]);
      this.tickets.set(t);
      this.agents.set(a);
      this.departments.set(d);
      this.assignments.set(this.api.getAssignments());
    } catch {}
    finally { this.loading.set(false); }

    this.unsubs.push(
      this.socket.onNewTicket(ticket => {
        this.tickets.update(ts => [...ts, ticket]);
        this.assignments.set(this.api.getAssignments());
      }),
      this.socket.onReceiveMessage(msg => {
        if (msg.ticketId === this.selectedTicket()?._id) {
          this.messages.update(ms => [...ms, msg]);
          this.shouldScroll = true;
        }
      }),
      this.socket.onTicketSolved(({ ticketId }) => {
        this.tickets.update(ts => ts.map(t => t._id === ticketId ? { ...t, status: 'solved' } : t));
        if (this.selectedTicket()?._id === ticketId) {
          this.selectedTicket.update(t => t ? { ...t, status: 'solved' } : t);
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.unsubs.forEach(fn => fn());
    if (this.selectedTicket()) {
      this.socket.leaveTicket(this.selectedTicket()!._id);
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  async selectTicket(t: Ticket): Promise<void> {
    if (this.selectedTicket()) this.socket.leaveTicket(this.selectedTicket()!._id);
    this.selectedTicket.set(t);
    this.messages.set([]);
    this.socket.joinTicket(t._id);
    try { this.messages.set(await this.api.getChats(t._id)); }
    catch {}
    this.shouldScroll = true;
  }

  async sendMessage(): Promise<void> {
    const text = this.messageText().trim();
    if (!text || !this.selectedTicket() || this.sending()) return;
    this.sending.set(true);
    const ticket = this.selectedTicket()!;
    const msg: Message = {
      ticketId: ticket._id,
      sender: 'support',
      text,
      createdAt: new Date().toISOString(),
    };
    this.socket.sendMessage(ticket._id, 'support', text, null, this.user?.name);
    this.messages.update(ms => [...ms, msg]);
    this.messageText.set('');
    this.shouldScroll = true;
    this.sending.set(false);
    await this.api.logActivity(`Agent sent message on ticket #${ticket._id.slice(-6)}`, this.user?.name || 'Agent', 'agent');
  }

  async resolveTicket(): Promise<void> {
    if (!this.selectedTicket()) return;
    const ok = await this.notif.confirm('Mark this chat as resolved?', {
      title: 'Resolve Chat', confirmText: 'Resolve', cancelText: 'Cancel', intent: 'default'
    });
    if (!ok) return;
    const id = this.selectedTicket()!._id;
    try {
      await this.api.updateTicketStatus(id, 'solved');
      this.tickets.update(ts => ts.map(t => t._id === id ? { ...t, status: 'solved' } : t));
      this.selectedTicket.update(t => t ? { ...t, status: 'solved' } : t);
      this.notif.success('Ticket resolved.');
    } catch { this.notif.error('Failed to resolve ticket.'); }
  }

  async transferChat(): Promise<void> {
    if (!this.transferTarget() || !this.selectedTicket()) return;
    try {
      await this.api.assignTicket(this.selectedTicket()!._id, this.transferTarget());
      this.assignments.set(this.api.getAssignments());
      this.transferModal.set(false);
      this.notif.success('Chat transferred.');
    } catch { this.notif.error('Transfer failed.'); }
  }

  insertEmoji(e: string): void {
    this.messageText.update(t => t + e);
    this.showEmoji.set(false);
  }

  insertPhrase(p: string): void {
    this.messageText.set(p);
    this.showPhrases.set(false);
  }

  async onImageUpload(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.selectedTicket()) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      // Optimistic local preview with the base64, then upload to S3 and send the URL.
      const msg: Message = {
        ticketId: this.selectedTicket()!._id,
        sender: 'support',
        text: '',
        imageUrl: dataUrl,
        createdAt: new Date().toISOString(),
      };
      this.messages.update(ms => [...ms, msg]);
      this.shouldScroll = true;

      const uploadedUrl = await this.api.uploadImage(dataUrl);
      this.socket.sendMessage(this.selectedTicket()!._id, 'support', '', uploadedUrl, this.user?.name);
    };
    reader.readAsDataURL(file);
  }

  openFullscreen(url: string): void { this.fullscreenImage.set(url); }

  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendMessage(); }
  }

  formatTime(d: string): string {
    return new Date(d).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  private scrollToBottom(): void {
    try { this.messagesEnd?.nativeElement.scrollIntoView({ behavior: 'smooth' }); } catch {}
  }
}
