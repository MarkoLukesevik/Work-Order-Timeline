import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter, inject,
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

  private readonly timelineUtilService: TimelineUtilService = inject(TimelineUtilService);
  private readonly ngZone: NgZone = inject(NgZone);
  private readonly changeDetector: ChangeDetectorRef = inject(ChangeDetectorRef);

  columns: TimelineColumn[] = [];
  columnPixelWidth = 110;

  private timelineRangeStartDate!: Date;
  private timelineRangeEndDate!: Date;
  private isScrollListenerAttached = false;

  protected readonly ZoomLevelEnum = ZoomLevelEnum;

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

  /** * WHAT: Rebuilds the timeline grid whenever the zoom level or data changes.
   * HOW: Calculates the initial date range and triggers the column generation
   * logic to ensure the UI scale matches the selected Timescale (Day/Week/Month).
   */
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

  /** * WHAT: Centers the current time period in the viewport.
   * HOW: Finds the 'Current' column index, calculates its absolute pixel offset,
   * and adjusts scrollLeft by subtracting half the viewport width for better UX orientation.
   */
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

  /** * WHAT: Handles range extension for infinite scrolling.
   * HOW: Runs outside Angular's zone for performance; detects when scroll nears
   * boundary thresholds and triggers date prepending/appending to the range.
   */
  private handleGridScroll(): void {
    const scrollElement = this.scrollContainerElement.nativeElement;
    const scrollActivationThreshold = 300;
    const columnsToExtendCount = this.timelineUtilService.getExtensionCount(this.zoom);

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

      scrollElement.scrollLeft += (newTotalWidth - previousTotalWidth);
      this.ngZone.run(() => this.changeDetector.markForCheck());
    }

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

  /**
   * WHAT: Filters and returns work orders assigned to a specific work center that
   * fall within the currently active timeline date range.
   * * HOW:
   * 1. Checks if the work order belongs to the requested work center.
   * 2. Performs an 'overlap test' to see if the order's time span intersects with
   * the visible timeline range.
   */
  getVisibleOrdersForWorkCenter(workCenterId: string): WorkOrder[] {
    const rangeStart = this.timelineRangeStartDate.getTime();
    const rangeEnd = this.timelineRangeEndDate.getTime();

    return this.orders.filter(order => {
      if (order.workCenterId !== workCenterId) return false;

      const start = new Date(order.startDate).getTime();
      const end = new Date(order.endDate).getTime();

      return end > rangeStart && start < rangeEnd;
    });
  }

  /** * WHAT: Determines the visual coordinates for a work order bar.
   * HOW: Calculates the total timeline duration and delegates the math to the
   * timeline service to find the percentage-based 'left' and 'width' relative to the start date.
   */
  getWorkOrderBarPosition(workOrder: WorkOrder): BarPosition {
    const timelineDurationInMs = this.timelineRangeEndDate.getTime() - this.timelineRangeStartDate.getTime();

    return this.timelineUtilService.calculateBarPosition(
      workOrder.startDate,
      workOrder.endDate,
      this.timelineRangeStartDate,
      timelineDurationInMs,
      this.zoom,
      this.columns
    );
  }

  /** * WHAT: Maps a UI click to a specific date for new order creation.
   * HOW: Calculates the horizontal percentage of the click inside a column and
   * interpolates the exact Date based on the granularity of the current zoom level.
   */
  onColumnClick(workCenter: WorkCenter, column: TimelineColumn, event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('app-work-order-bar') || target.closest('.work-order')) return;

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
