import { useMemo, useState } from 'react';
import { Download, Eye, Plus, RotateCcw, UserRound, Building2, List, X } from 'lucide-react';
import jsPDF from 'jspdf';
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

const formatFileSafe = (value) =>
  String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

const briefForOnUs = (record) =>
  `Case ${record.caseId || 'FTDH'} has been reviewed. Transaction ${record.disputeId || '—'} (${record.amount || '—'}) is tagged as ${record.fundsStatus || '—'} under FTDH type OnUs. Account controls were applied and interbank communication has been initiated for closure within SLA.`;

const briefForLayer = (record) =>
  `Layering flow confirmed for case ${record.caseId || 'FTDH'}. Funds were traced onward to ${record.layeringBank || 'target bank'}, therefore Outward FTDH has been generated and shared with counterpart bank(s). Follow-up coordination is in progress with layering status marked for recovery tracking.`;

export function FTDHOutwardReportModal({ open, onOpenChange, record }) {
  const [generated, setGenerated] = useState(false);
  const [brief, setBrief] = useState('');

  const isLayer = record?.type === 'Layer';
  const title = isLayer ? 'Onward FTDH - Layer Report' : 'Onward FTDH - OnUs Report';

  const handleOpenChange = (nextOpen) => {
    if (nextOpen) {
      setGenerated(false);
      setBrief('');
    }
    onOpenChange(nextOpen);
  };

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

  const buildReportPdf = () => {
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 26;
      const contentWidth = pageWidth - margin * 2;
      let y = 104;

      const clampTextLines = (text, width, maxLines = 2) => {
        const lines = pdf.splitTextToSize(fmt(text), width);
        if (lines.length <= maxLines) return lines;
        const kept = lines.slice(0, maxLines);
        const last = kept[maxLines - 1];
        kept[maxLines - 1] = `${String(last).replace(/[\s.]+$/g, '')}…`;
        return kept;
      };

      const drawSectionIcon = (x, yPos, type) => {
        const r = 10;
        pdf.setFillColor(32, 100, 183);
        pdf.circle(x, yPos, r, 'F');
        pdf.setDrawColor(255, 255, 255);
        pdf.setLineWidth(1.3);

        if (type === 'person') {
          pdf.circle(x, yPos - 2.8, 2.6, 'S');
          pdf.line(x - 5.2, yPos + 3.8, x + 5.2, yPos + 3.8);
          pdf.line(x - 3.4, yPos + 3.8, x - 1.4, yPos + 1.1);
          pdf.line(x + 3.4, yPos + 3.8, x + 1.4, yPos + 1.1);
        } else if (type === 'bank') {
          pdf.line(x - 5.2, yPos - 2.4, x + 5.2, yPos - 2.4);
          pdf.line(x - 5, yPos - 2.4, x, yPos - 6.2);
          pdf.line(x, yPos - 6.2, x + 5, yPos - 2.4);
          pdf.line(x - 3.7, yPos - 2.2, x - 3.7, yPos + 4.8);
          pdf.line(x, yPos - 2.2, x, yPos + 4.8);
          pdf.line(x + 3.7, yPos - 2.2, x + 3.7, yPos + 4.8);
          pdf.line(x - 5.3, yPos + 4.8, x + 5.3, yPos + 4.8);
        } else if (type === 'list') {
          pdf.circle(x - 3.6, yPos - 3.8, 0.9, 'F');
          pdf.circle(x - 3.6, yPos, 0.9, 'F');
          pdf.circle(x - 3.6, yPos + 3.8, 0.9, 'F');
          pdf.line(x - 1.3, yPos - 3.8, x + 4.8, yPos - 3.8);
          pdf.line(x - 1.3, yPos, x + 4.8, yPos);
          pdf.line(x - 1.3, yPos + 3.8, x + 4.8, yPos + 3.8);
        } else {
          pdf.circle(x, yPos - 3.8, 1.2, 'F');
          pdf.line(x, yPos - 1.3, x, yPos + 4.9);
        }
      };

      const drawHeader = () => {
        pdf.setFillColor(32, 100, 183);
        pdf.rect(0, 0, pageWidth, 86, 'F');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(18);
        pdf.setTextColor(255, 255, 255);
        pdf.text(title, margin, 36);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10.2);
        pdf.text(`Generated: ${lastUpdated}`, margin, 56);
        pdf.text(`Case: ${fmt(record.caseId)}  |  Type: ${fmt(record.type)}  |  Status: ${fmt(record.status)}`, margin, 73);
      };

      const drawSummaryCard = (x, yPos, w, h, label, value, emphasize = false) => {
        pdf.setFillColor(246, 249, 253);
        pdf.setDrawColor(218, 225, 231);
        pdf.roundedRect(x, yPos, w, h, 9, 9, 'FD');
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(120, 120, 120);
        pdf.text(label, x + 10, yPos + 16);
        pdf.setFont('helvetica', emphasize ? 'bold' : 'normal');
        pdf.setFontSize(12);
        pdf.setTextColor(42, 42, 42);
        const lines = clampTextLines(value, w - 20, 1);
        pdf.text(lines, x + 10, yPos + 34);
      };

      const drawSectionTitle = (label, iconType) => {
        pdf.setFillColor(241, 246, 252);
        pdf.roundedRect(margin, y, contentWidth, 30, 8, 8, 'F');
        drawSectionIcon(margin + 15, y + 14, iconType);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11.4);
        pdf.setTextColor(32, 100, 183);
        pdf.text(label, margin + 32, y + 18);
        y += 40;
      };

      const drawCompactRows = (rows, columns = 2) => {
        const colGap = 14;
        const colWidth = (contentWidth - colGap) / columns;

        for (let i = 0; i < rows.length; i += columns) {
          const rowItems = rows.slice(i, i + columns);
          rowItems.forEach(([label, value], colIndex) => {
            const x = margin + colIndex * (colWidth + colGap);
            pdf.setFillColor(250, 250, 250);
            pdf.setDrawColor(236, 239, 242);
            pdf.roundedRect(x, y, colWidth, 38, 7, 7, 'FD');

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8.8);
            pdf.setTextColor(132, 132, 132);
            pdf.text(label, x + 10, y + 12);

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(10);
            pdf.setTextColor(66, 66, 66);
            const valueLines = clampTextLines(value, colWidth - 20, 2);
            pdf.text(valueLines, x + 10, y + 25);
          });
          y += 46;
        }

        y += 4;
      };

      const primaryRows = isLayer
        ? [
            ['Bank Name', record.bankName],
            ['Bank FTDH Dispute ID', record.bankFtdhDisputeId],
            ['Bank FTDH Receiving Dt/Time', record.bankReceivingDateTime],
          ]
        : [
            ['Account Number / CNIC', record.accountNo],
            ['Customer Dispute Dt/Time', record.customerDisputeDateTime],
            ['E-Form/Complaint Number', record.complaintNo],
          ];

      const detailRows = [
        ['Dispute ID', record.disputeId],
        ['Trx Date & Time', record.trxDateTime],
        ['Beneficiary', `${fmt(record.beneficiary)} (${fmt(record.beneficiaryAccount)})`],
        ['Sender', `${fmt(record.sender)} (${fmt(record.senderAccount)})`],
        ['Stan', record.stan],
        ['Trx Amount', record.amount],
        ['FTDH Aging', record.aging],
        ['Funds Status', record.fundsStatus],
        ['FTDH Type', record.type],
        ...(isLayer ? [['Layering Bank', record.layeringBank]] : []),
      ];

      const comm = record.communication || null;
      const importantRows = [
        ['OneLink Dispute ID', record.onelinkDisputeId],
        ['Transaction Channel', record.transactionChannel],
        ['SLA Deadline', record.slaDeadline],
        ['SLA Breached', record.slaBreached],
        ['Communication Stage', comm?.currentStageLabel || comm?.currentStage || '—'],
        ['Member Bank Decision', comm?.response?.decision || (comm?.resolved ? 'Resolved' : 'Pending')],
      ];

      drawHeader();

      const cardY = y;
      const cardGap = 12;
      const cardWidth = (contentWidth - cardGap * 3) / 4;
      drawSummaryCard(margin, cardY, cardWidth, 44, 'Case ID', record.caseId);
      drawSummaryCard(margin + cardWidth + cardGap, cardY, cardWidth, 44, 'Status', record.status);
      drawSummaryCard(margin + (cardWidth + cardGap) * 2, cardY, cardWidth, 44, 'Amount', record.amount, true);
      drawSummaryCard(margin + (cardWidth + cardGap) * 3, cardY, cardWidth, 44, 'Aging', record.aging);
      y += 62;

      drawSectionTitle(isLayer ? 'Sender Bank Details' : 'Customer Details', isLayer ? 'bank' : 'person');
      drawCompactRows(primaryRows, 2);

      drawSectionTitle('FTDH Details', 'list');
      drawCompactRows(detailRows, 2);

      drawSectionTitle('Important Case Information', 'info');
      drawCompactRows(importantRows, 2);

      const briefTitleY = y + 2;
      const briefTextY = briefTitleY + 12;
      const briefText = brief || (isLayer ? briefForLayer(record || {}) : briefForOnUs(record || {}));
      const briefLines = clampTextLines(briefText, contentWidth - 20, 4);
      const briefBoxHeight = 68;

      pdf.setFillColor(245, 248, 252);
      pdf.roundedRect(margin, briefTitleY, contentWidth, briefBoxHeight, 7, 7, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.setTextColor(32, 100, 183);
      pdf.text('Brief', margin + 8, briefTextY);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(76, 76, 76);
      pdf.setFontSize(9.3);
      pdf.text(briefLines, margin + 10, briefTextY + 13);

      pdf.setDrawColor(225, 231, 236);
      pdf.setLineWidth(0.8);
      pdf.line(margin, 812, pageWidth - margin, 812);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.4);
      pdf.setTextColor(122, 122, 122);
      pdf.text('ProofLine • FTDH Outward Report', margin, 824);

      const suffix = formatFileSafe(record?.disputeId || record?.caseId || 'report');
      const typePart = isLayer ? 'layer' : 'onus';
      const fileName = `outward-ftdh-${typePart}-${suffix}.pdf`;
      return { pdf, fileName };
  };

  const handlePreview = () => {
    try {
      const { pdf } = buildReportPdf();
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const previewTab = window.open(url, '_blank', 'noopener,noreferrer');

      if (!previewTab) {
        URL.revokeObjectURL(url);
        toast.error('Preview popup was blocked by browser');
        return;
      }

      setTimeout(() => URL.revokeObjectURL(url), 60000);
      toast.success('Report preview opened');
    } catch {
      toast.error('Unable to preview report PDF');
    }
  };

  const handleDownload = () => {
    try {
      const { pdf, fileName } = buildReportPdf();
      pdf.save(fileName);
      toast.success('Report downloaded successfully');
    } catch {
      toast.error('Unable to generate report PDF');
    }
  };

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="!w-[min(1221px,calc(100vw-24px))] !max-w-[min(1221px,calc(100vw-24px))] max-h-[92vh] p-0 gap-0 rounded-2xl overflow-hidden border border-[#DAE1E7]"
      >
        <div className="h-[122px] bg-[#2064B7] px-12 py-5 relative">
          <button
            className="absolute right-6 top-4 text-white/90 hover:text-white"
            onClick={() => handleOpenChange(false)}
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
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handlePreview}
                    variant="outline"
                    className="h-[33px] rounded-[18px] px-5 text-[14px] border-[#2064B7] text-[#2064B7] hover:bg-[#EAF2FC]"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Report
                  </Button>
                  <Button
                    onClick={handleDownload}
                    className="h-[33px] rounded-[18px] px-6 text-[14px] bg-[#2064B7] hover:bg-[#1A56A0]"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </Button>
                </div>
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