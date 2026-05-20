import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmitTicket } from './submit-ticket';

describe('SubmitTicket', () => {
  let component: SubmitTicket;
  let fixture: ComponentFixture<SubmitTicket>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubmitTicket],
    }).compileComponents();

    fixture = TestBed.createComponent(SubmitTicket);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
