import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZoomSelector } from './zoom-selector';

describe('ZoomSelector', () => {
  let component: ZoomSelector;
  let fixture: ComponentFixture<ZoomSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZoomSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ZoomSelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
