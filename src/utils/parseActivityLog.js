/**
 * Activity Log Parser
 * 
 * Parses unstructured activity log text (from .txt or .csv files) and maps
 * sentences to specific investigation form fields using keyword/regex matching.
 * 
 * Supported field mappings:
 *   1. ioCallMade          — "call was (not) made to the customer"   → yes/no
 *   2. initialCustomerStance — "customer stance was ... initial call" → extracted text
 *   3. deviceBlockedFlag   — "device was blocked / not blocked"      → yes/no
 *   4. frmAlert            — "FRM system alert was (not) generated"  → yes/no
 */

// Each rule has:
//   field:   the form state key to populate
//   type:    'choice' (yes/no) or 'text' (extract a substring)
//   match:   regex to test if a sentence is relevant to this field
//   extract: function that returns the value to set
const FIELD_RULES = [
  {
    field: 'ioCallMade',
    type: 'choice',
    match: /\bcall\b.*\b(made|not\s+made|placed|not\s+placed)\b.*\bcustomer\b/i,
    extract: (sentence) => {
      // If sentence contains negation near "call" → no
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
      // Try to extract the substance after "stance was" / "stance:"
      const afterWas = sentence.match(/stance\s+(?:was|is|:)\s*(.+?)(?:\s+during\s+initial\s+call)?$/i);
      if (afterWas) {
        // Clean up and capitalize the first letter
        let value = afterWas[1].replace(/\s*during\s+initial\s+call\s*$/i, '').trim();
        return value.charAt(0).toUpperCase() + value.slice(1);
      }
      // Fallback: return everything after "stance"
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

/**
 * Parse raw activity log text and return a map of form field values.
 * 
 * @param {string} rawText - The raw text content from the uploaded file
 * @returns {{ matches: Array<{field: string, value: string, sentence: string, label: string}>, unmatchedLines: string[] }}
 */
export function parseActivityLog(rawText) {
  // Split by newlines, commas (CSV), or semicolons — each could be a separate log entry
  const lines = rawText
    .split(/[\n\r]+/)
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#')); // skip empty lines and comments

  const matches = [];
  const unmatchedLines = [];
  const matchedFields = new Set();

  // Human-readable labels for matched fields
  const fieldLabels = {
    ioCallMade: 'IO Call Made to Customer',
    initialCustomerStance: 'Customer Stance as per Initial Call',
    deviceBlockedFlag: 'Blocking of Observed Device',
    frmAlert: 'FRM System Alert',
  };

  for (const line of lines) {
    let matched = false;

    for (const rule of FIELD_RULES) {
      // Skip if this field was already matched (first match wins)
      if (matchedFields.has(rule.field)) continue;

      if (rule.match.test(line)) {
        const value = rule.extract(line);
        matches.push({
          field: rule.field,
          value,
          sentence: line,
          label: fieldLabels[rule.field] || rule.field,
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

/**
 * Convert parsed matches to a flat object suitable for merging into form state.
 * @param {Array} matches - The matches array from parseActivityLog
 * @returns {Object} - e.g. { ioCallMade: 'no', initialCustomerStance: '...' }
 */
export function matchesToFormState(matches) {
  const state = {};
  for (const m of matches) {
    state[m.field] = m.value;
  }
  return state;
}
