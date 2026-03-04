# Mobile Services

This directory contains service modules for the Voice of Care mobile application.

## Database Service

The database service (`databaseService.ts`) provides an interface for managing offline data storage using SQLite.

### Initialization

Initialize the database on app startup:

```typescript
import { initializeDatabase } from './services/database';

// In App.tsx or root component
useEffect(() => {
  const setupDatabase = async () => {
    try {
      await initializeDatabase();
      console.log('Database ready');
    } catch (error) {
      console.error('Database initialization failed:', error);
    }
  };
  
  setupDatabase();
}, []);
```

### Usage Examples

#### Seed Database from Server

After successful login, seed the database with initial data:

```typescript
import databaseService from './services/databaseService';

const initData = await api.get('/mobile/init');
await databaseService.seedFromServer(initData);
```

#### Get Beneficiaries

Retrieve all beneficiaries assigned to the current ASHA worker:

```typescript
const beneficiaries = await databaseService.getBeneficiaries(workerId);
```

#### Verify Beneficiary by MCTS ID

```typescript
const beneficiary = await databaseService.getBeneficiaryByMCTS('MCTS123456');
if (!beneficiary) {
  alert('Beneficiary not found. Please sync or contact admin.');
}
```

#### Get Template

Load a visit template:

```typescript
const template = await databaseService.getTemplate('hbnc');
```

#### Create Visit

Save a completed visit to local storage:

```typescript
const visitData = {
  visit_type: 'hbnc',
  visit_date_time: new Date().toISOString(),
  day_number: 1,
  assigned_asha_id: workerId,
  beneficiary_id: beneficiary.id,
  template_id: template.id,
  visit_data: {
    answers: [
      {
        question_id: 'hbnc_q1',
        answer: 'yes',
        recorded_at: new Date().toISOString(),
      },
      // ... more answers
    ],
  },
};

const visitId = await databaseService.createVisit(visitData);
```

#### Get Pending Visits

Retrieve all unsynced visits:

```typescript
const pendingVisits = await databaseService.getPendingVisits();
const count = await databaseService.getPendingVisitsCount();
```

#### Update Sync Status

After successful sync, update the visit status:

```typescript
await databaseService.updateVisitSyncStatus(localVisitId, serverVisitId);
```

#### Query Visits with Filters

```typescript
// Get visits for a specific beneficiary
const visits = await databaseService.getVisits({
  beneficiary_id: beneficiary.id,
});

// Get visits in date range
const visits = await databaseService.getVisits({
  start_date: '2026-03-01T00:00:00Z',
  end_date: '2026-03-31T23:59:59Z',
});

// Get only synced visits
const syncedVisits = await databaseService.getVisits({
  is_synced: true,
});
```

## Database Schema

### Tables

- **workers**: ASHA worker profiles
- **beneficiaries**: Beneficiary records assigned to workers
- **templates**: Visit templates with questions
- **visits**: Recorded visit data (offline-first)

### Indexes

Performance indexes are created on:
- `beneficiaries.mcts_id` - Fast MCTS ID lookup
- `beneficiaries.assigned_asha_id` - Filter by assigned worker
- `visits.is_synced` - Query pending syncs
- `visits.beneficiary_id` - Filter visits by beneficiary
- `visits.assigned_asha_id` - Filter visits by worker
- `visits.visit_date_time` - Date-based queries

### Foreign Keys

Foreign key constraints ensure referential integrity:
- `beneficiaries.assigned_asha_id` → `workers.id`
- `visits.assigned_asha_id` → `workers.id`
- `visits.beneficiary_id` → `beneficiaries.id`
- `visits.template_id` → `templates.id`

## Data Flow

1. **First Login**: Fetch init data from `/api/v1/mobile/init` and seed database
2. **Offline Recording**: Create visits with `is_synced = false`
3. **Online Sync**: Upload pending visits to backend
4. **Update Status**: Mark visits as synced after successful upload

## Error Handling

All database operations return Promises. Handle errors appropriately:

```typescript
try {
  const beneficiary = await databaseService.getBeneficiaryByMCTS(mctsId);
  if (!beneficiary) {
    // Handle not found
  }
} catch (error) {
  console.error('Database error:', error);
  // Show user-friendly error message
}
```

## Development Utilities

For development and testing:

```typescript
import { dropAllTables, clearAllData } from './services/database';

// Drop all tables (requires re-initialization)
await dropAllTables();
await initializeDatabase();

// Clear data but keep schema
await clearAllData();
```
