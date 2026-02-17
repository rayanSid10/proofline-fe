import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  FileText,
  CreditCard,
  ClipboardCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { DataMasker } from '@/components/shared/DataMasker';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { mockCases, fraudTypes, channels } from '@/data/mockCases';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
  }).format(amount);
}

// Mock investigation data
const mockInvestigation = {
  customerContact: {
    cxCallDatetime: '2025-02-01T10:30:00',
    initialStance: 'Denies making transaction',
    ioCallMade: true,
    ioCallDatetime: '2025-02-02T14:00:00',
    contactEstablished: true,
    customerStanceIO: 'Customer maintains they did not authorize the transaction. Claims to have been at work during the disputed time.',
  },
  deviceLocation: {
    deviceChanged: 'yes',
    locationChanged: 'yes',
    tpinChanged: 'no',
    passwordChanged: 'no',
    newBeneficiaryAdded: 'yes',
  },
  observations: [
    'New device was detected during the disputed transactions.',
    'Transaction location differs from customer\'s usual patterns.',
    'New beneficiary was added shortly before the disputed transactions.',
  ],
  conclusion: {
    fraudTypeConfirmed: 'Account Takeover',
    rootCause: 'SIM Swap Fraud',
    liability: 'Bank',
    recommendation: 'Compensation Review',
    conclusionNotes: 'Based on the investigation findings, the customer appears to be a victim of SIM swap fraud. The fraudulent device and location patterns indicate unauthorized access. Recommend full compensation.',
  },
};

export function SupervisorReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const caseData = mockCases.find((c) => c.id === parseInt(id));

  const [comments, setComments] = useState('');
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleApprove = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success('Case Approved', {
      description: `Case ${caseData.reference_number} has been approved and closed.`,
    });

    setShowApproveDialog(false);
    navigate('/cases');
  };

  const handleReject = async () => {
    if (!comments.trim()) {
      toast.error('Comments required', {
        description: 'Please provide rejection comments.',
      });
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success('Case Rejected', {
      description: `Case ${caseData.reference_number} has been returned to the investigator.`,
    });

    setShowRejectDialog(false);
    navigate('/cases');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/cases/${id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">Supervisor Review</h2>
              <StatusBadge status={caseData.status} />
            </div>
            <p className="text-muted-foreground mt-1">
              {caseData.reference_number} &bull; {caseData.customer.name}
            </p>
          </div>
        </div>
      </div>

      {/* Alert */}
      <Alert>
        <ClipboardCheck className="h-4 w-4" />
        <AlertTitle>Review Required</AlertTitle>
        <AlertDescription>
          Please review the investigation findings and make a decision. This case has been submitted for your approval.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Case Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Case Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Reference</p>
                  <p className="font-medium">{caseData.reference_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{caseData.customer.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fraud Type</p>
                  <p className="font-medium">{fraudTypeLabel}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Channel</p>
                  <p className="font-medium">{channelLabel}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Account</p>
                  <DataMasker value={caseData.customer.account_number} type="account" />
                </div>
                <div>
                  <p className="text-muted-foreground">Total Disputed</p>
                  <p className="font-medium text-lg">{formatCurrency(caseData.total_disputed_amount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Transactions</p>
                  <p className="font-medium">{caseData.transactions.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Assigned To</p>
                  <p className="font-medium">{caseData.assigned_to?.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investigation Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Investigation Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">CX Call</p>
                  <p className="font-medium">
                    {format(new Date(mockInvestigation.customerContact.cxCallDatetime), 'dd MMM yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Initial Stance</p>
                  <p className="font-medium">{mockInvestigation.customerContact.initialStance}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">IO Call Made</p>
                  <Badge variant={mockInvestigation.customerContact.ioCallMade ? 'default' : 'secondary'}>
                    {mockInvestigation.customerContact.ioCallMade ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Contact Established</p>
                  <Badge variant={mockInvestigation.customerContact.contactEstablished ? 'default' : 'secondary'}>
                    {mockInvestigation.customerContact.contactEstablished ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-2">Customer Statement</p>
                <p className="text-sm bg-muted p-3 rounded-lg">
                  {mockInvestigation.customerContact.customerStanceIO}
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Device Changed</p>
                  <Badge variant={mockInvestigation.deviceLocation.deviceChanged === 'yes' ? 'destructive' : 'secondary'}>
                    {mockInvestigation.deviceLocation.deviceChanged}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Location Changed</p>
                  <Badge variant={mockInvestigation.deviceLocation.locationChanged === 'yes' ? 'destructive' : 'secondary'}>
                    {mockInvestigation.deviceLocation.locationChanged}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">T-PIN Changed</p>
                  <Badge variant={mockInvestigation.deviceLocation.tpinChanged === 'yes' ? 'destructive' : 'secondary'}>
                    {mockInvestigation.deviceLocation.tpinChanged}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">New Beneficiary</p>
                  <Badge variant={mockInvestigation.deviceLocation.newBeneficiaryAdded === 'yes' ? 'destructive' : 'secondary'}>
                    {mockInvestigation.deviceLocation.newBeneficiaryAdded}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observations */}
          <Card>
            <CardHeader>
              <CardTitle>Observations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {mockInvestigation.observations.map((obs, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Proposed Conclusion */}
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Proposed Conclusion
              </CardTitle>
              <CardDescription>
                Investigator's recommendation for this case
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fraud Type Confirmed</p>
                  <p className="font-medium">{mockInvestigation.conclusion.fraudTypeConfirmed}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Root Cause</p>
                  <p className="font-medium">{mockInvestigation.conclusion.rootCause}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Liability</p>
                  <Badge variant={
                    mockInvestigation.conclusion.liability === 'Bank' ? 'destructive' :
                    mockInvestigation.conclusion.liability === 'Customer' ? 'secondary' : 'default'
                  }>
                    {mockInvestigation.conclusion.liability}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recommendation</p>
                  <p className="font-medium">{mockInvestigation.conclusion.recommendation}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Conclusion Notes</p>
                <p className="text-sm bg-muted p-3 rounded-lg">
                  {mockInvestigation.conclusion.conclusionNotes}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Decision Panel */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Decision</CardTitle>
              <CardDescription>
                Approve or reject this investigation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="comments">Review Comments</Label>
                <Textarea
                  id="comments"
                  placeholder="Enter your comments (required for rejection)..."
                  rows={4}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => setShowApproveDialog(true)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowRejectDialog(true)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Your decision will be logged in the audit trail
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Case</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this investigation? The case will be marked as approved and closed.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Approving: {caseData.reference_number}</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Disputed Amount: {formatCurrency(caseData.total_disputed_amount)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Approving...' : 'Confirm Approval'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Case</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this investigation? The case will be returned to the investigator for revision.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Rejecting: {caseData.reference_number}</span>
              </div>
            </div>
            {!comments.trim() && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Please provide rejection comments before proceeding.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting || !comments.trim()}
            >
              {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SupervisorReviewPage;
