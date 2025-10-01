import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';

export interface ComponentLookup {
  code: string;
  name: string;
  description?: string;
  active: number;
  sortOrder?: number;
}

export interface LocationLookup {
  code: string;
  name: string;
  description?: string;
  active: number;
  sortOrder?: number;
}

@Injectable({ providedIn: 'root' })
export class LookupService {
  private readonly api = inject(ApiService);

  // Components
  getComponents(activeOnly = true): Observable<ApiResponse<ComponentLookup[]>> {
    const params = activeOnly ? { activeOnly: 'true' } : {};
    return this.api.get<ComponentLookup[]>('lookups/components', params);
  }

  getComponent(code: string): Observable<ApiResponse<ComponentLookup>> {
    return this.api.get<ComponentLookup>(`lookups/components/${code}`);
  }

  createComponent(component: Partial<ComponentLookup>): Observable<ApiResponse<ComponentLookup>> {
    return this.api.post<ComponentLookup>('lookups/components', component);
  }

  updateComponent(code: string, update: Partial<ComponentLookup>): Observable<ApiResponse<ComponentLookup>> {
    return this.api.put<ComponentLookup>(`lookups/components/${code}`, update);
    }

  deleteComponent(code: string, soft = true): Observable<ApiResponse<void>> {
    const endpoint = soft ? `lookups/components/${code}?soft=true` : `lookups/components/${code}`;
    return this.api.delete<void>(endpoint);
  }

  // Locations
  getLocations(activeOnly = true): Observable<ApiResponse<LocationLookup[]>> {
    const params = activeOnly ? { activeOnly: 'true' } : {};
    return this.api.get<LocationLookup[]>('lookups/locations', params);
  }

  getLocation(code: string): Observable<ApiResponse<LocationLookup>> {
    return this.api.get<LocationLookup>(`lookups/locations/${code}`);
  }

  createLocation(location: Partial<LocationLookup>): Observable<ApiResponse<LocationLookup>> {
    return this.api.post<LocationLookup>('lookups/locations', location);
  }

  updateLocation(code: string, update: Partial<LocationLookup>): Observable<ApiResponse<LocationLookup>> {
    return this.api.put<LocationLookup>(`lookups/locations/${code}`, update);
  }

  deleteLocation(code: string, soft = true): Observable<ApiResponse<void>> {
    const endpoint = soft ? `lookups/locations/${code}?soft=true` : `lookups/locations/${code}`;
    return this.api.delete<void>(endpoint);
  }
}
