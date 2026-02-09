import { Component, inject, Input, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { NgbDatepickerModule, NgbDateStruct, NgbInputDatepicker } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';

import { WorkOrderService } from '../../services/work-order-service/work-order.service';
import { ModalService } from '../../services/modal-service/modal-service';

import { BaseModal } from '../../base-components/base-modal/base-modal';

import WorkOrder from '../../models/work-order';
import { WorkOrderStatusEnum } from '../../enums/work-order-status';

@Component({
  selector: 'app-work-order-panel',
  imports: [
    NgbInputDatepicker,
    ReactiveFormsModule,
    NgbDatepickerModule,
    NgSelectModule,
    BaseModal
  ],
  templateUrl: './work-order-panel.html',
  styleUrl: './work-order-panel.scss',
})
export class WorkOrderPanel implements OnInit {
  @Input() editingOrder: WorkOrder | null = null;
  @Input() workCenterId: string | null = null;
  @Input() startDate: Date | null = null;

  private readonly workOrderService: WorkOrderService = inject(WorkOrderService);
  private readonly modalService: ModalService = inject(ModalService);

  statusOptions = [
    { value: WorkOrderStatusEnum.OPEN, label: 'Open' },
    { value: WorkOrderStatusEnum.IN_PROGRESS, label: 'In Progress' },
    { value: WorkOrderStatusEnum.COMPLETED, label: 'Completed' },
    { value: WorkOrderStatusEnum.BLOCKED, label: 'Blocked' }
  ];

  form = new FormGroup(
    {
      name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      status: new FormControl<WorkOrderStatusEnum | null>(null, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      startDate: new FormControl<NgbDateStruct | null>(null, [Validators.required]),
      endDate: new FormControl<NgbDateStruct | null>(null, [Validators.required]),
    },
    { validators: [this.dateOrderValidator.bind(this), this.overlapValidator.bind(this)] }
  );

  ngOnInit() {
    if (this.editingOrder) {
      this.form.patchValue({
        name: this.editingOrder.name,
        status: this.editingOrder.status,
        startDate: this.toNgbDateStruct(new Date(this.editingOrder.startDate)),
        endDate: this.toNgbDateStruct(new Date(this.editingOrder.endDate)),
      });
    } else if (this.startDate) {
      this.form.patchValue({
        startDate: this.toNgbDateStruct(new Date(this.startDate)),
      });
    }
  }

  private toNgbDateStruct(date: Date): NgbDateStruct {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    };
  }

  private ngbToIso(d: NgbDateStruct): string {
    return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
  }

  private dateOrderValidator(group: AbstractControl): ValidationErrors | null {
    const start = group.get('startDate')?.value as NgbDateStruct | null;
    const end = group.get('endDate')?.value as NgbDateStruct | null;
    if (!start || !end) return null;
    const sDate = new Date(start.year, start.month - 1, start.day);
    const eDate = new Date(end.year, end.month - 1, end.day);
    return eDate > sDate ? null : { dateOrder: true };
  }

  private overlapValidator(group: AbstractControl): ValidationErrors | null {
    const wcId = group.get('workCenterId')?.value as string;
    const start = group.get('startDate')?.value as NgbDateStruct | null;
    const end = group.get('endDate')?.value as NgbDateStruct | null;
    if (!wcId || !start || !end) return null;

    const startIso = this.ngbToIso(start);
    const endIso = this.ngbToIso(end);
    const excludeId = this.editingOrder?.id;

    return this.workOrderService.hasOverlap(wcId, startIso, endIso, excludeId) ? { overlap: true } : null;
  }

  onClose(): void {
    this.modalService.close();
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const val = this.form.getRawValue();

    const order = {
      workCenterId: this.editingOrder ? this.editingOrder.workCenterId : this.workCenterId,
      name: val.name,
      status: val.status,
      startDate: this.ngbToIso(val.startDate!),
      endDate: this.ngbToIso(val.endDate!),
    } as WorkOrder;

    if (this.editingOrder && this.editingOrder.id)
      order.id = this.editingOrder.id;

    this.modalService.close(order);
  }
}
