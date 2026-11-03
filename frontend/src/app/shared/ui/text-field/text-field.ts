import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type TextFieldType = 'text' | 'email' | 'password';

/**
 * Ids only need to be unique within the page. A module counter is stable across
 * server render and hydration, unlike `Math.random()`.
 */
let nextFieldId = 0;

/**
 * A labelled text input that works with Angular forms.
 *
 * The component owns the label/input association, hint and error wiring, so
 * every form gets the same accessible markup instead of re-inventing ids and
 * `aria-describedby` at each call site.
 *
 * @example
 * <wn-text-field formControlName="email" label="Email" type="email" />
 */
@Component({
  selector: 'wn-text-field',
  templateUrl: './text-field.html',
  styleUrl: './text-field.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextField),
      multi: true,
    },
  ],
})
export class TextField implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly type = input<TextFieldType>('text');
  readonly autocomplete = input<string>('off');
  readonly hint = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly required = input(false);

  protected readonly id = `wn-text-field-${nextFieldId++}`;
  protected readonly value = signal('');
  protected readonly disabled = signal(false);

  protected readonly describedBy = computed(() => {
    const ids: string[] = [];

    if (this.hint()) {
      ids.push(`${this.id}-hint`);
    }

    if (this.error()) {
      ids.push(`${this.id}-error`);
    }

    return ids.length > 0 ? ids.join(' ') : null;
  });

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: unknown): void {
    this.value.set(typeof value === 'string' ? value : '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected handleInput(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.value.set(target.value);
      this.onChange(target.value);
    }
  }

  protected handleBlur(): void {
    this.onTouched();
  }
}
