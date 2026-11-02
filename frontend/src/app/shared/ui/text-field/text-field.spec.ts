import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { TextField } from './text-field';

@Component({
  imports: [ReactiveFormsModule, TextField],
  template: `
    <form [formGroup]="form">
      <wn-text-field
        formControlName="email"
        label="Email"
        type="email"
        autocomplete="username"
        hint="Work email"
        [required]="true"
        [error]="error()"
      />
    </form>
  `,
})
class TextFieldHost {
  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.nonNullable.group({ email: [''] });
  readonly error = signal<string | null>(null);
}

describe('TextField', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TextFieldHost] }).compileComponents();
  });

  function setUp() {
    const fixture = TestBed.createComponent(TextFieldHost);
    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    return { fixture, label, input };
  }

  it('associates its label with the input and forwards input attributes', () => {
    const { label, input } = setUp();

    expect(label.getAttribute('for')).toBe(input.id);
    expect(label.textContent).toContain('Email');
    expect(input.type).toBe('email');
    expect(input.getAttribute('autocomplete')).toBe('username');
    expect(input.getAttribute('aria-required')).toBe('true');
  });

  it('renders the hint and points aria-describedby at it', () => {
    const { input } = setUp();
    const hint = document.getElementById(`${input.id}-hint`);

    expect(hint?.textContent).toContain('Work email');
    expect(input.getAttribute('aria-describedby')).toBe(`${input.id}-hint`);
  });

  it('writes the form value into the native input', () => {
    const { fixture, input } = setUp();

    fixture.componentInstance.form.controls.email.setValue('alice@worknest.test');
    fixture.detectChanges();

    expect(input.value).toBe('alice@worknest.test');
  });

  it('propagates typing and blur back to the form control', () => {
    const { fixture, input } = setUp();
    const control = fixture.componentInstance.form.controls.email;

    input.value = 'alice@worknest.test';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));

    expect(control.value).toBe('alice@worknest.test');
    expect(control.touched).toBe(true);
  });

  it('renders an error with role=alert and marks the input invalid', () => {
    const { fixture, input } = setUp();

    fixture.componentInstance.error.set('Enter a valid email address.');
    fixture.detectChanges();

    const error = document.getElementById(`${input.id}-error`);
    expect(error?.textContent).toContain('Enter a valid email address.');
    expect(error?.getAttribute('role')).toBe('alert');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toContain(`${input.id}-error`);
  });

  it('disables the native input when the control is disabled', () => {
    const { fixture, input } = setUp();

    fixture.componentInstance.form.controls.email.disable();
    fixture.detectChanges();

    expect(input.disabled).toBe(true);
  });
});
