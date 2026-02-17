/**
 * Role-based permission utilities for ProofLine
 *
 * Roles:
 *   investigator  – IB/MB cases only
 *   supervisor    – IB/MB cases + approval authority
 *   admin         – full access to everything
 *   ftdh_officer  – FTDH module only
 *   branch_user   – FTDH Branch Portal page only
 */

export const ROLES = [
  { value: 'investigator', label: 'Investigator' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'admin', label: 'Admin' },
  { value: 'ftdh_officer', label: 'FTDH Officer' },
  { value: 'branch_user', label: 'Branch User' },
];

/** Can access IB/MB Disputes module */
export const canAccessIBMB = (role) =>
  ['investigator', 'supervisor', 'admin'].includes(role);

/** Can access FTDH module (Incoming / Outward) */
export const canAccessFTDH = (role) =>
  ['ftdh_officer', 'admin'].includes(role);

/** Can approve / review cases */
export const canApprove = (role) =>
  ['supervisor', 'admin'].includes(role);

/** Is a branch user (Branch Portal only) */
export const isBranchUser = (role) => role === 'branch_user';

/** Can view reports */
export const canAccessReports = (role) =>
  ['supervisor', 'admin', 'ftdh_officer'].includes(role);

/** Is admin */
export const isAdmin = (role) => role === 'admin';
