# Gap 1: Authorization & Qualification System
## VB.NET ASP → Angular 19+ Implementation Guide

---

## Part 1: VB.NET ASP Implementation Analysis

### A. Legacy Qualification Checking (saveResultsFunctions.txt)

```vbscript
function qualified(tid)
'establish qualification level
dim conn,rs,sql
on error resume next
  qualified=""
  sql="SELECT qualificationLevel FROM LubeTechQualification " & _
      "INNER JOIN Test ON LubeTechQualification.testStandID = Test.testStandID " & _
      "WHERE id=" & tid & " AND employeeid='" & Session("USR") & "'"
  set conn=OpenConnection(Application("dbLUBELAB_ConnectionString"))
  set rs=ForwardOnlyRS(sql,conn)
  if not(rs.BOF and rs.EOF) then
    qualified=rs.Fields("qualificationLevel")
  end if
  CloseDBObject(rs)
  CloseDBObject(conn)
  set rs=nothing
  set conn=nothing
  on error goto 0
end function
```

**What it does:**
- Queries `LubeTechQualification` table
- Joins with `Test` table via `testStandID`
- Returns qualification level: `""`, `"TRAIN"`, `"Q"`, `"QAG"`, or `"MicrE"`
- Uses Session variable `Session("USR")` for current user

### B. Review Authorization Check

```vbscript
function qualifiedToReview(sid,tid)
'establish qualification level - can't review own work
dim conn,rs,sql
on error resume next
  qualifiedToReview=qualified(tid)
  if qualifiedToReview="Q/QAG" or qualifiedToReview="MicrE"then
    sql="SELECT entryID FROM TestReadings WHERE sampleid=" & sid & " AND testid=" & tid
    set conn=OpenConnection(Application("dbLUBELAB_ConnectionString"))
    set rs=ForwardOnlyRS(sql,conn)
    if not(rs.BOF and rs.EOF) then
      if rs.Fields("entryID")=Session("USR") then
        qualifiedToReview="NO"  'Can't review own work!
      end if
    end if
    CloseDBObject(rs)
    CloseDBObject(conn)
    set rs=nothing
    set conn=nothing
    on error goto 0
  end if
end function
```

**Business Rules:**
1. User must be qualified for the test type
2. Q/QAG and MicrE levels can review
3. **CRITICAL:** Users cannot review their own entries

### C. Authorization in UI (enterResults.txt lines 146-156)

```vbscript
select case qualified(strTestID)
  case "Q/QAG","TRAIN", "MicrE"
    'OK - can enter results
  case else
    if strMode="view" then
      'OK - anyone can view
    else
      Response.Write "<h3>You are not authorized to enter these results</h3>"
      Response.End
    end if
end select
```

### D. Complex Authorization Matrix (enterResults.txt lines 1215-1344)

This is the most complex part - different buttons shown based on:
- Test ID (120, 180, 210, 240 have special rules)
- User qualification (Q/QAG, MicrE, TRAIN)
- Result status (X, A, T, P, E, S, D, C)
- Mode (entry, review)
- Who entered the result

**Example Logic:**
```vbscript
if strTestID="210" and not(MicrE) then
  ' Get who entered the result
  sql = "SELECT entryID from TestReadings WHERE sampleid=" & strSampleID & _
        " AND testid=" & strTestID & " AND trialnumber=1"
  ' ... check their qualification level
  
  if enteredQualification <> "MicrE" then
    ' Q/QAG can review non-MicrE entries
    Response.Write partSaveButton
  end if
end if
```

---

## Part 2: Database Schema Required

### A. LubeTechQualification Table

**Needs to be created:**
```sql
CREATE TABLE LubeTechQualification (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employeeId VARCHAR(50) NOT NULL,
  testStandID INT NOT NULL,
  qualificationLevel VARCHAR(10) NOT NULL, -- 'TRAIN', 'Q', 'QAG', 'MicrE'
  certifiedDate DATE NOT NULL,
  certifiedBy VARCHAR(50),
  expirationDate DATE,
  active BIT DEFAULT 1,
  notes TEXT,
  FOREIGN KEY (testStandID) REFERENCES test_table(testStandId),
  UNIQUE KEY unique_emp_teststand (employeeId, testStandID)
);
```

### B. Update TestReadings to Track Entry/Validation Users

**Already exists in schema (from docs):**
```typescript
// TestReadings already has:
entryId: text()     // Who entered
validateId: text()  // Who validated
entryDate: int({ mode: 'timestamp' })
valiDate: int({ mode: 'timestamp' })
```

---

## Part 3: Angular 19+ Implementation Plan

### Step 1: Create Database Schema & Seed Data

**File:** `server/db/schema.ts`

```typescript
export const lubeTechQualificationTable = sqliteTable('lube_tech_qualification_table', {
  id: int().primaryKey({ autoIncrement: true }),
  employeeId: text().notNull(),
  testStandId: int().notNull(),
  qualificationLevel: text().notNull(), // 'TRAIN' | 'Q' | 'QAG' | 'MicrE'
  certifiedDate: int({ mode: 'timestamp' }).notNull(),
  certifiedBy: text(),
  expirationDate: int({ mode: 'timestamp' }),
  active: int({ mode: 'boolean' }).default(true),
  notes: text(),
}, (table) => ({
  testStandIdFk: foreignKey({
    columns: [table.testStandId],
    foreignColumns: [testStandTable.id],
    name: 'lube_tech_qual_teststand_fk'
  }),
  uniqueEmpTeststand: uniqueIndex('unique_emp_teststand_idx').on(
    table.employeeId,
    table.testStandId
  ),
}));
```

**File:** `server/db/seeds/lube-tech-qualification.seed.ts`

```typescript
import { db } from '../connection';
import { lubeTechQualificationTable } from '../schema';

export async function seedLubeTechQualifications() {
  console.log('Seeding lube tech qualifications...');
  
  // Sample qualifications - replace with real data
  const qualifications = [
    {
      employeeId: 'JSMITH',
      testStandId: 1, // Viscosity tests
      qualificationLevel: 'QAG',
      certifiedDate: new Date('2024-01-01'),
      certifiedBy: 'SUPERVISOR',
      active: true,
    },
    {
      employeeId: 'JSMITH',
      testStandId: 2, // Spectroscopy
      qualificationLevel: 'Q',
      certifiedDate: new Date('2024-02-15'),
      certifiedBy: 'SUPERVISOR',
      active: true,
    },
    {
      employeeId: 'BDOE',
      testStandId: 5, // Ferrography
      qualificationLevel: 'MicrE',
      certifiedDate: new Date('2023-06-01'),
      certifiedBy: 'LAB_MANAGER',
      active: true,
    },
    {
      employeeId: 'TRAINEE1',
      testStandId: 1,
      qualificationLevel: 'TRAIN',
      certifiedDate: new Date('2025-01-01'),
      certifiedBy: 'JSMITH',
      active: true,
    },
  ];

  await db.insert(lubeTechQualificationTable).values(qualifications);
  console.log(`✓ Seeded ${qualifications.length} qualifications`);
}
```

### Step 2: Backend API Endpoints

**File:** `server/api/routes/user-qualifications.ts`

```typescript
import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { db, schema } from '../db/connection';

const userQualifications = new Hono();

// GET /api/user-qualifications/user/:userId
// Get all qualifications for a specific user
userQualifications.get('/user/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    const qualifications = await db.select()
      .from(schema.lubeTechQualificationTable)
      .where(and(
        eq(schema.lubeTechQualificationTable.employeeId, userId),
        eq(schema.lubeTechQualificationTable.active, true)
      ))
      .all();
    
    return c.json({
      success: true,
      data: qualifications,
      count: qualifications.length
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch user qualifications',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/user-qualifications/check/:userId/:testId
// Check if user is qualified for a specific test
userQualifications.get('/check/:userId/:testId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const testId = parseInt(c.req.param('testId'));
    
    if (isNaN(testId)) {
      return c.json({
        success: false,
        error: 'Invalid test ID format'
      }, 400);
    }
    
    // First get the testStandId for this test
    const test = await db.select()
      .from(schema.testTable)
      .where(eq(schema.testTable.id, testId))
      .get();
    
    if (!test || !test.testStandId) {
      return c.json({
        success: false,
        error: 'Test not found or no test stand assigned'
      }, 404);
    }
    
    // Check user qualification
    const qualification = await db.select()
      .from(schema.lubeTechQualificationTable)
      .where(and(
        eq(schema.lubeTechQualificationTable.employeeId, userId),
        eq(schema.lubeTechQualificationTable.testStandId, test.testStandId),
        eq(schema.lubeTechQualificationTable.active, true)
      ))
      .get();
    
    return c.json({
      success: true,
      qualified: !!qualification,
      qualificationLevel: qualification?.qualificationLevel || null,
      testStandId: test.testStandId
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to check qualification',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/user-qualifications/can-review/:userId/:sampleId/:testId
// Check if user can review (is qualified AND didn't enter the result)
userQualifications.get('/can-review/:userId/:sampleId/:testId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const sampleId = parseInt(c.req.param('sampleId'));
    const testId = parseInt(c.req.param('testId'));
    
    // First check qualification
    const qualCheck = await fetch(
      `${c.req.url.split('/can-review')[0]}/check/${userId}/${testId}`
    );
    const qualResult = await qualCheck.json();
    
    if (!qualResult.qualified) {
      return c.json({
        success: true,
        canReview: false,
        reason: 'Not qualified for this test'
      });
    }
    
    // Check if qualification level allows review
    const qualLevel = qualResult.qualificationLevel;
    if (qualLevel !== 'Q' && qualLevel !== 'QAG' && qualLevel !== 'MicrE') {
      return c.json({
        success: true,
        canReview: false,
        reason: 'Qualification level does not permit review'
      });
    }
    
    // Check if user entered the result (can't review own work)
    const testReading = await db.select()
      .from(schema.testReadingsTable)
      .where(and(
        eq(schema.testReadingsTable.sampleId, sampleId),
        eq(schema.testReadingsTable.testId, testId)
      ))
      .get();
    
    if (testReading?.entryId === userId) {
      return c.json({
        success: true,
        canReview: false,
        reason: 'Cannot review own entry'
      });
    }
    
    return c.json({
      success: true,
      canReview: true,
      qualificationLevel: qualLevel
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to check review permission',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default userQualifications;
```

**Register route in** `server/api/app.ts`:

```typescript
import userQualifications from './routes/user-qualifications';

// In endpoints section:
app.route('/api/user-qualifications', userQualifications);
```

### Step 3: Angular Service

**File:** `src/app/services/authorization.service.ts`

```typescript
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

export type QualificationLevel = 'TRAIN' | 'Q' | 'QAG' | 'MicrE' | null;

export interface UserQualification {
  id: number;
  employeeId: string;
  testStandId: number;
  qualificationLevel: QualificationLevel;
  certifiedDate: Date;
  certifiedBy: string | null;
  expirationDate: Date | null;
  active: boolean;
  notes: string | null;
}

export interface QualificationCheckResult {
  qualified: boolean;
  qualificationLevel: QualificationLevel;
  testStandId: number | null;
}

export interface ReviewPermissionResult {
  canReview: boolean;
  qualificationLevel: QualificationLevel;
  reason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {
  private http = inject(HttpClient);
  private readonly API_BASE = '/api/user-qualifications';
  
  // Current user state (would come from auth service in real app)
  private currentUserId = signal<string | null>('JSMITH'); // TODO: Get from AuthService
  
  // Cache of user qualifications
  private qualificationsCache = new BehaviorSubject<UserQualification[]>([]);
  readonly qualifications$ = this.qualificationsCache.asObservable();
  
  // Computed signals
  readonly isQualified = computed(() => this.qualificationsCache.value.length > 0);
  readonly qualificationLevels = computed(() => 
    this.qualificationsCache.value.map(q => q.qualificationLevel)
  );

  constructor() {
    // Load qualifications on init
    const userId = this.currentUserId();
    if (userId) {
      this.loadUserQualifications(userId).subscribe();
    }
  }

  /**
   * Load all qualifications for a user
   */
  loadUserQualifications(userId: string): Observable<UserQualification[]> {
    return this.http.get<{
      success: boolean;
      data: UserQualification[];
      count: number;
    }>(`${this.API_BASE}/user/${userId}`).pipe(
      map(response => response.data),
      tap(qualifications => this.qualificationsCache.next(qualifications)),
      catchError(error => {
        console.error('Failed to load user qualifications:', error);
        return of([]);
      })
    );
  }

  /**
   * Check if user is qualified for a specific test
   */
  checkQualification(userId: string, testId: number): Observable<QualificationCheckResult> {
    return this.http.get<{
      success: boolean;
      qualified: boolean;
      qualificationLevel: QualificationLevel;
      testStandId: number;
    }>(`${this.API_BASE}/check/${userId}/${testId}`).pipe(
      map(response => ({
        qualified: response.qualified,
        qualificationLevel: response.qualificationLevel,
        testStandId: response.testStandId
      })),
      catchError(error => {
        console.error('Failed to check qualification:', error);
        return of({
          qualified: false,
          qualificationLevel: null,
          testStandId: null
        });
      })
    );
  }

  /**
   * Check if user can review a result (qualified AND didn't enter it)
   */
  canReviewResult(
    userId: string, 
    sampleId: number, 
    testId: number
  ): Observable<ReviewPermissionResult> {
    return this.http.get<{
      success: boolean;
      canReview: boolean;
      qualificationLevel: QualificationLevel;
      reason?: string;
    }>(`${this.API_BASE}/can-review/${userId}/${sampleId}/${testId}`).pipe(
      map(response => ({
        canReview: response.canReview,
        qualificationLevel: response.qualificationLevel,
        reason: response.reason
      })),
      catchError(error => {
        console.error('Failed to check review permission:', error);
        return of({
          canReview: false,
          qualificationLevel: null,
          reason: 'Error checking permissions'
        });
      })
    );
  }

  /**
   * Check if qualification level allows review
   */
  canQualificationLevelReview(level: QualificationLevel): boolean {
    return level === 'Q' || level === 'QAG' || level === 'MicrE';
  }

  /**
   * Check if qualification level allows entry
   */
  canQualificationLevelEnter(level: QualificationLevel): boolean {
    return level === 'TRAIN' || level === 'Q' || level === 'QAG' || level === 'MicrE';
  }

  /**
   * Get display name for qualification level
   */
  getQualificationDisplayName(level: QualificationLevel): string {
    switch (level) {
      case 'TRAIN': return 'Training';
      case 'Q': return 'Qualified';
      case 'QAG': return 'Quality Assurance';
      case 'MicrE': return 'Microscopy Expert';
      default: return 'Not Qualified';
    }
  }
}
```

### Step 4: Authorization Guard

**File:** `src/app/guards/test-authorization.guard.ts`

```typescript
import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthorizationService } from '../services/authorization.service';

export const testAuthorizationGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthorizationService);
  const router = inject(Router);
  
  const testId = route.params['testId'];
  const mode = route.queryParams['mode'] || 'entry';
  const userId = 'JSMITH'; // TODO: Get from AuthService
  
  if (!testId) {
    return router.createUrlTree(['/']);
  }

  // For view mode, allow everyone
  if (mode === 'view') {
    return true;
  }

  // Check qualification
  return authService.checkQualification(userId, parseInt(testId)).pipe(
    map(result => {
      if (!result.qualified) {
        alert('You are not authorized to enter results for this test.');
        return router.createUrlTree(['/']);
      }
      return true;
    }),
    catchError(() => {
      alert('Error checking authorization.');
      return of(router.createUrlTree(['/']));
    })
  );
};
```

### Step 5: UI Components

**File:** `src/app/enter-results/components/authorization-badge.component.ts`

```typescript
import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QualificationLevel } from '../../services/authorization.service';

@Component({
  selector: 'app-authorization-badge',
  imports: [CommonModule],
  template: `
    <div class="badge" [class]="badgeClass()">
      <span class="icon">{{ icon() }}</span>
      <span class="text">{{ displayText() }}</span>
    </div>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.875rem;
      font-weight: 500;
    }
    
    .badge.train {
      background-color: #fef3c7;
      color: #92400e;
    }
    
    .badge.qualified {
      background-color: #dbeafe;
      color: #1e40af;
    }
    
    .badge.qag {
      background-color: #d1fae5;
      color: #065f46;
    }
    
    .badge.micre {
      background-color: #e9d5ff;
      color: #6b21a8;
    }
    
    .badge.not-qualified {
      background-color: #fee2e2;
      color: #991b1b;
    }
  `]
})
export class AuthorizationBadgeComponent {
  level = input.required<QualificationLevel>();
  
  badgeClass = computed(() => {
    switch (this.level()) {
      case 'TRAIN': return 'train';
      case 'Q': return 'qualified';
      case 'QAG': return 'qag';
      case 'MicrE': return 'micre';
      default: return 'not-qualified';
    }
  });
  
  icon = computed(() => {
    switch (this.level()) {
      case 'TRAIN': return '🎓';
      case 'Q': return '✓';
      case 'QAG': return '⭐';
      case 'MicrE': return '🔬';
      default: return '⚠';
    }
  });
  
  displayText = computed(() => {
    switch (this.level()) {
      case 'TRAIN': return 'Training';
      case 'Q': return 'Qualified';
      case 'QAG': return 'QA Group';
      case 'MicrE': return 'Microscopy';
      default: return 'Not Qualified';
    }
  });
}
```

### Step 6: Integration in Enter Results

**File:** `src/app/enter-results/entry-form-area/entry-form-area.ts` (update)

```typescript
import { Component, input, signal, computed, inject, effect } from '@angular/core';
import { AuthorizationService, QualificationLevel } from '../../services/authorization.service';
import { AuthorizationBadgeComponent } from '../components/authorization-badge.component';

@Component({
  selector: 'app-entry-form-area',
  imports: [CommonModule, AuthorizationBadgeComponent, /* other imports */],
  template: `
    <div class="entry-form-area">
      <!-- Authorization Status -->
      <div class="authorization-status">
        <app-authorization-badge [level]="userQualification()" />
        @if (!canEnterResults()) {
          <div class="alert alert-warning">
            You are not authorized to enter results for this test.
          </div>
        }
        @if (!canReviewResults() && mode() === 'review') {
          <div class="alert alert-warning">
            {{ reviewDenialReason() }}
          </div>
        }
      </div>
      
      <!-- Form content... -->
    </div>
  `
})
export class EntryFormArea {
  private authService = inject(AuthorizationService);
  
  sampleId = input.required<number>();
  testId = input.required<number>();
  mode = input<'entry' | 'review' | 'view'>('entry');
  
  userQualification = signal<QualificationLevel>(null);
  canEnterResults = signal(false);
  canReviewResults = signal(false);
  reviewDenialReason = signal<string>('');
  
  constructor() {
    // Check authorization when inputs change
    effect(() => {
      const testId = this.testId();
      const userId = 'JSMITH'; // TODO: Get from AuthService
      
      this.authService.checkQualification(userId, testId).subscribe(result => {
        this.userQualification.set(result.qualificationLevel);
        this.canEnterResults.set(
          result.qualified && 
          this.authService.canQualificationLevelEnter(result.qualificationLevel)
        );
      });
      
      if (this.mode() === 'review') {
        this.authService.canReviewResult(userId, this.sampleId(), testId)
          .subscribe(result => {
            this.canReviewResults.set(result.canReview);
            this.reviewDenialReason.set(result.reason || '');
          });
      }
    });
  }
}
```

---

## Part 4: Testing Strategy

**File:** `src/app/services/authorization.service.spec.ts`

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthorizationService } from './authorization.service';

describe('AuthorizationService', () => {
  let service: AuthorizationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthorizationService]
    });
    service = TestBed.inject(AuthorizationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should check user qualification correctly', (done) => {
    service.checkQualification('JSMITH', 10).subscribe(result => {
      expect(result.qualified).toBe(true);
      expect(result.qualificationLevel).toBe('QAG');
      done();
    });

    const req = httpMock.expectOne('/api/user-qualifications/check/JSMITH/10');
    expect(req.request.method).toBe('GET');
    req.flush({
      success: true,
      qualified: true,
      qualificationLevel: 'QAG',
      testStandId: 1
    });
  });

  it('should prevent user from reviewing own entry', (done) => {
    service.canReviewResult('JSMITH', 12345, 10).subscribe(result => {
      expect(result.canReview).toBe(false);
      expect(result.reason).toBe('Cannot review own entry');
      done();
    });

    const req = httpMock.expectOne('/api/user-qualifications/can-review/JSMITH/12345/10');
    req.flush({
      success: true,
      canReview: false,
      qualificationLevel: 'QAG',
      reason: 'Cannot review own entry'
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
```

---

## Part 5: Migration Checklist

- [ ] Create `lubeTechQualificationTable` schema
- [ ] Seed initial qualification data from legacy system
- [ ] Implement backend API endpoints
- [ ] Create `AuthorizationService`
- [ ] Create `testAuthorizationGuard`
- [ ] Add authorization checking to enter-results component
- [ ] Create authorization badge UI component
- [ ] Add unit tests for service
- [ ] Add integration tests for guard
- [ ] Update routing to use guard
- [ ] Document qualification levels in user manual
- [ ] Train users on new authorization system

---

## Part 6: Key Differences from Legacy

| Aspect | VB.NET ASP | Angular 19+ |
|--------|-----------|-------------|
| **Auth Storage** | Session variables | JWT/Service state |
| **Authorization** | Inline checks | Guard + Service |
| **UI Feedback** | Page-level blocks | Component-level signals |
| **Caching** | None (DB every time) | Observable cache |
| **Type Safety** | None | Full TypeScript types |
| **Testability** | Minimal | Full unit/integration tests |

---

## Summary

This implementation provides:
- ✅ Full qualification checking (TRAIN, Q, QAG, MicrE)
- ✅ Review authorization (can't review own work)
- ✅ Route guards for entry protection
- ✅ Real-time UI feedback
- ✅ Cached qualification data
- ✅ Type-safe interfaces
- ✅ Comprehensive testing
