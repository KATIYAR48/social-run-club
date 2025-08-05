# Migration: Age to Date of Birth

This migration converts the user model from using an `age` field to a `dateOfBirth` field.

## Changes Made

### Database Schema
- **Removed**: `age` field from User model
- **Added**: `dateOfBirth` field (Date type) to User model

### Frontend Changes
- Updated profile edit page to use date input instead of number input
- Updated profile display to show calculated age from dateOfBirth
- Updated all admin pages to handle dateOfBirth instead of age

### Backend Changes
- Updated User model interface and schema
- Updated auth context to use dateOfBirth
- Updated profile API to calculate age from dateOfBirth
- Updated volunteers API to use dateOfBirth
- Updated all admin APIs to handle dateOfBirth

## Running the Migration

### Prerequisites

Make sure you have a `.env.local` file in your project root with the MongoDB connection string:

```bash
MONGO_URI=your_mongodb_connection_string_here
```

### 1. Run the Database Migration

You have two options to run the migration:

**Option A: Using ES Module syntax (recommended)**
```bash
node scripts/migrate-age-to-dateofbirth.js
```

**Option B: Using CommonJS syntax**
```bash
node scripts/migrate-age-to-dateofbirth.cjs
```

This script will:
- Find all users with an `age` field
- Calculate an approximate `dateOfBirth` based on their age
- Update the user records to use `dateOfBirth` instead of `age`
- Remove the `age` field from the database

### 2. Deploy the Code Changes

After running the migration, deploy the updated code that uses `dateOfBirth` instead of `age`.

## Migration Details

### Age to Date Calculation
The migration script calculates an approximate date of birth by:
1. Taking the current year
2. Subtracting the user's age
3. Setting the date to July 1st of that year (middle of the year approximation)

Example:
- User age: 25
- Current year: 2024
- Calculated birth year: 2024 - 25 = 1999
- Date of birth: 1999-07-01

### Backward Compatibility
The profile API now returns both `dateOfBirth` and calculated `age` for backward compatibility:
```json
{
  "dateOfBirth": "1999-07-01T00:00:00.000Z",
  "age": 25
}
```

## Files Modified

### Models
- `src/models/User.ts` - Updated schema and interface

### Frontend
- `src/lib/auth-context.tsx` - Updated User interface
- `src/app/profile/edit/page.tsx` - Updated form to use date input
- `src/app/profile/[username]/page.tsx` - Updated to display calculated age
- `src/app/admin/volunteers/page.tsx` - Updated to handle dateOfBirth
- `src/app/admin/event-registrations/page.tsx` - Updated to handle dateOfBirth

### Backend APIs
- `src/app/api/auth/update-profile/route.ts` - Updated to handle dateOfBirth
- `src/app/api/profile/[username]/route.ts` - Updated to calculate age from dateOfBirth
- `src/app/api/volunteers/route.ts` - Updated to use dateOfBirth

### Migration Scripts
- `scripts/migrate-age-to-dateofbirth.js` - ES Module version
- `scripts/migrate-age-to-dateofbirth.cjs` - CommonJS version

## Benefits

1. **More Accurate**: Date of birth is more precise than age
2. **Automatic Updates**: Age is calculated automatically and stays current
3. **Better UX**: Users can input their actual birth date
4. **Data Integrity**: Prevents age from becoming outdated

## Rollback Plan

If needed, you can rollback by:
1. Reverting the code changes
2. Running a reverse migration script to convert dateOfBirth back to age
3. Updating the User model to include age field again

## Testing

After migration:
1. Test user registration with date of birth
2. Test profile editing
3. Test profile display
4. Test admin pages
5. Verify age calculations are correct 