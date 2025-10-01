import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3001/api';

  /**
   * Handle HTTP errors with proper error messages
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error && error.error.error) {
        errorMessage = error.error.error;
      } else {
        errorMessage = `Server Error: ${error.status} ${error.statusText}`;
      }
    }
    
    console.error('API Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Generic GET request
   */
  get<T>(endpoint: string, params?: Record<string, any>): Observable<ApiResponse<T>> {
    const url = `${this.baseUrl}/${endpoint}`;
    const options = params ? { params } : {};
    
    return this.http.get<ApiResponse<T>>(url, options).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  /**
   * Generic POST request
   */
  post<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
    const url = `${this.baseUrl}/${endpoint}`;
    
    return this.http.post<ApiResponse<T>>(url, data).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Generic PUT request
   */
  put<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
    const url = `${this.baseUrl}/${endpoint}`;
    
    return this.http.put<ApiResponse<T>>(url, data).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Generic PATCH request (partial update)
   */
  patch<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
    const url = `${this.baseUrl}/${endpoint}`;
    
    return this.http.patch<ApiResponse<T>>(url, data).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Generic DELETE request
   */
  delete<T>(endpoint: string): Observable<ApiResponse<T>> {
    const url = `${this.baseUrl}/${endpoint}`;
    
    return this.http.delete<ApiResponse<T>>(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * GET request with pagination
   */
  getPaginated<T>(
    endpoint: string, 
    page: number = 1, 
    limit: number = 50, 
    params?: Record<string, any>
  ): Observable<PaginatedResponse<T>> {
    const queryParams = {
      page: page.toString(),
      limit: limit.toString(),
      ...params
    };
    
    return this.get<T[]>(endpoint, queryParams) as Observable<PaginatedResponse<T>>;
  }

  /**
   * Check API health/status
   */
  checkStatus(): Observable<ApiResponse<any>> {
    return this.get('status');
  }
}
