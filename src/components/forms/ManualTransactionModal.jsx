import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { pakistaniBanks } from '@/data/constants';

const initialFormState = {
  transaction_id: '',
  transaction_date: '',
  transaction_time: '',
  amount: '',
  beneficiary_account: '',
  beneficiary_bank: '',
  beneficiary_name: '',
  branch_name: '',
  branch_code: '',
  disputed_amount: '',
  imei: '',
  ftdh_id: '',
};

/**
 * Modal dialog for manually adding a transaction to a case.
 *
 * Props:
 *  - open: boolean
 *  - onOpenChange: (open) => void
 *  - onSave: (transaction) => void
 *  - editTransaction: transaction | null  (if editing an existing manual txn)
 */
export function ManualTransactionModal({
  open,
  onOpenChange,
  onSave,
  editTransaction = null,
}) {
  const [form, setForm] = useState(
    editTransaction
      ? { ...editTransaction, amount: String(editTransaction.amount), disputed_amount: String(editTransaction.disputed_amount) }
      : { ...initialFormState }
  );
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!form.transaction_id.trim()) newErrors.transaction_id = 'Required';
    if (!form.transaction_date) newErrors.transaction_date = 'Required';
    if (!form.transaction_time) newErrors.transaction_time = 'Required';

    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Must be > 0';
    }

    if (!form.beneficiary_account.trim()) newErrors.beneficiary_account = 'Required';
    if (!form.beneficiary_bank) newErrors.beneficiary_bank = 'Required';

    const disputed = parseFloat(form.disputed_amount);
    if (!form.disputed_amount || isNaN(disputed) || disputed <= 0) {
      newErrors.disputed_amount = 'Must be > 0';
    } else if (!isNaN(amount) && disputed > amount) {
      newErrors.disputed_amount = 'Cannot exceed transaction amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const transaction = {
      id: editTransaction?.id || `MANUAL-${Date.now()}`,
      transaction_id: form.transaction_id.trim(),
      transaction_date: form.transaction_date,
      transaction_time: form.transaction_time,
      amount: parseFloat(form.amount),
      beneficiary_account: form.beneficiary_account.trim(),
      beneficiary_bank: form.beneficiary_bank,
      beneficiary_name: form.beneficiary_name.trim(),
      branch_name: form.branch_name.trim(),
      branch_code: form.branch_code.trim(),
      disputed_amount: parseFloat(form.disputed_amount),
      imei: form.imei.trim(),
      ftdh_id: form.ftdh_id.trim(),
      channel: 'Manual',
      isManual: true,
    };

    onSave(transaction);
    onOpenChange(false);
    setForm({ ...initialFormState });
    setErrors({});
  };

  const handleCancel = () => {
    onOpenChange(false);
    setForm({ ...initialFormState });
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editTransaction ? 'Edit Transaction' : 'Add Manual Transaction'}
          </DialogTitle>
          <DialogDescription>
            Enter the disputed transaction details manually.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Transaction ID + Date + Time */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="txn_id">Transaction ID *</Label>
              <Input
                id="txn_id"
                placeholder="e.g. TXN20250115001"
                value={form.transaction_id}
                onChange={(e) => handleChange('transaction_id', e.target.value)}
              />
              {errors.transaction_id && (
                <p className="text-xs text-destructive">{errors.transaction_id}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="txn_date">Transaction Date *</Label>
              <Input
                id="txn_date"
                type="date"
                value={form.transaction_date}
                onChange={(e) => handleChange('transaction_date', e.target.value)}
              />
              {errors.transaction_date && (
                <p className="text-xs text-destructive">{errors.transaction_date}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="txn_time">Transaction Time *</Label>
              <Input
                id="txn_time"
                type="time"
                value={form.transaction_time}
                onChange={(e) => handleChange('transaction_time', e.target.value)}
              />
              {errors.transaction_time && (
                <p className="text-xs text-destructive">{errors.transaction_time}</p>
              )}
            </div>
          </div>

          {/* Row 2: Amount + Disputed Amount */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Transaction Amount (PKR) *</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                placeholder="e.g. 50000"
                value={form.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
              />
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="disputed_amount">Exposure / Dispute Amount (PKR) *</Label>
              <Input
                id="disputed_amount"
                type="number"
                min="1"
                placeholder="Must be ≤ transaction amount"
                value={form.disputed_amount}
                onChange={(e) => handleChange('disputed_amount', e.target.value)}
              />
              {errors.disputed_amount && (
                <p className="text-xs text-destructive">{errors.disputed_amount}</p>
              )}
            </div>
          </div>

          {/* Row 3: Beneficiary Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ben_account">Beneficiary Account *</Label>
              <Input
                id="ben_account"
                placeholder="e.g. 1122334455667"
                value={form.beneficiary_account}
                onChange={(e) => handleChange('beneficiary_account', e.target.value)}
              />
              {errors.beneficiary_account && (
                <p className="text-xs text-destructive">{errors.beneficiary_account}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ben_bank">Beneficiary Bank *</Label>
              <Select
                value={form.beneficiary_bank}
                onValueChange={(value) => handleChange('beneficiary_bank', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent>
                  {pakistaniBanks.map((bank) => (
                    <SelectItem key={bank.value} value={bank.value}>
                      {bank.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.beneficiary_bank && (
                <p className="text-xs text-destructive">{errors.beneficiary_bank}</p>
              )}
            </div>
          </div>

          {/* Row 4: Beneficiary Name */}
          <div className="space-y-2">
            <Label htmlFor="ben_name">Beneficiary Name</Label>
            <Input
              id="ben_name"
              placeholder="e.g. John Doe"
              value={form.beneficiary_name}
              onChange={(e) => handleChange('beneficiary_name', e.target.value)}
            />
          </div>

          {/* Row 5: Branch Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="branch_name">Branch Name</Label>
              <Input
                id="branch_name"
                placeholder="Optional"
                value={form.branch_name}
                onChange={(e) => handleChange('branch_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch_code">Branch Code</Label>
              <Input
                id="branch_code"
                placeholder="Optional"
                value={form.branch_code}
                onChange={(e) => handleChange('branch_code', e.target.value)}
              />
            </div>
          </div>

          {/* Row 6: IMEI + FTDH */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="imei">IMEI / MAC Address</Label>
              <Input
                id="imei"
                placeholder="Optional"
                value={form.imei}
                onChange={(e) => handleChange('imei', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ftdh_id">FTDH ID</Label>
              <Input
                id="ftdh_id"
                placeholder="Optional"
                value={form.ftdh_id}
                onChange={(e) => handleChange('ftdh_id', e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {editTransaction ? 'Update Transaction' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ManualTransactionModal;
