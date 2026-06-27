import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [NotificationService] });
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => expect(service).toBeTruthy());

  it('should add a success notification', () => {
    service.success('All done!');
    expect(service.notifications().length).toBe(1);
    expect(service.notifications()[0].type).toBe('success');
    expect(service.notifications()[0].message).toBe('All done!');
  });

  it('should add an error notification', () => {
    service.error('Something broke');
    const n = service.notifications()[0];
    expect(n.type).toBe('error');
  });

  it('should add an info notification', () => {
    service.info('FYI');
    expect(service.notifications()[0].type).toBe('info');
  });

  it('should remove notification by id', () => {
    service.success('toast');
    const id = service.notifications()[0].id;
    service.removeNotification(id);
    expect(service.notifications().length).toBe(0);
  });

  it('should add ticket alert and track count', () => {
    const ticket: any = { _id: 't1', name: 'Alice', issue: 'Help', email: 'a@b.com', status: 'pending', createdAt: '' };
    service.newTicketAlert(ticket);
    expect(service.ticketAlerts().length).toBe(1);
    expect(service.alertCount()).toBe(1);
  });

  it('should clear alert count', () => {
    const ticket: any = { _id: 't2', name: 'Bob', issue: 'Help', email: 'b@b.com', status: 'pending', createdAt: '' };
    service.newTicketAlert(ticket);
    service.clearAlertCount();
    expect(service.alertCount()).toBe(0);
  });

  it('should resolve confirm with given value', async () => {
    const p = service.confirm('Are you sure?', { title: 'Test', confirmText: 'Yes', cancelText: 'No', intent: 'danger' });
    expect(service.confirmState().isOpen).toBeTrue();
    service.resolveConfirm(true);
    const result = await p;
    expect(result).toBeTrue();
    expect(service.confirmState().isOpen).toBeFalse();
  });
});
