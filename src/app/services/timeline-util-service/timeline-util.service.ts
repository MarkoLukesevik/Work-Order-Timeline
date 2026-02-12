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

  /** * WHAT: Determines the visual position and scale of a work order bar.
   * HOW: Converts the start/end dates into a percentage-based 'left' and 'width'
   * relative to the total timeline duration to ensure responsive alignment.
   */
  calculateBarPosition(
    startDate: string,
    endDate: string,
    rangeStart: Date,
    timelineDurationMs: number
  ): BarPosition {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const rangeMs = rangeStart.getTime();

    const leftPct = ((start - rangeMs) / timelineDurationMs) * 100;
    const widthPct = ((end - start) / timelineDurationMs) * 100;

    return {
      left: Math.max(0, leftPct),
      width: Math.max(0.5, widthPct),
    };
  }

  /** * WHAT: Establishes the default date boundaries for the initial render.
   * HOW: Looks at the current date and subtracts/adds periods (6-12 months)
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
        start.setDate(start.getDate() - 7 * 26); // ~6 months
        end.setDate(end.getDate() + 7 * 26);
        break;
      case ZoomLevelEnum.DAY:
        start.setDate(start.getDate() - 90);
        end.setDate(end.getDate() + 90);
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
