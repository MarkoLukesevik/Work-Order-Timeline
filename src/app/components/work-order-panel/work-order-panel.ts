import {Component, inject, Input, OnInit} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {NgbDatepickerModule, NgbDateStruct, NgbInputDatepicker} from '@ng-bootstrap/ng-bootstrap';
import {NgSelectModule} from '@ng-select/ng-select';

import {WorkOrderService} from '../../services/work-order-service/work-order.service';
import {ModalService} from '../../services/modal-service/modal-service';

import {BaseModal} from '../../base-components/base-modal/base-modal';

import WorkOrder from '../../models/work-order';
import {WorkOrderStatusEnum} from '../../enums/work-order-status';

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
  @Input() initialStartDate: Date | null = null;

  private readonly workOrderService: WorkOrderService = inject(WorkOrderService);
  private readonly modalService: ModalService = inject(ModalService);

  public isClosing: boolean = false;

  readonly statusOptions = [
    { value: WorkOrderStatusEnum.OPEN, label: 'Open' },
    { value: WorkOrderStatusEnum.IN_PROGRESS, label: 'In Progress' },
    { value: WorkOrderStatusEnum.COMPLETED, label: 'Completed' },
    { value: WorkOrderStatusEnum.BLOCKED, label: 'Blocked' }
  ];

  form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl<WorkOrderStatusEnum | null>(null, [Validators.required]),
    startDate: new FormControl<NgbDateStruct | null>(null, [Validators.required]),
    endDate: new FormControl<NgbDateStruct | null>(null, [Validators.required]),
  }, {
    validators: [this.dateOrderValidator, this.validateWorkCenterOverlap.bind(this)]
  });

  get isEditMode(): boolean {
    return !!this.editingOrder;
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    if (this.editingOrder) {
      this.form.patchValue({
        name: this.editingOrder.name,
        status: this.editingOrder.status,
        startDate: this.convertToNgbDateStruct(this.editingOrder.startDate),
        endDate: this.convertToNgbDateStruct(this.editingOrder.endDate),
      });
    } else if (this.initialStartDate) {
      const preFilledEndDate = new Date(this.initialStartDate)
      preFilledEndDate.setDate(preFilledEndDate.getDate() + 7)
      this.form.patchValue({
        startDate: this.convertToNgbDateStruct(this.initialStartDate),
        endDate: this.convertToNgbDateStruct(preFilledEndDate),
        status: WorkOrderStatusEnum.OPEN
      });
    }
  }

  private startCloseAnimation(payload?: WorkOrder): void {
    this.isClosing = true;

    setTimeout(() => {
      this.modalService.close(payload);
    }, 250);
  }

  // region date utils
  private convertToNgbDateStruct(date: Date | string): NgbDateStruct {
    const d = new Date(date);
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  }

  private formatToIsoDateString(struct: NgbDateStruct): string {
    return `${struct.year}-${String(struct.month).padStart(2, '0')}-${String(struct.day).padStart(2, '0')}`;
  }
  // endregion

  // region validations
  private dateOrderValidator(group: AbstractControl): ValidationErrors | null {
    const start = group.get('startDate')?.value as NgbDateStruct;
    const end = group.get('endDate')?.value as NgbDateStruct;

    if (!start || !end) return null;

    const startDate = new Date(start.year, start.month - 1, start.day);
    const endDate = new Date(end.year, end.month - 1, end.day);

    return endDate >= startDate ? null : { dateOrder: true };
  }

  private validateWorkCenterOverlap(group: AbstractControl): ValidationErrors | null {
    const workCenterId = this.editingOrder?.workCenterId || this.workCenterId;
    const startDateStruct = group.get('startDate')?.value;
    const endDateStruct = group.get('endDate')?.value;

    if (!workCenterId || !startDateStruct || !endDateStruct) return null;

    const startDateIso = this.formatToIsoDateString(startDateStruct);
    const endDateIso = this.formatToIsoDateString(endDateStruct);
    const currentOrderId = this.editingOrder?.id;

    const hasCollision = this.workOrderService.hasOverlap(
      workCenterId,
      startDateIso,
      endDateIso,
      currentOrderId
    );

    return hasCollision ? { workCenterOverlap: true } : null;
  }
  // endregion

  // region public actions
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    const payload = {
      ...this.editingOrder,
      workCenterId: this.editingOrder?.workCenterId || this.workCenterId!,
      name: raw.name,
      status: raw.status!,
      startDate: this.formatToIsoDateString(raw.startDate!),
      endDate: this.formatToIsoDateString(raw.endDate!),
    } as WorkOrder;

    this.startCloseAnimation(payload);
  }

  closePanel(): void {
    this.startCloseAnimation();
  }
  // endregion
}
