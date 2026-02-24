import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, ArrowRight, Check, Cloud, X, FileText, Eye, Trash2, Upload, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { SubmissionProgressBar } from '@/components/modals/SubmissionProgressBar';
import { SubmissionSuccessDialog } from '@/components/modals/SubmissionSuccessDialog';
import { mockCases } from '@/data/mockCases';
import { parseActivityLog, matchesToFormState } from '@/utils/parseActivityLog';

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
      "px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 border",
      selected
        ? "bg-[#2064B7] text-white border-[#2064B7] shadow-sm shadow-[#2064B7]/20"
        : "bg-white text-[#6B7280] border-[#D1D5DB] hover:border-[#2064B7] hover:text-[#2064B7]"
    )}
  >{label}</button>
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

const ReadOnlyValue = ({ value }) => <span className="text-[13px] text-[#374151]">{value || '—'}</span>;

// ─── Main Component ──────────────────────────────────────────────────────────
export function InvestigationFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [allChangesSaved, setAllChangesSaved] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const fileInputRef = useRef(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const activityLogRef = useRef(null);
  const [logParseResult, setLogParseResult] = useState(null); // { matches, unmatchedLines }
  const [showLogBanner, setShowLogBanner] = useState(false);

  const caseData = mockCases.find((c) => c.id === parseInt(id));

  const [f, setF] = useState({
    // Step 1: Customer / Complaint Details
    investigationOfficer: '', complaintNo: '', caseReferenceNo: '', caseReceivingChannel: '',
    disputeAmountAtRisk: '', expectedRecovery: 'NIL', disputedTxnDetails: '', fmsAlertGenerated: 'no',
    incidentDate: '', caseReceivingDate: '',
    // Step 2: Investigation — Customer Contact
    cxCallDatetime: '', initialCustomerStance: '', ioCallMade: '', contactEstablished: '',
    customerCli: '', rcChannel: '', ioCallDatetime: '', letterSent: '',
    ioCallStance: '', simBlocked: '',
    // Step 2: Channel & Device Analysis
    mbCreationDatetime: '', dcCreationDatetime: '', ccCreationDatetime: '', mbCreationSource: '',
    initialDeviceId: '', loginId: '', loginIp: '', credentialChange: 'no',
    tpinChange: 'no', newDevice: 'no',
    // Step 2: Limits & Behavioral Analysis
    limitEnhanced: 'no', previousLimit: '', newLimit: '', limitMode: '',
    txnPattern: '', deviceChange: 'no', ipChange: 'no', productsAvailed: '', otpDelivered: '',
    // Step 3: Action Taken
    deviceBlockedFlag: '', fraudsterNumberReported: '', ftdhStatus: '', fundLayeredFlag: '',
    pstrFlag: '', piiReviewedFlag: '', suspectedStaffName: '', frmuReviewFlag: '', frmAlert: '',
    // Step 4: System Facts
    gapIdentified: '', factFindings: '', controlBreaches: '', controlBreachesObserved: '',
    rootCause: '', fraudTypeSystem: '',
    // Step 5: Conclusion
    netLossBooked: '', finalConclusionType: '', recommendation: '', actionOwner: '', actionStatus: '',
  });

  useEffect(() => {
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
      incidentDate: caseData.case_received_date ? format(new Date(caseData.case_received_date), 'dd/MM/yyyy') : '',
      caseReceivingDate: caseData.case_received_date ? format(new Date(caseData.case_received_date), 'dd/MM/yyyy') : '',
      customerCli: caseData.customer?.mobile || '',
      rootCause: caseData.fraud_type === 'sim_swap' ? 'SIM Swap Fraud' : caseData.fraud_type === 'social_engineering' ? 'Social Engineering' : caseData.fraud_type === 'phishing' ? 'Phishing Attack' : '',
      fraudTypeSystem: caseData.fraud_type ? caseData.fraud_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '',
      // Simulated auto-populated device/channel data
      mbCreationDatetime: '01-Jan-2024 10:20', dcCreationDatetime: '03-Jan-2022 11:00',
      ccCreationDatetime: 'Not Applicable', mbCreationSource: 'Debit Card',
      initialDeviceId: 'Vivo-V4521', loginId: 'mhassan1212',
      loginIp: 'Same IP range', previousLimit: 'PKR 1,000,000',
      newLimit: 'PKR 1,000,000', txnPattern: 'Normal vs history',
      productsAvailed: 'Auto Loan', otpDelivered: 'yes',
    }));
  }, [caseData]);

  const set = (key, val) => {
    setF(p => ({ ...p, [key]: val }));
    setAllChangesSaved(false);
    setTimeout(() => { setLastUpdated(new Date()); setAllChangesSaved(true); }, 800);
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
      deviceChange: value === 'yes' ? 'Change in device detail detected.' : value === 'no' ? 'No change in device detail.' : '—',
      ipChange: value === 'yes' ? 'Change of IP / location detected.' : value === 'no' ? 'No change in IP / location.' : '—',
      frmAlert: value === 'yes' ? 'FRM system alert was generated.' : value === 'no' ? 'No FRM system alert was generated.' : '—',
    };
    return map[field] || '—';
  };

  const handleSubmit = async () => {
    setIsSubmitting(true); setSubmissionStep(1);
    for (let i = 1; i <= 6; i++) { await new Promise(r => setTimeout(r, 500)); setSubmissionStep(i); }
    await new Promise(r => setTimeout(r, 500));
    setIsSubmitting(false); setShowSuccess(true);
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
        setAllChangesSaved(false);
        setTimeout(() => { setLastUpdated(new Date()); setAllChangesSaved(true); }, 800);
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

  const customerName = caseData.customer.name;
  const customerCnic = caseData.customer.cnic;
  const customerAccount = caseData.customer.account_number;

  return (
    <>
      <div className="h-screen flex flex-col bg-white">
        {/* Header */}
        <div className="bg-[#2064B7] px-6 py-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/cases/${id}`)} className="text-white hover:bg-white/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-[22px] font-bold text-white">Investigation Report</h1>
              <p className="text-[12px] text-white/70">
                {caseData.reference_number} • Last updated: {format(lastUpdated, 'dd/MM/yyyy hh:mm a')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 mr-4">
              {allChangesSaved && <Check className="w-4 h-4 text-[#9AE6B4]" />}
              <span className="text-[13px] text-white/80">{allChangesSaved ? 'All changes saved' : 'Saving...'}</span>
            </div>
            {currentStep === 6 && (
              <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold px-5" onClick={handleSubmit} disabled={isSubmitting}>
                Submit For Review
              </Button>
            )}
            <Button
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white gap-2 transition-all"
              onClick={() => activityLogRef.current?.click()}
            >
              <Upload className="w-4 h-4" />
              Upload Activity Log
            </Button>
            <span className="text-white font-medium text-[14px]"><span className="text-[#9AE6B4]">ProofLine</span></span>
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
        {showLogBanner && logParseResult && (
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
                <FormField isInput label="Date(s) Incident Occurred" output={`Disputed transactions debited on ${f.incidentDate}`}>
                  <Input value={f.incidentDate} onChange={e => set('incidentDate', e.target.value)} className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" placeholder="dd/mm/yyyy" />
                </FormField>
                <FormField isInput label="Case Receiving Date" output={`Customer called bank helpline on ${f.caseReceivingDate}`}>
                  <Input value={f.caseReceivingDate} onChange={e => set('caseReceivingDate', e.target.value)} className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" placeholder="dd/mm/yyyy" />
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
                <FormField label="Customer Name"><ReadOnlyValue value={customerName} /></FormField>
                <FormField label="Customer CNIC"><ReadOnlyValue value={`*********${customerCnic?.slice(-4)}`} /></FormField>
                <FormField label="Customer Account Number"><ReadOnlyValue value={`********${customerAccount?.slice(-4)}`} /></FormField>
                <FormField isInput label="Customer Call at Contact Centre (Date & Time)" required>
                  <Input value={f.cxCallDatetime} onChange={e => set('cxCallDatetime', e.target.value)} placeholder="Auto-picked from CX Excel" className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
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
                <FormField label="Customer CLI Number"><ReadOnlyValue value={f.customerCli} /></FormField>
                <FormField isInput label="Calling RC (Recording Channel)">
                  <Input value={f.rcChannel} onChange={e => set('rcChannel', e.target.value)} placeholder="e.g. 25148" className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
                <FormField isInput label="IO Call Date & Time" required output={f.ioCallDatetime ? `IO call made on ${f.ioCallDatetime}` : '—'}>
                  <Input type="datetime-local" value={f.ioCallDatetime} onChange={e => set('ioCallDatetime', e.target.value)} className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
                <FormField label="Communication Letter Sent" output={out('letterSent', f.letterSent)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.letterSent==='yes'} onChange={v => set('letterSent', v)} label="Yes" />
                    <ChipOption value="no" selected={f.letterSent==='no'} onChange={v => set('letterSent', v)} label="No" />
                  </div>
                </FormField>
                <FormField isInput label="Customer Stance as per IO Call" required large output={f.ioCallStance || '—'}>
                  <Textarea value={f.ioCallStance} onChange={e => set('ioCallStance', e.target.value)} placeholder="Enter stance during IO call..." className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px] resize-none" />
                </FormField>
                <FormField label="Customer / Beneficiary SIM Blocked" output={out('simBlocked', f.simBlocked)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.simBlocked==='yes'} onChange={v => set('simBlocked', v)} label="Yes" />
                    <ChipOption value="no" selected={f.simBlocked==='no'} onChange={v => set('simBlocked', v)} label="No" />
                  </div>
                </FormField>

                {/* Channel & Device Analysis */}
                <SectionDivider title="Channel & Device Analysis" />
                <FormField label="Customer IB/MB Channel Creation (Date & Time)"><ReadOnlyValue value={f.mbCreationDatetime} /></FormField>
                <FormField label="Customer Debit Card Creation"><ReadOnlyValue value={f.dcCreationDatetime} /></FormField>
                <FormField label="Customer Credit Card Creation"><ReadOnlyValue value={f.ccCreationDatetime} /></FormField>
                <FormField label="Source of IB/MB Channel Creation"><ReadOnlyValue value={f.mbCreationSource} /></FormField>
                <FormField label="Initial Device at Registration"><ReadOnlyValue value={f.initialDeviceId} /></FormField>
                <FormField label="Customer Login ID"><ReadOnlyValue value={f.loginId} /></FormField>
                <FormField label="User IP / LAT-LONG"><ReadOnlyValue value={f.loginIp} /></FormField>
                <FormField label="Change in Login ID / Password (02 months)" output={out('credentialChange', f.credentialChange)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.credentialChange==='yes'} onChange={v => set('credentialChange', v)} label="Yes" />
                    <ChipOption value="no" selected={f.credentialChange==='no'} onChange={v => set('credentialChange', v)} label="No" />
                  </div>
                </FormField>
                <FormField label="Change in T-PIN" output={out('tpinChange', f.tpinChange)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.tpinChange==='yes'} onChange={v => set('tpinChange', v)} label="Yes" />
                    <ChipOption value="no" selected={f.tpinChange==='no'} onChange={v => set('tpinChange', v)} label="No" />
                  </div>
                </FormField>
                <FormField label="New Device Registration" output={out('newDevice', f.newDevice)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.newDevice==='yes'} onChange={v => set('newDevice', v)} label="Yes" />
                    <ChipOption value="no" selected={f.newDevice==='no'} onChange={v => set('newDevice', v)} label="No" />
                  </div>
                </FormField>

                {/* Limits & Behavioral Analysis */}
                <SectionDivider title="Limits & Behavioral Analysis" />
                <FormField label="Limit Enhancement" output={out('limitEnhanced', f.limitEnhanced)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.limitEnhanced==='yes'} onChange={v => set('limitEnhanced', v)} label="Yes" />
                    <ChipOption value="no" selected={f.limitEnhanced==='no'} onChange={v => set('limitEnhanced', v)} label="No" />
                  </div>
                </FormField>
                <FormField label="Customer Default / Previous Limit"><ReadOnlyValue value={f.previousLimit} /></FormField>
                <FormField label="Customer New Limit"><ReadOnlyValue value={f.newLimit} /></FormField>
                <FormField isInput label="Mode of Limit Enhancement">
                  <Input value={f.limitMode} onChange={e => set('limitMode', e.target.value)} placeholder="N/A" className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
                <FormField label="Customer Disputed Transaction Pattern"><ReadOnlyValue value={f.txnPattern} /></FormField>
                <FormField label="Change in Device Detail" output={out('deviceChange', f.deviceChange)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.deviceChange==='yes'} onChange={v => set('deviceChange', v)} label="Yes" />
                    <ChipOption value="no" selected={f.deviceChange==='no'} onChange={v => set('deviceChange', v)} label="No" />
                  </div>
                </FormField>
                <FormField label="Change of IP / Location" output={out('ipChange', f.ipChange)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.ipChange==='yes'} onChange={v => set('ipChange', v)} label="Yes" />
                    <ChipOption value="no" selected={f.ipChange==='no'} onChange={v => set('ipChange', v)} label="No" />
                  </div>
                </FormField>
                <FormField label="Consumer Product Availed"><ReadOnlyValue value={f.productsAvailed} /></FormField>
                <FormField label="SMS / OTP Delivered" output={f.otpDelivered === 'yes' ? 'OTP was delivered to customer.' : f.otpDelivered === 'no' ? 'OTP was not delivered.' : '—'}>
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
                <FormField label="Fraudster / Perpetrator Mobile Number" output={out('fraudsterNumberReported', f.fraudsterNumberReported)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.fraudsterNumberReported==='yes'} onChange={v => set('fraudsterNumberReported', v)} label="Yes" />
                    <ChipOption value="no" selected={f.fraudsterNumberReported==='no'} onChange={v => set('fraudsterNumberReported', v)} label="No" />
                  </div>
                </FormField>
                <FormField isInput label="FTDH Status / Recovery" large output={f.ftdhStatus ? 'Funds not available in beneficiary account.' : '—'}>
                  <Textarea value={f.ftdhStatus} onChange={e => set('ftdhStatus', e.target.value)} placeholder="Enter FTDH status..." className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px] resize-none" />
                </FormField>
                <FormField label="Fund Layered A/C" output={out('fundLayeredFlag', f.fundLayeredFlag)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.fundLayeredFlag==='yes'} onChange={v => set('fundLayeredFlag', v)} label="Yes" />
                    <ChipOption value="no" selected={f.fundLayeredFlag==='no'} onChange={v => set('fundLayeredFlag', v)} label="No" />
                  </div>
                </FormField>
                <FormField label="PSTR Raised" output={out('pstrFlag', f.pstrFlag)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.pstrFlag==='yes'} onChange={v => set('pstrFlag', v)} label="Yes" />
                    <ChipOption value="no" selected={f.pstrFlag==='no'} onChange={v => set('pstrFlag', v)} label="No" />
                  </div>
                </FormField>
                <FormField label="P-II Reviewed" output={out('piiReviewedFlag', f.piiReviewedFlag)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.piiReviewedFlag==='yes'} onChange={v => set('piiReviewedFlag', v)} label="Yes" />
                    <ChipOption value="no" selected={f.piiReviewedFlag==='no'} onChange={v => set('piiReviewedFlag', v)} label="No" />
                  </div>
                </FormField>
                <FormField isInput label="Suspected Staff Name (Optional)">
                  <Input value={f.suspectedStaffName} onChange={e => set('suspectedStaffName', e.target.value)} placeholder="Enter name if applicable..." className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-2.5 rounded-none text-[13px]" />
                </FormField>
                <FormField label="FRMU Review on Staff Feedback" output={f.frmuReviewFlag === 'accepted' ? 'Feedback accepted.' : f.frmuReviewFlag === 'not_accepted' ? 'Feedback not accepted.' : '—'}>
                  <div className="flex gap-3">
                    <ChipOption value="accepted" selected={f.frmuReviewFlag==='accepted'} onChange={v => set('frmuReviewFlag', v)} label="Accepted" />
                    <ChipOption value="not_accepted" selected={f.frmuReviewFlag==='not_accepted'} onChange={v => set('frmuReviewFlag', v)} label="Not Accepted" />
                  </div>
                </FormField>
                <FormField label="FRM System Alert" output={out('frmAlert', f.frmAlert)}>
                  <div className="flex gap-3">
                    <ChipOption value="yes" selected={f.frmAlert==='yes'} onChange={v => set('frmAlert', v)} label="Yes" />
                    <ChipOption value="no" selected={f.frmAlert==='no'} onChange={v => set('frmAlert', v)} label="No" />
                  </div>
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
                <FormField label="Type of Fraud Identified by the System" required>
                  <ReadOnlyValue value={f.fraudTypeSystem} />
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
              <Button className="px-6 bg-[#22C55E] hover:bg-[#16A34A]" onClick={handleSubmit} disabled={isSubmitting}>
                Submit For Review
              </Button>
            )}
          </div>
        </div>
      </div>

      <SubmissionSuccessDialog open={showSuccess} onClose={handleSuccessClose} />
    </>
  );
}

export default InvestigationFormPage;
