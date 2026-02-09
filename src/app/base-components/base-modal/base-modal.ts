import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-base-modal',
  imports: [],
  templateUrl: './base-modal.html',
  styleUrl: './base-modal.scss',
})
export class BaseModal {
  @Output() onBackgroundClick: EventEmitter<any> = new EventEmitter();
}
