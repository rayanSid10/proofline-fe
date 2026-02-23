import { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  MOCK_FTDH_CASES,
  formatDateTime,
  formatAmount,
} from '@/data/mockFTDH';
import { FTDHCaseUpdateModal } from '@/components/modals/FTDHCaseUpdateModal';
import { FTDHReportModal } from '@/components/modals/FTDHReportModal';
import { SubmissionProgressBar } from '@/components/modals/SubmissionProgressBar';

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
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 17V7L9 1L17 7V17H1Z" stroke="#4C4C4C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 17V11H9V17" stroke="#4C4C4C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PDFIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#E53935"/>
    <path d="M14 2v6h6" fill="#FFCDD2"/>
    <text x="7" y="17" fill="white" fontSize="6" fontWeight="bold">PDF</text>
  </svg>
);

// Timeline Step Component
function TimelineStep({ title, datetime, isActive = true, isLast = false, showLine = true }) {
  return (
    <div className="relative flex items-start gap-4">
      {/* Circle indicator */}
      <div className="relative flex-shrink-0">
        <div className={`w-[38px] h-[38px] rounded-full border-[3px] flex items-center justify-center ${
          isActive ? 'border-[#2064B7] bg-white' : 'border-[#FFE0DE] bg-white'
        }`}>
          <div className={`w-[20px] h-[20px] rounded-full ${
            isActive ? 'bg-[#2064B7]' : 'bg-[#FFE0DE]'
          }`} />
        </div>
        {/* Vertical line */}
        {showLine && !isLast && (
          <div className="absolute left-1/2 top-[38px] w-[2px] h-[82px] bg-[#DAE1E7] -translate-x-1/2" />
        )}
      </div>
      {/* Content */}
      <div className="pt-1">
        <p className="text-[16px] font-medium text-[#4C4C4C] font-['Jost',sans-serif]">{title}</p>
        <p className="text-[10px] text-[#AFAFAF] font-medium mt-0.5">{datetime}</p>
      </div>
    </div>
  );
}

// Branch Response Card Component
function BranchResponseCard({ isExpanded, onToggle, onAccept, onReject, responseData, isAccepted = false }) {
  const questions = [
    {
      num: 1,
      question: 'Does Branch contacted the customer?',
      answer: responseData?.contactedCustomer || 'Yes',
      details: responseData?.contactDetails || {
        callDateTime: '03/06/2025 10:50 AM',
        contactNumber: '0325977998',
        modeOfContact: 'Call, Email, Letter',
        attachment: 'Letter.pdf',
        comment: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s,"
      }
    },
    {
      num: 2,
      question: 'The customer owned the transaction',
      answer: responseData?.customerOwnedTrx || 'No',
      comment: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s,"
    },
    {
      num: 3,
      question: 'Customer Provided the Evidence?',
      answer: responseData?.evidenceProvided || 'Yes',
      evidenceFile: 'Customer-Evidence.pdf'
    },
    {
      num: 4,
      question: 'Did the Branch perform KYC/CDD?',
      answer: responseData?.kycPerformed || 'No',
      reason: 'Reason for not performing KYC/CDD'
    },
    {
      num: 5,
      question: 'Branch feedback on the customer profile',
      answer: responseData?.profileFeedback || 'Un-Satisfactory',
      pstrRaised: responseData?.pstrRaised || 'Yes',
      comment: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s,"
    }
  ];

  return (
    <div className={`bg-[#EEF6FF] rounded-tr-[18px] rounded-bl-[18px] rounded-br-[18px] transition-all ${
      isExpanded ? 'h-auto' : 'h-[60px]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 h-[60px]">
        <div>
          <p className="text-[16px] font-medium text-[#4C4C4C] font-['Jost',sans-serif]">Branch Response</p>
          <p className="text-[10px] text-[#4C4C4C]">03/06/2025 10:50 AM</p>
        </div>
        <div className="flex items-center gap-2">
          {!isAccepted && (
            <>
              <Button
                onClick={onAccept}
                className="h-[22px] px-4 text-[14px] font-medium bg-[#2064B7] hover:bg-[#2064B7]/90 text-white rounded-[18px]"
              >
                Accept
              </Button>
              <Button
                onClick={onReject}
                className="h-[22px] px-4 text-[14px] font-medium bg-[#C22E1F] hover:bg-[#C22E1F]/90 text-white rounded-[18px]"
              >
                Reject
              </Button>
            </>
          )}
          <button onClick={onToggle} className="p-1">
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
                  {q.num === 1 && q.details && (
                    <div className="space-y-2">
                      <div className="flex gap-8">
                        <div>
                          <p className="text-[10px] text-[#AFAFAF]">Call Date & Time</p>
                          <p className="text-[10px] text-[#4C4C4C] font-medium">{q.details.callDateTime}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#AFAFAF]">Contact Number</p>
                          <p className="text-[10px] text-[#4C4C4C] font-medium">{q.details.contactNumber}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#AFAFAF]">Mode of Contact</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-[#4C4C4C] font-medium">{q.details.modeOfContact}</p>
                            {q.details.attachment && (
                              <div className="flex items-center gap-1">
                                <PDFIcon />
                                <span className="text-[9px] text-[#4C4C4C]">{q.details.attachment}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#AFAFAF]">Comment by Branch</p>
                        <p className="text-[10px] text-[#4C4C4C] font-medium">{q.details.comment}</p>
                      </div>
                    </div>
                  )}

                  {/* Question 2 specific */}
                  {q.num === 2 && q.comment && (
                    <div>
                      <p className="text-[10px] text-[#AFAFAF]">Comment by Branch</p>
                      <p className="text-[10px] text-[#4C4C4C] font-medium">{q.comment}</p>
                    </div>
                  )}

                  {/* Question 3 specific */}
                  {q.num === 3 && q.evidenceFile && (
                    <div>
                      <p className="text-[10px] text-[#AFAFAF]">Original provided evidence</p>
                      <div className="flex items-center gap-2 mt-1">
                        <PDFIcon />
                        <span className="text-[13px] text-[#4C4C4C] font-medium">{q.evidenceFile}</span>
                      </div>
                    </div>
                  )}

                  {/* Question 4 specific */}
                  {q.num === 4 && q.reason && (
                    <div>
                      <p className="text-[10px] text-[#AFAFAF]">{q.reason}</p>
                      <p className="text-[10px] text-[#4C4C4C] font-medium">Lorem Ipsum is simply dummy text...</p>
                    </div>
                  )}

                  {/* Question 5 specific */}
                  {q.num === 5 && (
                    <div className="space-y-2">
                      <div className="bg-white border border-[#EDF1F4] rounded-[3px] p-2 ml-4">
                        <p className="text-[14px] text-[#4C4C4C] font-medium font-['Jost',sans-serif]">PSTR Raised</p>
                        <p className="text-[10px] text-[#4C4C4C] font-medium">{q.pstrRaised}</p>
                        <p className="text-[10px] text-[#AFAFAF] mt-1">Comment</p>
                        <p className="text-[10px] text-[#4C4C4C] font-medium">{q.comment}</p>
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

  // Find the case data
  const caseData = useMemo(() => {
    return MOCK_FTDH_CASES.find(c => c.id === id) || MOCK_FTDH_CASES[0];
  }, [id]);

  // State
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportCaseData, setReportCaseData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(1);
  const [branchResponseExpanded, setBranchResponseExpanded] = useState(true);
  const [responseAccepted, setResponseAccepted] = useState(false);
  const [expandedBanks, setExpandedBanks] = useState({ UBL: true });

  // Get branch communication state
  const branchState = caseData?.branchCommunication?.branchCommunicationState || 'not_started';
  const bc = caseData?.branchCommunication || {};
  const mb = caseData?.memberBankCommunication || {};
  const init = caseData?.initialData || {};

  // Determine which view to show based on state
  const getViewType = () => {
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

  const handleAcceptResponse = () => {
    setResponseAccepted(true);
  };

  const toggleBank = (bank) => {
    setExpandedBanks(prev => ({ ...prev, [bank]: !prev[bank] }));
  };

  // Build timeline steps
  const getTimelineSteps = () => {
    const steps = [];

    steps.push({
      title: 'Initial Intimation',
      datetime: bc.initialIntimationDate ? formatDateTime(bc.initialIntimationDate) : '02/06/2025 10:50 AM',
      isActive: true
    });

    if (['1st_reminder', '2nd_reminder', '3rd_reminder', 'branch_reviewed'].some(t => viewType.includes(t)) ||
        bc.firstReminderSent) {
      steps.push({
        title: '1st Reminder',
        datetime: bc.firstReminderDate ? formatDateTime(bc.firstReminderDate) : '05/06/2025 10:50 AM',
        isActive: true
      });
    }

    if (['2nd_reminder', '3rd_reminder'].some(t => viewType.includes(t)) || bc.secondReminderSent) {
      steps.push({
        title: '2nd Reminder',
        datetime: bc.secondReminderDate ? formatDateTime(bc.secondReminderDate) : '08/06/2025 10:50 AM',
        isActive: true
      });
    }

    if (viewType === '3rd_reminder' || bc.thirdReminderSent) {
      steps.push({
        title: '3rd Reminder',
        datetime: bc.thirdReminderDate ? formatDateTime(bc.thirdReminderDate) : '12/06/2025 10:50 AM',
        isActive: true
      });

      if (branchState === 'business_consideration' || bc.businessConsiderationSubmitted) {
        steps.push({
          title: 'Record Submitted for business consideration',
          datetime: bc.businessConsiderationDate ? formatDateTime(bc.businessConsiderationDate) : '12/06/2025 10:50 AM',
          isActive: false
        });
      }
    }

    return steps;
  };

  // Build member bank steps
  const getMemberBankSteps = () => {
    const steps = [];

    if (mb.initialSubmissionSent) {
      steps.push({
        title: 'Initial Submission',
        datetime: mb.initialSubmissionDate ? formatDateTime(mb.initialSubmissionDate) : '02/06/2025 10:50 AM'
      });
    }

    if (mb.firstReminderSent) {
      steps.push({
        title: '1st Reminder',
        datetime: mb.firstReminderDate ? formatDateTime(mb.firstReminderDate) : '05/06/2025 10:50 AM'
      });
    }

    if (mb.secondReminderSent) {
      steps.push({
        title: '2nd Reminder',
        datetime: mb.secondReminderDate ? formatDateTime(mb.secondReminderDate) : '08/06/2025 10:50 AM',
        note: mb.feedbackReceived === 'Yes' ? 'Customer withdraw the complaint (Lien removed).' : null
      });
    }

    return steps;
  };

  const timelineSteps = getTimelineSteps();
  const memberBankSteps = getMemberBankSteps();

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
                  {init.disputeId?.replace('FTDH-INW-', 'IBFT-') || 'IBFT-SBC-25...'}
                </p>
              </div>

              {/* Sender */}
              <div>
                <p className="text-[14px] text-white/50 font-medium">Sender</p>
                <p className="text-[19px] text-white font-medium mt-1">
                  {init.sendingBank?.split(' ')[0] || 'SBC'}
                </p>
                <p className="text-[12px] text-white font-medium">
                  {init.senderAccount || '328152075045435'}
                </p>
              </div>

              {/* Beneficiary */}
              <div>
                <p className="text-[14px] text-white/50 font-medium">Beneficiary</p>
                <p className="text-[19px] text-white font-medium mt-1">
                  {init.receivingBank?.split(' ')[0] || 'HBL'}
                </p>
                <p className="text-[12px] text-white font-medium">
                  {init.beneficiaryAccount || '001001001001001'}
                </p>
              </div>

              {/* Trx Date & Time */}
              <div>
                <p className="text-[14px] text-white/50 font-medium">Trx Date & Time</p>
                <p className="text-[17px] text-white font-medium mt-1">
                  {init.transactionDateTime ? formatDateTime(init.transactionDateTime) : '02/06/2025 10:49:18'}
                </p>
              </div>

              {/* Stan */}
              <div>
                <p className="text-[14px] text-white/50 font-medium">Stan</p>
                <p className="text-[19px] text-white font-medium mt-1">
                  {init.stan || '345675'}
                </p>
              </div>

              {/* Trx Amount */}
              <div>
                <p className="text-[14px] text-white/50 font-medium">Trx Amount</p>
                <p className="text-[17px] text-white font-semibold mt-1">
                  {init.amount ? formatAmount(init.amount) : 'PKR 50,000'}
                </p>
              </div>
            </div>
          </div>

          {/* Row 2: Update Form Button - aligned right */}
          <div className="flex justify-end mt-2">
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

            {viewType === 'initial_intimation' && (
              <div className="space-y-4">
                <TimelineStep
                  title="Initial Intimation"
                  datetime={bc.initialIntimationDate ? formatDateTime(bc.initialIntimationDate) : '02/06/2025 10:50 AM'}
                  isActive={true}
                  isLast={true}
                  showLine={false}
                />

                {/* Paper plane illustration */}
                <div className="flex flex-col items-center justify-center py-16">
                  <PaperPlaneIcon />
                  <p className="text-[19px] text-[#4C4C4C] text-center mt-4 font-medium font-['Jost',sans-serif]">
                    Initial Intimation<br/>sent to Branch
                  </p>
                </div>
              </div>
            )}

            {viewType === 'branch_reviewed' && (
              <div className="space-y-4">
                <TimelineStep
                  title="Initial Intimation"
                  datetime={bc.initialIntimationDate ? formatDateTime(bc.initialIntimationDate) : '02/06/2025 10:50 AM'}
                  isActive={true}
                  isLast={true}
                  showLine={false}
                />

                {/* Branch Response Card */}
                <div className="mt-4 ml-[52px]">
                  <BranchResponseCard
                    isExpanded={branchResponseExpanded}
                    onToggle={() => setBranchResponseExpanded(!branchResponseExpanded)}
                    onAccept={handleAcceptResponse}
                    onReject={() => {}}
                    isAccepted={responseAccepted}
                  />
                </div>
              </div>
            )}

            {['1st_reminder', '2nd_reminder', '3rd_reminder'].includes(viewType) && (
              <div className="space-y-0">
                {timelineSteps.map((step, idx) => (
                  <div key={idx} className="mb-[82px] last:mb-0">
                    <TimelineStep
                      title={step.title}
                      datetime={step.datetime}
                      isActive={step.isActive}
                      isLast={idx === timelineSteps.length - 1}
                      showLine={idx < timelineSteps.length - 1}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vertical Divider */}
          <div className="w-[2px] bg-[#DAE1E7]" />

          {/* Right Column - Communication with Member Bank */}
          <div className="flex-1 p-6 overflow-y-auto">
            <h2 className={`text-[20px] font-semibold mb-6 ${
              viewType === 'initial_intimation' ? 'text-[#AFAFAF]' : 'text-[#4C4C4C]'
            }`}>
              Communication with Member Bank
            </h2>

            {viewType === '3rd_reminder' && memberBankSteps.length > 0 && (
              <div className="space-y-4">
                {/* Bank nodes with hierarchical tree */}
                <div className="space-y-4">
                  <MemberBankNode
                    bankName="MCB"
                    isExpanded={expandedBanks.MCB}
                    onToggle={() => toggleBank('MCB')}
                    steps={[]}
                    isFirst={true}
                  />
                  <div className="ml-6">
                    <MemberBankNode
                      bankName="ABL"
                      isExpanded={expandedBanks.ABL}
                      onToggle={() => toggleBank('ABL')}
                      steps={[]}
                    />
                  </div>
                  <div className="ml-12">
                    <MemberBankNode
                      bankName="UBL"
                      isExpanded={expandedBanks.UBL}
                      onToggle={() => toggleBank('UBL')}
                      steps={memberBankSteps}
                    />
                  </div>
                </div>
              </div>
            )}

            {viewType !== '3rd_reminder' && viewType !== 'initial_intimation' && memberBankSteps.length > 0 && (
              <div className="space-y-4">
                {memberBankSteps.map((step, idx) => (
                  <div key={idx} className="mb-[82px] last:mb-0">
                    <TimelineStep
                      title={step.title}
                      datetime={step.datetime}
                      isActive={true}
                      isLast={idx === memberBankSteps.length - 1}
                      showLine={idx < memberBankSteps.length - 1}
                    />
                    {step.note && (
                      <p className="text-[10px] text-[#4C4C4C] font-medium ml-[52px] mt-1">{step.note}</p>
                    )}
                  </div>
                ))}
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
    </div>
  );
}

export default FTDHDetailPage;
