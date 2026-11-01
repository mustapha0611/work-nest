import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/**
 * A short status label on a tinted background.
 *
 * The tone never carries meaning alone: the label text is always present, so
 * colour-blind users and screen readers get the same information.
 *
 * @example
 * <span wn-badge tone="success">API online</span>
 */
@Component({
  selector: 'span[wn-badge]',
  template: '<ng-content />',
  styleUrl: './badge.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-tone]': 'tone()',
  },
})
export class Badge {
  readonly tone = input<BadgeTone>('neutral');
}
