-- SIMPLER FIX: Remove foreign key constraints entirely
-- This allows events to be created without needing user records

-- Drop foreign key constraints
ALTER TABLE wedding_events 
  DROP CONSTRAINT IF EXISTS wedding_events_created_by_fkey;

ALTER TABLE bulk_messages 
  DROP CONSTRAINT IF EXISTS bulk_messages_created_by_fkey;

ALTER TABLE uploaded_guest_lists 
  DROP CONSTRAINT IF EXISTS uploaded_guest_lists_created_by_fkey;

-- Verify constraints are removed
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name
FROM pg_constraint
WHERE conname LIKE '%created_by_fkey%';

-- Should return 0 rows if successful
