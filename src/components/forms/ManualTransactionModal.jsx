import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DialogClose,
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { CalendarDays, Clock3, Search, X } from 'lucide-react';

const initialFormState = {
  transaction_id: '',
  stan: '',
  transaction_date: '',
  transaction_time: '',
  amount: '',
  beneficiary_account: '',
  beneficiary_bank: '',
  beneficiary_name: '',
  beneficiary_added: 'yes',
  branch_name: '',
  branch_code: '',
  disputed_amount: '',
  ip_address: '',
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
      ? {
          ...initialFormState,
          ...editTransaction,
          amount: String(editTransaction.amount ?? ''),
          disputed_amount: String(editTransaction.disputed_amount ?? editTransaction.amount ?? ''),
        }
      : { ...initialFormState }
  );
  const [errors, setErrors] = useState({});
  const dateRef = useRef(null);
  const timeRef = useRef(null);

  useEffect(() => {
    if (open) {
      setForm(
        editTransaction
          ? {
              ...initialFormState,
              ...editTransaction,
              amount: String(editTransaction.amount ?? ''),
              disputed_amount: String(editTransaction.disputed_amount ?? editTransaction.amount ?? ''),
            }
          : { ...initialFormState }
      );
      setErrors({});
    }
  }, [open, editTransaction]);

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
    if (!form.stan.trim()) newErrors.stan = 'Required';
    if (!form.transaction_date) newErrors.transaction_date = 'Required';
    if (!form.transaction_time) newErrors.transaction_time = 'Required';

    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Must be > 0';
    }

    if (!form.beneficiary_account.trim()) newErrors.beneficiary_account = 'Required';
    if (!form.beneficiary_bank.trim()) newErrors.beneficiary_bank = 'Required';

    const disputed = parseFloat(form.disputed_amount);
    if (!form.disputed_amount || isNaN(disputed) || disputed <= 0) {
      newErrors.disputed_amount = 'Must be > 0';
    } else if (!isNaN(amount) && disputed > amount) {
      newErrors.disputed_amount = 'Cannot exceed transaction amount';
    }

    if (!form.branch_name.trim()) newErrors.branch_name = 'Required';
    if (!form.branch_code.trim()) newErrors.branch_code = 'Required';
    if (!form.ip_address.trim()) newErrors.ip_address = 'Required';
    if (!form.imei.trim()) newErrors.imei = 'Required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const transaction = {
      id: editTransaction?.id || `MANUAL-${Date.now()}`,
      transaction_id: form.transaction_id.trim(),
      stan: form.stan.trim(),
      transaction_date: form.transaction_date,
      transaction_time: form.transaction_time,
      amount: parseFloat(form.amount),
      beneficiary_account: form.beneficiary_account.trim(),
      beneficiary_bank: form.beneficiary_bank.trim(),
      beneficiary_name: form.beneficiary_name.trim(),
      beneficiary_added: form.beneficiary_added,
      branch_name: form.branch_name.trim(),
      branch_code: form.branch_code.trim(),
      disputed_amount: parseFloat(form.disputed_amount),
      ip_address: form.ip_address.trim(),
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
      <DialogContent
        showCloseButton={false}
        className="!w-[722px] h-[761px] !max-w-[95vw] md:!max-w-[722px] max-h-[95vh] rounded-[15px] border-2 border-[#DAE1E7] p-0 overflow-x-hidden overflow-y-hidden"
      >
        <div className="h-[10px] bg-[#2064B7]" />

        <div className="relative p-6 h-[calc(100%-10px)] overflow-y-auto overflow-x-hidden">
          <DialogClose className="absolute right-5 top-4 text-[#AFAFAF] hover:text-[#4C4C4C]">
            <X className="h-6 w-6" />
          </DialogClose>

          <h3 className="text-[24px] font-semibold text-[#4C4C4C] text-center">
            Transaction Details
          </h3>
          <p className="text-[16px] text-[#8C8C8C] text-center mb-4">
            Transaction and dispute information
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:[grid-template-columns:283px_283px] md:justify-center gap-x-7 gap-y-3">
              <div className="space-y-1">
                <Label htmlFor="txn_id" className="text-[16px] text-[#4C4C4C]">Transaction ID<span className="text-[#c22e1f]">*</span></Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#AFAFAF]" />
                  <Input
                    id="txn_id"
                    placeholder="Enter ID"
                    value={form.transaction_id}
                    onChange={(e) => handleChange('transaction_id', e.target.value)}
                    className="w-full md:w-[283px] h-[47px] pl-9 bg-[#F9FAFB] border-[#DAE1E7] text-[16px]"
                  />
                </div>
                {errors.transaction_id && <p className="text-xs text-destructive">{errors.transaction_id}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="stan" className="text-[16px] text-[#4C4C4C]">STAN<span className="text-[#c22e1f]">*</span></Label>
                <Input
                  id="stan"
                  placeholder="Enter STAN"
                  value={form.stan}
                  onChange={(e) => handleChange('stan', e.target.value)}
                  className="w-full md:w-[283px] h-[47px] bg-[#F9FAFB] border-[#DAE1E7] text-[16px]"
                />
                {errors.stan && <p className="text-xs text-destructive">{errors.stan}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="txn_date" className="text-[16px] text-[#4C4C4C]">Transaction Date<span className="text-[#c22e1f]">*</span></Label>
                <div className="relative">
                  <button type="button" onClick={() => dateRef.current?.showPicker?.()} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AFAFAF]">
                    <CalendarDays className="h-5 w-5" />
                  </button>
                  <Input
                    ref={dateRef}
                    id="txn_date"
                    type="date"
                    value={form.transaction_date}
                    onChange={(e) => handleChange('transaction_date', e.target.value)}
                    className="no-native-picker w-full md:w-[283px] h-[47px] pl-10 bg-[#F9FAFB] border-[#DAE1E7] text-[16px] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:pointer-events-none"
                    style={{ WebkitAppearance: 'none', appearance: 'none' }}
                  />
                </div>
                {errors.transaction_date && <p className="text-xs text-destructive">{errors.transaction_date}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="txn_time" className="text-[16px] text-[#4C4C4C]">Transaction Time<span className="text-[#c22e1f]">*</span></Label>
                <div className="relative">
                  <button type="button" onClick={() => timeRef.current?.showPicker?.()} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AFAFAF]">
                    <Clock3 className="h-5 w-5" />
                  </button>
                  <Input
                    ref={timeRef}
                    id="txn_time"
                    type="time"
                    value={form.transaction_time}
                    onChange={(e) => handleChange('transaction_time', e.target.value)}
                    className="no-native-picker w-full md:w-[283px] h-[47px] pl-10 bg-[#F9FAFB] border-[#DAE1E7] text-[16px] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:pointer-events-none"
                    style={{ WebkitAppearance: 'none', appearance: 'none' }}
                  />
                </div>
                {errors.transaction_time && <p className="text-xs text-destructive">{errors.transaction_time}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="amount" className="text-[16px] text-[#4C4C4C]">Transaction Amount<span className="text-[#c22e1f]">*</span></Label>
                <Input id="amount" type="number" min="1" placeholder="xxxxxxxxxx" value={form.amount} onChange={(e) => handleChange('amount', e.target.value)} className="w-full md:w-[283px] h-[47px] bg-[#F9FAFB] border-[#DAE1E7] text-[16px]" />
                {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="ben_account" className="text-[16px] text-[#4C4C4C]">Beneficiary Account Number<span className="text-[#c22e1f]">*</span></Label>
                <Input id="ben_account" placeholder="xxxx xxxx xxxx xxxx" value={form.beneficiary_account} onChange={(e) => handleChange('beneficiary_account', e.target.value)} className="w-full md:w-[283px] h-[47px] bg-[#F9FAFB] border-[#DAE1E7] text-[16px]" />
                {errors.beneficiary_account && <p className="text-xs text-destructive">{errors.beneficiary_account}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="ben_bank" className="text-[16px] text-[#4C4C4C]">Beneficiary Bank Name<span className="text-[#c22e1f]">*</span></Label>
                <Input id="ben_bank" placeholder="Bank Name" value={form.beneficiary_bank} onChange={(e) => handleChange('beneficiary_bank', e.target.value)} className="w-full md:w-[283px] h-[47px] bg-[#F9FAFB] border-[#DAE1E7] text-[16px]" />
                {errors.beneficiary_bank && <p className="text-xs text-destructive">{errors.beneficiary_bank}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="branch_name" className="text-[16px] text-[#4C4C4C]">Branch Name<span className="text-[#c22e1f]">*</span></Label>
                <Input id="branch_name" placeholder="Branch Name" value={form.branch_name} onChange={(e) => handleChange('branch_name', e.target.value)} className="w-full md:w-[283px] h-[47px] bg-[#F9FAFB] border-[#DAE1E7] text-[16px]" />
                {errors.branch_name && <p className="text-xs text-destructive">{errors.branch_name}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="branch_code" className="text-[16px] text-[#4C4C4C]">Branch Code<span className="text-[#c22e1f]">*</span></Label>
                <Input id="branch_code" placeholder="Branch Code" value={form.branch_code} onChange={(e) => handleChange('branch_code', e.target.value)} className="w-full md:w-[283px] h-[47px] bg-[#F9FAFB] border-[#DAE1E7] text-[16px]" />
                {errors.branch_code && <p className="text-xs text-destructive">{errors.branch_code}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="disputed_amount" className="text-[16px] text-[#4C4C4C]">Exposure/Dispute Amount<span className="text-[#c22e1f]">*</span></Label>
                <Input id="disputed_amount" type="number" min="1" placeholder="Enter Amount" value={form.disputed_amount} onChange={(e) => handleChange('disputed_amount', e.target.value)} className="w-full md:w-[283px] h-[47px] bg-[#F9FAFB] border-[#DAE1E7] text-[16px]" />
                {errors.disputed_amount && <p className="text-xs text-destructive">{errors.disputed_amount}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="ip_address" className="text-[16px] text-[#4C4C4C]">IP Address<span className="text-[#c22e1f]">*</span></Label>
                <Input id="ip_address" placeholder="IP Address" value={form.ip_address} onChange={(e) => handleChange('ip_address', e.target.value)} className="w-full md:w-[283px] h-[47px] bg-[#F9FAFB] border-[#DAE1E7] text-[16px]" />
                {errors.ip_address && <p className="text-xs text-destructive">{errors.ip_address}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="imei" className="text-[16px] text-[#4C4C4C]">IMEI # MAC Address<span className="text-[#c22e1f]">*</span></Label>
                <Input id="imei" placeholder="Mac Address" value={form.imei} onChange={(e) => handleChange('imei', e.target.value)} className="w-full md:w-[283px] h-[47px] bg-[#F9FAFB] border-[#DAE1E7] text-[16px]" />
                {errors.imei && <p className="text-xs text-destructive">{errors.imei}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="ftdh_id" className="text-[16px] text-[#4C4C4C]">FTDH ID</Label>
                <Input id="ftdh_id" placeholder="Enter FTDH ID" value={form.ftdh_id} onChange={(e) => handleChange('ftdh_id', e.target.value)} className="w-full md:w-[283px] h-[47px] bg-[#F9FAFB] border-[#DAE1E7] text-[16px]" />
                {errors.ftdh_id && <p className="text-xs text-destructive">{errors.ftdh_id}</p>}
              </div>
            </div>

            <div className="flex items-center justify-center pt-2">
              <Button type="submit" className="h-[42px] min-w-[132px] bg-[#2592ff] hover:bg-[#1e8fff] text-[20px] font-medium">
                {editTransaction ? 'Update' : 'Add'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ManualTransactionModal;
