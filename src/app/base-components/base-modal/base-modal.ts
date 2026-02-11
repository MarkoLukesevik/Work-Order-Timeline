import { Component, EventEmitter, HostListener, Output } from '@angular/core';

@Component({
  selector: 'app-base-modal',
  imports: [],
  templateUrl: './base-modal.html',
  styleUrl: './base-modal.scss',
})
export class BaseModal {
  @Output() handleCloseModal: EventEmitter<any> = new EventEmitter();

  @HostListener('document:keydown.escape', ['$event'])
  onEscPressed(event: Event): void {
    event.preventDefault();
    this.handleCloseModal.emit();
  }
}
