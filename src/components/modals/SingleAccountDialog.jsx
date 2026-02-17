import { useState } from 'react';
import { Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SingleAccountDialog({ open, onOpenChange, account, onProceed }) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const maskedNumber = account
    ? `${account.account_number?.slice(0, 4)} ${account.account_number
        ?.slice(4, -4)
        .replace(/./g, '*')
        .replace(/(.{4})/g, '$1 ')} ${account.account_number?.slice(-4)}`
    : '';

  const handleProceed = () => {
    if (onProceed) {
      onProceed({ account, dateFrom, dateTo });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-6">
        <div className="space-y-5">
          <div className="text-center">
            <h2 className="text-lg font-bold">One Account Found</h2>
            <p className="text-base text-muted-foreground font-medium mt-1">
              {maskedNumber}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium mb-3">
              Select the date range for transactions
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">
                  Date From<span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    placeholder="dd/mm/yyyy"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">
                  Date To<span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    placeholder="dd/mm/yyyy"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
              disabled={!dateFrom || !dateTo}
              onClick={handleProceed}
            >
              Proceed
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SingleAccountDialog;
