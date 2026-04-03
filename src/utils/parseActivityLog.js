/**
 * Activity Log Parser
 *
 * This module provides two parsing approaches:
 *
 * 1. GEMINI API (ACTIVE) - parseActivityLogWithGemini()
 *    Uses Google Gemini via backend API for intelligent extraction
 *    of investigation fields from activity logs. More accurate and flexible.
 *
 * 2. RULE-BASED (COMMENTED) - parseActivityLog()
 *    Original frontend-only rule-based extraction using regex patterns.
 *    Kept for backwards compatibility if needed.
 *
 * The Gemini approach extracts MORE fields and handles edge cases better.
 */

import { ibmbAPI } from '@/api/ibmb';

// Human-readable labels (used for both Gemini and rule-based approaches)
const FIELD_LABELS = {
  // Text-based fields
  ioCallMade: 'IO Call Made to Customer',
  initialCustomerStance: 'Customer Stance as per Initial Call',
  deviceBlockedFlag: 'Blocking of Observed Device',
  frmAlert: 'FRM System Alert',
  // CSV-based fields
  loginId: 'Customer Login ID',
  initialDeviceId: 'Initial Device at Registration',
  loginIp: 'User IP / LAT-LONG',
  deviceChange: 'Change in Device Detail',
  ipChange: 'Change of IP / Location',
  newDevice: 'New Device Registration',
  credentialChange: 'Change in Login ID / Password',
  tpinChange: 'Change in T-PIN',
  limitEnhanced: 'Limit Enhancement',
  otpDelivered: 'SMS / OTP Delivered',
  txnPattern: 'Customer Disputed Transaction Pattern',
  hblMobileAppActivityReview: 'HBL Mobile App Activity Review',
};


// ═══════════════════════════════════════════════════════════════════════════════
// GEMINI API APPROACH (ACTIVE)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Parse activity log using the backend Gemini parser.
 *
 * This approach sends the activity log content to the backend, which uses
 * Google Gemini for intelligent extraction of investigation fields.
 *
 * @param {File} file - The activity log file to parse
 * @returns {Promise<{ matches: Array, unmatchedLines: string[], summary: Object, source: string }>}
 */
export async function parseActivityLogWithGemini(file) {
  try {
    const response = await ibmbAPI.parseActivityLog(file);
    const result = response.data;

    // Ensure consistent structure
    return {
      matches: result.matches || [],
      unmatchedLines: [], // Gemini doesn't return unmatched lines
      summary: result.summary || {},
      source: result.source || 'gemini',
      model: result.model,
      isCSV: result.isCSV ?? true,
    };
  } catch (error) {
    console.error('Gemini parsing failed:', error);

    // Return error structure
    return {
      matches: [],
      unmatchedLines: [],
      summary: {},
      source: 'gemini',
      error: error.response?.data?.detail || error.message || 'Failed to parse activity log',
    };
  }
}

/**
 * Convert parsed matches to a flat object suitable for merging into form state.
 * Works with both Gemini and rule-based parsing results.
 *
 * @param {Array} matches - The matches array from parsing
 * @returns {Object} - e.g. { loginId: 'mhassan1212', deviceChange: 'no', ... }
 */
export function matchesToFormState(matches) {
  const state = {};
  for (const m of matches) {
    state[m.field] = m.value;
  }
  return state;
}


// ═══════════════════════════════════════════════════════════════════════════════
// RULE-BASED APPROACH (COMMENTED - KEPT FOR BACKWARDS COMPATIBILITY)
// ═══════════════════════════════════════════════════════════════════════════════

/*
// ─── A) Unstructured text rules ───────────────────────────────────────────────

const TEXT_FIELD_RULES = [
  {
    field: 'ioCallMade',
    type: 'choice',
    match: /\bcall\b.*\b(made|not\s+made|placed|not\s+placed)\b.*\bcustomer\b/i,
    extract: (sentence) => {
      if (/\b(not|no|never|wasn'?t|wasn't)\b.*\b(made|placed|contacted)\b/i.test(sentence) ||
          /\bcall\b.*\bnot\b/i.test(sentence)) {
        return 'no';
      }
      return 'yes';
    },
  },
  {
    field: 'initialCustomerStance',
    type: 'text',
    match: /\bcustomer\s+stance\b.*\binitial\s+call\b/i,
    extract: (sentence) => {
      const afterWas = sentence.match(/stance\s+(?:was|is|:)\s*(.+?)(?:\s+during\s+initial\s+call)?$/i);
      if (afterWas) {
        let value = afterWas[1].replace(/\s*during\s+initial\s+call\s*$/i, '').trim();
        return value.charAt(0).toUpperCase() + value.slice(1);
      }
      const fallback = sentence.match(/stance\s+(.+)/i);
      return fallback ? fallback[1].trim() : sentence;
    },
  },
  {
    field: 'deviceBlockedFlag',
    type: 'choice',
    match: /\bdevice\b.*\b(block|blocked|blocking)\b/i,
    extract: (sentence) => {
      if (/\b(not|no|never|wasn'?t|wasn't|unable|failed)\b.*\bblock/i.test(sentence) ||
          /\bnot\s+blocked\b/i.test(sentence)) {
        return 'no';
      }
      return 'yes';
    },
  },
  {
    field: 'frmAlert',
    type: 'choice',
    match: /\b(frm|fraud\s+risk\s+management)\b.*\b(alert|system\s+alert)\b/i,
    extract: (sentence) => {
      if (/\b(no|not|never|wasn'?t|wasn't)\b.*\b(alert|generated)\b/i.test(sentence) ||
          /\balert\b.*\bnot\b.*\bgenerated\b/i.test(sentence)) {
        return 'no';
      }
      return 'yes';
    },
  },
];

// ─── B) Structured CSV column header signatures ──────────────────────────────

const CSV_HEADER_SIGNATURES = [
  'customer login id',
  'transaction type',
  'activity status',
  'device operating system',
  'imei',
];

// Column name → index mappings (resolved dynamically from the header row)
const EXPECTED_COLUMNS = {
  loginId: /customer\s*login\s*id/i,
  dateOfActivity: /date\s*of\s*activity/i,
  timeOfActivity: /time\s*of\s*activity/i,
  transactionType: /transaction\s*type/i,
  transactionId: /unique\s*transaction\s*id/i,
  amount: /amount\s*of\s*transaction/i,
  activityStatus: /activity\s*status/i,
  billedAmount: /billed\s*amount/i,
  deviceOS: /device\s*operating\s*system/i,
  imei: /imei|device\s*id/i,
  deviceMaker: /device\s*maker/i,
  deviceModel: /device\s*model/i,
  ipAddress: /customer\s*ip\s*address/i,
  channel: /channel\s*name/i,
  longitude: /longitude/i,
  latitude: /latitude/i,
  description: /description|transaction\s*detail/i,
};

// API name patterns for detecting specific activity types
const API_PATTERNS = {
  credentialChange: [
    /forgot\s*(password|journey)/i,
    /change\s*(password|login\s*id|user\s*id|credential)/i,
    /reset\s*(password|login)/i,
    /password\s*(change|reset|update)/i,
    /login\s*id\s*(change|update)/i,
  ],
  tpinChange: [
    /t[\s-]*pin/i,
    /transaction\s*pin/i,
    /mpin/i,
  ],
  limitEnhancement: [
    /limit\s*(enhance|change|update|increase|modify)/i,
    /transaction\s*limit/i,
    /daily\s*limit/i,
  ],
  otpDelivery: [
    /otp/i,
    /one\s*time\s*password/i,
    /verification\s*code/i,
  ],
  login: [
    /^login$/i,
  ],
  fundTransfer: [
    /fund\s*transfer/i,
    /payment/i,
    /transfer/i,
    /ibft/i,
    /bill\s*payment/i,
  ],
  beneficiaryAdd: [
    /beneficiary/i,
    /add\s*payee/i,
  ],
  biometric: [
    /biometric/i,
    /fingerprint/i,
    /face\s*id/i,
  ],
};


// ─── Detect format ───────────────────────────────────────────────────────────

function isStructuredCSV(rawText) {
  const firstLine = rawText.split(/[\n\r]+/).find(l => l.trim().length > 0) || '';
  const lower = firstLine.toLowerCase();
  return CSV_HEADER_SIGNATURES.filter(sig => lower.includes(sig)).length >= 3;
}


// ─── CSV parsing helpers ─────────────────────────────────────────────────────

function resolveColumnIndices(headerCells) {
  const indices = {};
  for (const [key, pattern] of Object.entries(EXPECTED_COLUMNS)) {
    const idx = headerCells.findIndex(cell => pattern.test(cell.trim()));
    if (idx !== -1) indices[key] = idx;
  }
  return indices;
}

function splitCSVRow(row) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function isNoteRow(cells) {
  const joined = cells.slice(0, 3).join(' ').toLowerCase();
  return joined.includes('note:') || joined.includes('this header shows');
}

function matchesAny(text, patterns) {
  return patterns.some(p => p.test(text));
}


// ─── CSV analysis ────────────────────────────────────────────────────────────

function analyzeCSVData(rows, colIdx) {
  const matches = [];

  if (rows.length === 0) return matches;

  // ── Extract unique values for comparison fields ──
  const loginIds = new Set();
  const devices = new Set();     // IMEI / Device ID
  const deviceLabels = {};       // IMEI → "Maker Model" for display
  const ipAddresses = new Set();
  const locations = new Set();   // "lat,long"
  let hasCredentialChange = false;
  let hasTpinChange = false;
  let hasLimitEnhancement = false;
  let hasOTP = false;
  let loginAttempts = 0;
  let failedLogins = 0;
  let fundTransferCount = 0;
  let hasBeneficiaryAdd = false;
  let hasBiometric = false;
  const transactionAmounts = [];

  for (const cells of rows) {
    const get = (key) => (colIdx[key] !== undefined ? (cells[colIdx[key]] || '').trim() : '');

    // Login ID
    const lid = get('loginId');
    if (lid) loginIds.add(lid);

    // Device
    const imei = get('imei');
    if (imei) {
      devices.add(imei);
      const maker = get('deviceMaker');
      const model = get('deviceModel');
      if (maker || model) {
        deviceLabels[imei] = [maker, model].filter(Boolean).join(' ');
      }
    }

    // IP Address
    const ip = get('ipAddress');
    if (ip) ipAddresses.add(ip);

    // Location
    const lng = get('longitude');
    const lat = get('latitude');
    if (lng && lat) locations.add(`${lat},${lng}`);

    // Transaction Type analysis
    const txnType = get('transactionType');
    const desc = get('description');
    const combined = `${txnType} ${desc}`;
    const actStatus = get('activityStatus').toLowerCase();

    if (matchesAny(combined, API_PATTERNS.credentialChange)) hasCredentialChange = true;
    if (matchesAny(combined, API_PATTERNS.tpinChange)) hasTpinChange = true;
    if (matchesAny(combined, API_PATTERNS.limitEnhancement)) hasLimitEnhancement = true;
    if (matchesAny(combined, API_PATTERNS.otpDelivery)) hasOTP = true;
    if (matchesAny(txnType, API_PATTERNS.login)) {
      loginAttempts++;
      if (actStatus.includes('fail')) failedLogins++;
    }
    if (matchesAny(combined, API_PATTERNS.fundTransfer)) fundTransferCount++;
    if (matchesAny(combined, API_PATTERNS.beneficiaryAdd)) hasBeneficiaryAdd = true;
    if (matchesAny(combined, API_PATTERNS.biometric)) hasBiometric = true;

    // Amounts
    const amt = parseFloat((get('amount') || '0').replace(/,/g, ''));
    if (!isNaN(amt) && amt > 0) transactionAmounts.push(amt);
  }

  // ── Build matches ──

  // 1. Login ID
  if (loginIds.size > 0) {
    const id = [...loginIds][0]; // primary login ID
    matches.push({
      field: 'loginId',
      value: id,
      sentence: `Customer Login ID: ${id}`,
      label: FIELD_LABELS.loginId,
      type: 'text',
    });
  }

  // 2. Initial Device (first device seen)
  if (devices.size > 0) {
    const firstImei = [...devices][0];
    const label = deviceLabels[firstImei] || firstImei;
    const display = label !== firstImei ? `${label} (${firstImei})` : firstImei;
    matches.push({
      field: 'initialDeviceId',
      value: display,
      sentence: `Initial registered device: ${display}`,
      label: FIELD_LABELS.initialDeviceId,
      type: 'text',
    });
  }

  // 3. Login IP / Location
  if (ipAddresses.size > 0) {
    const ips = [...ipAddresses];
    const locs = [...locations];
    const ipSummary = ips.length === 1
      ? `Same IP (${ips[0]})`
      : `Multiple IPs: ${ips.join(', ')}`;
    const locSummary = locs.length <= 1 ? 'Same location' : 'Multiple locations';
    matches.push({
      field: 'loginIp',
      value: `${ipSummary} — ${locSummary}`,
      sentence: `IP analysis: ${ipSummary}. Location analysis: ${locSummary}.`,
      label: FIELD_LABELS.loginIp,
      type: 'text',
    });
  }

  // 4. Device Change
  matches.push({
    field: 'deviceChange',
    value: devices.size > 1 ? 'yes' : 'no',
    sentence: devices.size > 1
      ? `${devices.size} distinct devices detected: ${[...devices].map(d => deviceLabels[d] || d).join(', ')}`
      : 'No device change observed across activity log entries.',
    label: FIELD_LABELS.deviceChange,
    type: 'choice',
  });

  // 5. IP / Location Change
  matches.push({
    field: 'ipChange',
    value: (ipAddresses.size > 1 || locations.size > 1) ? 'yes' : 'no',
    sentence: (ipAddresses.size > 1 || locations.size > 1)
      ? `IP/Location change detected: ${ipAddresses.size} IPs, ${locations.size} locations.`
      : 'No IP or location change observed.',
    label: FIELD_LABELS.ipChange,
    type: 'choice',
  });

  // 6. New Device
  matches.push({
    field: 'newDevice',
    value: devices.size > 1 ? 'yes' : 'no',
    sentence: devices.size > 1
      ? `New device registration detected (${devices.size} devices in log).`
      : 'No new device registration observed.',
    label: FIELD_LABELS.newDevice,
    type: 'choice',
  });

  // 7. Credential Change
  matches.push({
    field: 'credentialChange',
    value: hasCredentialChange ? 'yes' : 'no',
    sentence: hasCredentialChange
      ? 'Credential change activity detected in activity log (password/login ID change or forgot journey).'
      : 'No credential change observed in activity log.',
    label: FIELD_LABELS.credentialChange,
    type: 'choice',
  });

  // 8. T-PIN Change
  matches.push({
    field: 'tpinChange',
    value: hasTpinChange ? 'yes' : 'no',
    sentence: hasTpinChange
      ? 'T-PIN change/reset activity detected in activity log.'
      : 'No T-PIN change observed in activity log.',
    label: FIELD_LABELS.tpinChange,
    type: 'choice',
  });

  // 9. Limit Enhancement
  matches.push({
    field: 'limitEnhanced',
    value: hasLimitEnhancement ? 'yes' : 'no',
    sentence: hasLimitEnhancement
      ? 'Limit enhancement activity detected in activity log.'
      : 'No limit enhancement observed in activity log.',
    label: FIELD_LABELS.limitEnhanced,
    type: 'choice',
  });

  // 10. OTP Delivered
  matches.push({
    field: 'otpDelivered',
    value: hasOTP ? 'yes' : 'no',
    sentence: hasOTP
      ? 'OTP/verification code delivery detected in activity log.'
      : 'No OTP delivery observed in activity log.',
    label: FIELD_LABELS.otpDelivered,
    type: 'choice',
  });

  // 11. Transaction Pattern — must match one of the radio options in InvestigationFormPage
  const TXN_PATTERN_NORMAL = 'Transaction pattern seems Normal as compared with previous history';
  const TXN_PATTERN_SUSPICIOUS = 'Transaction pattern seems suspicious as compared with pervious history';
  const TXN_PATTERN_NO_HISTORY = 'No previous history observed, current activity shows frequent use / explorer of multiple options';

  const patternParts = [];
  if (loginAttempts > 0) patternParts.push(`${loginAttempts} login attempts (${failedLogins} failed)`);
  if (fundTransferCount > 0) patternParts.push(`${fundTransferCount} fund transfers`);
  if (hasBeneficiaryAdd) patternParts.push('beneficiary addition');
  if (hasBiometric) patternParts.push('biometric verification');
  if (transactionAmounts.length > 0) {
    const total = transactionAmounts.reduce((a, b) => a + b, 0);
    patternParts.push(`${transactionAmounts.length} transactions totaling PKR ${total.toLocaleString()}`);
  }

  const isAbnormal = failedLogins >= 3 || devices.size > 1 || (ipAddresses.size > 1 && devices.size > 1);
  // Map to the exact radio-button option text used in the investigation form
  const patternRadioValue = isAbnormal ? TXN_PATTERN_SUSPICIOUS : TXN_PATTERN_NORMAL;
  const patternSentence = patternParts.length > 0
    ? `Activity summary: ${patternParts.join('; ')}. Pattern: ${isAbnormal ? 'Suspicious' : 'Normal'}.`
    : `Transaction pattern: ${isAbnormal ? 'Suspicious' : 'Normal'}.`;

  matches.push({
    field: 'txnPattern',
    value: patternRadioValue,
    sentence: patternSentence,
    label: FIELD_LABELS.txnPattern,
    type: 'choice',
  });

  return matches;
}


// ─── Main entry points (RULE-BASED - COMMENTED) ──────────────────────────────

// This is the original rule-based parsing function.
// It is kept for backwards compatibility but is no longer the primary approach.

export function parseActivityLog(rawText) {
  if (isStructuredCSV(rawText)) {
    return parseStructuredCSV(rawText);
  }
  return parseUnstructuredText(rawText);
}

function parseStructuredCSV(rawText) {
  const lines = rawText
    .split(/[\n\r]+/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length < 2) return { matches: [], unmatchedLines: lines };

  // First line is the header
  const headerCells = splitCSVRow(lines[0]);
  const colIdx = resolveColumnIndices(headerCells);

  // Parse data rows (skip header and any "Note:" rows)
  const dataRows = [];
  const unmatchedLines = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCSVRow(lines[i]);
    if (isNoteRow(cells)) continue;
    // Validate: must have at least a few populated cells to be a real data row
    const populated = cells.filter(c => c.length > 0).length;
    if (populated >= 3) {
      dataRows.push(cells);
    } else {
      unmatchedLines.push(lines[i]);
    }
  }

  const matches = analyzeCSVData(dataRows, colIdx);
  return { matches, unmatchedLines };
}

function parseUnstructuredText(rawText) {
  const lines = rawText
    .split(/[\n\r]+/)
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));

  const matches = [];
  const unmatchedLines = [];
  const matchedFields = new Set();

  for (const line of lines) {
    let matched = false;
    for (const rule of TEXT_FIELD_RULES) {
      if (matchedFields.has(rule.field)) continue;
      if (rule.match.test(line)) {
        const value = rule.extract(line);
        matches.push({
          field: rule.field,
          value,
          sentence: line,
          label: FIELD_LABELS[rule.field] || rule.field,
          type: rule.type,
        });
        matchedFields.add(rule.field);
        matched = true;
        break;
      }
    }
    if (!matched) {
      unmatchedLines.push(line);
    }
  }

  return { matches, unmatchedLines };
}
*/

// ─── Legacy exports for backwards compatibility ──────────────────────────────
// These allow existing code to work if parseActivityLog is still called directly

/**
 * Parse activity log using rule-based approach (synchronous, frontend-only).
 *
 * NOTE: This function is kept for backwards compatibility.
 * For better extraction, use parseActivityLogWithGemini() instead.
 *
 * @param {string} rawText - Raw text content from the uploaded file
 * @returns {{ matches: Array, unmatchedLines: string[] }}
 */
export function parseActivityLog(rawText) {
  // Simplified rule-based parsing kept for fallback/offline use
  const isCSV = rawText.split('\n')[0]?.toLowerCase().includes('customer login id');

  if (isCSV) {
    return parseStructuredCSVFallback(rawText);
  }

  return { matches: [], unmatchedLines: rawText.split('\n') };
}

/**
 * Fallback CSV parser - minimal implementation for offline/error cases.
 */
function parseStructuredCSVFallback(rawText) {
  const lines = rawText.split(/[\n\r]+/).filter(l => l.trim());
  if (lines.length < 2) return { matches: [], unmatchedLines: lines };

  const headerCells = lines[0].split(',').map(c => c.trim().toLowerCase());
  const loginIdIdx = headerCells.findIndex(c => c.includes('customer login id'));
  const imeiIdx = headerCells.findIndex(c => c.includes('imei') || c.includes('device id'));
  const ipIdx = headerCells.findIndex(c => c.includes('ip address'));

  const loginIds = new Set();
  const devices = new Set();
  const ips = new Set();

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map(c => c.trim());
    if (loginIdIdx >= 0 && cells[loginIdIdx]) loginIds.add(cells[loginIdIdx]);
    if (imeiIdx >= 0 && cells[imeiIdx]) devices.add(cells[imeiIdx]);
    if (ipIdx >= 0 && cells[ipIdx]) ips.add(cells[ipIdx]);
  }

  const matches = [];

  if (loginIds.size > 0) {
    matches.push({
      field: 'loginId',
      value: [...loginIds][0],
      sentence: `Customer Login ID: ${[...loginIds][0]}`,
      label: FIELD_LABELS.loginId,
      type: 'text',
    });
  }

  if (devices.size > 0) {
    matches.push({
      field: 'initialDeviceId',
      value: [...devices][0],
      sentence: `Initial device: ${[...devices][0]}`,
      label: FIELD_LABELS.initialDeviceId,
      type: 'text',
    });
  }

  matches.push({
    field: 'deviceChange',
    value: devices.size > 1 ? 'yes' : 'no',
    sentence: devices.size > 1 ? 'Multiple devices detected' : 'No device change',
    label: FIELD_LABELS.deviceChange,
    type: 'choice',
  });

  matches.push({
    field: 'ipChange',
    value: ips.size > 1 ? 'yes' : 'no',
    sentence: ips.size > 1 ? 'Multiple IPs detected' : 'No IP change',
    label: FIELD_LABELS.ipChange,
    type: 'choice',
  });

  return { matches, unmatchedLines: [] };
}
