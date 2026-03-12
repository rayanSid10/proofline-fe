import { useState, useEffect, useCallback } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  formatDateTime,
  formatAmount,
} from '@/data/mockFTDH';
import { ftdhAPI } from '@/api/ftdh';

// ─── Shared field components ─────────────────────────────────────────────────

function FieldLabel({ children, required, subText }) {
  return (
    <div className="mb-1.5">
      <Label className="text-[12px] font-medium text-gray-700 block">
        {children}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {subText && (
        <span className="text-[10px] text-gray-400 block mt-0.5">{subText}</span>
      )}
    </div>
  );
}

function ReadOnlyInput({ value }) {
  return (
    <div className="h-9 px-3 flex items-center bg-[#F4F7FE] border border-[#E2E8F0] rounded-md text-sm text-gray-700">
      {value || '—'}
    </div>
  );
}

function FormInput({ value, onChange, placeholder, type = 'text', disabled = false, ...props }) {
  return (
    <Input
      type={type}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`h-9 text-sm border-[#E2E8F0] ${disabled ? 'bg-[#F4F7FE] border-[#E2E8F0] text-gray-700 placeholder:text-gray-400 disabled:opacity-100 cursor-default' : 'bg-white'}`}
      {...props}
    />
  );
}

function RadioPair({ name, value, onChange, options, disabled = false }) {
  return (
    <div className="flex gap-4">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`flex items-center gap-2 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div
            className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-colors ${
              value === opt.value
                ? disabled
                  ? 'border-[#9DB3D8] bg-[#9DB3D8]'
                  : 'border-[#2064B7] bg-[#2064B7]'
                : disabled
                  ? 'border-gray-300 bg-white'
                  : 'border-gray-300 bg-white'
            }`}
          >
            {value === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={(e) => !disabled && onChange(e.target.value)}
            disabled={disabled}
            className="sr-only"
          />
          <span className={`text-sm ${disabled ? 'text-gray-500' : 'text-gray-700'}`}>{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

// ─── Reminder date field — has title with superscript side text + subtext ────

function ReminderDateField({ label, sideText, subText, value, disabled = false, onChange }) {
  return (
    <div>
      <div className="mb-1.5">
        <span className="text-[12px] font-medium text-gray-700">
          {label}
        </span>
        {sideText && (
          <span className="text-[10px] font-semibold text-gray-500 ml-1">{sideText}</span>
        )}
        {subText && (
          <span className="text-[10px] text-gray-400 block">
            {subText.endsWith('*') ? (
              <>{subText.slice(0, -1)}<span className="text-red-500">*</span></>
            ) : subText}
          </span>
        )}
      </div>
      <FormInput
        type="datetime-local"
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}

// ─── Stage Card wrapper — all stages use blue left bar ──────────────────────

function StageCard({ number, subtitle, children }) {
  return (
    <div className="relative rounded-[15px] border-2 border-[#D5E6FB] bg-white overflow-hidden">
      {/* Left color bar — always blue */}
      <div className="absolute left-0 top-0 bottom-0 w-[6px] rounded-l-[15px] bg-[#2064B7]" />

      {/* Content */}
      <div className="pl-7 pr-6 py-5">
        <div className="mb-4">
          <h3 className="text-[15px] font-bold text-gray-900">Stage {number}:</h3>
          <p className="text-[12px] text-gray-500">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Main Modal Component ────────────────────────────────────────────────────

export function FTDHCaseUpdateModal({ open, onOpenChange, caseData, onCaseUpdated, onGenerateReport }) {
  const [formData, setFormData] = useState(null);
  const [initialFormData, setInitialFormData] = useState(null);
  const [stanceFiles, setStanceFiles] = useState([]);

  useEffect(() => {
    if (!open || !caseData) return;

    // If caseData already has full detail (actionsTaken present), use it directly.
    if (caseData.actionsTaken) {
      const loaded = JSON.parse(JSON.stringify(caseData, (key, value) => {
        if (value instanceof Date) return value.toISOString();
        return value;
      }));
      setFormData(loaded);
      setInitialFormData(loaded);
      setStanceFiles([]);
      return;
    }

    // List-level data — fetch full detail from API.
    let cancelled = false;
    (async () => {
      try {
        const res = await ftdhAPI.getInward(caseData.id);
        if (!cancelled) {
          const loaded = JSON.parse(JSON.stringify(res.data, (key, value) => {
            if (value instanceof Date) return value.toISOString();
            return value;
          }));
          setFormData(loaded);
          setInitialFormData(loaded);
          setStanceFiles([]);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch case detail for update modal:', err);
          // Fallback to whatever we have
          const loaded = JSON.parse(JSON.stringify(caseData, (key, value) => {
            if (value instanceof Date) return value.toISOString();
            return value;
          }));
          setFormData(loaded);
          setInitialFormData(loaded);
          setStanceFiles([]);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [open, caseData]);

  useEffect(() => {
    if (!open) { setFormData(null); setInitialFormData(null); setStanceFiles([]); }
  }, [open]);

  const handleStanceFileSelect = useCallback((e) => {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length) {
      setStanceFiles((prev) => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} file(s) added`);
    }
    e.target.value = '';
  }, []);

  const removeStanceFile = useCallback((index) => {
    setStanceFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateField = useCallback((section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  }, []);

  const updateInit = (f, v) => updateField('initialData', f, v);
  const updateAction = (f, v) => updateField('actionsTaken', f, v);
  const updateBranch = (f, v) => updateField('branchCommunication', f, v);
  const updateMemberBank = (f, v) => updateField('memberBankCommunication', f, v);
  const updateChannelActivation = (f, v) => updateField('channelActivation', f, v);

  const getFundsAvailabilityValue = useCallback((actions = {}) => {
    if (actions.fundsAvailabilityStatus) return actions.fundsAvailabilityStatus;
    if (actions.fundsStatus === 'SF') return 'full';
    if (actions.fundsStatus === 'NSF') return 'partial';
    return 'na';
  }, []);

  // Update a field inside bc.stageData[stageKey] (for Stage 3 editable fields)
  const updateStageData = useCallback((stageKey, field, value) => {
    setFormData((prev) => ({
      ...prev,
      branchCommunication: {
        ...prev.branchCommunication,
        stageData: {
          ...prev.branchCommunication?.stageData,
          [stageKey]: {
            ...prev.branchCommunication?.stageData?.[stageKey],
            [field]: value,
          },
        },
      },
    }));
  }, []);

  const handleUpdate = useCallback(() => {
    toast.success('FTDH case updated successfully');
    onCaseUpdated?.(formData);
  }, [formData, onCaseUpdated]);

  if (!formData) return null;

  const { initialData: init, actionsTaken: act, branchCommunication: bc, memberBankCommunication: mb, channelActivation: ca = {
    profileReview: 'Yes',
    accountOpeningDate: '2024-01-15',
    accountType: 'current',
    accountActivity: 'Satisfactory',
    highlighted: 'Yes',
    referenceFtdhId: '',
    finalDecision: 'ADC Channel Activated', 
    decisionDate: formData.updatedAt,
    decisionRationale: ''
  } } = formData;
  const branchState = bc?.branchCommunicationState || 'not_started';

  // ─── Helpers for date formatting to datetime-local input value ────────
  const toDatetimeLocal = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
  };

  const toDateOnly = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '';
    return dt.toISOString().slice(0, 10);
  };

  // ─── Stage 3: determine which reminder level we're at ─────────────────
  const getStage3Level = () => {
    if (branchState === 'not_started' || branchState === 'initial_sent_waiting') return 'initial';
    if (branchState === '1st_reminder_sent_waiting') return '1st';
    if (branchState === '2nd_reminder_sent_waiting') return '2nd';
    if (branchState === '3rd_reminder_sent_waiting') return '3rd';
    if (branchState === 'business_consideration') return 'bc';
    if (branchState === 'stance_received') {
      // Figure out from which level stance was received
      if (bc.customerStance3rdReminder === 'Yes') return '3rd';
      if (bc.customerStance2ndReminder === 'Yes') return '2nd';
      if (bc.customerStance1stReminder === 'Yes') return '1st';
      return 'initial';
    }
    return 'initial';
  };

  const stage3Level = getStage3Level();

  // Determine if stance is Yes at current level
  const getStanceAtLevel = () => {
    if (stage3Level === 'initial') return bc.customerStanceInitial;
    if (stage3Level === '1st') return bc.customerStance1stReminder;
    if (stage3Level === '2nd') return bc.customerStance2ndReminder;
    if (stage3Level === '3rd') return bc.customerStance3rdReminder;
    if (stage3Level === 'bc') return bc.stageData?.business_consideration?.stanceReceived || null;
    return null;
  };

  const currentStance = getStanceAtLevel();

  // ─── Subtext for "Customer Stance Received" ───────────────────────────
  const getStanceSubText = () => {
    if (stage3Level === 'initial') return '(Against Initial Intimation)';
    if (stage3Level === '1st') return '(Against 1st reminder)';
    if (stage3Level === '2nd') return '(Against 2nd reminder)';
    if (stage3Level === '3rd') return '(Against 3rd reminder)';
    if (stage3Level === 'bc') return '(Business Consideration)';
    return '';
  };

  // ─── Stance change handler ────────────────────────────────────────────
  const handleStanceChange = (value) => {
    if (stage3Level === 'initial') updateBranch('customerStanceInitial', value);
    else if (stage3Level === '1st') updateBranch('customerStance1stReminder', value);
    else if (stage3Level === '2nd') updateBranch('customerStance2ndReminder', value);
    else if (stage3Level === '3rd') updateBranch('customerStance3rdReminder', value);
    else if (stage3Level === 'bc') updateStageData('business_consideration', 'stanceReceived', value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="w-[95vw] max-h-[92vh] p-0 gap-0 rounded-2xl overflow-hidden flex flex-col border-0" style={{ maxWidth: '1200px' }}>
        <VisuallyHidden.Root asChild>
          <DialogTitle>FTDH Case Update</DialogTitle>
        </VisuallyHidden.Root>
        {/* Header */}
        <div className="px-8 pt-6 pb-4 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[20px] font-bold text-gray-900">Add New FTDH Record</h2>
              <p className="text-[13px] text-gray-500 mt-0.5">
                Complete the form from the below to register a new Inward FTDH record
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable content — all 4 stages */}
        <div className="flex-1 overflow-y-auto px-8 pb-6 space-y-6 min-h-0">

          {/* ═══ STAGE 1: Inward FTDH Initial Data ═══════════════════════════ */}
          <StageCard number={1} subtitle="Inward FTDH Initial Data">
            <div className="grid grid-cols-4 gap-x-5 gap-y-4">
              {/* Row 1 */}
              <div>
                <FieldLabel>FTDH Dispute ID</FieldLabel>
                <ReadOnlyInput value={init.disputeId} />
              </div>
              <div>
                <FieldLabel required>FTDH Receiving Date & Time</FieldLabel>
                <FormInput
                  type="datetime-local"
                  value={toDatetimeLocal(init.ftdhReceivingDateTime)}
                  disabled
                  onChange={(e) => updateInit('ftdhReceivingDateTime', e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Channel</FieldLabel>
                <Select
                  value={init.channel || ''}
                  onValueChange={(v) => updateInit('channel', v)}
                  disabled
                >
                  <SelectTrigger className="h-9 text-sm border-[#E2E8F0] bg-white data-[disabled]:bg-[#F4F7FE] data-[disabled]:text-gray-700 data-[disabled]:border-[#E2E8F0] data-[disabled]:opacity-100 data-[disabled]:cursor-default">
                    <SelectValue placeholder="Select Channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Raast">Raast</SelectItem>
                    <SelectItem value="IBFT">IBFT</SelectItem>
                    <SelectItem value="Internet Banking">Internet Banking</SelectItem>
                    <SelectItem value="Mobile Banking">Mobile Banking</SelectItem>
                    <SelectItem value="ATM">ATM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabel>Sender Name</FieldLabel>
                <FormInput
                  value={init.sendingBank?.split('(')[0]?.trim() || ''}
                  disabled
                  onChange={(e) => updateInit('sendingBank', e.target.value)}
                />
              </div>

              {/* Row 2 */}
              <div>
                <FieldLabel>Sender Account Number</FieldLabel>
                <ReadOnlyInput value={init.senderAccount} />
              </div>
              <div>
                <FieldLabel>Beneficiary Account Number</FieldLabel>
                <ReadOnlyInput value={init.beneficiaryAccount} />
              </div>
              <div>
                <FieldLabel>Customer Dispute Date & Time</FieldLabel>
                <FormInput
                  type="datetime-local"
                  value={toDatetimeLocal(init.transactionDateTime)}
                  disabled
                  onChange={(e) => updateInit('transactionDateTime', e.target.value)}
                />
              </div>
              <div>
                <FieldLabel required>Trx Date</FieldLabel>
                <FormInput
                  type="date"
                  value={toDateOnly(init.transactionDateTime)}
                  disabled
                  onChange={(e) => updateInit('transactionDateTime', e.target.value)}
                />
              </div>

              {/* Row 3 */}
              <div>
                <FieldLabel required>Trx Time</FieldLabel>
                <FormInput
                  type="time"
                  value={init.transactionDateTime ? (() => { const d = new Date(init.transactionDateTime); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; })() : ''}
                    disabled
                  onChange={() => {}}
                />
              </div>
              <div>
                <FieldLabel required>Trx Amount</FieldLabel>
                <ReadOnlyInput value={init.amount ? formatAmount(init.amount) : null} />
              </div>
              <div>
                <FieldLabel>Stan</FieldLabel>
                <ReadOnlyInput value={init.stan} />
              </div>
              <div>
                <FieldLabel required>FTDH Aging</FieldLabel>
                <ReadOnlyInput value={
                  init.ftdhReceivingDateTime
                    ? `${Math.max(0, Math.floor((Date.now() - new Date(init.ftdhReceivingDateTime).getTime()) / (1000 * 60 * 60 * 24)))}`
                    : null
                } />
              </div>
            </div>

            {/* Action Taken */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <FieldLabel required>Action Taken</FieldLabel>
              <div className="mt-1">
                <RadioPair
                  name="actionTaken"
                  value={act.actionTaken}
                  onChange={(v) => updateAction('actionTaken', v)}
                  options={[
                    { value: 'Invalid', label: 'Invalid' },
                    { value: 'Acknowledge', label: 'Acknowledge' },
                  ]}
                />
              </div>
            </div>

            {act.actionTaken === 'Invalid' && (
              <div className="mt-3">
                <FieldLabel required>Invalid Reason</FieldLabel>
                <Textarea
                  value={act.invalidReason || ''}
                  onChange={(e) => updateAction('invalidReason', e.target.value)}
                  placeholder="Enter reason..."
                  rows={2}
                  className="text-sm border-[#E2E8F0]"
                />
              </div>
            )}

            {act.actionTaken === 'Acknowledge' && (
              <div className="grid grid-cols-4 gap-x-5 gap-y-4 mt-4">
                <div>
                  <FieldLabel required>Acknowledge Date & Time</FieldLabel>
                  <FormInput
                    type="datetime-local"
                    value={toDatetimeLocal(act.acknowledgeDate)}
                    disabled
                    onChange={() => {}}
                  />
                </div>
                <div>
                  <FieldLabel required>Funds Status</FieldLabel>
                  <RadioPair
                    name="fundsStatus"
                    value={act.fundsStatus}
                    onChange={(v) => updateAction('fundsStatus', v)}
                    options={[
                      { value: 'SF', label: 'Sufficient Fund' },
                      { value: 'NSF', label: 'Non-Sufficient Fund' },
                    ]}
                  />
                </div>
                <div>
                  <FieldLabel required>Funds Availability Status</FieldLabel>
                  <RadioPair
                    name="fundsAvailability"
                    value={getFundsAvailabilityValue(act)}
                    onChange={(v) => updateAction('fundsAvailabilityStatus', v)}
                    options={[
                      { value: 'full', label: 'Full' },
                      { value: 'partial', label: 'Partial' },
                      { value: 'na', label: 'N/A' },
                    ]}
                  />
                </div>
                <div>
                  <FieldLabel required>Funds on Hold</FieldLabel>
                  <FormInput
                    value={act.fundsOnHold != null ? Number(act.fundsOnHold).toLocaleString('en-PK') : ''}
                    onChange={(e) => updateAction('fundsOnHold', Number(e.target.value.replace(/[^0-9]/g, '')))}
                    placeholder="Enter Amount"
                  />
                </div>
                <div>
                  <FieldLabel required>Channel Blocking Date & Time</FieldLabel>
                  <FormInput
                    type="datetime-local"
                    value={toDatetimeLocal(act.channelBlockingDate)}
                    onChange={(e) => updateAction('channelBlockingDate', e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel required>Funds Layering</FieldLabel>
                  <RadioPair
                    name="fundsLayering"
                    value={act.fundsLayering === true ? 'Yes' : act.fundsLayering === false ? 'No' : null}
                    onChange={(v) => updateAction('fundsLayering', v === 'Yes')}
                    options={[
                      { value: 'Yes', label: 'Yes' },
                      { value: 'No', label: 'No' },
                    ]}
                    disabled
                  />
                </div>
                <div>
                  <FieldLabel required>Funds Layering Date & Time</FieldLabel>
                  <FormInput
                    type="datetime-local"
                    value={toDatetimeLocal(act.fundsLayeringDate)}
                    disabled
                    onChange={() => {}}
                  />
                </div>
                <div>
                  <FieldLabel required>Funds Layering ID</FieldLabel>
                  <FormInput
                    value={act.fundsLayeringId || ''}
                    disabled
                    onChange={(e) => updateAction('fundsLayeringId', e.target.value)}
                    placeholder="Enter ID, DG..."
                  />
                </div>
                <div>
                  <FieldLabel required>Lien Mark</FieldLabel>
                  <RadioPair
                    name="lienMarked"
                    value={act.lienMarked === true ? 'Yes' : act.lienMarked === false ? 'No' : null}
                    onChange={(v) => updateAction('lienMarked', v === 'Yes')}
                    options={[
                      { value: 'Yes', label: 'Yes' },
                      { value: 'No', label: 'No' },
                    ]}
                  />
                </div>
                <div>
                  <FieldLabel required>Lien Mark Date & Time</FieldLabel>
                  <FormInput
                    type="datetime-local"
                    value={toDatetimeLocal(act.lienMarkDate)}
                    onChange={(e) => updateAction('lienMarkDate', e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel required>Intimation to Branch</FieldLabel>
                  <RadioPair
                    name="intimationBranch"
                    value={bc.initialIntimationSent ? 'Yes' : 'No'}
                    onChange={() => {}}
                    options={[
                      { value: 'Yes', label: 'Yes' },
                      { value: 'No', label: 'No' },
                    ]}
                    disabled
                  />
                </div>
                <div>
                  <FieldLabel required>Intimation Date & Time</FieldLabel>
                  <FormInput
                    type="datetime-local"
                    value={toDatetimeLocal(bc.initialIntimationDate)}
                    disabled
                    onChange={() => {}}
                  />
                </div>
              </div>
            )}
          </StageCard>

          {/* ═══ STAGE 2: Channel Activation Actions ═════════════════════════ */}
          <StageCard number={2} subtitle="Channel Activation Actions">
            <div className="grid grid-cols-4 gap-x-5 gap-y-4">
              <div>
                <FieldLabel required>Customer Profile Review</FieldLabel>
                <RadioPair
                  name="profileReview"
                  value={ca.profileReview || 'Yes'}
                  onChange={(v) => updateChannelActivation('profileReview', v)}
                  options={[
                    { value: 'Yes', label: 'Yes' },
                    { value: 'No', label: 'No' },
                  ]}
                />
              </div>
              <div>
                <FieldLabel required>Account Opening Date</FieldLabel>
                <FormInput
                  type="date"
                  value={ca.accountOpeningDate || ''}
                  onChange={(e) => updateChannelActivation('accountOpeningDate', e.target.value)}
                />
              </div>
              <div>
                <FieldLabel required>Account Type</FieldLabel>
                <Select
                  value={ca.accountType || 'current'}
                  onValueChange={(v) => updateChannelActivation('accountType', v)}
                >
                  <SelectTrigger className="h-9 text-sm border-[#E2E8F0] bg-white w-full data-[disabled]:bg-[#F4F7FE] data-[disabled]:text-gray-700 data-[disabled]:border-[#E2E8F0] data-[disabled]:opacity-100 data-[disabled]:cursor-default">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Current</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabel required>Customer Account Activity Status</FieldLabel>
                <RadioPair
                  name="accountActivity"
                  value={ca.accountActivity || 'Satisfactory'}
                  onChange={(v) => updateChannelActivation('accountActivity', v)}
                  options={[
                    { value: 'Satisfactory', label: 'Satisfactory' },
                    { value: 'Unsatisfactory', label: 'Unsatisfactory' },
                  ]}
                />
              </div>

              <div>
                <FieldLabel required>Account Highlighted Previously</FieldLabel>
                <RadioPair
                  name="highlighted"
                  value={ca.highlighted || 'Yes'}
                  onChange={(v) => updateChannelActivation('highlighted', v)}
                  options={[
                    { value: 'Yes', label: 'Yes' },
                    { value: 'No', label: 'No' },
                  ]}
                />
              </div>
              <div>
                <FieldLabel required>Reference FTDH ID</FieldLabel>
                <FormInput
                  value={ca.referenceFtdhId || ''}
                  onChange={(e) => updateChannelActivation('referenceFtdhId', e.target.value)}
                  placeholder="Enter ID1, D12, ..."
                />
              </div>
              <div>
                <FieldLabel required>Final Decision</FieldLabel>
                <RadioPair
                  name="finalDecision"
                  value={ca.finalDecision || 'ADC Channel Activated'}
                  onChange={(v) => updateChannelActivation('finalDecision', v)}
                  options={[
                    { value: 'ADC Channel Activated', label: 'ADC Channel Activated' },
                    { value: 'Not Activated', label: 'Not Activated' },
                  ]}
                />
              </div>
              <div>
                <FieldLabel>Decision Date & Time</FieldLabel>
                <FormInput
                  type="datetime-local"
                  value={toDatetimeLocal(ca.decisionDate)}
                  onChange={(e) => updateChannelActivation('decisionDate', e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4">
              <FieldLabel required>Decision Rationale</FieldLabel>
              <Textarea
                value={ca.decisionRationale || ''}
                onChange={(e) => updateChannelActivation('decisionRationale', e.target.value)}
                placeholder="Enter Comments"
                rows={2}
                className="text-sm border-[#E2E8F0]"
              />
            </div>
          </StageCard>

          {/* ═══ STAGE 3: Follow-up with Branch ══════════════════════════════ */}
          <StageCard number={3} subtitle="Follow-up with Branch">
            {(() => {
              // Map frontend level → stageData key
              const stageDataKey = { initial: 'initial', '1st': 'reminder_1', '2nd': 'reminder_2', '3rd': 'reminder_3', bc: 'business_consideration' }[stage3Level] || 'initial';
              const stageInfo = bc.stageData?.[stageDataKey] || {};
              const initialStageInfo = initialFormData?.branchCommunication?.stageData?.[stageDataKey] || {};
              const lockByPrefilledAccept = initialStageInfo.stanceAcceptable === 'Yes';

              // All reminder configs
              const reminders = [
                { key: '1st', label: '1st Reminder', sideText: 'Marke To BR', subText: '(On 3rd day of FTDH received)', date: bc.firstReminderDate },
                { key: '2nd', label: '2nd Reminder', sideText: 'Escalation to Area Management', subText: '(On 5th day of FTDH received)', date: bc.secondReminderDate },
                { key: '3rd', label: '3rd Reminder', sideText: 'to Regional Management', subText: '(On 8th day of FTDH received)', date: bc.thirdReminderDate },
              ];
              const levelOrder = ['initial', '1st', '2nd', '3rd', 'bc'];
              const currentIdx = levelOrder.indexOf(stage3Level);
              // Reminders already sent (shown disabled) — bc shows all 3 same as 3rd
              const sentReminders = reminders.slice(0, Math.min(currentIdx, 3));
              // Next reminder (shown when stance = No) — bc has no next reminder
              const nextReminder = currentIdx < 4 && currentIdx < reminders.length ? reminders[currentIdx] : null;
              // compact = initial/1st (≤1 reminder → room for review fields in Row 1)
              const compactLayout = currentIdx <= 1;
              // Pre-attached customer stance files from backend
              const preAttachedFiles = stageInfo.attachments || [];

              return (
                <>
                  {/* ─── Row 1 ─── */}
                  <div className="grid grid-cols-4 gap-x-5 gap-y-4">
                    {/* Customer Stance Received */}
                    <div>
                      <div className="mb-1.5">
                        <Label className="text-[12px] font-medium text-gray-700 block">
                          Customer Stance Received
                        </Label>
                        <span className="text-[10px] text-gray-400 block">
                          {getStanceSubText()}<span className="text-red-500 ml-0.5">*</span>
                        </span>
                      </div>
                      <RadioPair
                        name="branchStance"
                        value={currentStance || ''}
                        onChange={handleStanceChange}
                        options={[
                          { value: 'Yes', label: 'Yes' },
                          { value: 'No', label: 'No' },
                        ]}
                        disabled={stageInfo.stanceAcceptable === 'Yes'}
                        disabled={lockByPrefilledAccept}
                      />
                    </div>

                    {/* Past sent reminders — always shown disabled */}
                    {sentReminders.map((r) => (
                      <ReminderDateField
                        key={r.key}
                        label={r.label}
                        sideText={r.sideText}
                        subText={r.subText}
                        value={toDatetimeLocal(r.date)}
                        disabled
                        onChange={() => {}}
                      />
                    ))}

                    {/* Stance=Yes, initial only → Received Date in Row 1 */}
                    {currentStance === 'Yes' && currentIdx === 0 && (
                      <div>
                        <FieldLabel required>Customer Stance Received Date</FieldLabel>
                        <FormInput
                          type="date"
                          value={toDateOnly(stageInfo.stanceReceivedDate)}
                          onChange={(e) => updateStageData(stageDataKey, 'stanceReceivedDate', e.target.value)}
                        />
                      </div>
                    )}

                    {/* Stance=Yes, compact (initial/1st) → Reviewed + Reviewed Date in Row 1 */}
                    {currentStance === 'Yes' && compactLayout && (
                      <>
                        <div>
                          <FieldLabel required>Stance Reviewed</FieldLabel>
                          <RadioPair
                            name="stanceReviewed"
                            value={stageInfo.stanceReviewed || ''}
                            onChange={(v) => updateStageData(stageDataKey, 'stanceReviewed', v)}
                            options={[
                              { value: 'Yes', label: 'Yes' },
                              { value: 'No', label: 'No' },
                            ]}
                          />
                        </div>
                        <div>
                          <FieldLabel required>Stance Reviewed Date</FieldLabel>
                          <FormInput
                            type="date"
                            value={toDateOnly(stageInfo.stanceReviewedDate)}
                            onChange={(e) => updateStageData(stageDataKey, 'stanceReviewedDate', e.target.value)}
                          />
                        </div>
                      </>
                    )}

                    {/* Stance=No → next reminder */}
                    {currentStance === 'No' && nextReminder && (
                      <ReminderDateField
                        label={nextReminder.label}
                        sideText={nextReminder.sideText}
                        subText={nextReminder.subText}
                        value={toDatetimeLocal(nextReminder.date)}
                        disabled={!!nextReminder.date}
                        onChange={() => {}}
                      />
                    )}
                  </div>

                  {/* MIS warning at 3rd/bc level when no stance received */}
                  {(stage3Level === '3rd' || stage3Level === 'bc') && currentStance === 'No' && (
                    <div className="mt-4 flex items-center gap-3 p-3 rounded-md bg-red-50 border-l-4 border-red-500">
                      <p className="text-sm text-red-700">
                        Record has been updated in monthly MIS for business consideration
                      </p>
                    </div>
                  )}

                  {/* ─── Stance=Yes, compact (initial/1st): Row 2 — Acceptable + date + evidence ─── */}
                  {currentStance === 'Yes' && compactLayout && (
                    <div className="grid grid-cols-4 gap-x-5 gap-y-4 mt-4">
                      <div>
                        <FieldLabel required>Stance Acceptable</FieldLabel>
                        <RadioPair
                          name="stanceAcceptable"
                          value={stageInfo.stanceAcceptable || ''}
                          onChange={(v) => updateStageData(stageDataKey, 'stanceAcceptable', v)}
                          options={[
                            { value: 'Yes', label: 'Yes' },
                            { value: 'No', label: 'No' },
                          ]}
                          disabled={lockByPrefilledAccept}
                        />
                      </div>
                      {currentIdx === 0 && stageInfo.stanceAcceptable !== 'Yes' ? (
                        <div>
                          <div className="mb-1.5">
                            <Label className="text-[12px] font-medium text-gray-700 block">
                              Stance Reverted to branch
                            </Label>
                            <span className="text-[10px] text-gray-400 block">
                              (for resubmission)<span className="text-red-500 ml-0.5">*</span>
                            </span>
                          </div>
                          <FormInput
                            type="date"
                            value={toDateOnly(stageInfo.stanceRevertedDate)}
                            onChange={(e) => updateStageData(stageDataKey, 'stanceRevertedDate', e.target.value)}
                          />
                        </div>
                      ) : (
                        <div>
                          <FieldLabel required>Stance Acceptable Date</FieldLabel>
                          <FormInput
                            type="date"
                            value={toDateOnly(stageInfo.stanceAcceptableDate)}
                            onChange={(e) => updateStageData(stageDataKey, 'stanceAcceptableDate', e.target.value)}
                          />
                        </div>
                      )}
                      <div>
                        <FieldLabel>Customer Stance with Evidences</FieldLabel>
                        {currentIdx === 0 && (
                          <span className="text-[10px] text-transparent block mt-0.5 select-none">&nbsp;</span>
                        )}
                        {preAttachedFiles.length > 0 && (
                          <div className="mb-2 space-y-1">
                            {preAttachedFiles.map((f) => (
                              <a key={f.id} href={f.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-[#2064B7] hover:underline truncate">
                                <span>📎</span> {f.original_name}
                              </a>
                            ))}
                          </div>
                        )}
                        {stanceFiles.length > 0 && (
                          <div className="mb-2 space-y-1">
                            {stanceFiles.map((f, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-700">
                                <span>📄</span>
                                <span className="truncate">{f.name}</span>
                                <button type="button" onClick={() => removeStanceFile(idx)} className="ml-1 text-red-400 hover:text-red-600 text-xs font-bold">✕</button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <input type="file" multiple accept=".png,.pdf,.jpg,.jpeg,.docx" className="hidden" onChange={handleStanceFileSelect} />
                          <Button
                            variant="outline"
                            className="h-9 px-5 text-sm border-[#2064B7] text-[#2064B7] hover:bg-[#2064B7]/5 font-medium"
                            onClick={(e) => e.currentTarget.parentNode.querySelector('input[type=file]').click()}
                          >
                            Choose File
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ─── Stance=Yes, full layout (2nd/3rd): Row 2 — Reviewed + Acceptable, Row 3 — evidence ─── */}
                  {currentStance === 'Yes' && !compactLayout && (
                    <>
                      <div className="grid grid-cols-4 gap-x-5 gap-y-4 mt-4">
                        <div>
                          <FieldLabel required>Stance Reviewed</FieldLabel>
                          <RadioPair
                            name="stanceReviewed"
                            value={stageInfo.stanceReviewed || ''}
                            onChange={(v) => updateStageData(stageDataKey, 'stanceReviewed', v)}
                            options={[
                              { value: 'Yes', label: 'Yes' },
                              { value: 'No', label: 'No' },
                            ]}
                          />
                        </div>
                        <div>
                          <FieldLabel required>Stance Reviewed Date</FieldLabel>
                          <FormInput
                            type="date"
                            value={toDateOnly(stageInfo.stanceReviewedDate)}
                            onChange={(e) => updateStageData(stageDataKey, 'stanceReviewedDate', e.target.value)}
                          />
                        </div>
                        <div>
                          <FieldLabel required>Stance Acceptable</FieldLabel>
                          <RadioPair
                            name="stanceAcceptable"
                            value={stageInfo.stanceAcceptable || ''}
                            onChange={(v) => updateStageData(stageDataKey, 'stanceAcceptable', v)}
                            options={[
                              { value: 'Yes', label: 'Yes' },
                              { value: 'No', label: 'No' },
                            ]}
                            disabled={lockByPrefilledAccept}
                          />
                        </div>
                        <div>
                          <FieldLabel required>Stance Acceptable Date</FieldLabel>
                          <FormInput
                            type="date"
                            value={toDateOnly(stageInfo.stanceAcceptableDate)}
                            onChange={(e) => updateStageData(stageDataKey, 'stanceAcceptableDate', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <FieldLabel>Customer Stance with Evidences</FieldLabel>
                        {preAttachedFiles.length > 0 && (
                          <div className="mb-2 space-y-1">
                            {preAttachedFiles.map((f) => (
                              <a key={f.id} href={f.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-[#2064B7] hover:underline truncate">
                                <span>📎</span> {f.original_name}
                              </a>
                            ))}
                          </div>
                        )}
                        {stanceFiles.length > 0 && (
                          <div className="mb-2 space-y-1">
                            {stanceFiles.map((f, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-700">
                                <span>📄</span>
                                <span className="truncate">{f.name}</span>
                                <button type="button" onClick={() => removeStanceFile(idx)} className="ml-1 text-red-400 hover:text-red-600 text-xs font-bold">✕</button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <input type="file" multiple accept=".png,.pdf,.jpg,.jpeg,.docx" className="hidden" onChange={handleStanceFileSelect} />
                          <Button
                            variant="outline"
                            className="h-9 px-5 text-sm border-[#2064B7] text-[#2064B7] hover:bg-[#2064B7]/5 font-medium"
                            onClick={(e) => e.currentTarget.parentNode.querySelector('input[type=file]').click()}
                          >
                            Choose File
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </StageCard>

          {/* ═══ STAGE 4: Follow-up with Member Bank ═════════════════════════ */}
          {(() => {
            const mbHistory = mb.history || [];
            const activeBankName = mb.activeBank || mb.acceptedBank || mbHistory[mbHistory.length - 1]?.bankName || '';
            const activeBankEntry = mbHistory.find((entry) => entry.bankName === activeBankName) || mbHistory[mbHistory.length - 1] || null;
            const activeEvents = activeBankEntry?.events || [];

            const initialEvent = activeEvents.find((evt) => evt.stage === 'INITIAL');
            const reminder1Event = activeEvents.find((evt) => evt.stage === 'REMINDER_1');
            const reminder2Event = activeEvents.find((evt) => evt.stage === 'REMINDER_2');
            const reminder3Event = activeEvents.find((evt) => evt.stage === 'REMINDER_3');

            const reminder1Date = reminder1Event?.sentAt || null;
            const reminder2Date = reminder2Event?.sentAt || null;
            const reminder3Date = reminder3Event?.sentAt || null;
            const remindersSentCount = [reminder1Date, reminder2Date, reminder3Date].filter(Boolean).length;

            let stage4Level = 'initial';
            if (remindersSentCount >= 3) stage4Level = '3rd';
            else if (remindersSentCount >= 2) stage4Level = '2nd';
            else if (remindersSentCount >= 1) stage4Level = '1st';

            const feedbackSubText = stage4Level === 'initial' ? null : `(After ${stage4Level} Reminder)`;

            const latestDecidedEvent = [...activeEvents].reverse().find((evt) => evt.decision && evt.decidedAt);
            const finalDecision = activeBankEntry?.finalDecision || latestDecidedEvent?.decision || null;
            const prefilledFeedbackReceived = finalDecision ? 'Yes' : (mb.started ? 'No' : '');
            const feedbackField = 'feedbackReceived';
            const currentFeedback = mb[feedbackField] || prefilledFeedbackReceived;

            const feedbackReceiveDatePrefill = latestDecidedEvent?.decidedAt || null;

            const acceptanceMessage = finalDecision === 'ACCEPT'
              ? (mb.resolvedMessage || (activeBankName ? `Accepted by ${activeBankName}` : 'Accepted by member bank'))
              : '';
            const rejectionMessage = activeBankEntry?.rejectionMessage || '';
            const feedbackByPrefill = finalDecision === 'REJECT' ? rejectionMessage : acceptanceMessage;

            const prefilledLayeringFound =
              finalDecision === 'REJECT' ? 'Yes' :
              finalDecision === 'ACCEPT' ? 'No' :
              '';

            const nextBankMatch = rejectionMessage.match(/belongs\s+(.+?)(?:\.|$)/i);
            const nextBankFromMessage = nextBankMatch?.[1]?.trim() || '';
            const fiNamePrefill = nextBankFromMessage || activeBankName || '';

            const customerStanceSubmissionDate =
              mb.customerStanceSubmissionDate ||
              mb.initialSubmissionDate ||
              bc.customerStanceReceivedDate ||
              mb.startedAt ||
              initialEvent?.sentAt ||
              null;

            const customerStanceSubmittedToMemberBank = Boolean(mb.branchResponseAccepted && mb.started);

            const configuredBankList = Array.isArray(mb.bankList) ? mb.bankList : [];
            const fallbackBankList = ['HBL', 'UBL', 'ABL', 'MCB', 'BOP', 'Meezan Bank', 'Faysal Bank', 'Bank Alfalah', 'NBP', 'SCB', 'JS Bank'];
            const fiOptions = Array.from(new Set([
              ...(configuredBankList.length ? configuredBankList : fallbackBankList),
              fiNamePrefill,
            ].filter(Boolean)));

            const nextReminderMap = {
              initial: { label: '1st Reminder', field: 'mb1stReminderDate', subText: '(On 2nd day of after cm stance shared with member bank)*' },
              '1st':   { label: '2nd Reminder', field: 'mb2ndReminderDate', subText: '(On 4th day of after cm stance shared with member bank)*' },
              '2nd':   { label: '3rd Reminder', field: 'mb3rdReminderDate', subText: '(On 6th day of after cm stance shared with member bank)*' },
              '3rd':   null,
            };
            const nextReminder = nextReminderMap[stage4Level];
            const isFinalNoFeedback = remindersSentCount >= 3 && currentFeedback === 'No';

            return (
              <StageCard number={4} subtitle="Follow-up with Member Bank">
                {/* Row 1 — always shown */}
                <div className="grid grid-cols-4 gap-x-5 gap-y-4">
                  {/* Customer Stance (Submitted to Member Bank)* — always disabled, Yes */}
                  <div>
                    <div className="mb-1.5">
                      <Label className="text-[12px] font-medium text-gray-700 block">
                        Customer Stance
                      </Label>
                      <span className="text-[10px] text-gray-400 block">
                        (Submitted to Member Bank)<span className="text-red-500 ml-0.5">*</span>
                      </span>
                    </div>
                    <RadioPair
                      name="memberStance"
                      value={customerStanceSubmittedToMemberBank ? 'Yes' : 'No'}
                      onChange={() => {}}
                      options={[
                        { value: 'Yes', label: 'Yes' },
                        { value: 'No', label: 'No' },
                      ]}
                      disabled
                    />
                  </div>

                  {/* Customer Stance Submission Date — disabled, pre-filled */}
                  <div>
                    <FieldLabel required>Customer Stance Submission Date</FieldLabel>
                    <FormInput
                      type="date"
                      value={customerStanceSubmittedToMemberBank ? toDateOnly(customerStanceSubmissionDate) : ''}
                      disabled
                    />
                  </div>

                  {/* Member Bank Feedback Received — editable, with optional subtext */}
                  <div>
                    <div className="mb-1.5">
                      <Label className="text-[12px] font-medium text-gray-700 block">
                        Member Bank Feedback Received<span className="text-red-500 ml-0.5">*</span>
                      </Label>
                      {feedbackSubText && (
                        <span className="text-[10px] text-gray-400 block">{feedbackSubText}</span>
                      )}
                    </div>
                    <RadioPair
                      name="mbFeedbackReceived"
                      value={currentFeedback}
                      onChange={(v) => updateMemberBank(feedbackField, v)}
                      options={[
                        { value: 'Yes', label: 'Yes' },
                        { value: 'No', label: 'No' },
                      ]}
                      disabled
                    />
                  </div>

                  {/* Feedback = Yes → Member Bank Feedback Receive Date */}
                  {currentFeedback === 'Yes' && (
                    <div>
                      <FieldLabel required>Member Bank Feedback Receive Date</FieldLabel>
                      <FormInput
                        type="date"
                        value={toDateOnly(mb.feedbackReceiveDate || feedbackReceiveDatePrefill)}
                        disabled
                        onChange={(e) => updateMemberBank('feedbackReceiveDate', e.target.value)}
                        placeholder="dd/mm/yyyy"
                      />
                    </div>
                  )}

                  {reminder1Date && (
                    <ReminderDateField
                      label="1st Reminder"
                      sideText="To Member Bank"
                      subText="(On 2nd day of after cm stance shared with member bank)*"
                      value={toDatetimeLocal(reminder1Date)}
                      disabled
                      onChange={() => {}}
                    />
                  )}

                  {reminder2Date && (
                    <ReminderDateField
                      label="2nd Reminder"
                      sideText="To Member Bank"
                      subText="(On 4th day of after cm stance shared with member bank)*"
                      value={toDatetimeLocal(reminder2Date)}
                      disabled
                      onChange={() => {}}
                    />
                  )}

                  {reminder3Date && (
                    <ReminderDateField
                      label="3rd Reminder"
                      sideText="To Member Bank"
                      subText="(On 6th day of after cm stance shared with member bank)*"
                      value={toDatetimeLocal(reminder3Date)}
                      disabled
                      onChange={() => {}}
                    />
                  )}

                  {/* Feedback = No → Next Reminder To Member Bank */}
                  {currentFeedback === 'No' && nextReminder && (
                    <ReminderDateField
                      label={nextReminder.label}
                      sideText="To Member Bank"
                      subText={nextReminder.subText}
                      value={toDatetimeLocal(mb[nextReminder.field])}
                      disabled={!!nextReminder.disabled}
                      onChange={(e) => updateMemberBank(nextReminder.field, e.target.value)}
                    />
                  )}
                </div>

                {/* Red warning for 3rd reminder no-feedback */}
                {isFinalNoFeedback && (
                  <div className="mt-4 flex items-center gap-3 p-3 rounded-md bg-red-50 border-l-4 border-red-500">
                    <p className="text-sm text-red-700">
                      Record has been updated in Final Lien Removal Review MIS
                    </p>
                  </div>
                )}

                {/* Row 2 — only when Feedback = Yes */}
                {currentFeedback === 'Yes' && (
                  <div className="grid grid-cols-5 gap-x-5 gap-y-4 mt-4">
                    <div className="col-span-3">
                      <FieldLabel required>Feedback by Member Bank</FieldLabel>
                      <FormInput
                        value={mb.feedbackByMemberBank || feedbackByPrefill}
                        onChange={(e) => updateMemberBank('feedbackByMemberBank', e.target.value)}
                        placeholder="feedback"
                      />
                    </div>
                    <div>
                      <FieldLabel required>Layering Found</FieldLabel>
                      <RadioPair
                        name="layeringFound"
                        value={mb.layeringFound || prefilledLayeringFound}
                        onChange={(v) => updateMemberBank('layeringFound', v)}
                        options={[
                          { value: 'Yes', label: 'Yes' },
                          { value: 'No', label: 'No' },
                        ]}
                        disabled
                      />
                    </div>
                    <div>
                      <FieldLabel>FI Name</FieldLabel>
                      <Select
                        value={mb.fiName || fiNamePrefill || ''}
                        onValueChange={(v) => updateMemberBank('fiName', v)}
                        disabled
                      >
                        <SelectTrigger className="h-9 text-sm border-[#E2E8F0] bg-white w-full data-[disabled]:bg-[#F4F7FE] data-[disabled]:text-gray-700 data-[disabled]:border-[#E2E8F0] data-[disabled]:opacity-100 data-[disabled]:cursor-default">
                          <SelectValue placeholder="Select FI" />
                        </SelectTrigger>
                        <SelectContent>
                          {fiOptions.map((fi) => (
                            <SelectItem key={fi} value={fi}>{fi}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </StageCard>
            );
          })()}

        </div>

        {/* Footer — Generate Report */}
        <div className="px-8 py-4 border-t border-gray-100 flex items-center justify-end shrink-0">
          <Button
            className="h-10 px-6 text-sm bg-[#2064B7] hover:bg-[#1a5399] text-white rounded-lg font-medium"
            onClick={() => onGenerateReport?.(formData)}
          >
            Generate report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
