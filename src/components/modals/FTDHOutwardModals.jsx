import { useRef, useState } from 'react';
import { CalendarDays, Clock3, IdCard, X } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MOCK_CHANNELS } from '@/data/mockFTDH';
import { toast } from 'sonner';

function FieldLabel({ label, required }) {
  return (
    <p className="text-[16px] font-medium text-[#4C4C4C] mb-1 font-['Jost',sans-serif]">
      {label}
      {required && <span className="text-[#E20015]">*</span>}
    </p>
  );
}

function TextField({ label, required, value, onChange, className = '' }) {
  return (
    <div className={className}>
      <FieldLabel label={label} required={required} />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[40px] md:h-[47px] rounded-[6px] border-[#05AEE5] bg-[#F9FAFB] text-[15px] md:text-[16px] text-[#4C4C4C] font-['Jost',sans-serif]"
      />
    </div>
  );
}

function DateTimeField({ label, required, value, onChange, className = '' }) {
  const inputRef = useRef(null);

  const openPicker = () => {
    const input = inputRef.current;
    if (!input) return;
    input.showPicker?.();
    input.focus();
  };

  return (
    <div className={className}>
      <FieldLabel label={label} required={required} />
      <div className="relative">
        <button
          type="button"
          onClick={openPicker}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05AEE5]"
        >
          <CalendarDays className="h-5 w-5" />
        </button>
        <Input
          ref={inputRef}
          type="datetime-local"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="no-native-picker h-[40px] md:h-[47px] pl-10 rounded-[6px] border-[#05AEE5] bg-[#F9FAFB] text-[15px] md:text-[16px] text-[#4C4C4C] font-['Jost',sans-serif]"
        />
      </div>
    </div>
  );
}

function DateField({ label, required, value, onChange, className = '' }) {
  const inputRef = useRef(null);

  const openPicker = () => {
    const input = inputRef.current;
    if (!input) return;
    input.showPicker?.();
    input.focus();
  };

  return (
    <div className={className}>
      <FieldLabel label={label} required={required} />
      <div className="relative">
        <button
          type="button"
          onClick={openPicker}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05AEE5]"
        >
          <CalendarDays className="h-5 w-5" />
        </button>
        <Input
          ref={inputRef}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="no-native-picker h-[40px] md:h-[47px] pl-10 rounded-[6px] border-[#05AEE5] bg-[#F9FAFB] text-[15px] md:text-[16px] text-[#4C4C4C] font-['Jost',sans-serif]"
        />
      </div>
    </div>
  );
}

function TimeField({ label, required, value, onChange, className = '' }) {
  const inputRef = useRef(null);

  const openPicker = () => {
    const input = inputRef.current;
    if (!input) return;
    input.showPicker?.();
    input.focus();
  };

  return (
    <div className={className}>
      <FieldLabel label={label} required={required} />
      <div className="relative">
        <button
          type="button"
          onClick={openPicker}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05AEE5]"
        >
          <Clock3 className="h-5 w-5" />
        </button>
        <Input
          ref={inputRef}
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="no-native-picker h-[40px] md:h-[47px] pl-10 rounded-[6px] border-[#05AEE5] bg-[#F9FAFB] text-[15px] md:text-[16px] text-[#4C4C4C] font-['Jost',sans-serif]"
        />
      </div>
    </div>
  );
}

function ChannelField({ value, onChange, className = '' }) {
  return (
    <div className={`w-full ${className}`}>
      <FieldLabel label="Channel" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full !h-[47px] min-h-[47px] py-0 rounded-[6px] border-[#05AEE5] bg-[#F9FAFB] text-[16px] text-[#4C4C4C] font-['Jost',sans-serif] text-left justify-between">
          <SelectValue placeholder="Select channel" />
        </SelectTrigger>
        <SelectContent>
          {MOCK_CHANNELS.map((channel) => (
            <SelectItem key={channel} value={channel}>
              {channel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function StageContainer({ children }) {
  return (
    <div className="relative border-2 border-[#DAE1E7] rounded-[15px] bg-white p-5 md:p-10 pt-7 md:pt-8">
      <div className="absolute left-0 top-0 h-full w-[10px] bg-[#2064B7] rounded-l-[15px]" />
      {children}
    </div>
  );
}

function ModalHeader({ title, subtitle }) {
  return (
    <div className="mb-5 md:mb-6">
      <h2 className="text-[32px] leading-tight font-semibold text-[#4C4C4C]">{title}</h2>
      <p className="text-[16px] text-[#8C8C8C] font-medium mt-1">{subtitle}</p>
    </div>
  );
}

export function FTDHOutwardTypeModal({ open, onOpenChange, onSelectSource, onSelectLayering }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[507px] max-w-[95vw] rounded-[15px] border-2 border-[#DAE1E7] p-0 overflow-hidden"
      >
        <div className="px-8 py-10 text-center">
          <div className="mx-auto mb-5 h-[100px] w-[100px] rounded-[10px] border-4 border-[#05AEE5] flex items-center justify-center">
            <IdCard className="h-12 w-12 text-[#05AEE5]" strokeWidth={2.4} />
          </div>

          <h3 className="text-[42px] sr-only">Select Outward FTDH Type</h3>
          <p className="text-[42px] sr-only">Source</p>
          <p className="text-[42px] sr-only">Layering</p>

          <p className="text-[42px] sr-only">FTDH Stage 2</p>
          <p className="text-[42px] sr-only">Outward FTDH</p>

          <p className="text-[30px] leading-[1.2] font-semibold text-[#4C4C4C] mb-8">
            Select Outward
            <br />
            FTDH Type
          </p>

          <div className="flex items-center justify-center gap-4">
            <Button
              type="button"
              className="h-[42px] w-[154px] rounded-[8px] bg-[#2064B7] hover:bg-[#1A5399] text-[20px] font-medium text-white"
              onClick={() => {
                onOpenChange(false);
                onSelectSource?.();
              }}
            >
              Source
            </Button>
            <Button
              type="button"
              className="h-[42px] w-[154px] rounded-[8px] bg-[#05AEE5] hover:bg-[#0698C7] text-[20px] font-medium text-white"
              onClick={() => {
                onOpenChange(false);
                onSelectLayering?.();
              }}
            >
              Layering
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function FTDHOutwardSourceModal({ open, onOpenChange }) {
  const [form, setForm] = useState({
    accountNumberCnic: '000017900357003',
    customerDisputeDateTime: '2025-10-09T17:30',
    eformComplaintNo: '89301',
    ftdhDisputeId: 'Raast-NayaPay-250222',
    ftdhLogDateTime: '2025-10-09T17:30',
    channel: 'Raast',
    beneficiary: 'Easypaisa',
    senderAccountNumber: 'PKa45TMBL000017900357003',
    beneficiaryAccountNumber: 'PKa45HABB000017900357003',
    trxDate: '2025-10-09',
    trxTime: '17:30',
    trxAmount: 'Pkr 24,700',
    stan: '654281',
    ftdhAging: '01',
    fundsStatus: 'SF',
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const handleCreate = () => {
    toast.success('Outward source case created successfully');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="!w-[1240px] !max-w-[96vw] sm:!max-w-[1240px] max-h-[92vh] rounded-[16px] border-0 p-0 overflow-hidden"
      >
        <div className="h-[11px] bg-[#2064B7] shrink-0" />

        <div className="p-6 md:p-11 pt-5 md:pt-8 bg-white overflow-auto">
          <DialogClose className="absolute right-7 top-7 text-[#AFAFAF] hover:text-[#4C4C4C]">
            <X className="h-9 w-9" strokeWidth={1.5} />
          </DialogClose>

          <ModalHeader
            title="Add New Outward FTDH - OnUS Record"
            subtitle="Complete the form from the below to register a new Outward FTDH record"
          />

          <StageContainer>
            <h4 className="text-[40px] sr-only">Stage 1</h4>
            <p className="text-[40px] sr-only">Customer Details</p>
            <p className="text-[40px] sr-only">FTDH Details</p>

            <p className="text-[24px] font-semibold text-[#4C4C4C] mb-3">Stage 1:</p>

            <p className="text-[16px] font-medium text-[#8C8C8C] mb-2">Customer Details</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TextField
                label="Account number / CNIC"
                value={form.accountNumberCnic}
                onChange={(v) => update('accountNumberCnic', v)}
              />
              <DateTimeField
                label="Customer Dispute Date & Time"
                required
                value={form.customerDisputeDateTime}
                onChange={(v) => update('customerDisputeDateTime', v)}
              />
              <TextField
                label="E-form / Complaint No"
                value={form.eformComplaintNo}
                onChange={(v) => update('eformComplaintNo', v)}
              />
            </div>

            <div className="h-px bg-[#DAE1E7] my-4" />

            <p className="text-[16px] font-medium text-[#8C8C8C] mb-2">FTDH Details</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <TextField
                label="FTDH Dispute ID"
                value={form.ftdhDisputeId}
                onChange={(v) => update('ftdhDisputeId', v)}
              />
              <DateTimeField
                label="FTDH Log Date & Time"
                required
                value={form.ftdhLogDateTime}
                onChange={(v) => update('ftdhLogDateTime', v)}
              />
              <ChannelField value={form.channel} onChange={(v) => update('channel', v)} />
              <TextField label="Beneficiary" value={form.beneficiary} onChange={(v) => update('beneficiary', v)} />

              <TextField label="Sender Account Number" value={form.senderAccountNumber} onChange={(v) => update('senderAccountNumber', v)} />
              <TextField label="Beneficiary Account Number" value={form.beneficiaryAccountNumber} onChange={(v) => update('beneficiaryAccountNumber', v)} />
              <DateField
                label="Trx Date"
                required
                value={form.trxDate}
                onChange={(v) => update('trxDate', v)}
              />
              <TimeField
                label="Trx Time"
                required
                value={form.trxTime}
                onChange={(v) => update('trxTime', v)}
              />

              <TextField label="Trx Amount" required value={form.trxAmount} onChange={(v) => update('trxAmount', v)} />
              <TextField label="Stan" value={form.stan} onChange={(v) => update('stan', v)} />
              <TextField label="FTDH Aging" required value={form.ftdhAging} onChange={(v) => update('ftdhAging', v)} />
              <div>
                <p className="text-[16px] font-medium text-[#4C4C4C] mb-2 font-['Jost',sans-serif]">
                  Funds Status (FTDH Portal) <span className="text-[#E20015]">*</span>
                </p>
                <div className="h-[47px] flex items-center gap-6 px-2">
                  <label className="flex items-center gap-2 text-[14px] text-[#4C4C4C] font-['Jost',sans-serif] cursor-pointer">
                    <input
                      type="radio"
                      name="fundsStatusSource"
                      value="SF"
                      checked={form.fundsStatus === 'SF'}
                      onChange={(e) => update('fundsStatus', e.target.value)}
                      className="h-[18px] w-[18px] accent-[#2064B7]"
                    />
                    SF
                  </label>
                  <label className="flex items-center gap-2 text-[14px] text-[#4C4C4C] font-['Jost',sans-serif] cursor-pointer">
                    <input
                      type="radio"
                      name="fundsStatusSource"
                      value="NSF"
                      checked={form.fundsStatus === 'NSF'}
                      onChange={(e) => update('fundsStatus', e.target.value)}
                      className="h-[18px] w-[18px] accent-[#2064B7]"
                    />
                    NSF
                  </label>
                </div>
              </div>
            </div>
          </StageContainer>

          <div className="mt-5 flex justify-end">
            <Button
              type="button"
              className="h-10 px-6 text-sm bg-[#2064B7] hover:bg-[#1a5399] text-white rounded-lg font-medium"
              onClick={handleCreate}
            >
              Create
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function FTDHOutwardLayeringModal({ open, onOpenChange }) {
  const [form, setForm] = useState({
    bankName: 'NayaPay',
    bankFtdhDisputeId: 'Raast-NayaPay-250222',
    bankFtdhReceivingDateTime: '2025-10-09T17:30',
    ftdhDisputeId: 'Raast-NayaPay-250222',
    ftdhLogDateTime: '2025-10-09T17:30',
    channel: 'Raast',
    beneficiary: 'HBL',
    senderAccountNumber: 'PKa45TMBL000017900357003',
    beneficiaryAccountNumber: 'PKa45HABB000017900357003',
    trxDate: '2025-10-09',
    trxTime: '17:30',
    trxAmount: 'Pkr 24,700',
    stan: '654281',
    ftdhAging: '01',
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const handleCreate = () => {
    toast.success('Outward layering case created successfully');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="!w-[1240px] !max-w-[96vw] sm:!max-w-[1240px] max-h-[92vh] rounded-[16px] border-0 p-0 overflow-hidden"
      >
        <div className="h-[11px] bg-[#2064B7] shrink-0" />

        <div className="p-6 md:p-11 pt-5 md:pt-8 bg-white overflow-auto">
          <DialogClose className="absolute right-7 top-7 text-[#AFAFAF] hover:text-[#4C4C4C]">
            <X className="h-9 w-9" strokeWidth={1.5} />
          </DialogClose>

          <ModalHeader
            title="Add New Outward FTDH Layer Record"
            subtitle="Complete the form from the below to register a new Outward FTDH record"
          />

          <StageContainer>
            <p className="text-[16px] font-medium text-[#8C8C8C] mb-2">Sender Bank Details</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TextField label="Bank Name" value={form.bankName} onChange={(v) => update('bankName', v)} />
              <TextField label="Bank FTDH Dispute ID" value={form.bankFtdhDisputeId} onChange={(v) => update('bankFtdhDisputeId', v)} />
              <DateTimeField
                label="Bank FTDH Receiving Date & Time"
                required
                value={form.bankFtdhReceivingDateTime}
                onChange={(v) => update('bankFtdhReceivingDateTime', v)}
              />
            </div>

            <div className="h-px bg-[#DAE1E7] my-4" />

            <p className="text-[16px] font-medium text-[#8C8C8C] mb-2">FTDH Details</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <TextField label="FTDH Dispute ID" value={form.ftdhDisputeId} onChange={(v) => update('ftdhDisputeId', v)} />
              <DateTimeField
                label="FTDH Log Date & Time"
                required
                value={form.ftdhLogDateTime}
                onChange={(v) => update('ftdhLogDateTime', v)}
              />
              <ChannelField value={form.channel} onChange={(v) => update('channel', v)} />
              <TextField label="Beneficiary" value={form.beneficiary} onChange={(v) => update('beneficiary', v)} />

              <TextField label="Sender Account Number" value={form.senderAccountNumber} onChange={(v) => update('senderAccountNumber', v)} />
              <TextField label="Beneficiary Account Number" value={form.beneficiaryAccountNumber} onChange={(v) => update('beneficiaryAccountNumber', v)} />
              <DateField
                label="Trx Date"
                required
                value={form.trxDate}
                onChange={(v) => update('trxDate', v)}
              />
              <TimeField
                label="Trx Time"
                required
                value={form.trxTime}
                onChange={(v) => update('trxTime', v)}
              />

              <TextField label="Trx Amount" required value={form.trxAmount} onChange={(v) => update('trxAmount', v)} />
              <TextField label="Stan" value={form.stan} onChange={(v) => update('stan', v)} />
              <TextField label="FTDH Aging" required value={form.ftdhAging} onChange={(v) => update('ftdhAging', v)} />
            </div>
          </StageContainer>

          <div className="mt-5 flex justify-end">
            <Button
              type="button"
              className="h-10 px-6 text-sm bg-[#2064B7] hover:bg-[#1a5399] text-white rounded-lg font-medium"
              onClick={handleCreate}
            >
              Create
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
