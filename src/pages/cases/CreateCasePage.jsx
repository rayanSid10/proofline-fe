import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { DataMasker } from '@/components/shared/DataMasker';
import { ManualTransactionModal } from '@/components/forms/ManualTransactionModal';
import { cn } from '@/lib/utils';
import { searchCustomers, getTransactionsForAccount } from '@/data/mockCustomers';
import { fraudTypes, channels } from '@/data/mockCases';

const steps = [
  { id: 1, title: 'Customer Search', icon: Search },
  { id: 2, title: 'Select Transactions', icon: CreditCard },
  { id: 3, title: 'Case Details', icon: FileText },
  { id: 4, title: 'Review & Submit', icon: ClipboardList },
];

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
  }).format(amount);
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
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Channel</TableHead>
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
                      <TableCell>
                        {txn.transaction_date} {txn.transaction_time?.slice(0, 5)}
                      </TableCell>
                      <TableCell>{txn.channel}</TableCell>
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
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Customer Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Step 2: Transactions (multi-account)
  const [accountTransactions, setAccountTransactions] = useState({});
  // Maps accountId → transactions[]
  const [selectedTransactionIds, setSelectedTransactionIds] = useState([]);
  const [manualTransactions, setManualTransactions] = useState([]);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [editingManualTxn, setEditingManualTxn] = useState(null);

  // Step 3: Case Details
  const [caseDetails, setCaseDetails] = useState({
    caseReceivedDate: format(new Date(), 'yyyy-MM-dd'),
    channel: '',
    fraudType: '',
    ftdhId: '',
    notes: '',
  });

  // ─── Search Logic ─────────────────────────────────────────────────────

  const performSearch = useCallback((query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    const results = searchCustomers(query);
    setSearchResults(results);
    setHasSearched(true);
  }, []);

  // Debounced live search — fires 300ms after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  const handleSearch = () => {
    performSearch(searchQuery);
  };

  // ─── Customer Selection → Load Transactions ───────────────────────────

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);

    // Load transactions for each account
    const txnMap = {};
    customer.accounts.forEach((acc) => {
      txnMap[acc.id] = getTransactionsForAccount(acc.id);
    });
    setAccountTransactions(txnMap);

    // Reset selections
    setSelectedTransactionIds([]);
    setManualTransactions([]);
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
    } else {
      setManualTransactions((prev) => [...prev, txn]);
    }
  };

  const handleEditManualTransaction = (txn) => {
    setEditingManualTxn(txn);
    setManualModalOpen(true);
  };

  const handleDeleteManualTransaction = (txnId) => {
    setManualTransactions((prev) => prev.filter((t) => t.id !== txnId));
  };

  // ─── Computed Values ──────────────────────────────────────────────────

  // All account transactions flat
  const allAccountTxns = Object.values(accountTransactions).flat();

  // Selected system transactions
  const selectedSystemTxns = allAccountTxns.filter((t) =>
    selectedTransactionIds.includes(t.id)
  );

  // All selected (system + manual)
  const allSelectedTxns = [...selectedSystemTxns, ...manualTransactions];

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

  const canProceedToStep2 = selectedCustomer !== null;
  const canProceedToStep3 = allSelectedTxns.length > 0;
  const canProceedToStep4 = caseDetails.channel && caseDetails.fraudType;

  // ─── Submit ───────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success('Case created successfully', {
      description: 'Reference: IBMB-2025-000007',
    });

    navigate('/cases');
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
          <h2 className="text-2xl font-bold tracking-tight">Create New Case</h2>
          <p className="text-muted-foreground">
            File a new IB/MB fraud dispute case
          </p>
        </div>
      </div>

      <StepIndicator currentStep={currentStep} />

      {/* ═══════════════════ Step 1: Customer Search ═════════════════════ */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Customer Search</CardTitle>
            <CardDescription>
              Search for the customer by Account Number, CNIC, or Card Number
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
                />
              </div>
              <Button onClick={handleSearch}>
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>CNIC</TableHead>
                      <TableHead>Accounts</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">
                          {customer.name}
                        </TableCell>
                        <TableCell>
                          <DataMasker value={customer.cnic} type="cnic" />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {customer.accounts.map((acc) => (
                              <div key={acc.id} className="flex items-center gap-1.5">
                                <DataMasker value={acc.account_number} type="account" />
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {acc.account_type}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{customer.city}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleSelectCustomer(customer)}
                          >
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {hasSearched && searchResults.length === 0 && (
              <div className="text-center py-8 border rounded-lg">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No customers found</p>
                <Button variant="link" className="mt-2">
                  Customer not found? Create manually
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════ Step 2: Select Transactions ═════════════════ */}
      {currentStep === 2 && (
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
                        <TableHead>Date & Time</TableHead>
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
                          <TableCell>
                            {txn.transaction_date} {txn.transaction_time?.slice(0, 5)}
                          </TableCell>
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
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Case Details</CardTitle>
            <CardDescription>
              Enter the case information and categorization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="caseReceivedDate">Case Received Date *</Label>
                <Input
                  id="caseReceivedDate"
                  type="date"
                  value={caseDetails.caseReceivedDate}
                  onChange={(e) =>
                    setCaseDetails({ ...caseDetails, caseReceivedDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="channel">Channel *</Label>
                <Select
                  value={caseDetails.channel}
                  onValueChange={(value) =>
                    setCaseDetails({ ...caseDetails, channel: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {channels.map((channel) => (
                      <SelectItem key={channel.value} value={channel.value}>
                        {channel.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fraudType">Fraud Type *</Label>
                <Select
                  value={caseDetails.fraudType}
                  onValueChange={(value) =>
                    setCaseDetails({ ...caseDetails, fraudType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fraud type" />
                  </SelectTrigger>
                  <SelectContent>
                    {fraudTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ftdhId">FTDH ID (Optional)</Label>
                <Input
                  id="ftdhId"
                  placeholder="Enter FTDH reference if applicable"
                  value={caseDetails.ftdhId}
                  onChange={(e) =>
                    setCaseDetails({ ...caseDetails, ftdhId: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about the case..."
                rows={4}
                value={caseDetails.notes}
                onChange={(e) =>
                  setCaseDetails({ ...caseDetails, notes: e.target.value })
                }
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep(4)}
                disabled={!canProceedToStep4}
              >
                Review Case
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════ Step 4: Review & Submit ═════════════════════ */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Submit</CardTitle>
            <CardDescription>
              Review all information before creating the case
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Customer Summary */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Customer Information</h4>
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                  Edit
                </Button>
              </div>
              <div className="p-4 border rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Name</span>
                  <p className="font-medium">{selectedCustomer?.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">CNIC</span>
                  <p>
                    <DataMasker value={selectedCustomer?.cnic} type="cnic" />
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Accounts</span>
                  <p className="font-medium">{selectedCustomer?.accounts.length}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">City</span>
                  <p className="font-medium">{selectedCustomer?.city}</p>
                </div>
              </div>
            </div>

            {/* Transactions Summary — grouped by account */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">
                  Disputed Transactions ({allSelectedTxns.length})
                </h4>
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)}>
                  Edit
                </Button>
              </div>

              {/* Per-account groups */}
              {selectedCustomer?.accounts.map((account) => {
                const accTxns = (accountTransactions[account.id] || []).filter((t) =>
                  selectedTransactionIds.includes(t.id)
                );
                if (accTxns.length === 0) return null;

                return (
                  <div key={account.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Account:</span>
                      <DataMasker value={account.account_number} type="account" />
                      <Badge variant="outline" className="text-xs">
                        {account.account_type}
                      </Badge>
                      <span className="text-muted-foreground ml-auto">
                        {accTxns.length} txn{accTxns.length !== 1 ? 's' : ''} ·{' '}
                        {formatCurrency(accTxns.reduce((s, t) => s + t.amount, 0))}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Manual transactions group */}
              {manualTransactions.length > 0 && (
                <div className="p-4 border rounded-lg border-dashed space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Manually Added:</span>
                    <span className="font-medium">
                      {manualTransactions.length} transaction{manualTransactions.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-muted-foreground ml-auto">
                      {formatCurrency(manualTransactions.reduce((s, t) => s + t.amount, 0))}
                    </span>
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Transactions</span>
                    <p className="font-medium">{allSelectedTxns.length}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Disputed Amount</span>
                    <p className="font-medium text-lg">{formatCurrency(totalDisputedAmount)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Case Details Summary */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Case Details</h4>
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep(3)}>
                  Edit
                </Button>
              </div>
              <div className="p-4 border rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Received Date</span>
                  <p className="font-medium">{caseDetails.caseReceivedDate}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Channel</span>
                  <p className="font-medium">
                    {channels.find((c) => c.value === caseDetails.channel)?.label}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fraud Type</span>
                  <p className="font-medium">
                    {fraudTypes.find((t) => t.value === caseDetails.fraudType)?.label}
                  </p>
                </div>
                {caseDetails.ftdhId && (
                  <div>
                    <span className="text-muted-foreground">FTDH ID</span>
                    <p className="font-medium">{caseDetails.ftdhId}</p>
                  </div>
                )}
              </div>
              {caseDetails.notes && (
                <div className="p-4 border rounded-lg text-sm">
                  <span className="text-muted-foreground">Notes</span>
                  <p className="mt-1">{caseDetails.notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(3)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Creating Case...' : 'Create Case'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
