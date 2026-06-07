-- Fix foreign key constraint issue
-- Make created_by nullable so events can be created without users

-- Update wedding_events table
ALTER TABLE wedding_events 
  ALTER COLUMN created_by DROP NOT NULL;

-- Update bulk_messages table
ALTER TABLE bulk_messages 
  ALTER COLUMN created_by DROP NOT NULL;

-- Update uploaded_guest_lists table
ALTER TABLE uploaded_guest_lists 
  ALTER COLUMN created_by DROP NOT NULL;

-- Verify the changes
SELECT 
    column_name, 
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name = 'wedding_events' 
  AND column_name = 'created_by';
