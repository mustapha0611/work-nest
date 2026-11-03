import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { Badge } from '../../../shared/ui/badge/badge';
import { Button } from '../../../shared/ui/button/button';

/**
 * Temporary signed-in screen.
 *
 * Its job is to prove the full session loop — login, `/me`, logout — while the
 * product screens do not exist yet. It is replaced by the workspace shell in
 * M5.
 */
@Component({
  selector: 'wn-home-page',
  imports: [RouterLink, Badge, Button],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly user = this.auth.user;
  protected readonly signingOut = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected signOut(): void {
    if (this.signingOut()) {
      return;
    }

    this.signingOut.set(true);
    this.errorMessage.set(null);

    this.auth.logout().subscribe({
      next: () => {
        this.signingOut.set(false);
        void this.router.navigateByUrl('/login');
      },
      error: () => {
        this.signingOut.set(false);
        this.errorMessage.set('Could not sign out. Check the API and try again.');
      },
    });
  }
}
