#!/usr/bin/env python3
import json
import re
from html import unescape
from bs4 import BeautifulSoup

def clean_html(html_text):
    """Clean HTML and extract readable text."""
    if not html_text:
        return ""
    
    # Use BeautifulSoup to parse HTML if available, otherwise strip basic tags
    try:
        soup = BeautifulSoup(html_text, 'html.parser')
        text = soup.get_text()
        # Clean up whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    except:
        # Fallback: simple tag removal
        text = re.sub(r'<[^>]+>', '', html_text)
        text = unescape(text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

def extract_key_requirements(description):
    """Extract key requirements from description."""
    text = clean_html(description)
    
    # Look for specific patterns
    fields = []
    calculations = []
    
    # Extract field mentions
    field_patterns = [
        r'([A-Za-z\s]+):\s*Editable',
        r'([A-Za-z\s]+):\s*Display only',
        r'([A-Za-z\s]+):\s*Numeric only',
        r'Field Labels?:?\s*([^.]+)',
    ]
    
    for pattern in field_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        fields.extend(matches)
    
    # Extract calculations
    calc_patterns = [
        r'Calculation:?\s*([^.]+\.)',
        r'Formula:?\s*([^.]+\.)',
    ]
    
    for pattern in calc_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        calculations.extend(matches)
    
    return {
        'fields': list(set(fields[:10])),  # Limit and dedupe
        'calculations': list(set(calculations[:5]))
    }

def main():
    with open('work_items_analysis.json', 'r') as f:
        work_items = json.load(f)
    
    print("# Laboratory Test Entry Forms - Requirements Analysis\n")
    
    test_forms = []
    
    for item in work_items:
        title = item.get('Title', '')
        if 'Enter Results' in title:
            
            # Clean up title to extract test name
            test_name = title.replace('Enter Results - ', '').strip()
            
            # Extract key requirements
            description = item.get('Description', '')
            acceptance_criteria = item.get('Acceptance Criteria', '')
            
            req_summary = extract_key_requirements(description)
            
            form_info = {
                'id': item.get('Id'),
                'test_name': test_name,
                'title': title,
                'fields': req_summary['fields'],
                'calculations': req_summary['calculations'],
                'description_clean': clean_html(description)[:500] + "..." if len(clean_html(description)) > 500 else clean_html(description),
                'acceptance_criteria_clean': clean_html(acceptance_criteria)
            }
            
            test_forms.append(form_info)
            
            print(f"## {test_name}")
            print(f"**Work Item ID:** {item.get('Id')}")
            print(f"**Full Title:** {title}")
            
            if req_summary['fields']:
                print(f"**Key Fields:** {', '.join(req_summary['fields'][:5])}")
            
            if req_summary['calculations']:
                print(f"**Calculations:** {req_summary['calculations'][0][:100]}...")
                
            # Extract trial requirements
            desc_text = clean_html(description).lower()
            if 'four trial' in desc_text or 'trial 1, trial 2, trial 3, trial 4' in desc_text:
                print(f"**Trials Required:** 4 trials (Trial 1, 2, 3, 4)")
            
            print()
    
    print(f"\n**Total Forms to Implement:** {len(test_forms)}")
    
    # Save structured data
    with open('test_forms_requirements.json', 'w') as f:
        json.dump(test_forms, f, indent=2)
    
    print(f"\nDetailed requirements saved to test_forms_requirements.json")
    
    # Map to existing test codes
    test_code_mapping = {
        'TAN by Color Indication': 'TAN',
        'Water - KF': 'KF', 
        'TBN by Auto Titration': 'TBN',
        'Emission Spectroscopy - Large': 'SpecLrg',
        'Viscosity @ 40': 'Vis40',
        'Viscosity @ 100': 'Vis100',
        'Flashpoint': 'FlashPt',
        'Inspect Filter (Special Template)': 'InspectFilter',
        'Grease Penetration Worked': 'GrPen60',
        'Grease Dropping Point': 'GrDropPt',
        'Particle Count': 'Pcnt',
        'RBOT': 'RBOT',
    }
    
    print("\n## Form Implementation Status")
    for form in test_forms:
        test_code = test_code_mapping.get(form['test_name'], 'UNKNOWN')
        print(f"- {form['test_name']} → {test_code}")
    
if __name__ == "__main__":
    try:
        from bs4 import BeautifulSoup
    except ImportError:
        print("Installing BeautifulSoup for HTML parsing...")
        import subprocess
        subprocess.run(['uv', 'add', 'beautifulsoup4'], check=True)
        from bs4 import BeautifulSoup
    
    main()
