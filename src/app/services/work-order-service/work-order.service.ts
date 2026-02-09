import { Injectable, signal } from '@angular/core';

import WorkCenter from '../../models/work-center';
import WorkOrder from '../../models/work-order';
import { WorkOrderStatusEnum } from '../../enums/work-order-status';

const STORAGE_KEY = 'work-orders';

const DEFAULT_WORK_CENTERS: WorkCenter[] = [
  { id: 'wc1', name: 'Genesis Hardware' },
  { id: 'wc2', name: 'Rodriques Electrics' },
  { id: 'wc3', name: 'Konsulting Inc' },
  { id: 'wc4', name: 'McMarrow Distribution' },
  { id: 'wc5', name: 'Spartan Manufacturing' },
];

const SEED_ORDERS: WorkOrder[] = [
  {
    id: 'wo1',
    name: 'Intrix Ltd',
    workCenterId: 'wc1',
    startDate: '2024-08-15',
    endDate: '2024-10-20',
    status: WorkOrderStatusEnum.COMPLETED,
  },
  {
    id: 'wo2',
    name: 'Rodriques Electrics',
    workCenterId: 'wc2',
    startDate: '2024-09-01',
    endDate: '2024-12-15',
    status: WorkOrderStatusEnum.IN_PROGRESS,
  },
  {
    id: 'wo3',
    name: 'Konsulting Inc',
    workCenterId: 'wc3',
    startDate: '2024-09-10',
    endDate: '2024-11-01',
    status: WorkOrderStatusEnum.IN_PROGRESS,
  },
  {
    id: 'wo4',
    name: 'Complex Systems',
    workCenterId: 'wc3',
    startDate: '2024-11-10',
    endDate: '2025-02-15',
    status: WorkOrderStatusEnum.IN_PROGRESS,
  },
  {
    id: 'wo5',
    name: 'McMarrow Distribution',
    workCenterId: 'wc4',
    startDate: '2024-09-20',
    endDate: '2025-01-25',
    status: WorkOrderStatusEnum.BLOCKED,
  },
];

@Injectable({
  providedIn: 'root',
})
export class WorkOrderService {
  readonly workCenters: WorkCenter[] = DEFAULT_WORK_CENTERS;
  readonly orders = signal<WorkOrder[]>(this.loadOrders());

  private loadOrders(): WorkOrder[] {
    if (typeof localStorage === 'undefined') return SEED_ORDERS;

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as WorkOrder[];
      } catch {
        return SEED_ORDERS;
      }
    }

    this.persist(SEED_ORDERS);
    return SEED_ORDERS;
  }

  private persist(orders: WorkOrder[]): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    }
  }

  getOrdersForWorkCenter(workCenterId: string): WorkOrder[] {
    return this.orders().filter(wordOrder => wordOrder.workCenterId === workCenterId);
  }

  hasOverlap(
    workCenterId: string,
    newOrderStartDate: string,
    newOrderEndDate: string,
    excludeOrderId?: string
  ): boolean {
    const newOrderStartTimestamp = new Date(newOrderStartDate).getTime();
    const newOrderEndTimestamp = new Date(newOrderEndDate).getTime();
    const existingOrdersForWorkCenter =
      this.getOrdersForWorkCenter(workCenterId);

    return existingOrdersForWorkCenter.some(existingOrder  => {
      if (excludeOrderId && existingOrder.id === excludeOrderId) return false;

      const existingOrderStartTimestamp =
        new Date(existingOrder.startDate).getTime();

      const existingOrderEndTimestamp =
        new Date(existingOrder.endDate).getTime();

      const startsBeforeExistingEnds =
        newOrderStartTimestamp < existingOrderEndTimestamp;

      const endsAfterExistingStarts =
        newOrderEndTimestamp > existingOrderStartTimestamp;

      return startsBeforeExistingEnds && endsAfterExistingStarts;
    });
  }

  addOrder(newOrderData: Omit<WorkOrder, 'id'>): void {
    this.orders.update(currentOrders => {
      const generatedOrderId = 'wo_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      const newWorkOrder: WorkOrder = {
        ...newOrderData,
        id: generatedOrderId
      }

      const updatedOrdersList = [
        ...currentOrders,
        newWorkOrder
      ]

      this.persist(updatedOrdersList);
      return updatedOrdersList;
    })
  }

  updateOrder(updatedOrder: WorkOrder): void {
    this.orders.update(currentOrders => {
      const updatedOrdersList = currentOrders.map(existingOrder =>
        existingOrder.id === updatedOrder.id
          ? updatedOrder
          : existingOrder
      );

      this.persist(updatedOrdersList);
      return updatedOrdersList;
    });
  }

  deleteOrder(orderIdToDelete: string): void {
    this.orders.update(currentOrders => {
      const updatedOrdersList = currentOrders.filter(
        existingOrder => existingOrder.id !== orderIdToDelete
      );

      this.persist(updatedOrdersList);
      return updatedOrdersList;
    });
  }
}
