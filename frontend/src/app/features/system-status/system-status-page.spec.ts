import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SystemStatusPage } from './system-status-page';

const HEALTH_PAYLOAD = {
  data: {
    status: 'ok',
    uptimeSeconds: 42,
    timestamp: '2026-10-29T12:00:00.000Z',
  },
};

describe('SystemStatusPage', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SystemStatusPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function createPage() {
    const fixture = TestBed.createComponent(SystemStatusPage);
    fixture.detectChanges();
    return fixture;
  }

  it('shows a loading state before the API answers', () => {
    const fixture = createPage();

    expect(fixture.nativeElement.textContent).toContain('Checking the API');

    httpMock.expectOne('/api/health').flush(HEALTH_PAYLOAD);
  });

  it('renders the API status once the request succeeds', async () => {
    const fixture = createPage();

    httpMock.expectOne('/api/health').flush(HEALTH_PAYLOAD);
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('API online');
    expect(text).toContain('42');
  });

  it('explains an unreachable API', async () => {
    const fixture = createPage();

    httpMock.expectOne('/api/health').error(new ProgressEvent('error'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('unreachable');
  });

  it('reports a server error without leaking details', async () => {
    const fixture = createPage();

    httpMock
      .expectOne('/api/health')
      .flush('internal detail', { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('unexpected error');
    expect(text).not.toContain('internal detail');
  });
});
