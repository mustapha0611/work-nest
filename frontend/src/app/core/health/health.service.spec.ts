import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(HealthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('unwraps the data envelope from the health endpoint', async () => {
    const healthPromise = firstValueFrom(service.getHealth());

    httpMock.expectOne('/api/health').flush({
      data: { status: 'ok', uptimeSeconds: 7, timestamp: '2026-10-29T12:00:00.000Z' },
    });

    await expect(healthPromise).resolves.toEqual({
      status: 'ok',
      uptimeSeconds: 7,
      timestamp: '2026-10-29T12:00:00.000Z',
    });
  });

  it('propagates HTTP failures to the caller', async () => {
    const healthPromise = firstValueFrom(service.getHealth());

    httpMock.expectOne('/api/health').flush('unavailable', {
      status: 503,
      statusText: 'Service Unavailable',
    });

    await expect(healthPromise).rejects.toBeTruthy();
  });
});
