import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  type AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { describeLoginError } from '../../../core/auth/auth-errors';
import { AuthService } from '../../../core/auth/auth.service';
import { Button } from '../../../shared/ui/button/button';
import { TextField } from '../../../shared/ui/text-field/text-field';

@Component({
  selector: 'wn-login-page',
  imports: [ReactiveFormsModule, RouterLink, Button, TextField],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  protected readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected emailError(): string | null {
    const control = this.form.controls.email;

    if (!this.shouldShowError(control)) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Enter your email address.';
    }

    if (control.hasError('email')) {
      return 'Enter a valid email address.';
    }

    return 'Check your email address.';
  }

  protected passwordError(): string | null {
    const control = this.form.controls.password;

    if (!this.shouldShowError(control)) {
      return null;
    }

    return control.hasError('required') ? 'Enter your password.' : 'Check your password.';
  }

  protected submit(): void {
    if (this.submitting()) {
      return;
    }

    this.submitted.set(true);
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    const { email, password } = this.form.getRawValue();

    // The backend normalises case; trimming here saves a pointless round trip
    // for the most common typing accident.
    this.auth.login({ email: email.trim(), password }).subscribe({
      next: () => {
        this.submitting.set(false);
        void this.router.navigateByUrl('/');
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(describeLoginError(error));
      },
    });
  }

  private shouldShowError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || this.submitted());
  }
}
