import { useState } from 'react';
import { Calendar, ChevronRight, ChevronDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { getTransactionsForAccount } from '@/data/mockCustomers';

function maskAccountNumber(num) {
  if (!num || num.length < 8) return num;
  return `**** **** ${num.slice(-4)}`;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function AccountRow({
  account,
  index,
  selected,
  onSelect,
  expanded,
  onToggleExpand,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  transactions,
}) {
  return (
    <div className="border-b last:border-b-0">
      {/* Account Header */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors',
          expanded && 'bg-muted/30'
        )}
        onClick={onToggleExpand}
      >
        <span className="text-sm font-bold text-blue-600 w-4">{index}</span>
        <Checkbox
          checked={selected}
          onCheckedChange={(checked) => {
            onSelect(checked);
          }}
          onClick={(e) => e.stopPropagation()}
        />
        <span className="text-sm flex-1">{maskAccountNumber(account.account_number)}</span>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Expanded Content */}
      {expanded && selected && (
        <div className="px-4 pb-4 space-y-3 bg-muted/10">
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs">
                Date From<span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => onDateFromChange(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">
                Date To<span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => onDateToChange(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          {transactions.length > 0 && (
            <div className="rounded border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-600 hover:bg-blue-600">
                    <TableHead className="text-white text-xs py-1.5 px-2">
                      Transaction ID
                    </TableHead>
                    <TableHead className="text-white text-xs py-1.5 px-2">
                      Branch
                    </TableHead>
                    <TableHead className="text-white text-xs py-1.5 px-2">
                      Amount
                    </TableHead>
                    <TableHead className="text-white text-xs py-1.5 px-2">
                      Beneficiary
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => (
                    <TableRow key={txn.id} className="text-xs">
                      <TableCell className="py-1.5 px-2 font-medium">
                        {txn.id}
                      </TableCell>
                      <TableCell className="py-1.5 px-2">
                        {txn.branch || 'N/A'}
                      </TableCell>
                      <TableCell className="py-1.5 px-2 text-green-600 font-medium">
                        {formatCurrency(txn.amount)}
                      </TableCell>
                      <TableCell className="py-1.5 px-2">
                        {txn.beneficiary_bank || 'N/A'}
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

export function MultipleAccountsDialog({ open, onOpenChange, accounts = [], onProceed }) {
  const [selectedAccounts, setSelectedAccounts] = useState({});
  const [expandedAccount, setExpandedAccount] = useState(null);
  const [dateRanges, setDateRanges] = useState({});
  const [accountTransactions, setAccountTransactions] = useState({});

  const handleSelect = (accountId, checked) => {
    setSelectedAccounts((prev) => ({ ...prev, [accountId]: checked }));
    if (checked && !accountTransactions[accountId]) {
      // Load transactions for this account
      const txns = getTransactionsForAccount(accountId);
      setAccountTransactions((prev) => ({ ...prev, [accountId]: txns }));
    }
  };

  const handleToggleExpand = (accountId) => {
    setExpandedAccount((prev) => (prev === accountId ? null : accountId));
  };

  const handleDateChange = (accountId, field, value) => {
    setDateRanges((prev) => ({
      ...prev,
      [accountId]: { ...prev[accountId], [field]: value },
    }));
  };

  const selectedCount = Object.values(selectedAccounts).filter(Boolean).length;

  const handleProceed = () => {
    const selected = accounts
      .filter((acc) => selectedAccounts[acc.id])
      .map((acc) => ({
        account: acc,
        dateFrom: dateRanges[acc.id]?.dateFrom || '',
        dateTo: dateRanges[acc.id]?.dateTo || '',
        transactions: accountTransactions[acc.id] || [],
      }));
    if (onProceed) onProceed(selected);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 max-h-[80vh] flex flex-col">
        <div className="p-6 pb-3">
          <h2 className="text-lg font-bold text-center">
            {accounts.length} accounts are founded
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto border-t border-b">
          {accounts.map((account, idx) => (
            <AccountRow
              key={account.id}
              account={account}
              index={idx + 1}
              selected={!!selectedAccounts[account.id]}
              onSelect={(checked) => handleSelect(account.id, checked)}
              expanded={expandedAccount === account.id}
              onToggleExpand={() => handleToggleExpand(account.id)}
              dateFrom={dateRanges[account.id]?.dateFrom || ''}
              dateTo={dateRanges[account.id]?.dateTo || ''}
              onDateFromChange={(val) =>
                handleDateChange(account.id, 'dateFrom', val)
              }
              onDateToChange={(val) =>
                handleDateChange(account.id, 'dateTo', val)
              }
              transactions={accountTransactions[account.id] || []}
            />
          ))}
        </div>

        <div className="p-4 flex justify-center">
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white px-10"
            disabled={selectedCount === 0}
            onClick={handleProceed}
          >
            Proceed
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MultipleAccountsDialog;
