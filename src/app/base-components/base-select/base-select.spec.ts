import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseSelect } from './base-select';

describe('BaseSelect', () => {
  let component: BaseSelect;
  let fixture: ComponentFixture<BaseSelect>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BaseSelect]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BaseSelect);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
