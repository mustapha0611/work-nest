import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Button, type ButtonSize, type ButtonVariant } from './button';

@Component({
  imports: [Button],
  template: `
    <button
      wn-button
      class="consumer-class"
      [variant]="variant()"
      [size]="size()"
      [disabled]="disabled()"
      (click)="clicks = clicks + 1"
    >
      Save
    </button>
  `,
})
class ButtonHost {
  readonly variant = signal<ButtonVariant>('primary');
  readonly size = signal<ButtonSize>('md');
  readonly disabled = signal(false);
  clicks = 0;
}

describe('Button', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ButtonHost] }).compileComponents();
  });

  function setUp() {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    return { fixture, button };
  }

  it('applies the default variant and size and projects its content', () => {
    const { button } = setUp();

    expect(button.getAttribute('data-variant')).toBe('primary');
    expect(button.getAttribute('data-size')).toBe('md');
    expect(button.textContent).toContain('Save');
  });

  it('refers to native element type, so platform behaviour still works', () => {
    const { button } = setUp();

    // The attribute selector styles the real button instead of wrapping it.
    expect(button.tagName).toBe('BUTTON');
    // Consumer classes are untouched because styling hooks are data attributes.
    expect(button.classList.contains('consumer-class')).toBe(true);
  });

  it('reflects updated variant and size inputs', () => {
    const { fixture, button } = setUp();

    fixture.componentInstance.variant.set('danger');
    fixture.componentInstance.size.set('sm');
    fixture.detectChanges();

    expect(button.getAttribute('data-variant')).toBe('danger');
    expect(button.getAttribute('data-size')).toBe('sm');
  });

  it('keeps native disabled semantics', () => {
    const { fixture, button } = setUp();

    button.click();
    expect(fixture.componentInstance.clicks).toBe(1);

    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    expect(button.disabled).toBe(true);
    button.click();
    expect(fixture.componentInstance.clicks).toBe(1);
  });
});
