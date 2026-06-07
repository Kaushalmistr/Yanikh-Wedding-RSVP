-- ============================================
-- STEP 1: Check Current Schema
-- Run this first to see what exists
-- ============================================

-- Check if guests table exists and what columns it has
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'guests' 
ORDER BY ordinal_position;

-- If you see the guests table but it's missing columns,
-- proceed to STEP 2 below.
