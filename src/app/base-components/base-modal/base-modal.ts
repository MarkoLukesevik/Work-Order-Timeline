import {Component, inject} from '@angular/core';
import { ModalService } from '../../services/modal-service/modal-service';

@Component({
  selector: 'app-base-modal',
  imports: [],
  templateUrl: './base-modal.html',
  styleUrl: './base-modal.scss',
})
export class BaseModal {
  private modalService: ModalService = inject(ModalService);

  closeModal(): void {
    this.modalService.close(null);
  }
}
