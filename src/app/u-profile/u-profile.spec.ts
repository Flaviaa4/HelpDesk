import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UProfile } from './u-profile';

describe('UProfile', () => {
  let component: UProfile;
  let fixture: ComponentFixture<UProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UProfile],
    }).compileComponents();

    fixture = TestBed.createComponent(UProfile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
