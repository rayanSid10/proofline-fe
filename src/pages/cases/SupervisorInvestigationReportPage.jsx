import { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Upload,
  FileText,
  User,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { DataMasker } from '@/components/shared/DataMasker';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { fraudTypes, channels } from '@/data/mockCases';
import { getAllCases } from '@/data/caseStorage';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatDateSafe(value, output = 'dd-MMM-yyyy') {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return format(parsed, output);
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b pb-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right text-[#4c4c4c]">{value || '—'}</span>
    </div>
  );
}

function SectionTitle({ title }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <span className="h-2.5 w-2.5 rounded-full bg-[#2064b7]" />
      <h3 className="text-sm md:text-base font-semibold uppercase tracking-wide text-[#2064b7]">{title}</h3>
    </div>
  );
}

export function SupervisorInvestigationReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const caseData = getAllCases().find((c) => c.id === parseInt(id));

  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [signatureFile, setSignatureFile] = useState(null);
  const [typedSignature, setTypedSignature] = useState('');
  const [signatureMode, setSignatureMode] = useState('upload');
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [approveNote, setApproveNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const signatureCanvasRef = useRef(null);

  if (!caseData) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Case not found</h2>
        <Button className="mt-4" onClick={() => navigate('/cases')}>
          Back to Cases
        </Button>
      </div>
    );
  }

  const submittedStatuses = ['pending_review', 'approved', 'rejected', 'closed'];
  const isSubmitted = submittedStatuses.includes(caseData.status);
  const canDecide = caseData.status === 'pending_review';

  const fraudTypeLabel =
    fraudTypes.find((t) => t.value === caseData.fraud_type)?.label || caseData.fraud_type;
  const channelLabel =
    channels.find((c) => c.value === (caseData.case_receiving_channel || caseData.channel))?.label ||
    caseData.case_receiving_channel ||
    caseData.channel;

  const ioName = caseData.assigned_to?.name || caseData.investigation_officer || 'Not assigned';
  const ioPosition = caseData.io_position || 'Analyst Investigation';
  const ioRegion =
    caseData.io_region ||
    (caseData.customer?.region ? `${caseData.customer.region}` : null) ||
    '—';
  const reportPreparedDate =
    formatDateSafe(caseData.report_prepared_date || caseData.updated_at || caseData.created_at);

  const totalDisputed =
    caseData.total_disputed_amount ||
    caseData.transactions?.reduce((sum, t) => sum + (Number(t.disputed_amount) || 0), 0) ||
    0;

  const customerBackground =
    caseData.customer_background_statement ||
    `On ${formatDateSafe(caseData.case_received_date)}, customer reported unauthorized transactions totaling ${formatCurrency(totalDisputed)}.`;

  const customerStancePoints =
    caseData.customer_stance_points ||
    [
      'Customer states disputed activities were not performed by them.',
      'Customer confirms physical card/account ownership.',
      'Customer claims credentials were not shared with any third party.',
    ];

  const detectionFeedbackRequired = caseData.detection_feedback_required || 'no';
  const detectionFeedback = caseData.detection_feedback || '—';
  const detectionRationale =
    caseData.detection_rationale ||
    'Disputed amount is below the defined threshold for mandatory feedback.';

  const channelsBlockingRows = [
    {
      channel: 'Blocking of MB Channel',
      datetime: caseData.mb_block_datetime || '—',
    },
    {
      channel: 'Blocking of Debit Card',
      datetime: caseData.dc_block_datetime || '—',
    },
    {
      channel: 'Blocking of Credit Card',
      datetime: caseData.cc_block_datetime || '—',
    },
  ];

  const otherDetailsRows = [
    { channel: 'Transaction SMS Alerts', datetime: caseData.sms_alert_datetime || '—' },
    {
      channel: 'Complaint Lodgment by the Customer at DCE',
      datetime: caseData.complaint_lodgment_datetime || '—',
    },
    { channel: 'FTDH Lodgment', datetime: caseData.ftdh_lodgment_datetime || '—' },
  ];

  const customerAccountProfileRows = [
    { label: 'Account Opening Date', value: formatDateSafe(caseData.account_opening_date) },
    { label: 'Account Type', value: caseData.customer?.account_type || caseData.customer_account_type || '—' },
    {
      label: 'Debit Card Creation / Activation Date',
      value: formatDateSafe(caseData.debit_card_activation_date),
    },
  ];

  const detailsOfUserRows = [
    { action: 'Mobile', detail: caseData.user_mobile || caseData.customer?.mobile || '—' },
    {
      action: 'Device ID / IMEI / MAC Address',
      detail:
        caseData.user_device_details ||
        caseData.transactions?.[0]?.device_id ||
        caseData.initialDeviceId ||
        '—',
    },
    {
      action: 'IP Address',
      detail: caseData.user_ip || caseData.transactions?.[0]?.ip_address || caseData.loginIp || '—',
    },
    {
      action: 'Caller-known information (as claimed by customer)',
      detail: caseData.caller_known_info || '—',
    },
  ];

  const piiDataRows = [
    {
      action: 'P-II Review (Staff)',
      detail:
        caseData.pii_staff_review ||
        'Logs of system access and staff interactions were reviewed. No suspicious internal staff activity observed.',
    },
    {
      action: 'Transaction Reversal Request',
      detail:
        caseData.transaction_reversal_request ||
        'Chargeback/reversal requests were initiated with acquiring bank/merchant. (Status pending)',
    },
    {
      action: 'Customer Communication',
      detail:
        caseData.customer_communication_note ||
        'Customer was informed about investigation status and preliminary findings.',
    },
  ];

  const observations =
    caseData.observation ||
    `Investigation indicates disputed amount of ${formatCurrency(totalDisputed)} with no confirmed system glitch/control breach.`;
  const conclusions =
    caseData.conclusion ||
    'Case can be concluded based on evidence and policy framework.';
  const controlBreaches = caseData.control_breaches || 'No control breach observed.';
  const controlWeaknesses = caseData.control_weaknesses || 'No system/control weakness identified.';
  const rootCause =
    caseData.root_cause ||
    (fraudTypeLabel ? `${fraudTypeLabel} related compromise suspected.` : 'Under review');
  const recommendation =
    caseData.recommendation ||
    'Proceed as per policy and close with liability determination after all dependency checks.';
  const actionOwner = caseData.action_owner || 'IS / Business';
  const actionStatus = caseData.action_status || 'Acknowledged';

  const annexFiles =
    (caseData.annex_files || []).length > 0
      ? caseData.annex_files
      : [{ name: 'proof.pdf' }, { name: 'court-file.pdf' }];

  const handleApprove = () => {
    const hasUpload = Boolean(signatureFile);
    const hasTyped = Boolean(typedSignature.trim());
    const hasDrawn = hasDrawnSignature;

    if (!hasUpload && !hasTyped && !hasDrawn) {
      toast.error('Signature required (upload, type, or e-sign)');
      return;
    }

    toast.success('Case approved successfully');
    setShowApproveDialog(false);
    navigate(`/cases/${id}`);
  };

  const getCanvasPoint = (e) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    const point = getCanvasPoint(e);
    if (!context || !point) return;

    if (e.cancelable) e.preventDefault();

    context.lineWidth = 2;
    context.lineCap = 'round';
    context.strokeStyle = '#111827';
    context.beginPath();
    context.moveTo(point.x, point.y);
    setIsDrawing(true);
  };

  const drawSignature = (e) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    const point = getCanvasPoint(e);
    if (!context || !point) return;

    if (e.cancelable) e.preventDefault();

    context.lineTo(point.x, point.y);
    context.stroke();
    setHasDrawnSignature(true);
  };

  const stopDrawing = (e) => {
    if (e?.cancelable) e.preventDefault();
    setIsDrawing(false);
  };

  const clearDrawnSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSignature(false);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    toast.success('Case rejected and returned to investigator');
    setShowRejectDialog(false);
    navigate(`/cases/${id}`);
  };

  if (!isSubmitted) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(`/cases/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Case
        </Button>
        <Card>
          <CardContent className="py-10 text-center space-y-2">
            <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
            <p className="font-medium">Investigation not submitted yet</p>
            <p className="text-sm text-muted-foreground">
              Supervisor can view investigation report after investigator submits the form.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#dae1e7] overflow-hidden">
        <div className="bg-[#2064b7] px-4 py-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/15 hover:text-white"
              onClick={() => navigate(`/cases/${id}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold">Investigation Report</h2>
              <p className="text-xs text-white/80">{caseData.reference_number}</p>
            </div>
            <StatusBadge status={caseData.status} />
          </div>

          {canDecide && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => setShowRejectDialog(true)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button
                className="bg-[#22c55e] hover:bg-[#16a34a] text-white"
                onClick={() => setShowApproveDialog(true)}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </div>
          )}
        </div>

        <div className="bg-white p-4 md:p-6 space-y-4">
          <SectionTitle title="Investigation Officer" />
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Investigation Officer
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-3">
              <Row label="IO Name" value={ioName} />
              <Row label="IO Position" value={ioPosition} />
              <Row label="IO Region" value={ioRegion} />
              <Row label="Report Prepared Date" value={reportPreparedDate} />
            </CardContent>
          </Card>

          <SectionTitle title="Customer / Complaint Details" />
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-3">
              <Row label="Customer Name" value={caseData.customer?.name} />
              <Row label="CNIC" value={<DataMasker value={caseData.customer?.cnic} type="cnic" />} />
              <Row
                label="Customer City (Region)"
                value={`${caseData.customer?.city || '—'}${caseData.customer?.region ? ` (${caseData.customer.region})` : ''}`}
              />
              <Row label="Customer Contact Number" value={caseData.customer?.mobile || '—'} />
              <Row
                label="Account Number"
                value={<DataMasker value={caseData.customer?.account_number} type="account" />}
              />
              <Row
                label="Customer Account Type"
                value={caseData.customer?.account_type || caseData.customer_account_type || '—'}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Dispute Details</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-3">
              <Row label="Complaint No#" value={caseData.complaint_number || '—'} />
              <Row label="Reference Number" value={caseData.reference_number || '—'} />
              <Row label="Type of Incident" value={fraudTypeLabel || '—'} />
              <Row label="Date(s) Incident Occurred" value={formatDateSafe(caseData.date_incident_occurred)} />
              <Row label="Dispute Amount at Risk" value={formatCurrency(totalDisputed)} />
              <Row label="Case Receiving Channel" value={channelLabel || '—'} />
              <Row label="Case Receiving Date" value={formatDateSafe(caseData.case_received_date)} />
              <Row
                label="Customer Communication Date"
                value={formatDateSafe(caseData.customer_communication_date || caseData.case_received_date)}
              />
              <Row
                label="Customer / Beneficiary SIM Blocked"
                value={caseData.customer_beneficiary_sim_blocked || 'No'}
              />
              <Row label="Fund Layered A/C#" value={caseData.fund_layered_account || '—'} />
              <Row label="Source of IB Channel Creation" value={caseData.source_of_ib_channel_creation || '—'} />
              <Row label="Expected Recovery from On-Us Beneficiary" value={caseData.expected_recovery_onus || '—'} />
              <Row
                label="Expected Recovery from Member / Bank Beneficiary"
                value={caseData.expected_recovery_member_bank || '—'}
              />
              <Row label="Net Loss Booked" value={caseData.net_loss_booked || '0'} />
            </CardContent>
          </Card>

          <div className="space-y-2 text-sm">
            <p className="text-[#4c4c4c]">{customerBackground}</p>
            <p className="font-semibold text-[#2064b7] uppercase">Customer Stance</p>
            <ul className="list-disc ml-5 space-y-1 text-[#4c4c4c]">
              {customerStancePoints.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          </div>

          <SectionTitle title="Disputed Transaction Details" />
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Mobile Disputed Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-[#edf1f4] text-left">
                    <tr>
                      <th className="px-3 py-2">Transaction ID</th>
                      <th className="px-3 py-2">Date &amp; Time</th>
                      <th className="px-3 py-2">Beneficiary</th>
                      <th className="px-3 py-2">Branch</th>
                      <th className="px-3 py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {caseData.transactions.map((txn) => (
                      <tr key={txn.id} className="border-t">
                        <td className="px-3 py-2">{txn.transaction_id}</td>
                        <td className="px-3 py-2">
                          {format(new Date(txn.transaction_date), 'dd/MM/yyyy')}
                          <p className="text-xs text-muted-foreground">{txn.transaction_time?.slice(0, 5) || '--:--'}</p>
                        </td>
                        <td className="px-3 py-2">
                          <p>{txn.beneficiary_bank || '—'}</p>
                          <p className="text-xs text-muted-foreground"><DataMasker value={txn.beneficiary_account} type="account" /></p>
                        </td>
                        <td className="px-3 py-2">{txn.branch_name || txn.branch || caseData.branch_code || '—'}</td>
                        <td className="px-3 py-2 text-[#1e8fff] font-semibold">{formatCurrency(txn.disputed_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#edf1f4] border-t">
                      <td colSpan={4} className="px-3 py-2 font-semibold uppercase text-[#4c4c4c]">
                        Total Disputed Amount
                      </td>
                      <td className="px-3 py-2 font-semibold text-[#1e8fff]">{formatCurrency(totalDisputed)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          <SectionTitle title="System Facts" />
          <p className="text-sm text-[#4c4c4c]">
            The following actions were taken by the bank upon complaint receipt and during investigation.
          </p>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Detection / Authorization Feedback Detail</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm border">
                <thead className="bg-[#2064b7] text-white">
                  <tr>
                    <th className="px-3 py-2 text-left">Detail</th>
                    <th className="px-3 py-2 text-left">Required?</th>
                    <th className="px-3 py-2 text-left">Feedback Received (If Yes)</th>
                    <th className="px-3 py-2 text-left">Rationale (If Selected No)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-3 py-2">Detection / Authorization Feedback</td>
                    <td className="px-3 py-2">{detectionFeedbackRequired.toUpperCase()}</td>
                    <td className="px-3 py-2">{detectionFeedback}</td>
                    <td className="px-3 py-2">{detectionRationale}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Customer Channels Blocking Detail</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-[#2064b7] text-white">
                  <tr>
                    <th className="px-3 py-2 text-left">Channel</th>
                    <th className="px-3 py-2 text-left">Blocking Date / Time</th>
                  </tr>
                </thead>
                <tbody>
                  {channelsBlockingRows.map((row, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-3 py-2">{row.channel}</td>
                      <td className="px-3 py-2">{row.datetime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Other Details</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-[#2064b7] text-white">
                  <tr>
                    <th className="px-3 py-2 text-left">Channel</th>
                    <th className="px-3 py-2 text-left">Date / Time</th>
                  </tr>
                </thead>
                <tbody>
                  {otherDetailsRows.map((row, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-3 py-2">{row.channel}</td>
                      <td className="px-3 py-2">{row.datetime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Customer Account Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {customerAccountProfileRows.map((row, idx) => (
                <Row key={idx} label={row.label} value={row.value} />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Details of User</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-[#2064b7] text-white">
                  <tr>
                    <th className="px-3 py-2 text-left">Action</th>
                    <th className="px-3 py-2 text-left">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {detailsOfUserRows.map((row, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-3 py-2">{row.action}</td>
                      <td className="px-3 py-2">{row.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">P-II Data Analysis / Staff Review</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-[#2064b7] text-white">
                  <tr>
                    <th className="px-3 py-2 text-left">Action</th>
                    <th className="px-3 py-2 text-left">Status / Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {piiDataRows.map((row, idx) => (
                    <tr key={idx} className="border-t align-top">
                      <td className="px-3 py-2">{row.action}</td>
                      <td className="px-3 py-2">{row.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="space-y-2 text-sm text-[#4c4c4c]">
            <p><span className="font-semibold text-[#2064b7] uppercase">Communication with xxx Bank:</span> {caseData.communication_with_bank || 'Data not available/detailed in source documents.'}</p>
            <p><span className="font-semibold text-[#2064b7] uppercase">Communication with On-us A/c # xxxxx:</span> {caseData.communication_with_onus || 'Data not available/detailed in source documents.'}</p>
            <p><span className="font-semibold text-[#2064b7] uppercase">Communication with Merchant against 3D/POS secure activities:</span> {caseData.communication_with_merchant || 'Data not available/detailed in source documents.'}</p>
          </div>

          <SectionTitle title="Observations & Conclusion" />
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Observation & Conclusion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p><span className="font-semibold text-[#2064b7]">Observation:</span> {observations}</p>
              <p><span className="font-semibold text-[#2064b7]">Conclusion:</span> {conclusions}</p>
              <p><span className="font-semibold text-[#2064b7] uppercase">Control Breaches:</span> {controlBreaches}</p>
              <p><span className="font-semibold text-[#2064b7] uppercase">Control Weaknesses:</span> {controlWeaknesses}</p>
              <p><span className="font-semibold text-[#2064b7] uppercase">Root Cause:</span> {rootCause}</p>
              <p><span className="font-semibold text-[#2064b7] uppercase">Recommendation:</span> {recommendation}</p>
              <p><span className="font-semibold text-[#2064b7]">Action Owner:</span> {actionOwner} — {actionStatus}</p>
            </CardContent>
          </Card>

          <SectionTitle title="Annx" />
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Attachments</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3 text-sm">
              {annexFiles.map((file, idx) => (
                <span key={idx} className="inline-flex items-center rounded border px-3 py-1.5 bg-muted/30">
                  <FileText className="mr-2 h-3.5 w-3.5" />
                  {file.name || `attachment-${idx + 1}.pdf`}
                </span>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Investigation</DialogTitle>
            <DialogDescription>
              Attach your signature to save and approve this case.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <label className="text-sm font-medium">Signature *</label>

            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={signatureMode === 'upload' ? 'default' : 'outline'}
                onClick={() => setSignatureMode('upload')}
              >
                Upload
              </Button>
              <Button
                type="button"
                variant={signatureMode === 'type' ? 'default' : 'outline'}
                onClick={() => setSignatureMode('type')}
              >
                Write Name
              </Button>
              <Button
                type="button"
                variant={signatureMode === 'draw' ? 'default' : 'outline'}
                onClick={() => setSignatureMode('draw')}
              >
                E-Sign
              </Button>
            </div>

            {signatureMode === 'upload' && (
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center cursor-pointer rounded-md border px-3 py-2 text-sm hover:bg-muted">
                  <Upload className="mr-2 h-4 w-4" />
                  Attach File
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => setSignatureFile(e.target.files?.[0] || null)}
                  />
                </label>
                <span className="text-xs text-muted-foreground truncate max-w-[260px]">
                  {signatureFile?.name || 'No file selected'}
                </span>
              </div>
            )}

            {signatureMode === 'type' && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Type your full name as signature</label>
                <input
                  type="text"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
            )}

            {signatureMode === 'draw' && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Draw signature using touch or mouse</label>
                <canvas
                  ref={signatureCanvasRef}
                  width={520}
                  height={160}
                  className="w-full rounded-md border bg-white touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={drawSignature}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={drawSignature}
                  onTouchEnd={stopDrawing}
                />
                <div className="flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={clearDrawnSignature}>
                    Clear
                  </Button>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">Use any one option above (Upload OR Write Name OR E-Sign).</p>

            <Textarea
              placeholder="Approval comments (optional)"
              value={approveNote}
              onChange={(e) => setApproveNote(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>Cancel</Button>
            <Button onClick={handleApprove}>
              Save & Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Investigation</DialogTitle>
            <DialogDescription>
              Provide reason before sending it back to investigator.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            placeholder="Enter rejection reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SupervisorInvestigationReportPage;
