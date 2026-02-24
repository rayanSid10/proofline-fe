import { useEffect, useMemo, useState } from 'react';
import { Download, Plus, RotateCcw, UserRound, Building2, List, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

function SectionIcon({ children }) {
  return (
    <div className="h-[42px] w-[42px] rounded-full bg-[#2064B7] text-white flex items-center justify-center shrink-0">
      {children}
    </div>
  );
}

function Field({ label, value, subValue, bold = false }) {
  return (
    <div>
      <p className="text-[14px] text-[#AFAFAF] font-medium">{label}</p>
      <p className={`text-[17px] text-[#4C4C4C] leading-tight ${bold ? 'font-semibold' : 'font-medium'}`}>{value}</p>
      {subValue && <p className="text-[11px] text-[#4C4C4C] mt-1">{subValue}</p>}
    </div>
  );
}

const fmt = (v) => (v ? v : '—');

const briefForOnUs = (record) =>
  `Case ${record.caseId || 'FTDH'} has been reviewed. Transaction ${record.disputeId || '—'} (${record.amount || '—'}) is tagged as ${record.fundsStatus || '—'} under FTDH type OnUs. Account controls were applied and interbank communication has been initiated for closure within SLA.`;

const briefForLayer = (record) =>
  `Layering flow confirmed for case ${record.caseId || 'FTDH'}. Funds were traced onward to ${record.layeringBank || 'target bank'}, therefore Outward FTDH has been generated and shared with counterpart bank(s). Follow-up coordination is in progress with layering status marked for recovery tracking.`;

export function FTDHOutwardReportModal({ open, onOpenChange, record }) {
  const [generated, setGenerated] = useState(false);
  const [brief, setBrief] = useState('');

  const isLayer = record?.type === 'Layer';
  const title = isLayer ? 'Onward FTDH - Layer Report' : 'Onward FTDH - OnUs Report';

  useEffect(() => {
    if (open) {
      setGenerated(false);
      setBrief('');
    }
  }, [open]);

  const lastUpdated = useMemo(() => {
    const now = new Date();
    return now.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }, []);

  const handleGenerate = () => {
    const text = isLayer ? briefForLayer(record || {}) : briefForOnUs(record || {});
    setBrief(text);
    setGenerated(true);
    toast.success('Brief auto-generated from case data');
  };

  const handleRegen = () => {
    handleGenerate();
  };

  const handleDownload = () => {
    toast.success('Report downloaded successfully');
  };

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="!w-[min(1221px,calc(100vw-24px))] !max-w-[min(1221px,calc(100vw-24px))] max-h-[92vh] p-0 gap-0 rounded-2xl overflow-hidden border border-[#DAE1E7]"
      >
        <div className="h-[122px] bg-[#2064B7] px-12 py-5 relative">
          <button
            className="absolute right-6 top-4 text-white/90 hover:text-white"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
          <h2 className="text-[46px] sr-only">{title}</h2>
          <h2 className="text-[40px] leading-[1.1] text-white font-semibold">{title}</h2>
          <p className="text-[16px] text-white mt-1">Last updated: {lastUpdated}</p>
        </div>

        <div className="bg-[#F1F1F1] overflow-y-auto overflow-x-auto max-h-[calc(92vh-122px)] px-12 py-10">
          <div className="min-w-[1080px]">
          {isLayer ? (
            <section>
              <div className="flex items-center gap-4 mb-6">
                <SectionIcon><Building2 className="h-6 w-6" /></SectionIcon>
                <h3 className="text-[20px] text-[#2064B7] font-semibold">Sender Bank Details</h3>
              </div>
              <div className="grid grid-cols-3 gap-10 border-b border-[#DAE1E7] pb-6">
                <Field label="Bank Name" value={fmt(record.bankName)} />
                <Field label="Bank FTDH Dispute ID" value={fmt(record.bankFtdhDisputeId)} />
                <Field label="Bank FTDH receiving Date & Time" value={fmt(record.bankReceivingDateTime)} />
              </div>
            </section>
          ) : (
            <section>
              <div className="flex items-center gap-4 mb-6">
                <SectionIcon><UserRound className="h-6 w-6" /></SectionIcon>
                <h3 className="text-[20px] text-[#2064B7] font-semibold">Customer Details</h3>
              </div>
              <div className="grid grid-cols-3 gap-10 border-b border-[#DAE1E7] pb-6">
                <Field label="Account Number / CNIC" value={fmt(record.accountNo)} />
                <Field label="Customer Dispute Date & Time" value={fmt(record.customerDisputeDateTime)} />
                <Field label="E-Form/Complaint Number" value={fmt(record.complaintNo)} />
              </div>
            </section>
          )}

          <section className="mt-6">
            <div className="flex items-center gap-4 mb-6">
              <SectionIcon><List className="h-6 w-6" /></SectionIcon>
              <h3 className="text-[20px] text-[#2064B7] font-semibold">FTDH Details</h3>
            </div>

            <div className="grid grid-cols-[1.2fr_1fr_1fr_1.2fr_.7fr_1fr] gap-8 pb-6">
              <Field label="Dispute ID" value={fmt(record.disputeId)} />
              <Field label="Beneficiary" value={fmt(record.beneficiary)} subValue={fmt(record.beneficiaryAccount)} />
              <Field label="Sender" value={fmt(record.sender)} subValue={fmt(record.senderAccount)} />
              <Field label="Trx Date & Time" value={fmt(record.trxDateTime)} />
              <Field label="Stan" value={fmt(record.stan)} />
              <Field label="Trx Amount" value={fmt(record.amount)} bold />
            </div>

            <div className={`grid ${isLayer ? 'grid-cols-4' : 'grid-cols-3'} gap-8 pb-4`}>
              <Field label="FTDH Aging" value={fmt(record.aging)} />
              <Field label="Funds Status (FTDH Portal)" value={fmt(record.fundsStatus)} />
              <Field label="FTDH Type" value={fmt(record.type)} />
              {isLayer && <Field label="Layering Bank" value={fmt(record.layeringBank)} />}
            </div>
          </section>

          <section className="mt-3">
            <p className="text-[14px] text-[#AFAFAF] font-medium mb-3">Add Brief</p>

            {!generated ? (
              <div className="h-[108px] rounded-[14px] border-2 border-[#DAE1E7] bg-[#F9FAFB] px-4 py-3 text-[16px] text-[#AFAFAF]">
                Enter Comment
              </div>
            ) : (
              <>
                <p className="text-[16px] text-[#4C4C4C] leading-[1.45] px-4">{brief}</p>
                <div className="flex items-center gap-4 mt-2 px-4 text-[#4C4C4C]">
                  <button onClick={handleRegen} title="Regenerate brief">
                    <RotateCcw className="h-5 w-5" />
                  </button>
                  <button title="Add more text">
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </>
            )}

            <div className="mt-5">
              {!generated ? (
                <Button
                  onClick={handleGenerate}
                  className="h-[28px] rounded-[18px] px-8 text-[14px] bg-[#05AEE5] hover:bg-[#099ac9]"
                >
                  Generate
                </Button>
              ) : (
                <Button
                  onClick={handleDownload}
                  className="h-[33px] rounded-[18px] px-6 text-[14px] bg-[#2064B7] hover:bg-[#1A56A0]"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              )}
            </div>
          </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default FTDHOutwardReportModal;