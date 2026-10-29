import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { HealthService, type ApiHealth } from './core/health/health.service';

type HealthState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly health: ApiHealth }
  | { readonly status: 'failed'; readonly message: string };

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly healthService = inject(HealthService);

  private readonly state = signal<HealthState>({ status: 'loading' });

  protected readonly isLoading = computed(() => this.state().status === 'loading');

  protected readonly health = computed(() => {
    const state = this.state();
    return state.status === 'ready' ? state.health : null;
  });

  protected readonly failureMessage = computed(() => {
    const state = this.state();
    return state.status === 'failed' ? state.message : null;
  });

  constructor() {
    this.checkHealth();
  }

  protected checkHealth(): void {
    this.state.set({ status: 'loading' });

    // HTTP observables complete after one emission, so no teardown is needed.
    this.healthService.getHealth().subscribe({
      next: (health) => this.state.set({ status: 'ready', health }),
      error: (error: unknown) =>
        this.state.set({ status: 'failed', message: describeHealthError(error) }),
    });
  }
}

function describeHealthError(error: unknown): string {
  if (error instanceof HttpErrorResponse && error.status === 0) {
    return 'The API is unreachable. Start the backend on port 3000 and try again.';
  }

  return 'The API responded with an unexpected error.';
}
