import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { NgClass, NgOptimizedImage } from '@angular/common';

import WorkOrder from '../../models/work-order';
import { WorkOrderStatusEnum } from '../../enums/work-order-status';

@Component({
  selector: 'app-work-order-bar',
  imports: [
    NgClass,
    NgOptimizedImage
  ],
  templateUrl: './work-order-bar.html',
  styleUrl: './work-order-bar.scss',
})
export class WorkOrderBar {
  @Input() order!: WorkOrder;
  @Input() left = 0;
  @Input() width = 0;
  @Output() edit = new EventEmitter<WorkOrder>();
  @Output() delete = new EventEmitter<string>();

  menuOpen = false;

  get statusClass(): string {
    switch (this.order.status) {
      case WorkOrderStatusEnum.OPEN:
        return 'open';
      case WorkOrderStatusEnum.IN_PROGRESS:
        return 'inprogress';
      case WorkOrderStatusEnum.COMPLETED:
        return 'completed';
      case WorkOrderStatusEnum.BLOCKED:
        return 'blocked';
      default:
        return '';
    }
  }

  constructor(private elRef: ElementRef) {}

  statusText(status: WorkOrderStatusEnum): string {
    switch (status) {
      case WorkOrderStatusEnum.OPEN:
        return 'Open';
      case WorkOrderStatusEnum.IN_PROGRESS:
        return 'In progress';
      case WorkOrderStatusEnum.COMPLETED:
        return 'Completed';
      case WorkOrderStatusEnum.BLOCKED:
        return 'Blocked';
      default:
        return '';
    }
  }

  toggleMenu(e: Event): void {
    e.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  onEdit(e: Event): void {
    e.stopPropagation();
    this.menuOpen = false;
    this.edit.emit(this.order);
  }

  onDelete(e: Event): void {
    e.stopPropagation();
    this.menuOpen = false;
    this.delete.emit(this.order.id);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.menuOpen && !this.elRef.nativeElement.contains(event.target)) {
      this.menuOpen = false;
    }
  }
}
