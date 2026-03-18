import { useRef, useCallback, useState } from 'react';
import { X, FileText, ExternalLink, Download, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

/**
 * Format a number with commas (no currency symbol).
 * e.g. 50000 → "50,000"
 */
function formatAmountPlain(amount) {
  if (!amount && amount !== 0) return '';
  return new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── ICONS ───────────────────────────────────────────────────────────────────

const BlueCircleIcon = ({ children }) => (
  <div className="w-8 h-8 rounded-full bg-[#2064B7] flex items-center justify-center shrink-0">
    {children}
  </div>
);

// 1. IO Icon (Outline, no circle)
const IOIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#2064B7]">
    <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// 2. Fraud Details (User with alert/badge)
const FraudIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
    <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="19" cy="5" r="3" fill="#2064B7" stroke="white" strokeWidth="1.5"/>
    <path d="M19 4V6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M19 6.5V6.51" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// 3. Case Background (Document)
const BackgroundIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 13H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 17H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// 4. Case Findings (Detective/Spy)
const FindingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 21V19C6 16.7909 8.23858 15 11 15H13C15.7614 15 18 16.7909 18 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.5 9.5L5.5 11.5L8.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15.5 9.5L18.5 11.5L21.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// 5. Customer Profile (Eye/Search)
const ProfileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11 8C12.6569 8 14 9.34315 14 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// 6. Conclusion (Chat/Comment)
const ConclusionIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
    <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 8H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 12H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// 7. Annx (File)
const AnnxIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
    <path d="M14.5 2H6C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V6.5L14.5 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 2V6H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="8" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="8" y1="17" x2="16" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="8" y1="9" x2="10" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);


// ─── Detail Row (for IO / Fraud tables) ──────────────────────────────────────

function DetailRow({ label, value, isLast = false }) {
  return (
    <div className={`flex items-start py-2 ${!isLast ? 'border-b border-[#F0F0F0]' : ''}`}>
      <span className="text-[12px] text-[#8e95a1] w-[200px] shrink-0 font-normal">{label}</span>
      <span className="text-[12px] text-[#111827] font-medium flex-1 text-right">{value || '—'}</span>
    </div>
  );
}

// ─── Bullet List ─────────────────────────────────────────────────────────────

function BulletList({ items }) {
  return (
    <ul className="space-y-1.5 ml-1">
      {items.map((item, idx) => (
        <li key={idx} className="flex gap-2.5 text-[12px] text-[#374151] leading-relaxed">
          <span className="text-[#6B7280] mt-[5px] w-1 h-1 rounded-full bg-[#6B7280] shrink-0"></span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────

function SectionHeader({ icon, title, isMain = true }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      {isMain ? (
        <BlueCircleIcon>{icon}</BlueCircleIcon>
      ) : (
        <div className="w-8 flex items-center justify-center">{icon}</div>
      )}
      <h3 className={`text-[13px] font-bold text-[#1F2937] ${isMain ? 'uppercase tracking-wide' : 'capitalize'}`}>
        {title}
      </h3>
      {/* Dashed line filler */}
      <div className="flex-1 h-px border-b border-dashed border-[#E5E7EB] mt-1 ml-2"></div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function maskAccount(acc) {
  if (!acc) return '—';
  if (acc.length > 8) return acc.substring(0, 6) + '********';
  return acc;
}

function formatNow() {
  const now = new Date();
  return now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function generateCaseBackground(init, act, bc) {
  const items = [];
  items.push(
    `The case was received from FTDH (Fraud Transaction Data Hub) regarding an inward transaction. Upon receipt, the case was taken up for investigation.`
  );
  if (act.actionTaken === 'Acknowledge') {
    items.push(`The case was acknowledged${act.acknowledgeDate ? ` on ${formatDate(act.acknowledgeDate)}` : ''} and investigation was initiated.`);
  } else if (act.actionTaken === 'Invalid') {
    items.push(`The case was marked as Invalid${act.invalidReason ? `: ${act.invalidReason}` : ''}.`);
  }
  if (bc.initialIntimationSent) {
    items.push(`Initial intimation was sent to the branch${bc.initialIntimationDate ? ` on ${formatDate(bc.initialIntimationDate)}` : ''}.`);
  }
  return items;
}

function generateCaseFindings(init, act, bc, mb) {
  const items = [];
  items.push(
    `The customer was credited against the inward activity, which was reported as fraudulent by the sender bank${init.sendingBank ? ` (${init.sendingBank.split('(')[0]?.trim()})` : ''}.`
  );
  if (act.fundsStatus === 'SF') {
    items.push(`Sufficient funds are available in the beneficiary customer account.`);
  } else if (act.fundsStatus === 'NSF') {
    items.push(`The funds are not fully available in the beneficiary customer account (Non-Sufficient Funds).`);
  }
  if (act.fundsOnHold != null && act.fundsOnHold > 0) {
    items.push(`An amount of PKR ${formatAmountPlain(act.fundsOnHold)} is currently on hold.`);
  }
  if (act.lienMarked === true) {
    items.push(`Lien has been marked on the disputed amount${act.lienMarkDate ? ` on ${formatDate(act.lienMarkDate)}` : ''}.`);
  } else if (act.lienMarked === false) {
    items.push(`No lien has been marked on the account.`);
  }
  if (act.channelBlockingDate) {
    items.push(`Channels were blocked on ${formatDate(act.channelBlockingDate)}.`);
  }
  if (act.fundsLayering === true) {
    items.push(`Funds layering has been detected${act.fundsLayeringDate ? ` on ${formatDate(act.fundsLayeringDate)}` : ''}${act.fundsLayeringId ? ` (Layering ID: ${act.fundsLayeringId})` : ''}.`);
  } else if (act.fundsLayering === false) {
    items.push(`No funds layering was detected.`);
  }
  // Branch communication findings
  if (bc.branchResponseDecision === 'ACCEPT') {
    items.push(`Branch response was reviewed and accepted${bc.branchResponseReviewedAt ? ` on ${formatDate(bc.branchResponseReviewedAt)}` : ''}.`);
  } else if (bc.branchResponseDecision === 'REJECT') {
    items.push(`Branch response was reviewed and rejected${bc.branchResponseDecisionRemarks ? ` — ${bc.branchResponseDecisionRemarks}` : ''}.`);
  }
  // Branch response details (customer stance)
  const branchResp = bc.branchResponse || {};
  if (branchResp.customerAdmitsTransaction === true) {
    items.push(`The customer admits the transaction.`);
  } else if (branchResp.customerAdmitsTransaction === false) {
    items.push(`The customer denies the transaction.`);
  }
  if (branchResp.customerStatement) {
    items.push(`Customer statement: "${branchResp.customerStatement}".`);
  }
  // Member bank feedback
  if (mb.resolved && mb.resolvedMessage) {
    items.push(`Member bank communication outcome: ${mb.resolvedMessage}`);
  } else if (mb.acceptedBank) {
    items.push(`Member bank communication: Accepted by ${mb.acceptedBank}.`);
  }
  items.push(
    `The unit requests that complete findings related to the reported FTDH with fraud type and modus operandi (method of operation) be shared.`
  );
  return items;
}

function generateProfileReview(ca, act) {
  const items = [];
  if (ca.profileReview === 'Yes') {
    items.push(`Customer profile review was conducted.`);
  } else if (ca.profileReview === 'No') {
    items.push(`Customer profile review was not conducted.`);
  }
  if (ca.accountOpeningDate) {
    items.push(`The customer account was opened on ${ca.accountOpeningDate}${ca.accountType ? ` as a ${ca.accountType} account` : ''}.`);
  }
  if (ca.accountActivity) {
    items.push(`Customer account activity status: ${ca.accountActivity}.`);
  }
  if (ca.highlighted === 'Yes') {
    items.push(`The account has been highlighted previously${ca.referenceFtdhId ? ` (Reference FTDH ID: ${ca.referenceFtdhId})` : ''}.`);
  } else if (ca.highlighted === 'No') {
    items.push(`The account has not been highlighted previously.`);
  }
  if (ca.finalDecision) {
    items.push(`Channel activation decision: ${ca.finalDecision}${ca.decisionDate ? ` (${formatDate(ca.decisionDate)})` : ''}.`);
  }
  if (ca.decisionRationale) {
    items.push(`Decision rationale: ${ca.decisionRationale}.`);
  }
  if (items.length === 0) {
    items.push(`The matter was taken up with the customer for profile review. Further banking service integration is pending.`);
  }
  return items;
}

function generateConclusion(act, bc, mb, ca) {
  const items = [];
  if (act.lienMarked === true) {
    items.push(`The disputed amount is marked under LIEN.`);
  }
  if (act.fundsStatus === 'SF') {
    items.push(`Sufficient funds are available in the beneficiary account.`);
  } else if (act.fundsStatus === 'NSF') {
    items.push(`Funds are not fully available (Non-Sufficient Funds) in the beneficiary account.`);
  }
  if (act.fundsOnHold != null && act.fundsOnHold > 0) {
    items.push(`PKR ${formatAmountPlain(act.fundsOnHold)} is being held as lien amount.`);
  }
  if (act.fundsLayering === true) {
    items.push(`Funds layering was detected and outward FTDH has been initiated${act.fundsLayeringId ? ` (${act.fundsLayeringId})` : ''}.`);
  }
  if (bc.branchResponseDecision === 'ACCEPT') {
    items.push(`Branch stance has been reviewed and accepted.`);
  }
  if (mb.resolved && mb.acceptedBank) {
    items.push(`Member bank (${mb.acceptedBank}) has responded and communication is resolved.`);
  }
  if (ca.finalDecision === 'ADC Channel Activated') {
    items.push(`ADC channels have been activated.`);
  } else if (ca.finalDecision === 'Not Activated') {
    items.push(`ADC channels were not activated.`);
  }
  if (items.length === 0) {
    items.push(`The case is under review and appropriate action will be taken.`);
  }
  return items;
}

/**
 * Collect all attachment files from branchCommunication stageData and branchResponse.
 */
function collectAttachments(bc) {
  const files = [];
  const seen = new Set();

  // Collect from stageData (each stage's attachments)
  const stageData = bc.stageData || {};
  for (const stageKey of ['initial', 'reminder_1', 'reminder_2', 'reminder_3', 'business_consideration']) {
    const stage = stageData[stageKey];
    if (stage && Array.isArray(stage.attachments)) {
      for (const att of stage.attachments) {
        const key = att.id || att.file_url || att.original_name;
        if (!seen.has(key)) {
          seen.add(key);
          files.push({ name: att.original_name || 'attachment', url: att.file_url || '#' });
        }
      }
    }
  }

  // Collect from branchResponse documentsUploaded
  const brDocs = bc.branchResponse?.documentsUploaded || [];
  for (const att of brDocs) {
    const key = att.id || att.file_url || att.original_name;
    if (!seen.has(key)) {
      seen.add(key);
      files.push({ name: att.original_name || 'attachment', url: att.file_url || '#' });
    }
  }

  // Collect from response history
  const history = bc.responseHistory || [];
  for (const resp of history) {
    const docs = resp.data?.documentsUploaded || [];
    for (const att of docs) {
      const key = att.id || att.file_url || att.original_name;
      if (!seen.has(key)) {
        seen.add(key);
        files.push({ name: att.original_name || 'attachment', url: att.file_url || '#' });
      }
    }
  }

  return files;
}


// ─── Main Component ──────────────────────────────────────────────────────────

export function FTDHReportModal({ open, onOpenChange, caseData }) {
  const init = caseData?.initialData || {};
  const act = caseData?.actionsTaken || {};
  const ca = caseData?.channelActivation || {};
  const bc = caseData?.branchCommunication || {};
  const mb = caseData?.memberBankCommunication || {};

  const today = formatNow();

  // ── Collect all real attachment files from branch communication stage data ──
  const attachmentFiles = collectAttachments(bc);

  const reportRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = useCallback(async () => {
    const el = reportRef.current;
    if (!el) {
      console.error('reportRef is null');
      return;
    }
    setDownloading(true);
    try {
      // Clone entire report out of the dialog into document.body
      // so no parent overflow/max-height clips the capture.
      const clone = el.cloneNode(true);
      clone.querySelectorAll('[data-pdf-hide]').forEach(btn => btn.remove());

      const width = el.offsetWidth;
      Object.assign(clone.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: width + 'px',
        overflow: 'visible',
        maxHeight: 'none',
        height: 'auto',
        zIndex: '99999',
        pointerEvents: 'none',
        // Move off-screen vertically so user doesn't see a flash
        transform: 'translateY(-200vh)',
      });

      // Expand the scrollable body area in the clone
      const cloneBody = clone.querySelector('[data-report-body]');
      if (cloneBody) {
        Object.assign(cloneBody.style, {
          overflow: 'visible',
          maxHeight: 'none',
          height: 'auto',
          flex: 'none',
        });
      }

      document.body.appendChild(clone);

      // Small delay to let browser layout the clone
      await new Promise(r => setTimeout(r, 100));

      const dataUrl = await toPng(clone, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#ffffff',
        width: width,
        height: clone.scrollHeight,
        style: {
          transform: 'none',
        },
      });

      document.body.removeChild(clone);

      // Build PDF from the captured image
      const img = new Image();
      img.src = dataUrl;
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });

      const pdfWidth = 595.28; // A4 width in pt
      const pdfMargin = 20;
      const contentWidth = pdfWidth - pdfMargin * 2;
      const scale = contentWidth / img.width;
      const contentHeight = img.height * scale;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: [pdfWidth, contentHeight + pdfMargin * 2],
      });

      pdf.addImage(dataUrl, 'PNG', pdfMargin, pdfMargin, contentWidth, contentHeight);
      pdf.save(`Investigation_Report_${init.disputeId || 'FTDH'}.pdf`);
      onOpenChange(false);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('PDF download failed: ' + err.message);
    } finally {
      setDownloading(false);
    }
  }, [init.disputeId, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[95vw] max-h-[92vh] p-0 gap-0 rounded-2xl overflow-hidden flex flex-col border-2 border-[#D5E6FB]"
        style={{ maxWidth: '1000px' }}
      >
        <VisuallyHidden.Root asChild>
          <DialogTitle>Investigation Report</DialogTitle>
        </VisuallyHidden.Root>
        <div ref={reportRef} className="flex flex-col flex-1 overflow-hidden min-h-0">
        {/* ═══ HEADER — Blue background ═══ */}
        <div className="relative bg-[#2064B7] shrink-0 rounded-t-2xl">
          <div className="absolute left-0 top-0 bottom-0 w-[6px] bg-[#1a4f96] rounded-tl-2xl" />
          <div className="pl-7 pr-6 py-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[20px] font-bold text-white tracking-wide">INVESTIGATION REPORT</h2>
                <p className="text-[10px] text-blue-200 mt-0.5">Last updated: {today}</p>
                <div className="flex items-center gap-2 mt-2.5">
                  <span className="text-[10px] text-blue-200">Case Reference No:</span>
                  <span className="bg-white text-[#2064B7] text-[11px] font-bold px-3 py-0.5 rounded">
                    {init.disputeId || 'FTDH-2025-0421'}
                  </span>
                  <span className="bg-[#1a4f96] text-white text-[10px] font-bold px-3 py-0.5 rounded-full border border-blue-400">
                    FTDH
                  </span>
                </div>
                <p className="text-[12px] text-blue-100 font-medium mt-1.5">
                  PKR {init.amount ? formatAmountPlain(init.amount) : '50,000'}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-right mt-1">
                  <span className="text-[22px] font-bold text-white tracking-tight">Proof</span>
                  <span className="text-[22px] font-bold text-blue-200 tracking-tight">Line</span>
                </div>
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  data-pdf-hide
                  className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-white/80 hover:text-white disabled:opacity-50"
                  title="Download PDF"
                >
                  {downloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => onOpenChange(false)}
                  data-pdf-hide
                  className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-white/80 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ BODY ═══ */}
        <div data-report-body className="flex-1 overflow-y-auto min-h-0 bg-white">
          <div className="text-center py-4 mx-8 border-b border-[#E5E7EB]">
            <p className="text-[13px] font-semibold text-[#1F2937]">Confidential</p>
            <p className="text-[11px] text-[#6B7280] italic mt-0.5">
              (And "Legal Privilege - Prepared in Contemplation of Proceedings", if Applicable)
            </p>
          </div>

          <div className="px-8 pt-6 pb-8">
            
            {/* 1. Investigation Officer (Special style: no blue circle) */}
            <div className="mb-8">
              <SectionHeader icon={<IOIcon />} title="Investigation Officer" isMain={false} />
              <div className="border border-[#E5E7EB] rounded-lg px-5 bg-white">
                <DetailRow label="IO Name" value="Muhammad Waseem" />
                <DetailRow label="IO Position" value="Analyst Investigation" />
                <DetailRow label="IO Region" value="Central & North" />
                <DetailRow label="Report Prepared Date" value={today} isLast />
              </div>
            </div>

            {/* 2. Fraud Details */}
            <div className="mb-8">
              <SectionHeader icon={<FraudIcon />} title="Fraud Details" />
              <div className="border border-[#E5E7EB] rounded-lg px-5 bg-white">
                <DetailRow label="Dispute ID" value={init.disputeId} />
                <DetailRow label="Sender Bank" value={init.sendingBank?.split('(')[0]?.trim()} />
                <DetailRow label="Beneficiary Bank" value={init.receivingBank} />
                <DetailRow label="Sender Account #" value={init.senderAccount} />
                <DetailRow label="Beneficiary Account #" value={maskAccount(init.beneficiaryAccount)} />
                <DetailRow label="Channel" value={init.channel} />
                <DetailRow label="Transaction Date" value={formatDate(init.transactionDateTime)} />
                <DetailRow label="Transaction Time" value={formatTime(init.transactionDateTime)} />
                <DetailRow label="Stan" value={init.stan} />
                <DetailRow label="Transaction Amount" value={init.amount ? `PKR ${formatAmountPlain(init.amount)}` : '—'} isLast />
              </div>
            </div>

            {/* 3. Case Background */}
            <div className="mb-8">
              <SectionHeader icon={<BackgroundIcon />} title="Case Background" />
              <BulletList items={generateCaseBackground(init, act, bc)} />
            </div>

            {/* 4. Case Findings */}
            <div className="mb-8">
              <SectionHeader icon={<FindingsIcon />} title="Case Findings" />
              <BulletList items={generateCaseFindings(init, act, bc, mb)} />
            </div>

            {/* 5. Customer Profile Review */}
            <div className="mb-8">
              <SectionHeader icon={<ProfileIcon />} title="Customer Profile Review" />
              <BulletList items={generateProfileReview(ca, act)} />
            </div>

            {/* 6. Conclusion */}
            <div className="mb-8">
              <SectionHeader icon={<ConclusionIcon />} title="Conclusion" />
              <BulletList items={generateConclusion(act, bc, mb, ca)} />
            </div>

            {/* 7. Annx */}
            <div className="mb-4">
              <SectionHeader icon={<AnnxIcon />} title="Annx" />
              {attachmentFiles.length > 0 ? (
                <div className="flex items-center gap-3 flex-wrap">
                  {attachmentFiles.map((file, idx) => {
                    const ext = (file.name || '').split('.').pop()?.toUpperCase() || 'FILE';
                    const color = ext === 'PDF' ? '#E21F0B' : ext === 'DOCX' ? '#2064B7' : ext === 'PNG' || ext === 'JPG' || ext === 'JPEG' ? '#16A34A' : '#6B7280';
                    return (
                      <a
                        key={idx}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-white border border-[#DAE1E7] rounded-full px-4 py-2 hover:bg-gray-50 transition-colors cursor-pointer"
                        title={`Open ${file.name}`}
                      >
                        <div className="relative">
                          <FileText className="w-5 h-5 text-[#AFAFAF]" />
                          <span className="absolute -bottom-0.5 -left-0.5 text-white text-[6px] px-0.5 rounded" style={{ backgroundColor: color }}>
                            {ext}
                          </span>
                        </div>
                        <span className="text-[12px] font-medium text-[#374151]">{file.name}</span>
                        <ExternalLink className="w-3 h-3 text-[#AFAFAF]" />
                      </a>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[12px] text-[#8e95a1] italic">No attachments available for this case.</p>
              )}
            </div>
          </div>
        </div>
        </div>{/* end reportRef wrapper */}
      </DialogContent>
    </Dialog>
  );
}

export default FTDHReportModal;
