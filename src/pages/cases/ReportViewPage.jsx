import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  FileText,
  Printer,
  Download,
  AlertTriangle,
  CheckCircle,
  Building,
  User,
  CreditCard,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { DataMasker } from '@/components/shared/DataMasker';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { fraudTypes, channels } from '@/data/mockCases';
import { getAllCases } from '@/data/caseStorage';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
  }).format(amount);
}

const actionLabels = {
  device_blocked: 'Device Blocked',
  mb_blocked: 'Mobile Banking Blocked',
  ib_blocked: 'Internet Banking Blocked',
  dc_blocked: 'Debit Card Blocked',
  sim_block_requested: 'SIM Block Requested',
  pta_reported: 'PTA Reported',
  ftdh_filed: 'FTDH Filed',
};

// Mock investigation findings
const mockFindings = {
  customerContact: {
    cxCallDatetime: '2025-02-01T10:30:00',
    initialStance: 'Denies making transaction',
    ioCallMade: true,
    ioCallDatetime: '2025-02-02T14:00:00',
    contactEstablished: true,
    customerCli: '03001234567',
    customerStanceIO: 'Customer maintains they did not authorize the transaction. Claims to have been at work during the disputed time. Provided employment verification.',
  },
  deviceLocation: {
    deviceChanged: 'Yes',
    locationChanged: 'Yes',
    tpinChanged: 'No',
    passwordChanged: 'No',
    biometricAttempts: 'Multiple',
    loginAttempts: 'Multiple',
    newBeneficiaryAdded: 'Yes',
  },
  observations: [
    'New device was detected during the disputed transactions.',
    'Transaction location differs from customer\'s usual patterns.',
    'New beneficiary was added shortly before the disputed transactions.',
    'Multiple failed biometric attempts detected before successful login.',
  ],
  conclusion: {
    fraudTypeConfirmed: 'Account Takeover',
    rootCause: 'SIM Swap Fraud',
    liability: 'Bank',
    recommendation: 'Compensation Review',
    conclusionNotes: 'Based on the investigation findings, the customer appears to be a victim of SIM swap fraud. The fraudulent device and location patterns indicate unauthorized access. Customer has provided satisfactory evidence supporting their claim. Recommend full compensation.',
  },
};

export function ReportViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const caseData = getAllCases().find((c) => c.id === parseInt(id));

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

  const fraudTypeLabel =
    fraudTypes.find((t) => t.value === caseData.fraud_type)?.label ||
    caseData.fraud_type;
  const channelLabel =
    channels.find((c) => c.value === caseData.channel)?.label || caseData.channel;

  const handleGeneratePDF = () => {
    toast.success('PDF Generated', {
      description: `Investigation report for ${caseData.reference_number} has been generated.`,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header - Hidden in print */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between print:hidden">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/cases/${id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Investigation Report</h2>
            <p className="text-muted-foreground mt-1">
              {caseData.reference_number}
            </p>
          </div>
        </div>
        <div className="flex gap-2 ml-12 sm:ml-0">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button onClick={handleGeneratePDF}>
            <Download className="mr-2 h-4 w-4" />
            Generate PDF
          </Button>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white border rounded-lg shadow-sm print:shadow-none print:border-0">
        {/* Report Header */}
        <div className="p-6 border-b bg-muted/30 print:bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary rounded-lg print:bg-gray-200">
                <Shield className="h-8 w-8 text-primary-foreground print:text-gray-800" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">ProofLine Bank</h1>
                <p className="text-muted-foreground">Fraud Investigation Unit</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Report Generated</p>
              <p className="font-medium">{format(new Date(), 'dd MMM yyyy HH:mm')}</p>
            </div>
          </div>
        </div>

        {/* Report Title */}
        <div className="p-6 border-b text-center">
          <h2 className="text-xl font-bold">INVESTIGATION REPORT</h2>
          <p className="text-lg font-medium text-primary mt-1">{caseData.reference_number}</p>
          <div className="mt-2">
            <StatusBadge status={caseData.status} />
          </div>
        </div>

        {/* Case Information */}
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Case Information
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Reference Number</p>
              <p className="font-medium">{caseData.reference_number}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Complaint Number</p>
              <p className="font-medium">{caseData.complaint_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Date Received</p>
              <p className="font-medium">{format(new Date(caseData.case_received_date), 'dd MMM yyyy')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Channel</p>
              <p className="font-medium">{channelLabel}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Fraud Type</p>
              <p className="font-medium">{fraudTypeLabel}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Disputed</p>
              <p className="font-medium">{formatCurrency(caseData.total_disputed_amount)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Investigator</p>
              <p className="font-medium">{caseData.assigned_to?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Date Created</p>
              <p className="font-medium">{format(new Date(caseData.created_at), 'dd MMM yyyy')}</p>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            Customer Details
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p className="font-medium">{caseData.customer.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">CNIC</p>
              <DataMasker value={caseData.customer.cnic} type="cnic" />
            </div>
            <div>
              <p className="text-muted-foreground">Mobile</p>
              <DataMasker value={caseData.customer.mobile} type="mobile" />
            </div>
            <div>
              <p className="text-muted-foreground">Account Number</p>
              <DataMasker value={caseData.customer.account_number} type="account" />
            </div>
            <div>
              <p className="text-muted-foreground">Card Number</p>
              <DataMasker value={caseData.customer.card_number} type="card" />
            </div>
            <div>
              <p className="text-muted-foreground">City</p>
              <p className="font-medium">{caseData.customer.city}</p>
            </div>
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Disputed Transactions
          </h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Beneficiary Bank</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {caseData.transactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="font-mono text-sm">
                      {txn.transaction_id}
                    </TableCell>
                    <TableCell>
                      {format(new Date(txn.transaction_date), 'dd MMM yyyy')}{' '}
                      {txn.transaction_time?.slice(0, 5)}
                    </TableCell>
                    <TableCell>{txn.channel}</TableCell>
                    <TableCell>{txn.beneficiary_bank}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(txn.disputed_amount)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={4} className="font-medium">
                    Total Disputed Amount
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(caseData.total_disputed_amount)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Investigation Findings */}
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold mb-4">Investigation Findings</h3>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Customer Contact</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
                <div>
                  <p className="text-muted-foreground">CX Call</p>
                  <p className="font-medium">
                    {format(new Date(mockFindings.customerContact.cxCallDatetime), 'dd MMM yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Initial Stance</p>
                  <p className="font-medium">{mockFindings.customerContact.initialStance}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">IO Call Made</p>
                  <p className="font-medium">{mockFindings.customerContact.ioCallMade ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Contact Established</p>
                  <p className="font-medium">{mockFindings.customerContact.contactEstablished ? 'Yes' : 'No'}</p>
                </div>
              </div>
              <p className="text-sm mt-3 p-3 bg-muted/20 rounded-lg">
                <strong>Customer Statement:</strong> {mockFindings.customerContact.customerStanceIO}
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Device & Location Analysis</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
                <div>
                  <p className="text-muted-foreground">Device Changed</p>
                  <p className="font-medium">{mockFindings.deviceLocation.deviceChanged}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Location Changed</p>
                  <p className="font-medium">{mockFindings.deviceLocation.locationChanged}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">T-PIN Changed</p>
                  <p className="font-medium">{mockFindings.deviceLocation.tpinChanged}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">New Beneficiary</p>
                  <p className="font-medium">{mockFindings.deviceLocation.newBeneficiaryAdded}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Taken */}
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold mb-4">Actions Taken</h3>
          {caseData.actions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No actions recorded.</p>
          ) : (
            <div className="space-y-2">
              {caseData.actions.map((action) => (
                <div key={action.id} className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{actionLabels[action.action_type]}</span>
                  <span className="text-muted-foreground">-</span>
                  <span>{format(new Date(action.performed_at), 'dd MMM yyyy HH:mm')}</span>
                  <span className="text-muted-foreground">by {action.performed_by}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Observations */}
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold mb-4">Observations</h3>
          <ul className="space-y-2">
            {mockFindings.observations.map((obs, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="font-medium text-muted-foreground">{index + 1}.</span>
                <span>{obs}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Conclusion */}
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold mb-4">Conclusion</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
            <div>
              <p className="text-muted-foreground">Fraud Type Confirmed</p>
              <p className="font-medium">{mockFindings.conclusion.fraudTypeConfirmed}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Root Cause</p>
              <p className="font-medium">{mockFindings.conclusion.rootCause}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Liability</p>
              <Badge variant={
                mockFindings.conclusion.liability === 'Bank' ? 'destructive' :
                mockFindings.conclusion.liability === 'Customer' ? 'secondary' : 'default'
              }>
                {mockFindings.conclusion.liability}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Recommendation</p>
              <p className="font-medium">{mockFindings.conclusion.recommendation}</p>
            </div>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-sm">{mockFindings.conclusion.conclusionNotes}</p>
          </div>
        </div>

        {/* Signatures */}
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-6">Signatures</h3>
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <div className="border-b border-gray-400 mb-2 pb-8"></div>
              <p className="font-medium">{caseData.assigned_to?.name}</p>
              <p className="text-sm text-muted-foreground">Investigating Officer</p>
              <p className="text-xs text-muted-foreground mt-1">
                Date: {format(new Date(), 'dd MMM yyyy')}
              </p>
            </div>
            <div className="text-center">
              <div className="border-b border-gray-400 mb-2 pb-8"></div>
              <p className="font-medium">Supervisor Name</p>
              <p className="text-sm text-muted-foreground">Reviewing Supervisor</p>
              <p className="text-xs text-muted-foreground mt-1">
                Date: {format(new Date(), 'dd MMM yyyy')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/30 text-center text-xs text-muted-foreground">
          <p>This is a confidential document. Unauthorized distribution is prohibited.</p>
          <p className="mt-1">ProofLine Bank - Fraud Investigation Unit - {format(new Date(), 'yyyy')}</p>
        </div>
      </div>
    </div>
  );
}

export default ReportViewPage;
