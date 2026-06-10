import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketHistory } from './ticket-history';

describe('TicketHistory', () => {
  let component: TicketHistory;
  let fixture: ComponentFixture<TicketHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketHistory],
    }).compileComponents();

    fixture = TestBed.createComponent(TicketHistory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
