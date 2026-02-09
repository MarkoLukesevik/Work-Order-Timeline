import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgSelectComponent } from "@ng-select/ng-select";

import { ZoomLevelEnum } from '../../enums/zoom-level';

@Component({
  selector: 'app-zoom-selector',
  imports: [
    FormsModule,
    NgSelectComponent,
    ReactiveFormsModule
  ],
  templateUrl: './zoom-selector.html',
  styleUrl: './zoom-selector.scss',
})
export class ZoomSelector {
  @Input() zoom: ZoomLevelEnum = ZoomLevelEnum.MONTH;
  @Output() zoomChange = new EventEmitter<ZoomLevelEnum>();

  zoomOptions = [
    { value: ZoomLevelEnum.DAY, label: 'Day' },
    { value: ZoomLevelEnum.WEEK, label: 'Week' },
    { value: ZoomLevelEnum.MONTH, label: 'Month' },
  ];
}
