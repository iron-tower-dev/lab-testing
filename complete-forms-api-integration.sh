#!/bin/bash

# Complete API integration for all trial-based test entry forms
# This script applies full API integration including service calls, auto-save, and template fixes

echo "Starting complete API integration for all remaining test entry forms..."

# List of forms that need completion (excluding TAN, Rust, and RBOT which are already done)
FORMS=(
    "pcnt-entry-form:PCNT"
    "spectroscopy-entry-form:SPECTROSCOPY"
    "vpr-entry-form:VPR"
    "oil-content-entry-form:OIL_CONTENT"
    "gr-drop-pt-entry-form:GR_DROP_PT"
    "inspect-filter-entry-form:INSPECT_FILTER"
    "rheometry-entry-form:RHEOMETRY"
    "deleterious-entry-form:DELETERIOUS"
    "d-inch-entry-form:D_INCH"
)

BASE_PATH="src/app/enter-results/entry-form-area/components/entry-form/tests"

for form_info in "${FORMS[@]}"; do
    IFS=':' read -r form_name test_code <<< "$form_info"
    echo "Processing $form_name ($test_code)..."
    
    TS_FILE="$BASE_PATH/$form_name/$form_name.ts"
    HTML_FILE="$BASE_PATH/$form_name/$form_name.html"
    
    if [[ ! -f "$TS_FILE" ]]; then
        echo "  Warning: $TS_FILE not found, skipping..."
        continue
    fi
    
    echo "  Updating TypeScript file..."
    
    # 1. Add missing imports (OnDestroy, TestTypesService, firstValueFrom)
    sed -i '1s/import { Component, computed, inject, input, output, signal, effect, OnInit }/import { Component, computed, inject, input, output, signal, effect, OnInit, OnDestroy }/' "$TS_FILE"
    
    # Add TestTypesService import if not already present
    if ! grep -q "TestTypesService" "$TS_FILE"; then
        sed -i '/TestFormDataService.*from/a import { TestTypesService } from '\''../../../../../../shared/services/test-types.service'\'';' "$TS_FILE"
    fi
    
    # Add RxJS imports
    if ! grep -q "firstValueFrom" "$TS_FILE"; then
        sed -i '/TestFormDataService.*from/a import { debounceTime, Subject, takeUntil, firstValueFrom } from '\''rxjs'\'';' "$TS_FILE"
    fi
    
    # 2. Update class declaration to implement OnDestroy
    sed -i 's/implements OnInit/implements OnInit, OnDestroy/' "$TS_FILE"
    
    # 3. Add TestTypesService injection
    if ! grep -q "testTypesService" "$TS_FILE"; then
        sed -i '/private readonly testFormDataService = inject/a \  private readonly testTypesService = inject(TestTypesService);' "$TS_FILE"
    fi
    
    # 4. Replace auto-save timeout with proper subjects
    sed -i 's/private autoSaveTimeout: any;/private destroy$ = new Subject<void>();\n  private autoSaveSubject = new Subject<any>();/' "$TS_FILE"
    
    # 5. Add ngOnDestroy method after ngOnInit
    if ! grep -q "ngOnDestroy" "$TS_FILE"; then
        sed -i '/ngOnInit.*{/,/^  }/ {
            /^  }/ a\
\
  ngOnDestroy(): void {\
    this.destroy$.next();\
    this.destroy$.complete();\
  }
        }' "$TS_FILE"
    fi
    
    # 6. Add setupAutoSave() call to ngOnInit if not already present
    sed -i '/this.loadTestStandards();/a \    this.setupAutoSave();' "$TS_FILE"
    
    # 7. Update setupFormSubscriptions to use takeUntil
    sed -i '/private setupFormSubscriptions.*{/,/^  }/ {
        s/\.subscribe(/\.pipe(takeUntil(this.destroy$))\n      .subscribe(/g
    }' "$TS_FILE"
    
    # 8. Add missing methods (loadTestStandards, loadInitialData, populateForm, autoSaveFormData, setupAutoSave)
    if ! grep -q "private async loadTestStandards" "$TS_FILE"; then
        # Find the line with the missing loadTestStandards call and add the complete method before it
        sed -i '/this.loadTestStandards();/i \
  private setupAutoSave(): void {\
    this.autoSaveSubject\
      .pipe(\
        debounceTime(2000),\
        takeUntil(this.destroy$)\
      )\
      .subscribe(formData => {\
        this.autoSaveFormData(formData);\
      });\
  }\
\
  private async loadTestStandards(): Promise<void> {\
    try {\
      this.isLoading.set(true);\
      this.errorMessage.set(null);\
      \
      // First get the test ID for '"$test_code"'\
      const testTypeResponse = await firstValueFrom(this.testTypesService.getTestTypeByCode('"'"$test_code"'"'));\
      if (!testTypeResponse.success || !testTypeResponse.data) {\
        throw new Error('"'"Failed to get test type for $test_code"'"');\
      }\
      \
      const testId = testTypeResponse.data.testId;\
      const standards = await firstValueFrom(this.testStandardsService.getStandardOptions(testId));\
      this.testStandardOptions.set(standards);\
    } catch (error) {\
      console.error('"'"Failed to load test standards for $test_code:"'"', error);\
      this.errorMessage.set('"'"Failed to load test standards. Please refresh the page."'"');\
    } finally {\
      this.isLoading.set(false);\
    }\
  }\
' "$TS_FILE"
    fi
    
    # 9. Add complete loadInitialData method
    if ! grep -q "private async loadInitialData" "$TS_FILE"; then
        sed -i '/this.loadInitialData();/i \
  private async loadInitialData(): Promise<void> {\
    const inputData = this.initialData();\
    if (inputData) {\
      this.populateForm(inputData);\
      return;\
    }\
    \
    // Try to load persisted data from API\
    const sampleData = this.sampleData();\
    if (sampleData?.sampleId) {\
      try {\
        // Get the test ID for '"$test_code"'\
        const testTypeResponse = await firstValueFrom(this.testTypesService.getTestTypeByCode('"'"$test_code"'"'));\
        if (testTypeResponse.success && testTypeResponse.data) {\
          const testId = testTypeResponse.data.testId;\
          const response = await firstValueFrom(this.testFormDataService.getFormData(sampleData.sampleId, testId));\
          if (response.success && response.data && response.data.formData) {\
            this.populateForm(response.data.formData);\
          }\
        }\
      } catch (error) {\
        console.error('"'"Failed to load saved $test_code data:"'"', error);\
        // Continue with empty form\
      }\
    }\
  }\
\
  private populateForm(data: any): void {\
    this.form.patchValue({\
      analystInitials: data.analystInitials,\
      testStandard: data.testStandard,\
      labComments: data.labComments\
    });\
    \
    // Load trial data if available\
    if (data.trials && this.trialsFormArray) {\
      data.trials.forEach((trialData: any, index: number) => {\
        if (index < this.trialsFormArray.length) {\
          this.trialsFormArray.at(index).patchValue(trialData);\
        }\
      });\
    }\
  }\
\
  private async autoSaveFormData(formData: any): Promise<void> {\
    if (!this.sampleData()?.sampleId || !this.form.dirty) {\
      return;\
    }\
    \
    try {\
      // Get the test ID for '"$test_code"'\
      const testTypeResponse = await firstValueFrom(this.testTypesService.getTestTypeByCode('"'"$test_code"'"'));\
      if (!testTypeResponse.success || !testTypeResponse.data) {\
        return;\
      }\
      \
      const testId = testTypeResponse.data.testId;\
      await firstValueFrom(this.testFormDataService.autoSaveFormData(\
        this.sampleData()!.sampleId!,\
        testId,\
        formData,\
        '"'"auto-save"'"'\
      ));\
      \
      // Mark form as saved\
      this.form.markAsPristine();\
      if (this.trialsFormArray) {\
        this.trialsFormArray.markAsPristine();\
      }\
    } catch (error) {\
      console.error('"'"Auto-save failed for $test_code:"'"', error);\
    }\
  }\
' "$TS_FILE"
    fi
    
    # 10. Update emitFormChanges to trigger auto-save
    sed -i '/private emitFormChanges.*{/,/^  }/ {
        /this.validationChange.emit.*);/a \
\
    // Trigger auto-save\
    if (this.hasUnsavedChanges()) {\
      this.autoSaveSubject.next(formData);\
    }
    }' "$TS_FILE"
    
    # 11. Update onSave method to use proper API calls
    sed -i '/async onSave.*{/,/^  }/ {
        /const formData = this.getFormData();/a \
      \
      if (this.sampleData()?.sampleId) {\
        // Get the test ID for '"$test_code"'\
        const testTypeResponse = await firstValueFrom(this.testTypesService.getTestTypeByCode('"'"$test_code"'"'));\
        if (testTypeResponse.success && testTypeResponse.data) {\
          const testId = testTypeResponse.data.testId;\
          await firstValueFrom(this.testFormDataService.submitFormData(\
            this.sampleData()!.sampleId!,\
            testId,\
            formData,\
            '"'"user"'"'\
          ));\
        }\
      }
        /console.log.*Saving.*test data/d
        /setTimeout.*{/,/}, 1000);/d
    }' "$TS_FILE"
    
    # 12. Update HTML template if it exists
    if [[ -f "$HTML_FILE" ]]; then
        echo "  Updating HTML template..."
        
        # Fix @for signal usage 
        sed -i 's/@for (standard of testStandardOptions;/@for (standard of testStandardOptions();/' "$HTML_FILE"
        
        # Replace hardcoded test standards with dynamic ones
        if grep -q "<mat-option value=" "$HTML_FILE"; then
            # Find the mat-select for test standards and replace hardcoded options
            sed -i '/mat-select formControlName="testStandard"/,/<\/mat-select>/ {
                /<mat-option value=/d
                /<\/mat-select>/i \              @for (standard of testStandardOptions(); track standard.value) {\
                <mat-option [value]="standard.value">{{ standard.label }}</mat-option>\
              }
            }' "$HTML_FILE"
        fi
    fi
    
    echo "  Completed $form_name"
done

echo ""
echo "API integration completion finished!"
echo ""
echo "Summary of changes applied to each form:"
echo "✓ Added OnDestroy interface and ngOnDestroy method"
echo "✓ Added TestTypesService injection and imports"
echo "✓ Added RxJS imports (firstValueFrom, Subject, takeUntil, debounceTime)"
echo "✓ Implemented loadTestStandards() method with API calls"
echo "✓ Implemented loadInitialData() and populateForm() methods"
echo "✓ Implemented autoSaveFormData() with proper API integration"
echo "✓ Added setupAutoSave() method with debounced auto-save"
echo "✓ Updated setupFormSubscriptions() to use takeUntil pattern"
echo "✓ Updated emitFormChanges() to trigger auto-save"
echo "✓ Updated onSave() method to use submitFormData API"
echo "✓ Fixed HTML templates to use testStandardOptions() signal calls"
echo "✓ Replaced hardcoded test standard options with API-loaded data"
echo ""
echo "Next steps:"
echo "1. Test compilation: ng build --configuration development"
echo "2. Start development server: ng serve"
echo "3. Verify each form loads test standards from API"
echo "4. Verify auto-save and manual save functionality"
