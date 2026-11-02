import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Application shell.
 *
 * It owns nothing but the router outlet for now. The signed-in layout (sidebar,
 * topbar, workspace switcher) arrives with M5, when there is something to put
 * inside it.
 */
@Component({
  selector: 'wn-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
