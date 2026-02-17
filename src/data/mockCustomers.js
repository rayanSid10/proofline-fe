/**
 * Mock customers with multi-account support.
 *
 * Structure: each customer has an `accounts[]` array.
 * Search can match on customer-level fields (name, cnic) or account-level
 * fields (account_number, card_number).
 */
export const mockCustomers = [
  {
    id: 1,
    name: 'Ahmed Khan',
    cnic: '4210112345678',
    city: 'Karachi',
    region: 'Sindh',
    mobile: '03001234567',
    email: 'ahmed.khan@email.com',
    accounts: [
      {
        id: 'ACC-001',
        account_number: '0012345678901',
        card_number: '4532015112830366',
        account_type: 'savings',
        account_status: 'active',
      },
      {
        id: 'ACC-002',
        account_number: '0012345679999',
        card_number: '4532015112831111',
        account_type: 'current',
        account_status: 'active',
      },
    ],
  },
  {
    id: 2,
    name: 'Sara Ahmed',
    cnic: '3520287654321',
    city: 'Lahore',
    region: 'Punjab',
    mobile: '03219876543',
    email: 'sara.ahmed@email.com',
    accounts: [
      {
        id: 'ACC-003',
        account_number: '0098765432101',
        card_number: '5425233430109903',
        account_type: 'current',
        account_status: 'active',
      },
      {
        id: 'ACC-004',
        account_number: '0098765400088',
        card_number: '5425233430102222',
        account_type: 'savings',
        account_status: 'active',
      },
    ],
  },
  {
    id: 3,
    name: 'Muhammad Usman',
    cnic: '3740511223344',
    city: 'Islamabad',
    region: 'Federal',
    mobile: '03331122334',
    email: 'usman.m@email.com',
    accounts: [
      {
        id: 'ACC-005',
        account_number: '0055667788990',
        card_number: '4716108999716531',
        account_type: 'savings',
        account_status: 'active',
      },
    ],
  },
  {
    id: 4,
    name: 'Ayesha Malik',
    cnic: '3110455667788',
    city: 'Faisalabad',
    region: 'Punjab',
    mobile: '03004455667',
    email: 'ayesha.malik@email.com',
    accounts: [
      {
        id: 'ACC-006',
        account_number: '0033445566778',
        card_number: '4539578763621486',
        account_type: 'savings',
        account_status: 'active',
      },
    ],
  },
];

/**
 * Generate mock transactions for a given account.
 * Returns different realistic transactions per account ID.
 */
export function getTransactionsForAccount(accountId) {
  const txnMap = {
    'ACC-001': [
      {
        id: 'TXN-001-1',
        transaction_id: 'TXN20250105001',
        transaction_date: '2025-01-05',
        transaction_time: '14:30',
        amount: 50000,
        beneficiary_account: '1122334455667',
        beneficiary_bank: 'HBL',
        beneficiary_name: 'Unknown Beneficiary',
        channel: 'MB',
        branch_name: '',
        branch_code: '',
        imei: 'DEV-12345',
      },
      {
        id: 'TXN-001-2',
        transaction_id: 'TXN20250110001',
        transaction_date: '2025-01-10',
        transaction_time: '16:45',
        amount: 75000,
        beneficiary_account: '1122334455667',
        beneficiary_bank: 'HBL',
        beneficiary_name: 'Unknown Beneficiary',
        channel: 'MB',
        branch_name: '',
        branch_code: '',
        imei: 'DEV-12345',
      },
      {
        id: 'TXN-001-3',
        transaction_id: 'TXN20250115001',
        transaction_date: '2025-01-15',
        transaction_time: '09:15',
        amount: 250000,
        beneficiary_account: '9988776655443',
        beneficiary_bank: 'MCB',
        beneficiary_name: 'Investment Co',
        channel: 'IB',
        branch_name: '',
        branch_code: '',
        imei: '',
      },
    ],
    'ACC-002': [
      {
        id: 'TXN-002-1',
        transaction_id: 'TXN20250112004',
        transaction_date: '2025-01-12',
        transaction_time: '11:20',
        amount: 120000,
        beneficiary_account: '4455667788001',
        beneficiary_bank: 'ABL',
        beneficiary_name: 'Trading Account',
        channel: 'IB',
        branch_name: '',
        branch_code: '',
        imei: '',
      },
      {
        id: 'TXN-002-2',
        transaction_id: 'TXN20250114005',
        transaction_date: '2025-01-14',
        transaction_time: '22:05',
        amount: 85000,
        beneficiary_account: '4455667788001',
        beneficiary_bank: 'ABL',
        beneficiary_name: 'Trading Account',
        channel: 'MB',
        branch_name: '',
        branch_code: '',
        imei: 'DEV-99887',
      },
    ],
    'ACC-003': [
      {
        id: 'TXN-003-1',
        transaction_id: 'TXN20250125001',
        transaction_date: '2025-01-25',
        transaction_time: '22:30',
        amount: 125000,
        beneficiary_account: '5566778899001',
        beneficiary_bank: 'UBL',
        beneficiary_name: 'M. Tariq',
        channel: 'IB',
        branch_name: '',
        branch_code: '',
        imei: '',
      },
    ],
    'ACC-004': [
      {
        id: 'TXN-004-1',
        transaction_id: 'TXN20250126002',
        transaction_date: '2025-01-26',
        transaction_time: '08:15',
        amount: 60000,
        beneficiary_account: '7788001122334',
        beneficiary_bank: 'Meezan',
        beneficiary_name: 'Freelancer Payment',
        channel: 'MB',
        branch_name: '',
        branch_code: '',
        imei: 'DEV-44556',
      },
      {
        id: 'TXN-004-2',
        transaction_id: 'TXN20250127003',
        transaction_date: '2025-01-27',
        transaction_time: '19:40',
        amount: 95000,
        beneficiary_account: '8899001122445',
        beneficiary_bank: 'BAFL',
        beneficiary_name: 'Online Purchase',
        channel: 'IB',
        branch_name: '',
        branch_code: '',
        imei: '',
      },
    ],
    'ACC-005': [
      {
        id: 'TXN-005-1',
        transaction_id: 'TXN20250118001',
        transaction_date: '2025-01-18',
        transaction_time: '03:15',
        amount: 500000,
        beneficiary_account: '7788990011223',
        beneficiary_bank: 'ABL',
        beneficiary_name: 'Crypto Trading',
        channel: 'MB',
        branch_name: '',
        branch_code: '',
        imei: 'DEV-FRAUD',
      },
      {
        id: 'TXN-005-2',
        transaction_id: 'TXN20250118002',
        transaction_date: '2025-01-18',
        transaction_time: '03:25',
        amount: 390000,
        beneficiary_account: '7788990011223',
        beneficiary_bank: 'ABL',
        beneficiary_name: 'Crypto Trading',
        channel: 'MB',
        branch_name: '',
        branch_code: '',
        imei: 'DEV-FRAUD',
      },
    ],
    'ACC-006': [
      {
        id: 'TXN-006-1',
        transaction_id: 'TXN20250112001',
        transaction_date: '2025-01-12',
        transaction_time: '11:20',
        amount: 45000,
        beneficiary_account: '3344556677889',
        beneficiary_bank: 'SCB',
        beneficiary_name: 'Online Store XYZ',
        channel: 'IB',
        branch_name: '',
        branch_code: '',
        imei: 'DEV-78901',
      },
    ],
  };

  return txnMap[accountId] || [];
}

/**
 * Search customers by query string.
 * Matches on customer-level fields (name, cnic) and account-level fields
 * (account_number, card_number).
 */
export function searchCustomers(query) {
  if (!query.trim()) return [];

  const q = query.trim().toLowerCase();

  return mockCustomers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(q) ||
      customer.cnic.includes(q) ||
      customer.accounts.some(
        (acc) =>
          acc.account_number.includes(q) ||
          acc.card_number?.includes(q)
      )
  );
}

export default mockCustomers;
