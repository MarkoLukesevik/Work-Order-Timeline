import {Injectable} from '@angular/core';

import TimelineColumn from '../../models/timeline-column';
import BarPosition from '../../models/bar-position';
import { ZoomLevelEnum } from '../../enums/zoom-level';

@Injectable({
  providedIn: 'root',
})
export class TimelineUtilService {
  /** * WHAT: Generates a structured array of columns for the grid.
   * HOW: Uses a date-cursor to iterate from start to end, creating unique column
   * objects with formatted labels and "Current Period" flags.
   */
  generateColumns(rangeStart: Date, rangeEnd: Date, zoom: ZoomLevelEnum): TimelineColumn[] {
    const columns: TimelineColumn[] = [];
    const cursor = new Date(rangeStart);
    const now = new Date();

    while (cursor <= rangeEnd) {
      columns.push({
        label: this.formatColumnLabel(cursor, zoom),
        date: new Date(cursor),
        isCurrentPeriod: this.isCurrentPeriod(cursor, now, zoom),
      });
      this.advanceCursor(cursor, zoom);
    }
    return columns;
  }

  /** * WHAT: Shifts the timeline start date backward to load historical dates.
   * HOW: Mutates a date copy by retreating the cursor a specific number of steps
   * based on the zoom granularity.
   */
  extendLeft(currentStart: Date, zoom: ZoomLevelEnum, count: number): Date {
    const date = new Date(currentStart);
    for (let i = 0; i < count; i++) {
      this.retreatCursor(date, zoom);
    }
    return date;
  }

  /** * WHAT: Shifts the timeline end date forward to load future dates.
   * HOW: Mutates a date copy by advancing the cursor a specific number of steps
   * based on the zoom granularity.
   */
  extendRight(currentEnd: Date, zoom: ZoomLevelEnum, count: number): Date {
    const date = new Date(currentEnd);
    for (let i = 0; i < count; i++) {
      this.advanceCursor(date, zoom);
    }
    return date;
  }

  /**
   * WHAT: Determines the visual position and scale of a work order bar.
   * HOW:
   * - For Day/Week: Uses linear percentage of the total timeline duration.
   * - For Month: Uses a Column-Index + Day-Ratio approach to prevent drift caused
   * by varying month lengths (e.g., Feb vs March), ensuring bars align perfectly
   * with the visual grid columns.
   */
  calculateBarPosition(
    startDateIso: string,
    endDateIso: string,
    timelineRangeStartDate: Date,
    totalTimelineDurationMs: number,
    zoom: ZoomLevelEnum,
    columns: TimelineColumn[],
  ): BarPosition {
    const orderStartTimestamp = this.getLocalTime(startDateIso);
    const orderEndTimestamp = this.getLocalTime(endDateIso);
    const timelineStartTimestamp = this.getLocalTime(timelineRangeStartDate);

    // LOGIC FOR DAY/WEEK: Pure Linear Math
    if (zoom !== ZoomLevelEnum.MONTH) {
      const leftPercentage = ((orderStartTimestamp - timelineStartTimestamp) / totalTimelineDurationMs) * 100;
      const widthPercentage = ((orderEndTimestamp - orderStartTimestamp) / totalTimelineDurationMs) * 100;

      return {
        left: leftPercentage,
        width: widthPercentage
      };
    }

    // LOGIC FOR MONTH: Grid-Relative Math
    const rangeStartObject = new Date(timelineRangeStartDate);
    const orderStartObject = new Date(startDateIso);

    // 1. Calculate how many full month-columns exist between the timeline start and the order start
    const yearsDifference = orderStartObject.getFullYear() - rangeStartObject.getFullYear();
    const monthsDifference = (yearsDifference * 12) + (orderStartObject.getMonth() - rangeStartObject.getMonth());

    // 2. Calculate the position within the starting month (e.g., Jan 15th is ~50% into the column)
    const totalDaysInStartingMonth = new Date(orderStartObject.getFullYear(), orderStartObject.getMonth() + 1, 0).getDate();
    const dayOfMonthIndex = orderStartObject.getDate() - 1; // 0-indexed for math
    const progressWithinMonthRatio = dayOfMonthIndex / totalDaysInStartingMonth;

    // 3. Map the column index and the internal month progress to the total grid width
    const totalColumnCount = columns.length;
    const finalLeftPercentage = ((monthsDifference + progressWithinMonthRatio) / totalColumnCount) * 100;

    // 4. Calculate width based on an average month length (30.44 days) to maintain visual consistency
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const totalOrderDurationDays = (orderEndTimestamp - orderStartTimestamp) / millisecondsPerDay;
    const finalWidthPercentage = (totalOrderDurationDays / (totalColumnCount * 30.44)) * 100;

    return {
      left: finalLeftPercentage,
      width: Math.max(finalWidthPercentage, 1.5) // 1.5% minimum width for visibility
    };
  }

  private getLocalTime(dateInput: string | Date): number {
    const d = new Date(dateInput);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }

  /** * WHAT: Establishes the default date boundaries for the initial render.
   * HOW: Looks at the current date and subtracts/adds periods
   * proportional to the zoom level to provide a balanced starting viewport.
   */
  getInitialRange(zoom: ZoomLevelEnum): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    switch (zoom) {
      case ZoomLevelEnum.MONTH:
        start.setMonth(start.getMonth() - 12);
        start.setDate(1);
        end.setMonth(end.getMonth() + 12);
        end.setDate(1);
        break;
      case ZoomLevelEnum.WEEK:
        start.setDate(start.getDate() - (7 * 26));
        const dayOffset = start.getDay();
        start.setDate(start.getDate() - dayOffset);
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() + (7 * 52));
        break;
      case ZoomLevelEnum.DAY:
        start.setDate(start.getDate() - 90);
        end.setDate(end.getDate() + 90);
        end.setDate(end.getDate() + 180);
        break;
    }
    return { start, end };
  }

  /** * WHAT: Defines the "chunk size" for timeline extensions.
   * HOW: Returns a fixed integer of units (Days/Weeks/Months) to add when the
   * user triggers an infinite scroll event, ensuring smooth date loading.
   */
  getExtensionCount(zoom: ZoomLevelEnum): number {
    switch (zoom) {
      case ZoomLevelEnum.MONTH: return 6;
      case ZoomLevelEnum.WEEK: return 12;
      case ZoomLevelEnum.DAY: return 30;
    }
  }

  /** * WHAT: Generates human-readable labels for the timeline headers.
   * HOW: Uses 'toLocaleDateString' with specific options to return context-aware
   * strings like "Jan 2026" for months or "Feb 12" for days.
   */
  private formatColumnLabel(date: Date, zoom: ZoomLevelEnum): string {
    switch (zoom) {
      case ZoomLevelEnum.MONTH:
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      case ZoomLevelEnum.WEEK: {
        const weekEnd = new Date(date);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { day: 'numeric' })}`;
      }
      case ZoomLevelEnum.DAY:
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }

  /** * WHAT: Identifies if a specific column represents the "present" time.
   * HOW: Compares the column date against the 'now' timestamp using varying
   * precision (Year/Month for Months, Date ranges for Weeks) to highlight the current period.
   */
  private isCurrentPeriod(date: Date, now: Date, zoom: ZoomLevelEnum): boolean {
    switch (zoom) {
      case ZoomLevelEnum.MONTH:
        return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
      case ZoomLevelEnum.WEEK: {
        const weekEnd = new Date(date);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return now >= date && now <= weekEnd;
      }
      case ZoomLevelEnum.DAY:
        return (
          date.getFullYear() === now.getFullYear() &&
          date.getMonth() === now.getMonth() &&
          date.getDate() === now.getDate()
        );
    }
  }

  /** * WHAT: Increments the date cursor based on the zoom level.
   * HOW: Mutates the date object by adding one unit of the current timescale
   * (Day/Week/Month) to move the timeline forward.
   */
  private advanceCursor(date: Date, zoom: ZoomLevelEnum): void {
    switch (zoom) {
      case ZoomLevelEnum.MONTH:
        date.setMonth(date.getMonth() + 1);
        break;
      case ZoomLevelEnum.WEEK:
        date.setDate(date.getDate() + 7);
        break;
      case ZoomLevelEnum.DAY:
        date.setDate(date.getDate() + 1);
        break;
    }
  }

  /** * WHAT: Decrements the date cursor based on the zoom level.
   * HOW: Mutates the date object by subtracting one unit of the current timescale
   * (Day/Week/Month) to move the timeline backward.
   */
  private retreatCursor(date: Date, zoom: ZoomLevelEnum): void {
    switch (zoom) {
      case ZoomLevelEnum.MONTH:
        date.setMonth(date.getMonth() - 1);
        break;
      case ZoomLevelEnum.WEEK:
        date.setDate(date.getDate() - 7);
        break;
      case ZoomLevelEnum.DAY:
        date.setDate(date.getDate() - 1);
        break;
    }
  }
}
