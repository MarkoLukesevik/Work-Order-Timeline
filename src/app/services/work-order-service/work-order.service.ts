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
    startDate: '2026-01-15',
    endDate: '2026-03-20',
    status: WorkOrderStatusEnum.COMPLETED,
  },
  {
    id: 'wo2',
    name: 'Rodriques Electrics',
    workCenterId: 'wc2',
    startDate: '2026-09-01',
    endDate: '2026-12-15',
    status: WorkOrderStatusEnum.IN_PROGRESS,
  },
  {
    id: 'wo3',
    name: 'Konsulting Inc',
    workCenterId: 'wc3',
    startDate: '2026-09-10',
    endDate: '2026-11-01',
    status: WorkOrderStatusEnum.IN_PROGRESS,
  },
  {
    id: 'wo4',
    name: 'Complex Systems',
    workCenterId: 'wc3',
    startDate: '2025-11-10',
    endDate: '2026-02-15',
    status: WorkOrderStatusEnum.IN_PROGRESS,
  },
  {
    id: 'wo5',
    name: 'McMarrow Distribution',
    workCenterId: 'wc4',
    startDate: '2025-09-20',
    endDate: '2026-01-25',
    status: WorkOrderStatusEnum.BLOCKED,
  },
  {
    id: 'wo6',
    name: 'Apex Manufacturing',
    workCenterId: 'wc1',
    startDate: '2026-05-01',
    endDate: '2026-07-15',
    status: WorkOrderStatusEnum.IN_PROGRESS,
  },
  {
    id: 'wo7',
    name: 'Global Logistics',
    workCenterId: 'wc5',
    startDate: '2026-02-01',
    endDate: '2026-04-10',
    status: WorkOrderStatusEnum.COMPLETED,
  },
  {
    id: 'wo8',
    name: 'Solaris Energy',
    workCenterId: 'wc2',
    startDate: '2026-01-10',
    endDate: '2026-05-20',
    status: WorkOrderStatusEnum.BLOCKED,
  },
  {
    id: 'wo9',
    name: 'Nova Tech Solutions',
    workCenterId: 'wc4',
    startDate: '2026-03-15',
    endDate: '2026-06-01',
    status: WorkOrderStatusEnum.IN_PROGRESS,
  },
  {
    id: 'wo10',
    name: 'Starlight Foundry',
    workCenterId: 'wc5',
    startDate: '2026-07-20',
    endDate: '2026-10-30',
    status: WorkOrderStatusEnum.IN_PROGRESS,
  },
  {
    id: 'wo11',
    name: 'Blue Horizon Labs',
    workCenterId: 'wc1',
    startDate: '2025-06-01',
    endDate: '2025-08-30',
    status: WorkOrderStatusEnum.COMPLETED,
  },
  {
    id: 'wo12',
    name: 'Quantum Circuits',
    workCenterId: 'wc3',
    startDate: '2026-03-01',
    endDate: '2026-05-15',
    status: WorkOrderStatusEnum.IN_PROGRESS,
  },
  {
    id: 'wo13',
    name: 'Horizon Analytics',
    workCenterId: 'wc2',
    startDate: '2025-11-01',
    endDate: '2025-12-20',
    status: WorkOrderStatusEnum.OPEN,
  },
  {
    id: 'wo14',
    name: 'Titan Heavy Industries',
    workCenterId: 'wc4',
    startDate: '2026-07-10',
    endDate: '2026-09-05',
    status: WorkOrderStatusEnum.OPEN,
  },
  {
    id: 'wo15',
    name: 'Velocity Cargo',
    workCenterId: 'wc5',
    startDate: '2026-11-15',
    endDate: '2027-01-10',
    status: WorkOrderStatusEnum.OPEN,
  }
];

@Injectable({
  providedIn: 'root',
})
export class WorkOrderService {
  readonly workCenters: WorkCenter[] = DEFAULT_WORK_CENTERS;
  readonly orders = signal<WorkOrder[]>(this.loadOrders());

  /** * WHAT: Hydrates the initial work order state.
   * HOW: Checks for type safety (typeof localStorage), then attempts to parse
   * persisted data, falling back to SEED_ORDERS if storage is empty or corrupt.
   */
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

  /** * WHAT: Validates scheduling conflicts for a specific work center.
   * HOW: Performs an interval intersection check (StartA < EndB && EndA > StartB)
   * across existing orders, ignoring the order being edited via its ID.
   */
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

  /** * WHAT: Adds a new work order to the system.
   * HOW: Generates a cryptographically strong unique ID using the native Web Crypto API,
   * then updates the Signal state immutably to trigger efficient UI re-renders.
   */
  addOrder(newOrderData: Omit<WorkOrder, 'id'>): void {
    this.orders.update(currentOrders => {
      const generatedOrderId = crypto.randomUUID();
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

  /** * WHAT: Updates the details of an existing work order.
   * HOW: Maps through the current state to replace the matching ID with
   * new data, followed by a persistence call to save the updated state.
   */
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

  /** * WHAT: Removes a work order from the schedule.
   * HOW: Filters the Signal state to exclude the target ID and updates
   * localStorage to reflect the removal across refreshes.
   */
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
