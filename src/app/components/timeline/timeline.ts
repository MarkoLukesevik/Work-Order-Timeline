import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone, OnChanges, OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';

import { TimelineUtilService } from '../../services/timeline-util-service/timeline-util.service';

import { WorkOrderBar } from '../work-order-bar/work-order-bar';

import WorkCenter from '../../models/work-center';
import WorkOrder from '../../models/work-order';
import TimelineColumn from '../../models/timeline-column';
import BarPosition from '../../models/bar-position';
import { ZoomLevelEnum } from '../../enums/zoom-level';

@Component({
  selector: 'app-timeline',
  imports: [
    WorkOrderBar
  ],
  templateUrl: './timeline.html',
  styleUrl: './timeline.scss',
})
export class Timeline implements OnInit, OnChanges, AfterViewInit {
  @Input() zoom: ZoomLevelEnum = ZoomLevelEnum.MONTH;
  @Input() workCenters: WorkCenter[] = [];
  @Input() orders: WorkOrder[] = [];

  @Output() createOrder = new EventEmitter<{ workCenterId: string; date: Date }>();
  @Output() editOrder = new EventEmitter<WorkOrder>();
  @Output() deleteOrder = new EventEmitter<string>();

  @ViewChild('scrollContainer') scrollContainerElement!: ElementRef<HTMLDivElement>;

  columns: TimelineColumn[] = [];
  columnPixelWidth = 110;

  private timelineRangeStartDate!: Date;
  private timelineRangeEndDate!: Date;
  private isScrollListenerAttached = false;

  protected readonly ZoomLevelEnum = ZoomLevelEnum;

  constructor(
    private timelineUtilService: TimelineUtilService,
    private ngZone: NgZone,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.rebuildTimeline();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['zoom'] && !changes['zoom'].firstChange) {
      this.rebuildTimeline();
    }
  }

  ngAfterViewInit(): void {
    this.scrollToCurrentTimePeriod();
    this.attachInfiniteScrollListener();
  }

  private rebuildTimeline(): void {
    const { start, end } = this.timelineUtilService.getInitialRange(this.zoom);
    this.timelineRangeStartDate = start;
    this.timelineRangeEndDate = end;

    this.columns = this.timelineUtilService.generateColumns(
      this.timelineRangeStartDate,
      this.timelineRangeEndDate,
      this.zoom
    );
  }

  scrollToCurrentTimePeriod(): void {
    if (!this.scrollContainerElement) return;

    const scrollElement = this.scrollContainerElement.nativeElement;
    const currentPeriodIndex = this.columns.findIndex(column => column.isCurrentPeriod);

    if (currentPeriodIndex !== -1) {
      const columnLeft = currentPeriodIndex * this.columnPixelWidth;
      const targetScrollLeft = columnLeft - (scrollElement.clientWidth / 2) + (this.columnPixelWidth / 2);
      scrollElement.scrollLeft = Math.max(0, targetScrollLeft);
    }
  }

  /**
   * Attaches the scroll listener outside of Angular's zone to optimize performance.
   */
  private attachInfiniteScrollListener(): void {
    if (this.isScrollListenerAttached) return;
    this.isScrollListenerAttached = true;

    this.ngZone.runOutsideAngular(() => {
      const scrollElement = this.scrollContainerElement.nativeElement;
      scrollElement.addEventListener('scroll', () => this.handleGridScroll(), { passive: true });
    });
  }

  /**
   * Detects when the user is near the edges of the timeline and extends the dates.
   */
  private handleGridScroll(): void {
    const scrollElement = this.scrollContainerElement.nativeElement;
    const scrollActivationThreshold = 300;
    const columnsToExtendCount = this.timelineUtilService.getExtensionCount(this.zoom);

    // Logic for extending the timeline into the past (Left)
    if (scrollElement.scrollLeft < scrollActivationThreshold) {
      const previousTotalWidth = this.columns.length * this.columnPixelWidth;

      this.timelineRangeStartDate = this.timelineUtilService.extendLeft(
        this.timelineRangeStartDate,
        this.zoom,
        columnsToExtendCount
      );

      this.columns = this.timelineUtilService.generateColumns(
        this.timelineRangeStartDate,
        this.timelineRangeEndDate,
        this.zoom
      );

      const newTotalWidth = this.columns.length * this.columnPixelWidth;

      // Maintain the user's visual position by adjusting scroll after prepending columns
      scrollElement.scrollLeft += (newTotalWidth - previousTotalWidth);
      this.ngZone.run(() => this.changeDetector.markForCheck());
    }

    // Logic for extending the timeline into the future (Right)
    const remainingScrollRight = scrollElement.scrollWidth - scrollElement.clientWidth - scrollElement.scrollLeft;
    if (remainingScrollRight < scrollActivationThreshold) {
      this.timelineRangeEndDate = this.timelineUtilService.extendRight(
        this.timelineRangeEndDate,
        this.zoom,
        columnsToExtendCount
      );

      this.columns = this.timelineUtilService.generateColumns(
        this.timelineRangeStartDate,
        this.timelineRangeEndDate,
        this.zoom
      );

      this.ngZone.run(() => this.changeDetector.markForCheck());
    }
  }

  getOrdersForWorkCenter(workCenterId: string): WorkOrder[] {
    return this.orders.filter(o => o.workCenterId === workCenterId);
  }

  getWorkOrderBarPosition(workOrder: WorkOrder): BarPosition {
    const timelineDurationInMs = this.timelineRangeEndDate.getTime() - this.timelineRangeStartDate.getTime();

    return this.timelineUtilService.calculateBarPosition(
      workOrder.startDate,
      workOrder.endDate,
      this.timelineRangeStartDate,
      timelineDurationInMs
    );
  }

  onColumnClick(workCenter: WorkCenter, column: TimelineColumn, event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('app-work-order-bar') || target.closest('.wo-bar')) return;

    const selectedDate = new Date(column.date);

    const columnBoundingBox = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const clickXPositionInsideColumn = event.clientX - columnBoundingBox.left;
    const horizontalPercentage = clickXPositionInsideColumn / this.columnPixelWidth;

    if (this.zoom === ZoomLevelEnum.MONTH) {
      const totalDaysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
      const calculatedDayOfMonth = Math.max(1, Math.floor(horizontalPercentage * totalDaysInMonth) + 1);
      selectedDate.setDate(calculatedDayOfMonth);
    }
    else if (this.zoom === ZoomLevelEnum.WEEK) {
      const daysToAdd = Math.floor(horizontalPercentage * 7);
      selectedDate.setDate(selectedDate.getDate() + daysToAdd);
    }

    this.createOrder.emit({ workCenterId: workCenter.id, date: selectedDate });
  }
}
