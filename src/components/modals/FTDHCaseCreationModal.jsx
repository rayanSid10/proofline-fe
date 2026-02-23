import { useState, useEffect, useCallback, useMemo } from 'react';
import { Check, Save, FileText, AlertTriangle, ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { pakistaniBanks } from '@/data/constants';
import {
  generateFTDHId,
  ftdhChannels,
  channelBlockOptions,
  initialFTDHFormState,
  saveFTDHDraft,
} from '@/data/mockFTDH';

// Step configuration
const steps = [
  { id: 1, title: 'Initial Data', shortTitle: 'Initial Data' },
  { id: 2, title: 'Actions Taken', shortTitle: 'Actions' },
  { id: 3, title: 'Branch Communication', shortTitle: 'Branch Comm.' },
  { id: 4, title: 'Member Bank Communication', shortTitle: 'Member Bank' },
];

// Format date to DD/MM/YYYY HH:MM
const formatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

// Format number with thousand separators
const formatAmount = (value) => {
  if (!value) return '';
  const num = String(value).replace(/[^0-9]/g, '');
  return Number(num).toLocaleString('en-PK');
};

// Parse formatted amount back to number
const parseAmount = (value) => {
  if (!value) return '';
  return String(value).replace(/[^0-9]/g, '');
};

// Step Indicator Component
function StepIndicator({ currentStep, completedSteps, onStepClick }) {
  return (
    <div className="flex items-center justify-between mb-6 px-2">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.id);
        const isCurrent = currentStep === step.id;
        const isClickable = isCompleted || step.id < currentStep;

        return (
          <div key={step.id} className="flex items-center flex-1">
            <button
              type="button"
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold
                transition-all duration-200
                ${isCompleted
                  ? 'bg-[#22C55E] text-white cursor-pointer'
                  : isCurrent
                    ? 'bg-[#2064B7] text-white'
                    : 'bg-gray-200 text-gray-500'
                }
                ${isClickable && !isCurrent ? 'hover:opacity-80 cursor-pointer' : ''}
                ${!isClickable && !isCurrent ? 'cursor-not-allowed' : ''}
              `}
            >
              {isCompleted ? <Check className="h-4 w-4" /> : step.id}
            </button>
            <span
              className={`ml-2 text-xs font-medium hidden sm:block ${
                isCurrent ? 'text-[#2064B7]' : isCompleted ? 'text-[#22C55E]' : 'text-gray-400'
              }`}
            >
              {step.shortTitle}
            </span>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-3 ${
                  isCompleted ? 'bg-[#22C55E]' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Radio Button Group Component
function RadioGroup({ name, value, onChange, options, className = '' }) {
  return (
    <div className={`flex gap-4 ${className}`}>
      {options.map((option) => (
        <label
          key={option.value}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all
            ${value === option.value
              ? 'border-[#2064B7] bg-[#2064B7]/5 text-[#2064B7]'
              : 'border-gray-200 hover:border-gray-300'
            }
          `}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
          />
          <div
            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
              value === option.value ? 'border-[#2064B7]' : 'border-gray-300'
            }`}
          >
            {value === option.value && (
              <div className="w-2 h-2 rounded-full bg-[#2064B7]" />
            )}
          </div>
          <span className="text-sm">{option.label}</span>
        </label>
      ))}
    </div>
  );
}

// Section Header Component
function SectionHeader({ children }) {
  return (
    <h3 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
      {children}
    </h3>
  );
}

// Form Field Wrapper
function FormField({ label, required, error, children, className = '' }) {
  return (
    <div className={className}>
      <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// Read-only DateTime Field
function DateTimeDisplay({ value, label }) {
  return (
    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
      {value ? formatDateTime(value) : label || 'Not set'}
    </div>
  );
}

// Communication Level Component (for dynamic steps 3 & 4)
function CommunicationLevel({
  level,
  type,
  sentChecked,
  onSentChange,
  sentDateTime,
  stanceValue,
  onStanceChange,
  stanceLabel,
  stanceOptions,
  disabled = false,
}) {
  const levelLabels = {
    initial: type === 'branch' ? 'Initial Intimation Sent to Branch' : 'Initial Submission Sent to Member Bank',
    reminder1: '1st Reminder Sent',
    reminder2: '2nd Reminder Sent',
    reminder3: '3rd Reminder Sent',
    final: type === 'branch' ? 'Record Submitted for Business Consideration' : 'Record Updated in MIS',
  };

  const stanceLabelText = stanceLabel || (type === 'branch'
    ? `Customer Stance Received against ${level === 'initial' ? 'Initial Intimation' : level === 'reminder1' ? '1st Reminder' : level === 'reminder2' ? '2nd Reminder' : '3rd Reminder'}`
    : `Feedback Received ${level === 'initial' ? 'from Member Bank' : `against ${level === 'reminder1' ? '1st' : level === 'reminder2' ? '2nd' : '3rd'} Reminder`}`
  );

  return (
    <div className={`space-y-4 p-4 rounded-lg border transition-all duration-300 ${
      disabled ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center gap-3">
        <Checkbox
          checked={sentChecked}
          onCheckedChange={onSentChange}
          disabled={disabled}
        />
        <span className="text-sm font-medium">{levelLabels[level]}</span>
      </div>

      {sentChecked && (
        <div className="ml-7 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <FormField label="Date & Time">
            <DateTimeDisplay value={sentDateTime} label="Auto-populated" />
          </FormField>

          {level !== 'final' && (
            <FormField label={stanceLabelText} required>
              <RadioGroup
                name={`${type}-${level}-stance`}
                value={stanceValue}
                onChange={onStanceChange}
                options={stanceOptions || [
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                ]}
              />
            </FormField>
          )}
        </div>
      )}
    </div>
  );
}

// Main Modal Component
export function FTDHCaseCreationModal({ open, onOpenChange, onCaseCreated }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [form, setForm] = useState({ ...initialFTDHFormState });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate dispute ID on mount
  useEffect(() => {
    if (open && !form.disputeId) {
      const now = new Date();
      setForm((prev) => ({
        ...prev,
        disputeId: generateFTDHId(),
        ftdhReceivingDateTime: now,
        transactionDateTime: now,
      }));
    }
  }, [open, form.disputeId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setCompletedSteps([]);
      setForm({ ...initialFTDHFormState });
      setErrors({});
      setIsSubmitting(false);
    }
  }, [open]);

  // Update form field
  const updateField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  }, []);

  // Handle checkbox toggle for channel blocks
  const handleChannelBlockToggle = useCallback((channelValue, checked) => {
    setForm((prev) => ({
      ...prev,
      channelBlockStatus: checked
        ? [...prev.channelBlockStatus, channelValue]
        : prev.channelBlockStatus.filter((c) => c !== channelValue),
    }));
  }, []);

  // Handle communication level changes (Step 3)
  const handleBranchCommunication = useCallback((level, field, value) => {
    if (field === 'sent' && value === true) {
      // Auto-populate datetime when checkbox is checked
      const dateField = level === 'initial' ? 'initialIntimationDateTime'
        : level === 'reminder1' ? 'reminder1DateTime'
        : level === 'reminder2' ? 'reminder2DateTime'
        : level === 'reminder3' ? 'reminder3DateTime'
        : 'businessConsiderationDateTime';

      const sentField = level === 'initial' ? 'initialIntimationSent'
        : level === 'reminder1' ? 'reminder1Sent'
        : level === 'reminder2' ? 'reminder2Sent'
        : level === 'reminder3' ? 'reminder3Sent'
        : 'businessConsiderationSubmitted';

      setForm((prev) => ({
        ...prev,
        [sentField]: true,
        [dateField]: new Date(),
      }));
    } else if (field === 'sent' && value === false) {
      const sentField = level === 'initial' ? 'initialIntimationSent'
        : level === 'reminder1' ? 'reminder1Sent'
        : level === 'reminder2' ? 'reminder2Sent'
        : level === 'reminder3' ? 'reminder3Sent'
        : 'businessConsiderationSubmitted';

      setForm((prev) => ({ ...prev, [sentField]: false }));
    } else if (field === 'stance') {
      const stanceField = level === 'initial' ? 'customerStanceInitial'
        : level === 'reminder1' ? 'customerStanceReminder1'
        : level === 'reminder2' ? 'customerStanceReminder2'
        : 'customerStanceReminder3';

      setForm((prev) => ({ ...prev, [stanceField]: value }));
    }
  }, []);

  // Handle member bank communication level changes (Step 4)
  const handleMemberBankCommunication = useCallback((level, field, value) => {
    if (field === 'sent' && value === true) {
      const dateField = level === 'initial' ? 'initialSubmissionDateTime'
        : level === 'reminder1' ? 'memberReminder1DateTime'
        : level === 'reminder2' ? 'memberReminder2DateTime'
        : level === 'reminder3' ? 'memberReminder3DateTime'
        : 'misUpdateDateTime';

      const sentField = level === 'initial' ? 'initialSubmissionSent'
        : level === 'reminder1' ? 'memberReminder1Sent'
        : level === 'reminder2' ? 'memberReminder2Sent'
        : level === 'reminder3' ? 'memberReminder3Sent'
        : 'misUpdated';

      setForm((prev) => ({
        ...prev,
        [sentField]: true,
        [dateField]: new Date(),
      }));
    } else if (field === 'sent' && value === false) {
      const sentField = level === 'initial' ? 'initialSubmissionSent'
        : level === 'reminder1' ? 'memberReminder1Sent'
        : level === 'reminder2' ? 'memberReminder2Sent'
        : level === 'reminder3' ? 'memberReminder3Sent'
        : 'misUpdated';

      setForm((prev) => ({ ...prev, [sentField]: false }));
    } else if (field === 'feedback') {
      const feedbackField = level === 'initial' ? 'feedbackInitial'
        : level === 'reminder1' ? 'feedbackReminder1'
        : level === 'reminder2' ? 'feedbackReminder2'
        : 'feedbackReminder3';

      setForm((prev) => ({ ...prev, [feedbackField]: value }));
    }
  }, []);

  // Validate Step 1
  const validateStep1 = useCallback(() => {
    const newErrors = {};

    if (!form.sendingBank) newErrors.sendingBank = 'Sending bank is required';
    if (!form.receivingBank) newErrors.receivingBank = 'Receiving bank is required';
    if (form.sendingBank && form.receivingBank && form.sendingBank === form.receivingBank) {
      newErrors.receivingBank = 'Receiving bank must be different from sending bank';
    }
    if (!form.channel) newErrors.channel = 'Channel is required';
    if (!form.senderAccount) newErrors.senderAccount = 'Sender account is required';
    if (form.senderAccount && (form.senderAccount.length < 16 || form.senderAccount.length > 24)) {
      newErrors.senderAccount = 'Account number must be 16-24 characters';
    }
    if (!form.beneficiaryAccount) newErrors.beneficiaryAccount = 'Beneficiary account is required';
    if (form.beneficiaryAccount && (form.beneficiaryAccount.length < 16 || form.beneficiaryAccount.length > 24)) {
      newErrors.beneficiaryAccount = 'Account number must be 16-24 characters';
    }
    if (!form.stan) newErrors.stan = 'STAN is required';
    if (form.stan && form.stan.length !== 6) {
      newErrors.stan = 'STAN must be exactly 6 digits';
    }
    if (!form.transactionAmount || parseAmount(form.transactionAmount) === '0') {
      newErrors.transactionAmount = 'Transaction amount must be greater than 0';
    }
    if (form.transactionDateTime && new Date(form.transactionDateTime) > new Date()) {
      newErrors.transactionDateTime = 'Transaction date cannot be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  // Validate Step 2
  const validateStep2 = useCallback(() => {
    const newErrors = {};

    if (form.actionTaken === 'invalid' && (!form.invalidReason || form.invalidReason.length < 20)) {
      newErrors.invalidReason = 'Invalid reason must be at least 20 characters';
    }

    if (form.recoveryAttempted === 'yes') {
      if (!form.recoveryAmount) {
        newErrors.recoveryAmount = 'Recovery amount is required';
      } else if (Number(parseAmount(form.recoveryAmount)) > Number(parseAmount(form.transactionAmount))) {
        newErrors.recoveryAmount = 'Recovery amount cannot exceed transaction amount';
      }
      if (!form.recoveryDate) {
        newErrors.recoveryDate = 'Recovery date is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  // Validate Step 3
  const validateStep3 = useCallback(() => {
    const newErrors = {};

    if (form.initialIntimationSent && form.customerStanceInitial === null) {
      newErrors.customerStanceInitial = 'Customer stance is required';
    }

    if (form.reminder1Sent && form.customerStanceReminder1 === null) {
      newErrors.customerStanceReminder1 = 'Customer stance is required';
    }

    if (form.reminder2Sent && form.customerStanceReminder2 === null) {
      newErrors.customerStanceReminder2 = 'Customer stance is required';
    }

    if (form.reminder3Sent && form.customerStanceReminder3 === null) {
      newErrors.customerStanceReminder3 = 'Customer stance is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  // Validate Step 4
  const validateStep4 = useCallback(() => {
    const newErrors = {};

    if (form.initialSubmissionSent && form.feedbackInitial === null) {
      newErrors.feedbackInitial = 'Feedback response is required';
    }

    if (form.memberReminder1Sent && form.feedbackReminder1 === null) {
      newErrors.feedbackReminder1 = 'Feedback response is required';
    }

    if (form.memberReminder2Sent && form.feedbackReminder2 === null) {
      newErrors.feedbackReminder2 = 'Feedback response is required';
    }

    if (form.memberReminder3Sent && form.feedbackReminder3 === null) {
      newErrors.feedbackReminder3 = 'Feedback response is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  // Validate all steps
  const validateAll = useCallback(() => {
    return validateStep1() && validateStep2() && validateStep3() && validateStep4();
  }, [validateStep1, validateStep2, validateStep3, validateStep4]);

  // Handle next step
  const handleNext = useCallback(() => {
    let isValid = false;

    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
      case 4:
        isValid = validateStep4();
        break;
      default:
        isValid = true;
    }

    if (isValid) {
      setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      }
    }
  }, [currentStep, validateStep1, validateStep2, validateStep3, validateStep4]);

  // Handle previous step
  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Handle step click
  const handleStepClick = useCallback((stepId) => {
    if (completedSteps.includes(stepId) || stepId < currentStep) {
      setCurrentStep(stepId);
    }
  }, [completedSteps, currentStep]);

  // Handle save as draft
  const handleSaveDraft = useCallback(() => {
    saveFTDHDraft(form.disputeId, form);
    toast.success('FTDH case saved as draft');
  }, [form]);

  // Handle generate report
  const handleGenerateReport = useCallback(async () => {
    if (!validateAll()) {
      toast.error('Please complete all required fields before generating report');
      return;
    }

    setIsSubmitting(true);

    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    toast.success('FTDH report generated successfully');
    onCaseCreated?.(form);
  }, [validateAll, form, onCaseCreated]);

  // Determine branch communication level visibility
  const branchCommLevel = useMemo(() => {
    if (!form.initialIntimationSent) return 'initial';
    if (form.customerStanceInitial === 'yes') return 'complete';
    if (form.customerStanceInitial !== 'no') return 'initial';

    if (!form.reminder1Sent) return 'reminder1';
    if (form.customerStanceReminder1 === 'yes') return 'complete';
    if (form.customerStanceReminder1 !== 'no') return 'reminder1';

    if (!form.reminder2Sent) return 'reminder2';
    if (form.customerStanceReminder2 === 'yes') return 'complete';
    if (form.customerStanceReminder2 !== 'no') return 'reminder2';

    if (!form.reminder3Sent) return 'reminder3';
    if (form.customerStanceReminder3 === 'yes') return 'complete';
    if (form.customerStanceReminder3 !== 'no') return 'reminder3';

    return 'final';
  }, [form]);

  // Determine member bank communication level visibility
  const memberBankCommLevel = useMemo(() => {
    if (!form.initialSubmissionSent) return 'initial';
    if (form.feedbackInitial === 'yes') return 'complete';
    if (form.feedbackInitial !== 'no') return 'initial';

    if (!form.memberReminder1Sent) return 'reminder1';
    if (form.feedbackReminder1 === 'yes') return 'complete';
    if (form.feedbackReminder1 !== 'no') return 'reminder1';

    if (!form.memberReminder2Sent) return 'reminder2';
    if (form.feedbackReminder2 === 'yes') return 'complete';
    if (form.feedbackReminder2 !== 'no') return 'reminder2';

    if (!form.memberReminder3Sent) return 'reminder3';
    if (form.feedbackReminder3 === 'yes') return 'complete';
    if (form.feedbackReminder3 !== 'no') return 'reminder3';

    return 'final';
  }, [form]);

  // Render Step 1: Initial Data
  const renderStep1 = () => (
    <div className="space-y-6">
      <SectionHeader>Transaction Information</SectionHeader>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Dispute ID" required>
          <Input
            value={form.disputeId}
            disabled
            className="bg-gray-50"
          />
        </FormField>

        <FormField label="FTDH Receiving Date & Time" required>
          <DateTimeDisplay value={form.ftdhReceivingDateTime} />
        </FormField>

        <FormField label="Sending Bank" required error={errors.sendingBank}>
          <Select value={form.sendingBank} onValueChange={(v) => updateField('sendingBank', v)}>
            <SelectTrigger className={errors.sendingBank ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select sending bank" />
            </SelectTrigger>
            <SelectContent>
              {pakistaniBanks.map((bank) => (
                <SelectItem key={bank.value} value={bank.value}>{bank.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Receiving Bank" required error={errors.receivingBank}>
          <Select value={form.receivingBank} onValueChange={(v) => updateField('receivingBank', v)}>
            <SelectTrigger className={errors.receivingBank ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select receiving bank" />
            </SelectTrigger>
            <SelectContent>
              {pakistaniBanks.map((bank) => (
                <SelectItem key={bank.value} value={bank.value}>{bank.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Channel" required error={errors.channel}>
          <Select value={form.channel} onValueChange={(v) => updateField('channel', v)}>
            <SelectTrigger className={errors.channel ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select channel" />
            </SelectTrigger>
            <SelectContent>
              {ftdhChannels.map((ch) => (
                <SelectItem key={ch.value} value={ch.value}>{ch.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="STAN" required error={errors.stan}>
          <Input
            value={form.stan}
            onChange={(e) => updateField('stan', e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit STAN"
            maxLength={6}
            className={errors.stan ? 'border-red-500' : ''}
          />
        </FormField>

        <FormField label="Sender Account" required error={errors.senderAccount}>
          <Input
            value={form.senderAccount}
            onChange={(e) => updateField('senderAccount', e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24))}
            placeholder="Enter sender account number or IBAN"
            className={errors.senderAccount ? 'border-red-500' : ''}
          />
        </FormField>

        <FormField label="Beneficiary Account" required error={errors.beneficiaryAccount}>
          <Input
            value={form.beneficiaryAccount}
            onChange={(e) => updateField('beneficiaryAccount', e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24))}
            placeholder="Enter beneficiary account number or IBAN"
            className={errors.beneficiaryAccount ? 'border-red-500' : ''}
          />
        </FormField>

        <FormField label="Transaction Date & Time" required error={errors.transactionDateTime}>
          <Input
            type="datetime-local"
            value={form.transactionDateTime ? new Date(form.transactionDateTime).toISOString().slice(0, 16) : ''}
            onChange={(e) => updateField('transactionDateTime', new Date(e.target.value))}
            max={new Date().toISOString().slice(0, 16)}
            className={errors.transactionDateTime ? 'border-red-500' : ''}
          />
        </FormField>

        <FormField label="Transaction Amount (PKR)" required error={errors.transactionAmount}>
          <Input
            value={form.transactionAmount}
            onChange={(e) => {
              const raw = parseAmount(e.target.value);
              updateField('transactionAmount', formatAmount(raw));
            }}
            placeholder="0.00"
            className={errors.transactionAmount ? 'border-red-500' : ''}
          />
        </FormField>
      </div>
    </div>
  );

  // Render Step 2: Actions Taken
  const renderStep2 = () => (
    <div className="space-y-6">
      <SectionHeader>Action Status</SectionHeader>

      <FormField label="Action Taken" required>
        <RadioGroup
          name="actionTaken"
          value={form.actionTaken}
          onChange={(v) => updateField('actionTaken', v)}
          options={[
            { value: 'acknowledge', label: 'Acknowledge' },
            { value: 'invalid', label: 'Invalid' },
          ]}
        />
      </FormField>

      {form.actionTaken === 'invalid' && (
        <FormField label="Invalid Reason" required error={errors.invalidReason} className="animate-in fade-in slide-in-from-top-2 duration-300">
          <Textarea
            value={form.invalidReason}
            onChange={(e) => updateField('invalidReason', e.target.value)}
            placeholder="Enter reason for marking this FTDH as invalid (minimum 20 characters)"
            rows={3}
            className={errors.invalidReason ? 'border-red-500' : ''}
          />
        </FormField>
      )}

      <SectionHeader>Funds & Control Checks</SectionHeader>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Funds Status" required>
          <RadioGroup
            name="fundsStatus"
            value={form.fundsStatus}
            onChange={(v) => updateField('fundsStatus', v)}
            options={[
              { value: 'sufficient', label: 'Sufficient (SF)' },
              { value: 'non_sufficient', label: 'Non-Sufficient (NSF)' },
            ]}
          />
        </FormField>

        <FormField label="Funds Layering" required>
          <RadioGroup
            name="fundsLayering"
            value={form.fundsLayering}
            onChange={(v) => updateField('fundsLayering', v)}
            options={[
              { value: 'no', label: 'No' },
              { value: 'yes', label: 'Yes' },
            ]}
          />
          <p className="text-xs text-gray-400 mt-1">Indicates if funds were transferred onward to other accounts</p>
        </FormField>

        <FormField label="Funds Available (PKR)">
          <Input
            value={form.fundsAvailable}
            onChange={(e) => updateField('fundsAvailable', formatAmount(parseAmount(e.target.value)))}
            placeholder="Enter available balance"
          />
        </FormField>

        <FormField label="Funds on Hold (PKR)">
          <Input
            value={form.fundsOnHold}
            onChange={(e) => updateField('fundsOnHold', formatAmount(parseAmount(e.target.value)))}
            placeholder="Enter held amount"
          />
        </FormField>
      </div>

      <FormField label="Lien Marked" required>
        <RadioGroup
          name="lienMarked"
          value={form.lienMarked}
          onChange={(v) => updateField('lienMarked', v)}
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ]}
        />
        {form.lienMarked === 'no' && (
          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2 animate-in fade-in duration-300">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-700">
              LIEN marking is mandatory regardless of fund availability. Are you sure?
            </p>
          </div>
        )}
      </FormField>

      <FormField label="Channel Block Status" required>
        <div className="flex flex-wrap gap-3">
          {channelBlockOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer transition-all"
            >
              <Checkbox
                checked={form.channelBlockStatus.includes(option.value)}
                onCheckedChange={(checked) => handleChannelBlockToggle(option.value, checked)}
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1">Select all channels that have been blocked</p>
      </FormField>

      <SectionHeader>Recovery Status</SectionHeader>

      <FormField label="Recovery Attempted" required>
        <RadioGroup
          name="recoveryAttempted"
          value={form.recoveryAttempted}
          onChange={(v) => updateField('recoveryAttempted', v)}
          options={[
            { value: 'no', label: 'No' },
            { value: 'yes', label: 'Yes' },
          ]}
        />
      </FormField>

      {form.recoveryAttempted === 'yes' && (
        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <FormField label="Recovery Amount (PKR)" required error={errors.recoveryAmount}>
            <Input
              value={form.recoveryAmount}
              onChange={(e) => updateField('recoveryAmount', formatAmount(parseAmount(e.target.value)))}
              placeholder="Enter recovery amount"
              className={errors.recoveryAmount ? 'border-red-500' : ''}
            />
          </FormField>

          <FormField label="Recovery Date" required error={errors.recoveryDate}>
            <Input
              type="date"
              value={form.recoveryDate ? new Date(form.recoveryDate).toISOString().slice(0, 10) : ''}
              onChange={(e) => updateField('recoveryDate', new Date(e.target.value))}
              max={new Date().toISOString().slice(0, 10)}
              className={errors.recoveryDate ? 'border-red-500' : ''}
            />
          </FormField>
        </div>
      )}
    </div>
  );

  // Render Step 3: Communication with Bank Branch
  const renderStep3 = () => (
    <div className="space-y-4">
      <SectionHeader>Communication with Bank Branch</SectionHeader>

      <CommunicationLevel
        level="initial"
        type="branch"
        sentChecked={form.initialIntimationSent}
        onSentChange={(checked) => handleBranchCommunication('initial', 'sent', checked)}
        sentDateTime={form.initialIntimationDateTime}
        stanceValue={form.customerStanceInitial}
        onStanceChange={(value) => handleBranchCommunication('initial', 'stance', value)}
      />

      {form.initialIntimationSent && form.customerStanceInitial === 'no' && (
        <CommunicationLevel
          level="reminder1"
          type="branch"
          sentChecked={form.reminder1Sent}
          onSentChange={(checked) => handleBranchCommunication('reminder1', 'sent', checked)}
          sentDateTime={form.reminder1DateTime}
          stanceValue={form.customerStanceReminder1}
          onStanceChange={(value) => handleBranchCommunication('reminder1', 'stance', value)}
        />
      )}

      {form.reminder1Sent && form.customerStanceReminder1 === 'no' && (
        <CommunicationLevel
          level="reminder2"
          type="branch"
          sentChecked={form.reminder2Sent}
          onSentChange={(checked) => handleBranchCommunication('reminder2', 'sent', checked)}
          sentDateTime={form.reminder2DateTime}
          stanceValue={form.customerStanceReminder2}
          onStanceChange={(value) => handleBranchCommunication('reminder2', 'stance', value)}
        />
      )}

      {form.reminder2Sent && form.customerStanceReminder2 === 'no' && (
        <CommunicationLevel
          level="reminder3"
          type="branch"
          sentChecked={form.reminder3Sent}
          onSentChange={(checked) => handleBranchCommunication('reminder3', 'sent', checked)}
          sentDateTime={form.reminder3DateTime}
          stanceValue={form.customerStanceReminder3}
          onStanceChange={(value) => handleBranchCommunication('reminder3', 'stance', value)}
        />
      )}

      {form.reminder3Sent && form.customerStanceReminder3 === 'no' && (
        <CommunicationLevel
          level="final"
          type="branch"
          sentChecked={form.businessConsiderationSubmitted}
          onSentChange={(checked) => handleBranchCommunication('final', 'sent', checked)}
          sentDateTime={form.businessConsiderationDateTime}
          stanceValue={null}
          onStanceChange={() => {}}
        />
      )}

      {branchCommLevel === 'complete' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <Check className="h-6 w-6 text-green-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-green-700">Customer stance received - Ready to proceed</p>
        </div>
      )}
    </div>
  );

  // Render Step 4: Communication with Member Bank
  const renderStep4 = () => (
    <div className="space-y-4">
      <SectionHeader>Communication with Member Bank</SectionHeader>

      <CommunicationLevel
        level="initial"
        type="member"
        sentChecked={form.initialSubmissionSent}
        onSentChange={(checked) => handleMemberBankCommunication('initial', 'sent', checked)}
        sentDateTime={form.initialSubmissionDateTime}
        stanceValue={form.feedbackInitial}
        onStanceChange={(value) => handleMemberBankCommunication('initial', 'feedback', value)}
        stanceLabel="Feedback Received from Member Bank"
      />

      {form.initialSubmissionSent && form.feedbackInitial === 'no' && (
        <CommunicationLevel
          level="reminder1"
          type="member"
          sentChecked={form.memberReminder1Sent}
          onSentChange={(checked) => handleMemberBankCommunication('reminder1', 'sent', checked)}
          sentDateTime={form.memberReminder1DateTime}
          stanceValue={form.feedbackReminder1}
          onStanceChange={(value) => handleMemberBankCommunication('reminder1', 'feedback', value)}
          stanceLabel="Feedback Received against 1st Reminder"
        />
      )}

      {form.memberReminder1Sent && form.feedbackReminder1 === 'no' && (
        <CommunicationLevel
          level="reminder2"
          type="member"
          sentChecked={form.memberReminder2Sent}
          onSentChange={(checked) => handleMemberBankCommunication('reminder2', 'sent', checked)}
          sentDateTime={form.memberReminder2DateTime}
          stanceValue={form.feedbackReminder2}
          onStanceChange={(value) => handleMemberBankCommunication('reminder2', 'feedback', value)}
          stanceLabel="Feedback Received against 2nd Reminder"
        />
      )}

      {form.memberReminder2Sent && form.feedbackReminder2 === 'no' && (
        <CommunicationLevel
          level="reminder3"
          type="member"
          sentChecked={form.memberReminder3Sent}
          onSentChange={(checked) => handleMemberBankCommunication('reminder3', 'sent', checked)}
          sentDateTime={form.memberReminder3DateTime}
          stanceValue={form.feedbackReminder3}
          onStanceChange={(value) => handleMemberBankCommunication('reminder3', 'feedback', value)}
          stanceLabel="Feedback Received against 3rd Reminder"
        />
      )}

      {form.memberReminder3Sent && form.feedbackReminder3 === 'no' && (
        <CommunicationLevel
          level="final"
          type="member"
          sentChecked={form.misUpdated}
          onSentChange={(checked) => handleMemberBankCommunication('final', 'sent', checked)}
          sentDateTime={form.misUpdateDateTime}
          stanceValue={null}
          onStanceChange={() => {}}
        />
      )}

      {memberBankCommLevel === 'complete' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <Check className="h-6 w-6 text-green-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-green-700">Member bank feedback received - Ready to generate report</p>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="text-lg font-semibold">
            Create New FTDH Case
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-4 flex-shrink-0">
          <StepIndicator
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-between flex-shrink-0 bg-gray-50">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
            >
              <Save className="mr-2 h-4 w-4" />
              Save as Draft
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <Button
                variant="ghost"
                onClick={handlePrevious}
                disabled={isSubmitting}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
            )}

            {currentStep < 4 ? (
              <Button
                className="bg-[#2064B7] hover:bg-[#2064B7]/90 text-white"
                onClick={handleNext}
                disabled={isSubmitting}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                className="bg-[#22C55E] hover:bg-[#1EA34D] text-white"
                onClick={handleGenerateReport}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default FTDHCaseCreationModal;
