import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

/**
 * Applies WorkNest button styling to a native `<button>`.
 *
 * The selector is an attribute so the platform keeps doing its job: form
 * submission, native `disabled`, keyboard activation, and screen-reader
 * semantics all work without re-implementation.
 *
 * @example
 * <button wn-button variant="secondary" (click)="save()">Save</button>
 */
@Component({
  selector: 'button[wn-button]',
  template: '<ng-content />',
  styleUrl: './button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
  },
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
}
