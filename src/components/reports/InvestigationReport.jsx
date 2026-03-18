import { useMemo } from 'react';
import { format } from 'date-fns';
import {
  FileText,
  CreditCard,
  CircleDollarSign,
  Check,
  MessageSquare,
  PenLine,
  MessageSquareWarning,
  Wallet,
} from 'lucide-react';
import { DataMasker } from '@/components/shared/DataMasker';
import { fraudTypes, channels } from '@/data/mockCases';

function formatCurrency(amount) {
  if (amount === null || amount === undefined || amount === '') return '—';
  if (typeof amount === 'string' && amount.includes('PKR')) return amount;
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function formatDateSafe(value, output = 'dd-MMM-yyyy') {
  if (!value) return '—';
  const normalized = typeof value === 'string' && value.length === 16 ? `${value}:00` : value;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return format(parsed, output);
}

function yn(value, yesText, noText, empty = '—') {
  if (value === 'yes') return yesText;
  if (value === 'no') return noText;
  return empty;
}

function hasCompromiseIndicators(f) {
  return (
    f?.deviceChange === 'yes' ||
    f?.newDevice === 'yes' ||
    f?.credentialChange === 'yes' ||
    f?.tpinChange === 'yes' ||
    f?.ipChange === 'yes'
  );
}

function generateNarratives(f, caseData, { fraudTypeLabel, channelLabel, totalDisputed }) {
  const txnCount = caseData?.transactions?.length || 0;
  const disputeChannel = f?.disputeChannel || 'Mobile Banking';
  const receivingChannel = f?.caseReceivingChannel || channelLabel || 'Contact Center';
  const receivingDate = formatDateSafe(f?.caseReceivingDate || caseData?.case_received_date);
  const amount = formatCurrency(f?.disputeAmountAtRisk || totalDisputed);
  const incidentFrom = formatDateSafe(f?.incidentDate);
  const incidentTo = f?.incidentDateTo ? formatDateSafe(f.incidentDateTo) : null;
  const incidentRange = incidentTo
    ? `between ${incidentFrom} and ${incidentTo}`
    : `on ${incidentFrom}`;

  const fmsText = f?.fmsAlertGenerated === 'yes'
    ? 'A fraud monitoring alert was generated due to abnormal device and behavioral changes.'
    : 'No fraud monitoring system alert was generated as the amount fell below the set threshold.';

  const topSummary = `A ${disputeChannel} complaint involving ${txnCount} transaction${txnCount !== 1 ? 's' : ''} amounting to ${amount} was reported via ${receivingChannel} on ${receivingDate}. The disputed transactions occurred ${incidentRange} and have been classified as ${fraudTypeLabel}. ${fmsText}`;

  const isCompromised = hasCompromiseIndicators(f);

  let investigationSummary;
  if (isCompromised) {
    investigationSummary = `System analysis indicates suspicious compromise indicators around the disputed period, including changes in device and/or credentials. Review of communication records and transaction behavior suggests potential unauthorized channel access and account takeover characteristics.`;
  } else {
    investigationSummary = `Based on system logs, customer communication, and channel analysis, it is observed that the disputed transactions were performed using the customer's registered device, unchanged credentials, and normal transaction behavior. No system, device, or credential compromise was identified.`;
  }

  const actionTakenSummary = isCompromised
    ? 'Immediate preventive controls were applied including device blocking, channel restriction, and FTDH initiation. Regulatory reporting was completed, and P-II review was performed due to suspicious indicators.'
    : 'Based on investigation findings, no compromise of customer device, credentials, or banking systems was observed. Transactions were performed by the customer using a registered device with no changes in IP, location, or authentication controls. FTDH was initiated in time, and recovery attempts were made as per procedure.';

  const observationSummary = isCompromised
    ? 'System review confirms abnormal onboarding behavior including new device, new credentials, and rapid transaction execution. Indicators are consistent with suspected account takeover.'
    : 'System review confirms that disputed transactions were executed by the customer himself. No internal control failure, system gap, or process breach was identified. The incident aligns with a social engineering–based scam.';

  const isCustomerLiability = !isCompromised;
  let conclusionNarrative;
  if (isCustomerLiability) {
    conclusionNarrative = {
      conclusion: 'No error, gap, or control weakness was observed at the bank end. The disputed transactions were performed by the customer himself; therefore, liability remains at the customer side.',
      recommendation: 'Based on investigation findings, the case is recommended to be closed under customer liability.',
      financialImpact: 'No loss booked in bank financials.',
    };
  } else {
    conclusionNarrative = {
      conclusion: 'Risk indicators suggest potential account compromise and suspicious access behavior. The case should be escalated for further risk/business adjudication.',
      recommendation: 'Refer case to business/risk team for compensation and policy decision after additional checks.',
      financialImpact: 'Pending final business decision and recovery outcomes.',
    };
  }

  return { topSummary, investigationSummary, actionTakenSummary, observationSummary, conclusionNarrative };
}

function resolveMediaUrl(pathOrUrl) {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;

  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/+$/, '');
  const origin = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;

  return pathOrUrl.startsWith('/') ? `${origin}${pathOrUrl}` : `${origin}/${pathOrUrl}`;
}

function isImageAttachment(file) {
  const mime = (file?.fileType || file?.file_type || '').toLowerCase();
  if (mime.startsWith('image/')) return true;

  const target = `${file?.name || ''} ${file?.url || ''}`.toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/.test(target);
}

function TwoColumnRows({ rows }) {
  return (
    <div>
      {rows.map((row, idx) => (
        <div key={idx} className="grid grid-cols-1 md:grid-cols-2 md:gap-10">
          <div className="px-5 py-2">
            <div className="flex justify-between gap-3 pb-2 border-b border-[#dae1e7] text-sm">
              <span className="text-muted-foreground shrink-0">{row.left.label}</span>
              <span className="min-w-0 text-right text-[#4c4c4c] whitespace-pre-wrap break-words">{row.left.value || '—'}</span>
            </div>
          </div>
          <div className="px-5 py-2">
            <div className="flex justify-between gap-3 pb-2 border-b border-[#dae1e7] text-sm">
              <span className="text-muted-foreground shrink-0">{row.right.label}</span>
              <span className="min-w-0 text-right text-[#4c4c4c] whitespace-pre-wrap break-words">{row.right.value || '—'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BlueCircleIcon({ children = null }) {
  return (
    <div className="relative w-[54px] h-[54px] shrink-0">
      <svg xmlns="http://www.w3.org/2000/svg" width="54" height="54" viewBox="0 0 70 70" fill="none" className="shrink-0">
        <circle cx="35" cy="35" r="35" fill="#2064B7" />
      </svg>
      {children ? <div className="absolute inset-0 flex items-center justify-center text-white">{children}</div> : null}
    </div>
  );
}

function InvestigationOfficerHeadingIcon() {
  return <BlueCircleIcon><FileText className="w-6 h-6" /></BlueCircleIcon>;
}

function CustomerComplaintIcon() {
  return <BlueCircleIcon><MessageSquareWarning className="w-6 h-6" /></BlueCircleIcon>;
}

function DisputedTransactionIcon() {
  return <BlueCircleIcon><Wallet className="w-6 h-6" /></BlueCircleIcon>;
}

function AnnxIcon() {
  return <BlueCircleIcon><FileText className="w-6 h-6" /></BlueCircleIcon>;
}

function SystemFactsIcon() {
  return <BlueCircleIcon><CreditCard className="w-6 h-6" /></BlueCircleIcon>;
}

function ObservationIcon() {
  return <BlueCircleIcon><CircleDollarSign className="w-6 h-6" /></BlueCircleIcon>;
}

function SupervisorApprovalIcon() {
  return <BlueCircleIcon><Check className="w-6 h-6" /></BlueCircleIcon>;
}

function SectionTitle({ title, icon = null }) {
  return (
    <div className="flex items-center gap-3 pt-3">
      {icon || <span className="h-2.5 w-2.5 rounded-full bg-[#2064b7]" />}
      <h3 className="text-[22px] font-semibold uppercase tracking-wide text-[#4c4c4c] whitespace-nowrap">{title}</h3>
      <div className="h-0 border-t-2 border-dashed border-[#AFAFAF] flex-1 ml-2" />
    </div>
  );
}

export function InvestigationReport({ caseData, investigation, uploadedFiles = [], mode = 'readonly', exportMode = false }) {
  const f = investigation;
  const txns = caseData?.transactions || [];
  const isApprovedReport = (f?.draftStatus === 'approved' || caseData?.status === 'approved');
  const approvalComment = f?.approvalComment || f?.approval_comment || '';
  const signatureType = f?.signatureType || f?.signature_type || '';
  const signatureTypedName = f?.typedSignature || f?.signature_typed_name || '';
  const signatureDrawnData = f?.drawnSignatureData || f?.signature_drawn_data || '';
  const signatureFileName = f?.signatureFileName || f?.signature_file_name || '';
  const signatureFileUrl = resolveMediaUrl(f?.signatureFile || f?.signature_file || '');
  const signatureUploadLooksLikePdf = /\.pdf(\?|$)/i.test(
    `${signatureFileName || ''} ${signatureFileUrl || ''}`
  );
  const canEmbedUploadedSignature = Boolean(signatureFileUrl) && !signatureUploadLooksLikePdf;
  const resolvedSignatureType =
    signatureType ||
    (signatureTypedName ? 'typed' : '') ||
    (signatureFileUrl || signatureFileName ? 'upload' : '') ||
    (signatureDrawnData ? 'drawn' : '');
  const hasApprovalArtifacts = Boolean(approvalComment || resolvedSignatureType);

  const channelLabel =
    channels.find((c) => c.value === (caseData?.case_receiving_channel || caseData?.channel))?.label ||
    caseData?.case_receiving_channel ||
    caseData?.channel ||
    '—';
  const fraudTypeLabel =
    fraudTypes.find((t) => t.value === caseData?.fraud_type)?.label || caseData?.fraud_type || '—';

  const totalDisputed =
    caseData?.total_disputed_amount ||
    txns.reduce((sum, t) => sum + (Number(t.disputed_amount) || 0), 0) ||
    0;

  const totalDisputedTxnSum =
    txns.reduce((sum, t) => sum + (Number(t.disputed_amount) || 0), 0) || 0;

  const customerStancePoints = useMemo(() => {
    const points = [];
    if (f?.initialCustomerStance?.trim()) points.push(f.initialCustomerStance.trim());
    if (f?.ioCallStance?.trim()) points.push(f.ioCallStance.trim());
    if (points.length === 0) return ['Customer states disputed activities were not performed by them.'];
    return points;
  }, [f?.initialCustomerStance, f?.ioCallStance]);

  const narratives = useMemo(() => {
    if (!f || !caseData) return {};
    return generateNarratives(f, caseData, { fraudTypeLabel, channelLabel, totalDisputed });
  }, [f, caseData, fraudTypeLabel, channelLabel, totalDisputed]);

  const normalizedFiles = (uploadedFiles || []).map((file) => ({
    ...file,
    fileType: file.fileType || file.file_type || '',
    url: resolveMediaUrl(file.url || file.file_url || file.file),
  }));
  const imageAnnexFiles = normalizedFiles.filter((file) => file.url && isImageAttachment(file));

  return (
    <div className="bg-white p-4 md:p-6 space-y-4">
      <SectionTitle title="Investigation Officer" icon={<InvestigationOfficerHeadingIcon />} />
      <div className="rounded-lg border border-[#dae1e7]">
        <TwoColumnRows
          rows={[
            {
              left: { label: 'IO Name', value: f?.investigationOfficer || caseData?.assigned_to?.name },
              right: { label: 'IO Position', value: 'Analyst Investigation' },
            },
            {
              left: { label: 'IO Region', value: caseData?.customer?.region || '—' },
              right: { label: 'Report Prepared Date', value: formatDateSafe(new Date()) },
            },
          ]}
        />
      </div>

      <SectionTitle title="Customer / Complaint Details" icon={<CustomerComplaintIcon />} />
      <div className="rounded-lg border border-[#dae1e7]">
        <div className="px-5 pt-4 pb-2 font-semibold text-base flex items-center gap-2">
          <CreditCard className="h-4 w-4" /> Customer Details
        </div>
        <TwoColumnRows
          rows={[
            {
              left: { label: 'Customer Name', value: f?.customerNameField || caseData?.customer?.name },
              right: { label: 'CNIC', value: <DataMasker value={caseData?.customer?.cnic} type="cnic" /> },
            },
            {
              left: {
                label: 'Customer City (Region)',
                value: `${caseData?.customer?.city || '—'}${caseData?.customer?.region ? ` (${caseData.customer.region})` : ''}`,
              },
              right: { label: 'Customer Contact Number', value: f?.customerCli || caseData?.customer?.mobile || '—' },
            },
            {
              left: {
                label: 'Account Number',
                value: <DataMasker value={f?.customerAccountNoField || caseData?.customer?.accounts?.[0]?.account_number} type="account" />,
              },
              right: { label: 'Customer Account Type', value: f?.customerAccountType || '—' },
            },
            {
              left: { label: 'Branch Code', value: f?.branchCodeField || caseData?.branch_code || '—' },
              right: { label: 'Account Opening Date', value: formatDateSafe(f?.customerAccountOpeningDate) },
            },
          ]}
        />
      </div>

      <div className="rounded-lg border border-[#dae1e7]">
        <div className="px-5 pt-4 pb-2 font-semibold text-base flex items-center gap-2">
          <CircleDollarSign className="h-4 w-4" /> Dispute Details
        </div>
        <TwoColumnRows
          rows={[
            {
              left: { label: 'Complaint No#', value: f?.complaintNo || caseData?.complaint_number || '—' },
              right: { label: 'Reference Number', value: f?.caseReferenceNo || caseData?.reference_number || '—' },
            },
            {
              left: { label: 'Dispute Channel', value: f?.disputeChannel || '—' },
              right: { label: 'FMS Alert Generated', value: yn(f?.fmsAlertGenerated, 'Yes', 'No') },
            },
            {
              left: { label: 'Type of Incident', value: fraudTypeLabel || '—' },
              right: {
                label: 'Date(s) Incident Occurred',
                value: `${formatDateSafe(f?.incidentDate)}${f?.incidentDateTo ? ` to ${formatDateSafe(f.incidentDateTo)}` : ''}`,
              },
            },
            {
              left: { label: 'Dispute Amount at Risk', value: formatCurrency(f?.disputeAmountAtRisk || totalDisputed) },
              right: { label: 'Case Receiving Channel', value: f?.caseReceivingChannel || channelLabel || '—' },
            },
            {
              left: { label: 'Case Receiving Date', value: formatDateSafe(f?.caseReceivingDate || caseData?.case_received_date) },
              right: { label: 'Customer Communication Date', value: formatDateSafe(f?.customerCommunicationDate) },
            },
            {
              left: { label: 'SIM Blocked', value: yn(f?.simBlocked, 'Yes', 'No') },
              right: { label: 'Fund Layered A/C', value: yn(f?.fundLayeredFlag, 'Yes', 'No') },
            },
            {
              left: { label: 'Source of IB Channel Creation', value: f?.mbCreationSource || '—' },
              right: { label: 'Expected Recovery On-Us', value: f?.expectedRecoveryOnUs || 'NIL' },
            },
            {
              left: { label: 'Expected Recovery Member Bank', value: f?.expectedRecoveryMemberBank || 'NIL' },
              right: { label: 'Net Loss Booked', value: yn(f?.netLossBooked, 'Yes', 'No') },
            },
          ]}
        />
      </div>

      {narratives.topSummary && (
        <div className="rounded-md border border-[#d3dde8] bg-[#f3f6f9] p-4 text-[16px] leading-[1.6] text-[#4c4c4c]">
          <p className="font-semibold text-[#2064b7] uppercase text-[14px] mb-2">Summary</p>
          <p className="whitespace-pre-wrap break-words">{narratives.topSummary}</p>
        </div>
      )}

      <div className="space-y-4 pl-4 md:pl-8">
        <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Customer Background and Statement</p>
        <p className="text-[#4c4c4c] pl-5 text-[18px] leading-[1.56] whitespace-pre-wrap break-words">
          On {formatDateSafe(f?.caseReceivingDate || caseData?.case_received_date)}, customer reported unauthorized transactions totaling {formatCurrency(f?.disputeAmountAtRisk || totalDisputed)}.
        </p>
        <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Customer Stance</p>
        <ul className="list-disc pl-12 space-y-1 text-[#4c4c4c] text-[18px] leading-[1.56] break-words">
          {customerStancePoints.map((point, idx) => (
            <li key={idx} className="whitespace-pre-wrap break-words">{point}</li>
          ))}
        </ul>

        <p className="font-bold text-[#2064b7] uppercase text-[20px] pt-4">• Investigation Details</p>
        <div className="overflow-x-auto rounded-sm border border-[#dae1e7]">
          <table className="w-full text-[14px]">
            <thead className="bg-[#2064b7] text-white">
              <tr>
                <th className="px-3 py-2 text-left">Detail</th>
                <th className="px-3 py-2 text-left">Value</th>
              </tr>
            </thead>
            <tbody className="[&_td]:align-top [&_td]:whitespace-pre-wrap [&_td]:break-words">
              <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">Customer Call at Contact Centre (Date &amp; Time)</td><td className="px-3 py-2">{formatDateSafe(f?.cxCallDatetime, 'dd-MMM-yyyy @ HH:mm')}</td></tr>
              <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">Call was made to the Customer</td><td className="px-3 py-2">{yn(f?.ioCallMade, 'Yes', 'No')}</td></tr>
              <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">Contact Established</td><td className="px-3 py-2">{yn(f?.contactEstablished, 'Yes', 'No')}</td></tr>
              <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">IO Call Date &amp; Time</td><td className="px-3 py-2">{formatDateSafe(f?.ioCallDatetime, 'dd-MMM-yyyy @ HH:mm')}</td></tr>
              <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">Calling RC (Recording Channel)</td><td className="px-3 py-2">{f?.rcChannel || '—'}</td></tr>
              <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">Communication Letter Sent</td><td className="px-3 py-2">{yn(f?.letterSent, 'Yes', 'No')}</td></tr>
              <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">IB/MB Channel Creation Date</td><td className="px-3 py-2">{formatDateSafe(f?.mbCreationDatetime, 'dd-MMM-yyyy @ HH:mm')}</td></tr>
              <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">Customer Debit Card Creation</td><td className="px-3 py-2">{formatDateSafe(f?.dcCreationDatetime)}</td></tr>
              <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">Customer Credit Card Creation</td><td className="px-3 py-2">{formatDateSafe(f?.ccCreationDatetime)}</td></tr>
              <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">Source of IB/MB Channel Creation</td><td className="px-3 py-2">{f?.mbCreationSource || '—'}</td></tr>
              <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">Initial Device at Registration</td><td className="px-3 py-2">{f?.initialDeviceId || '—'}</td></tr>
              <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">Customer Login ID</td><td className="px-3 py-2">{f?.loginId || '—'}</td></tr>
              <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">User IP / LAT-LONG</td><td className="px-3 py-2">{f?.loginIp || '—'}</td></tr>
              <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">Change in Login ID / Password (02 months)</td><td className="px-3 py-2">{yn(f?.credentialChange, 'Yes', 'No')}</td></tr>
              <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">Change in T-PIN</td><td className="px-3 py-2">{yn(f?.tpinChange, 'Yes', 'No')}</td></tr>
              <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">New Device Registration</td><td className="px-3 py-2">{yn(f?.newDevice, 'Yes', 'No')}</td></tr>
              <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">Change in Device Detail</td><td className="px-3 py-2">{yn(f?.deviceChange, 'Yes', 'No')}</td></tr>
              <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">Change of IP / Location</td><td className="px-3 py-2">{yn(f?.ipChange, 'Yes', 'No')}</td></tr>
              <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">Limit Enhancement</td><td className="px-3 py-2">{yn(f?.limitEnhanced, 'Yes', 'No')}</td></tr>
              <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">Customer Default / Previous Limit</td><td className="px-3 py-2">{f?.previousLimit || '—'}</td></tr>
              <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">Customer New Limit</td><td className="px-3 py-2">{f?.newLimit || '—'}</td></tr>
              <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">Mode of Limit Enhancement</td><td className="px-3 py-2">{f?.limitMode || 'N/A'}</td></tr>
              <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">Customer Disputed Transaction Pattern</td><td className="px-3 py-2">{f?.txnPattern || '—'}</td></tr>
              <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">Consumer Product Availed</td><td className="px-3 py-2">{f?.productsAvailed || '—'}</td></tr>
              <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">SMS / OTP Delivered</td><td className="px-3 py-2">{yn(f?.otpDelivered, 'Yes', 'No')}</td></tr>
            </tbody>
          </table>
        </div>

        {narratives.investigationSummary && (
          <div className="rounded-md border border-[#d3dde8] bg-[#f3f6f9] p-4 text-[16px] leading-[1.6] text-[#4c4c4c] mt-4">
            <p className="font-semibold text-[#2064b7] uppercase text-[14px] mb-2">Investigation Summary</p>
            <p className="whitespace-pre-wrap break-words">{narratives.investigationSummary}</p>
          </div>
        )}
      </div>

      <SectionTitle title="Disputed Transaction Details" icon={<DisputedTransactionIcon />} />
      <div className="space-y-2 pl-3 md:pl-6">
        <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Mobile Disputed Activities</p>
        <div className="overflow-x-auto rounded-sm border border-[#dae1e7]">
          <table className="w-full min-w-[760px] text-[14px]">
            <thead className="bg-[#2064b7] text-left text-white">
              <tr>
                <th className="px-3 py-2">Transaction ID</th>
                <th className="px-3 py-2">Date &amp; Time</th>
                <th className="px-3 py-2">Channel</th>
                <th className="px-3 py-2">Beneficiary</th>
                <th className="px-3 py-2">STAN</th>
                <th className="px-3 py-2">Amount (PKR)</th>
              </tr>
            </thead>
            <tbody>
              {txns.map((txn) => (
                <tr key={txn.id} className="border-t border-[#dae1e7]">
                  <td className="px-3 py-2 whitespace-pre-wrap break-words">{txn.transaction_id}</td>
                  <td className="px-3 py-2">
                    {format(new Date(txn.transaction_date), 'dd/MM/yyyy')}
                    <p className="text-xs text-muted-foreground">{txn.transaction_time?.slice(0, 5) || '--:--'}</p>
                  </td>
                  <td className="px-3 py-2 whitespace-pre-wrap break-words">{txn.channel || '—'}</td>
                  <td className="px-3 py-2 whitespace-pre-wrap break-words">
                    <span>{txn.beneficiary_bank || '—'}</span>
                    {txn.beneficiary_account && <p className="text-xs text-muted-foreground break-words">{txn.beneficiary_account}</p>}
                  </td>
                  <td className="px-3 py-2 whitespace-pre-wrap break-words">{txn.stan || '—'}</td>
                  <td className="px-3 py-2 text-[#1e8fff] font-semibold">{formatCurrency(txn.disputed_amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#edf1f4] border-t border-[#dae1e7]">
                <td colSpan={5} className="px-3 py-2 font-semibold uppercase text-[#4c4c4c]">
                  Total Disputed Amount
                </td>
                <td className="px-3 py-2 font-semibold text-[#1e8fff]">{formatCurrency(totalDisputedTxnSum)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <SectionTitle title="System Facts" icon={<SystemFactsIcon />} />
      <p className="text-[18px] text-[#4c4c4c] leading-[1.56] pl-2">
        The following actions were taken by the bank upon complaint receipt and during investigation.
      </p>

      <div className="space-y-6 pl-3 md:pl-6">
        <div className="space-y-2">
          <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Detection / Authorization Feedback Detail</p>
          <div className="overflow-x-auto rounded-sm border border-[#dae1e7]">
            <table className="w-full min-w-[760px] text-[14px]">
              <thead className="bg-[#2064b7] text-white">
                <tr>
                  <th className="px-3 py-2 text-left">Detail</th>
                  <th className="px-3 py-2 text-left">Required?</th>
                  <th className="px-3 py-2 text-left">Feedback Received (If Yes)</th>
                  <th className="px-3 py-2 text-left">Rationale (If Selected No)</th>
                </tr>
              </thead>
              <tbody className="[&_td]:align-top [&_td]:whitespace-pre-wrap [&_td]:break-words">
                <tr className="border-t border-[#dae1e7]">
                  <td className="px-3 py-2">Detection / Authorization Feedback</td>
                  <td className="px-3 py-2">{f?.fmsAlertGenerated ? f.fmsAlertGenerated.toUpperCase() : '—'}</td>
                  <td className="px-3 py-2">{f?.fmsAlertGenerated === 'yes' ? 'Feedback received' : '—'}</td>
                  <td className="px-3 py-2">{f?.fmsAlertGenerated === 'no' ? 'Disputed amount is below the defined threshold for mandatory feedback.' : '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-2">
          <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Action Taken</p>
          <div className="overflow-x-auto rounded-sm border border-[#dae1e7]">
            <table className="w-full text-[14px]">
              <thead className="bg-[#2064b7] text-white">
                <tr>
                  <th className="px-3 py-2 text-left">Action</th>
                  <th className="px-3 py-2 text-left">Status / Detail</th>
                </tr>
              </thead>
              <tbody className="[&_td]:align-top [&_td]:whitespace-pre-wrap [&_td]:break-words">
                <tr className="border-t border-[#dae1e7] align-top"><td className="px-3 py-2">Blocking of Observed Device</td><td className="px-3 py-2">{yn(f?.deviceBlockedFlag, 'The observed device was blocked in the internal system.', 'No device blocking was performed as transactions were initiated by the customer on his registered device.', '—')}</td></tr>
                <tr className="border-t border-[#dae1e7] align-top"><td className="px-3 py-2">Fraudster / Perpetrator Mobile Number</td><td className="px-3 py-2">{f?.fraudsterNumberReported || 'The fraudster\'s mobile number was not provided by the customer.'}</td></tr>
                <tr className="border-t border-[#dae1e7] align-top"><td className="px-3 py-2">FTDH Status / Recovery</td><td className="px-3 py-2">{f?.ftdhStatus || '—'}</td></tr>
                <tr className="border-t border-[#dae1e7] align-top"><td className="px-3 py-2">Fund Layered A/C</td><td className="px-3 py-2">{yn(f?.fundLayeredFlag, 'Fund layering details shared by member bank.', 'No evidence of fund layering was observed during the investigation.', '—')}</td></tr>
                <tr className="border-t border-[#dae1e7] align-top"><td className="px-3 py-2">PSTR Raised</td><td className="px-3 py-2">{yn(f?.pstrFlag, 'PSTR was raised for regulatory compliance.', 'Not applicable.', '—')}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-2">
          <p className="font-bold text-[#2064b7] uppercase text-[20px]">• P-II Review</p>
          <div className="overflow-x-auto rounded-sm border border-[#dae1e7]">
            <table className="w-full text-[14px]">
              <thead className="bg-[#2064b7] text-white">
                <tr>
                  <th className="px-3 py-2 text-left">Detail</th>
                  <th className="px-3 py-2 text-left">Status / Detail</th>
                </tr>
              </thead>
              <tbody className="[&_td]:align-top [&_td]:whitespace-pre-wrap [&_td]:break-words">
                <tr className="border-t border-[#dae1e7] align-top"><td className="px-3 py-2">P-II Reviewed</td><td className="px-3 py-2">{yn(f?.piiReviewedFlag, 'P-II review was conducted due to abnormal behavior.', 'Since no change in device, IP, or customer behavior was observed, P-II review was not required.', '—')}</td></tr>
                <tr className="border-t border-[#dae1e7] align-top"><td className="px-3 py-2">Suspected Staff Name</td><td className="px-3 py-2">{f?.suspectedStaffName || 'Not applicable.'}</td></tr>
                <tr className="border-t border-[#dae1e7] align-top"><td className="px-3 py-2">Suspected Staff Feedback</td><td className="px-3 py-2">{f?.suspectedStaffFeedback || 'Not applicable.'}</td></tr>
                <tr className="border-t border-[#dae1e7] align-top"><td className="px-3 py-2">FRMU Review on Staff Feedback</td><td className="px-3 py-2">{f?.frmuReviewFlag || 'Not applicable.'}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4 text-[#4c4c4c]">
          <div>
            <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Communication with xxx Bank:</p>
            <p className="text-[18px] leading-[1.56] pl-5 whitespace-pre-wrap break-words">{f?.ftdhStatus || 'Data not available/detailed in source documents.'}</p>
          </div>
          <div>
            <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Communication with On-us A/c # xxxxx:</p>
            <p className="text-[18px] leading-[1.56] pl-5 whitespace-pre-wrap break-words">{yn(f?.pstrFlag, 'PSTR was raised against observed account.', 'PSTR was not raised.', 'Data not available/detailed in source documents.')}</p>
          </div>
          <div>
            <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Communication with Merchant against 3D/POS secure activities:</p>
            <p className="text-[18px] leading-[1.56] pl-5 whitespace-pre-wrap break-words">{f?.factFindings || 'Data not available/detailed in source documents.'}</p>
          </div>
        </div>
      </div>

      {narratives.actionTakenSummary && (
        <div className="rounded-md border border-[#d3dde8] bg-[#f3f6f9] p-4 text-[16px] leading-[1.6] text-[#4c4c4c] ml-3 md:ml-6">
          <p className="font-semibold text-[#2064b7] uppercase text-[14px] mb-2">Action Taken Summary</p>
          <p className="whitespace-pre-wrap break-words">{narratives.actionTakenSummary}</p>
        </div>
      )}

      <SectionTitle title="Observations & Conclusion" icon={<ObservationIcon />} />
      <div className="space-y-4 pl-3 md:pl-6 text-[#4c4c4c]">
        <div>
          <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Observation</p>
          <p className="text-[18px] leading-[1.56] pl-5 whitespace-pre-wrap break-words">{f?.factFindings || '—'}</p>
        </div>
        <div>
          <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Conclusions</p>
          <p className="text-[18px] leading-[1.56] pl-5 whitespace-pre-wrap break-words">{f?.finalConclusionType || '—'}</p>
        </div>
        <div>
          <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Control Breaches</p>
          <p className="text-[18px] leading-[1.56] pl-5 whitespace-pre-wrap break-words">{f?.controlBreachesObserved || yn(f?.controlBreaches, 'Control breach has been identified.', 'No Control Breach is observed.', '—')}</p>
        </div>
        <div>
          <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Control Weaknesses</p>
          <p className="text-[18px] leading-[1.56] pl-5 whitespace-pre-wrap break-words">{yn(f?.gapIdentified, 'Internal gap has been identified in this case.', 'No internal gap is observed in this case.', '—')}</p>
        </div>
        <div>
          <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Root Cause</p>
          <p className="text-[18px] leading-[1.56] pl-5 whitespace-pre-wrap break-words">{f?.rootCause || '—'}</p>
        </div>
        <div>
          <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Type of Fraud Identified by System</p>
          <p className="text-[18px] leading-[1.56] pl-5 whitespace-pre-wrap break-words">{f?.fraudTypeSystem || '—'}</p>
        </div>
        <div>
          <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Recommendation</p>
          <p className="text-[18px] leading-[1.56] pl-5 whitespace-pre-wrap break-words">{f?.recommendation || '—'}</p>
        </div>
        <div>
          <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Action Owner</p>
          <p className="text-[18px] leading-[1.56] pl-5 whitespace-pre-wrap break-words">{f?.actionOwner || '—'} — {f?.actionStatus || '—'}</p>
        </div>

        {narratives.observationSummary && (
          <div className="rounded-md border border-[#d3dde8] bg-[#f3f6f9] p-4 text-[16px] leading-[1.6] text-[#4c4c4c] mt-4">
            <p className="font-semibold text-[#2064b7] uppercase text-[14px] mb-2">Observation Summary</p>
            <p className="whitespace-pre-wrap break-words">{narratives.observationSummary}</p>
          </div>
        )}

        {narratives.conclusionNarrative && (
          <div className="rounded-md border border-[#d3dde8] bg-[#f3f6f9] p-4 text-[16px] leading-[1.6] text-[#4c4c4c] mt-4">
            <p className="font-semibold text-[#2064b7] uppercase text-[14px] mb-2">Final Conclusion</p>
            <p className="mb-2 whitespace-pre-wrap break-words"><span className="font-semibold">Conclusion:</span> {narratives.conclusionNarrative.conclusion}</p>
            <p className="mb-2 whitespace-pre-wrap break-words"><span className="font-semibold">Recommendation:</span> {narratives.conclusionNarrative.recommendation}</p>
            <p className="whitespace-pre-wrap break-words"><span className="font-semibold">Financial Impact:</span> {narratives.conclusionNarrative.financialImpact}</p>
          </div>
        )}
      </div>

      <SectionTitle title="Annx" icon={<AnnxIcon />} />
      {exportMode ? (
        <div className="space-y-3 pl-2">
          {imageAnnexFiles.length > 0 ? imageAnnexFiles.map((file, idx) => (
            <div key={idx} className="rounded border border-[#dae1e7] bg-white p-3">
              <p className="mb-2 text-xs font-medium text-[#4c4c4c]">{file.name || `attachment-${idx + 1}`}</p>
              <img
                src={file.url}
                alt={file.name || `attachment-${idx + 1}`}
                className="w-full max-h-[520px] object-contain rounded border border-[#e5e7eb] bg-white"
                crossOrigin="anonymous"
              />
            </div>
          )) : (
            <span className="text-muted-foreground text-sm">No image attachments available.</span>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 text-sm pl-2">
          {normalizedFiles.length > 0 ? normalizedFiles.map((file, idx) => (
            file.url ? (
              <a
                key={idx}
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded border border-[#dae1e7] px-3 py-1.5 bg-white text-[#2064B7] hover:underline"
              >
                <FileText className="mr-2 h-3.5 w-3.5 text-[#2064b7]" />
                {file.name || `attachment-${idx + 1}.pdf`}
              </a>
            ) : (
              <span key={idx} className="inline-flex items-center rounded border border-[#dae1e7] px-3 py-1.5 bg-white">
                <FileText className="mr-2 h-3.5 w-3.5 text-[#2064b7]" />
                {file.name || `attachment-${idx + 1}.pdf`}
              </span>
            )
          )) : (
            <span className="text-muted-foreground text-sm">No files attached.</span>
          )}
        </div>
      )}

      {isApprovedReport && hasApprovalArtifacts && (
        <>
          <SectionTitle title="Supervisor Approval" icon={<SupervisorApprovalIcon />} />
          <div className="space-y-3 pl-2">
            {approvalComment && (
              <div className="rounded-lg border border-[#d3dde8] bg-[#f3f6f9] shadow-[0_1px_2px_rgba(0,0,0,0.06)] px-3 py-2.5 md:px-4">
                <p className="mb-1.5 inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-[#2064b7]">
                  <MessageSquare className="h-4 w-4" />
                  Comment
                </p>
                <p className="text-[14px] leading-relaxed text-[#1f2937] whitespace-pre-wrap break-words">{approvalComment}</p>
              </div>
            )}

            {resolvedSignatureType === 'typed' && signatureTypedName && (
              <div className="px-1 py-1">
                <p className="mb-1.5 inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-[#2064b7]">
                  <PenLine className="h-4 w-4" />
                  Signature
                </p>
                <div className="rounded border border-[#dae1e7] bg-white px-3 py-2">
                  <p className="text-[15px] font-medium text-[#1f2937]">{signatureTypedName}</p>
                </div>
              </div>
            )}

            {resolvedSignatureType === 'upload' && (signatureFileUrl || signatureFileName) && (
              <div className="px-1 py-1">
                <p className="mb-1.5 inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-[#2064b7]">
                  <PenLine className="h-4 w-4" />
                  Signature
                </p>
                <div className="rounded border border-[#dae1e7] bg-white px-3 py-2">
                  {exportMode && canEmbedUploadedSignature ? (
                    <img
                      src={signatureFileUrl}
                      alt={signatureFileName || 'Supervisor uploaded signature'}
                      className="max-h-[180px] w-auto rounded border border-[#e5e7eb] bg-white"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <p className="text-[14px] text-[#1f2937]">
                      {signatureFileUrl ? (
                        <a href={signatureFileUrl} target="_blank" rel="noreferrer" className="font-medium text-[#2064B7] hover:underline">
                          {signatureFileName || 'View signature file'}
                        </a>
                      ) : (
                        signatureFileName
                      )}
                    </p>
                  )}
                </div>
              </div>
            )}

            {resolvedSignatureType === 'drawn' && signatureDrawnData && (
              <div className="px-1 py-1">
                <p className="mb-1.5 inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-[#2064b7]">
                  <PenLine className="h-4 w-4" />
                  Signature
                </p>
                <img
                  src={signatureDrawnData}
                  alt="Supervisor e-sign"
                  className="max-h-[160px] rounded border border-[#dae1e7] bg-white"
                />
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}

export default InvestigationReport;
