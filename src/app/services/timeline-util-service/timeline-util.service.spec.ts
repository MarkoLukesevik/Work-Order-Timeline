import { TestBed } from '@angular/core/testing';

import { TimelineUtilService } from './timeline-util.service';

describe('TimelineUtil', () => {
  let service: TimelineUtilService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimelineUtilService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
