import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  Agent, AuthenticatedUser, Customer, Department,
  EnterpriseSettings, Message, RoutingConfig, Ticket
} from '../models';
import { BACKEND_URL } from '../config';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  // ─── Audit Logging ────────────────────────────────────────────────────────
  logActivity(activity: string, actor: string, role: string): void {
    try {
      const logs = JSON.parse(localStorage.getItem('enterprise_audit_logs') || '[]');
      const newLog = { id: `log-${Date.now()}`, timestamp: new Date().toISOString(), activity, actor, role };
      localStorage.setItem('enterprise_audit_logs', JSON.stringify([newLog, ...logs].slice(0, 100)));
    } catch { /* ignore */ }
  }

  // ─── Auth ─────────────────────────────────────────────────────────────────
  async login(email: string, password: string): Promise<AuthenticatedUser> {
    const user = await firstValueFrom(
      this.http.post<AuthenticatedUser>(`${BACKEND_URL}/auth/login`, { email, password })
    );
    this.logActivity(`${user.name} logged in`, user.name, user.role);
    return user;
  }

  // ─── Tickets ──────────────────────────────────────────────────────────────
  async getTickets(): Promise<Ticket[]> {
    const res = await firstValueFrom(
      this.http.get<{ tickets: Ticket[]; total: number } | Ticket[]>(`${BACKEND_URL}/tickets`)
    );
    return Array.isArray(res) ? res : (res as { tickets: Ticket[] }).tickets;
  }

  async getChats(ticketId: string): Promise<Message[]> {
    return firstValueFrom(this.http.get<Message[]>(`${BACKEND_URL}/chats/${ticketId}`));
  }

  // Upload a base64 image; backend stores it in S3 and returns a public URL.
  // Falls back to the original base64 if storage isn't configured / fails, so
  // image messages always send.
  async uploadImage(dataUrl: string): Promise<string> {
    try {
      const res = await firstValueFrom(
        this.http.post<{ url: string }>(`${BACKEND_URL}/uploads/image`, { dataUrl })
      );
      return res?.url || dataUrl;
    } catch {
      return dataUrl;
    }
  }

  async updateTicketStatus(id: string, status: 'pending' | 'solved'): Promise<Ticket> {
    return firstValueFrom(this.http.put<Ticket>(`${BACKEND_URL}/tickets/${id}/status`, { status }));
  }

  // ─── Agents ───────────────────────────────────────────────────────────────
  private syncAgentCache(agents: Agent[]): Agent[] {
    localStorage.setItem('enterprise_agents', JSON.stringify(agents));
    return agents;
  }

  async fetchAgents(): Promise<Agent[]> {
    const agents = await firstValueFrom(this.http.get<Agent[]>(`${BACKEND_URL}/agents`));
    return this.syncAgentCache(agents);
  }

  getAgentsFromCache(): Agent[] {
    return JSON.parse(localStorage.getItem('enterprise_agents') || '[]');
  }

  async addAgent(agent: Omit<Agent, 'id' | 'activeChats'>): Promise<Agent> {
    const res = await firstValueFrom(this.http.post<Agent>(`${BACKEND_URL}/agents`, agent));
    await this.fetchAgents();
    this.logActivity(`Created agent ${res.name}`, 'System Administrator', 'admin');
    return res;
  }

  async updateAgent(id: string, fields: Partial<Agent>): Promise<Agent> {
    if (fields.password) {
      await firstValueFrom(this.http.put(`${BACKEND_URL}/agents/${id}/password`, { password: fields.password }));
      await this.fetchAgents();
      const agent = this.getAgentsFromCache().find(a => a.id === id);
      if (!agent) throw new Error('Agent not found');
      this.logActivity(`Updated password for ${agent.name}`, 'System Administrator', 'admin');
      return agent;
    }
    const res = await firstValueFrom(this.http.put<Agent>(`${BACKEND_URL}/agents/${id}`, fields));
    await this.fetchAgents();
    this.logActivity(`Updated agent ${res.name} profile`, 'System Administrator', 'admin');
    return res;
  }

  async deleteAgent(id: string): Promise<void> {
    const agent = this.getAgentsFromCache().find(a => a.id === id);
    await firstValueFrom(this.http.delete(`${BACKEND_URL}/agents/${id}`));
    await this.fetchAgents();
    if (agent) this.logActivity(`Deleted agent ${agent.name}`, 'System Administrator', 'admin');
  }

  async resetPassword(id: string): Promise<string> {
    const newPassword = `pass${Math.floor(10000 + Math.random() * 90000)}`;
    await firstValueFrom(this.http.put(`${BACKEND_URL}/agents/${id}/password`, { password: newPassword }));
    await this.fetchAgents();
    const agent = this.getAgentsFromCache().find(a => a.id === id);
    if (agent) this.logActivity(`Reset password for ${agent.name}`, 'System Administrator', 'admin');
    return newPassword;
  }

  async changePassword(id: string, newPassword: string): Promise<void> {
    await firstValueFrom(this.http.put(`${BACKEND_URL}/agents/${id}/password`, { password: newPassword }));
    const agent = this.getAgentsFromCache().find(a => a.id === id);
    if (agent) this.logActivity(`Password changed for ${agent.name}`, agent.name, 'agent');
  }

  // ─── Departments (localStorage) ───────────────────────────────────────────
  getDepartments(): Department[] {
    return JSON.parse(localStorage.getItem('enterprise_departments') || '[]');
  }

  addDepartment(name: string, description: string): Department {
    const deps = this.getDepartments();
    const dep: Department = { id: `dep-${Date.now()}`, name, description };
    deps.push(dep);
    localStorage.setItem('enterprise_departments', JSON.stringify(deps));
    this.logActivity(`Added department: ${name}`, 'System Administrator', 'admin');
    return dep;
  }

  updateDepartment(id: string, name: string, description: string): Department {
    const deps = this.getDepartments();
    const idx = deps.findIndex(d => d.id === id);
    if (idx === -1) throw new Error('Department not found');
    deps[idx] = { id, name, description };
    localStorage.setItem('enterprise_departments', JSON.stringify(deps));
    this.logActivity(`Updated department: ${name}`, 'System Administrator', 'admin');
    return deps[idx];
  }

  deleteDepartment(id: string): void {
    const deps = this.getDepartments();
    const dep = deps.find(d => d.id === id);
    if (!dep) throw new Error('Department not found');
    localStorage.setItem('enterprise_departments', JSON.stringify(deps.filter(d => d.id !== id)));
    this.logActivity(`Deleted department: ${dep.name}`, 'System Administrator', 'admin');
  }

  // ─── Customers (localStorage) ─────────────────────────────────────────────
  getCustomers(): Customer[] {
    const customers: Customer[] = JSON.parse(localStorage.getItem('enterprise_customers') || '[]');
    const deleted: string[] = JSON.parse(localStorage.getItem('enterprise_deleted_customers') || '[]');
    return customers.filter(c => !deleted.includes(c.email.toLowerCase()));
  }

  getDeletedCustomers(): string[] {
    return JSON.parse(localStorage.getItem('enterprise_deleted_customers') || '[]');
  }

  addOrUpdateCustomerFromTicket(ticket: Ticket): Customer {
    const customers = this.getCustomers();
    const deleted = this.getDeletedCustomers();
    if (deleted.includes(ticket.email.toLowerCase())) {
      return { email: ticket.email, name: ticket.name, status: 'active', notes: '', totalChats: 1, lastActive: new Date().toISOString() };
    }
    const idx = customers.findIndex(c => c.email.toLowerCase() === ticket.email.toLowerCase());
    if (idx === -1) {
      const nc: Customer = { email: ticket.email, name: ticket.name, status: 'active', notes: '', totalChats: 1, lastActive: new Date().toISOString() };
      customers.push(nc);
      localStorage.setItem('enterprise_customers', JSON.stringify(customers));
      return nc;
    }
    customers[idx].name = ticket.name;
    customers[idx].totalChats += 1;
    customers[idx].lastActive = new Date().toISOString();
    localStorage.setItem('enterprise_customers', JSON.stringify(customers));
    return customers[idx];
  }

  updateCustomerStatus(email: string, status: 'active' | 'blocked'): Customer {
    const customers = this.getCustomers();
    const idx = customers.findIndex(c => c.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) throw new Error('Customer not found');
    customers[idx].status = status;
    localStorage.setItem('enterprise_customers', JSON.stringify(customers));
    this.logActivity(`Customer ${email} set to ${status}`, 'System Administrator', 'admin');
    return customers[idx];
  }

  updateCustomerNotes(email: string, notes: string): Customer {
    const customers = this.getCustomers();
    const idx = customers.findIndex(c => c.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) throw new Error('Customer not found');
    customers[idx].notes = notes;
    localStorage.setItem('enterprise_customers', JSON.stringify(customers));
    return customers[idx];
  }

  deleteCustomer(email: string): void {
    const norm = email.toLowerCase();
    const customers = this.getCustomers().filter(c => c.email.toLowerCase() !== norm);
    localStorage.setItem('enterprise_customers', JSON.stringify(customers));
    const deleted = this.getDeletedCustomers();
    if (!deleted.includes(norm)) localStorage.setItem('enterprise_deleted_customers', JSON.stringify([...deleted, norm]));
    this.logActivity(`Customer ${email} deleted`, 'System Administrator', 'admin');
  }

  // ─── Settings (localStorage) ──────────────────────────────────────────────
  getSettings(): EnterpriseSettings {
    return JSON.parse(localStorage.getItem('enterprise_settings') || '{}');
  }

  updateSettings(settings: EnterpriseSettings): EnterpriseSettings {
    localStorage.setItem('enterprise_settings', JSON.stringify(settings));
    this.logActivity('System settings updated', 'System Administrator', 'admin');
    return settings;
  }

  // ─── Routing (localStorage) ───────────────────────────────────────────────
  getRoutingConfig(): RoutingConfig {
    return JSON.parse(localStorage.getItem('enterprise_routing') || '{"rule":"round_robin","defaultDepartment":"Support"}');
  }

  updateRoutingConfig(config: RoutingConfig): RoutingConfig {
    localStorage.setItem('enterprise_routing', JSON.stringify(config));
    this.logActivity(`Chat routing rule changed to: ${config.rule}`, 'System Administrator', 'admin');
    return config;
  }

  getAssignments(): Record<string, string> {
    return JSON.parse(localStorage.getItem('enterprise_ticket_assignments') || '{}');
  }

  assignTicket(ticketId: string, agentId: string): void {
    const a = this.getAssignments();
    a[ticketId] = agentId;
    localStorage.setItem('enterprise_ticket_assignments', JSON.stringify(a));
  }

  unassignTicket(ticketId: string): void {
    const a = this.getAssignments();
    delete a[ticketId];
    localStorage.setItem('enterprise_ticket_assignments', JSON.stringify(a));
  }

  autoRouteTicket(ticket: Ticket): string | null {
    const assignments = this.getAssignments();
    if (assignments[ticket._id]) return assignments[ticket._id];

    const config = this.getRoutingConfig();
    const agents = this.getAgentsFromCache().filter(a => a.role === 'agent' && a.status === 'active');
    if (agents.length === 0) return null;

    let assignedAgentId: string | null = null;

    if (config.rule === 'round_robin') {
      const allAssigned = Object.keys(assignments);
      const lastAgentId = allAssigned.length ? assignments[allAssigned[allAssigned.length - 1]] : '';
      const lastIdx = agents.findIndex(a => a.id === lastAgentId);
      assignedAgentId = agents[(lastIdx + 1) % agents.length].id;
    } else if (config.rule === 'least_busy') {
      assignedAgentId = [...agents].sort((a, b) => a.activeChats - b.activeChats)[0].id;
    } else {
      return null;
    }

    if (assignedAgentId) {
      this.assignTicket(ticket._id, assignedAgentId);
      const agent = agents.find(a => a.id === assignedAgentId);
      if (agent) this.logActivity(`Ticket auto-assigned to ${agent.name} (${config.rule})`, 'System Router', 'system');
    }

    return assignedAgentId;
  }

  // ─── LocalStorage init ────────────────────────────────────────────────────
  initStorage(): void {
    if (!localStorage.getItem('enterprise_agents')) localStorage.setItem('enterprise_agents', JSON.stringify([]));
    if (!localStorage.getItem('enterprise_departments')) localStorage.setItem('enterprise_departments', JSON.stringify([]));
    if (!localStorage.getItem('enterprise_customers')) localStorage.setItem('enterprise_customers', JSON.stringify([]));
    if (!localStorage.getItem('enterprise_deleted_customers')) localStorage.setItem('enterprise_deleted_customers', JSON.stringify([]));
    if (!localStorage.getItem('enterprise_ticket_assignments')) localStorage.setItem('enterprise_ticket_assignments', JSON.stringify({}));
    if (!localStorage.getItem('enterprise_routing')) localStorage.setItem('enterprise_routing', JSON.stringify({ rule: 'round_robin', defaultDepartment: 'Support' }));
    if (!localStorage.getItem('enterprise_settings')) localStorage.setItem('enterprise_settings', JSON.stringify({}));
  }
}
