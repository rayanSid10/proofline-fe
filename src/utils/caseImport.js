const REQUIRED_COLUMNS = [
  'cnic',
  'customer_name',
  'customer_city',
  'account_number',
  'fraud_type',
  'case_received_date',
  'case_received_channel',
  'transaction_id',
  'transaction_amount',
  'transaction_date_time',
  'ftdh_id',
];

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += ch;
  }

  cells.push(current.trim());
  return cells;
}

function mapCaseChannel(channelRaw) {
  const value = String(channelRaw || '').trim().toLowerCase();

  if (value === 'branch') return 'branch';
  if (value === 'contact_center' || value === 'contact center' || value === 'call center') {
    return 'contact_center';
  }
  if (value === 'mobile_app' || value === 'mobile app') return 'mobile_app';
  if (value === 'email') return 'email';

  return null;
}

function mapFraudType(fraudRaw) {
  const value = String(fraudRaw || '').trim().toLowerCase();

  if (value.includes('scam') && value.includes('investment')) return 'scam_investment';
  if (value.includes('account takeover') || value === 'ato') return 'ato';
  if (value.includes('sim')) return 'sim_swap';
  if (value.includes('phishing')) return 'phishing';
  if (value.includes('social')) return 'social_engineering';

  return 'other';
}

function toDateAndTime(value) {
  const normalized = String(value || '').trim().replace('T', ' ');
  const [datePart, timePart] = normalized.split(' ');

  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(datePart || '');
  const validTime = /^\d{2}:\d{2}(:\d{2})?$/.test(timePart || '');

  if (!validDate || !validTime) {
    return { date: null, time: null };
  }

  const fullTime = timePart.length === 5 ? `${timePart}:00` : timePart;
  return { date: datePart, time: fullTime };
}

function parseNumericSuffix(referenceNumber) {
  const match = String(referenceNumber || '').match(/-(\d{6})$/);
  return match ? Number(match[1]) : null;
}

function buildReferenceNumber(year, sequence) {
  return `IBMB-${year}-${String(sequence).padStart(6, '0')}`;
}

export function parseCaseImportCsv(csvText) {
  const lines = String(csvText || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return {
      rows: [],
      errors: [{ row: 1, field: 'file', message: 'CSV must include header and at least one data row.' }],
      totalRows: 0,
    };
  }

  const headers = parseCsvLine(lines[0]);
  const headerMap = new Map(headers.map((h, idx) => [normalizeHeader(h), idx]));

  const missingColumns = REQUIRED_COLUMNS.filter((col) => !headerMap.has(col));
  if (missingColumns.length > 0) {
    return {
      rows: [],
      errors: [
        {
          row: 1,
          field: 'header',
          message: `Missing required columns: ${missingColumns.join(', ')}`,
        },
      ],
      totalRows: Math.max(lines.length - 1, 0),
    };
  }

  const parsedRows = [];
  const errors = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const rowNumber = lineIndex + 1;
    const cells = parseCsvLine(lines[lineIndex]);

    const valueOf = (key) => {
      const idx = headerMap.get(key);
      return idx === undefined ? '' : String(cells[idx] || '').trim();
    };

    const row = {
      cnic: valueOf('cnic'),
      customerName: valueOf('customer_name'),
      customerCity: valueOf('customer_city'),
      customerRegion: valueOf('customer_region') || 'N/A',
      customerMobile: valueOf('customer_mobile') || '',
      accountNumber: valueOf('account_number'),
      scenario: valueOf('scenario') || '',
      investigationOfficer: valueOf('investigation_officer') || '',
      branchCode: valueOf('branch_code') || '',
      customerReportedLate: (valueOf('customer_reported_late') || '').toLowerCase(),
      fraudType: mapFraudType(valueOf('fraud_type')),
      caseReceivedDate: valueOf('case_received_date'),
      caseReceivedChannel: mapCaseChannel(valueOf('case_received_channel')),
      transactionId: valueOf('transaction_id'),
      transactionAmount: Number(valueOf('transaction_amount')),
      transactionDateTime: valueOf('transaction_date_time'),
      stan: valueOf('stan') || '',
      beneficiaryAdded: (valueOf('beneficiary_added') || 'yes').toLowerCase(),
      ftdhId: valueOf('ftdh_id'),
      ftdhFilled: (valueOf('ftdh_filled') || '').toLowerCase(),
      fmsAlertGenerated: (valueOf('fms_alert_generated') || '').toLowerCase(),
      expectedRecoveryOnUs: valueOf('expected_recovery_onus') || '',
      expectedRecoveryMemberBank: valueOf('expected_recovery_member_bank') || '',
      transactionPeriod: valueOf('transaction_period') || '',
      dateIncidentOccurred: valueOf('date_incident_occurred') || '',
      disputedTransactionDetails: valueOf('disputed_transaction_details') || '',
      noOfTransactions: Number(valueOf('no_of_transactions') || 0),
      disputeAmountAtRisk: Number(valueOf('dispute_amount_at_risk') || 0),
      complaintNo: valueOf('complaint_no') || '',
      transactionChannel: (valueOf('transaction_channel') || 'MB').toUpperCase(),
      beneficiaryAccount: valueOf('beneficiary_account') || '',
      beneficiaryBank: valueOf('beneficiary_bank') || '',
      beneficiaryName: valueOf('beneficiary_name') || '',
    };

    if (!/^\d{13}$/.test(row.cnic)) {
      errors.push({ row: rowNumber, field: 'CNIC', message: 'CNIC must be 13 digits.' });
      continue;
    }

    if (!row.accountNumber) {
      errors.push({ row: rowNumber, field: 'Account_Number', message: 'Account number is required.' });
      continue;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.caseReceivedDate)) {
      errors.push({ row: rowNumber, field: 'Case_Received_Date', message: 'Use YYYY-MM-DD format.' });
      continue;
    }

    if (!row.caseReceivedChannel) {
      errors.push({ row: rowNumber, field: 'Case_Received_Channel', message: 'Unsupported channel value.' });
      continue;
    }

    if (!row.transactionId) {
      errors.push({ row: rowNumber, field: 'Transaction_ID', message: 'Transaction ID is required.' });
      continue;
    }

    if (!Number.isFinite(row.transactionAmount) || row.transactionAmount <= 0) {
      errors.push({ row: rowNumber, field: 'Transaction_Amount', message: 'Amount must be a positive number.' });
      continue;
    }

    const txDateTime = toDateAndTime(row.transactionDateTime);
    if (!txDateTime.date || !txDateTime.time) {
      errors.push({
        row: rowNumber,
        field: 'Transaction_Date_Time',
        message: 'Use YYYY-MM-DD HH:mm:ss (or HH:mm).',
      });
      continue;
    }

    parsedRows.push({
      ...row,
      transactionDate: txDateTime.date,
      transactionTime: txDateTime.time,
    });
  }

  return {
    rows: parsedRows,
    errors,
    totalRows: lines.length - 1,
  };
}

export function buildCasesFromImportRows(rows, existingCases = []) {
  const grouped = new Map();
  const existingTransactionIds = new Set();
  let maxCaseId = 0;
  let maxCustomerId = 0;
  let maxTransactionId = 0;
  let maxReferenceNumberSuffix = 0;
  const currentYear = new Date().getFullYear();

  existingCases.forEach((c) => {
    maxCaseId = Math.max(maxCaseId, Number(c?.id || 0));
    maxCustomerId = Math.max(maxCustomerId, Number(c?.customer?.id || 0));

    const refSuffix = parseNumericSuffix(c?.reference_number);
    if (c?.reference_number?.startsWith(`IBMB-${currentYear}-`) && Number.isFinite(refSuffix)) {
      maxReferenceNumberSuffix = Math.max(maxReferenceNumberSuffix, refSuffix);
    }

    (c?.transactions || []).forEach((t) => {
      maxTransactionId = Math.max(maxTransactionId, Number(t?.id || 0));
      if (t?.transaction_id) {
        existingTransactionIds.add(String(t.transaction_id).trim().toUpperCase());
      }
    });
  });

  let skipped = 0;

  rows.forEach((row) => {
    const txnIdNormalized = String(row.transactionId).trim().toUpperCase();
    if (existingTransactionIds.has(txnIdNormalized)) {
      skipped += 1;
      return;
    }

    existingTransactionIds.add(txnIdNormalized);

    const groupKey = [
      row.cnic,
      row.caseReceivedDate,
      row.caseReceivedChannel,
    ].join('|');

    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, {
        caseInfo: row,
        transactions: [],
      });
    }

    grouped.get(groupKey).transactions.push(row);
  });

  let sequence = maxReferenceNumberSuffix + 1;
  const importedCases = [];

  grouped.forEach((group) => {
    maxCaseId += 1;
    maxCustomerId += 1;

    const caseInfo = group.caseInfo;
    const referenceNumber = buildReferenceNumber(currentYear, sequence);
    sequence += 1;

    const transactions = group.transactions.map((tx) => {
      maxTransactionId += 1;

      return {
        id: maxTransactionId,
        transaction_id: tx.transactionId,
        stan: tx.stan || '',
        transaction_date: tx.transactionDate,
        transaction_time: tx.transactionTime,
        amount: tx.transactionAmount,
        disputed_amount: tx.transactionAmount,
        beneficiary_account: tx.beneficiaryAccount || 'N/A',
        beneficiary_bank: tx.beneficiaryBank || 'N/A',
        beneficiary_name: tx.beneficiaryName || '',
        beneficiary_added: tx.beneficiaryAdded || 'yes',
        channel: tx.transactionChannel || 'MB',
        ip_address: null,
        device_id: '',
      };
    });

    const totalDisputedAmount = transactions.reduce((sum, t) => sum + Number(t.disputed_amount || 0), 0);

    importedCases.push({
      id: maxCaseId,
      reference_number: referenceNumber,
      customer: {
        id: maxCustomerId,
        name: caseInfo.customerName,
        cnic: caseInfo.cnic,
        account_number: caseInfo.accountNumber,
        card_number: '',
        city: caseInfo.customerCity,
        region: caseInfo.customerRegion,
        mobile: caseInfo.customerMobile,
      },
      status: 'open',
      investigation_status: 'in_progress',
      scenario: caseInfo.scenario || 'Scenario Custom',
      investigation_officer: caseInfo.investigationOfficer || 'Ali Raza',
      branch_code: caseInfo.branchCode || String(caseInfo.accountNumber || '').slice(0, 4) || 'N/A',
      case_receiving_channel: caseInfo.caseReceivedChannel,
      dispute_channel: caseInfo.caseReceivedChannel,
      customer_reported_late: caseInfo.customerReportedLate || 'yes',
      channel: caseInfo.caseReceivedChannel,
      fraud_type: caseInfo.fraudType,
      fms_alert_generated: caseInfo.fmsAlertGenerated || 'no',
      expected_recovery_onus: caseInfo.expectedRecoveryOnUs || 'NIL',
      expected_recovery_member_bank: caseInfo.expectedRecoveryMemberBank || 'NIL',
      date_incident_occurred: caseInfo.dateIncidentOccurred || caseInfo.caseReceivedDate,
      transaction_period: caseInfo.transactionPeriod || caseInfo.caseReceivedDate?.slice(0, 7) || '',
      disputed_transaction_details:
        caseInfo.disputedTransactionDetails || `${caseInfo.caseReceivedDate} (${transactions.length} Transactions)`,
      no_of_transactions: caseInfo.noOfTransactions || transactions.length,
      dispute_amount_at_risk: caseInfo.disputeAmountAtRisk || totalDisputedAmount,
      complaint_number: caseInfo.complaintNo,
      case_received_date: caseInfo.caseReceivedDate,
      created_at: new Date().toISOString(),
      total_disputed_amount: totalDisputedAmount,
      assigned_to: { id: 2, name: 'Ali Raza' },
      created_by: { id: 1, name: 'Import User' },
      transactions,
      actions: [],
      ftdh_id: caseInfo.ftdhId,
      ftdh_filled: caseInfo.ftdhFilled || (caseInfo.ftdhId ? 'yes' : 'no'),
      imported_from_csv: true,
    });
  });

  return {
    importedCases,
    skipped,
  };
}
