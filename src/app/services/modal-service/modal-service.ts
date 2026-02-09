import { ApplicationRef, ComponentRef, createComponent, Injectable, Type } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private modalRef: ComponentRef<any> | null = null;
  private currentSubject: Subject<any> | null = null;

  constructor(private appRef: ApplicationRef) {}

  open<T>(component: Type<T>, data?: any): Observable<any> {
    if (this.modalRef) {
      return new Subject<any>().asObservable();
    }

    this.currentSubject = new Subject<any>();

    this.modalRef = createComponent(component, {
      environmentInjector: this.appRef.injector,
    });

    if (data) Object.assign(this.modalRef.instance, data);

    this.appRef.attachView(this.modalRef.hostView);
    document.body.appendChild(this.modalRef.location.nativeElement);

    return this.currentSubject.asObservable();
  }

  close(result?: any): void {
    if (!this.modalRef || !this.currentSubject) return;

    this.currentSubject.next(result);
    this.currentSubject.complete();

    this.appRef.detachView(this.modalRef.hostView);
    this.modalRef.destroy();

    this.modalRef = null;
    this.currentSubject = null;
  }
}
