#!/bin/bash

# List of trial-based forms to update
FORMS=(
    "tfout-entry-form"
    "pcnt-entry-form"
    "spectroscopy-entry-form"
    "vpr-entry-form"
    "oil-content-entry-form"
    "gr-drop-pt-entry-form"
    "inspect-filter-entry-form"
    "rheometry-entry-form"
    "deleterious-entry-form"
    "d-inch-entry-form"
)

BASE_PATH="src/app/enter-results/entry-form-area/components/entry-form/tests"

for FORM in "${FORMS[@]}"; do
    echo "Updating $FORM..."
    
    # Get the TypeScript file
    TS_FILE="$BASE_PATH/$FORM/$FORM.ts"
    
    if [[ -f "$TS_FILE" ]]; then
        echo "Processing $TS_FILE"
        
        # Add imports
        sed -i '/import { SampleWithTestInfo } from/a import { TestStandardsService } from '\''../../../../../../shared/services/test-standards.service'\'';\nimport { TestFormDataService } from '\''../../../../../../shared/services/test-form-data.service'\'';' "$TS_FILE"
        
        # Add service injections
        sed -i '/private readonly fb = inject(FormBuilder);/a \ \ private readonly testStandardsService = inject(TestStandardsService);\n  private readonly testFormDataService = inject(TestFormDataService);' "$TS_FILE"
        
        # Add auto-save timeout
        sed -i '/commentLimitWarning = computed/a \  \n  // Auto-save timeout\n  private autoSaveTimeout: any;' "$TS_FILE"
        
        # Replace testStandardOptions
        sed -i '/testStandardOptions = \[/,/\];/ c\  // Test standards - loaded from API\n  testStandardOptions = signal<{value: string; label: string}[]>([]);' "$TS_FILE"
        
        # Add loadTestStandards call to ngOnInit
        sed -i '/this.setupFormSubscriptions();/a \ \ \ \ this.loadTestStandards();' "$TS_FILE"
        
        echo "Completed basic updates for $FORM"
    else
        echo "File not found: $TS_FILE"
    fi
done

echo "Batch update completed!"
