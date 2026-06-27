import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';

const BASE = 'https://bot.autovyn.ai/api';

describe('ApiService', () => {
  let service: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ApiService],
    });
    localStorage.clear();
    service = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => expect(service).toBeTruthy());

  it('should POST to /auth/login', async () => {
    const p = service.login('a@b.com', 'pass');
    const req = http.expectOne(`${BASE}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush({ name: 'Alice', email: 'a@b.com', role: 'admin', token: 'tok' });
    const result = await p;
    expect(result.token).toBe('tok');
  });

  it('should GET /tickets', async () => {
    const p = service.getTickets();
    const req = http.expectOne(`${BASE}/tickets`);
    expect(req.request.method).toBe('GET');
    req.flush([{ _id: '1', name: 'Test', email: 't@t.com', issue: 'x', status: 'pending', createdAt: '' }]);
    const result = await p;
    expect(result.length).toBe(1);
  });

  it('should GET /chats/:ticketId', async () => {
    const p = service.getChats('ticket-1');
    const req = http.expectOne(`${BASE}/chats/ticket-1`);
    req.flush([]);
    const msgs = await p;
    expect(Array.isArray(msgs)).toBeTrue();
  });

  it('should PATCH /tickets/:id/status', async () => {
    const p = service.updateTicketStatus('t1', 'solved');
    const req = http.expectOne(`${BASE}/tickets/t1/status`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ success: true });
    await expectAsync(p).toBeResolved();
  });

  it('logActivity should write to localStorage', () => {
    service.logActivity('test event', 'admin', 'admin');
    const logs = JSON.parse(localStorage.getItem('enterprise_audit_logs') || '[]');
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].activity).toBe('test event');
  });

  it('should GET /agents', async () => {
    const p = service.fetchAgents();
    const req = http.expectOne(`${BASE}/agents`);
    req.flush([{ id: 'a1', name: 'Bob', email: 'b@b.com', status: 'online', department: 'Tech' }]);
    const agents = await p;
    expect(agents[0].name).toBe('Bob');
  });
});
