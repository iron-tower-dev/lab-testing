#!/bin/bash

# Base directory for test forms
BASE_DIR="src/app/enter-results/entry-form-area/components/entry-form/tests"
TEMPLATE_DIR="$BASE_DIR/rust-entry-form"

# Array of forms to convert with their specific configurations
declare -A FORMS=(
    ["tfout"]="TFOUT:Thin Film Oxygen Uptake:minutes:TFOUT Time:ASTM-D4742:IP-243"
    ["pcnt"]="Pcnt:Particle Count:particles/mL:Particle Count:ISO-4406:NAS-1638"
    ["spectroscopy"]="Spectroscopy:Emission Spectroscopy:ppm:Element Concentration:ASTM-D6595:ASTM-D5185"
    ["oil-content"]="OilContent:Oil Content Analysis:percent:Oil Content:ASTM-D7575:IP-579"
    ["vpr"]="Vpr:Varnish Potential Rating:units:VPR Value:ASTM-D7843:FTIR-Colorimetric"
    ["gr-drop-pt"]="GrDropPt:Grease Dropping Point:°C:Dropping Point:ASTM-D566:IP-396"
    ["inspect-filter"]="InspectFilter:Inspect Filter Analysis:rating:Filter Rating:Visual:Microscopic"
)

# Function to convert a single form
convert_form() {
    local form_key=$1
    local config=${FORMS[$form_key]}
    IFS=':' read -r class_name display_name unit_label field_label std1 std2 <<< "$config"
    
    local form_dir="$BASE_DIR/${form_key}-entry-form"
    local template_html="$TEMPLATE_DIR/rust-entry-form.html"
    local template_ts="$TEMPLATE_DIR/rust-entry-form.ts"
    local template_css="$TEMPLATE_DIR/rust-entry-form.css"
    
    echo "Converting $form_key form..."
    
    # Copy and modify HTML
    if [ -f "$template_html" ]; then
        cp "$template_html" "$form_dir/${form_key}-entry-form.html"
        
        # Replace class names and content in HTML
        sed -i "s/rust-entry-form/${form_key}-entry-form/g" "$form_dir/${form_key}-entry-form.html"
        sed -i "s/rust-form/${form_key}-form/g" "$form_dir/${form_key}-entry-form.html"
        sed -i "s/Rust Rating/$field_label/g" "$form_dir/${form_key}-entry-form.html"
        sed -i "s/rust rating/$field_label/g" "$form_dir/${form_key}-entry-form.html"
        sed -i "s/Rust rating is required/$field_label is required/g" "$form_dir/${form_key}-entry-form.html"
        sed -i "s/ASTM-D665A/$std1/g" "$form_dir/${form_key}-entry-form.html"
        sed -i "s/ASTM-D665B/$std2/g" "$form_dir/${form_key}-entry-form.html"
        sed -i "s/Method A/${std1}/g" "$form_dir/${form_key}-entry-form.html"
        sed -i "s/Method B/${std2}/g" "$form_dir/${form_key}-entry-form.html"
        
        # Convert dropdown to input for numeric fields
        if [[ ! "$field_label" =~ "Rating" ]]; then
            # Replace the mat-select with input for numeric values
            sed -i '/<mat-select formControlName="testValue">/,/<\/mat-select>/c\
                      <input matInput type="number" formControlName="testValue" \
                             step="0.001" min="0" placeholder="0.0">\
                      <mat-hint>'"$field_label"' ('"$unit_label"')</mat-hint>' "$form_dir/${form_key}-entry-form.html"
        fi
        
        # Update calculation labels
        sed -i "s/Average Rating:/Average $field_label:/g" "$form_dir/${form_key}-entry-form.html"
        sed -i "s/number:'1.1-1'/number:'1.3-3'/g" "$form_dir/${form_key}-entry-form.html"
    fi
    
    # Copy and modify TypeScript
    if [ -f "$template_ts" ]; then
        cp "$template_ts" "$form_dir/${form_key}-entry-form.ts"
        
        # Replace interface and class names
        sed -i "s/Rust/${class_name}/g" "$form_dir/${form_key}-entry-form.ts"
        sed -i "s/rust/${form_key}/g" "$form_dir/${form_key}-entry-form.ts"
        sed -i "s/'app-rust-entry-form'/'app-${form_key}-entry-form'/g" "$form_dir/${form_key}-entry-form.ts"
        sed -i "s/'\.\/rust-entry-form\./'./${form_key}-entry-form./g" "$form_dir/${form_key}-entry-form.ts"
        
        # Update test standards
        sed -i "s/'ASTM-D665A', label: 'ASTM D665A - Method A'/'${std1}', label: '${std1}'/g" "$form_dir/${form_key}-entry-form.ts"
        sed -i "s/'ASTM-D665B', label: 'ASTM D665B - Method B'/'${std2}', label: '${std2}'/g" "$form_dir/${form_key}-entry-form.ts"
        sed -i "s/'IP-135', label: 'IP 135'//g" "$form_dir/${form_key}-entry-form.ts"
        
        # Update console.log messages
        sed -i "s/rust test data/${form_key} test data/g" "$form_dir/${form_key}-entry-form.ts"
    fi
    
    # Copy and modify CSS
    if [ -f "$template_css" ]; then
        cp "$template_css" "$form_dir/${form_key}-entry-form.css"
        sed -i "s/rust-entry-form/${form_key}-entry-form/g" "$form_dir/${form_key}-entry-form.css"
        sed -i "s/Rust/${display_name}/g" "$form_dir/${form_key}-entry-form.css"
    fi
    
    echo "✅ Converted $form_key form successfully"
}

# Convert all forms
for form_key in "${!FORMS[@]}"; do
    convert_form "$form_key"
done

echo ""
echo "🎉 Batch conversion completed!"
echo "Forms converted: ${#FORMS[@]}"
echo ""
echo "Next steps:"
echo "1. Update entry-form.html to include sampleData inputs"
echo "2. Run npm build to verify all forms work"
