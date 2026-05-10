-- ============================================================
-- ANGAY: Global Logistics Ledger (AGGREGATED VIEW)
-- This replaces the static table with a dynamic view that 
-- derives supply chain state from existing transactions.
-- ============================================================

-- Drop the static table if it exists
DROP TABLE IF EXISTS public.global_activity_ledger;

CREATE OR REPLACE VIEW public.global_activity_ledger AS
-- 1. Donor Proposes (All active donations)
SELECT 
  id::text || '-propose' as id,
  created_at,
  donor_id as actor_id,
  donor_name as actor_name,
  'donor' as actor_role,
  'DONOR_PROPOSE' as action_type,
  foodbank_id::text as target_id,
  foodbank_name as target_name,
  'Proposed a donation of: ' || items as details,
  jsonb_build_object('items', items, 'notes', notes) as metadata
FROM public.donations

UNION ALL

-- 2. Foodbank Accepts (Accepted/Completed donations)
SELECT 
  id::text || '-accept' as id,
  updated_at as created_at,
  foodbank_id as actor_id,
  foodbank_name as actor_name,
  'foodbank' as actor_role,
  'FOODBANK_ACCEPT' as action_type,
  donor_id::text as target_id,
  donor_name as target_name,
  'Accepted donation from ' || donor_name || ': ' || items as details,
  jsonb_build_object('items', items) as metadata
FROM public.donations
WHERE status IN ('accepted', 'completed')

UNION ALL

-- 3. Foodbank Proposes to Barangay (All distributions)
SELECT 
  id::text || '-fb-propose' as id,
  created_at,
  foodbank_id as actor_id,
  foodbank_name as actor_name,
  'foodbank' as actor_role,
  'FOODBANK_PROPOSE' as action_type,
  barangay_id::text as target_id,
  barangay_name as target_name,
  'Dispatched aid package to ' || barangay_name || ': ' || items as details,
  jsonb_build_object('items', items, 'notes', notes) as metadata
FROM public.distributions

UNION ALL

-- 4. Barangay Accepts (Received/Distributed state)
SELECT 
  id::text || '-bgy-accept' as id,
  updated_at as created_at,
  barangay_id as actor_id,
  barangay_name as actor_name,
  'barangay' as actor_role,
  'BARANGAY_ACCEPT' as action_type,
  foodbank_id::text as target_id,
  foodbank_name as target_name,
  'Verified receipt of aid from ' || foodbank_name as details,
  jsonb_build_object('items', items) as metadata
FROM public.distributions
WHERE status IN ('received', 'distributed')

UNION ALL

-- 5. Barangay submits distribution report
SELECT 
  id::text || '-bgy-dist' as id,
  distributed_at as created_at,
  barangay_id as actor_id,
  barangay_name as actor_name,
  'barangay' as actor_role,
  'BARANGAY_DISTRIBUTE' as action_type,
  NULL as target_id,
  'Community' as target_name,
  'Distribution completed in community: ' || items as details,
  jsonb_build_object(
    'items', items, 
    'proof_description', proof_description, 
    'proof_url', CASE WHEN array_length(proof_images, 1) > 0 THEN proof_images[1] ELSE NULL END
  ) as metadata
FROM public.distributions
WHERE status = 'distributed'

UNION ALL

-- 6. Barangay declares signal distress
SELECT 
  id::text || '-sos' as id,
  crisis_started_at as created_at,
  id as actor_id,
  barangay_name as actor_name,
  'barangay' as actor_role,
  'EMERGENCY_SOS' as action_type,
  NULL as target_id,
  'System SOS' as target_name,
  'Distress signal activated: ' || crisis_type as details,
  jsonb_build_object('crisis_type', crisis_type) as metadata
FROM public.barangays
WHERE is_in_crisis = true;
