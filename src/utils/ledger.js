import { supabase } from '../../supabase';

/**
 * Logs an action to the global activity ledger for end-to-end traceability.
 * @param {Object} params
 * @param {string} params.actionType - DONOR_PROPOSE, FOODBANK_ACCEPT, FOODBANK_PROPOSE, BARANGAY_ACCEPT, BARANGAY_DISTRIBUTE, EMERGENCY_SOS
 * @param {string} params.targetId - ID of the target entity (User or Donation)
 * @param {string} params.targetName - Display name of the target entity
 * @param {string} params.details - Human readable description of the action
 * @param {Object} [params.metadata] - Additional JSON data (items, status, proof_url)
 */
/**
 * NO-OP: Logging is now handled automatically by the public.global_activity_ledger SQL View.
 * Manual insertions are no longer required.
 */
export const logLedgerAction = async () => {
  // Logic migrated to Supabase View for better data integrity
  return;
};

