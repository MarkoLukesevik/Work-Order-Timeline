import { ApplicationRef, ComponentRef, createComponent, Injectable, Type } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private modalRef: ComponentRef<any> | null = null;
  private currentSubject: Subject<any> | null = null;

  constructor(private appRef: ApplicationRef) {}

  /** * WHAT: Dynamically opens a component as a modal overlay.
   * HOW: Uses 'createComponent' to instantiate the component via code, injects
   * provided data, and attaches the view to the ApplicationRef to keep it outside standard routing.
   */
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

  /** * WHAT: Closes the active modal and cleans up the DOM.
   * HOW: Emits the result to the caller, detaches the view, and destroys the
   * component reference to ensure zero memory leaks.
   */
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
