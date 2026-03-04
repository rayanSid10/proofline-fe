import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, ArrowRight, Check, Cloud, X, FileText, Eye, Trash2, Upload, Sparkles, CheckCircle2, Save, AlertTriangle, CalendarDays, Headphones } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { SubmissionProgressBar } from '@/components/modals/SubmissionProgressBar';
import { SubmissionSuccessDialog } from '@/components/modals/SubmissionSuccessDialog';
import { getAllCases } from '@/data/caseStorage';
import { parseActivityLog, matchesToFormState } from '@/utils/parseActivityLog';
import { TranscriptionPanel } from '@/components/panels/TranscriptionPanel';

// ─── Icons (matching InvestigationModal) ──────────────────────────────────────
const ComplaintIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="7" r="4" stroke={active?"#fff":"#AFAFAF"} strokeWidth="1.5" fill="none"/><path d="M4 21V19C4 16.79 5.79 15 8 15H16C18.21 15 20 16.79 20 19V21" stroke={active?"#fff":"#AFAFAF"} strokeWidth="1.5" strokeLinecap="round"/></svg>
);
const InvestigationIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 21 21" fill="none"><path d="M13 2H5C3.9 2 3 2.9 3 4V18C3 19.1 3.9 20 5 20H15C16.1 20 17 19.1 17 18V6L13 2Z" stroke={active?"#fff":"#AFAFAF"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="10" cy="12" r="2" stroke={active?"#fff":"#AFAFAF"} strokeWidth="1.5"/><path d="M11.5 13.5L13 15" stroke={active?"#fff":"#AFAFAF"} strokeWidth="1.5" strokeLinecap="round"/></svg>
);
const ActionTakenIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 21" fill="none"><circle cx="10" cy="10.5" r="8" stroke={active?"#fff":"#AFAFAF"} strokeWidth="1.5"/><path d="M6 10.5L9 13.5L14 8.5" stroke={active?"#fff":"#AFAFAF"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const SystemFactsIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 28 21" fill="none"><path d="M1 10.5C1 10.5 5 2.5 14 2.5C23 2.5 27 10.5 27 10.5C27 10.5 23 18.5 14 18.5C5 18.5 1 10.5 1 10.5Z" stroke={active?"#fff":"#AFAFAF"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="14" cy="10.5" r="4" stroke={active?"#fff":"#AFAFAF"} strokeWidth="1.5"/></svg>
);
const ConclusionIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 21 21" fill="none"><path d="M16 2H5C3.9 2 3 2.9 3 4V17C3 18.1 3.9 19 5 19H16C17.1 19 18 18.1 18 17V4C18 2.9 17.1 2 16 2Z" stroke={active?"#fff":"#AFAFAF"} strokeWidth="1.5"/><path d="M7 10L9.5 12.5L14 8" stroke={active?"#fff":"#AFAFAF"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 15H14" stroke={active?"#fff":"#AFAFAF"} strokeWidth="1.5" strokeLinecap="round"/></svg>
);
const AnnxIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 21 21" fill="none"><path d="M18.5 9.5V15.5C18.5 16.6 17.4 17.5 16.5 17.5H4.5C3.4 17.5 2.5 16.6 2.5 15.5V5.5C2.5 4.4 3.4 3.5 4.5 3.5H10.5" stroke={active?"#fff":"#AFAFAF"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M14.5 2.5L18.5 6.5" stroke={active?"#fff":"#AFAFAF"} strokeWidth="1.5" strokeLinecap="round"/><path d="M14.5 2.5V6.5H18.5" stroke={active?"#fff":"#AFAFAF"} strokeWidth="1.5" strokeLinecap="round"/></svg>
);

const steps = [
  { id: 1, title: 'Customer / Complaint Details', Icon: ComplaintIcon },
  { id: 2, title: 'Investigation', Icon: InvestigationIcon },
  { id: 3, title: 'Action Taken', Icon: ActionTakenIcon },
  { id: 4, title: 'System Facts / Observations', Icon: SystemFactsIcon },
  { id: 5, title: 'Conclusion', Icon: ConclusionIcon },
  { id: 6, title: 'Annx', Icon: AnnxIcon },
];

const txnPatternOptions = [
  'Transaction pattern seems Normal as compared with previous history',
  'Transaction pattern seems suspicious as compared with pervious history',
  'No previous history observed, current activity shows frequent use / explorer of multiple options',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCurrency = (amount) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

// ─── Reusable Sub-components ─────────────────────────────────────────────────
function StepIndicator({ currentStep, onStepClick }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#E5E7EB] overflow-x-auto">
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.id;
        const isActive = currentStep === step.id;
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <button
              type="button"
              onClick={() => onStepClick(step.id)}
              className="flex items-center gap-2.5 min-w-max cursor-pointer group"
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shrink-0",
                isCompleted ? "bg-[#22C55E] group-hover:bg-[#16A34A]" : isActive ? "bg-[#2064B7] shadow-lg shadow-[#2064B7]/30" : "bg-[#F3F4F6] border border-[#D1D5DB] group-hover:border-[#2064B7] group-hover:bg-[#EFF6FF]"
              )}>
                {isCompleted ? <Check className="w-5 h-5 text-white" /> : <step.Icon active={isActive} />}
              </div>
              <span className={cn(
                "text-[13px] font-medium whitespace-nowrap hidden lg:inline transition-colors",
                isActive ? "text-[#2064B7] font-semibold" : isCompleted ? "text-[#22C55E] group-hover:text-[#16A34A]" : "text-[#9CA3AF] group-hover:text-[#2064B7]"
              )}>{step.title}</span>
            </button>
            {index < steps.length - 1 && (
              <div className={cn("h-[2px] flex-1 mx-3 min-w-[20px] rounded-full transition-colors", isCompleted ? "bg-[#22C55E]" : "bg-[#E5E7EB]")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const ChipOption = ({ value, selected, onChange, label }) => (
  <button
    type="button"
    onClick={() => onChange(value)}
    className={cn(
      'inline-flex items-center gap-2 py-1 text-[13px] font-medium transition-colors',
      selected ? 'text-[#111827]' : 'text-[#6B7280] hover:text-[#2064B7]'
    )}
  >
    <span
      className={cn(
        'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
        selected ? 'border-[#2064B7]' : 'border-[#D1D5DB]'
      )}
    >
      <span className={cn('w-2.5 h-2.5 rounded-full transition-colors', selected ? 'bg-[#2064B7]' : 'bg-transparent')} />
    </span>
    <span>{label}</span>
  </button>
);

const FormField = ({ label, required, children, output, large, isInput }) => (
  <div className={cn("grid grid-cols-[1fr_1.2fr_1.2fr] gap-0 border-b border-[#E5E7EB] last:border-b-0", large ? "min-h-[80px]" : "min-h-[44px]")}>
    <div className="flex items-center px-4 py-2.5 bg-[#F9FAFB] border-r border-[#E5E7EB]">
      <span className="text-[13px] font-semibold text-[#374151] leading-[18px]">
        {label}{required && <span className="text-[#EF4444] ml-0.5">*</span>}
      </span>
    </div>
    <div className={cn(
      "flex bg-white border-r border-[#E5E7EB]",
      isInput ? "items-stretch p-0" : "items-center px-4 py-2.5"
    )}>{children}</div>
    <div className="flex items-center px-4 py-2.5 bg-[#F0F7FF]">
      <span className="text-[12px] text-[#6B7280] leading-[17px]">{output || '—'}</span>
    </div>
  </div>
);

const SectionDivider = ({ title }) => (
  <div className="bg-[#EFF6FF] px-4 py-2 border-b border-[#E5E7EB]">
    <span className="text-[11px] font-bold text-[#2064B7] uppercase tracking-wider">{title}</span>
  </div>
);

const DateInputWithIcon = ({ type = 'date', value, onChange, placeholder }) => {
  const inputRef = useRef(null);
  const openPicker = () => {
    const input = inputRef.current;
    if (!input) return;
    input.showPicker?.();
    input.focus();
  };

  return (
    <div className="relative w-full h-full">
      <button
        type="button"
        onClick={openPicker}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2064B7] z-10"
      >
        <CalendarDays className="w-4 h-4" />
      </button>
      <Input
        ref={inputRef}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="no-native-picker w-full h-full border-0 bg-transparent focus-visible:ring-0 pl-10 pr-4 py-2.5 rounded-none text-[13px] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:pointer-events-none"
        style={{ WebkitAppearance: 'none', appearance: 'none' }}
      />
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export function InvestigationFormPage({ currentRole = 'investigator', currentUser = null }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);      // true when form has unsaved changes
  const [isSaving, setIsSaving] = useState(false);    // true while save animation plays
  const [showExitPrompt, setShowExitPrompt] = useState(false); // unsaved-changes warning
  const [pendingNavDest, setPendingNavDest] = useState(null);  // where we want to go after confirm
  const fileInputRef = useRef(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const activityLogRef = useRef(null);
  const [logParseResult, setLogParseResult] = useState(null); // { matches, unmatchedLines }
  const [showLogBanner, setShowLogBanner] = useState(false);
  const [transcriptionOpen, setTranscriptionOpen] = useState(false);
  const hydratedFromDraftRef = useRef(false);

  const caseData = getAllCases().find((c) => c.id === parseInt(id));
  const isSupervisorOrAdmin = currentRole === 'supervisor' || currentRole === 'admin';
  const isAssignedInvestigator =
    currentRole === 'investigator' &&
    String(currentUser?.name || '').trim().toLowerCase() ===
      String(caseData?.assigned_to?.name || '').trim().toLowerCase();
  const canAccessInvestigation = isSupervisorOrAdmin || isAssignedInvestigator;

  const [f, setF] = useState({
    // Step 1: Customer / Complaint Details
    investigationOfficer: '', complaintNo: '', caseReferenceNo: '', caseReceivingChannel: '',
    disputeAmountAtRisk: '', expectedRecovery: 'NIL', expectedRecoveryMemberBank: 'NIL', disputedTxnDetails: '', fmsAlertGenerated: 'no',
    incidentDate: '', incidentDateTo: '', caseReceivingDate: '',
    customerNameField: '', customerAccountNoField: '', branchCodeField: '',
    // Step 2: Investigation — Customer Contact
    cxCallDatetime: '', initialCustomerStance: '', ioCallMade: '', contactEstablished: '',
    customerCli: '', rcChannel: '', ioCallDatetime: '', letterSent: '',
    ioCallStance: '', simBlocked: '',
    // Step 2: Channel & Device Analysis
    mbCreationDatetime: '', dcCreationDatetime: '', ccCreationDatetime: '', mbCreationSource: '',
    hblMobileAppActivityReview: '', userSinceDatetime: '',
    initialDeviceId: '', loginId: '', loginIp: '', credentialChange: 'no',
    tpinChange: 'no', newDevice: 'no',
    // Step 2: Limits & Behavioral Analysis
    limitEnhanced: 'no', previousLimit: '', newLimit: '', limitMode: '',
    txnPattern: '', deviceChange: 'no', ipChange: 'no', productsAvailed: '', otpDelivered: '',
    // Step 3: Action Taken
    deviceBlockedFlag: '', fraudsterNumberReported: '', ftdhStatus: '', fundLayeredFlag: '',
    pstrFlag: '', piiReviewedFlag: '', suspectedStaffName: 'NA', suspectedStaffFeedback: 'NA',
    frmuReviewFlag: '', customerAccountOpeningDate: '2024-12-12', customerAccountType: 'Saving Account',
    kycReviewDebitCreditCount: '6/6', customerProfileKyc: 'Salaried Person', frmAlert: '',
    // Step 4: System Facts
    gapIdentified: '', factFindings: '', controlBreaches: '', controlBreachesObserved: '',
    rootCause: '', fraudTypeSystem: '',
    // Step 5: Conclusion
    netLossBooked: '', finalConclusionType: '', recommendation: '', actionOwner: '', actionStatus: '',
  });

  useEffect(() => {
    const draft = location.state?.draftForm;
    const draftFiles = location.state?.uploadedFiles;
    if (draft && typeof draft === 'object') {
      setF(draft);
      hydratedFromDraftRef.current = true;
    }
    if (Array.isArray(draftFiles)) {
      setUploadedFiles(draftFiles);
    }
  }, [location.state]);

  useEffect(() => {
    if (hydratedFromDraftRef.current) return;
    if (!caseData) return;
    const txDates = caseData.transactions?.map(t => new Date(t.transaction_date)) || [];
    const minD = txDates.length ? format(new Date(Math.min(...txDates)), 'dd-MMM-yyyy') : '—';
    const maxD = txDates.length ? format(new Date(Math.max(...txDates)), 'dd-MMM-yyyy') : '—';
    const ch = caseData.channel === 'contact_center' ? 'Contact Center' : caseData.channel === 'branch' ? 'Branch' : caseData.channel === 'email' ? 'Email' : caseData.channel === 'mobile_app' ? 'Mobile App' : caseData.channel;
    setF(p => ({
      ...p,
      investigationOfficer: caseData.assigned_to?.name || 'Not Assigned',
      complaintNo: caseData.complaint_number || '—',
      caseReferenceNo: caseData.reference_number || '',
      caseReceivingChannel: ch || '',
      disputeAmountAtRisk: caseData.total_disputed_amount ? formatCurrency(caseData.total_disputed_amount) : '',
      disputedTxnDetails: `${minD} to ${maxD}`,
      incidentDate: txDates.length ? format(new Date(Math.min(...txDates)), 'yyyy-MM-dd') : (caseData.case_received_date || ''),
      incidentDateTo: txDates.length ? format(new Date(Math.max(...txDates)), 'yyyy-MM-dd') : (caseData.case_received_date || ''),
      caseReceivingDate: caseData.case_received_date || '',
      customerNameField: caseData.customer?.name || '',
      customerAccountNoField: caseData.customer?.account_number || '',
      branchCodeField: caseData.branch_code || String(caseData.customer?.account_number || '').slice(0, 4) || '',
      customerCli: caseData.customer?.mobile || '',
      rootCause: caseData.fraud_type === 'sim_swap' ? 'SIM Swap Fraud' : caseData.fraud_type === 'social_engineering' ? 'Social Engineering' : caseData.fraud_type === 'phishing' ? 'Phishing Attack' : '',
      fraudTypeSystem: caseData.fraud_type ? caseData.fraud_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '',
      // Simulated auto-populated device/channel data
      mbCreationDatetime: '', dcCreationDatetime: '',
      ccCreationDatetime: '', mbCreationSource: 'Debit Card',
      hblMobileAppActivityReview: '', userSinceDatetime: '',
      initialDeviceId: 'Vivo-V4521', loginId: 'mhassan1212',
      loginIp: 'Same IP range', previousLimit: 'PKR 1,000,000',
      newLimit: 'PKR 1,000,000', txnPattern: 'Normal vs history',
      productsAvailed: 'yes', otpDelivered: 'yes',
    }));
  }, [caseData]);

  useEffect(() => {
    if (currentStep !== 2 && transcriptionOpen) {
      setTranscriptionOpen(false);
    }
  }, [currentStep, transcriptionOpen]);

  const set = (key, val) => {
    setF(p => ({ ...p, [key]: val }));
    setIsDirty(true);
  };

  const out = (field, value) => {
    const map = {
      ioCallMade: value === 'yes' ? 'Customer was contacted by the investigation officer.' : value === 'no' ? 'Customer was not contacted.' : '—',
      contactEstablished: value === 'yes' ? 'Contact was successfully established with the customer.' : value === 'no' ? 'Contact could not be established.' : '—',
      letterSent: value === 'yes' ? 'Communication letter was sent to the customer.' : value === 'no' ? 'Communication letter was not sent.' : '—',
      simBlocked: value === 'yes' ? 'Customer/Beneficiary SIM has been blocked.' : value === 'no' ? 'Customer/Beneficiary SIM was not blocked.' : '—',
      deviceBlockedFlag: value === 'yes' ? 'The observed device was marked as blocked.' : value === 'no' ? 'Device was not blocked.' : '—',
      fraudsterNumberReported: value === 'yes' ? 'Fraudster number reported to PTA.' : value === 'no' ? 'Fraudster number was not reported.' : '—',
      fundLayeredFlag: value === 'yes' ? 'Fund layering details shared by member bank.' : value === 'no' ? 'No detail shared by member bank related to layering.' : '—',
      pstrFlag: value === 'yes' ? 'PSTR was raised against the observed On-Us customer account.' : value === 'no' ? 'PSTR was not raised.' : '—',
      piiReviewedFlag: value === 'yes' ? 'P-II review was conducted.' : value === 'no' ? 'No fraudulent element observed. P-II was not reviewed.' : '—',
      gapIdentified: value === 'yes' ? 'Internal gap has been identified in this case.' : value === 'no' ? 'No internal gap is observed in this case.' : '—',
      controlBreaches: value === 'yes' ? 'Control breach has been identified.' : value === 'no' ? 'No Control Breach is observed.' : '—',
      credentialChange: value === 'yes' ? 'Credential change detected within last 2 months.' : value === 'no' ? 'No credential change detected.' : '—',
      tpinChange: value === 'yes' ? 'T-PIN change detected.' : value === 'no' ? 'No T-PIN change detected.' : '—',
      newDevice: value === 'yes' ? 'New device registration detected.' : value === 'no' ? 'No new device registration.' : '—',
      limitEnhanced: value === 'yes' ? 'Transaction limit was enhanced.' : value === 'no' ? 'No limit enhancement.' : '—',
      deviceChange: value === 'yes' ? 'Change in device detail detected.' : value === 'no' ? 'No change in device detail.' : value === 'na' ? '-' : '—',
      productsAvailed: value === 'yes' ? 'Consumer product availed.' : value === 'no' ? 'No consumer product availed.' : '—',
      ipChange: value === 'yes' ? 'Change of IP / location detected.' : value === 'no' ? 'No change in IP / location.' : '—',
      frmAlert: value === 'yes' ? 'FRM system alert was generated.' : value === 'no' ? 'No FRM system alert was generated.' : '—',
      hblMobileAppActivityReview: value === 'yes' ? 'HBL Mobile Application channel activity reviewed.' : value === 'no' ? 'HBL Mobile Application channel activity not reviewed.' : '—',
    };
    return map[field] || '—';
  };

  const handleSaveDraft = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsDirty(false);
      toast.success('Draft saved', {
        description: 'Your investigation report progress has been saved.',
        duration: 3000,
      });
    }, 800);
  };

  const handleNavigateBack = () => {
    if (isDirty) {
      setPendingNavDest(`/cases/${id}`);
      setShowExitPrompt(true);
    } else {
      navigate(`/cases/${id}`);
    }
  };

  const handleDiscardAndExit = () => {
    setShowExitPrompt(false);
    setIsDirty(false);
    navigate(pendingNavDest);
  };

  const handleSaveAndExit = () => {
    setShowExitPrompt(false);
    setIsDirty(false);
    toast.success('Draft saved', { description: 'Your progress has been saved.', duration: 2000 });
    setTimeout(() => navigate(pendingNavDest), 600);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true); setSubmissionStep(1);
    for (let i = 1; i <= 6; i++) { await new Promise(r => setTimeout(r, 500)); setSubmissionStep(i); }
    await new Promise(r => setTimeout(r, 500));
    setIsSubmitting(false); setShowSuccess(true);
  };
  const handleReviewReport = () => {
    navigate(`/cases/${id}/investigation-review`, {
      state: {
        draftForm: f,
        uploadedFiles,
      },
    });
  };
  const handleSuccessClose = () => { setShowSuccess(false); setSubmissionStep(0); navigate(`/cases/${id}`); };

  // File upload handlers
  const handleFiles = (files) => {
    const newFiles = Array.from(files).map((file, i) => ({
      id: Date.now() + i, name: file.name,
      size: `${Math.round(file.size / 1024)} KB`, totalSize: `${Math.round(file.size / 1024)} KB`,
      status: 'Completed', file,
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };
  const handleDrop = (e) => { e.preventDefault(); setIsDragOver(false); handleFiles(e.dataTransfer.files); };
  const getFileExt = (name) => name.split('.').pop().toUpperCase();

  // ─── Activity Log Upload Handler ─────────────────────────────────────────────
  const handleActivityLogUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const result = parseActivityLog(text);
      if (result.matches.length > 0) {
        // Apply parsed values to form state
        const newValues = matchesToFormState(result.matches);
        setF(prev => ({ ...prev, ...newValues }));
        setIsDirty(true);
      }
      setLogParseResult(result);
      setShowLogBanner(true);
      // Auto-dismiss after 10 seconds
      setTimeout(() => setShowLogBanner(false), 10000);
    };
    reader.readAsText(file);
    // Reset input so same file can be re-uploaded
    e.target.value = '';
  };

  if (!caseData) return (
    <div className="flex flex-col items-center justify-center h-64">
      <h2 className="text-xl font-semibold">Case not found</h2>
      <Button className="mt-4" onClick={() => navigate('/cases')}>Back to Cases</Button>
    </div>
  );

  if (!canAccessInvestigation) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-xl font-semibold">Access restricted</h2>
        <p className="text-sm text-muted-foreground mt-2 text-center max-w-xl">
          Only the assigned investigator ({caseData.assigned_to?.name || 'N/A'}) can start or continue this investigation.
        </p>
        <Button className="mt-4" onClick={() => navigate(`/cases/${id}`)}>Back to Case Details</Button>
      </div>
    );
  }

  const customerName = caseData.customer.name;
  const customerCnic = caseData.customer.cnic;
  const customerAccount = caseData.customer.account_number;

  return (
    <>
      <div className="h-screen flex flex-col bg-white">
        {/* Header */}
        <div className="bg-[#2064B7] px-6 py-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleNavigateBack} className="text-white hover:bg-white/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-[22px] font-bold text-white">Investigation Report</h1>
              <p className="text-[12px] text-white/70">{caseData.reference_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDirty && (
              <span className="text-[11px] font-medium text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full flex items-center gap-1 mr-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                Unsaved changes
              </span>
            )}
            <Button
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white gap-2 transition-all"
              onClick={handleSaveDraft}
              disabled={isSaving}
            >
              <Save className={`w-4 h-4 ${isSaving ? 'animate-pulse' : ''}`} />
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>
            {currentStep === 2 && (
              <Button
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white gap-2 transition-all"
                onClick={() => activityLogRef.current?.click()}
              >
                <Upload className="w-4 h-4" />
                Upload Activity Log
              </Button>
            )}
          </div>
        </div>

        {/* Activity Log Upload — hidden input */}
        <input
          ref={activityLogRef}
          type="file"
          accept=".txt,.csv,.log"
          onChange={handleActivityLogUpload}
          className="hidden"
        />

        {/* Activity Log Parse Results Banner */}
        {currentStep === 2 && showLogBanner && logParseResult && (
          <div className="bg-[#F0FDF4] border-b border-[#BBF7D0] px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#166534]">
                    Activity Log Parsed — {logParseResult.matches.length} field{logParseResult.matches.length !== 1 ? 's' : ''} populated
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    {logParseResult.matches.map(m => (
                      <span key={m.field} className="text-[12px] text-[#15803D] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <strong>{m.label}:</strong> {m.type === 'choice' ? (m.value === 'yes' ? 'Yes' : 'No') : `"${m.value}"`}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => setShowLogBanner(false)} className="text-[#166534] hover:text-[#14532D]">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Unsaved Changes Exit Prompt */}
        {showExitPrompt && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
            <div className="bg-white rounded-2xl shadow-2xl w-[420px] p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#111827]">Unsaved Changes</h3>
                  <p className="text-[13px] text-[#6B7280]">Your investigation report has unsaved changes.</p>
                </div>
              </div>
              <p className="text-[13px] text-[#374151] mb-6 leading-relaxed">
                If you leave now, your current progress will be lost. Would you like to save your draft before exiting?
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  className="text-[#EF4444] border-[#FCA5A5] hover:bg-red-50"
                  onClick={handleDiscardAndExit}
                >
                  Discard & Exit
                </Button>
                <Button
                  className="bg-[#2064B7] hover:bg-[#1a5298] text-white gap-2"
                  onClick={handleSaveAndExit}
                >
                  <Save className="w-4 h-4" />
                  Save & Exit
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step Indicator — clickable tabs */}
        <div className="sticky top-0 z-10">
          <StepIndicator currentStep={currentStep} onStepClick={setCurrentStep} />
        </div>

        {/* Submission overlay */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-[#2A2A2A]/90 flex items-center justify-center z-[100]">
            <SubmissionProgressBar currentStep={submissionStep} totalSteps={6} />
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* ═══════ Step 1: Customer / Complaint Details ═══════ */}
          {currentStep === 1 && (
            <Card className="border-0 rounded-none shadow-none overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-[1fr_1.2fr_1.2fr] bg-[#2064B7] text-white text-[13px] font-semibold">
                  <div className="px-4 py-2.5">Headers</div>
                  <div className="px-4 py-2.5 border-l border-white/20">Input Fields</div>
                  <div className="px-4 py-2.5 border-l border-white/20">Output</div>
                </div>
                <FormField isInput label="Investigation Officer" output="Staff data matched via Master Key">
                  <Input value={f.investigationOfficer} onChange={e => set('investigationOfficer', e.target.value)} className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
                <FormField isInput label="Complaint No" output={`Case received from ${f.caseReceivingChannel} on ${f.caseReceivingDate}, Complaint No. ${f.complaintNo}`}>
                  <Input value={f.complaintNo} onChange={e => set('complaintNo', e.target.value)} className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
                <FormField isInput label="Case Reference No">
                  <Input value={f.caseReferenceNo} onChange={e => set('caseReferenceNo', e.target.value)} className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
                <FormField isInput label="Case Receiving Channel">
                  <Input value={f.caseReceivingChannel} onChange={e => set('caseReceivingChannel', e.target.value)} className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
                <FormField isInput label="Dispute Amount At Risk" required output={`The customer raised dispute against total amount ${f.disputeAmountAtRisk}`}>
                  <Input value={f.disputeAmountAtRisk} onChange={e => set('disputeAmountAtRisk', e.target.value)} className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
                <FormField isInput label="Expected Recovery From ON-US Beneficiary" output="No recovery expected from On-us customer accounts">
                  <Input value={f.expectedRecovery} onChange={e => set('expectedRecovery', e.target.value)} className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
                <FormField isInput label="Expected Recovery from Member/Bank Beneficiary" output={f.expectedRecoveryMemberBank || '—'}>
                  <Input value={f.expectedRecoveryMemberBank} onChange={e => set('expectedRecoveryMemberBank', e.target.value)} className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
                <FormField isInput label="Disputed Transaction Details" large output={
                  <div className="w-full">
                    <div className="bg-white border border-[#E5E7EB] rounded-lg p-2 text-[10px]">
                      <div className="grid grid-cols-4 gap-1 mb-1 font-semibold text-[#6B7280]">
                        <span>Txn ID</span><span>Beneficiary</span><span>Amount</span><span>Channel</span>
                      </div>
                      {caseData.transactions.map((txn, i) => (
                        <div key={i} className="grid grid-cols-4 gap-1 py-1 border-t border-[#F3F4F6]">
                          <span>{txn.transaction_id}</span>
                          <span>{txn.beneficiary_bank}</span>
                          <span className="text-[#2064B7]">{formatCurrency(txn.disputed_amount)}</span>
                          <span>{txn.channel}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                }>
                  <Input value={f.disputedTxnDetails} onChange={e => set('disputedTxnDetails', e.target.value)} className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
                <FormField label="Alert Generated by FMS" required output={f.fmsAlertGenerated === 'yes' ? 'Alert was generated by the Fraud Monitoring System.' : 'Amount under threshold, alerts not generated.'}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.fmsAlertGenerated==='yes'} onChange={v => set('fmsAlertGenerated', v)} label="Yes" />
                    <ChipOption value="no" selected={f.fmsAlertGenerated==='no'} onChange={v => set('fmsAlertGenerated', v)} label="No" />
                  </div>
                </FormField>
                <FormField isInput label="Customer Name" output={f.customerNameField || '—'}>
                  <Input value={f.customerNameField} onChange={e => set('customerNameField', e.target.value)} className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
                <FormField isInput label="Customer Account No" output={f.customerAccountNoField || '—'}>
                  <Input value={f.customerAccountNoField} onChange={e => set('customerAccountNoField', e.target.value)} className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
                <FormField isInput label="Branch Code" output={f.branchCodeField || '—'}>
                  <Input value={f.branchCodeField} onChange={e => set('branchCodeField', e.target.value)} className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
                <FormField isInput label="Date(s) Incident Occurred" output={`Disputed transactions debited on ${f.incidentDate}${f.incidentDateTo ? ` to ${f.incidentDateTo}` : ''}`}>
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center w-full h-full px-2 py-1.5">
                    <DateInputWithIcon type="date" value={f.incidentDate} onChange={e => set('incidentDate', e.target.value)} placeholder="Date 1" />
                    <span className="text-[13px] font-medium text-[#6B7280]">to</span>
                    <DateInputWithIcon type="date" value={f.incidentDateTo} onChange={e => set('incidentDateTo', e.target.value)} placeholder="Date 2" />
                  </div>
                </FormField>
                <FormField isInput label="Case Receiving Date" output={`Customer called bank helpline on ${f.caseReceivingDate}`}>
                  <DateInputWithIcon type="date" value={f.caseReceivingDate} onChange={e => set('caseReceivingDate', e.target.value)} placeholder="dd/mm/yyyy" />
                </FormField>
              </CardContent>
            </Card>
          )}

          {/* ═══════ Step 2: Investigation (All 29 Fields) ═══════ */}
          {currentStep === 2 && (
            <Card className="border-0 rounded-none shadow-none overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-[1fr_1.2fr_1.2fr] bg-[#2064B7] text-white text-[13px] font-semibold">
                  <div className="px-4 py-2.5">Headers</div>
                  <div className="px-4 py-2.5 border-l border-white/20">Input Fields</div>
                  <div className="px-4 py-2.5 border-l border-white/20">Output</div>
                </div>

                {/* Customer Contact Section */}
                <SectionDivider title="Customer Contact" />
                <FormField isInput label="Customer Call at Contact Centre (Date & Time)" required>
                  <DateInputWithIcon type="datetime-local" value={f.cxCallDatetime} onChange={e => set('cxCallDatetime', e.target.value)} placeholder="Auto-picked from CX Excel" />
                </FormField>
                <FormField isInput label="Customer Stance as per Initial Call" required large output={f.initialCustomerStance || 'Customer disowned the transactions, claimed fraud.'}>
                  <Textarea value={f.initialCustomerStance} onChange={e => set('initialCustomerStance', e.target.value)} placeholder="Enter customer's initial stance..." className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px] resize-none" />
                </FormField>
                <FormField label="Call was made to the Customer" required output={out('ioCallMade', f.ioCallMade)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.ioCallMade==='yes'} onChange={v => set('ioCallMade', v)} label="Yes" />
                    <ChipOption value="no" selected={f.ioCallMade==='no'} onChange={v => set('ioCallMade', v)} label="No" />
                  </div>
                </FormField>
                <FormField label="Contact Established" required output={out('contactEstablished', f.contactEstablished)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.contactEstablished==='yes'} onChange={v => set('contactEstablished', v)} label="Yes" />
                    <ChipOption value="no" selected={f.contactEstablished==='no'} onChange={v => set('contactEstablished', v)} label="No" />
                  </div>
                </FormField>
                <FormField isInput label="Customer CLI Number" required>
                  <Input value={f.customerCli} onChange={e => set('customerCli', e.target.value)} placeholder="Enter customer CLI number" className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
                <FormField isInput label="Calling RC (Recording Channel)" required>
                  <Input value={f.rcChannel} onChange={e => set('rcChannel', e.target.value)} placeholder="e.g. 25148" className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
                <FormField isInput label="Customer Communication Date / Time (IO Call)" required output={f.ioCallDatetime ? `IO call made on ${f.ioCallDatetime}` : '—'}>
                  <DateInputWithIcon type="datetime-local" value={f.ioCallDatetime} onChange={e => set('ioCallDatetime', e.target.value)} />
                </FormField>
                <FormField label="Communication Letter Sent" required output={out('letterSent', f.letterSent)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.letterSent==='yes'} onChange={v => set('letterSent', v)} label="Yes" />
                    <ChipOption value="no" selected={f.letterSent==='no'} onChange={v => set('letterSent', v)} label="No" />
                  </div>
                </FormField>
                <FormField isInput label="Customer Stance as per IO Call" required large output={f.ioCallStance || '—'}>
                  <Textarea value={f.ioCallStance} onChange={e => set('ioCallStance', e.target.value)} placeholder="Enter stance during IO call..." className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px] resize-none" />
                </FormField>
                <FormField label="Customer / Beneficiary SIM Blocked" required output={out('simBlocked', f.simBlocked)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.simBlocked==='yes'} onChange={v => set('simBlocked', v)} label="Yes" />
                    <ChipOption value="no" selected={f.simBlocked==='no'} onChange={v => set('simBlocked', v)} label="No" />
                  </div>
                </FormField>

                {/* Channel & Device Analysis */}
                <SectionDivider title="Channel & Device Analysis" />
                <FormField isInput label="Customer IB/MB Channel Creation (Date & Time)" required>
                  <DateInputWithIcon type="datetime-local" value={f.mbCreationDatetime} onChange={e => set('mbCreationDatetime', e.target.value)} />
                </FormField>
                <FormField isInput label="Customer Debit Card Creation (Date & Time)" required>
                  <DateInputWithIcon type="datetime-local" value={f.dcCreationDatetime} onChange={e => set('dcCreationDatetime', e.target.value)} />
                </FormField>
                <FormField isInput label="Customer Credit Card Creation (Date & Time)" required>
                  <DateInputWithIcon type="datetime-local" value={f.ccCreationDatetime} onChange={e => set('ccCreationDatetime', e.target.value)} />
                </FormField>
                <FormField isInput label="Source of IB/MB Channel Creation" required>
                  <Input value={f.mbCreationSource} onChange={e => set('mbCreationSource', e.target.value)} placeholder="Enter source of IB/MB channel creation" className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
                <FormField label="HBL Mobile Application Channel Activity Review" required output={out('hblMobileAppActivityReview', f.hblMobileAppActivityReview)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.hblMobileAppActivityReview==='yes'} onChange={v => set('hblMobileAppActivityReview', v)} label="Yes" />
                    <ChipOption value="no" selected={f.hblMobileAppActivityReview==='no'} onChange={v => set('hblMobileAppActivityReview', v)} label="No" />
                  </div>
                </FormField>
                <FormField isInput label="User Since (Date / Time)" required output={f.userSinceDatetime ? `User since ${f.userSinceDatetime}` : '—'}>
                  <DateInputWithIcon type="datetime-local" value={f.userSinceDatetime} onChange={e => set('userSinceDatetime', e.target.value)} />
                </FormField>
                <FormField isInput label="Initial Device (at the time of registration)" required>
                  <Input value={f.initialDeviceId} onChange={e => set('initialDeviceId', e.target.value)} placeholder="Enter initial device" className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
                <FormField isInput label="Customer Login ID (User Name)" required>
                  <Input value={f.loginId} onChange={e => set('loginId', e.target.value)} placeholder="Enter customer login ID" className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
                <FormField isInput label="User IP Address / LAT / LOG (IP and Lat / Log maybe combined or separate)" required>
                  <Input value={f.loginIp} onChange={e => set('loginIp', e.target.value)} placeholder="Enter IP / latitude / longitude" className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
                <FormField label="Date and Time of change of Login ID & Password (last 12 months from the date of disputed transactions)" required output={out('credentialChange', f.credentialChange)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.credentialChange==='yes'} onChange={v => set('credentialChange', v)} label="Yes" />
                    <ChipOption value="no" selected={f.credentialChange==='no'} onChange={v => set('credentialChange', v)} label="No" />
                  </div>
                </FormField>
                <FormField label="Date and Time of change of TPin(last 12 months from the date of disputed transactions)" required output={out('tpinChange', f.tpinChange)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.tpinChange==='yes'} onChange={v => set('tpinChange', v)} label="Yes" />
                    <ChipOption value="no" selected={f.tpinChange==='no'} onChange={v => set('tpinChange', v)} label="No" />
                  </div>
                </FormField>
                <FormField label="Date and Time of change of New Device Registration" required output={out('newDevice', f.newDevice)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.newDevice==='yes'} onChange={v => set('newDevice', v)} label="Yes" />
                    <ChipOption value="no" selected={f.newDevice==='no'} onChange={v => set('newDevice', v)} label="No" />
                  </div>
                </FormField>

                {/* Limits & Behavioral Analysis */}
                <SectionDivider title="Limits & Behavioral Analysis" />
                <FormField label="Date and Time of Limit Enhancement" required output={out('limitEnhanced', f.limitEnhanced)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.limitEnhanced==='yes'} onChange={v => set('limitEnhanced', v)} label="Yes" />
                    <ChipOption value="no" selected={f.limitEnhanced==='no'} onChange={v => set('limitEnhanced', v)} label="No" />
                  </div>
                </FormField>
                <FormField isInput label="Customer Default / Previous Limit" required>
                  <Input value={f.previousLimit} onChange={e => set('previousLimit', e.target.value)} placeholder="Enter previous limit" className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
                <FormField isInput label="Customer New Limit, if Change Observed" required>
                  <Input value={f.newLimit} onChange={e => set('newLimit', e.target.value)} placeholder="Enter new limit" className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
                <FormField isInput label="Mode of Limit Enhancement" required>
                  <Input value={f.limitMode} onChange={e => set('limitMode', e.target.value)} placeholder="N/A" className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
                <FormField label="Customer Disputed Transaction Pattern" required output={f.txnPattern || '—'}>
                  <div className="w-full py-2 space-y-2">
                    {txnPatternOptions.map((option) => {
                      const selected = f.txnPattern === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => set('txnPattern', option)}
                          className={cn('w-full inline-flex items-start gap-2 text-left py-1 text-[12px] leading-[1.4] transition-colors', selected ? 'text-[#111827]' : 'text-[#374151]')}
                        >
                          <span
                            className={cn(
                              'mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                              selected ? 'border-[#2064B7]' : 'border-[#D1D5DB]'
                            )}
                          >
                            <span className={cn('w-2.5 h-2.5 rounded-full', selected ? 'bg-[#2064B7]' : 'bg-transparent')} />
                          </span>
                          <span>{option}</span>
                        </button>
                      );
                    })}
                  </div>
                </FormField>
                <FormField label="Change in Device Detail" required output={out('deviceChange', f.deviceChange)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.deviceChange==='yes'} onChange={v => set('deviceChange', v)} label="Yes" />
                    <ChipOption value="no" selected={f.deviceChange==='no'} onChange={v => set('deviceChange', v)} label="No" />
                    <ChipOption value="na" selected={f.deviceChange==='na'} onChange={v => set('deviceChange', v)} label="N/A" />
                  </div>
                </FormField>
                <FormField label="Change of IP / Location" required output={out('ipChange', f.ipChange)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.ipChange==='yes'} onChange={v => set('ipChange', v)} label="Yes" />
                    <ChipOption value="no" selected={f.ipChange==='no'} onChange={v => set('ipChange', v)} label="No" />
                  </div>
                </FormField>
                <FormField label="Consumer Product Availed (Auto, PIL, CC, ETC)" required output={out('productsAvailed', f.productsAvailed)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.productsAvailed==='yes'} onChange={v => set('productsAvailed', v)} label="Yes" />
                    <ChipOption value="no" selected={f.productsAvailed==='no'} onChange={v => set('productsAvailed', v)} label="No" />
                  </div>
                </FormField>
                <FormField label="SMS / OTP Sent to the Customer" required output={f.otpDelivered === 'yes' ? 'OTP was delivered to customer.' : f.otpDelivered === 'no' ? 'OTP was not delivered.' : '—'}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.otpDelivered==='yes'} onChange={v => set('otpDelivered', v)} label="Yes" />
                    <ChipOption value="no" selected={f.otpDelivered==='no'} onChange={v => set('otpDelivered', v)} label="No" />
                  </div>
                </FormField>
              </CardContent>
            </Card>
          )}

          {/* ═══════ Step 3: Action Taken (9 Fields) ═══════ */}
          {currentStep === 3 && (
            <Card className="border-0 rounded-none shadow-none overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-[1fr_1.2fr_1.2fr] bg-[#2064B7] text-white text-[13px] font-semibold">
                  <div className="px-4 py-2.5">Headers</div>
                  <div className="px-4 py-2.5 border-l border-white/20">Input Fields</div>
                  <div className="px-4 py-2.5 border-l border-white/20">Output</div>
                </div>
                <FormField label="Blocking of Observed Device" required output={out('deviceBlockedFlag', f.deviceBlockedFlag)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.deviceBlockedFlag==='yes'} onChange={v => set('deviceBlockedFlag', v)} label="Yes" />
                    <ChipOption value="no" selected={f.deviceBlockedFlag==='no'} onChange={v => set('deviceBlockedFlag', v)} label="No" />
                  </div>
                </FormField>
                <FormField label="Fraudster / Perpetrator Mobile Number" required output={out('fraudsterNumberReported', f.fraudsterNumberReported)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.fraudsterNumberReported==='yes'} onChange={v => set('fraudsterNumberReported', v)} label="Yes" />
                    <ChipOption value="no" selected={f.fraudsterNumberReported==='no'} onChange={v => set('fraudsterNumberReported', v)} label="No" />
                  </div>
                </FormField>
                <FormField isInput label="FTDH Status / Recovery" large output={f.ftdhStatus ? 'Funds not available in beneficiary account.' : '—'}>
                  <Textarea value={f.ftdhStatus} onChange={e => set('ftdhStatus', e.target.value)} placeholder="As per FTDH , we observed the status as SF / NSF" className="w-full h-full border-0 bg-[#EFF7FF] focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px] resize-none" />
                </FormField>
                <FormField label="Fund Layered A/C" required output={out('fundLayeredFlag', f.fundLayeredFlag)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.fundLayeredFlag==='yes'} onChange={v => set('fundLayeredFlag', v)} label="Yes" />
                    <ChipOption value="no" selected={f.fundLayeredFlag==='no'} onChange={v => set('fundLayeredFlag', v)} label="No" />
                  </div>
                </FormField>
                <FormField label="PSTR" required output={out('pstrFlag', f.pstrFlag)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.pstrFlag==='yes'} onChange={v => set('pstrFlag', v)} label="Yes" />
                    <ChipOption value="no" selected={f.pstrFlag==='no'} onChange={v => set('pstrFlag', v)} label="No" />
                  </div>
                </FormField>
                <FormField label="P-II Reviewed" required output={out('piiReviewedFlag', f.piiReviewedFlag)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.piiReviewedFlag==='yes'} onChange={v => set('piiReviewedFlag', v)} label="Yes" />
                    <ChipOption value="no" selected={f.piiReviewedFlag==='no'} onChange={v => set('piiReviewedFlag', v)} label="No" />
                  </div>
                </FormField>
                <FormField isInput label="Suspected Staff Name (Optional)">
                  <Input value={f.suspectedStaffName} onChange={e => set('suspectedStaffName', e.target.value)} placeholder="NA" className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
                <FormField isInput label="Suspected Staff Feedback" large output={f.suspectedStaffFeedback || 'NA'}>
                  <Textarea value={f.suspectedStaffFeedback} onChange={e => set('suspectedStaffFeedback', e.target.value)} placeholder="NA" className="w-full h-full border-0 bg-[#EFF7FF] focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px] resize-none" />
                </FormField>
                <FormField label="FRMU review on Staff Feedback" required output={f.frmuReviewFlag === 'accepted' ? 'Accepted' : f.frmuReviewFlag === 'not_accepted' ? 'Not Accepted' : 'NA'}>
                  <div className="flex gap-3">
                    <ChipOption value="accepted" selected={f.frmuReviewFlag==='accepted'} onChange={v => set('frmuReviewFlag', v)} label="Accepted" />
                    <ChipOption value="not_accepted" selected={f.frmuReviewFlag==='not_accepted'} onChange={v => set('frmuReviewFlag', v)} label="Not Accepted" />
                  </div>
                </FormField>
                <FormField isInput label="Customer Account Opening Date" required>
                  <DateInputWithIcon type="date" value={f.customerAccountOpeningDate} onChange={e => set('customerAccountOpeningDate', e.target.value)} />
                </FormField>
                <FormField isInput label="Customer Account Type" required output="-">
                  <Input value={f.customerAccountType} onChange={e => set('customerAccountType', e.target.value)} className="w-full h-full border-0 bg-[#EFF7FF] focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
                <FormField isInput label="KYC Review - Debit / Credit Count with amount" required output="-">
                  <Input value={f.kycReviewDebitCreditCount} onChange={e => set('kycReviewDebitCreditCount', e.target.value)} className="w-full h-full border-0 bg-[#EFF7FF] focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
                <FormField isInput label="Customer Profile as per system / KYC" required output="-">
                  <Input value={f.customerProfileKyc} onChange={e => set('customerProfileKyc', e.target.value)} className="w-full h-full border-0 bg-[#EFF7FF] focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
              </CardContent>
            </Card>
          )}

          {/* ═══════ Step 4: System Facts / Observations (6 Fields) ═══════ */}
          {currentStep === 4 && (
            <Card className="border-0 rounded-none shadow-none overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-[1fr_1.2fr_1.2fr] bg-[#2064B7] text-white text-[13px] font-semibold">
                  <div className="px-4 py-2.5">Headers</div>
                  <div className="px-4 py-2.5 border-l border-white/20">Input Fields</div>
                  <div className="px-4 py-2.5 border-l border-white/20">Output</div>
                </div>
                <FormField label="Any Gap Identified" required output={out('gapIdentified', f.gapIdentified)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.gapIdentified==='yes'} onChange={v => set('gapIdentified', v)} label="Yes" />
                    <ChipOption value="no" selected={f.gapIdentified==='no'} onChange={v => set('gapIdentified', v)} label="No" />
                  </div>
                </FormField>
                <FormField isInput label="Fact Findings" required large output={f.factFindings ? 'As per retrieved facts, customer performed the transactions.' : '—'}>
                  <Textarea value={f.factFindings} onChange={e => set('factFindings', e.target.value)} placeholder="Enter fact findings..." className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px] resize-none" />
                </FormField>
                <FormField label="Control Breaches" required output={out('controlBreaches', f.controlBreaches)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.controlBreaches==='yes'} onChange={v => set('controlBreaches', v)} label="Yes" />
                    <ChipOption value="no" selected={f.controlBreaches==='no'} onChange={v => set('controlBreaches', v)} label="No" />
                  </div>
                </FormField>
                <FormField isInput label="Control Breaches Observed" large output={f.controlBreachesObserved || 'No Control Breach is observed.'}>
                  <Textarea value={f.controlBreachesObserved} onChange={e => set('controlBreachesObserved', e.target.value)} placeholder="Describe observed breaches..." className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px] resize-none" />
                </FormField>
                <FormField isInput label="Root Cause" required>
                  <Input value={f.rootCause} onChange={e => set('rootCause', e.target.value)} placeholder="Enter root cause..." className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
                <FormField isInput label="Type of Fraud Identified by the System" required>
                  <Input value={f.fraudTypeSystem} onChange={e => set('fraudTypeSystem', e.target.value)} placeholder="Enter fraud type identified by system" className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
              </CardContent>
            </Card>
          )}

          {/* ═══════ Step 5: Conclusion ═══════ */}
          {currentStep === 5 && (
            <Card className="border-0 rounded-none shadow-none overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-[1fr_1.2fr_1.2fr] bg-[#2064B7] text-white text-[13px] font-semibold">
                  <div className="px-3 py-2">Headers</div>
                  <div className="px-3 py-2 border-l border-white/20">Input Fields</div>
                  <div className="px-3 py-2 border-l border-white/20">Output</div>
                </div>
                <FormField isInput label="Net Loss Booked" required output={f.netLossBooked ? `Net loss of ${f.netLossBooked} was booked.` : 'No loss booked.'}>
                  <Input value={f.netLossBooked} onChange={e => set('netLossBooked', e.target.value)} placeholder="Enter net loss..." className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
                <FormField isInput label="Conclusion" required large output={f.finalConclusionType ? "No error/gap observed at bank's end. Liability remains at customer's part." : '—'}>
                  <Textarea value={f.finalConclusionType} onChange={e => set('finalConclusionType', e.target.value)} placeholder="Enter conclusion..." className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px] resize-none" />
                </FormField>
                <FormField isInput label="Recommendation" required>
                  <Input value={f.recommendation} onChange={e => set('recommendation', e.target.value)} placeholder="Enter recommendation..." className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
                <FormField isInput label="Action Owner" required>
                  <Input value={f.actionOwner} onChange={e => set('actionOwner', e.target.value)} placeholder="Enter action owner..." className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
                <FormField isInput label="Status of Action Recommended" required>
                  <Input value={f.actionStatus} onChange={e => set('actionStatus', e.target.value)} placeholder="Enter status..." className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
              </CardContent>
            </Card>
          )}

          {/* ═══════ Step 6: Annx (Evidence) — Modal Design Retained ═══════ */}
          {currentStep === 6 && (
            <Card className="border-0 rounded-none shadow-none overflow-hidden">
              <CardContent className="p-6">
                <input ref={fileInputRef} type="file" multiple accept=".png,.pdf,.jpg,.jpeg,.docx" onChange={e => handleFiles(e.target.files)} className="hidden" />
                <div
                  className={cn(
                    "border-2 border-dashed rounded-xl p-10 bg-[#F9FAFB] flex flex-col items-center justify-center mb-6 transition-all duration-200",
                    isDragOver ? "border-[#2064B7] bg-[#EFF7FF] scale-[1.01]" : "border-[#AFAFAF]"
                  )}
                  onDrop={handleDrop}
                  onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={e => { e.preventDefault(); setIsDragOver(false); }}
                >
                  <Cloud className="w-14 h-14 text-[#AFAFAF] mb-4" />
                  <p className="text-[16px] text-[#4C4C4C] mb-1 font-medium">Select your file or drag and drop</p>
                  <p className="text-[12px] text-[#AFAFAF] mb-5">png, pdf, jpg, docx accepted</p>
                  <Button className="bg-[#2064B7] hover:bg-[#1a5298] text-white px-8 rounded-lg" onClick={() => fileInputRef.current?.click()}>
                    Attach File
                  </Button>
                </div>
                <div className="space-y-3">
                  {uploadedFiles.map(file => (
                    <div key={file.id} className="flex items-center justify-between bg-[#EFF7FF] border border-[#DAE1E7] rounded-xl p-4 transition-all hover:shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <FileText className="w-12 h-12 text-[#AFAFAF]" />
                          <span className="absolute bottom-0 left-0 bg-[#E21F0B] text-white text-[10px] px-1 rounded">{getFileExt(file.name)}</span>
                        </div>
                        <div>
                          <p className="text-[15px] font-medium text-black">{file.name}</p>
                          <p className="text-[12px] text-[#AFAFAF]">
                            {file.size} of {file.totalSize} <span className="mx-2">•</span>
                            <span className="text-[#22C55E] inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" /> {file.status}</span>
                          </p>
                        </div>
                      </div>
                      <button onClick={() => setUploadedFiles(p => p.filter(x => x.id !== file.id))} className="p-2 hover:bg-white rounded-full border border-[#4C4C4C] transition-colors">
                        <X className="w-4 h-4 text-[#4C4C4C]" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ═══════ Navigation ═══════ */}
          <div className="flex justify-between px-6 py-4 border-t border-[#E5E7EB] bg-white">
            <Button
              variant="outline"
              onClick={() => currentStep === 1 ? navigate(`/cases/${id}`) : setCurrentStep(s => s - 1)}
              className="px-6 border-[#D1D5DB] hover:bg-[#F9FAFB]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {currentStep === 1 ? 'Back to Case' : 'Previous'}
            </Button>
            {currentStep < 6 ? (
              <Button onClick={() => setCurrentStep(s => s + 1)} className="px-6 bg-[#2064B7] hover:bg-[#1a5298]">
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button className="px-6 bg-[#22C55E] hover:bg-[#16A34A]" onClick={handleReviewReport} disabled={isSubmitting}>
                Review Report
              </Button>
            )}
          </div>
        </div>
      </div>

      <SubmissionSuccessDialog open={showSuccess} onClose={handleSuccessClose} />

      {/* Right-edge vertical tab trigger for Transcription Panel */}
      {currentStep === 2 && !transcriptionOpen && (
        <button
          onClick={() => setTranscriptionOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center gap-1.5 bg-[#2064B7] text-white px-2 py-3 rounded-l-lg shadow-lg hover:bg-[#1a53a0] transition-all hover:pr-3 group"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          <Headphones className="w-4 h-4 rotate-90" />
          <span className="text-[11px] font-semibold tracking-wide">Transcriptions</span>
        </button>
      )}

      {/* Transcription Panel Sheet */}
      <TranscriptionPanel open={currentStep === 2 && transcriptionOpen} onOpenChange={setTranscriptionOpen} />
    </>
  );
}

export default InvestigationFormPage;
