import { Component, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

import { WorkOrderService } from './services/work-order-service/work-order.service';
import { ModalService } from './services/modal-service/modal-service';

import { TimelineGrid } from './components/timeline-grid/timeline-grid';
import { ZoomSelector } from './components/zoom-selector/zoom-selector';
import { WorkOrderPanel } from './components/work-order-panel/work-order-panel';

import WorkOrder from './models/work-order';
import { ZoomLevelEnum } from './enums/zoom-level';

@Component({
  selector: 'app-root',
  imports: [TimelineGrid, ZoomSelector, NgOptimizedImage],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly workOrderService: WorkOrderService = inject(WorkOrderService);
  private readonly modalService: ModalService = inject(ModalService);

  readonly workCenters = this.workOrderService.workCenters;
  readonly orders = this.workOrderService.orders;

  zoom = signal<ZoomLevelEnum>(ZoomLevelEnum.MONTH);

  openCreatePanel(workCenterId: string, date: Date): void {
    this.modalService
      .open(WorkOrderPanel, {
        editingOrder: null,
        workCenterId: workCenterId,
        startDate: date,

      })
      .subscribe((result: Omit<WorkOrder, 'id'> & { id?: string }) => {
        if (!result) return;
        this.workOrderService.addOrder(result);
      });
  }

  openEditPanel(order: WorkOrder): void {
    this.modalService
      .open(WorkOrderPanel, {
        editingOrder: order,
        workCenterId: null,
        startDate: null,
      })
      .subscribe((result: WorkOrder) => {
        if (!result) return;
        this.workOrderService.updateOrder(result);
      });
  }

  onDeleteOrder(orderId: string): void {
    this.workOrderService.deleteOrder(orderId);
  }
}
