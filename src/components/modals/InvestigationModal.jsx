import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { X, Check, Eye, FileText, Cloud, Trash2 } from 'lucide-react';
import { Dialog, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { SubmissionProgressBar } from './SubmissionProgressBar';
import { SubmissionSuccessDialog } from './SubmissionSuccessDialog';

// Tab Icons as SVG components matching Figma design exactly
const ComplaintIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Person silhouette with complaint bubble */}
    <circle cx="12" cy="7" r="4" stroke={active ? "#2064B7" : "#AFAFAF"} strokeWidth="1.5" fill="none"/>
    <path d="M4 21V19C4 16.7909 5.79086 15 8 15H16C18.2091 15 20 16.7909 20 19V21" stroke={active ? "#2064B7" : "#AFAFAF"} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M18 3L21 6L18 9" stroke={active ? "#2064B7" : "#AFAFAF"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 6H15" stroke={active ? "#2064B7" : "#AFAFAF"} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const InvestigationIcon = ({ active }) => (
  <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Document with magnifying glass */}
    <path d="M13 2H5C4.46957 2 3.96086 2.21071 3.58579 2.58579C3.21071 2.96086 3 3.46957 3 4V18C3 18.5304 3.21071 19.0391 3.58579 19.4142C3.96086 19.7893 4.46957 20 5 20H15C15.5304 20 16.0391 19.7893 16.4142 19.4142C16.7893 19.0391 17 18.5304 17 18V6L13 2Z" stroke={active ? "#2064B7" : "#AFAFAF"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 2V6H17" stroke={active ? "#2064B7" : "#AFAFAF"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="10" cy="12" r="2" stroke={active ? "#2064B7" : "#AFAFAF"} strokeWidth="1.5"/>
    <path d="M11.5 13.5L13 15" stroke={active ? "#2064B7" : "#AFAFAF"} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const ActionTakenIcon = ({ active }) => (
  <svg width="24" height="21" viewBox="0 0 24 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Checkmark in circle with action lines */}
    <circle cx="10" cy="10.5" r="8" stroke={active ? "#2064B7" : "#AFAFAF"} strokeWidth="1.5"/>
    <path d="M6 10.5L9 13.5L14 8.5" stroke={active ? "#2064B7" : "#AFAFAF"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 4L22 4" stroke={active ? "#2064B7" : "#AFAFAF"} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M19 10.5L22 10.5" stroke={active ? "#2064B7" : "#AFAFAF"} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M19 17L22 17" stroke={active ? "#2064B7" : "#AFAFAF"} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const SystemFactsIcon = ({ active }) => (
  <svg width="28" height="21" viewBox="0 0 28 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Eye with magnifying glass */}
    <path d="M1 10.5C1 10.5 5 2.5 14 2.5C23 2.5 27 10.5 27 10.5C27 10.5 23 18.5 14 18.5C5 18.5 1 10.5 1 10.5Z" stroke={active ? "#2064B7" : "#AFAFAF"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="14" cy="10.5" r="4" stroke={active ? "#2064B7" : "#AFAFAF"} strokeWidth="1.5"/>
  </svg>
);

const ConclusionIcon = ({ active }) => (
  <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Document with checkmark */}
    <path d="M16 2H5C3.89543 2 3 2.89543 3 4V17C3 18.1046 3.89543 19 5 19H16C17.1046 19 18 18.1046 18 17V4C18 2.89543 17.1046 2 16 2Z" stroke={active ? "#2064B7" : "#AFAFAF"} strokeWidth="1.5"/>
    <path d="M7 10L9.5 12.5L14 8" stroke={active ? "#2064B7" : "#AFAFAF"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 15H14" stroke={active ? "#2064B7" : "#AFAFAF"} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const AnnxIcon = ({ active }) => (
  <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* File attachment / paperclip */}
    <path d="M18.5 9.5V15.5C18.5 16.0304 18.2893 16.5391 17.9142 16.9142C17.5391 17.2893 17.0304 17.5 16.5 17.5H4.5C3.96957 17.5 3.46086 17.2893 3.08579 16.9142C2.71071 16.5391 2.5 16.0304 2.5 15.5V5.5C2.5 4.96957 2.71071 4.46086 3.08579 4.08579C3.46086 3.71071 3.96957 3.5 4.5 3.5H10.5" stroke={active ? "#2064B7" : "#AFAFAF"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.5 2.5L18.5 6.5" stroke={active ? "#2064B7" : "#AFAFAF"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.5 2.5V6.5H18.5" stroke={active ? "#2064B7" : "#AFAFAF"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6.5 11.5H14.5" stroke={active ? "#2064B7" : "#AFAFAF"} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M6.5 14.5H11.5" stroke={active ? "#2064B7" : "#AFAFAF"} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const TooltipIcon = () => (
  <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9.5" cy="9.5" r="8.5" stroke="white" strokeWidth="1.5"/>
    <path d="M9.5 13V9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="9.5" cy="6" r="1" fill="white"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="#4C4C4C" strokeWidth="1.5"/>
    <path d="M16 2V6" stroke="#4C4C4C" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M8 2V6" stroke="#4C4C4C" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M3 10H21" stroke="#4C4C4C" strokeWidth="1.5"/>
  </svg>
);

// Tabs configuration with proper widths from Figma
const tabs = [
  { id: 'customer', label: 'Customer / Complaint Details', Icon: ComplaintIcon, width: 'w-[193px]', labelWidth: 'w-[120px]' },
  { id: 'investigation', label: 'Investigation', Icon: InvestigationIcon, width: 'w-[193px]', labelWidth: '' },
  { id: 'action', label: 'Action Taken', Icon: ActionTakenIcon, width: 'w-[193px]', labelWidth: '' },
  { id: 'system', label: 'System Facts / Observations', Icon: SystemFactsIcon, width: 'w-[193px]', labelWidth: 'w-[101px]' },
  { id: 'conclusion', label: 'Conclusion', Icon: ConclusionIcon, width: 'w-[193px]', labelWidth: '' },
  { id: 'annx', label: 'Annx', Icon: AnnxIcon, width: 'w-[193px]', labelWidth: '' },
];

// Radio button component
// Radio button component
const RadioOption = ({ value, selected, onChange, label }) => (
  <label className="flex items-center gap-2 cursor-pointer group">
    <div
      className={cn(
        "w-[23px] h-[23px] rounded-full border-2 flex items-center justify-center transition-all",
        selected ? "border-[#2064B7]" : "border-[#4C4C4C] group-hover:border-gray-600"
      )}
      onClick={() => onChange(value)}
    >
      {selected && (
        <div className="w-[13px] h-[13px] rounded-full bg-[#2064B7]" />
      )}
    </div>
    <span className={cn(
      "text-[14px] font-normal",
      selected ? "text-black" : "text-[#4C4C4C]"
    )}>
      {label}
    </span>
  </label>
);

// Table Row component - Fixed widths to ensure full coverage
const TableRow = ({ header, inputContent, outputContent, isRequired = false, isInputRow = false }) => (
  <div className="flex w-full min-w-[1110px]">
    <div className="w-[370px] min-w-[370px] min-h-[40px] bg-white border border-[#828282] p-4 flex items-start">
      <span className="text-[14px] font-semibold text-black leading-[18px]">
        {header}
        {isRequired && <span className="text-[#FF3824]">*</span>}
      </span>
    </div>
    <div className={cn(
      "w-[370px] min-w-[370px] min-h-[40px] bg-[#EFF7FF] border border-[#828282] border-l-0 flex",
      isInputRow ? "items-stretch p-0" : "items-start p-4"
    )}>
      {inputContent}
    </div>
    <div className="w-[370px] min-w-[370px] min-h-[40px] bg-[#EFF7FF] border border-[#828282] border-l-0 p-4 flex items-start">
      {outputContent}
    </div>
  </div>
);

// Large Table Row for multi-line content
const LargeTableRow = ({ header, inputContent, outputContent, isRequired = false, minHeight = "112px", isInputRow = false }) => (
  <div className="flex w-full min-w-[1110px]">
    <div className={`w-[370px] min-w-[370px] bg-white border border-[#828282] p-4`} style={{ minHeight }}>
      <span className="text-[14px] font-semibold text-black leading-[18px]">
        {header}
        {isRequired && <span className="text-[#FF3824]">*</span>}
      </span>
    </div>
    <div className={cn(
      "w-[370px] min-w-[370px] bg-[#EFF7FF] border border-[#828282] border-l-0 flex",
      isInputRow ? "items-stretch p-0" : "items-start p-4"
    )} style={{ minHeight }}>
      {inputContent}
    </div>
    <div className={`w-[370px] min-w-[370px] bg-[#EFF7FF] border border-[#828282] border-l-0 p-4`} style={{ minHeight }}>
      {outputContent}
    </div>
  </div>
);

// Helper to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function InvestigationModal({ open, onOpenChange, caseData }) {
  const [activeTab, setActiveTab] = useState('customer');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [allChangesSaved, setAllChangesSaved] = useState(true);
  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize form data from case data
  const [formData, setFormData] = useState({
    // Customer / Complaint Details tab - Editable pre-filled fields
    investigationOfficer: '',
    complaintNo: '',
    caseReferenceNo: '',
    caseReceivingChannel: '',
    disputeAmountAtRisk: '',
    expectedRecovery: 'NIL',
    disputedTxnDetails: '',
    incidentDate: '',
    caseReceivingDate: '',
    // Investigation tab - Manual fields
    customerStanceInitial: '',
    callMadeToCustomer: '',
    contactEstablish: '',
    ioCallDateTime: '',
    communicationLetterSent: '',
    customerStancePerIo: '',
    customerBeneficiarySim: '',
    // Action Taken tab
    blockingObservedDevice: '',
    fraudsterMobileNumber: '',
    ftdhStatusRecovery: '',
    fundLayeredAc: '',
    pstr: '',
    piiReviewed: '',
    suspectedStaffName: '',
    suspectedStaffFeedback: '',
    frmuReviewStaffFeedback: '',
    // System Facts tab
    anyGapIdentified: '',
    factFindings: '',
    controlBreaches: '',
    controlBreachesObserved: '',
    rootCause: '',
    typeOfFraud: '',
    // Conclusion tab
    netLossBooked: '',
    conclusionText: '',
    recommendation: '',
    actionOwner: '',
    statusActionRecommended: '',
    // FMS Alert
    fmsAlertGenerated: 'no',
  });

  // Uploaded files state for Annx tab
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Update form data when case changes
  useEffect(() => {
    if (caseData) {
      // Pre-populate with case data where applicable
      // Calculate derived values for pre-filling
      const transactionDates = caseData.transactions?.map(t => new Date(t.transaction_date)) || [];
      const minDate = transactionDates.length > 0 ? format(new Date(Math.min(...transactionDates)), 'dd-MMM-yyyy') : '-';
      const maxDate = transactionDates.length > 0 ? format(new Date(Math.max(...transactionDates)), 'dd-MMM-yyyy') : '-';
      const dateRange = `${minDate} to ${maxDate}`;
      
      const channel = caseData.channel === 'contact_center' ? 'Contact Center' :
                      caseData.channel === 'branch' ? 'Branch' :
                      caseData.channel === 'email' ? 'Email' :
                      caseData.channel === 'mobile_app' ? 'Mobile App' : caseData.channel;

      setFormData(prev => ({
        ...prev,
        // Pre-fill editable fields
        investigationOfficer: caseData.assigned_to?.name || 'Not Assigned',
        complaintNo: caseData.complaint_number || '-',
        caseReferenceNo: caseData.reference_number || '',
        caseReceivingChannel: channel || '',
        disputeAmountAtRisk: caseData.total_disputed_amount ? formatCurrency(caseData.total_disputed_amount) : '',
        disputedTxnDetails: dateRange,
        incidentDate: caseData.case_received_date ? format(new Date(caseData.case_received_date), 'dd/MM/yyyy') : '',
        caseReceivingDate: caseData.case_received_date ? format(new Date(caseData.case_received_date), 'dd/MM/yyyy') : '',
        
        // Existing pre-fills
        rootCause: caseData.fraud_type === 'sim_swap' ? 'SIM Swap Fraud' :
                   caseData.fraud_type === 'phishing' ? 'Phishing Attack' :
                   caseData.fraud_type === 'social_engineering' ? 'Social Engineering' :
                   caseData.fraud_type === 'scam_investment' ? 'SCAM - Online Investment' :
                   caseData.fraud_type === 'ato' ? 'Account Takeover' : '',
        typeOfFraud: caseData.fraud_type ? caseData.fraud_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '',
      }));
    }
  }, [caseData]);

  // Generate dynamic output based on input fields
  const generateOutput = (field, value) => {
    const outputs = {
      callMadeToCustomer: value === 'yes'
        ? 'Customer was contacted by the investigation officer.'
        : value === 'no' ? 'Customer was not contacted.' : '-',
      contactEstablish: value === 'yes'
        ? 'Contact was successfully established with the customer.'
        : value === 'no' ? 'Contact could not be established.' : '-',
      communicationLetterSent: value === 'yes'
        ? 'Communication letter was sent to the customer.'
        : value === 'no' ? 'Communication letter was not sent.' : '-',
      customerBeneficiarySim: value === 'yes'
        ? 'Customer/Beneficiary SIM has been blocked.'
        : value === 'no' ? 'Customer/Beneficiary SIM was not blocked.' : '-',
      blockingObservedDevice: value === 'yes'
        ? 'The observed device was marked as blocked in the bank\'s internal system.'
        : value === 'no' ? 'Device was not blocked.' : '-',
      fraudsterMobileNumber: value === 'yes'
        ? 'The customer provided fraudster number is reported to PTA.'
        : value === 'no' ? 'Fraudster number was not reported.' : '-',
      fundLayeredAc: value === 'yes'
        ? 'Fund layering details have been shared by member bank.'
        : value === 'no' ? 'No detail is shared by the member bank related to layering.' : '-',
      pstr: value === 'yes'
        ? 'The PSTR was raised against the observed On-Us customer account.'
        : value === 'no' ? 'PSTR was not raised.' : '-',
      piiReviewed: value === 'yes'
        ? 'P-II review was conducted.'
        : value === 'no' ? 'Since no change in device or location was observed, so no fraudulent element is observed. Therefore, P-II was not reviewed.' : '-',
      anyGapIdentified: value === 'yes'
        ? 'Internal gap has been identified in this case.'
        : value === 'no' ? 'No internal gap is observed in this case.' : '-',
      controlBreaches: value === 'yes'
        ? 'Control breach has been identified.'
        : value === 'no' ? 'No Control Breach is observed.' : '-',
    };
    return outputs[field] || '-';
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmissionStep(1);

    // Simulate submission progress
    for (let i = 1; i <= 6; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setSubmissionStep(i);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSubmitting(false);
    setShowSuccess(true);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setSubmissionStep(0);
    onOpenChange(false);
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setAllChangesSaved(false);
    // Auto-save simulation
    setTimeout(() => {
      setLastUpdated(new Date());
      setAllChangesSaved(true);
    }, 1000);
  };

  // File upload handlers
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const newFiles = files.map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      size: `${Math.round(file.size / 1024)} KB`,
      totalSize: `${Math.round(file.size / 1024)} KB`,
      status: 'Completed',
      file: file,
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemoveFile = (id) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const getFileExtension = (filename) => {
    return filename.split('.').pop().toUpperCase();
  };

  if (!caseData) return null;

  // Pre-filled data from case
  const investigationOfficer = caseData.assigned_to?.name || 'Not Assigned';
  const complaintNo = caseData.complaint_number || '-';
  const caseReferenceNo = caseData.reference_number;
  const caseReceivingChannel = caseData.channel === 'contact_center' ? 'Contact Center' :
                               caseData.channel === 'branch' ? 'Branch' :
                               caseData.channel === 'email' ? 'Email' :
                               caseData.channel === 'mobile_app' ? 'Mobile App' : caseData.channel;
  const disputeAmountAtRisk = formatCurrency(caseData.total_disputed_amount);
  const caseReceivingDate = format(new Date(caseData.case_received_date), 'dd/MM/yyyy');
  const customerName = caseData.customer.name;
  const customerCnic = caseData.customer.cnic;
  const customerAccount = caseData.customer.account_number;
  const customerMobile = caseData.customer.mobile;

  // Calculate date range from transactions
  const transactionDates = caseData.transactions.map(t => new Date(t.transaction_date));
  const minDate = transactionDates.length > 0 ? format(new Date(Math.min(...transactionDates)), 'dd-MMM-yyyy') : '-';
  const maxDate = transactionDates.length > 0 ? format(new Date(Math.max(...transactionDates)), 'dd-MMM-yyyy') : '-';
  const transactionDateRange = `${minDate} to ${maxDate}`;

  return (
    <>
      <Dialog open={open && !showSuccess} onOpenChange={onOpenChange}>
        <DialogPortal>
          <DialogOverlay className="bg-black/50" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[#F8F8F8] border border-[#AFAFAF] w-[1158px] max-h-[90vh] flex flex-col rounded-lg overflow-hidden shadow-xl">
              {/* Header */}
              <div className="bg-[#2064B7] px-6 py-4 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-[24px] font-bold text-white">Investigation Report</h2>
                  <p className="text-[12px] text-white/80">
                    Last updated: {format(lastUpdated, 'dd/MM/yyyy hh:mm a')}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold px-4 py-2 rounded-md"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    Submit For Review
                  </Button>
                  <span className="text-white font-medium text-[14px] flex items-center gap-1">
                    <span className="text-[#9AE6B4]">ProofLine</span>
                  </span>
                </div>
              </div>

              {/* Sub-header with save status and actions */}
              <div className="bg-white px-6 py-2 flex items-center justify-end gap-4 border-b border-[#AFAFAF] shrink-0">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#22C55E]" />
                  <span className="text-[14px] text-[#4C4C4C]">All changes saved</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <FileText className="w-5 h-5 text-[#4C4C4C]" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <Eye className="w-5 h-5 text-[#4C4C4C]" />
                  </button>
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-6 h-6 text-[#4C4C4C]" />
                </button>
              </div>

              {/* Tabs - Fixed layout matching Figma */}
              <div className="bg-white flex border-b border-[#AFAFAF] shrink-0">
                {tabs.map((tab, index) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-3 text-[14px] font-medium transition-all flex-1",
                        index < tabs.length - 1 && "border-r border-[#AFAFAF]",
                        isActive
                          ? "border-b-[3px] border-b-[#2064B7] text-[#4C4C4C]"
                          : "text-[#AFAFAF] hover:text-[#4C4C4C]"
                      )}
                    >
                      <tab.Icon active={isActive} />
                      <span className={cn(
                        tab.labelWidth,
                        "text-left leading-[18px]",
                        tab.id === 'system' && "whitespace-normal"
                      )}>
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Submission Progress Bar */}
              {isSubmitting && (
                <div className="fixed inset-0 bg-[#2A2A2A]/90 flex items-center justify-center z-[100]">
                  <SubmissionProgressBar currentStep={submissionStep} totalSteps={6} />
                </div>
              )}

              {/* Table Headers - hidden for Annx tab */}
              {activeTab !== 'annx' && (
                <div className="flex w-full bg-[#2064B7] text-white shrink-0">
                  <div className="w-[370px] min-w-[370px] px-4 py-3">
                    <span className="text-[14px] font-semibold">Headers</span>
                  </div>
                  <div className="w-[370px] min-w-[370px] px-4 py-3 flex items-center justify-between">
                    <span className="text-[14px] font-semibold">Input Fields</span>
                    <TooltipIcon />
                  </div>
                  <div className="w-[370px] min-w-[370px] px-4 py-3 flex items-center justify-between">
                    <span className="text-[14px] font-semibold">Output</span>
                    <TooltipIcon />
                  </div>
                </div>
              )}

              {/* Tab Content - Scrollable */}
              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto overflow-x-hidden"
                style={{
                  scrollBehavior: 'smooth',
                  overscrollBehavior: 'contain',
                  WebkitOverflowScrolling: 'touch',
                }}
                onWheel={(e) => e.stopPropagation()}
              >
                {/* Customer / Complaint Details Tab */}
                {activeTab === 'customer' && (
                  <div className="flex flex-col">
                    <LargeTableRow
                      header="Investigation Officer"
                      isInputRow
                      inputContent={
                        <Input
                          value={formData.investigationOfficer}
                          onChange={(e) => handleFieldChange('investigationOfficer', e.target.value)}
                          className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-3 rounded-none placeholder:text-gray-400"
                        />
                      }
                      outputContent={
                        <ol className="text-[12px] text-[#4C4C4C] list-decimal pl-4 space-y-1">
                          <li>All Staff Data (Name and Designation) needs to be added in Master Key; only matched User ID will be picked.</li>
                          <li>Waseem Jan (Regional Manager Investigation)</li>
                          <li>Muhammad Fida (Senior Analyst Investigation)</li>
                          <li>Mobeen Ali (Analyst Investigation)</li>
                        </ol>
                      }
                    />
                    <LargeTableRow
                      header="Complaint No"
                      isInputRow
                      inputContent={
                        <Input
                          value={formData.complaintNo}
                          onChange={(e) => handleFieldChange('complaintNo', e.target.value)}
                          className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-3 rounded-none placeholder:text-gray-400"
                        />
                      }
                      outputContent={
                        <span className="text-[12px] text-[#4C4C4C]">
                          The case was received from {formData.caseReceivingChannel} {formData.caseReceivingDate}, with Complaint No. {formData.complaintNo}
                        </span>
                      }
                    />
                    <LargeTableRow
                      header="Case Reference No"
                      isInputRow
                      inputContent={
                        <Input
                          value={formData.caseReferenceNo}
                          onChange={(e) => handleFieldChange('caseReferenceNo', e.target.value)}
                          className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-3 rounded-none placeholder:text-gray-400"
                        />
                      }
                      outputContent={null}
                    />
                    <TableRow
                      header="Case Receiving Channel"
                      isInputRow
                      inputContent={
                        <Input
                          value={formData.caseReceivingChannel}
                          onChange={(e) => handleFieldChange('caseReceivingChannel', e.target.value)}
                          className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-3 rounded-none placeholder:text-gray-400"
                        />
                      }
                      outputContent={<span className="text-[12px] text-[#4C4C4C]">-</span>}
                    />
                    <LargeTableRow
                      header="Dispute Amount At Risk"
                      isRequired
                      isInputRow
                      inputContent={
                        <Input
                          value={formData.disputeAmountAtRisk}
                          onChange={(e) => handleFieldChange('disputeAmountAtRisk', e.target.value)}
                          className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-3 rounded-none placeholder:text-gray-400"
                        />
                      }
                      outputContent={
                        <span className="text-[12px] text-[#4C4C4C]">
                          The customer raised dispute against total amount {formData.disputeAmountAtRisk}
                        </span>
                      }
                    />
                    <LargeTableRow
                      header="Expected Recovery From ON-US Beneficiary"
                      isInputRow
                      inputContent={
                        <Input
                          value={formData.expectedRecovery}
                          onChange={(e) => handleFieldChange('expectedRecovery', e.target.value)}
                          className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-3 rounded-none placeholder:text-gray-400"
                        />
                      }
                      outputContent={
                        <span className="text-[12px] text-[#4C4C4C]">
                          As per system, no recovery is expected from On-us customers accounts where the funds were credited from the complainant account
                        </span>
                      }
                    />
                    <LargeTableRow
                      header="Disputed Transaction Details"
                      isInputRow
                      inputContent={
                        <Input
                          value={formData.disputedTxnDetails}
                          onChange={(e) => handleFieldChange('disputedTxnDetails', e.target.value)}
                          className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-3 rounded-none placeholder:text-gray-400"
                        />
                      }
                      outputContent={
                        <div className="bg-white border border-[#DAE1E7] rounded-lg p-3 w-full">
                          <div className="bg-[#EDF1F4] rounded-t-lg px-3 py-2 mb-2">
                            <div className="grid grid-cols-4 gap-2 text-[9px] text-[#4C4C4C] opacity-65">
                              <span>Transaction ID</span>
                              <span>Beneficiary</span>
                              <span>Amount</span>
                              <span>Branch</span>
                            </div>
                          </div>
                          {caseData.transactions.map((txn, idx) => (
                            <div key={idx} className="grid grid-cols-4 gap-2 py-2 border-b border-[#DAE1E7] last:border-0">
                              <span className="text-[10px] text-[#4C4C4C]">{txn.transaction_id}</span>
                              <div>
                                <span className="text-[10px] text-[#4C4C4C]">{txn.beneficiary_bank}</span>
                                <span className="text-[8px] text-[#AFAFAF] block">****{txn.beneficiary_account?.slice(-4)}</span>
                              </div>
                              <span className="text-[10px] text-[#2064B7]">{formatCurrency(txn.disputed_amount)}</span>
                              <div>
                                <span className="text-[10px] text-[#4C4C4C]">{txn.channel} Channel</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      }
                      minHeight="286px"
                    />
                    <LargeTableRow
                      header="Alert was Generated by Fraud Monitoring System (FMS)"
                      isRequired
                      inputContent={
                        <div className="flex items-center gap-6">
                          <RadioOption
                            value="yes"
                            selected={formData.fmsAlertGenerated === 'yes'}
                            onChange={(v) => handleFieldChange('fmsAlertGenerated', v)}
                            label="Yes"
                          />
                          <RadioOption
                            value="no"
                            selected={formData.fmsAlertGenerated === 'no'}
                            onChange={(v) => handleFieldChange('fmsAlertGenerated', v)}
                            label="No"
                          />
                        </div>
                      }
                      outputContent={
                        <span className="text-[12px] text-[#4C4C4C]">
                          {formData.fmsAlertGenerated === 'yes'
                            ? 'Alert was generated by the Fraud Monitoring System.'
                            : 'Since the amount was under the defined threshold, so the alert were not generated against the customer disputed transactions.'}
                        </span>
                      }
                    />
                    <TableRow
                      header="Date(s) Incident Occurred"
                      isInputRow
                      inputContent={
                        <div className="flex items-center w-full h-full px-4 py-3">
                          <CalendarIcon />
                          <Input
                            value={formData.incidentDate}
                            onChange={(e) => handleFieldChange('incidentDate', e.target.value)}
                            className="flex-1 border-0 bg-transparent focus-visible:ring-0 p-0 ml-2 h-auto text-[14px] text-black placeholder:text-gray-400"
                          />
                        </div>
                      }
                      outputContent={
                        <span className="text-[12px] text-[#4C4C4C]">
                          The customer disputed transactions were debited from his account on {formData.incidentDate}
                        </span>
                      }
                    />
                    <TableRow
                      header="Case Receiving Date"
                      isInputRow
                      inputContent={
                        <div className="flex items-center w-full h-full px-4 py-3">
                          <CalendarIcon />
                          <Input
                            value={formData.caseReceivingDate}
                            onChange={(e) => handleFieldChange('caseReceivingDate', e.target.value)}
                            className="flex-1 border-0 bg-transparent focus-visible:ring-0 p-0 ml-2 h-auto text-[14px] text-black placeholder:text-gray-400"
                          />
                        </div>
                      }
                      outputContent={
                        <span className="text-[12px] text-[#4C4C4C]">
                          The customer called bank helpline and logged complaint on {formData.caseReceivingDate}
                        </span>
                      }
                    />
                  </div>
                )}

                {/* Investigation Tab */}
                {activeTab === 'investigation' && (
                  <div className="flex flex-col">
                    <TableRow
                      header="Customer Name"
                      inputContent={
                        <span className="text-[14px] text-black">{customerName}</span>
                      }
                      outputContent={<span className="text-[12px] text-[#4C4C4C]">-</span>}
                    />
                    <TableRow
                      header="Customer CNIC"
                      inputContent={
                        <span className="text-[14px] text-black">*********{customerCnic?.slice(-4)}</span>
                      }
                      outputContent={<span className="text-[12px] text-[#4C4C4C]">-</span>}
                    />
                    <TableRow
                      header="Customer Account Number"
                      inputContent={
                        <span className="text-[14px] text-black">********{customerAccount?.slice(-4)}</span>
                      }
                      outputContent={<span className="text-[12px] text-[#4C4C4C]">-</span>}
                    />
                    <LargeTableRow
                      header="Customer Stance As per Initial Call"
                      isRequired
                      isInputRow
                      inputContent={
                        <Textarea
                          value={formData.customerStanceInitial}
                          onChange={(e) => handleFieldChange('customerStanceInitial', e.target.value)}
                          placeholder="Enter customer's initial stance..."
                          className="w-full h-full border-0 bg-transparent text-[14px] focus-visible:ring-0 px-4 py-4 rounded-none resize-none placeholder:text-gray-400"
                        />
                      }
                      outputContent={
                        <span className="text-[12px] text-[#4C4C4C]">
                          {formData.customerStanceInitial || 'The customer disowned the transactions, and claimed that as fraudulent.'}
                        </span>
                      }
                    />
                    <TableRow
                      header="Call was made to the Customer"
                      isRequired
                      inputContent={
                        <div className="flex items-center gap-6">
                          <RadioOption
                            value="yes"
                            selected={formData.callMadeToCustomer === 'yes'}
                            onChange={(v) => handleFieldChange('callMadeToCustomer', v)}
                            label="Yes"
                          />
                          <RadioOption
                            value="no"
                            selected={formData.callMadeToCustomer === 'no'}
                            onChange={(v) => handleFieldChange('callMadeToCustomer', v)}
                            label="No"
                          />
                        </div>
                      }
                      outputContent={
                        <span className="text-[12px] text-[#4C4C4C]">
                          {generateOutput('callMadeToCustomer', formData.callMadeToCustomer)}
                        </span>
                      }
                    />
                    <TableRow
                      header="Contact Establish"
                      isRequired
                      inputContent={
                        <div className="flex items-center gap-6">
                          <RadioOption
                            value="yes"
                            selected={formData.contactEstablish === 'yes'}
                            onChange={(v) => handleFieldChange('contactEstablish', v)}
                            label="Yes"
                          />
                          <RadioOption
                            value="no"
                            selected={formData.contactEstablish === 'no'}
                            onChange={(v) => handleFieldChange('contactEstablish', v)}
                            label="No"
                          />
                        </div>
                      }
                      outputContent={
                        <span className="text-[12px] text-[#4C4C4C]">
                          {generateOutput('contactEstablish', formData.contactEstablish)}
                        </span>
                      }
                    />
                    <TableRow
                      header="Customer CLI Number"
                      inputContent={
                        <span className="text-[14px] text-black">{customerMobile}</span>
                      }
                      outputContent={<span className="text-[12px] text-[#4C4C4C]">-</span>}
                    />
                    <TableRow
                      header="IO Call Date & Time"
                      isRequired
                      isInputRow
                      inputContent={
                        <Input
                          type="datetime-local"
                          value={formData.ioCallDateTime}
                          onChange={(e) => handleFieldChange('ioCallDateTime', e.target.value)}
                          className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-3 rounded-none placeholder:text-gray-400"
                        />
                      }
                      outputContent={
                        <span className="text-[12px] text-[#4C4C4C]">
                          {formData.ioCallDateTime ? `IO call was made on ${format(new Date(formData.ioCallDateTime), 'dd-MMM-yyyy')} at ${format(new Date(formData.ioCallDateTime), 'hh:mm a')}` : '-'}
                        </span>
                      }
                    />
                    <TableRow
                      header="Communication Letter Sent"
                      isRequired
                      inputContent={
                        <div className="flex items-center gap-6">
                          <RadioOption
                            value="yes"
                            selected={formData.communicationLetterSent === 'yes'}
                            onChange={(v) => handleFieldChange('communicationLetterSent', v)}
                            label="Yes"
                          />
                          <RadioOption
                            value="no"
                            selected={formData.communicationLetterSent === 'no'}
                            onChange={(v) => handleFieldChange('communicationLetterSent', v)}
                            label="No"
                          />
                        </div>
                      }
                      outputContent={
                        <span className="text-[12px] text-[#4C4C4C]">
                          {generateOutput('communicationLetterSent', formData.communicationLetterSent)}
                        </span>
                      }
                    />
                    <LargeTableRow
                      header="Customer Stance As Per IO Call"
                      isRequired
                      isInputRow
                      inputContent={
                        <Textarea
                          value={formData.customerStancePerIo}
                          onChange={(e) => handleFieldChange('customerStancePerIo', e.target.value)}
                          placeholder="Enter customer's stance during IO call..."
                          className="w-full h-full border-0 bg-transparent text-[14px] focus-visible:ring-0 px-4 py-4 rounded-none resize-none placeholder:text-gray-400"
                        />
                      }
                      outputContent={
                        <span className="text-[12px] text-[#4C4C4C]">
                          {formData.customerStancePerIo || '-'}
                        </span>
                      }
                    />
                    <TableRow
                      header="Customer / Beneficiary SIM Blocked"
                      isRequired
                      inputContent={
                        <div className="flex items-center gap-6">
                          <RadioOption
                            value="yes"
                            selected={formData.customerBeneficiarySim === 'yes'}
                            onChange={(v) => handleFieldChange('customerBeneficiarySim', v)}
                            label="Yes"
                          />
                          <RadioOption
                            value="no"
                            selected={formData.customerBeneficiarySim === 'no'}
                            onChange={(v) => handleFieldChange('customerBeneficiarySim', v)}
                            label="No"
                          />
                        </div>
                      }
                      outputContent={
                        <span className="text-[12px] text-[#4C4C4C]">
                          {generateOutput('customerBeneficiarySim', formData.customerBeneficiarySim)}
                        </span>
                      }
                    />
                  </div>
                )}

                {/* Action Taken Tab */}
                {activeTab === 'action' && (
                  <div className="flex flex-col">
                    <LargeTableRow
                      header="Blocking of Observed Device"
                      isRequired
                      inputContent={
                        <div className="flex items-center gap-6">
                          <RadioOption
                            value="yes"
                            selected={formData.blockingObservedDevice === 'yes'}
                            onChange={(v) => handleFieldChange('blockingObservedDevice', v)}
                            label="Yes"
                          />
                          <RadioOption
                            value="no"
                            selected={formData.blockingObservedDevice === 'no'}
                            onChange={(v) => handleFieldChange('blockingObservedDevice', v)}
                            label="No"
                          />
                        </div>
                      }
                      outputContent={
                        <span className="text-[12px] text-[#4C4C4C]">
                          {generateOutput('blockingObservedDevice', formData.blockingObservedDevice)}
                        </span>
                      }
                    />
                    <LargeTableRow
                      header="Fraduster /Preptrator Mobile Number"
                      isRequired
                      inputContent={
                        <div className="flex items-center gap-6">
                          <RadioOption
                            value="yes"
                            selected={formData.fraudsterMobileNumber === 'yes'}
                            onChange={(v) => handleFieldChange('fraudsterMobileNumber', v)}
                            label="Yes"
                          />
                          <RadioOption
                            value="no"
                            selected={formData.fraudsterMobileNumber === 'no'}
                            onChange={(v) => handleFieldChange('fraudsterMobileNumber', v)}
                            label="No"
                          />
                        </div>
                      }
                      outputContent={
                        <span className="text-[12px] text-[#4C4C4C]">
                          {generateOutput('fraudsterMobileNumber', formData.fraudsterMobileNumber)}
                        </span>
                      }
                    />
                    <LargeTableRow
                      header="FTDH Status / Recovery"
                      isInputRow
                      inputContent={
                        <Textarea
                          value={formData.ftdhStatusRecovery}
                          onChange={(e) => handleFieldChange('ftdhStatusRecovery', e.target.value)}
                          placeholder="Enter FTDH status..."
                          className="w-full h-full border-0 bg-transparent text-[14px] focus-visible:ring-0 px-4 py-4 rounded-none resize-none placeholder:text-gray-400"
                        />
                      }
                      outputContent={
                        <span className="text-[12px] text-[#FF3824]">
                          {formData.ftdhStatusRecovery ? 'The remarks of FTDH shows that the funds are not available in the beneficiary customers account.' : '-'}
                        </span>
                      }
                    />
                    <LargeTableRow
                      header="Fund Layered A/C#"
                      isRequired
                      inputContent={
                        <div className="flex items-center gap-6">
                          <RadioOption
                            value="yes"
                            selected={formData.fundLayeredAc === 'yes'}
                            onChange={(v) => handleFieldChange('fundLayeredAc', v)}
                            label="Yes"
                          />
                          <RadioOption
                            value="no"
                            selected={formData.fundLayeredAc === 'no'}
                            onChange={(v) => handleFieldChange('fundLayeredAc', v)}
                            label="No"
                          />
                        </div>
                      }
                      outputContent={
                        <span className="text-[12px] text-[#4C4C4C]">
                          {generateOutput('fundLayeredAc', formData.fundLayeredAc)}
                        </span>
                      }
                    />
                    <LargeTableRow
                      header="PSTR"
                      isRequired
                      inputContent={
                        <div className="flex items-center gap-6">
                          <RadioOption
                            value="yes"
                            selected={formData.pstr === 'yes'}
                            onChange={(v) => handleFieldChange('pstr', v)}
                            label="Yes"
                          />
                          <RadioOption
                            value="no"
                            selected={formData.pstr === 'no'}
                            onChange={(v) => handleFieldChange('pstr', v)}
                            label="No"
                          />
                        </div>
                      }
                      outputContent={
                        <span className="text-[12px] text-[#4C4C4C]">
                          {generateOutput('pstr', formData.pstr)}
                        </span>
                      }
                    />
                    <LargeTableRow
                      header="P-II Reviewed"
                      isRequired
                      inputContent={
                        <div className="flex items-center gap-6">
                          <RadioOption
                            value="yes"
                            selected={formData.piiReviewed === 'yes'}
                            onChange={(v) => handleFieldChange('piiReviewed', v)}
                            label="Yes"
                          />
                          <RadioOption
                            value="no"
                            selected={formData.piiReviewed === 'no'}
                            onChange={(v) => handleFieldChange('piiReviewed', v)}
                            label="No"
                          />
                        </div>
                      }
                      outputContent={
                        <span className="text-[12px] text-[#4C4C4C]">
                          {generateOutput('piiReviewed', formData.piiReviewed)}
                        </span>
                      }
                    />
                    <TableRow
                      header="Suspected Staff Name (Optional)"
                      isInputRow
                      inputContent={
                        <Input
                          value={formData.suspectedStaffName}
                          onChange={(e) => handleFieldChange('suspectedStaffName', e.target.value)}
                          placeholder="Enter name if applicable..."
                          className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-3 rounded-none placeholder:text-gray-400"
                        />
                      }
                      outputContent={
                        <span className="text-[12px] text-[#AFAFAF]">{formData.suspectedStaffName || 'NA'}</span>
                      }
                    />
                    <LargeTableRow
                      header="Suspected Staff Feedback"
                      isInputRow
                      inputContent={
                        <Textarea
                          value={formData.suspectedStaffFeedback}
                          onChange={(e) => handleFieldChange('suspectedStaffFeedback', e.target.value)}
                          placeholder="Enter feedback if applicable..."
                          className="w-full h-full border-0 bg-transparent text-[14px] focus-visible:ring-0 px-4 py-4 rounded-none resize-none placeholder:text-gray-400"
                        />
                      }
                      outputContent={
                        <span className="text-[12px] text-[#AFAFAF]">{formData.suspectedStaffFeedback || 'NA'}</span>
                      }
                      minHeight="120px"
                    />
                    <LargeTableRow
                      header="FRMU review on Staff Feedback"
                      isRequired
                      inputContent={
                        <div className="flex items-center gap-6">
                          <RadioOption
                            value="accepted"
                            selected={formData.frmuReviewStaffFeedback === 'accepted'}
                            onChange={(v) => handleFieldChange('frmuReviewStaffFeedback', v)}
                            label="Accepted"
                          />
                          <RadioOption
                            value="not_accepted"
                            selected={formData.frmuReviewStaffFeedback === 'not_accepted'}
                            onChange={(v) => handleFieldChange('frmuReviewStaffFeedback', v)}
                            label="Not Accepted"
                          />
                        </div>
                      }
                      outputContent={
                        <span className="text-[12px] text-[#AFAFAF]">NA</span>
                      }
                    />
                  </div>
                )}

                {/* System Facts / Observations Tab */}
                {activeTab === 'system' && (
                  <div className="flex flex-col">
                    <LargeTableRow
                      header="Any Gap Identified"
                      isRequired
                      inputContent={
                        <div className="flex items-center gap-6">
                          <RadioOption
                            value="yes"
                            selected={formData.anyGapIdentified === 'yes'}
                            onChange={(v) => handleFieldChange('anyGapIdentified', v)}
                            label="Yes"
                          />
                          <RadioOption
                            value="no"
                            selected={formData.anyGapIdentified === 'no'}
                            onChange={(v) => handleFieldChange('anyGapIdentified', v)}
                            label="No"
                          />
                        </div>
                      }
                      outputContent={
                        <span className="text-[12px] text-[#4C4C4C]">
                          {generateOutput('anyGapIdentified', formData.anyGapIdentified)}
                        </span>
                      }
                    />
                    <LargeTableRow
                      header="Fact Findings"
                      isRequired
                      isInputRow
                      inputContent={
                        <Textarea
                          value={formData.factFindings}
                          onChange={(e) => handleFieldChange('factFindings', e.target.value)}
                          placeholder="Enter fact findings..."
                          className="w-full h-full border-0 bg-transparent text-[14px] focus-visible:ring-0 px-4 py-4 rounded-none resize-none placeholder:text-gray-400"
                        />
                      }
                      outputContent={
                        <span className="text-[12px] text-[#4C4C4C]">
                          {formData.factFindings ? 'As per retrieved facts, the customer himself perform the transactions as apparently he become victim of suspected social engineering attack.' : '-'}
                        </span>
                      }
                      minHeight="140px"
                    />
                    <LargeTableRow
                      header="Control Breaches"
                      isRequired
                      inputContent={
                        <div className="flex items-center gap-6">
                          <RadioOption
                            value="yes"
                            selected={formData.controlBreaches === 'yes'}
                            onChange={(v) => handleFieldChange('controlBreaches', v)}
                            label="Yes"
                          />
                          <RadioOption
                            value="no"
                            selected={formData.controlBreaches === 'no'}
                            onChange={(v) => handleFieldChange('controlBreaches', v)}
                            label="No"
                          />
                        </div>
                      }
                      outputContent={
                        <span className="text-[12px] text-[#4C4C4C]">
                          {generateOutput('controlBreaches', formData.controlBreaches)}
                        </span>
                      }
                    />
                    <LargeTableRow
                      header="Control Breaches Observed"
                      isInputRow
                      inputContent={
                        <Textarea
                          value={formData.controlBreachesObserved}
                          onChange={(e) => handleFieldChange('controlBreachesObserved', e.target.value)}
                          placeholder="Describe observed control breaches..."
                          className="w-full h-full border-0 bg-transparent text-[14px] focus-visible:ring-0 px-4 py-4 rounded-none resize-none placeholder:text-gray-400"
                        />
                      }
                      outputContent={
                        <span className="text-[12px] text-[#4C4C4C]">
                          {formData.controlBreachesObserved || 'No Control Breach is observed.'}
                        </span>
                      }
                    />
                    <TableRow
                      header="Root Cause"
                      isRequired
                      isInputRow
                      inputContent={
                        <Input
                          value={formData.rootCause}
                          onChange={(e) => handleFieldChange('rootCause', e.target.value)}
                          placeholder="Enter root cause..."
                          className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-3 rounded-none placeholder:text-gray-400"
                        />
                      }
                      outputContent={<span className="text-[12px] text-[#4C4C4C]">-</span>}
                    />
                    <TableRow
                      header="Type of Fraud Identified by the system"
                      isRequired
                      inputContent={
                        <span className="text-[14px] text-black">{formData.typeOfFraud || '-'}</span>
                      }
                      outputContent={<span className="text-[12px] text-[#4C4C4C]">-</span>}
                    />
                  </div>
                )}

                {/* Conclusion Tab */}
                {activeTab === 'conclusion' && (
                  <div className="flex flex-col">
                    <TableRow
                      header="Net Loss booked"
                      isRequired
                      isInputRow
                      inputContent={
                        <Input
                          value={formData.netLossBooked}
                          onChange={(e) => handleFieldChange('netLossBooked', e.target.value)}
                          placeholder="Enter net loss..."
                          className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-3 rounded-none placeholder:text-gray-400"
                        />
                      }
                      outputContent={
                        <span className="text-[12px] text-[#4C4C4C]">
                          {formData.netLossBooked ? `Net loss of ${formData.netLossBooked} was booked.` : 'No loss was booked.'}
                        </span>
                      }
                    />
                    <LargeTableRow
                      header="Conclusion"
                      isRequired
                      isInputRow
                      inputContent={
                        <Textarea
                          value={formData.conclusionText}
                          onChange={(e) => handleFieldChange('conclusionText', e.target.value)}
                          placeholder="Enter conclusion..."
                          className="w-full h-full border-0 bg-transparent text-[14px] focus-visible:ring-0 px-4 py-4 rounded-none resize-none placeholder:text-gray-400"
                        />
                      }
                      outputContent={
                        <span className="text-[12px] text-[#4C4C4C]">
                          {formData.conclusionText ? 'No error / gap was observed at bank\'s end part. So the Liability will remain at customer\'s part.' : '-'}
                        </span>
                      }
                    />
                    <TableRow
                      header="Recommendation"
                      isRequired
                      isInputRow
                      inputContent={
                        <Input
                          value={formData.recommendation}
                          onChange={(e) => handleFieldChange('recommendation', e.target.value)}
                          placeholder="Enter recommendation..."
                          className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-3 rounded-none placeholder:text-gray-400"
                        />
                      }
                      outputContent={<span className="text-[12px] text-[#4C4C4C]">-</span>}
                    />
                    <TableRow
                      header="Action Owner"
                      isRequired
                      isInputRow
                      inputContent={
                        <Input
                          value={formData.actionOwner}
                          onChange={(e) => handleFieldChange('actionOwner', e.target.value)}
                          placeholder="Enter action owner..."
                          className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-3 rounded-none placeholder:text-gray-400"
                        />
                      }
                      outputContent={<span className="text-[12px] text-[#4C4C4C]">-</span>}
                    />
                    <TableRow
                      header="Status of Action Recommended"
                      isRequired
                      isInputRow
                      inputContent={
                        <Input
                          value={formData.statusActionRecommended}
                          onChange={(e) => handleFieldChange('statusActionRecommended', e.target.value)}
                          placeholder="Enter status..."
                          className="w-full h-full border-0 bg-transparent focus-visible:ring-0 px-4 py-3 rounded-none placeholder:text-gray-400"
                        />
                      }
                      outputContent={<span className="text-[12px] text-[#4C4C4C]">-</span>}
                    />
                  </div>
                )}

                {/* Annx (Annexure) Tab */}
                {activeTab === 'annx' && (
                  <div className="p-6">
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".png,.pdf,.jpg,.jpeg,.docx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {/* Drop Zone */}
                    <div
                      className={cn(
                        "border-2 border-dashed rounded-lg p-8 bg-[#F9FAFB] flex flex-col items-center justify-center mb-6 transition-colors",
                        isDragOver ? "border-[#2064B7] bg-[#EFF7FF]" : "border-[#AFAFAF]"
                      )}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                    >
                      <Cloud className="w-12 h-12 text-[#AFAFAF] mb-4" />
                      <p className="text-[16px] text-[#4C4C4C] mb-1">Select your file or drag and drop</p>
                      <p className="text-[12px] text-[#AFAFAF] mb-4">png, pdf, jpg, docx accepted</p>
                      <Button
                        className="bg-[#2064B7] hover:bg-[#1a5298] text-white px-6"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Attach File
                      </Button>
                    </div>

                    {/* Uploaded Files */}
                    <div className="space-y-4">
                      {uploadedFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between bg-[#EFF7FF] border border-[#DAE1E7] rounded-lg p-4"
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <FileText className="w-12 h-12 text-[#AFAFAF]" />
                              <span className="absolute bottom-0 left-0 bg-[#E21F0B] text-white text-[10px] px-1 rounded">
                                {getFileExtension(file.name)}
                              </span>
                            </div>
                            <div>
                              <p className="text-[16px] font-medium text-black">{file.name}</p>
                              <p className="text-[12px] text-[#AFAFAF]">
                                {file.size} of {file.totalSize} <span className="mx-2">•</span>
                                <span className="text-[#22C55E] inline-flex items-center gap-1">
                                  <Check className="w-4 h-4" /> {file.status}
                                </span>
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveFile(file.id)}
                            className="p-2 hover:bg-white rounded-full border border-[#4C4C4C]"
                          >
                            <X className="w-4 h-4 text-[#4C4C4C]" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogPortal>
      </Dialog>

      {/* Success Dialog */}
      <SubmissionSuccessDialog
        open={showSuccess}
        onClose={handleSuccessClose}
      />
    </>
  );
}

export default InvestigationModal;
