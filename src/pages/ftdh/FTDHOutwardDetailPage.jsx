import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, List, UserRound, Building2, Loader2, Mail, MailCheck, MailX, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ftdhAPI } from '@/api/ftdh';
import { FTDHOutwardReportModal } from '@/components/modals/FTDHOutwardReportModal';
import { toast } from 'sonner';

const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const sec = String(d.getSeconds()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${sec}`;
};

const formatDateTimePretty = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dd = String(d.getDate()).padStart(2, '0');
  const mon = months[d.getMonth()];
  const yyyy = d.getFullYear();
  let hh = d.getHours();
  const min = String(d.getMinutes()).padStart(2, '0');
  const ampm = hh >= 12 ? 'PM' : 'AM';
  hh = hh % 12 || 12;
  return `${dd}-${mon}-${yyyy} ${String(hh).padStart(2, '0')}:${min} ${ampm}`;
};

const formatCurrency = (amount) => `PKR ${Number(amount || 0).toLocaleString('en-PK')}`;

const shortBank = (full) => full?.match(/\(([^)]+)\)/)?.[1] || full?.split(' ')?.[0] || '—';

function SectionIcon({ children }) {
  return (
    <div className="h-9 w-9 rounded-full bg-[#2064B7] text-white flex items-center justify-center">
      {children}
    </div>
  );
}

function Field({ label, value, subValue }) {
  return (
    <div>
      <p className="text-[14px] text-[#AFAFAF] font-medium">{label}</p>
      <p className="text-[19px] text-[#4C4C4C] font-medium leading-tight">{value ?? '—'}</p>
      {subValue && <p className="text-[10px] text-[#4C4C4C] mt-1">{subValue}</p>}
    </div>
  );
}

export function FTDHOutwardDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reportOpen, setReportOpen] = useState(false);
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mockResponseLoading, setMockResponseLoading] = useState(false);
  const [mockModalOpen, setMockModalOpen] = useState(false);

  const fetchCase = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ftdhAPI.getOutward(id);
      setCaseData(res.data);
    } catch (err) {
      console.error('Failed to load outward case:', err);
      setError('Failed to load outward case details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();
  }, [id]);

  const handleMockDecision = async (decision) => {
    try {
      setMockResponseLoading(true);
      await ftdhAPI.mockOutwardResponse(id, { decision });
      setMockModalOpen(false);
      toast.success(decision === 'ACCEPT' ? 'Member bank response accepted' : 'Member bank response rejected');
      fetchCase();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to submit mock response');
    } finally {
      setMockResponseLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-100px)] items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#2064B7] animate-spin mb-3" />
        <p className="text-[16px] text-[#AFAFAF]">Loading case...</p>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="flex flex-col h-[calc(100vh-100px)] items-center justify-center">
        <p className="text-[16px] text-red-500 mb-2">{error || 'Case not found'}</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/ftdh/outward')}>Back to list</Button>
      </div>
    );
  }

  const isLayer = caseData.ftdhType === 'LAYERING';
  const isOnUs = caseData.ftdhType === 'ONUS';
  const comm = caseData.communication || {};
  const stages = comm.stages || [];
  const currentStage = comm.currentStage;

  // Build report record shape for the report modal
  const reportRecord = {
    id: caseData.id,
    type: isLayer ? 'Layer' : 'OnUs',
    status: caseData.status || '—',
    parentInwardId: caseData.parentInwardId || '—',
    parentFtdhId: caseData.parentFtdhId || '—',
    onelinkDisputeId: caseData.onelinkDisputeId || '—',
    transactionChannel: caseData.transactionChannel || '—',
    transactionCurrency: caseData.transactionCurrency || '—',
    filedDatetime: formatDateTimePretty(caseData.filedDatetime),
    ftdhLogDatetime: formatDateTimePretty(caseData.ftdhLogDatetime),
    slaDeadline: formatDateTimePretty(caseData.slaDeadline),
    slaBreached: caseData.slaBreached ? 'Yes' : 'No',
    createdAt: formatDateTimePretty(caseData.createdAt),
    updatedAt: formatDateTimePretty(caseData.updatedAt),
    filedByName: caseData.filedByName || '—',
    accountNo: caseData.accountNumberCnic || '—',
    complaintNo: caseData.complaintNumber || '—',
    customerDisputeDateTime: formatDateTimePretty(caseData.customerDisputeDatetime),
    bankName: caseData.senderBank || '—',
    bankFtdhDisputeId: caseData.senderBankFtdhDisputeId || '—',
    bankReceivingDateTime: formatDateTimePretty(caseData.senderBankFtdhReceivedAt),
    disputeId: caseData.ftdhId || '—',
    beneficiary: caseData.targetBank || '—',
    beneficiaryAccount: caseData.targetAccount || '—',
    sender: caseData.senderBank || '—',
    senderAccount: caseData.senderAccount || '—',
    trxDateTime: formatDateTime(caseData.transactionDate),
    stan: caseData.stan || '—',
    amount: formatCurrency(caseData.transactionAmount),
    aging: caseData.ftdhAging != null ? String(caseData.ftdhAging).padStart(2, '0') : '—',
    fundsStatus: caseData.fundsStatus || '—',
    caseId: caseData.ftdhId,
    layeringBank: caseData.senderBank || '—',
    communication: caseData.communication || null,
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] font-['Inter',sans-serif]">
      <div className="flex-1 rounded-[15px] border-2 border-[#DAE1E7] bg-white overflow-hidden">
        <div className="h-[46px] bg-[#2064B7] px-3 flex items-center">
          <button
            onClick={() => navigate('/ftdh/outward')}
            className="text-white hover:opacity-90"
            title="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>

        <div className="h-[calc(100%-46px)] overflow-auto bg-white flex flex-col">
          <div className="p-6">
            <div className="space-y-7">
              {isOnUs ? (
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <SectionIcon><UserRound className="h-5 w-5" /></SectionIcon>
                    <h2 className="text-[20px] text-[#2064B7] font-semibold">Customer Details</h2>
                    <Button
                      className="ml-auto h-[28px] rounded-[18px] px-4 text-[12px] bg-[#05AEE5] hover:bg-[#099ac9]"
                      onClick={() => setReportOpen(true)}
                    >
                      Generate Report
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-8 border-b border-[#DAE1E7] pb-5">
                    <Field label="Account Number / CNIC" value={caseData.accountNumberCnic} />
                    <Field label="Customer Dispute Date & Time" value={formatDateTimePretty(caseData.customerDisputeDatetime)} />
                    <Field label="Complaint Number" value={caseData.complaintNumber} />
                  </div>
                </section>
              ) : (
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <SectionIcon><Building2 className="h-5 w-5" /></SectionIcon>
                    <h2 className="text-[20px] text-[#2064B7] font-semibold">Sender Bank Details</h2>
                    <Button
                      className="ml-auto h-[28px] rounded-[18px] px-4 text-[12px] bg-[#05AEE5] hover:bg-[#099ac9]"
                      onClick={() => setReportOpen(true)}
                    >
                      Generate Report
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-8 border-b border-[#DAE1E7] pb-5">
                    <Field label="Bank Name" value={caseData.senderBank} />
                    <Field label="Bank FTDH Dispute ID" value={caseData.senderBankFtdhDisputeId} />
                    <Field label="Bank FTDH Receiving Date & Time" value={formatDateTimePretty(caseData.senderBankFtdhReceivedAt)} />
                  </div>
                </section>
              )}

              <section>
                <div className="flex items-center gap-3 mb-4">
                  <SectionIcon><List className="h-5 w-5" /></SectionIcon>
                  <h2 className="text-[20px] text-[#2064B7] font-semibold">FTDH Details</h2>
                </div>

                <div className="grid grid-cols-[1.2fr_1fr_1fr_1.2fr_.7fr_1fr] gap-8 border-b border-[#DAE1E7] pb-5">
                  <Field label="Dispute ID" value={caseData.onelinkDisputeId || caseData.ftdhId} />
                  <Field label="Beneficiary" value={caseData.targetBank || '—'} subValue={caseData.targetAccount?.slice(0, 15)} />
                  <Field label="Sender" value={caseData.senderBank || '—'} subValue={caseData.senderAccount?.slice(0, 15)} />
                  <Field label="Trx Date & Time" value={formatDateTime(caseData.transactionDate)} />
                  <Field label="Stan" value={caseData.stan || '—'} />
                  <Field label="Trx Amount" value={formatCurrency(caseData.transactionAmount)} />
                </div>

                <div className="grid grid-cols-3 gap-8 pt-5">
                  <Field label="FTDH Aging" value={caseData.ftdhAging != null ? String(caseData.ftdhAging).padStart(2, '0') : '—'} />
                  {isOnUs && <Field label="Funds Status (FTDH Portal)" value={caseData.fundsStatus || '—'} />}
                  <Field label="FTDH Type" value={isLayer ? 'Layer' : 'OnUs'} />
                </div>
              </section>
            </div>
          </div>

          <div className="bg-[#F8F8F8] px-6 py-5 min-h-[280px] flex-1">
            {/* ─── Layering: Single Email Intimation ─── */}
            {isLayer && (
              <>
                <div className="mb-4">
                  <h3 className="text-[20px] text-[#4C4C4C] font-semibold">
                    Email History
                  </h3>
                </div>

                {!comm.started ? (
                  <p className="text-[14px] text-[#AFAFAF]">No emails sent yet.</p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-[#EFF6FF] text-[#2064B7]">
                        <MailCheck className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] text-[#4C4C4C] font-medium">
                          Email Sent
                        </p>
                        <div className="flex items-center gap-1 text-[#AFAFAF] mt-0.5">
                          <Clock className="h-3 w-3" />
                          <span className="text-[11px]">{formatDateTimePretty(comm.emailSentAt || comm.startedAt)}</span>
                        </div>
                        <p className="text-[13px] text-[#8C8C8C] mt-1">
                          To: <span className="font-medium text-[#4C4C4C]">{comm.initialSenderBank || 'Sender Bank'}</span>
                        </p>
                        <div className="mt-2.5 bg-[#F8FAFB] rounded-[8px] p-3 border border-[#EEF1F4]">
                          <p className="text-[13px] text-[#4C4C4C] leading-relaxed">
                            Funds credited to{' '}
                            <span className="font-semibold">{comm.senderBank || caseData.senderBank || 'Our Bank'}</span>
                            {' '}were further transferred to{' '}
                            <span className="font-semibold">{comm.targetBank || caseData.targetBank || 'Target Bank'}</span>.
                            {' '}Recovery should be pursued directly with{' '}
                            <span className="font-semibold">{comm.targetBank || caseData.targetBank || 'Target Bank'}</span>.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ─── OnUs: Communication Timeline (matches inward member bank style) ─── */}
            {isOnUs && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-[20px] font-semibold ${comm.started ? 'text-[#4C4C4C]' : 'text-[#AFAFAF]'}`}>
                    Communication with Member Bank
                  </h3>
                </div>

                {!comm.started ? (
                  <p className="text-[14px] text-[#AFAFAF]">Communication not yet started.</p>
                ) : (
                  <div className="space-y-0">
                    {stages.map((stg, idx) => {
                      const isLast = idx === stages.length - 1;
                      const hasDecision = !!stg.decision;
                      const isActive = isLast && !hasDecision && !comm.resolved;
                      const isAccepted = stg.decision === 'ACCEPT';
                      const isRejected = stg.decision === 'REJECT';
                      const useGradient = hasDecision;

                      return (
                        <div key={stg.stage + idx} className="relative flex items-start gap-4">
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
                              <div className="w-[38px] h-[38px] rounded-full border-[3px] border-[#2064B7] bg-white flex items-center justify-center">
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
                                {stg.label || stg.stage}
                              </p>
                              {isActive && (
                                <Button
                                  onClick={() => setMockModalOpen(true)}
                                  disabled={mockResponseLoading}
                                  className="h-[24px] px-3 text-[12px] font-medium bg-[#2064B7] hover:bg-[#2064B7]/90 text-white rounded-[18px] flex-shrink-0"
                                >
                                  Mock Communication
                                </Button>
                              )}
                            </div>
                            <p className="text-[10px] text-[#AFAFAF] font-medium mt-0.5">
                              {formatDateTimePretty(stg.sentAt)}
                            </p>
                            {isAccepted && (
                              <p className="text-[12px] text-[#4C4C4C] mt-1">
                                {stg.autoAccepted
                                  ? 'No response received from member bank. Case forwarded for FRMU review.'
                                  : 'Member bank acknowledged the fraud intimation. Funds held for recovery.'}
                              </p>
                            )}
                            {isRejected && (
                              <p className="text-[12px] text-[#4C4C4C] mt-1">
                                Member bank rejected the fraud intimation.
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <FTDHOutwardReportModal open={reportOpen} onOpenChange={setReportOpen} record={reportRecord} />

      {/* Mock Communication Modal (matches inward page) */}
      <Dialog open={mockModalOpen} onOpenChange={setMockModalOpen}>
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
              <p className="text-[13px] text-[#4C4C4C]">FTDH Inquiry: Confirmation Required</p>
            </div>
            <div>
              <p className="text-[11px] text-[#AFAFAF] mb-1">Body</p>
              <p className="text-[13px] text-[#4C4C4C] whitespace-pre-line">{`Dear FTDH Team,\n\nWe acknowledge receipt of your fraud inquiry for the referenced transaction.\nPlease review and proceed with decisioning for this mock communication flow.\n\nRegards,\nMember Bank Operations`}</p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => handleMockDecision('REJECT')}
              disabled={mockResponseLoading}
              className="border-[#C22E1F] text-[#C22E1F] hover:bg-[#FDECEC]"
            >
              Reject
            </Button>
            <Button
              onClick={() => handleMockDecision('ACCEPT')}
              disabled={mockResponseLoading}
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

export default FTDHOutwardDetailPage;
