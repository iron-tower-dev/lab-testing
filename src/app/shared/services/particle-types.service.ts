import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, map, tap, shareReplay } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';
import { ParticleTypeDefinition } from '../../enter-results/enter-results.types';

@Injectable({
  providedIn: 'root'
})
export class ParticleTypesService {
  private readonly apiService = inject(ApiService);
  
  // Cache for particle type definitions
  private particleTypesCache$ = new BehaviorSubject<ParticleTypeDefinition[]>([]);
  private lastFetchTime = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  /**
   * Get all particle type definitions
   * Uses caching to avoid unnecessary API calls
   */
  getParticleTypes(forceRefresh = false): Observable<ParticleTypeDefinition[]> {
    const now = Date.now();
    const shouldFetch = forceRefresh || 
                       this.particleTypesCache$.value.length === 0 || 
                       (now - this.lastFetchTime) > this.CACHE_DURATION;

    if (shouldFetch) {
      return this.fetchParticleTypesFromApi();
    }

    return this.particleTypesCache$.asObservable();
  }

  /**
   * Get active particle type definitions only
   */
  getActiveParticleTypes(forceRefresh = false): Observable<ParticleTypeDefinition[]> {
    return this.getParticleTypes(forceRefresh).pipe(
      map(types => types.filter(type => type.active === '1'))
    );
  }

  /**
   * Get a specific particle type by ID
   */
  getParticleTypeById(id: number): Observable<ParticleTypeDefinition> {
    return this.apiService.get<ParticleTypeDefinition>(`particle-types/${id}`).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to fetch particle type');
        }
        return response.data;
      })
    );
  }

  /**
   * Get particle type by type name (for lookup from existing particle types)
   */
  getParticleTypeByTypeName(typeName: string): Observable<ParticleTypeDefinition | null> {
    return this.getParticleTypes().pipe(
      map(types => types.find(type => type.type === typeName) || null)
    );
  }

  /**
   * Search particle types
   */
  searchParticleTypes(query: string, activeOnly = true): Observable<ParticleTypeDefinition[]> {
    const params: Record<string, string> = { search: query };
    if (activeOnly) {
      params['active'] = 'true';
    }

    return this.apiService.get<ParticleTypeDefinition[]>('particle-types', params).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to search particle types');
        }
        return response.data;
      })
    );
  }

  /**
   * Create a new particle type definition
   */
  createParticleType(particleType: Omit<ParticleTypeDefinition, 'id'>): Observable<ParticleTypeDefinition> {
    return this.apiService.post<ParticleTypeDefinition>('particle-types', particleType).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to create particle type');
        }
        // Invalidate cache
        this.invalidateCache();
        return response.data;
      })
    );
  }

  /**
   * Update an existing particle type definition
   */
  updateParticleType(id: number, particleType: Partial<ParticleTypeDefinition>): Observable<ParticleTypeDefinition> {
    return this.apiService.put<ParticleTypeDefinition>(`particle-types/${id}`, particleType).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to update particle type');
        }
        // Invalidate cache
        this.invalidateCache();
        return response.data;
      })
    );
  }

  /**
   * Delete a particle type definition
   */
  deleteParticleType(id: number): Observable<void> {
    return this.apiService.delete(`particle-types/${id}`).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Failed to delete particle type');
        }
        // Invalidate cache
        this.invalidateCache();
      })
    );
  }

  /**
   * Refresh the cache manually
   */
  refreshCache(): Observable<ParticleTypeDefinition[]> {
    return this.fetchParticleTypesFromApi();
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.particleTypesCache$.next([]);
    this.lastFetchTime = 0;
  }

  /**
   * Private method to fetch particle types from API
   */
  private fetchParticleTypesFromApi(): Observable<ParticleTypeDefinition[]> {
    return this.apiService.get<ParticleTypeDefinition[]>('particle-types', { active: 'true' }).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to fetch particle types');
        }
        return response.data;
      }),
      tap(data => {
        this.particleTypesCache$.next(data);
        this.lastFetchTime = Date.now();
      }),
      shareReplay(1) // Cache the observable result
    );
  }

  /**
   * Invalidate cache to force refresh on next call
   */
  private invalidateCache(): void {
    this.lastFetchTime = 0;
  }
}
