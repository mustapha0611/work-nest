import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';

/**
 * Raw transport shape returned by `GET /api/health`.
 *
 * Kept private to the service so components depend on the domain model below
 * rather than on the API envelope. When the envelope changes, only this file
 * needs to change.
 */
interface HealthResponse {
  data: {
    status: string;
    uptimeSeconds: number;
    timestamp: string;
  };
}

export interface ApiHealth {
  status: string;
  uptimeSeconds: number;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class HealthService {
  private readonly http = inject(HttpClient);

  getHealth(): Observable<ApiHealth> {
    return this.http.get<HealthResponse>('/api/health').pipe(map((response) => response.data));
  }
}
