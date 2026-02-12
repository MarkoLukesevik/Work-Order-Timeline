import { Component, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

import { WorkOrderService } from './services/work-order-service/work-order.service';
import { ModalService } from './services/modal-service/modal-service';

import { ZoomSelector } from './components/zoom-selector/zoom-selector';
import { WorkOrderPanel } from './components/work-order-panel/work-order-panel';
import { Timeline } from './components/timeline/timeline';

import WorkOrder from './models/work-order';
import { ZoomLevelEnum } from './enums/zoom-level';

@Component({
  selector: 'app-root',
  imports: [ZoomSelector, NgOptimizedImage, Timeline],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly workOrderService: WorkOrderService = inject(WorkOrderService);
  private readonly modalService: ModalService = inject(ModalService);

  readonly workCenters = this.workOrderService.workCenters;
  readonly orders = this.workOrderService.orders;

  // WHAT: Reactive state for the current timescale.
  // HOW: Managed via a Signal to ensure that when the zoom changes, all
  // dependent timeline calculations re-run automatically.
  zoom = signal<ZoomLevelEnum>(ZoomLevelEnum.MONTH);

  /** * WHAT: Launches the creation flow for a new work order.
   * HOW: Opens the dynamic WorkOrderPanel with context-specific data and
   * subscribes to the result to add a new record to the centralized state.
   */
  openCreatePanel(workCenterId: string, date: Date): void {
    this.modalService
      .open(WorkOrderPanel, {
        editingOrder: null,
        workCenterId: workCenterId,
        initialStartDate: date,

      })
      .subscribe((result: Omit<WorkOrder, 'id'> & { id?: string }) => {
        if (!result) return;
        this.workOrderService.addOrder(result);
      });
  }

  /** * WHAT: Launches the edit flow for an existing work order.
   * HOW: Opens the dynamic WorkOrderPanel with existing order data and
   * subscribes to the result to update the record in the centralized state.
   */
  openEditPanel(order: WorkOrder): void {
    this.modalService
      .open(WorkOrderPanel, {
        editingOrder: order,
        workCenterId: null,
        initialStartDate: null,
      })
      .subscribe((result: WorkOrder) => {
        if (!result) return;
        this.workOrderService.updateOrder(result);
      });
  }

  /** * WHAT: Orchestrates order removal from the UI.
   * HOW: Delegates the deletion to the WorkOrderService, which handles
   * state updates and local storage persistence.
   */
  onDeleteOrder(orderId: string): void {
    this.workOrderService.deleteOrder(orderId);
  }
}
