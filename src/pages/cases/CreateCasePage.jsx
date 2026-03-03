import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Check,
  User,
  FileText,
  CreditCard,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { DataMasker } from '@/components/shared/DataMasker';
import { ManualTransactionModal } from '@/components/forms/ManualTransactionModal';
import { cn } from '@/lib/utils';
import { searchCustomers, getTransactionsForAccount } from '@/data/mockCustomers';
import { fraudTypes } from '@/data/mockCases';
import { addImportedCases, assignNextInvestigator, getAllCases, upsertCase } from '@/data/caseStorage';

const steps = [
  { id: 1, title: 'Select Transactions', icon: CreditCard },
  { id: 2, title: 'Case Details', icon: FileText },
  // { id: 3, title: 'Review & Submit', icon: ClipboardList }, // kept for future use
];

const caseReceivedChannelOptions = [
  { value: 'Customer Experience (CX)', label: 'Customer Experience (CX)' },
  { value: 'Complaint Resolution Unit (CRU)', label: 'Complaint Resolution Unit (CRU)' },
  { value: 'Dispute Resolution Unit (DRU)', label: 'Dispute Resolution Unit (DRU)' },
  { value: 'Detection Unit - FRMU', label: 'Detection Unit - FRMU' },
  { value: 'Retail Banking / Business', label: 'Retail Banking / Business' },
  { value: 'LEA / BMP / Regulator', label: 'LEA / BMP / Regulator' },
  { value: 'Human Resource', label: 'Human Resource' },
  { value: 'Whistle Blow', label: 'Whistle Blow' },
];

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function maskAccountNumber(num) {
  if (!num) return '**** **** ****';
  const clean = String(num);
  if (clean.length <= 4) return clean;
  return `**** **** ${clean.slice(-4)}`;
}

function normalizeToArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
              currentStep > step.id
                ? 'bg-primary border-primary text-primary-foreground'
                : currentStep === step.id
                ? 'border-primary text-primary'
                : 'border-muted-foreground/30 text-muted-foreground'
            )}
          >
            {currentStep > step.id ? (
              <Check className="h-5 w-5" />
            ) : (
              <step.icon className="h-5 w-5" />
            )}
          </div>
          <span
            className={cn(
              'ml-2 text-sm font-medium hidden sm:inline',
              currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {step.title}
          </span>
          {index < steps.length - 1 && (
            <div
              className={cn(
                'w-12 h-0.5 mx-4',
                currentStep > step.id ? 'bg-primary' : 'bg-muted-foreground/30'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Account Accordion Section ───────────────────────────────────────────────

function AccountTransactionSection({
  account,
  transactions,
  selectedTransactionIds,
  onToggleTransaction,
  onToggleAll,
  defaultExpanded = false,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const accountSelected = transactions.filter((t) =>
    selectedTransactionIds.includes(t.id)
  );
  const allSelected = transactions.length > 0 && accountSelected.length === transactions.length;

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors',
          expanded && 'border-b bg-muted/30'
        )}
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">
                <DataMasker value={account.account_number} type="account" />
              </span>
              <Badge variant="outline" className="text-xs">
                {account.account_type}
              </Badge>
              {account.account_status !== 'active' && (
                <Badge variant="destructive" className="text-xs">
                  {account.account_status}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} found
              {accountSelected.length > 0 && (
                <span className="text-primary font-medium">
                  {' '}· {accountSelected.length} selected
                </span>
              )}
            </p>
          </div>
        </div>
      </button>

      {/* Transactions Table */}
      {expanded && (
        <div className="p-4">
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No transactions found for this account.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={() => onToggleAll(account.id, transactions)}
                      />
                    </TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>STAN</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Beneficiary Added</TableHead>
                    <TableHead>Beneficiary</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedTransactionIds.includes(txn.id)}
                          onCheckedChange={() => onToggleTransaction(txn.id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {txn.transaction_id}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {txn.stan || '—'}
                      </TableCell>
                      <TableCell>
                        {txn.transaction_date} {txn.transaction_time?.slice(0, 5)}
                      </TableCell>
                      <TableCell>{txn.channel}</TableCell>
                      <TableCell>{String(txn.beneficiary_added || '—').toUpperCase()}</TableCell>
                      <TableCell>
                        <DataMasker value={txn.beneficiary_account} type="account" />
                        <span className="text-sm text-muted-foreground ml-1">
                          ({txn.beneficiary_bank})
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(txn.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function CreateCasePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editCaseId = id ? parseInt(id, 10) : null;
  const isEditMode = Number.isFinite(editCaseId);
  const caseToEdit = isEditMode
    ? getAllCases().find((c) => Number(c.id) === editCaseId)
    : null;
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Customer Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [foundAccounts, setFoundAccounts] = useState([]);
  const [selectedFoundAccountIds, setSelectedFoundAccountIds] = useState({});
  const [expandedFoundAccountId, setExpandedFoundAccountId] = useState(null);
  const [dateRanges, setDateRanges] = useState({});
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const dateInputRefs = useRef({});
  const caseReceivedDateRef = useRef(null);

  // Step 2: Transactions (multi-account)
  const [accountTransactions, setAccountTransactions] = useState({});
  // Maps accountId → transactions[]
  const [selectedTransactionIds, setSelectedTransactionIds] = useState([]);
  const [step2VisibleTransactionIds, setStep2VisibleTransactionIds] = useState([]);
  const [manualTransactions, setManualTransactions] = useState([]);
  const [selectedManualTransactionIds, setSelectedManualTransactionIds] = useState([]);
  const [transactionFtdhIds, setTransactionFtdhIds] = useState({});
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [editingManualTxn, setEditingManualTxn] = useState(null);

  // Step 3: Case Details
  const [caseDetails, setCaseDetails] = useState({
    scenario: '',
    referenceNumber: '',
    investigationOfficer: '',
    complaintNo: '',
    caseReceivingChannel: '',
    caseReceivedChannel: [],
    caseReceivedDate: format(new Date(), 'yyyy-MM-dd'),
    branchCode: '',
    customerReportedLate: '',
    channel: '',
    fraudType: '',
    fmsAlertGenerated: '',
    expectedRecoveryOnUs: '',
    expectedRecoveryMemberBank: '',
    dateIncidentOccurred: '',
    transactionPeriod: '',
    disputedTransactionDetails: '',
    noOfTransactions: '',
    disputeAmountAtRisk: '',
    ftdhFilled: '',
    ftdhId: '',
    notes: '',
  });

  useEffect(() => {
    if (!isEditMode) return;

    const currentCase = getAllCases().find((c) => Number(c.id) === editCaseId);
    if (!currentCase) return;

    const query = String(currentCase.customer?.cnic || currentCase.customer?.account_number || '').trim();
    const matchedCustomers = query
      ? searchCustomers(query).filter(
          (customer) =>
            customer.cnic === query ||
            customer.accounts.some((account) => account.account_number === query)
        )
      : [];

    const fallbackAccountId = `edit-${currentCase.id}`;
    const fallbackCustomer = {
      ...currentCase.customer,
      accounts: [
        {
          id: fallbackAccountId,
          account_number: currentCase.customer?.account_number || '',
          account_type: 'current',
          account_status: 'active',
        },
      ],
    };

    const selectedCustomerForEdit = matchedCustomers[0] || fallbackCustomer;
    const accountsForEdit =
      (selectedCustomerForEdit.accounts || []).map((account) => ({
        ...account,
        customer: selectedCustomerForEdit,
      })) || [];

    const fetchedTransactionsByAccount = {};
    accountsForEdit.forEach((account) => {
      fetchedTransactionsByAccount[account.id] = getTransactionsForAccount(account.id) || [];
    });

    const existingTransactions = currentCase.transactions || [];
    const primaryAccountId = accountsForEdit[0]?.id;

    if (primaryAccountId) {
      const existingKeySet = new Set(
        (fetchedTransactionsByAccount[primaryAccountId] || []).map(
          (txn) => `${String(txn.id)}::${String(txn.transaction_id || '')}`
        )
      );

      const missingCaseTransactions = existingTransactions.filter((txn) => {
        const key = `${String(txn.id)}::${String(txn.transaction_id || '')}`;
        return !existingKeySet.has(key);
      });

      if (missingCaseTransactions.length > 0) {
        fetchedTransactionsByAccount[primaryAccountId] = [
          ...(fetchedTransactionsByAccount[primaryAccountId] || []),
          ...missingCaseTransactions,
        ];
      }
    }

    const fetchedTxnIds = new Set(
      Object.values(fetchedTransactionsByAccount)
        .flat()
        .map((txn) => txn.id)
    );
    const allFetchedTransactions = Object.values(fetchedTransactionsByAccount).flat();
    const matchedSystemTransactions = [];
    const manualOnlyTransactions = [];

    existingTransactions.forEach((existingTxn) => {
      const match = allFetchedTransactions.find((fetchedTxn) => {
        if (fetchedTxn.id === existingTxn.id) return true;
        if (String(fetchedTxn.id) === String(existingTxn.id)) return true;
        if (
          existingTxn.transaction_id &&
          fetchedTxn.transaction_id &&
          existingTxn.transaction_id === fetchedTxn.transaction_id
        ) {
          return true;
        }
        return false;
      });

      if (match) {
        matchedSystemTransactions.push(match);
      } else {
        manualOnlyTransactions.push(existingTxn);
      }
    });

    const selectedSystemIds = [...new Set(matchedSystemTransactions.map((txn) => txn.id))];
    const selectedManualIds = manualOnlyTransactions.map((txn) => txn.id);
    const perTxnFtdhIds = existingTransactions.reduce((acc, txn) => {
      if (txn?.id != null) {
        acc[txn.id] = txn.ftdh_id || '';
      }
      return acc;
    }, {});

    const selectedMap = Object.fromEntries(
      accountsForEdit.map((acc) => {
        const accountTxns = fetchedTransactionsByAccount[acc.id] || [];
        const hasSelectedTxn = accountTxns.some((txn) => selectedSystemIds.includes(txn.id));
        return [acc.id, hasSelectedTxn];
      })
    );
    const selectedSystemIdSet = new Set(selectedSystemIds.map((id) => String(id)));
    const prefilledDateRanges = {};

    accountsForEdit.forEach((account) => {
      const accountTxns = fetchedTransactionsByAccount[account.id] || [];
      const selectedDates = accountTxns
        .filter((txn) => selectedSystemIdSet.has(String(txn.id)))
        .map((txn) => txn.transaction_date)
        .filter(Boolean)
        .sort();

      if (selectedDates.length > 0) {
        prefilledDateRanges[account.id] = {
          dateFrom: selectedDates[0],
          dateTo: selectedDates[selectedDates.length - 1],
        };
      } else if (accountsForEdit.length === 1) {
        const existingTxnDates = existingTransactions
          .map((txn) => txn.transaction_date)
          .filter(Boolean)
          .sort();

        if (existingTxnDates.length > 0) {
          prefilledDateRanges[account.id] = {
            dateFrom: existingTxnDates[0],
            dateTo: existingTxnDates[existingTxnDates.length - 1],
          };
        }
      }
    });

    setSearchQuery(query);
    setSearchResults(matchedCustomers);
    setHasSearched(accountsForEdit.length > 0);
    setFoundAccounts(accountsForEdit);
    setSelectedFoundAccountIds(selectedMap);
    setExpandedFoundAccountId(
      accountsForEdit.find((acc) => selectedMap[acc.id])?.id || accountsForEdit[0]?.id || null
    );
    setSelectedCustomer(selectedCustomerForEdit);
    setAccountTransactions(fetchedTransactionsByAccount);
    setDateRanges(prefilledDateRanges);

    setSelectedTransactionIds(selectedSystemIds);
    setStep2VisibleTransactionIds(selectedSystemIds);
    setManualTransactions(manualOnlyTransactions);
    setSelectedManualTransactionIds(selectedManualIds);
    setTransactionFtdhIds(perTxnFtdhIds);

    const validReceivedChannelValues = new Set(caseReceivedChannelOptions.map((o) => o.value));
    const parsedCaseReceivingChannels = String(currentCase.case_receiving_channel || currentCase.channel || '')
      .split(',')
      .map((s) => s.trim())
      .filter((value) => value && validReceivedChannelValues.has(value));

    setCaseDetails((prev) => ({
      ...prev,
      referenceNumber: currentCase.reference_number || prev.referenceNumber,
      complaintNo: currentCase.complaint_number || prev.complaintNo,
      caseReceivedChannel: parsedCaseReceivingChannels,
      caseReceivingChannel: parsedCaseReceivingChannels.join(', '),
      caseReceivedDate: currentCase.case_received_date || prev.caseReceivedDate,
      fraudType: currentCase.fraud_type || prev.fraudType,
      branchCode: currentCase.branch_code || prev.branchCode,
      expectedRecoveryOnUs: currentCase.expected_recovery_onus || prev.expectedRecoveryOnUs,
      expectedRecoveryMemberBank:
        currentCase.expected_recovery_member_bank || prev.expectedRecoveryMemberBank,
      disputeAmountAtRisk: String(currentCase.total_disputed_amount || prev.disputeAmountAtRisk || ''),
      noOfTransactions: String(existingTransactions.length || prev.noOfTransactions || ''),
    }));

    setCurrentStep(1);
  }, [isEditMode, editCaseId]);

  // ─── Search Logic ─────────────────────────────────────────────────────

  const handleSearch = () => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      setFoundAccounts([]);
      setSelectedFoundAccountIds({});
      setExpandedFoundAccountId(null);
      setHasSearched(false);
      return;
    }

    const results = searchCustomers(query).filter(
      (customer) =>
        customer.cnic === query ||
        customer.accounts.some((account) => account.account_number === query)
    );
    const accounts = results.flatMap((customer) =>
      customer.accounts.map((account) => ({
        ...account,
        customer,
      }))
    );

    setSearchResults(results);
    setFoundAccounts(accounts);
    setHasSearched(true);

    // Reset selection context on every fresh search
    setSelectedTransactionIds([]);
    setManualTransactions([]);
    setAccountTransactions({});
    setDateRanges({});

    if (accounts.length > 0) {
      const first = accounts[0];
      setSelectedFoundAccountIds({ [first.id]: true });
      setExpandedFoundAccountId(first.id);
      setSelectedCustomer(first.customer);
      setAccountTransactions({ [first.id]: getTransactionsForAccount(first.id) });
    } else {
      setSelectedFoundAccountIds({});
      setExpandedFoundAccountId(null);
      setSelectedCustomer(null);
    }
  };

  const handleToggleFoundAccount = (account, checked) => {
    const accountId = account.id;

    setSelectedFoundAccountIds((prev) => ({
      ...prev,
      [accountId]: Boolean(checked),
    }));

    if (checked) {
      setSelectedCustomer(account.customer);
      setExpandedFoundAccountId(accountId);
      setAccountTransactions((prev) => {
        if (prev[accountId]) return prev;
        return {
          ...prev,
          [accountId]: getTransactionsForAccount(accountId),
        };
      });
      return;
    }

    const accountTxnIds = (accountTransactions[accountId] || []).map((t) => t.id);
    setSelectedTransactionIds((prev) => prev.filter((id) => !accountTxnIds.includes(id)));

    const selectedAfter = Object.entries({ ...selectedFoundAccountIds, [accountId]: false })
      .filter(([, isSelected]) => isSelected)
      .map(([id]) => id);

    if (selectedAfter.length === 0) {
      setSelectedCustomer(null);
    }
  };

  const handleDateRangeChange = (accountId, field, value) => {
    setDateRanges((prev) => ({
      ...prev,
      [accountId]: {
        ...prev[accountId],
        [field]: value,
      },
    }));
  };

  const openDatePicker = (accountId, field) => {
    const refKey = `${accountId}-${field}`;
    const input = dateInputRefs.current[refKey];
    if (!input) return;
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    } else {
      input.focus();
      input.click();
    }
  };

  const openCaseReceivedDatePicker = () => {
    const input = caseReceivedDateRef.current;
    if (!input) return;
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    } else {
      input.focus();
      input.click();
    }
  };

  const getFilteredTransactions = (accountId) => {
    const txns = accountTransactions[accountId] || [];
    const dateFrom = dateRanges[accountId]?.dateFrom;
    const dateTo = dateRanges[accountId]?.dateTo;

    if (!dateFrom && !dateTo) return txns;

    return txns.filter((t) => {
      const d = t.transaction_date;
      if (!d) return false;
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
    });
  };

  const handleProceedFromDataFound = () => {
    const selectedAccountIds = Object.entries(selectedFoundAccountIds)
      .filter(([, checked]) => checked)
      .map(([id]) => id);

    if (selectedAccountIds.length === 0) {
      toast.error('Select at least one account');
      return;
    }

    const missingDates = selectedAccountIds.some((accId) => {
      const range = dateRanges[accId] || {};
      return !range.dateFrom || !range.dateTo;
    });

    if (missingDates) {
      toast.error('Please select Date From and Date To for selected account(s)');
      return;
    }

    if (selectedTransactionIds.length === 0) {
      toast.error('Select at least one transaction');
      return;
    }

    const derivedReference = `REF-IBMB-${String(selectedCustomer?.id || 1).padStart(3, '0')}`;
    const derivedComplaint = `CMP-${new Date().getFullYear()}-${String((selectedCustomer?.id || 0) + 987).padStart(5, '0')}`;

    setCaseDetails((prev) => ({
      ...prev,
      referenceNumber: prev.referenceNumber || derivedReference,
      complaintNo: prev.complaintNo || derivedComplaint,
      caseReceivedChannel:
        normalizeToArray(prev.caseReceivedChannel).length > 0
          ? normalizeToArray(prev.caseReceivedChannel)
          : normalizeToArray(prev.caseReceivingChannel),
      noOfTransactions: prev.noOfTransactions || String(selectedTransactionIds.length),
      disputeAmountAtRisk:
        prev.disputeAmountAtRisk ||
        String(
          allAccountTxns
            .filter((t) => selectedTransactionIds.includes(t.id))
            .reduce((sum, t) => sum + (t.disputed_amount || t.amount || 0), 0)
        ),
    }));

      setStep2VisibleTransactionIds([...selectedTransactionIds]);
    setCurrentStep(2);
  };

  // ─── Transaction Selection Helpers ────────────────────────────────────

  const handleToggleTransaction = (txnId) => {
    setSelectedTransactionIds((prev) =>
      prev.includes(txnId)
        ? prev.filter((id) => id !== txnId)
        : [...prev, txnId]
    );
  };

  const handleToggleAll = (accountId, transactions) => {
    const txnIds = transactions.map((t) => t.id);
    const allSelected = txnIds.every((id) => selectedTransactionIds.includes(id));

    if (allSelected) {
      setSelectedTransactionIds((prev) => prev.filter((id) => !txnIds.includes(id)));
    } else {
      setSelectedTransactionIds((prev) => [...new Set([...prev, ...txnIds])]);
    }
  };

  // ─── Manual Transaction Helpers ───────────────────────────────────────

  const handleSaveManualTransaction = (txn) => {
    if (editingManualTxn) {
      setManualTransactions((prev) =>
        prev.map((t) => (t.id === txn.id ? txn : t))
      );
      setEditingManualTxn(null);
      setSelectedManualTransactionIds((prev) =>
        prev.includes(txn.id) ? prev : [...prev, txn.id]
      );
    } else {
      setManualTransactions((prev) => [...prev, txn]);
      setSelectedManualTransactionIds((prev) => [...prev, txn.id]);
    }
  };

  const handleEditManualTransaction = (txn) => {
    setEditingManualTxn(txn);
    setManualModalOpen(true);
  };

  const handleDeleteManualTransaction = (txnId) => {
    setManualTransactions((prev) => prev.filter((t) => t.id !== txnId));
    setSelectedManualTransactionIds((prev) => prev.filter((id) => id !== txnId));
  };

  const handleToggleManualTransaction = (txnId) => {
    setSelectedManualTransactionIds((prev) =>
      prev.includes(txnId) ? prev.filter((id) => id !== txnId) : [...prev, txnId]
    );
  };

  const handleToggleAllManualForAccount = (txns) => {
    const ids = txns.map((t) => t.id);
    const allSelected = ids.every((id) => selectedManualTransactionIds.includes(id));
    if (allSelected) {
      setSelectedManualTransactionIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedManualTransactionIds((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  // ─── Computed Values ──────────────────────────────────────────────────

  // All account transactions flat
  const allAccountTxns = Object.values(accountTransactions).flat();

  // Selected system transactions
  const selectedSystemTxns = allAccountTxns.filter((t) =>
    selectedTransactionIds.includes(t.id)
  );

  // All selected (system + manual)
  const selectedManualTxns = manualTransactions.filter((t) =>
    selectedManualTransactionIds.includes(t.id)
  );
  const allSelectedTxns = [...selectedSystemTxns, ...selectedManualTxns];

  // Count unique accounts that have selected transactions
  const selectedAccountIds = new Set();
  if (selectedCustomer) {
    selectedCustomer.accounts.forEach((acc) => {
      const accTxnIds = (accountTransactions[acc.id] || []).map((t) => t.id);
      if (accTxnIds.some((id) => selectedTransactionIds.includes(id))) {
        selectedAccountIds.add(acc.id);
      }
    });
  }

  const totalDisputedAmount = allSelectedTxns.reduce(
    (sum, t) => sum + (t.disputed_amount || t.amount),
    0
  );

  const canProceedToStep3 = allSelectedTxns.length > 0;
  const canProceedToStep4 =
    caseDetails.complaintNo &&
    normalizeToArray(caseDetails.caseReceivedChannel).length > 0 &&
    caseDetails.caseReceivedDate &&
    allSelectedTxns.length > 0;

  const selectedReceivedChannels = normalizeToArray(caseDetails.caseReceivedChannel);
  const selectedReceivedChannelLabels = selectedReceivedChannels.map((value) => {
    const option = caseReceivedChannelOptions.find((ch) => ch.value === value);
    return option?.label || value;
  });

  const selectedFoundAccounts = foundAccounts.filter((acc) => selectedFoundAccountIds[acc.id]);

  // ─── Submit ───────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const allCases = getAllCases();
      const nextId = allCases.reduce((maxId, c) => Math.max(maxId, Number(c?.id) || 0), 0) + 1;
      const year = new Date().getFullYear();
      const referenceNumber = isEditMode
        ? (caseToEdit?.reference_number || `IBMB-${year}-${String(editCaseId).padStart(6, '0')}`)
        : `IBMB-${year}-${String(nextId).padStart(6, '0')}`;

      const txnsToSave = allSelectedTxns.map((txn, idx) => ({
        id: txn.id || `MANUAL-${Date.now()}-${idx}`,
        transaction_id: txn.transaction_id,
        stan: txn.stan || '',
        transaction_date: txn.transaction_date,
        transaction_time: txn.transaction_time || '',
        amount: Number(txn.amount || 0),
        disputed_amount: Number(txn.disputed_amount || txn.amount || 0),
        beneficiary_account: txn.beneficiary_account || '',
        beneficiary_bank: txn.beneficiary_bank || '',
        beneficiary_name: txn.beneficiary_name || '',
        channel: txn.channel || 'IB',
        ip_address: txn.ip_address || '',
        device_id: txn.device_id || txn.imei || '',
        ftdh_id: transactionFtdhIds[txn.id] ?? txn.ftdh_id ?? '',
      }));

      const createdCase = {
        id: isEditMode ? editCaseId : nextId,
        reference_number: referenceNumber,
        customer: {
          id: selectedCustomer?.id ?? null,
          name: selectedCustomer?.name || 'Unknown Customer',
          cnic: selectedCustomer?.cnic || '',
          account_number: selectedFoundAccounts[0]?.account_number || selectedCustomer?.accounts?.[0]?.account_number || '',
          card_number: selectedCustomer?.card_number || '',
          city: selectedCustomer?.city || 'N/A',
          region: selectedCustomer?.region || 'N/A',
          mobile: selectedCustomer?.mobile || '',
        },
        status: caseToEdit?.status || 'open',
        investigation_status: caseToEdit?.investigation_status || 'in_progress',
        channel: selectedReceivedChannels[0] || 'other',
        case_receiving_channel: selectedReceivedChannels.join(', '),
        fraud_type: caseDetails.fraudType || 'other',
        complaint_number: caseDetails.complaintNo,
        total_disputed_amount: totalDisputedAmount,
        created_at: caseToEdit?.created_at || new Date().toISOString(),
        assigned_to: isEditMode ? caseToEdit?.assigned_to : assignNextInvestigator(),
        created_by: caseToEdit?.created_by,
        case_received_date: caseDetails.caseReceivedDate,
        transactions: txnsToSave,
        actions: caseToEdit?.actions || [],
      };

      if (isEditMode) {
        upsertCase(createdCase);
        toast.success('Case updated successfully', {
          description: `Reference: ${referenceNumber}`,
        });
        navigate(`/cases/${editCaseId}`);
      } else {
        addImportedCases([createdCase]);
        toast.success('Case created successfully', {
          description: `Reference: ${referenceNumber}${createdCase.assigned_to?.name ? ` • Assigned to ${createdCase.assigned_to.name}` : ''}`,
        });
        navigate('/cases');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/cases">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{isEditMode ? 'Update Case' : 'Create New Case'}</h2>
          <p className="text-muted-foreground">
            {isEditMode ? 'Edit case details and disputed transactions' : 'File a new IB/MB fraud dispute case'}
          </p>
        </div>
      </div>

      <StepIndicator currentStep={currentStep} />

      {/* ═══════════════════ Step 1: Customer Search ═════════════════════ */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Transactions</CardTitle>
            <CardDescription>
              Search by exact Account Number or CNIC, then select date range and transactions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Enter Account / CNIC / Card Number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="border-[#dae1e7]"
                />
              </div>
              <Button onClick={handleSearch} className="bg-[#2064b7] hover:bg-[#1b56a0] text-white">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>

            {foundAccounts.length > 0 && (
              <div className="w-full rounded-lg border border-[#dae1e7] bg-white p-3">
                <div className="space-y-1 text-center">
                  <h3 className="text-2xl font-semibold text-[#4c4c4c]">
                    {foundAccounts.length === 1 ? 'One Account Found' : `${foundAccounts.length} accounts found`}
                  </h3>
                  {foundAccounts.length === 1 && (
                    <p className="text-[28px] leading-none text-[#afafaf]">{maskAccountNumber(foundAccounts[0].account_number)}</p>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  {foundAccounts.map((account, index) => {
                    const isSelected = !!selectedFoundAccountIds[account.id];
                    const isExpanded = expandedFoundAccountId === account.id;
                    const filteredTxns = getFilteredTransactions(account.id);
                    const selectedFilteredCount = filteredTxns.filter((txn) => selectedTransactionIds.includes(txn.id)).length;
                    const allFilteredSelected = filteredTxns.length > 0 && selectedFilteredCount === filteredTxns.length;

                    return (
                      <div key={account.id} className="rounded-md border border-[#dae1e7] overflow-hidden">
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 bg-[#f9fafb] px-3 py-2 text-left"
                          onClick={() => setExpandedFoundAccountId(isExpanded ? null : account.id)}
                        >
                          {foundAccounts.length > 1 && (
                            <span className="w-4 text-lg font-semibold text-[#4c4c4c]">{index + 1}</span>
                          )}
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleToggleFoundAccount(account, checked)}
                            onClick={(e) => e.stopPropagation()}
                            className="border-[#1e8fff] data-[state=checked]:bg-[#1e8fff] data-[state=checked]:border-[#1e8fff]"
                          />
                          <span className="flex-1 text-lg text-[#afafaf]">{maskAccountNumber(account.account_number)}</span>
                          {isExpanded ? <ChevronDown className="h-4 w-4 text-[#afafaf]" /> : <ChevronRight className="h-4 w-4 text-[#afafaf]" />}
                        </button>

                        {isExpanded && isSelected && (
                          <div className="space-y-3 bg-white p-2.5">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              <div className="space-y-1">
                                <Label className="text-sm font-medium text-[#4c4c4c]">
                                  Date From<span className="text-[#c22e1f]">*</span>
                                </Label>
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => openDatePicker(account.id, 'dateFrom')}
                                    className="absolute left-2.5 top-1/2 z-10 -translate-y-1/2 text-[#afafaf]"
                                  >
                                    <Calendar className="h-4 w-4" />
                                  </button>
                                  <Input
                                    ref={(el) => {
                                      dateInputRefs.current[`${account.id}-dateFrom`] = el;
                                    }}
                                    type="date"
                                    value={dateRanges[account.id]?.dateFrom || ''}
                                    onChange={(e) => handleDateRangeChange(account.id, 'dateFrom', e.target.value)}
                                    className="border-[#dae1e7] bg-[#f9fafb] pl-9 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:pointer-events-none"
                                    style={{ WebkitAppearance: 'none', appearance: 'none' }}
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-sm font-medium text-[#4c4c4c]">
                                  Date To<span className="text-[#c22e1f]">*</span>
                                </Label>
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => openDatePicker(account.id, 'dateTo')}
                                    className="absolute left-2.5 top-1/2 z-10 -translate-y-1/2 text-[#afafaf]"
                                  >
                                    <Calendar className="h-4 w-4" />
                                  </button>
                                  <Input
                                    ref={(el) => {
                                      dateInputRefs.current[`${account.id}-dateTo`] = el;
                                    }}
                                    type="date"
                                    value={dateRanges[account.id]?.dateTo || ''}
                                    onChange={(e) => handleDateRangeChange(account.id, 'dateTo', e.target.value)}
                                    className="border-[#dae1e7] bg-[#f9fafb] pl-9 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:pointer-events-none"
                                    style={{ WebkitAppearance: 'none', appearance: 'none' }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="overflow-hidden rounded-md border border-[#dae1e7]">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-[#edf1f4] hover:bg-[#edf1f4]">
                                    <TableHead className="w-10">
                                      <Checkbox
                                        checked={allFilteredSelected}
                                        onCheckedChange={() => handleToggleAll(account.id, filteredTxns)}
                                        className="border-[#1e8fff] data-[state=checked]:bg-[#1e8fff] data-[state=checked]:border-[#1e8fff]"
                                        aria-label="Select all transactions for account"
                                      />
                                    </TableHead>
                                    <TableHead className="text-[11px] text-[#4c4c4c]">Transaction ID</TableHead>
                                    <TableHead className="text-[11px] text-[#4c4c4c]">Branch</TableHead>
                                    <TableHead className="text-[11px] text-[#4c4c4c]">Amount</TableHead>
                                    <TableHead className="text-[11px] text-[#4c4c4c]">Beneficiary</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {filteredTxns.length === 0 ? (
                                    <TableRow>
                                      <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                                        No transactions in selected date range.
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    filteredTxns.map((txn) => (
                                      <TableRow key={txn.id}>
                                        <TableCell>
                                          <Checkbox
                                            checked={selectedTransactionIds.includes(txn.id)}
                                            onCheckedChange={() => handleToggleTransaction(txn.id)}
                                            className="border-[#1e8fff] data-[state=checked]:bg-[#1e8fff] data-[state=checked]:border-[#1e8fff]"
                                          />
                                        </TableCell>
                                        <TableCell className="text-xs font-medium">{txn.transaction_id}</TableCell>
                                        <TableCell className="text-xs">
                                          <div>{txn.branch_name || '—'}</div>
                                          <div className="text-[10px] text-muted-foreground">{txn.branch_code || '—'}</div>
                                        </TableCell>
                                        <TableCell className="text-xs font-medium text-[#1e8fff]">
                                          {formatCurrency(txn.amount)}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                          <div>{txn.beneficiary_bank || '—'}</div>
                                          <div className="text-[10px] text-muted-foreground">
                                            <DataMasker value={txn.beneficiary_account} type="account" />
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex justify-center">
                  <Button
                    className="h-10 min-w-[170px] rounded-full bg-[#2064b7] px-8 text-white hover:bg-[#1b56a0]"
                    onClick={handleProceedFromDataFound}
                  >
                    Proceed
                  </Button>
                </div>
              </div>
            )}

            {hasSearched && searchResults.length === 0 && (
              <div className="text-center py-8 border rounded-lg">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No customers found</p>
              </div>
            )}

          </CardContent>
        </Card>
      )}

      {/* ═══════════════════ Step 2: Select Transactions ═════════════════ */}
      {currentStep === 99 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Transactions</CardTitle>
            <CardDescription>
              Select the disputed transactions from customer accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Customer Info Banner */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Selected Customer</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <p className="font-medium">{selectedCustomer?.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">CNIC:</span>
                  <p>
                    <DataMasker value={selectedCustomer?.cnic} type="cnic" />
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Accounts:</span>
                  <p className="font-medium">{selectedCustomer?.accounts.length}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">City:</span>
                  <p className="font-medium">{selectedCustomer?.city}</p>
                </div>
              </div>
            </div>

            {/* Account Sections */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Customer Accounts
              </h4>
              {selectedCustomer?.accounts.map((account, idx) => (
                <AccountTransactionSection
                  key={account.id}
                  account={account}
                  transactions={accountTransactions[account.id] || []}
                  selectedTransactionIds={selectedTransactionIds}
                  onToggleTransaction={handleToggleTransaction}
                  onToggleAll={handleToggleAll}
                  defaultExpanded={selectedCustomer.accounts.length === 1 || idx === 0}
                />
              ))}
            </div>

            {/* Manually Added Transactions */}
            {manualTransactions.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Manually Added Transactions
                </h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>STAN</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Beneficiary Added</TableHead>
                        <TableHead>Beneficiary</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Disputed</TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {manualTransactions.map((txn) => (
                        <TableRow key={txn.id}>
                          <TableCell className="font-mono text-sm">
                            {txn.transaction_id}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{txn.stan || '—'}</TableCell>
                          <TableCell>
                            {txn.transaction_date} {txn.transaction_time?.slice(0, 5)}
                          </TableCell>
                          <TableCell>{String(txn.beneficiary_added || '—').toUpperCase()}</TableCell>
                          <TableCell>
                            <DataMasker value={txn.beneficiary_account} type="account" />
                            <span className="text-sm text-muted-foreground ml-1">
                              ({txn.beneficiary_bank})
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(txn.amount)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(txn.disputed_amount)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditManualTransaction(txn)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteManualTransaction(txn.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Add Manual Transaction Button */}
            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={() => {
                setEditingManualTxn(null);
                setManualModalOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Manual Transaction
            </Button>

            {/* Selection Summary */}
            {allSelectedTxns.length > 0 && (
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <span className="text-sm">
                  <strong>{allSelectedTxns.length}</strong> transaction{allSelectedTxns.length !== 1 ? 's' : ''} selected
                  {selectedAccountIds.size > 0 && (
                    <> from <strong>{selectedAccountIds.size}</strong> account{selectedAccountIds.size !== 1 ? 's' : ''}</>
                  )}
                  {manualTransactions.length > 0 && (
                    <> + <strong>{manualTransactions.length}</strong> manual</>
                  )}
                </span>
                <span className="font-medium">
                  Total Disputed: {formatCurrency(totalDisputedAmount)}
                </span>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                disabled={!canProceedToStep3}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════ Step 3: Case Details ════════════════════════ */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Add New IB / MB Dispute</CardTitle>
            <CardDescription>
              Complete the form from below to register a new IB / MB dispute case
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-[14px] border-2 border-[#dae1e7] bg-white overflow-hidden">
              <div className="border-l-[10px] border-l-[#2064b7] p-4">
                <h4 className="text-[24px] font-[600] text-[#4C4C4C] leading-[1.3]">Customer Details</h4>
                <p className="text-sm text-[#8c8c8c]">Basic customer and card information</p>

                <div className="mt-5 grid gap-x-4 gap-y-6 md:grid-cols-4">
                  <div className="space-y-1">
                    <Label>Customer Name</Label>
                    <Input value={selectedCustomer?.name || ''} readOnly className="h-[47px] border-[#05aee5] bg-[#f9fafb] text-[16px]" />
                  </div>
                  <div className="space-y-1">
                    <Label>Reference Number</Label>
                    <Input
                      value={caseDetails.referenceNumber || `REF-IBMB-${String(selectedCustomer?.id || 1).padStart(3, '0')}`}
                      readOnly
                      className="h-[47px] border-[#05aee5] bg-[#f9fafb] text-[16px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>CNIC</Label>
                    <Input value={selectedCustomer?.cnic ? `${selectedCustomer.cnic.slice(0, 4)}xxxxxx${selectedCustomer.cnic.slice(-5)}` : ''} readOnly className="h-[47px] border-[#05aee5] bg-[#f9fafb] text-[16px]" />
                  </div>
                  <div className="space-y-1">
                    <Label>Complaint Number</Label>
                    <Input
                      value={caseDetails.complaintNo}
                      onChange={(e) => setCaseDetails({ ...caseDetails, complaintNo: e.target.value })}
                      className="h-[47px] border-[#05aee5] bg-[#f9fafb] text-[16px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Customer City</Label>
                    <Input value={selectedCustomer?.city || ''} readOnly className="h-[47px] border-[#05aee5] bg-[#f9fafb] text-[16px]" />
                  </div>
                  <div className="space-y-1">
                    <Label>Customer Region</Label>
                    <Input value={selectedCustomer?.region || ''} readOnly className="h-[47px] border-[#05aee5] bg-[#f9fafb] text-[16px]" />
                  </div>
                  <div className="space-y-1">
                    <Label>Case Received Date</Label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={openCaseReceivedDatePicker}
                        className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[#05AEE5]"
                      >
                        <CalendarDays className="h-5 w-5" />
                      </button>
                      <Input
                        ref={caseReceivedDateRef}
                        type="date"
                        value={caseDetails.caseReceivedDate}
                        onChange={(e) => setCaseDetails({ ...caseDetails, caseReceivedDate: e.target.value })}
                        className="no-native-picker h-[47px] border-[#dae1e7] bg-[#f9fafb] pl-10 text-[16px] text-[#4C4C4C] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:pointer-events-none"
                        style={{ WebkitAppearance: 'none', appearance: 'none' }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>
                      Case Received Channel <span className="text-[#E20015]">*</span>
                    </Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-[47px] w-full justify-between border-[#dae1e7] bg-[#f9fafb] px-3 text-[16px] font-normal text-[#4C4C4C] hover:bg-[#f9fafb]"
                        >
                          <span className="truncate text-left">
                            {selectedReceivedChannelLabels.length > 0
                              ? selectedReceivedChannelLabels.join(', ')
                              : 'Select received channel(s)'}
                          </span>
                          <ChevronDown className="h-4 w-4 text-[#7C7C7C]" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                        {caseReceivedChannelOptions.map((ch) => (
                          <DropdownMenuCheckboxItem
                            key={ch.value}
                            checked={selectedReceivedChannels.includes(ch.value)}
                            onCheckedChange={(checked) => {
                              const next = checked
                                ? [...new Set([...selectedReceivedChannels, ch.value])]
                                : selectedReceivedChannels.filter((v) => v !== ch.value);
                              setCaseDetails({
                                ...caseDetails,
                                caseReceivedChannel: next,
                                caseReceivingChannel: next.join(', '),
                              });
                            }}
                          >
                            {ch.label}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[14px] border-2 border-[#dae1e7] bg-white overflow-hidden">
              <div className="border-l-[10px] border-l-[#2064b7] p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h4 className="text-[24px] font-[600] text-[#4C4C4C] leading-[1.3]">Transaction Details</h4>
                    <p className="text-sm text-[#8c8c8c]">Transaction and dispute information</p>
                  </div>
                  <Button
                    className="bg-[#2592ff] hover:bg-[#1e8fff] text-white"
                    onClick={() => {
                      setEditingManualTxn(null);
                      setManualModalOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Transaction
                  </Button>
                </div>

                <div className="max-h-[58vh] space-y-4 overflow-y-auto pr-1">
                  {selectedFoundAccounts.map((account, accountIndex) => {
                    const rows = (accountTransactions[account.id] || []).filter((t) =>
                      step2VisibleTransactionIds.includes(t.id)
                    );

                    if (rows.length === 0) return null;

                    return (
                      <div key={account.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#1e8fff] text-white font-semibold">
                            {accountIndex + 1}
                          </span>
                          <div>
                            <p className="text-[10px] text-[#afafaf]">Account Number</p>
                            <p className="text-xl text-[#4c4c4c]">{maskAccountNumber(account.account_number)}</p>
                          </div>
                        </div>

                        <div className="overflow-hidden rounded-[12px] border-2 border-[#dae1e7]">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-[#edf1f4] hover:bg-[#edf1f4]">
                                <TableHead className="w-10">
                                  <Checkbox
                                    checked={rows.every((r) => selectedTransactionIds.includes(r.id))}
                                    onCheckedChange={() => handleToggleAll(account.id, rows)}
                                    className="border-[#1e8fff] data-[state=checked]:bg-[#1e8fff] data-[state=checked]:border-[#1e8fff]"
                                  />
                                </TableHead>
                                <TableHead>Transaction ID</TableHead>
                                <TableHead>Branch</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Beneficiary</TableHead>
                                <TableHead>Date &amp; Time</TableHead>
                                <TableHead>FTDH ID</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {rows.map((txn) => (
                                <TableRow key={txn.id}>
                                  <TableCell>
                                    <Checkbox
                                      checked={selectedTransactionIds.includes(txn.id)}
                                      onCheckedChange={() => handleToggleTransaction(txn.id)}
                                      className="border-[#1e8fff] data-[state=checked]:bg-[#1e8fff] data-[state=checked]:border-[#1e8fff]"
                                    />
                                  </TableCell>
                                  <TableCell className="font-medium">{txn.transaction_id}</TableCell>
                                  <TableCell>
                                    <p>{txn.branch_name || 'Clifton Branch'}</p>
                                    <p className="text-xs text-[#afafaf]">{txn.branch_code || '0123'}</p>
                                  </TableCell>
                                  <TableCell className="font-medium text-[#1e8fff]">{formatCurrency(txn.amount)}</TableCell>
                                  <TableCell>
                                    <p>{txn.beneficiary_bank || '—'}</p>
                                    <p className="text-xs text-[#afafaf]"><DataMasker value={txn.beneficiary_account} type="account" /></p>
                                  </TableCell>
                                  <TableCell>
                                    <p>{format(new Date(txn.transaction_date), 'dd/MM/yyyy')}</p>
                                    <p className="text-xs text-[#afafaf]">{txn.transaction_time?.slice(0, 5) || '--:--'}</p>
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      placeholder="Enter ID"
                                      value={transactionFtdhIds[txn.id] ?? txn.ftdh_id ?? ''}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        setTransactionFtdhIds((prev) => ({ ...prev, [txn.id]: value }));
                                      }}
                                      className="h-8 bg-[#f9fafb]"
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    );
                  })}

                  {manualTransactions.length > 0 && (
                    <>
                      {Object.entries(
                        manualTransactions.reduce((acc, txn) => {
                          const key = txn.beneficiary_account || 'manual-no-account';
                          if (!acc[key]) acc[key] = [];
                          acc[key].push(txn);
                          return acc;
                        }, {})
                      ).map(([accountNo, txns], manualIndex) => (
                        <div key={accountNo} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#1e8fff] text-white font-semibold">
                              {selectedFoundAccounts.length + manualIndex + 1}
                            </span>
                            <div>
                              <p className="text-[10px] text-[#afafaf]">Account Number</p>
                              <p className="text-xl text-[#4c4c4c]">{maskAccountNumber(accountNo)}</p>
                            </div>
                          </div>

                          <div className="overflow-hidden rounded-[12px] border-2 border-[#dae1e7]">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-[#edf1f4] hover:bg-[#edf1f4]">
                                  <TableHead className="w-10">
                                    <Checkbox
                                      checked={txns.every((t) => selectedManualTransactionIds.includes(t.id))}
                                      onCheckedChange={() => handleToggleAllManualForAccount(txns)}
                                      className="border-[#1e8fff] data-[state=checked]:bg-[#1e8fff] data-[state=checked]:border-[#1e8fff]"
                                    />
                                  </TableHead>
                                  <TableHead>Transaction ID</TableHead>
                                  <TableHead>Branch</TableHead>
                                  <TableHead>Amount</TableHead>
                                  <TableHead>Beneficiary</TableHead>
                                  <TableHead>Date &amp; Time</TableHead>
                                  <TableHead>FTDH ID</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {txns.map((txn) => (
                                  <TableRow key={txn.id}>
                                    <TableCell>
                                      <Checkbox
                                        checked={selectedManualTransactionIds.includes(txn.id)}
                                        onCheckedChange={() => handleToggleManualTransaction(txn.id)}
                                        className="border-[#1e8fff] data-[state=checked]:bg-[#1e8fff] data-[state=checked]:border-[#1e8fff]"
                                      />
                                    </TableCell>
                                    <TableCell className="font-medium">{txn.transaction_id}</TableCell>
                                    <TableCell>
                                      <p>{txn.branch_name || '—'}</p>
                                      <p className="text-xs text-[#afafaf]">{txn.branch_code || '—'}</p>
                                    </TableCell>
                                    <TableCell className="font-medium text-[#1e8fff]">{formatCurrency(txn.amount)}</TableCell>
                                    <TableCell>
                                      <p>{txn.beneficiary_bank || '—'}</p>
                                      <p className="text-xs text-[#afafaf]"><DataMasker value={txn.beneficiary_account} type="account" /></p>
                                    </TableCell>
                                    <TableCell>
                                      <p>{txn.transaction_date ? format(new Date(txn.transaction_date), 'dd/MM/yyyy') : '—'}</p>
                                      <p className="text-xs text-[#afafaf]">{txn.transaction_time?.slice(0, 5) || '--:--'}</p>
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        placeholder="Enter ID"
                                        value={transactionFtdhIds[txn.id] ?? txn.ftdh_id ?? ''}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          setTransactionFtdhIds((prev) => ({ ...prev, [txn.id]: value }));
                                          setManualTransactions((prev) => prev.map((t) => (
                                            t.id === txn.id ? { ...t, ftdh_id: value } : t
                                          )));
                                        }}
                                        className="h-8 bg-[#f9fafb]"
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canProceedToStep4 || isSubmitting}
                className="min-w-[220px] rounded-full bg-[#2064b7] hover:bg-[#1b56a0]"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════ Step 4: Review & Submit ═════════════════════
      {currentStep === 3 && (
        <Card>...</Card>
      )}
      ═══════════════════════════════════════════════════════════════════ */}

      {/* Manual Transaction Modal */}
      <ManualTransactionModal
        open={manualModalOpen}
        onOpenChange={(open) => {
          setManualModalOpen(open);
          if (!open) setEditingManualTxn(null);
        }}
        onSave={handleSaveManualTransaction}
        editTransaction={editingManualTxn}
      />
    </div>
  );
}

export default CreateCasePage;
