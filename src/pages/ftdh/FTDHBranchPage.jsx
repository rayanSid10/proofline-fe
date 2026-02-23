import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Upload,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  MOCK_FTDH_CASES,
  formatDateTime,
  formatAmount,
} from '@/data/mockFTDH';
import { FTDHCaseUpdateModal } from '@/components/modals/FTDHCaseUpdateModal';
import { FTDHReportModal } from '@/components/modals/FTDHReportModal';
import { SubmissionProgressBar } from '@/components/modals/SubmissionProgressBar';

const PAGE_SIZE = 10;

// Status tag config
const stateTagStyles = {
  not_started: { label: 'New', bg: '#EBF5FF', text: '#2592FF', border: '#2592FF' },
  initial_sent_waiting: { label: 'Initial Intimation Sent', bg: '#EBF5FF', text: '#2592FF', border: '#2592FF' },
  '1st_reminder_sent_waiting': { label: '1st Reminder Sent', bg: '#FFF4E5', text: '#F59E0B', border: '#F59E0B' },
  '2nd_reminder_sent_waiting': { label: '2nd Reminder Sent', bg: '#FFF0E5', text: '#F97316', border: '#F97316' },
  '3rd_reminder_sent_waiting': { label: '3rd Reminder Sent', bg: '#FEE2E2', text: '#EF4444', border: '#EF4444' },
  business_consideration: { label: 'Business Consideration', bg: '#F3E8FF', text: '#8B5CF6', border: '#8B5CF6' },
  stance_received: { label: 'Reviewed by Branch', bg: '#E8F8EF', text: '#22C55E', border: '#22C55E' },
  feedback_received: { label: 'Feedback Received', bg: '#E8F8EF', text: '#22C55E', border: '#22C55E' },
  mis_updated: { label: 'MIS Updated', bg: '#EDE9FE', text: '#7C3AED', border: '#7C3AED' },
};

function getCaseStatusTag(caseItem) {
  const branchState = caseItem.branchCommunication?.branchCommunicationState || 'not_started';
  return stateTagStyles[branchState] || stateTagStyles.not_started;
}

// Empty state SVG icon
const EmptyStateIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="230" height="230" viewBox="0 0 230 230" fill="none">
    <path d="M130.339 201.978L182.666 171.767C188.252 168.542 191.04 166.929 193.071 164.673C194.868 162.677 196.227 160.326 197.057 157.772C197.993 154.891 197.993 151.672 197.993 145.252V84.7418C197.993 78.3219 197.993 75.1034 197.057 72.2231C196.227 69.6685 194.868 67.3155 193.071 65.3194C191.049 63.0732 188.267 61.4674 182.729 58.2702L130.33 28.0171C124.744 24.7921 121.956 23.1828 118.987 22.5517C116.36 21.9932 113.643 21.9932 111.016 22.5517C108.047 23.1828 105.25 24.7921 99.6639 28.0171L47.3266 58.2341C41.7472 61.4554 38.9596 63.0647 36.9295 65.3194C35.1322 67.3155 33.7749 69.6685 32.9449 72.2231C32.0068 75.1102 32.0068 78.337 32.0068 84.7872V145.21C32.0068 151.66 32.0068 154.884 32.9449 157.772C33.7749 160.326 35.1322 162.677 36.9295 164.673C38.9608 166.929 41.7504 168.542 47.3364 171.767L99.6639 201.978C105.25 205.203 108.047 206.813 111.016 207.445C113.643 208.003 116.36 208.003 118.987 207.445C121.956 206.813 124.753 205.203 130.339 201.978Z" stroke="#4C4C4C" strokeWidth="9.78723" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M86.25 114.997C86.25 130.875 99.1218 143.747 115 143.747C130.878 143.747 143.75 130.875 143.75 114.997C143.75 99.1189 130.878 86.2471 115 86.2471C99.1218 86.2471 86.25 99.1189 86.25 114.997Z" stroke="#4C4C4C" strokeWidth="9.78723" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export function FTDHBranchPage({ currentRole = 'branch_user' }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedRows, setSelectedRows] = useState([]);
  const [page, setPage] = useState(0);

  // Update Modal
  const [selectedCase, setSelectedCase] = useState(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);

  // Report Modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportCaseData, setReportCaseData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(1);

  // Handle Generate Report (reusing logic from FTDHInwardPage)
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

  // Filter cases: For branch users, we might want to start with an empty set if no search,
  // but let's emulate the mock behavior first. As per Figma, we want to show the empty state
  // "once searched", but if the user wants it to look like the design initially, we can leave 
  // filteredCases empty until a search happens, OR filter all if needed. 
  // Let's assume for this mock that if there's no search query, we show empty state matching the Figma.
  const filteredCases = useMemo(() => {
    // Branch user should only see cases where initialIntimationSent is true
    const branchCases = MOCK_FTDH_CASES.filter(c => c.branchCommunication?.initialIntimationSent);
    
    if (!searchQuery.trim()) {
      return branchCases; // Show all available branch cases (for now, to match design/requirement we'll just show them, but we could return [] if we strictly wanted empty state before search)
    }
    
    return branchCases.filter((c) => {
      const query = searchQuery.toLowerCase();
      return (
        c.initialData.disputeId?.toLowerCase().includes(query) ||
        c.initialData.senderAccount?.toLowerCase().includes(query) ||
        c.initialData.beneficiaryAccount?.toLowerCase().includes(query)
      );
    });
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredCases.length / PAGE_SIZE));
  const pagedCases = filteredCases.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleOpenCase = useCallback((caseItem) => {
    navigate(`/ftdh-branch/${caseItem.id}`);
  }, [navigate]);

  const handleCaseUpdated = useCallback((updatedCase) => {
    setUpdateModalOpen(false);
    setSelectedCase(null);
    console.log('Case updated:', updatedCase);
  }, []);

  const handleToggleAll = () => {
    if (selectedRows.length === pagedCases.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(pagedCases.map((c) => c.disputeId));
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] font-['Inter',sans-serif]">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[28px] font-semibold text-gray-900 leading-tight">
              Inward FTDH
            </h1>
          </div>
        </div>
      </div>

      {/* Search + Filters Row */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by Account number, IBAN"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 text-[16px] border-[#EDF1F4] placeholder:text-[#AFAFAF] text-[#4C4C4C] bg-white rounded-[10px]"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#EEF6FF] rounded-lg overflow-hidden border border-[#DAE1E7]">
        {filteredCases.length === 0 ? (
          // Empty State - Left Aligned Design
          <div className="flex flex-1 flex-col items-start justify-center pl-16 py-16 bg-white overflow-hidden">
            <div className="text-gray-400 mb-6 scale-90 origin-left">
              <EmptyStateIcon />
            </div>
            <h3 className="text-[24px] font-semibold text-[#4C4C4C] mb-2 font-['Inter',sans-serif]">
              No disputes yet
            </h3>
            <p className="text-[16px] font-medium text-[#4C4C4C] max-w-[460px] leading-[1.56] font-['Inter',sans-serif]">
              Inward FTDH record or complaint investigations will appear here once searched.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 bg-white overflow-hidden">
            {/* Table toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={pagedCases.length > 0 && selectedRows.length === pagedCases.length}
                  onCheckedChange={handleToggleAll}
                  disabled={pagedCases.length === 0}
                />
                <button
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  title="Delete selected"
                  disabled={selectedRows.length === 0}
                >
                  <Trash2 className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4 text-gray-500" />
                </button>
                <button
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Scrollable table area */}
            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-white hover:bg-white border-b border-gray-100">
                    <TableHead className="text-xs text-[#AFAFAF] font-medium pl-4">Dispute ID</TableHead>
                    <TableHead className="text-xs text-[#AFAFAF] font-medium">Sender</TableHead>
                    <TableHead className="text-xs text-[#AFAFAF] font-medium">Beneficiary</TableHead>
                    <TableHead className="text-xs text-[#AFAFAF] font-medium">Sender Account</TableHead>
                    <TableHead className="text-xs text-[#AFAFAF] font-medium">Trx Date</TableHead>
                    <TableHead className="text-xs text-[#AFAFAF] font-medium">Trx Time</TableHead>
                    <TableHead className="text-xs text-[#AFAFAF] font-medium">Stan</TableHead>
                    <TableHead className="text-xs text-[#AFAFAF] font-medium">Trx Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedCases.map((caseItem) => {
                    const init = caseItem.initialData;
                    
                    // Split date and time for formatting
                    let dateStr = '—';
                    let timeStr = '—';
                    if (init.transactionDateTime) {
                      const d = new Date(init.transactionDateTime);
                      dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                      timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
                    }
                    
                    return (
                      <TableRow
                        key={caseItem.disputeId}
                        className="cursor-pointer hover:bg-gray-50 border-b border-gray-100 transition-colors"
                        onClick={() => handleOpenCase(caseItem)}
                      >
                        <TableCell className="py-3.5 pl-4">
                          <div className="text-sm font-medium text-gray-900">
                            {init.disputeId?.replace('FTDH-INW-', 'IBFT-') || init.disputeId}
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5">
                          <div className="text-sm text-gray-900">
                            {init.sendingBank?.split('(')[1]?.replace(')', '') || init.sendingBank?.split(' ')[0] || '—'}
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5">
                          <div className="text-sm text-gray-900">
                            {init.receivingBank?.split('(')[1]?.replace(')', '') || init.receivingBank?.split(' ')[0] || '—'}
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5 text-sm text-gray-900 font-mono">
                          {init.senderAccount || '—'}
                        </TableCell>
                        <TableCell className="py-3.5 text-sm text-gray-900 whitespace-nowrap">
                          {dateStr}
                        </TableCell>
                        <TableCell className="py-3.5 text-sm text-gray-900 font-mono">
                          {timeStr}
                        </TableCell>
                        <TableCell className="py-3.5 text-sm text-gray-900 font-mono">
                          {init.stan || '—'}
                        </TableCell>
                        <TableCell className="py-3.5 text-sm text-[#05AEE5] font-semibold whitespace-nowrap">
                          {init.amount ? formatAmount(init.amount) : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Page Footer */}
      <div className="flex items-center justify-between text-[16px] text-gray-400 pt-4 shrink-0 font-['Inter',sans-serif]">
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
        caseData={selectedCase}
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

export default FTDHBranchPage;
