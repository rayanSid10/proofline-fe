/**
 * Role-based permission utilities for ProofLine
 *
 * Roles:
 *   investigator  – IB/MB cases + transcription
 *   supervisor    – all modules (IB/MB, FTDH, Branch Portal)
 *   ftdh_officer  – FTDH module only
 *   branch_user   – FTDH Branch Portal page only
 */

export const ROLES = [
  { value: 'investigator', label: 'Investigator' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'ftdh_officer', label: 'FTDH Officer' },
  { value: 'branch_user', label: 'Branch User' },
];

/** Can access IB/MB Disputes module */
export const canAccessIBMB = (role) =>
  ['investigator', 'supervisor'].includes(role);

/** Can access FTDH module (Incoming / Outward) */
export const canAccessFTDH = (role) =>
  ['ftdh_officer', 'supervisor'].includes(role);

/** Can approve / review cases */
export const canApprove = (role) => role === 'supervisor';

/** Is a branch user (Branch Portal only) */
export const isBranchUser = (role) => role === 'branch_user';

/** Can view reports */
export const canAccessReports = (role) =>
  ['supervisor', 'ftdh_officer'].includes(role);
