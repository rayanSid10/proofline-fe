import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Play,
  Eye,
  FileText,
  User,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ClipboardCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { DataMasker } from '@/components/shared/DataMasker';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { InvestigationModal } from '@/components/modals/InvestigationModal';
import { mockCases, fraudTypes, channels } from '@/data/mockCases';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

export function CaseDetailPage({ currentRole = 'investigator' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [investigationModalOpen, setInvestigationModalOpen] = useState(false);

  const caseData = mockCases.find((c) => c.id === parseInt(id));
  const isSupervisor = currentRole === 'supervisor' || currentRole === 'admin';

  if (!caseData) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Case not found</h2>
        <p className="text-muted-foreground mt-2">
          The case you're looking for doesn't exist.
        </p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/cases')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{caseData.reference_number}</h2>
              <StatusBadge status={caseData.status} />
            </div>
            <p className="text-muted-foreground mt-1">
              {caseData.customer.name} &bull; {fraudTypeLabel}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 ml-12 sm:ml-0">
          {/* Supervisor: Review Case button for pending_review cases */}
          {isSupervisor && caseData.status === 'pending_review' && (
            <Button asChild className="bg-purple-600 hover:bg-purple-700">
              <Link to={`/cases/${id}/review`}>
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Review Case
              </Link>
            </Button>
          )}

          {/* Investigator: Start Investigation for open cases */}
          {caseData.status === 'open' && (
            <Button onClick={() => setInvestigationModalOpen(true)}>
              <Play className="mr-2 h-4 w-4" />
              Start Investigation
            </Button>
          )}

          {/* View Investigation for non-open cases */}
          {['in_progress', 'pending_review', 'approved', 'rejected', 'closed'].includes(
            caseData.status
          ) && (
            <Button variant="outline" onClick={() => setInvestigationModalOpen(true)}>
              <Eye className="mr-2 h-4 w-4" />
              View Investigation
            </Button>
          )}

          {/* View Report - always available */}
          <Button variant="outline" asChild>
            <Link to={`/cases/${id}/report`}>
              <FileText className="mr-2 h-4 w-4" />
              View Report
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">
            Transactions ({caseData.transactions.length})
          </TabsTrigger>
          <TabsTrigger value="actions">
            Actions ({caseData.actions.length})
          </TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Investigation Summary - Show for cases not in 'open' status */}
          {caseData.status !== 'open' && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Eye className="h-5 w-5" />
                    Investigation Summary
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setInvestigationModalOpen(true)}>
                    View Details
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Fraud Type Confirmed</p>
                    <p className="font-medium">{fraudTypeLabel}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Liability</p>
                    <p className="font-medium">
                      {caseData.status === 'pending_review' ? 'Under Review' :
                       caseData.status === 'approved' ? 'Customer' :
                       caseData.status === 'rejected' ? 'Bank' : 'Pending'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Root Cause</p>
                    <p className="font-medium">
                      {caseData.fraud_type === 'sim_swap' ? 'SIM Swap Fraud' :
                       caseData.fraud_type === 'phishing' ? 'Phishing Attack' :
                       caseData.fraud_type === 'social_engineering' ? 'Social Engineering' :
                       'Under Investigation'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Recommendation</p>
                    <p className="font-medium">
                      {caseData.status === 'approved' || caseData.status === 'closed' ? 'Case Closed' :
                       'Pending Decision'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {/* Customer Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Customer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{caseData.customer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">City</p>
                    <p className="font-medium">{caseData.customer.city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CNIC</p>
                    <DataMasker
                      value={caseData.customer.cnic}
                      type="cnic"
                      allowToggle
                    />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mobile</p>
                    <DataMasker
                      value={caseData.customer.mobile}
                      type="mobile"
                      allowToggle
                    />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Account Number</p>
                    <DataMasker
                      value={caseData.customer.account_number}
                      type="account"
                      allowToggle
                    />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Card Number</p>
                    <DataMasker
                      value={caseData.customer.card_number}
                      type="card"
                      allowToggle
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Case Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5" />
                  Case Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Channel</p>
                    <p className="font-medium">{channelLabel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fraud Type</p>
                    <p className="font-medium">{fraudTypeLabel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Complaint #</p>
                    <p className="font-medium">{caseData.complaint_number || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Disputed</p>
                    <p className="font-medium text-lg">
                      {formatCurrency(caseData.total_disputed_amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Received Date</p>
                    <p className="font-medium">
                      {format(new Date(caseData.case_received_date), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Assigned To</p>
                    <p className="font-medium">
                      {caseData.assigned_to?.name || 'Unassigned'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {caseData.transactions.length}
                </div>
                <p className="text-sm text-muted-foreground">
                  Disputed Transactions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {formatCurrency(caseData.total_disputed_amount)}
                </div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{caseData.actions.length}</div>
                <p className="text-sm text-muted-foreground">Actions Taken</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {Math.floor(
                    (new Date() - new Date(caseData.created_at)) / (1000 * 60 * 60 * 24)
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Days Open</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Disputed Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Beneficiary</TableHead>
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
                        <TableCell>
                          <Badge variant="outline">{txn.channel}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <DataMasker
                              value={txn.beneficiary_account}
                              type="account"
                            />
                            <p className="text-sm text-muted-foreground">
                              {txn.beneficiary_bank}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(txn.disputed_amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>Actions Taken</CardTitle>
            </CardHeader>
            <CardContent>
              {caseData.actions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No actions have been taken yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {caseData.actions.map((action) => (
                    <div
                      key={action.id}
                      className="flex items-start gap-4 p-4 border rounded-lg"
                    >
                      <div
                        className={`p-2 rounded-full ${
                          action.status === 'completed'
                            ? 'bg-green-100'
                            : action.status === 'failed'
                            ? 'bg-red-100'
                            : 'bg-yellow-100'
                        }`}
                      >
                        {action.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : action.status === 'failed' ? (
                          <XCircle className="h-5 w-5 text-red-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {actionLabels[action.action_type] || action.action_type}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {action.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {action.notes}
                        </p>
                        {action.reference_id && (
                          <p className="text-sm mt-1">
                            Reference: <span className="font-mono">{action.reference_id}</span>
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {action.performed_by} &bull;{' '}
                          {format(new Date(action.performed_at), 'dd MMM yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="p-2 rounded-full bg-blue-100">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Case Created</p>
                    <p className="text-sm text-muted-foreground">
                      Case {caseData.reference_number} was created
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {caseData.created_by?.name} &bull;{' '}
                      {format(new Date(caseData.created_at), 'dd MMM yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                {caseData.assigned_to && (
                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="p-2 rounded-full bg-purple-100">
                      <User className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">Case Assigned</p>
                      <p className="text-sm text-muted-foreground">
                        Assigned to {caseData.assigned_to.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        System &bull;{' '}
                        {format(new Date(caseData.created_at), 'dd MMM yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Investigation Modal */}
      <InvestigationModal
        open={investigationModalOpen}
        onOpenChange={setInvestigationModalOpen}
        caseData={caseData}
      />
    </div>
  );
}

export default CaseDetailPage;
