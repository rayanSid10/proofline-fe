import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  formatDateTime,
  formatAmount,
} from '@/data/mockFTDH';
import { ftdhAPI } from '@/api/ftdh';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FTDHCaseUpdateModal } from '@/components/modals/FTDHCaseUpdateModal';
import { FTDHReportModal } from '@/components/modals/FTDHReportModal';
import { SubmissionProgressBar } from '@/components/modals/SubmissionProgressBar';
import { toast } from 'sonner';

// SVG Icons
const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.5 1.27a2.12 2.12 0 0 1 3 3L4.74 13.03l-3.87.87.87-3.87L10.5 1.27Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PaperPlaneIcon = () => (
  <svg width="84" height="67" viewBox="0 0 84 67" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M83.4 1.2L37.8 66.6L30.6 37.8L1.8 30.6L83.4 1.2Z" stroke="#AFAFAF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M30.6 37.8L83.4 1.2" stroke="#AFAFAF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const BankIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="15" viewBox="0 0 14 15" fill="none">
    <path d="M6.60583 0.0159597C6.51452 0.0328684 6.33191 0.0971212 6.20002 0.161374C5.71643 0.391332 0.410493 3.20155 0.302278 3.28272C0.244788 3.32668 0.153481 3.4518 0.0993737 3.55664C-0.0358957 3.83394 -0.032514 4.15182 0.106137 4.40545C0.160245 4.5069 0.261697 4.63203 0.329332 4.68613C0.59987 4.89918 0.146718 4.88566 6.88313 4.88566H13.0244L13.1934 4.8045C13.3964 4.70981 13.6229 4.4697 13.677 4.28371C13.7007 4.20931 13.7176 4.05713 13.7176 3.94215C13.7176 3.69867 13.6195 3.47886 13.4403 3.30977C13.3321 3.20494 7.66431 0.198573 7.35996 0.0802126C7.17058 0.00919628 6.81888 -0.0212393 6.60583 0.0159597Z" fill="#4C4C4C"/>
    <path d="M2.11873 6.3811C1.86848 6.47917 1.61147 6.73618 1.51678 6.99319C1.44576 7.18257 1.44238 7.23329 1.44238 8.843C1.44238 10.4223 1.44576 10.5068 1.51002 10.6827C1.60132 10.9261 1.80761 11.1527 2.04433 11.2677C2.21342 11.3489 2.27767 11.3624 2.54145 11.3624C2.79508 11.3624 2.87286 11.3489 3.01151 11.2812C3.2347 11.1696 3.42408 10.9735 3.53568 10.7402L3.6236 10.5508V8.83962V7.12846L3.50524 6.89512C3.24823 6.39124 2.65981 6.17481 2.11873 6.3811Z" fill="#4C4C4C"/>
    <path d="M6.44685 6.3811C6.19661 6.47917 5.93959 6.73618 5.84491 6.99319C5.77389 7.18257 5.77051 7.23329 5.77051 8.843C5.77051 10.4223 5.77389 10.5068 5.83814 10.6827C5.92945 10.9261 6.13574 11.1527 6.37246 11.2677C6.54154 11.3489 6.6058 11.3624 6.86957 11.3624C7.1232 11.3624 7.20098 11.3489 7.33963 11.2812C7.56283 11.1696 7.7522 10.9735 7.8638 10.7402L7.95173 10.5508V8.83962V7.12846L7.83337 6.89512C7.57635 6.39124 6.98793 6.17481 6.44685 6.3811Z" fill="#4C4C4C"/>
    <path d="M10.775 6.3811C10.5247 6.47917 10.2677 6.73618 10.173 6.99319C10.102 7.18257 10.0986 7.23329 10.0986 8.843C10.0986 10.4223 10.102 10.5068 10.1663 10.6827C10.2576 10.9261 10.4639 11.1527 10.7006 11.2677C10.8697 11.3489 10.9339 11.3624 11.1977 11.3624C11.4513 11.3624 11.5291 11.3489 11.6678 11.2812C11.891 11.1696 12.0803 10.9735 12.1919 10.7402L12.2799 10.5508V8.83962V7.12846L12.1615 6.89512C11.9045 6.39124 11.3161 6.17481 10.775 6.3811Z" fill="#4C4C4C"/>
    <path d="M0.730979 12.852C0.477349 12.9331 0.257536 13.1293 0.122267 13.3897C0.0140515 13.5993 0.00390625 13.6501 0.00390625 13.8969C0.00728798 14.0998 0.0241967 14.2114 0.0783044 14.3298C0.179756 14.553 0.399569 14.7795 0.626145 14.8878L0.815522 14.9825L6.7809 14.9926C12.1646 14.9994 12.7666 14.996 12.9357 14.9453C13.2671 14.8506 13.5004 14.6443 13.6458 14.323C13.7337 14.1336 13.7405 13.7278 13.6627 13.5013C13.5951 13.2984 13.3482 13.0244 13.1284 12.9095L12.9559 12.8181L6.91955 12.8114C1.79623 12.808 0.859485 12.8114 0.730979 12.852Z" fill="#4C4C4C"/>
  </svg>
);

const PDFIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#E53935"/>
    <path d="M14 2v6h6" fill="#FFCDD2"/>
    <text x="7" y="17" fill="white" fontSize="6" fontWeight="bold">PDF</text>
  </svg>
);

const MEMBER_BANK_STAGE_LABELS = {
  INITIAL: 'Initial Intimation',
  REMINDER_1: '1st Reminder',
  REMINDER_2: '2nd Reminder',
  REMINDER_3: '3rd Reminder',
};

const MOCK_EMAIL_SUBJECT = 'FTDH Inquiry: Confirmation Required';
const MOCK_EMAIL_BODY = `Dear FTDH Team,

We acknowledge receipt of your fraud inquiry for the referenced transaction.
Please review and proceed with decisioning for this mock communication flow.

Regards,
Member Bank Operations`;

const formatDateTimeWithSeconds = (value) => {
  if (!value) return '—';

  if (typeof value === 'string') {
    const dateOnlyMatch = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      return `${day}/${month}/${year}`;
    }
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

// Timeline Step Component
function TimelineStep({
  title,
  datetime,
  isActive = true,
  isLast = false,
  showLine = true,
  actionLabel,
  onAction,
  actionDisabled = false,
  indicatorColor,
}) {
  return (
    <div className="relative flex items-start gap-4">
      {/* Circle indicator */}
      <div className="relative flex-shrink-0">
        <div className={`w-[38px] h-[38px] rounded-full border-[3px] flex items-center justify-center ${
          isActive ? 'border-[#2064B7] bg-white' : 'border-[#FFE0DE] bg-white'
        }`}
        style={indicatorColor ? { borderColor: indicatorColor } : undefined}
        >
          <div className={`w-[20px] h-[20px] rounded-full ${
            isActive ? 'bg-[#2064B7]' : 'bg-[#FFE0DE]'
          }`}
          style={indicatorColor ? { backgroundColor: indicatorColor } : undefined}
          />
        </div>
        {/* Vertical line */}
        {showLine && !isLast && (
          <div className="absolute left-1/2 top-[38px] w-[2px] h-[82px] bg-[#DAE1E7] -translate-x-1/2" />
        )}
      </div>
      {/* Content */}
      <div className="pt-1 flex-1 flex items-center justify-between gap-4">
        <div>
          <p className="text-[16px] font-medium text-[#4C4C4C] font-['Jost',sans-serif]">{title}</p>
          <p className="text-[10px] text-[#AFAFAF] font-medium mt-0.5">{datetime}</p>
        </div>
        {actionLabel && (
          <Button
            onClick={onAction}
            disabled={actionDisabled}
            className="h-[24px] px-3 text-[12px] font-medium bg-[#2064B7] hover:bg-[#2064B7]/90 text-white rounded-[18px]"
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

// Branch Response Card Component
function BranchResponseCard({
  isExpanded,
  onToggle,
  onAccept,
  onReject,
  responseData,
  submittedAt,
  status = 'sent',
  showActions = false,
  actionDisabled = false,
}) {
  const getContactMethodLabel = (method) => {
    if (!method) return '—';
    const normalized = String(method).toUpperCase();
    if (normalized === 'CALL') return 'Call';
    if (normalized === 'VISIT') return 'Visit';
    if (normalized === 'EMAIL') return 'Email';
    return method;
  };

  const questions = [
    {
      num: 1,
      question: 'Has Branch contacted the customer?',
      answer: responseData?.contactedCustomer || '—',
    },
    {
      num: 2,
      question: 'The customer owned the transaction',
      answer: responseData?.customerOwnedTrx || '—',
    },
    {
      num: 3,
      question: 'Customer Provided the Evidence?',
      answer: responseData?.evidenceProvided || 'No',
      evidenceFiles: responseData?.evidenceFiles || []
    },
    {
      num: 4,
      question: 'Did the Branch perform KYC/CDD?',
      answer: responseData?.kycPerformed || '—',
    },
    {
      num: 5,
      question: 'Branch feedback on the customer profile',
      answer: responseData?.profileFeedback || '—',
      pstrRaised: responseData?.pstrRaised || 'N/A',
    }
  ];

  return (
    <div className={`bg-[#EEF6FF] rounded-tr-[18px] rounded-bl-[18px] rounded-br-[18px] transition-all ${
      isExpanded ? 'h-auto' : 'h-[60px]'
    }`}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 h-[60px] cursor-pointer"
        onClick={onToggle}
      >
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[16px] font-medium text-[#4C4C4C] font-['Jost',sans-serif]">
              Branch Response
            </p>
            {status === 'accepted' && (
              <span className="inline-flex items-center px-2 py-[2px] rounded-full text-[10px] font-medium bg-[#1E9E52]/10 text-[#1E9E52] border border-[#1E9E52]/30">
                Accepted
              </span>
            )}
            {status === 'rejected' && (
              <span className="inline-flex items-center px-2 py-[2px] rounded-full text-[10px] font-medium bg-[#C22E1F]/10 text-[#C22E1F] border border-[#C22E1F]/30">
                Rejected
              </span>
            )}
          </div>
          <p className="text-[10px] text-[#4C4C4C]">{submittedAt || '—'}</p>
        </div>
        <div className="flex items-center gap-2">
          {showActions && (
            <>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onAccept();
                }}
                disabled={actionDisabled}
                className="h-[22px] px-4 text-[14px] font-medium bg-[#2064B7] hover:bg-[#2064B7]/90 text-white rounded-[18px]"
              >
                Accept
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onReject();
                }}
                disabled={actionDisabled}
                className="h-[22px] px-4 text-[14px] font-medium bg-[#C22E1F] hover:bg-[#C22E1F]/90 text-white rounded-[18px]"
              >
                Reject
              </Button>
            </>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="p-1"
          >
            <ChevronRight className={`w-6 h-6 text-[#4C4C4C] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <>
          <div className="mx-4 h-[1px] bg-[#DAE1E7]" />
          <div className="px-4 py-4 max-h-[488px] overflow-y-auto space-y-4">
            {questions.map((q, idx) => (
              <div key={idx}>
                <p className="text-[16px] font-medium text-[#4C4C4C] font-['Jost',sans-serif] mb-2">
                  {q.num}. {q.question}
                </p>
                <div className="bg-white border border-[#EDF1F4] rounded-[3px] p-4">
                  <p className="text-[14px] text-[#4C4C4C] font-['Jost',sans-serif] mb-2">{q.answer}</p>

                  {/* Question 1 specific details */}
                  {q.num === 1 && (
                    <div className="space-y-1">
                      {responseData?.contactedCustomer === 'Yes' && (
                        <div className="flex flex-wrap items-start gap-6">
                          <div>
                            <p className="text-[10px] text-[#AFAFAF]">Mode of Contact</p>
                            <p className="text-[10px] text-[#4C4C4C] font-medium">{getContactMethodLabel(responseData.contactMethod)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[#AFAFAF]">Contact Date &amp; Time</p>
                            <p className="text-[10px] text-[#4C4C4C] font-medium">
                              {responseData?.contactDatetime ? formatDateTime(responseData.contactDatetime) : '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[#AFAFAF]">Contact Number</p>
                            <p className="text-[10px] text-[#4C4C4C] font-medium">{responseData?.beneficiaryPhone || '—'}</p>
                          </div>
                        </div>
                      )}
                      {responseData?.reasonNotContacting && responseData?.contactedCustomer === 'No' && (
                        <div>
                          <p className="text-[10px] text-[#AFAFAF]">Reason for Not Contacting</p>
                          <p className="text-[10px] text-[#4C4C4C] font-medium">{responseData.reasonNotContacting}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Question 2 specific */}
                  {q.num === 2 && (
                    <div>
                      {responseData?.customerStatement && (
                        <>
                          <p className="text-[10px] text-[#AFAFAF]">
                            {responseData?.customerOwnedTrx === 'No' ? 'Comment by Branch' : 'Customer Stance'}
                          </p>
                          <p className="text-[10px] text-[#4C4C4C] font-medium">{responseData.customerStatement}</p>
                        </>
                      )}
                      {responseData?.customerStanceFiles?.length > 0 && (
                        <div className="mt-1 space-y-1">
                          {responseData.customerStanceFiles.map((file, fileIndex) => (
                            <div key={fileIndex} className="flex items-center gap-2">
                              <PDFIcon />
                              {file.url ? (
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[13px] text-[#2064B7] font-medium hover:underline"
                                >
                                  {file.name}
                                </a>
                              ) : (
                                <span className="text-[13px] text-[#4C4C4C] font-medium">{file.name}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Question 3 specific */}
                  {q.num === 3 && q.evidenceFiles?.length > 0 && (
                    <div>
                      <p className="text-[10px] text-[#AFAFAF]">Original provided evidence</p>
                      <div className="mt-1 space-y-1">
                        {q.evidenceFiles.map((file, fileIndex) => (
                          <div key={fileIndex} className="flex items-center gap-2">
                            <PDFIcon />
                            {file.url ? (
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[13px] text-[#2064B7] font-medium hover:underline"
                              >
                                {file.name}
                              </a>
                            ) : (
                              <span className="text-[13px] text-[#4C4C4C] font-medium">{file.name}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Question 4 specific */}
                  {q.num === 4 && responseData?.kycNotes && (
                    <div>
                      <p className="text-[10px] text-[#AFAFAF]">Reason for not performing KYC/CDD</p>
                      <p className="text-[10px] text-[#4C4C4C] font-medium">{responseData.kycNotes}</p>
                    </div>
                  )}

                  {/* Question 5 specific */}
                  {q.num === 5 && (
                    <div className="space-y-2">
                      <div className="bg-white border border-[#EDF1F4] rounded-[3px] p-2 ml-4">
                        <p className="text-[14px] text-[#4C4C4C] font-medium font-['Jost',sans-serif]">PSTR Raised</p>
                        <p className="text-[10px] text-[#4C4C4C] font-medium">{q.pstrRaised}</p>
                        {responseData?.additionalComment && (
                          <>
                            <p className="text-[10px] text-[#AFAFAF] mt-1">Comment</p>
                            <p className="text-[10px] text-[#4C4C4C] font-medium">{responseData.additionalComment}</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Member Bank Tree Node Component
function MemberBankNode({ bankName, isExpanded, onToggle, steps = [], isFirst = false }) {
  return (
    <div className="relative">
      {/* Connector from parent */}
      {!isFirst && (
        <div className="absolute -left-[23px] top-0 w-[23px] h-[18px]">
          <svg width="23" height="18" viewBox="0 0 23 18" fill="none">
            <path d="M0 0V12C0 15.3137 2.68629 18 6 18H23" stroke="#DAE1E7" strokeWidth="2"/>
          </svg>
        </div>
      )}

      {/* Bank header */}
      <div
        className="flex items-center gap-2 cursor-pointer py-1"
        onClick={onToggle}
      >
        <ChevronRight className={`w-4 h-4 text-[#4C4C4C] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        <BankIcon />
        <span className="text-[16px] font-medium text-[#4C4C4C] font-['Jost',sans-serif]">{bankName}</span>
      </div>

      {/* Expanded content */}
      {isExpanded && steps.length > 0 && (
        <div className="ml-8 mt-4 relative">
          {/* Main vertical line connecting all nodes - calculated to end at last node */}
          {steps.length > 1 && (
            <div
              className="absolute left-[30px] top-[19px] w-[2px] bg-[#DAE1E7]"
              style={{ height: `${(steps.length - 1) * 100}px` }}
            />
          )}

          {steps.map((step, idx) => (
            <div key={idx} className={`relative pl-6 ${idx < steps.length - 1 ? 'mb-[62px]' : ''}`}>
              {/* Horizontal connector to circle */}
              <div className="absolute left-0 top-[18px] w-[11px] h-[2px] bg-[#DAE1E7]" />

              <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-[38px] h-[38px] rounded-full border-[3px] border-[#2064B7] bg-white flex items-center justify-center">
                    <div className="w-[20px] h-[20px] rounded-full bg-[#2064B7]" />
                  </div>
                </div>
                <div className="pt-1">
                  <p className="text-[16px] font-medium text-[#4C4C4C] font-['Jost',sans-serif]">{step.title}</p>
                  <p className="text-[10px] text-[#AFAFAF] font-medium">{step.datetime}</p>
                  {step.note && (
                    <p className="text-[10px] text-[#4C4C4C] font-medium mt-1">{step.note}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Main FTDHDetailPage Component
export function FTDHDetailPage({ currentRole = 'ftdh_officer' }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // State
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportCaseData, setReportCaseData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(1);
  const [expandedResponseCards, setExpandedResponseCards] = useState({});
  const [memberBankModalOpen, setMemberBankModalOpen] = useState(false);
  const [memberBankActionLoading, setMemberBankActionLoading] = useState(false);
  const [expandedBanks, setExpandedBanks] = useState({});

  const loadCase = useCallback(async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await ftdhAPI.getInward(id);
        setCaseData(response.data);
      } catch (err) {
        if (err?.response?.status === 404) {
          setError('FTDH case not found');
        } else {
          setError(err?.response?.data?.error || err.message || 'Failed to load FTDH case');
        }
      } finally {
        setLoading(false);
      }
    }, [id]);

  useEffect(() => {
    if (id) {
      loadCase();
    }
  }, [id, loadCase]);

  // Get branch communication state
  const branchState = caseData?.branchCommunication?.branchCommunicationState || 'not_started';
  const bc = caseData?.branchCommunication || {};
  const mb = caseData?.memberBankCommunication || {};
  const init = caseData?.initialData || {};
  const outwardCases = caseData?.outward_ftdhs || [];
  const hasOutward = caseData?.has_outward_ftdh && outwardCases.length > 0;

  // Determine which view to show based on state
  const getViewType = () => {
    if (branchState === 'not_started') {
      return 'not_started';
    }
    if (branchState === 'stance_received' || bc.customerStanceInitial === 'Yes') {
      return 'branch_reviewed';
    }
    if (branchState === '3rd_reminder_sent_waiting' || branchState === 'business_consideration') {
      return '3rd_reminder';
    }
    if (branchState === '2nd_reminder_sent_waiting') {
      return '2nd_reminder';
    }
    if (branchState === '1st_reminder_sent_waiting') {
      return '1st_reminder';
    }
    return 'initial_intimation';
  };

  const viewType = getViewType();

  // Handle Generate Report
  const handleGenerateReport = useCallback((formData) => {
    setUpdateModalOpen(false);
    setReportCaseData(formData);
    setIsGenerating(true);
    setGeneratingStep(1);
    let step = 1;
    const tick = () => {
      step += 1;
      if (step > 6) {
        setTimeout(() => {
          setIsGenerating(false);
          setReportModalOpen(true);
        }, 300);
        return;
      }
      setGeneratingStep(step);
      setTimeout(tick, 250);
    };
    setTimeout(tick, 250);
  }, []);

  const handleCaseUpdated = useCallback((updatedCase) => {
    setUpdateModalOpen(false);
    console.log('Case updated:', updatedCase);
  }, []);

  const handleAcceptResponse = async () => {
    try {
      setActionLoading(true);
      await ftdhAPI.reviewBranchResponse(id, { decision: 'ACCEPT', remarks: 'Accepted by FTDH officer' });
      toast.success('Branch response accepted');
      await loadCase();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to accept branch response');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectResponse = async () => {
    try {
      setActionLoading(true);
      await ftdhAPI.reviewBranchResponse(id, { decision: 'REJECT', remarks: 'Rejected by FTDH officer' });
      toast.success('Branch response rejected');
      await loadCase();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to reject branch response');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMemberBankDecision = async (decision) => {
    try {
      setMemberBankActionLoading(true);
      await ftdhAPI.respondMemberBankMock(id, { decision });
      setMemberBankModalOpen(false);
      toast.success(decision === 'ACCEPT' ? 'Member bank response accepted' : 'Member bank response rejected');
      await loadCase();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to save member bank decision');
    } finally {
      setMemberBankActionLoading(false);
    }
  };

  // Business consideration is now auto-triggered by the scheduler
  // after 3rd reminder delay elapses — no manual button needed.

  // Build timeline chips (only core communication milestones)
  const getTimelineSteps = () => {
    const steps = [];

    if (bc.initialIntimationSent) {
      steps.push({
        key: 'initial',
        title: 'Initial Intimation',
        datetime: bc.initialIntimationDate ? formatDateTime(bc.initialIntimationDate) : '—',
        isActive: true,
      });
    }

    if (bc.firstReminderSent) {
      steps.push({
        key: '1st_reminder',
        title: '1st Reminder',
        datetime: bc.firstReminderDate ? formatDateTime(bc.firstReminderDate) : '—',
        isActive: true,
      });
    }

    if (bc.secondReminderSent) {
      steps.push({
        key: '2nd_reminder',
        title: '2nd Reminder',
        datetime: bc.secondReminderDate ? formatDateTime(bc.secondReminderDate) : '—',
        isActive: true,
      });
    }

    if (bc.thirdReminderSent) {
      steps.push({
        key: '3rd_reminder',
        title: '3rd Reminder',
        datetime: bc.thirdReminderDate ? formatDateTime(bc.thirdReminderDate) : '—',
        isActive: true,
      });
    }

    if (bc.businessConsiderationSubmitted) {
      steps.push({
        key: 'business_consideration',
        title: 'Record Submitted for business consideration',
        datetime: bc.businessConsiderationDate ? formatDateTime(bc.businessConsiderationDate) : '—',
        isActive: true,
        indicatorColor: '#FFC4BE',
      });
    }

    if (steps.length > 0) return steps;

    return [{
      key: 'pending',
      title: 'Branch Intimation Pending',
      datetime: init.ftdhReceivingDateTime ? formatDateTime(init.ftdhReceivingDateTime) : '—',
      isActive: false,
    }];
  };


  const timelineSteps = getTimelineSteps();
  const memberBankHistory = mb?.history || [];
  const branchResponseHistory = (bc?.responseHistory || []).map((item) => {
    const documents = item?.data?.documentsUploaded || [];
    const typedStanceFiles = documents.filter((doc) => doc.attachment_type === 'CUSTOMER_STANCE');
    const typedEvidenceFiles = documents.filter((doc) => doc.attachment_type === 'EVIDENCE');
    const untypedFiles = documents.filter((doc) => !doc.attachment_type || doc.attachment_type === 'OTHER');
    const customerStanceFiles = typedStanceFiles.length > 0 ? typedStanceFiles : (typedEvidenceFiles.length === 0 ? untypedFiles : []);
    const evidenceFiles = typedEvidenceFiles.length > 0 ? typedEvidenceFiles : untypedFiles;

    return {
      id: item.id,
      status: item.status || 'sent',
      stageKey: item.stageKey,
      submittedAt: item.submittedAt,
      responseData: {
        contactedCustomer: item?.data?.customerContacted ? 'Yes' : 'No',
        reasonNotContacting: item?.data?.reasonNotContacting || '',
        contactMethod: item?.data?.contactMethod || null,
        contactDatetime: item?.data?.contactDatetime || null,
        beneficiaryPhone: init?.beneficiaryPhone || null,
        customerOwnedTrx: item?.data?.customerAdmitsTransaction ? 'Yes' : 'No',
        customerStatement: item?.data?.customerStatement || '',
        customerStanceFiles: customerStanceFiles.map((doc) => ({
          name: doc.original_name || doc.name || 'Attachment.pdf',
          url: doc.file_url || doc.url || null,
        })),
        evidenceProvided: item?.data?.providedEvidence === true ? 'Yes' : item?.data?.providedEvidence === false ? 'No' : (evidenceFiles.length > 0 ? 'Yes' : 'No'),
        evidenceFiles: item?.data?.providedEvidence === false ? [] : evidenceFiles.map((doc) => ({
          name: doc.original_name || doc.name || 'Attachment.pdf',
          url: doc.file_url || doc.url || null,
        })),
        kycPerformed: item?.data?.kycVerified ? 'Yes' : 'No',
        kycNotes: item?.data?.kycNotes || '',
        profileFeedback: item?.data?.profileFeedback || item?.data?.branchRecommendation || '—',
        pstrRaised: item?.data?.pstrRaised === true ? 'Yes' : item?.data?.pstrRaised === false ? 'No' : 'N/A',
        additionalComment: item?.data?.additionalComment || '',
      },
    };
  });

  const latestPendingResponse = [...branchResponseHistory].reverse().find((item) => item.status === 'sent');

  const getResponsesForStep = (stepKey) => {
    if (!stepKey || stepKey === 'pending') return [];

    if (stepKey === 'business_consideration') {
      const bcAt = bc.businessConsiderationDate ? new Date(bc.businessConsiderationDate) : null;
      return branchResponseHistory.filter((resp) => {
        if (resp.stageKey === 'business_consideration') return true;
        if (resp.stageKey !== '3rd_reminder' || !bcAt || !resp.submittedAt) return false;
        return new Date(resp.submittedAt) >= bcAt;
      });
    }

    if (stepKey === '3rd_reminder' && bc.businessConsiderationDate) {
      const bcAt = new Date(bc.businessConsiderationDate);
      return branchResponseHistory.filter((resp) => {
        if (resp.stageKey !== '3rd_reminder') return false;
        if (!resp.submittedAt) return true;
        return new Date(resp.submittedAt) < bcAt;
      });
    }

    return branchResponseHistory.filter((resp) => resp.stageKey === stepKey);
  };

  const toggleResponseCard = (cardKey) => {
    setExpandedResponseCards((prev) => ({
      ...prev,
      [cardKey]: !(prev[cardKey] ?? false),
    }));
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-100px)] flex items-center justify-center text-muted-foreground font-['Inter',sans-serif]">
        Loading FTDH case...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[calc(100vh-100px)] flex flex-col gap-4 justify-center max-w-2xl mx-auto font-['Inter',sans-serif]">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div>
          <Button onClick={() => navigate('/ftdh')} variant="outline">
            Back to Inward FTDH
          </Button>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return null;
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col font-['Inter',sans-serif]">
      {/* Main Card */}
      <div className="flex-1 bg-white border-2 border-[#DAE1E7] rounded-[15px] overflow-hidden flex flex-col">
        {/* Blue Header */}
        <div className="bg-[#2064B7] px-6 py-4 shrink-0">
          {/* Row 1: Case Info */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/ftdh')}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>

            {/* Case Info Grid */}
            <div className="flex items-start gap-12 flex-1">
              {/* Dispute ID */}
              <div>
                <p className="text-[14px] text-white/50 font-medium">Dispute ID</p>
                <p className="text-[19px] text-white font-medium mt-1">
                  {init.disputeId?.replace('FTDH-INW-', 'IBFT-') || '—'}
                </p>
              </div>

              {/* Sender */}
              <div>
                <p className="text-[14px] text-white/50 font-medium">Sender</p>
                <p className="text-[19px] text-white font-medium mt-1">
                  {init.sendingBank?.split(' ')[0] || '—'}
                </p>
                <p className="text-[12px] text-white font-medium">
                  {init.senderAccount || '—'}
                </p>
              </div>

              {/* Beneficiary */}
              <div>
                <p className="text-[14px] text-white/50 font-medium">Beneficiary</p>
                <p className="text-[19px] text-white font-medium mt-1">
                  {init.receivingBank?.split(' ')[0] || '—'}
                </p>
                <p className="text-[12px] text-white font-medium">
                  {init.beneficiaryAccount || '—'}
                </p>
              </div>

              {/* Trx Date & Time */}
              <div>
                <p className="text-[14px] text-white/50 font-medium">Trx Date & Time</p>
                <p className="text-[17px] text-white font-medium mt-1">
                  {formatDateTimeWithSeconds(init.transactionDateTime)}
                </p>
              </div>

              {/* Stan */}
              <div>
                <p className="text-[14px] text-white/50 font-medium">Stan</p>
                <p className="text-[19px] text-white font-medium mt-1">
                  {init.stan || '—'}
                </p>
              </div>

              {/* Trx Amount */}
              <div>
                <p className="text-[14px] text-white/50 font-medium">Trx Amount</p>
                <p className="text-[17px] text-white font-semibold mt-1">
                  {init.amount ? formatAmount(init.amount) : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Row 2: Update Form Button - aligned right */}
          <div className="flex justify-end items-center gap-2 mt-2 flex-wrap">
            {/* Temporarily disabled for demo:
                - status dropdown (set_status)
                - assignee dropdown (assign)
            */}

            <Button
              onClick={() => setUpdateModalOpen(true)}
              className="h-[22px] px-3 py-3 text-[14px] font-medium bg-[#05AEE5] hover:bg-[#05AEE5]/90 text-white rounded-[18px] flex items-center gap-2"
            >
              {/* <EditIcon /> */}
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M2.01759 0.0280113C1.19804 0.186988 0.479902 0.787262 0.170172 1.56296C-0.0134737 2.0207 0.00023115 1.60955 0.00023115 7.01476V11.9074L0.0632736 12.1404C0.183877 12.6036 0.430565 13.023 0.770446 13.3492C1.07469 13.6397 1.33783 13.7932 1.76816 13.9385L2.00114 14.018L4.59137 14.0262C6.93216 14.0317 7.19255 14.0289 7.29945 13.9878C7.5571 13.8919 7.68867 13.7027 7.68867 13.4314C7.68867 13.2916 7.67223 13.2368 7.57903 13.0668C7.14596 12.2829 6.97876 11.7484 6.9349 11.0303C6.88557 10.2436 7.12129 9.35007 7.55985 8.64564C8.045 7.86446 8.87277 7.20115 9.71699 6.92157C10.1035 6.79274 10.3584 6.74615 10.8655 6.70229C11.1423 6.68036 11.3232 6.65295 11.378 6.6228C11.4959 6.5625 11.6275 6.40626 11.6631 6.28292C11.685 6.20891 11.6905 5.57027 11.685 4.12303C11.6741 2.07826 11.6741 2.0673 11.6138 1.86172C11.3259 0.913346 10.6023 0.230844 9.6841 0.0417156C9.49772 0.00334263 9.05642 -0.00214005 5.80562 0.000600815C3.78826 0.00334263 2.08337 0.0143061 2.01759 0.0280113ZM7.78735 3.84893C8.16834 4.08192 8.11901 4.66026 7.70238 4.85213C7.59822 4.90147 7.46939 4.90421 5.09845 4.90421H2.60416L2.46437 4.83843C2.38762 4.80279 2.29169 4.73153 2.25331 4.67945C2.16834 4.56981 2.11901 4.3752 2.14368 4.23541C2.16834 4.08192 2.30813 3.89005 2.45066 3.81604L2.57401 3.753L5.11215 3.75848L7.65304 3.7667L7.78735 3.84893ZM6.37848 6.94624C6.54843 7.06684 6.62517 7.22856 6.61421 7.44509C6.6005 7.6726 6.50183 7.82061 6.29077 7.92751L6.14002 8.00425L4.34194 7.99603L2.54386 7.98781L2.40955 7.90558C2.02581 7.66711 2.05596 7.11344 2.46711 6.8969C2.54112 6.85578 2.75217 6.85304 4.40498 6.85853L6.25788 6.86401L6.37848 6.94624ZM5.4027 9.9339C5.7508 10.1504 5.75902 10.652 5.4164 10.8932L5.29854 10.9755L3.94176 10.9837C2.60964 10.9892 2.58223 10.9892 2.46437 10.9344C2.20672 10.8083 2.08337 10.5342 2.16286 10.271C2.21768 10.0874 2.29717 9.98872 2.46163 9.90923L2.60416 9.83523L3.93627 9.84345L5.26839 9.85167L5.4027 9.9339Z" fill="white"/>
                <path d="M12.1838 7.61731C12.0221 7.69132 9.14136 10.5611 9.05913 10.7283C9.02898 10.7941 8.95498 11.1395 8.87823 11.5917C8.76585 12.2578 8.75489 12.3592 8.78504 12.4688C8.83986 12.6854 9.01802 12.8252 9.24278 12.8252C9.37161 12.8252 10.5996 12.6031 10.7859 12.5456C10.86 12.5237 11.2437 12.1591 12.3839 11.0189C13.2117 10.1966 13.9107 9.47843 13.9381 9.42087C14.0148 9.27834 14.034 9.11936 13.9929 8.96587C13.96 8.85075 13.8915 8.77126 13.3817 8.25596C13.0637 7.93526 12.7622 7.65294 12.7074 7.62827C12.5539 7.55427 12.3319 7.54878 12.1838 7.61731Z" fill="white"/>
              </svg>
              Update Form
            </Button>

          </div>
        </div>

        {/* Content Area - Two Columns */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column - Communication with Branch */}
          <div className="flex-1 p-6 overflow-y-auto">
            <h2 className="text-[20px] font-semibold text-[#4C4C4C] mb-6">Communication with Branch</h2>

            {viewType === 'not_started' && (
              <div className="space-y-4">
                <TimelineStep
                  title="Branch Intimation Pending"
                  datetime={init.ftdhReceivingDateTime ? formatDateTime(init.ftdhReceivingDateTime) : '—'}
                  isActive={false}
                  isLast={true}
                  showLine={false}
                />

                <div className="flex flex-col items-center justify-center py-16">
                  <PaperPlaneIcon />
                  <p className="text-[19px] text-[#4C4C4C] text-center mt-4 font-medium font-['Jost',sans-serif]">
                    Initial intimation not sent yet
                  </p>
                </div>
              </div>
            )}

            {viewType !== 'not_started' && (
              <div className="space-y-0">
                {timelineSteps.map((step, idx) => {
                  const isLast = idx === timelineSteps.length - 1;
                  return (
                  <div key={idx} className="relative mb-[82px] last:mb-0">
                    {/* Connecting line from circle bottom to next circle — spans through response cards + margin */}
                    {!isLast && (
                      <div
                        className="absolute left-[19px] top-[38px] w-[2px] bg-[#DAE1E7] -translate-x-1/2"
                        style={{ bottom: '-82px' }}
                      />
                    )}
                    <TimelineStep
                      title={step.title}
                      datetime={step.datetime}
                      isActive={step.isActive}
                      isLast={isLast}
                      showLine={false}
                      indicatorColor={step.indicatorColor}
                      actionLabel={null}
                      onAction={() => {}}
                      actionDisabled={actionLoading}
                    />

                    {getResponsesForStep(step.key).map((resp, rIdx) => (
                      <div key={`resp-${step.key}-${resp.id || rIdx}`} className="mt-4 ml-[52px]">
                        {(() => {
                          const cardKey = resp.id || `${step.key}-${rIdx}`;
                          return (
                        <BranchResponseCard
                            isExpanded={expandedResponseCards[cardKey] ?? false}
                            onToggle={() => toggleResponseCard(cardKey)}
                          onAccept={handleAcceptResponse}
                          onReject={handleRejectResponse}
                          status={resp.status}
                          submittedAt={resp.submittedAt ? formatDateTime(resp.submittedAt) : '—'}
                          showActions={latestPendingResponse?.id === resp.id}
                          actionDisabled={actionLoading}
                          responseData={resp.responseData}
                        />
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Vertical Divider */}
          <div className="w-[2px] bg-[#DAE1E7]" />

          {/* Right Column - Communication with Member Bank */}
          <div className="flex-1 p-6 overflow-y-auto">

            <h2 className={`text-[20px] font-semibold mb-4 ${mb?.enabled ? 'text-[#4C4C4C]' : 'text-[#AFAFAF]'}`}>
              Communication with Member Bank
            </h2>



            {mb?.enabled && mb?.started && (
              <div className="space-y-1">
                {memberBankHistory.map((bankEntry, bankIdx) => {
                  const isActiveBank = !mb?.resolved && (bankEntry.bankName === mb?.activeBank || bankIdx === memberBankHistory.length - 1);
                  const stageEvents = bankEntry.events || [];
                  const activeStage = mb?.activeStage;
                  const bankKey = `${bankEntry.bankName}-${bankIdx}`;
                  const isBankExpanded = expandedBanks[bankKey] ?? true;

                  return (
                    <div key={bankKey}>
                      {/* Bank Header Row - clickable to expand/collapse */}
                      <div
                        className="flex items-center justify-between py-2.5 cursor-pointer group"
                        onClick={() => setExpandedBanks(prev => ({ ...prev, [bankKey]: !isBankExpanded }))}
                      >
                        <div className="flex items-center gap-2.5">
                          <ChevronRight className={`w-5 h-5 text-[#4C4C4C] transition-transform duration-200 ${isBankExpanded ? 'rotate-90' : ''}`} />
                          <BankIcon />
                          <span className="text-[16px] font-medium text-[#4C4C4C] font-['Jost',sans-serif]">
                            {bankEntry.bankName}
                          </span>
                        </div>
                      </div>

                      {/* Expanded: Reminder Timeline */}
                      {isBankExpanded && stageEvents.length > 0 && (
                        <div className="relative ml-7 mt-1 mb-3">
                          {/* L-shaped connector from chevron down to first circle center */}
                          <div className="absolute -top-[18px] left-[-18px] w-[37px] h-[37px] pointer-events-none">
                            <svg width="37" height="37" viewBox="0 0 37 37" fill="none" className="block">
                              <path d="M1 0V36H37" stroke="#DAE1E7" strokeWidth="2"/>
                            </svg>
                          </div>
                          {stageEvents.map((evt, evtIdx) => {
                            const isActiveStage = isActiveBank && evt.stage === activeStage && !mb?.resolved;
                            const decision = evt.decision;
                            const isAccepted = decision === 'ACCEPT';
                            const isRejected = decision === 'REJECT';
                            const isLast = evtIdx === stageEvents.length - 1;

                            const hasDecision = isAccepted || isRejected;
                            const useGradient = hasDecision;

                            return (
                              <div key={`${evt.stage}-${evtIdx}`} className="relative flex items-start gap-4">
                                {/* Circle indicator */}
                                <div className="relative flex-shrink-0">
                                  {useGradient ? (
                                    <div
                                      className="w-[38px] h-[38px] rounded-full flex items-center justify-center"
                                      style={{ background: 'linear-gradient(180deg, #6ECDC5 0%, #08ADE7 100%)' }}
                                    >
                                      <div className="w-[18px] h-[18px] rounded-full bg-white" />
                                    </div>
                                  ) : (
                                    <div
                                      className="w-[38px] h-[38px] rounded-full border-[3px] border-[#2064B7] bg-white flex items-center justify-center"
                                    >
                                      <div className="w-[20px] h-[20px] rounded-full bg-[#2064B7]" />
                                    </div>
                                  )}
                                  {/* Vertical line to next node */}
                                  {!isLast && (
                                    <div className="absolute left-1/2 top-[38px] w-[2px] h-[82px] bg-[#DAE1E7] -translate-x-1/2" />
                                  )}
                                </div>

                                {/* Content */}
                                <div className={`pt-1 flex-1 min-w-0 ${!isLast ? 'pb-[62px]' : ''}`}>
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-[16px] font-medium text-[#4C4C4C] font-['Jost',sans-serif]">
                                      {MEMBER_BANK_STAGE_LABELS[evt.stage] || evt.label || 'Reminder'}
                                    </p>
                                    {isActiveStage && (
                                      <Button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setMemberBankModalOpen(true);
                                        }}
                                        disabled={memberBankActionLoading}
                                        className="h-[24px] px-3 text-[12px] font-medium bg-[#2064B7] hover:bg-[#2064B7]/90 text-white rounded-[18px] flex-shrink-0"
                                      >
                                        Mock Communication
                                      </Button>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-[#AFAFAF] font-medium mt-0.5">
                                    {evt.sentAt ? formatDateTime(evt.sentAt) : '—'}
                                  </p>
                                  {isAccepted && (
                                    <p className="text-[12px] text-[#4C4C4C] mt-1">
                                      Customer withdraw the complaint (Lien removed).
                                    </p>
                                  )}
                                  {isRejected && bankEntry.rejectionMessage && (
                                    <p className="text-[12px] text-[#4C4C4C] mt-1">
                                      {bankEntry.rejectionMessage}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}


                    </div>
                  );
                })}


              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-4 shrink-0">
        <span>
          © 2025, Made by{' '}
          <span className="text-[#2064B7] font-medium">ProofLine</span>
        </span>
        <div className="flex gap-4">
          <a href="#" className="text-[#2064B7] hover:underline">License</a>
          <a href="#" className="text-[#2064B7] hover:underline">Support</a>
        </div>
      </div>

      {/* Update Modal */}
      <FTDHCaseUpdateModal
        open={updateModalOpen}
        onOpenChange={setUpdateModalOpen}
        caseData={caseData}
        onCaseUpdated={handleCaseUpdated}
        onGenerateReport={handleGenerateReport}
      />

      {/* Loading overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center">
          <SubmissionProgressBar currentStep={generatingStep} totalSteps={6} />
        </div>
      )}

      {/* Report Modal */}
      <FTDHReportModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        caseData={reportCaseData}
      />

      <Dialog open={memberBankModalOpen} onOpenChange={setMemberBankModalOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Mock Member Bank Email</DialogTitle>
            <DialogDescription>
              Static communication preview for decisioning by FTDH officer.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-[10px] border border-[#DAE1E7] bg-[#FAFAFA] p-4 space-y-3">
            <div>
              <p className="text-[11px] text-[#AFAFAF]">From</p>
              <p className="text-[13px] text-[#4C4C4C]">memberbank.ops@bank.com</p>
            </div>
            <div>
              <p className="text-[11px] text-[#AFAFAF]">Subject</p>
              <p className="text-[13px] text-[#4C4C4C]">{MOCK_EMAIL_SUBJECT}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#AFAFAF] mb-1">Body</p>
              <p className="text-[13px] text-[#4C4C4C] whitespace-pre-line">{MOCK_EMAIL_BODY}</p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => handleMemberBankDecision('REJECT')}
              disabled={memberBankActionLoading || !mb?.canReject}
              className="border-[#C22E1F] text-[#C22E1F] hover:bg-[#FDECEC] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Reject
            </Button>
            <Button
              onClick={() => handleMemberBankDecision('ACCEPT')}
              disabled={memberBankActionLoading}
              className="bg-[#2064B7] hover:bg-[#2064B7]/90 text-white"
            >
              Accept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default FTDHDetailPage;
