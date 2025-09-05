# Database Seeding

This directory contains seed functions to populate your SQLite database with data from the CSV files in the `docs/` folder.

## Files

- **`csv-parser.ts`** - Utility for parsing CSV files with proper type conversion
- **`index.ts`** - Main seeder that orchestrates all seed functions
- **Individual seed files** - One for each table group:
  - `test-list.seed.ts` - Test list lookup data
  - `test-stand.seed.ts` - Test stand reference data  
  - `test.seed.ts` - Main test definitions
  - `particle-type-definition.seed.ts` - Particle type definitions
  - `particle-sub-type.seed.ts` - Particle sub-type definitions
  - `test-schedule.seed.ts` - Test scheduling data
  - `transactional.seed.ts` - Transactional particle and test reading data

## Usage

### Seed All Tables
```bash
npm run seed
```

### Seed Specific Tables
```bash
npm run seed --specific test,test_list,particle_type_definition
```

### Custom Database Path
```bash
npm run seed --db=./custom-database.db
```

### Help
```bash
npm run seed --help
```

## Available Tables

- `test_list` - Test status lookup
- `test_stand` - Test stand equipment  
- `test` - Test type definitions
- `particle_type_definition` - Particle type reference data
- `particle_sub_type_category_definition` - Particle sub-type categories
- `particle_sub_type_definition` - Particle sub-type definitions
- `test_schedule` - Test scheduling configurations
- `test_schedule_rule` - Test scheduling rules
- `test_schedule_test` - Test schedule assignments
- `particle_type` - Particle type observations (transactional)
- `particle_sub_type` - Particle sub-type measurements (transactional)  
- `test_readings` - Test result readings (transactional)

## Seeding Order

The seeder automatically handles dependencies by running tables in this order:

1. **Reference Tables** (no dependencies)
   - test_list_table
   - test_stand_table  
   - particle_sub_type_category_definition_table
   - particle_type_definition_table

2. **Dependent Reference Tables**
   - particle_sub_type_definition_table (→ particle_sub_type_category_definition)
   - test_table (→ test_stand)

3. **Schedule Tables**
   - test_schedule_table
   - test_schedule_rule_table (→ test_schedule)
   - test_schedule_test_table (→ test_schedule)

4. **Transactional Data**
   - particle_type_table (→ particle_type_definition)
   - particle_sub_type_table (→ particle_type_definition, particle_sub_type_category_definition)
   - test_readings_table (→ test)

## Data Processing

- **NULL handling** - CSV NULL values and empty strings are converted to database NULL
- **Type conversion** - Automatic conversion for numbers, booleans, and dates
- **HTML entities** - Cleaned in description fields (e.g., `&micro;` → `μ`)
- **Boolean conversion** - `1`/`0` and `Y`/`N` values converted to proper booleans
- **Timestamp conversion** - Date strings converted to Unix timestamps where needed

## Error Handling

- Failed CSV parsing will show detailed error messages
- Foreign key constraint violations are prevented by proper seeding order
- Database is automatically closed on completion or error
- Temporary compilation artifacts are cleaned up automatically
