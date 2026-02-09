import {Injectable} from '@angular/core';

import TimelineColumn from '../../models/timeline-column';
import BarPosition from '../../models/bar-position';
import { ZoomLevelEnum } from '../../enums/zoom-level';

@Injectable({
  providedIn: 'root',
})
export class TimelineUtilService {
  /** Generate columns between rangeStart and rangeEnd */
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

  /** Extend range to the left, returning the new rangeStart */
  extendLeft(currentStart: Date, zoom: ZoomLevelEnum, count: number): Date {
    const date = new Date(currentStart);
    for (let i = 0; i < count; i++) {
      this.retreatCursor(date, zoom);
    }
    return date;
  }

  /** Extend range to the right, returning the new rangeEnd */
  extendRight(currentEnd: Date, zoom: ZoomLevelEnum, count: number): Date {
    const date = new Date(currentEnd);
    for (let i = 0; i < count; i++) {
      this.advanceCursor(date, zoom);
    }
    return date;
  }

  /** Calculate bar position as percentages of total timeline width */
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

  /** Get initial date range for a given zoom level */
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

  /** How many columns to prepend/append on infinite scroll */
  getExtensionCount(zoom: ZoomLevelEnum): number {
    switch (zoom) {
      case ZoomLevelEnum.MONTH: return 6;
      case ZoomLevelEnum.WEEK: return 12;
      case ZoomLevelEnum.DAY: return 30;
    }
  }

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
