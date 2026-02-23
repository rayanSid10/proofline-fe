import { useState, useEffect, useCallback } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
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
      className={`h-9 text-sm border-[#E2E8F0] ${disabled ? 'bg-[#F4F7FE] text-gray-500' : 'bg-white'}`}
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
          className={`flex items-center gap-2 ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div
            className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-colors ${
              value === opt.value
                ? disabled
                  ? 'border-gray-400 bg-gray-400'
                  : 'border-[#2064B7] bg-[#2064B7]'
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
          <span className="text-sm text-gray-700">{opt.label}</span>
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

  useEffect(() => {
    if (open && caseData) {
      setFormData(JSON.parse(JSON.stringify(caseData, (key, value) => {
        if (value instanceof Date) return value.toISOString();
        return value;
      })));
    }
  }, [open, caseData]);

  useEffect(() => {
    if (!open) setFormData(null);
  }, [open]);

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
    if (branchState === '3rd_reminder_sent_waiting' || branchState === 'business_consideration') return '3rd';
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
    return null;
  };

  const currentStance = getStanceAtLevel();

  // ─── Subtext for "Customer Stance Received" ───────────────────────────
  const getStanceSubText = () => {
    if (stage3Level === 'initial') return '(Against Initial Intimation)';
    if (stage3Level === '1st') return '(Against 1st reminder)';
    if (stage3Level === '2nd') return '(Against 2nd reminder)';
    if (stage3Level === '3rd') return '(Against 3rd reminder)';
    return '';
  };

  // ─── Stance change handler ────────────────────────────────────────────
  const handleStanceChange = (value) => {
    if (stage3Level === 'initial') updateBranch('customerStanceInitial', value);
    else if (stage3Level === '1st') updateBranch('customerStance1stReminder', value);
    else if (stage3Level === '2nd') updateBranch('customerStance2ndReminder', value);
    else if (stage3Level === '3rd') updateBranch('customerStance3rdReminder', value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="w-[95vw] max-h-[92vh] p-0 gap-0 rounded-2xl overflow-hidden flex flex-col border-0" style={{ maxWidth: '1200px' }}>
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
                  onChange={(e) => updateInit('ftdhReceivingDateTime', e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Channel</FieldLabel>
                <Select
                  value={init.channel || ''}
                  onValueChange={(v) => updateInit('channel', v)}
                >
                  <SelectTrigger className="h-9 text-sm border-[#E2E8F0] bg-white">
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
                  onChange={(e) => updateInit('transactionDateTime', e.target.value)}
                />
              </div>
              <div>
                <FieldLabel required>Trx Date</FieldLabel>
                <FormInput
                  type="date"
                  value={toDateOnly(init.transactionDateTime)}
                  onChange={(e) => updateInit('transactionDateTime', e.target.value)}
                />
              </div>

              {/* Row 3 */}
              <div>
                <FieldLabel required>Trx Time</FieldLabel>
                <FormInput
                  type="time"
                  value={init.transactionDateTime ? (() => { const d = new Date(init.transactionDateTime); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; })() : ''}
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
                    value={toDatetimeLocal(formData.updatedAt)}
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
                    value={act.fundsOnHold > 0 ? 'partial' : 'full'}
                    onChange={(v) => {
                      if (v === 'full') updateAction('fundsOnHold', 0);
                    }}
                    options={[
                      { value: 'full', label: 'Full' },
                      { value: 'partial', label: 'Partial' },
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
                    value={toDatetimeLocal(formData.updatedAt)}
                    onChange={() => {}}
                  />
                </div>
                <div>
                  <FieldLabel required>Funds Layering</FieldLabel>
                  <RadioPair
                    name="fundsLayering"
                    value={act.fundsLayering ? 'Yes' : 'No'}
                    onChange={(v) => updateAction('fundsLayering', v === 'Yes')}
                    options={[
                      { value: 'Yes', label: 'Yes' },
                      { value: 'No', label: 'No' },
                    ]}
                  />
                </div>
                <div>
                  <FieldLabel required>Funds Layering Date & Time</FieldLabel>
                  <FormInput
                    type="datetime-local"
                    value=""
                    onChange={() => {}}
                    placeholder="dd/mm/yyyy hh:mm"
                  />
                </div>
                <div>
                  <FieldLabel required>Funds Layering ID</FieldLabel>
                  <FormInput
                    value={act.fundsLayeringId || ''}
                    onChange={(e) => updateAction('fundsLayeringId', e.target.value)}
                    placeholder="Enter ID, DG..."
                  />
                </div>
                <div>
                  <FieldLabel required>Lien Mark</FieldLabel>
                  <RadioPair
                    name="lienMarked"
                    value={act.lienMarked ? 'Yes' : 'No'}
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
                    value=""
                    onChange={() => {}}
                    placeholder="dd/mm/yyyy hh:mm"
                  />
                </div>
                <div>
                  <FieldLabel required>Intimation to Branch</FieldLabel>
                  <RadioPair
                    name="intimationBranch"
                    value={bc.initialIntimationSent ? 'Yes' : 'No'}
                    onChange={(v) => updateBranch('initialIntimationSent', v === 'Yes')}
                    options={[
                      { value: 'Yes', label: 'Yes' },
                      { value: 'No', label: 'No' },
                    ]}
                  />
                </div>
                <div>
                  <FieldLabel required>Intimation Date & Time</FieldLabel>
                  <FormInput
                    type="datetime-local"
                    value={toDatetimeLocal(bc.initialIntimationDate)}
                    onChange={(e) => updateBranch('initialIntimationDate', e.target.value)}
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
                  <SelectTrigger className="h-9 text-sm border-[#E2E8F0] bg-white w-full">
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

            {/* ─── INITIAL INTIMATION LEVEL ─────────────────────────────── */}
            {stage3Level === 'initial' && (
              <>
                {/* Row 1 */}
                <div className="grid grid-cols-4 gap-x-5 gap-y-4">
                  {/* Customer Stance Received */}
                  <div>
                    <div className="mb-1.5">
                      <Label className="text-[12px] font-medium text-gray-700 block">
                        Customer Stance Received
                      </Label>
                      <span className="text-[10px] text-gray-400 block">
                        (Against Initial Intimation)<span className="text-red-500 ml-0.5">*</span>
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
                    />
                  </div>

                  {/* Stance = Yes → Customer Stance Received Date + Stance Reviewed + Stance Reviewed Date */}
                  {currentStance === 'Yes' && (
                    <>
                      <div>
                        <FieldLabel required>Customer Stance Received Date</FieldLabel>
                        <FormInput
                          type="date"
                          value={toDateOnly(bc.customerStanceReceivedDate)}
                          onChange={(e) => updateBranch('customerStanceReceivedDate', e.target.value)}
                          placeholder="dd/mm/yyyy"
                        />
                      </div>
                      <div>
                        <FieldLabel required>Stance Reviewed</FieldLabel>
                        <RadioPair
                          name="stanceReviewed"
                          value={bc.stanceReviewed || ''}
                          onChange={(v) => updateBranch('stanceReviewed', v)}
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
                          value={toDateOnly(bc.stanceReviewedDate)}
                          onChange={(e) => updateBranch('stanceReviewedDate', e.target.value)}
                          placeholder="dd/mm/yyyy"
                        />
                      </div>
                    </>
                  )}

                  {/* Stance = No → 1st Reminder date (enabled, prefilled) */}
                  {currentStance === 'No' && (
                    <ReminderDateField
                      label="1st Reminder"
                      sideText="Marke To BR"
                      subText="(On 3rd day of FTDH received)"
                      value={toDatetimeLocal(bc.firstReminderDate)}
                      disabled={false}
                      onChange={(e) => updateBranch('firstReminderDate', e.target.value)}
                    />
                  )}
                </div>

                {/* Row 2 — only when Yes */}
                {currentStance === 'Yes' && (
                  <>
                    <div className="grid grid-cols-4 gap-x-5 gap-y-4 mt-4">
                      <div>
                        <FieldLabel required>Stance Acceptable</FieldLabel>
                        <RadioPair
                          name="stanceAcceptable"
                          value={bc.stanceAcceptable || ''}
                          onChange={(v) => updateBranch('stanceAcceptable', v)}
                          options={[
                            { value: 'Yes', label: 'Yes' },
                            { value: 'No', label: 'No' },
                          ]}
                        />
                      </div>
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
                          value={toDateOnly(bc.stanceRevertedDate)}
                          onChange={(e) => updateBranch('stanceRevertedDate', e.target.value)}
                          placeholder="dd/mm/yyyy"
                        />
                      </div>
                      <div>
                        <FieldLabel>Customer Stance with Evidences</FieldLabel>
                        {/* Spacer to align with "Stance Reverted to branch" subtext */}
                        <span className="text-[10px] text-transparent block mt-0.5 select-none">&nbsp;</span>
                        <div className="flex items-center gap-3">
                          <input type="file" multiple accept=".png,.pdf,.jpg,.jpeg,.docx" className="hidden" onChange={(e) => { if (e.target.files.length) toast.success(`${e.target.files.length} file(s) selected`); e.target.value = ''; }} />
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
                  </>
                )}
              </>
            )}

            {/* ─── 1st REMINDER LEVEL ──────────────────────────────────── */}
            {stage3Level === '1st' && (
              <>
                <div className="grid grid-cols-4 gap-x-5 gap-y-4">
                  <div>
                    <div className="mb-1.5">
                      <Label className="text-[12px] font-medium text-gray-700 block">
                        Customer Stance Received
                      </Label>
                      <span className="text-[10px] text-gray-400 block">
                        (Against 1st reminder)<span className="text-red-500 ml-0.5">*</span>
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
                    />
                  </div>

                  {/* Always show 1st Reminder (disabled, prefilled) */}
                  <ReminderDateField
                    label="1st Reminder"
                    sideText="Marke To BR"
                    subText="(On 3rd day of FTDH received)"
                    value={toDatetimeLocal(bc.firstReminderDate)}
                    disabled={true}
                    onChange={() => {}}
                  />

                  {/* Stance = Yes → Stance Reviewed + Stance Reviewed Date */}
                  {currentStance === 'Yes' && (
                    <>
                      <div>
                        <FieldLabel required>Stance Reviewed</FieldLabel>
                        <RadioPair
                          name="stanceReviewed"
                          value={bc.stanceReviewed || ''}
                          onChange={(v) => updateBranch('stanceReviewed', v)}
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
                          value={toDateOnly(bc.stanceReviewedDate)}
                          onChange={(e) => updateBranch('stanceReviewedDate', e.target.value)}
                          placeholder="dd/mm/yyyy"
                        />
                      </div>
                    </>
                  )}

                  {/* Stance = No → show editable 2nd Reminder */}
                  {currentStance === 'No' && (
                    <ReminderDateField
                      label="2nd Reminder"
                      sideText="Escalation to Area Management"
                      subText="(On 5th day of FTDH received)"
                      value=""
                      disabled={false}
                      onChange={() => {}}
                    />
                  )}
                </div>

                {/* Row 2 — only when Yes */}
                {currentStance === 'Yes' && (
                  <>
                    <div className="grid grid-cols-4 gap-x-5 gap-y-4 mt-4">
                      <div>
                        <FieldLabel required>Stance Acceptable</FieldLabel>
                        <RadioPair
                          name="stanceAcceptable"
                          value={bc.stanceAcceptable || ''}
                          onChange={(v) => updateBranch('stanceAcceptable', v)}
                          options={[
                            { value: 'Yes', label: 'Yes' },
                            { value: 'No', label: 'No' },
                          ]}
                        />
                      </div>
                      <div>
                        <FieldLabel required>Stance Acceptable Date</FieldLabel>
                        <FormInput
                          type="date"
                          value={toDateOnly(bc.stanceAcceptableDate)}
                          onChange={(e) => updateBranch('stanceAcceptableDate', e.target.value)}
                          placeholder="dd/mm/yyyy"
                        />
                      </div>
                      <div>
                        <FieldLabel>Customer Stance with Evidences</FieldLabel>
                        <div className="flex items-center gap-3">
                          <input type="file" multiple accept=".png,.pdf,.jpg,.jpeg,.docx" className="hidden" onChange={(e) => { if (e.target.files.length) toast.success(`${e.target.files.length} file(s) selected`); e.target.value = ''; }} />
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
                  </>
                )}
              </>
            )}

            {/* ─── 2nd REMINDER LEVEL ──────────────────────────────────── */}
            {stage3Level === '2nd' && (
              <>
                <div className="grid grid-cols-4 gap-x-5 gap-y-4">
                  <div>
                    <div className="mb-1.5">
                      <Label className="text-[12px] font-medium text-gray-700 block">
                        Customer Stance Received
                      </Label>
                      <span className="text-[10px] text-gray-400 block">
                        (Against 2nd reminder)<span className="text-red-500 ml-0.5">*</span>
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
                    />
                  </div>

                  <ReminderDateField
                    label="1st Reminder"
                    sideText="Marke To BR"
                    subText="(On 3rd day of FTDH received)"
                    value={toDatetimeLocal(bc.firstReminderDate)}
                    disabled={true}
                    onChange={() => {}}
                  />
                  <ReminderDateField
                    label="2nd Reminder"
                    sideText="Escalation to Area Management"
                    subText="(On 5th day of FTDH received)"
                    value={toDatetimeLocal(bc.secondReminderDate)}
                    disabled={true}
                    onChange={() => {}}
                  />

                  {/* Stance = No → show editable 3rd Reminder */}
                  {currentStance === 'No' && (
                    <ReminderDateField
                      label="3rd Reminder"
                      sideText="to Regional Management"
                      subText="(On 8th day of FTDH received)"
                      value=""
                      disabled={false}
                      onChange={() => {}}
                    />
                  )}
                </div>

                {/* Row 2 — only when Yes */}
                {currentStance === 'Yes' && (
                  <>
                    <div className="grid grid-cols-4 gap-x-5 gap-y-4 mt-4">
                      <div>
                        <FieldLabel required>Stance Reviewed</FieldLabel>
                        <RadioPair
                          name="stanceReviewed"
                          value={bc.stanceReviewed || ''}
                          onChange={(v) => updateBranch('stanceReviewed', v)}
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
                          value={toDateOnly(bc.stanceReviewedDate)}
                          onChange={(e) => updateBranch('stanceReviewedDate', e.target.value)}
                          placeholder="dd/mm/yyyy"
                        />
                      </div>
                      <div>
                        <FieldLabel required>Stance Acceptable</FieldLabel>
                        <RadioPair
                          name="stanceAcceptable"
                          value={bc.stanceAcceptable || ''}
                          onChange={(v) => updateBranch('stanceAcceptable', v)}
                          options={[
                            { value: 'Yes', label: 'Yes' },
                            { value: 'No', label: 'No' },
                          ]}
                        />
                      </div>
                      <div>
                        <FieldLabel required>Stance Acceptable Date</FieldLabel>
                        <FormInput
                          type="date"
                          value={toDateOnly(bc.stanceAcceptableDate)}
                          onChange={(e) => updateBranch('stanceAcceptableDate', e.target.value)}
                          placeholder="dd/mm/yyyy"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <FieldLabel>Customer Stance with Evidences</FieldLabel>
                      <div className="flex items-center gap-3">
                        <input type="file" multiple accept=".png,.pdf,.jpg,.jpeg,.docx" className="hidden" onChange={(e) => { if (e.target.files.length) toast.success(`${e.target.files.length} file(s) selected`); e.target.value = ''; }} />
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
            )}

            {/* ─── 3rd REMINDER LEVEL ──────────────────────────────────── */}
            {stage3Level === '3rd' && (
              <>
                <div className="grid grid-cols-4 gap-x-5 gap-y-4">
                  <div>
                    <div className="mb-1.5">
                      <Label className="text-[12px] font-medium text-gray-700 block">
                        Customer Stance Received
                      </Label>
                      <span className="text-[10px] text-gray-400 block">
                        (Against 3rd reminder)<span className="text-red-500 ml-0.5">*</span>
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
                    />
                  </div>

                  <ReminderDateField
                    label="1st Reminder"
                    sideText="Marke To BR"
                    subText="(On 3rd day of FTDH received)"
                    value={toDatetimeLocal(bc.firstReminderDate)}
                    disabled={true}
                    onChange={() => {}}
                  />
                  <ReminderDateField
                    label="2nd Reminder"
                    sideText="Escalation to Area Management"
                    subText="(On 5th day of FTDH received)"
                    value={toDatetimeLocal(bc.secondReminderDate)}
                    disabled={true}
                    onChange={() => {}}
                  />
                  <ReminderDateField
                    label="3rd Reminder"
                    sideText="to Regional Management"
                    subText="(On 8th day of FTDH received)"
                    value={toDatetimeLocal(bc.thirdReminderDate)}
                    disabled={true}
                    onChange={() => {}}
                  />
                </div>

                {/* Stance = No → MIS warning */}
                {currentStance === 'No' && (
                  <div className="mt-4 flex items-center gap-3 p-3 rounded-md bg-red-50 border-l-4 border-red-500">
                    <p className="text-sm text-red-700">
                      Record has been updated in monthly MIS for business consideration
                    </p>
                  </div>
                )}

                {/* Stance = Yes → Stance Reviewed/Acceptable */}
                {currentStance === 'Yes' && (
                  <>
                    <div className="grid grid-cols-4 gap-x-5 gap-y-4 mt-4">
                      <div>
                        <FieldLabel required>Stance Reviewed</FieldLabel>
                        <RadioPair
                          name="stanceReviewed"
                          value={bc.stanceReviewed || ''}
                          onChange={(v) => updateBranch('stanceReviewed', v)}
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
                          value={toDateOnly(bc.stanceReviewedDate)}
                          onChange={(e) => updateBranch('stanceReviewedDate', e.target.value)}
                          placeholder="dd/mm/yyyy"
                        />
                      </div>
                      <div>
                        <FieldLabel required>Stance Acceptable</FieldLabel>
                        <RadioPair
                          name="stanceAcceptable"
                          value={bc.stanceAcceptable || ''}
                          onChange={(v) => updateBranch('stanceAcceptable', v)}
                          options={[
                            { value: 'Yes', label: 'Yes' },
                            { value: 'No', label: 'No' },
                          ]}
                        />
                      </div>
                      <div>
                        <FieldLabel required>Stance Acceptable Date</FieldLabel>
                        <FormInput
                          type="date"
                          value={toDateOnly(bc.stanceAcceptableDate)}
                          onChange={(e) => updateBranch('stanceAcceptableDate', e.target.value)}
                          placeholder="dd/mm/yyyy"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <FieldLabel>Customer Stance with Evidences</FieldLabel>
                      <div className="flex items-center gap-3">
                        <input type="file" multiple accept=".png,.pdf,.jpg,.jpeg,.docx" className="hidden" onChange={(e) => { if (e.target.files.length) toast.success(`${e.target.files.length} file(s) selected`); e.target.value = ''; }} />
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
            )}

          </StageCard>

          {/* ═══ STAGE 4: Follow-up with Member Bank ═════════════════════════ */}
          {(() => {
            // Derive which member-bank feedback round we're on from branchState
            const mbState = mb.memberBankCommunicationState || 'not_started';
            // Map branch communication state to stage 4 level
            let stage4Level = 'initial'; // default
            if (branchState.includes('1st_reminder') || mbState.includes('1st_reminder')) stage4Level = '1st';
            if (branchState.includes('2nd_reminder') || mbState.includes('2nd_reminder')) stage4Level = '2nd';
            if (branchState.includes('3rd_reminder') || mbState.includes('3rd_reminder')) stage4Level = '3rd';
            if (branchState.includes('business_consideration') || mbState.includes('feedback_received')) stage4Level = mbState.includes('3rd') ? '3rd' : mbState.includes('2nd') ? '2nd' : mbState.includes('1st') ? '1st' : 'initial';

            // Label helpers
            const feedbackSubText = stage4Level === 'initial' ? null : `(After ${stage4Level} Reminder)`;

            // Which feedback field to read/write based on level
            const feedbackFieldMap = {
              initial: 'feedbackReceived',
              '1st': 'feedbackReceived',
              '2nd': 'feedbackReceived',
              '3rd': 'feedbackReceived',
            };
            const feedbackField = feedbackFieldMap[stage4Level];
            const currentFeedback = mb[feedbackField] || '';

            // Next reminder config when feedback = No
            const nextReminderMap = {
              initial: { label: '1st Reminder', field: 'mb1stReminderDate', subText: '(On 2nd day of after cm stance shared with member bank)*' },
              '1st':   { label: '2nd Reminder', field: 'mb2ndReminderDate', subText: '(On 4th day of after cm stance shared with member bank)*' },
              '2nd':   { label: '3rd Reminder', field: 'mb3rdReminderDate', subText: '(On 6th day of after cm stance shared with member bank)*' },
              '3rd':   { label: '3rd Reminder', field: 'mb3rdReminderDate', subText: '(On 6th day of after cm stance shared with member bank)*', disabled: true },
            };
            const nextReminder = nextReminderMap[stage4Level];
            const is3rdNoFeedback = stage4Level === '3rd' && currentFeedback === 'No';

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
                      value="Yes"
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
                      value={toDateOnly(mb.customerStanceSubmissionDate || mb.initialSubmissionDate)}
                      disabled
                      className="bg-gray-50 text-gray-500"
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
                    />
                  </div>

                  {/* Feedback = Yes → Member Bank Feedback Receive Date */}
                  {currentFeedback === 'Yes' && (
                    <div>
                      <FieldLabel required>Member Bank Feedback Receive Date</FieldLabel>
                      <FormInput
                        type="date"
                        value={toDateOnly(mb.feedbackReceiveDate)}
                        onChange={(e) => updateMemberBank('feedbackReceiveDate', e.target.value)}
                        placeholder="dd/mm/yyyy"
                      />
                    </div>
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
                {is3rdNoFeedback && (
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
                        value={mb.feedbackByMemberBank || ''}
                        onChange={(e) => updateMemberBank('feedbackByMemberBank', e.target.value)}
                        placeholder="feedback"
                      />
                    </div>
                    <div>
                      <FieldLabel required>Layering Found</FieldLabel>
                      <RadioPair
                        name="layeringFound"
                        value={mb.layeringFound || ''}
                        onChange={(v) => updateMemberBank('layeringFound', v)}
                        options={[
                          { value: 'Yes', label: 'Yes' },
                          { value: 'No', label: 'No' },
                        ]}
                      />
                    </div>
                    <div>
                      <FieldLabel>FI Name</FieldLabel>
                      <Select
                        value={mb.fiName || ''}
                        onValueChange={(v) => updateMemberBank('fiName', v)}
                      >
                        <SelectTrigger className="h-9 text-sm border-[#E2E8F0] bg-white w-full">
                          <SelectValue placeholder="Select FI" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MCB">MCB</SelectItem>
                          <SelectItem value="HBL">HBL</SelectItem>
                          <SelectItem value="UBL">UBL</SelectItem>
                          <SelectItem value="ABL">ABL</SelectItem>
                          <SelectItem value="NBP">NBP</SelectItem>
                          <SelectItem value="Meezan">Meezan</SelectItem>
                          <SelectItem value="Faysal">Faysal</SelectItem>
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
