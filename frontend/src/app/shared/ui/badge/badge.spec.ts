import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Badge, type BadgeTone } from './badge';

@Component({
  imports: [Badge],
  template: `<span wn-badge [tone]="tone()">API online</span>`,
})
class BadgeHost {
  readonly tone = signal<BadgeTone>('neutral');
}

describe('Badge', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BadgeHost] }).compileComponents();
  });

  function setUp() {
    const fixture = TestBed.createComponent(BadgeHost);
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('span') as HTMLSpanElement;
    return { fixture, badge };
  }

  it('defaults to the neutral tone and projects its content', () => {
    const { badge } = setUp();

    expect(badge.getAttribute('data-tone')).toBe('neutral');
    expect(badge.textContent).toContain('API online');
  });

  it('keeps the native span element', () => {
    const { badge } = setUp();

    expect(badge.tagName).toBe('SPAN');
  });

  it('reflects tone changes without recreating the element', () => {
    const { fixture, badge } = setUp();

    fixture.componentInstance.tone.set('danger');
    fixture.detectChanges();

    expect(badge.getAttribute('data-tone')).toBe('danger');
    expect(fixture.nativeElement.querySelector('span')).toBe(badge);
  });
});
