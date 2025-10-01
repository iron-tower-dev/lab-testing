import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { QualificationService } from '../../shared/services/qualification.service';
import { map, catchError, of } from 'rxjs';

/**
 * Route guard to verify user has required qualifications for test entry
 * 
 * Usage:
 * {
 *   path: 'enter-results',
 *   component: EnterResults,
 *   canActivate: [qualificationGuard]
 * }
 * 
 * Query Parameters:
 * - testStandId: Test stand ID to verify qualification (optional)
 * - testId: Test ID (will look up test stand ID if provided)
 */
export const qualificationGuard: CanActivateFn = (route, state) => {
  const qualService = inject(QualificationService);
  const router = inject(Router);
  
  // Get test stand ID from route params or query params
  const testStandId = route.queryParams['testStandId'] 
    ? parseInt(route.queryParams['testStandId']) 
    : null;
  
  const testId = route.queryParams['tid'] 
    ? parseInt(route.queryParams['tid']) 
    : null;

  // If no test stand ID provided, allow access (will check at component level)
  // This allows initial page load for test selection
  if (!testStandId && !testId) {
    return true;
  }

  // Get current user ID (TODO: Replace with actual auth service)
  // For now, using a placeholder - this should come from your auth system
  const currentUser = getCurrentUser();
  
  if (!currentUser?.employeeId) {
    console.error('No current user found');
    router.navigate(['/unauthorized']);
    return false;
  }

  // Load qualifications if not already loaded
  const currentEmployeeId = qualService.currentEmployeeId();
  if (!currentEmployeeId || currentEmployeeId !== currentUser.employeeId) {
    return qualService.loadUserQualifications(currentUser.employeeId).pipe(
      map(response => {
        if (response.success && testStandId) {
          const isQualified = qualService.isQualifiedForTestStand(testStandId);
          if (!isQualified) {
            console.warn(`User not qualified for test stand ${testStandId}`);
            router.navigate(['/unauthorized'], {
              queryParams: { 
                reason: 'not_qualified',
                testStandId 
              }
            });
            return false;
          }
          return true;
        }
        return true; // Allow if no specific test stand check needed
      }),
      catchError(error => {
        console.error('Failed to load qualifications:', error);
        // In case of error, allow access but log the issue
        // The component will handle authorization at a more granular level
        return of(true);
      })
    );
  }

  // Qualifications already loaded, just check
  if (testStandId) {
    const isQualified = qualService.isQualifiedForTestStand(testStandId);
    if (!isQualified) {
      console.warn(`User not qualified for test stand ${testStandId}`);
      router.navigate(['/unauthorized'], {
        queryParams: { 
          reason: 'not_qualified',
          testStandId 
        }
      });
      return false;
    }
  }

  return true;
};

/**
 * Helper function to get current user
 * TODO: Replace with actual authentication service
 * 
 * For now, this returns a mock user or reads from localStorage
 */
function getCurrentUser(): { employeeId: string; name: string } | null {
  // Check localStorage for development/testing
  const storedUser = localStorage.getItem('currentUser');
  if (storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch (e) {
      console.error('Failed to parse stored user:', e);
    }
  }

  // Return mock user for development
  // TODO: Replace with actual auth service call
  return {
    employeeId: 'EMP001',
    name: 'Test User'
  };
}

/**
 * Helper function to check if user has minimum qualification level
 * Can be used in components for fine-grained authorization
 */
export function hasMinimumQualification(
  qualService: QualificationService,
  testStandId: number,
  minLevel: 'TRAIN' | 'Q' | 'QAG' | 'MicrE'
): boolean {
  const userLevel = qualService.getQualificationLevel(testStandId);
  if (!userLevel) return false;
  
  return qualService.hasQualificationLevel(userLevel, minLevel);
}
