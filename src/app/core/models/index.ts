export interface AuthenticatedUser {
  userId: string;
  agentId?: string;
  name: string;
  email: string;
  role: 'admin' | 'agent';
  token: string;
  refreshToken?: string;
}

export interface Message {
  _id?: string;
  ticketId?: string;
  sender: 'user' | 'support';
  text: string;
  imageUrl?: string | null;
  agentName?: string | null;
  createdAt: string;
}

export interface Ticket {
  _id: string;
  name: string;
  email: string;
  phone: string;
  issue: string;
  status: 'pending' | 'solved';
  messages: Message[];
  assignedAgentId?: string | null;
  createdAt: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  password?: string;
  department: string;
  role: 'admin' | 'agent';
  status: 'active' | 'inactive' | 'online' | 'offline';
  activeChats: number;
}

export interface Department {
  id: string;
  name: string;
  description: string;
}

export interface Customer {
  email: string;
  name: string;
  status: 'active' | 'blocked';
  notes: string;
  totalChats: number;
  lastActive: string;
}

export interface EnterpriseSettings {
  responseTime?: number;
  maxChats?: number;
  welcomeMessage?: string;
  workingHours?: string;
  [key: string]: unknown;
}

export interface RoutingConfig {
  rule: 'round_robin' | 'least_busy' | 'manual';
  defaultDepartment: string;
  [key: string]: unknown;
}

export type NotificationType = 'success' | 'error' | 'info';

export interface ToastNotification {
  id: string;
  type: NotificationType;
  message: string;
}

export interface NewTicketAlert {
  id: string;
  name: string;
  issue: string;
  ticketId: string;
}

export interface ConfirmOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  intent?: 'danger' | 'primary' | 'default';
}

export interface ConfirmState {
  id: string;
  message: string;
  options?: ConfirmOptions;
  resolve: (value: boolean) => void;
}
