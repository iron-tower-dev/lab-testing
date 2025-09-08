#!/usr/bin/env python3
import pandas as pd
import json
from pathlib import Path

def analyze_work_items():
    """Analyze the work item export Excel file."""
    
    excel_path = Path('docs/work-item-export.xlsx')
    
    if not excel_path.exists():
        print(f"Error: Excel file not found at {excel_path}")
        return
    
    try:
        # Read all sheets
        excel_file = pd.ExcelFile(excel_path)
        print(f"Available sheets: {excel_file.sheet_names}")
        
        # Read the default sheet
        df = pd.read_excel(excel_path)
        
        print(f"\nDataFrame shape: {df.shape}")
        print(f"Columns: {list(df.columns)}")
        
        # Display basic info about the data
        print(f"\nFirst few rows:")
        print(df.head())
        
        # Look for specific columns that might contain requirements
        relevant_columns = []
        for col in df.columns:
            col_lower = str(col).lower()
            if any(keyword in col_lower for keyword in ['title', 'description', 'accept', 'criteria', 'requirement', 'story', 'epic', 'feature']):
                relevant_columns.append(col)
        
        print(f"\nRelevant columns found: {relevant_columns}")
        
        # Print unique values in potential type/category columns
        for col in df.columns:
            col_lower = str(col).lower()
            if any(keyword in col_lower for keyword in ['type', 'category', 'status', 'state']):
                unique_values = df[col].unique()
                if len(unique_values) < 20:  # Only show if not too many values
                    print(f"\nUnique values in '{col}': {unique_values}")
        
        # Export detailed data for forms
        if not df.empty:
            work_items = []
            for idx, row in df.iterrows():
                item = {}
                for col in df.columns:
                    value = row[col]
                    # Handle NaN values
                    if pd.isna(value):
                        value = None
                    item[col] = value
                work_items.append(item)
            
            # Save to JSON for easier processing
            with open('work_items_analysis.json', 'w') as f:
                json.dump(work_items, f, indent=2, default=str)
            
            print(f"\nExported {len(work_items)} work items to work_items_analysis.json")
            
            # Look for form-related items
            form_items = []
            for item in work_items:
                item_text = str(item).lower()
                if any(keyword in item_text for keyword in ['form', 'entry', 'test', 'laboratory', 'lab']):
                    form_items.append(item)
            
            print(f"Found {len(form_items)} potential form-related items")
            
            # Print form-related items
            if form_items:
                print("\nForm-related work items:")
                for i, item in enumerate(form_items[:5]):  # Show first 5
                    print(f"\n--- Form Item {i+1} ---")
                    for key, value in item.items():
                        if value is not None and str(value).strip():
                            print(f"{key}: {value}")
        
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    analyze_work_items()
