import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({ template: '' })
export abstract class BaseFormComponent {
  protected formBuilder: FormBuilder = inject(FormBuilder);
  protected abstract buildForm(): FormGroup;

  protected getErrorMessage(formGroup: FormGroup, field: string): string {
    const control = formGroup.get(field);
    if (!control) return '';
    if (control.hasError('required')) return 'Este campo es requerido';
    if (control.hasError('email')) return 'Ingrese un email válido';
    if (control.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }
    if (control.hasError('maxlength')) {
      const maxLength = control.getError('maxlength').requiredLength;
      return `Máximo ${maxLength} caracteres`;
    }
    if (control.hasError('pattern')) return 'Formato inválido';
    return '';
  }
}
