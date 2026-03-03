import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Play,
  Eye,
  AlertTriangle,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataMasker } from '@/components/shared/DataMasker';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { fraudTypes, channels } from '@/data/mockCases';
import { getAllCases, getInvestigatorPool, upsertCase } from '@/data/caseStorage';
import { toast } from 'sonner';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function CaseDetailPage({ currentRole = 'investigator', currentUser = null }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const caseData = getAllCases().find((c) => c.id === parseInt(id));
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
  const investigators = useMemo(() => getInvestigatorPool(), []);
  const [currentAssignee, setCurrentAssignee] = useState(caseData.assigned_to || null);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState(
    String(caseData.assigned_to?.id ?? investigators[0]?.id ?? '')
  );
  const isSubmittedForSupervisor = ['pending_review', 'approved', 'rejected', 'closed'].includes(caseData.status);
  const isAssignedInvestigator =
    !isSupervisor &&
    currentRole === 'investigator' &&
    String(currentUser?.name || '').trim().toLowerCase() ===
      String(currentAssignee?.name || '').trim().toLowerCase();
  const canInvestigatorStart = isSupervisor || currentRole !== 'investigator' || isAssignedInvestigator;
  const investigationPath = isSupervisor
    ? (isSubmittedForSupervisor ? `/cases/${id}/supervisor-report` : `/cases/${id}`)
    : `/cases/${id}/investigation`;
  const primaryActionLabel = isSupervisor
    ? (isSubmittedForSupervisor ? 'View Investigation' : 'Awaiting Submission')
    : !canInvestigatorStart
      ? 'Assigned to Another IO'
    : caseData.status === 'open'
      ? 'Start Investigation'
      : 'View Investigation';

  const handleReassignInvestigator = () => {
    const nextAssignee = investigators.find((io) => String(io.id) === String(selectedAssigneeId));
    if (!nextAssignee) return;

    upsertCase({
      ...caseData,
      assigned_to: nextAssignee,
    });
    setCurrentAssignee(nextAssignee);

    toast.success('Assignment updated', {
      description: `Case reassigned to ${nextAssignee.name}`,
    });
  };

  const showSupervisorTransactionActions = false;

  const transactionRows = caseData.transactions.map((txn) => {
    const branchName = txn.branch_name || txn.branch || caseData.branch_name || (caseData.branch_code ? `Branch ${caseData.branch_code}` : '—');
    const ftdhId = txn.ftdh_id || caseData.ftdh_id || '—';

    return {
      ...txn,
      branchName,
      ftdhId,
    };
  });

  return (
    <div className="space-y-4">
      <Card className="border-[#dae1e7] bg-[#f9fafb]">
        <CardContent className="p-3 sm:p-4">
          <div className="overflow-hidden rounded-[14px] border-2 border-[#dae1e7] bg-white">
            <div className="flex items-center justify-between gap-3 bg-[#2064b7] px-3 py-2.5 text-white sm:px-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white hover:bg-white/15 hover:text-white"
                  onClick={() => navigate('/cases')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#4c4c4c]">
                  {(caseData.customer.name || 'U').charAt(0).toUpperCase()}
                </div>
                <p className="text-sm font-medium uppercase tracking-wide">
                  {caseData.customer.name}
                </p>
                <StatusBadge status={caseData.status} />
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  className="h-8 bg-[#2592ff] px-3 text-xs text-white hover:bg-[#1887f6]"
                  onClick={() => navigate(investigationPath)}
                  disabled={(isSupervisor && !isSubmittedForSupervisor) || !canInvestigatorStart}
                >
                  {isSupervisor ? (
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                  ) : caseData.status === 'open' ? (
                    <Play className="mr-1.5 h-3.5 w-3.5" />
                  ) : (
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {primaryActionLabel}
                </Button>
                {!isSupervisor && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/15 hover:text-white"
                    onClick={() => navigate(`/cases/${id}/edit`)}
                    title="Edit case"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {isSupervisor && (
              <div className="mx-3 mt-3 rounded-xl border border-[#dae1e7] bg-[#f9fafb] p-3 sm:mx-4">
                <p className="text-xs font-medium text-[#6b7280]">Investigation Officer Assignment</p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Select value={selectedAssigneeId} onValueChange={setSelectedAssigneeId}>
                    <SelectTrigger className="w-full sm:w-[260px] bg-white border-[#dae1e7]">
                      <SelectValue placeholder="Select investigator" />
                    </SelectTrigger>
                    <SelectContent>
                      {investigators.map((io) => (
                        <SelectItem key={io.id} value={String(io.id)}>{io.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleReassignInvestigator}
                    disabled={String(currentAssignee?.id ?? '') === String(selectedAssigneeId)}
                    className="bg-[#2064b7] hover:bg-[#1a54a1]"
                  >
                    Update Assignment
                  </Button>
                </div>
              </div>
            )}

            {!isSupervisor && currentRole === 'investigator' && !isAssignedInvestigator && (
              <div className="mx-3 mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 sm:mx-4">
                This case is assigned to {currentAssignee?.name || 'another investigator'}. You can view details, but only the assigned investigator can start or continue investigation.
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 px-4 py-5 sm:grid-cols-4 lg:grid-cols-7">
              <div>
                <p className="text-xs text-muted-foreground">
                  {isSupervisor ? 'Card Number' : 'Account Number'}
                </p>
                <DataMasker
                  value={isSupervisor ? caseData.customer.card_number : caseData.customer.account_number}
                  type={isSupervisor ? 'card' : 'account'}
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">CNIC</p>
                <DataMasker value={caseData.customer.cnic} type="cnic" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Customer City</p>
                <p className="font-medium text-[#4c4c4c]">{caseData.customer.city || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Customer Region</p>
                <p className="font-medium text-[#4c4c4c]">{caseData.customer.region || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Reference Number</p>
                <p className="font-medium text-[#4c4c4c]">{caseData.reference_number || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fraud Type</p>
                <p className="font-medium text-[#4c4c4c]">{fraudTypeLabel || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Complaint Number</p>
                <p className="font-medium text-[#4c4c4c]">{caseData.complaint_number || '—'}</p>
              </div>
            </div>

            <div className="mx-3 mb-3 overflow-hidden rounded-[12px] border border-[#dae1e7] sm:mx-4 sm:mb-4">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#edf1f4] text-left text-[#4c4c4c]">
                      <th className="px-4 py-3 font-medium">Transaction ID</th>
                      {isSupervisor ? (
                        <>
                          <th className="px-4 py-3 font-medium">Date &amp; Time</th>
                          <th className="px-4 py-3 font-medium">Amount</th>
                          <th className="px-4 py-3 font-medium">Beneficiary</th>
                          <th className="px-4 py-3 font-medium">Branch</th>
                        </>
                      ) : (
                        <>
                          <th className="px-4 py-3 font-medium">Branch</th>
                          <th className="px-4 py-3 font-medium">Amount</th>
                          <th className="px-4 py-3 font-medium">Beneficiary</th>
                          <th className="px-4 py-3 font-medium">Date &amp; Time</th>
                        </>
                      )}
                      <th className="px-4 py-3 font-medium">FTDH ID</th>
                      {showSupervisorTransactionActions && (
                        <th className="px-4 py-3 font-medium">Action</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {transactionRows.map((txn) => (
                      <tr key={txn.id} className="border-t border-[#dae1e7] text-[#4c4c4c]">
                        <td className="px-4 py-3 align-top font-medium">{txn.transaction_id}</td>

                        {isSupervisor ? (
                          <>
                            <td className="px-4 py-3 align-top">
                              <p>{format(new Date(txn.transaction_date), 'dd/MM/yyyy')}</p>
                              <p className="text-xs text-muted-foreground">
                                {txn.transaction_time?.slice(0, 5) || '--:--'}
                              </p>
                            </td>
                            <td className="px-4 py-3 align-top font-medium text-[#2592ff]">
                              {formatCurrency(txn.disputed_amount)}
                            </td>
                            <td className="px-4 py-3 align-top">
                              <p>{txn.beneficiary_bank || '—'}</p>
                              <p className="text-xs text-muted-foreground">
                                <DataMasker value={txn.beneficiary_account} type="account" />
                              </p>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <p>{txn.branchName}</p>
                              <p className="text-xs text-muted-foreground">{caseData.branch_code || '—'}</p>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 align-top">
                              <p>{txn.branchName}</p>
                              <p className="text-xs text-muted-foreground">{caseData.branch_code || '—'}</p>
                            </td>
                            <td className="px-4 py-3 align-top font-medium text-[#2592ff]">
                              {formatCurrency(txn.disputed_amount)}
                            </td>
                            <td className="px-4 py-3 align-top">
                              <p>{txn.beneficiary_bank || '—'}</p>
                              <p className="text-xs text-muted-foreground">
                                <DataMasker value={txn.beneficiary_account} type="account" />
                              </p>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <p>{format(new Date(txn.transaction_date), 'dd/MM/yyyy')}</p>
                              <p className="text-xs text-muted-foreground">
                                {txn.transaction_time?.slice(0, 5) || '--:--'}
                              </p>
                            </td>
                          </>
                        )}

                        <td className="px-4 py-3 align-top font-semibold">{txn.ftdhId}</td>

                        {showSupervisorTransactionActions && (
                          <td className="px-4 py-3 align-top">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center rounded-full bg-[#56ca00] px-2.5 py-1 text-xs font-medium text-white">
                                Done
                              </span>
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit transaction">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="Delete transaction">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-3 px-1" />
        </CardContent>
      </Card>
    </div>
  );
}

export default CaseDetailPage;
