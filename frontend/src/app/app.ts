import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HealthService, type ApiHealth } from './core/health/health.service';
import { Badge } from './shared/ui/badge/badge';
import { Button } from './shared/ui/button/button';

type FailureKind = 'unreachable' | 'server';

type HealthState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly health: ApiHealth }
  | { readonly status: 'failed'; readonly kind: FailureKind; readonly message: string };

@Component({
  selector: 'wn-root',
  imports: [Badge, Button],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly healthService = inject(HealthService);

  private readonly state = signal<HealthState>({ status: 'loading' });

  protected readonly isLoading = computed(() => this.state().status === 'loading');

  protected readonly health = computed(() => {
    const state = this.state();
    return state.status === 'ready' ? state.health : null;
  });

  protected readonly failureBadge = computed(() => {
    const state = this.state();
    if (state.status !== 'failed') {
      return null;
    }

    return state.kind === 'unreachable' ? 'API unreachable' : 'API error';
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
        this.state.set({ status: 'failed', ...describeHealthError(error) }),
    });
  }
}

function describeHealthError(error: unknown): { kind: FailureKind; message: string } {
  if (error instanceof HttpErrorResponse && error.status === 0) {
    return {
      kind: 'unreachable',
      message: 'Start the backend on port 3000 and try again.',
    };
  }

  return {
    kind: 'server',
    message: 'The API responded with an unexpected error.',
  };
}
