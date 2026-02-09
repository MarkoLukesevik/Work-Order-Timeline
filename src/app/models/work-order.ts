import { WorkOrderStatusEnum } from '../enums/work-order-status';

export default interface WorkOrder {
  id: string;
  name: string;
  workCenterId: string;
  startDate: string;
  endDate: string;
  status: WorkOrderStatusEnum;
}
