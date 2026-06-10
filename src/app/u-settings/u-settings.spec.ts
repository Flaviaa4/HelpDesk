import { ComponentFixture, TestBed } from '@angular/core/testing';

import { USettings } from './u-settings';

describe('USettings', () => {
  let component: USettings;
  let fixture: ComponentFixture<USettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [USettings],
    }).compileComponents();

    fixture = TestBed.createComponent(USettings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
