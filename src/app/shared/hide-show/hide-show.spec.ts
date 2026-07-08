import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HideShow } from './hide-show';

describe('HideShow', () => {
  let component: HideShow;
  let fixture: ComponentFixture<HideShow>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HideShow],
    }).compileComponents();

    fixture = TestBed.createComponent(HideShow);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
