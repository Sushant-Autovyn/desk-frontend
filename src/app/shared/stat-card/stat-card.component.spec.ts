import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatCardComponent } from './stat-card.component';

describe('StatCardComponent', () => {
  let fixture: ComponentFixture<StatCardComponent>;
  let component: StatCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatCardComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(StatCardComponent);
    component = fixture.componentInstance;
    component.title = 'Total';
    component.value = 42;
    component.icon = 'message';
    component.color = 'primary';
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should render title', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Total');
  });

  it('should render value', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('42');
  });
});
