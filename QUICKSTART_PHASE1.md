# Phase 1 Quick Start Guide 🚀

**Get up and running in 5 minutes!**

---

## Step 1: Run Migration & Seed Data (2 min)

```bash
# Run database migration
sqlite3 lab.db < drizzle/0001_phase1_critical_tables.sql

# Seed lookup tables and sample qualifications
npm run seed
```

---

## Step 2: Start Servers (1 min)

```bash
# Terminal 1: Start API server
npm run dev:server

# Terminal 2: Start Angular dev server
npm run dev
```

---

## Step 3: Set Test User (30 sec)

Open browser console at `http://localhost:4200` and run:

```javascript
localStorage.setItem('currentUser', JSON.stringify({
  employeeId: 'EMP001',
  name: 'Test User'
}));
```

---

## Step 4: Navigate & Test (1 min)

1. Go to: `http://localhost:4200/enter-results`
2. Look for qualification badges next to tests
3. Try clicking tests with different badges

---

## Expected Result

You should see:
- ✅ Qualification badges (colored pills) next to each test
- ✅ Green "Qualified" badges for tests you can access
- ✅ Orange "Trainee" badges for training mode
- ✅ Red "Not Qualified" badges with lock icons for unauthorized tests
- ✅ Loading indicator while qualifications load

---

## Troubleshooting

**No badges appear?**
```bash
# Check API is running
curl http://localhost:3001/api/qualifications/EMP001

# Should return JSON with qualifications
```

**All tests show "Not Qualified"?**
```bash
# Re-run seed
npm run seed

# Check database
sqlite3 lab.db "SELECT * FROM lube_tech_qualification_table;"
```

---

## Quick Test Scenarios

### Change Qualification Level

**Make user a Trainee:**
```bash
sqlite3 lab.db "UPDATE lube_tech_qualification_table SET qualificationLevel='TRAIN' WHERE employeeId='EMP001';"
```

**Make user QA Qualified:**
```bash
sqlite3 lab.db "UPDATE lube_tech_qualification_table SET qualificationLevel='QAG' WHERE employeeId='EMP001';"
```

**Refresh page to see changes!**

---

## Success! ✅

If you see colored badges and tests respond correctly, **Phase 1 is working!**

📖 **Full Testing Guide:** `docs/PHASE1_AUTHORIZATION_IMPLEMENTED.md`

---

_Quick Start completed!_ 🎉
