import {Component, forwardRef, Input} from '@angular/core';
import {ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR} from '@angular/forms';
import {NgSelectModule} from '@ng-select/ng-select';

@Component({
  selector: 'app-base-select',
  imports: [
    NgSelectModule,
    FormsModule
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BaseSelect),
      multi: true,
    },
  ],
  templateUrl: './base-select.html',
  styleUrl: './base-select.scss',
})
export class BaseSelect implements ControlValueAccessor {
  @Input() items: any[] = [];
  @Input() bindLabel = '';
  @Input() bindValue = '';
  @Input() placeholder = '';
  @Input() searchable = false;
  @Input() clearable = false;

  value: any = null;
  disabled = false;

  onChange = (_: any) => {};
  onTouched = () => {};

  writeValue(value: any): void {
    this.value = value;
  }

  handleOnChange(event: any) {
    this.value = event;
    this.onChange(event);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
