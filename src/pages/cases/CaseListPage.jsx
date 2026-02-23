import { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Upload,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Eye,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataMasker } from '@/components/shared/DataMasker';
import { mockCases, caseStatuses } from '@/data/mockCases';
import { searchCustomers } from '@/data/mockCustomers';
import { ImportModal } from '@/components/modals/ImportModal';
import { NoRecordFoundDialog } from '@/components/modals/NoRecordFoundDialog';
import { SingleAccountDialog } from '@/components/modals/SingleAccountDialog';
import { MultipleAccountsDialog } from '@/components/modals/MultipleAccountsDialog';

// ─── Status → visual config ──────────────────────────────────────────────────

const investigationConfig = {
  in_progress: {
    label: 'Start Investigation',
    bg: 'bg-[#22C55E]',
    text: 'text-white',
    rowBg: 'bg-[#E8F8EF]',
  },
  pending_review: {
    label: 'Under Investigation',
    bg: 'bg-[#FFB400]',
    text: 'text-white',
    rowBg: 'bg-[#FFF8E5]',
  },
  completed: {
    label: 'Revision needed',
    bg: 'bg-[#E21F0B]',
    text: 'text-white',
    rowBg: 'bg-[#FDE8E6]',
  },
  closed: {
    label: 'Under Review',
    bg: 'bg-[#F97316]',
    text: 'text-white',
    rowBg: 'bg-[#FFF0E5]',
  },
};

const PAGE_SIZE = 10;

// ─── Component ──────────────────────────────────────────────────────────────

export function CaseListPage({ currentRole = 'investigator' }) {
  const navigate = useNavigate();

  // ─── State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRows, setSelectedRows] = useState([]);
  const [page, setPage] = useState(0);

  // ─── Modal / Dialog State
  const [importOpen, setImportOpen] = useState(false);
  const [noRecordOpen, setNoRecordOpen] = useState(false);
  const [singleAccountOpen, setSingleAccountOpen] = useState(false);
  const [multiAccountOpen, setMultiAccountOpen] = useState(false);
  const [foundAccounts, setFoundAccounts] = useState([]);

  // ─── Table filtering
  const filteredCases = useMemo(() => {
    return mockCases.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      return true;
    });
  }, [statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCases.length / PAGE_SIZE));
  const pagedCases = filteredCases.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // ─── Search / Lookup Logic ─────────────────────────────────────────────────
  const handleSearchSubmit = useCallback(() => {
    const query = searchQuery.trim();
    if (!query) return;

    // 1) Check dispute database first
    const matchingCase = mockCases.find((c) => {
      const cust = c.customer;
      return (
        cust.cnic?.includes(query) ||
        cust.account_number?.includes(query) ||
        cust.card_number?.includes(query)
      );
    });

    if (matchingCase) {
      if (['open', 'in_progress', 'pending_review'].includes(matchingCase.status)) {
        navigate(`/cases/${matchingCase.id}`);
        return;
      }
    }

    // 2) Core Banking lookup
    const customers = searchCustomers(query);
    if (customers.length === 0) {
      setNoRecordOpen(true);
      return;
    }

    const customer = customers[0];
    const accounts = customer.accounts || [];
    if (accounts.length === 0) {
      setNoRecordOpen(true);
    } else if (accounts.length === 1) {
      setFoundAccounts(accounts);
      setSingleAccountOpen(true);
    } else {
      setFoundAccounts(accounts);
      setMultiAccountOpen(true);
    }
  }, [searchQuery, navigate]);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    }
  };

  // ─── Row Selection
  const handleToggleRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    if (selectedRows.length === pagedCases.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(pagedCases.map((c) => c.id));
    }
  };

  // ─── Dialog proceed handlers
  const handleSingleAccountProceed = (data) => {
    setSingleAccountOpen(false);
    navigate('/cases/create', {
      state: { accounts: [data.account], dateFrom: data.dateFrom, dateTo: data.dateTo },
    });
  };

  const handleMultiAccountProceed = (selectedData) => {
    setMultiAccountOpen(false);
    navigate('/cases/create', { state: { selectedAccounts: selectedData } });
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)] font-['Inter',sans-serif]">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[22px] font-bold text-gray-900 leading-tight">
                IB / MB Dispute
              </h1>
              <span className="text-[10px] font-semibold bg-[#22C55E] text-white px-1.5 py-0.5 rounded-full">
                {filteredCases.length} New
              </span>
            </div>
            <p className="text-[13px] text-gray-500 mt-0.5">IB / MB Complaints</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-9 px-4 text-sm border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={() => setImportOpen(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button
            className="h-9 px-4 text-sm bg-[#2064B7] hover:bg-[#2064B7]/90 text-white shadow-none"
            asChild
          >
            <Link to="/cases/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Dispute
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Search + Filters Row (Rectangle 254) ────────────────── */}
      <div className="flex items-center gap-3 mb-4 bg-[#F8F8F8] rounded-lg border border-gray-200 px-4 py-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by customer name, card number, reference number, or CNIC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="pl-10 h-9 text-sm bg-transparent border-gray-200 placeholder:text-gray-400"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[130px] h-9 text-sm bg-white border-gray-200 shrink-0">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {caseStatuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          className="h-9 px-3 text-sm border-gray-200 text-gray-600 hover:bg-gray-50 shrink-0"
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          More Filters
        </Button>
      </div>

      {/* ── Cases Table (Rectangle 253) ─────────────────────────── */}
      <div className="flex-1 rounded-lg border border-gray-200 bg-[#F8F8F8] overflow-hidden flex flex-col">
        {/* Table toolbar: select-all + pagination */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={pagedCases.length > 0 && selectedRows.length === pagedCases.length}
              onCheckedChange={handleToggleAll}
            />
            <button
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors"
              title="Delete selected"
              disabled={selectedRows.length === 0}
            >
              <Trash2 className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            </button>
            <button
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1">
          <Table>
            <TableHeader>
              <TableRow className="bg-white hover:bg-white border-b border-gray-100">
                <TableHead className="w-[70px] text-xs text-gray-500 font-medium">Actions</TableHead>
                <TableHead className="text-xs text-gray-500 font-medium">Reference</TableHead>
                <TableHead className="text-xs text-gray-500 font-medium">Customer</TableHead>
                <TableHead className="text-xs text-gray-500 font-medium">CNIC</TableHead>
                <TableHead className="text-xs text-gray-500 font-medium">Account Number</TableHead>
                <TableHead className="text-xs text-gray-500 font-medium">Customer City</TableHead>
                <TableHead className="text-xs text-gray-500 font-medium">Customer Region</TableHead>
                <TableHead className="text-xs text-gray-500 font-medium">Assign to</TableHead>
                <TableHead className="text-xs text-gray-500 font-medium">Investigation Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedCases.length === 0 ? (
                <TableRow className="hover:bg-white">
                  <TableCell colSpan={9} className="h-[340px]">
                    <div className="flex flex-col items-center justify-center text-center py-16">
                      <div className="mb-5 text-gray-300">
                        <svg width="100" height="80" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="8" y="16" width="65" height="42" rx="5" stroke="currentColor" strokeWidth="2" transform="rotate(-12 8 16)" />
                          <rect x="27" y="22" width="65" height="42" rx="5" stroke="currentColor" strokeWidth="2" />
                          <rect x="27" y="32" width="65" height="7" fill="currentColor" opacity="0.25" />
                          <rect x="32" y="46" width="25" height="3" rx="1.5" fill="currentColor" opacity="0.2" />
                          <rect x="32" y="52" width="16" height="3" rx="1.5" fill="currentColor" opacity="0.15" />
                        </svg>
                      </div>
                      <h3 className="text-base font-semibold text-gray-800 mb-1">No disputes yet</h3>
                      <p className="text-sm text-gray-400 max-w-[280px] leading-relaxed">
                        IB/MB Complaint Investigations will appear here once added.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pagedCases.map((caseItem) => {
                  const config = investigationConfig[caseItem.investigation_status] || investigationConfig.in_progress;
                  return (
                    <TableRow
                      key={caseItem.id}
                      className={`cursor-pointer hover:opacity-80 border-b border-gray-100 transition-colors ${config.rowBg}`}
                      onClick={() => navigate(`/cases/${caseItem.id}`)}
                    >
                      {/* Actions: View + Edit icons */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <button
                            className="p-1 rounded hover:bg-gray-100 transition-colors"
                            title="View"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/cases/${caseItem.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4 text-gray-500" />
                          </button>
                          <button
                            className="p-1 rounded hover:bg-gray-100 transition-colors"
                            title="Edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/cases/${caseItem.id}`);
                            }}
                          >
                            <Pencil className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-sm font-medium">
                        <Link
                          to={`/cases/${caseItem.id}`}
                          className="text-[#2064B7] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {caseItem.reference_number}
                        </Link>
                      </TableCell>
                      <TableCell className="py-3 text-sm text-gray-700">
                        {caseItem.customer.name}
                      </TableCell>
                      <TableCell className="py-3 text-sm text-gray-600">
                        <DataMasker value={caseItem.customer.cnic} type="cnic" />
                      </TableCell>
                      <TableCell className="py-3 text-sm text-gray-600">
                        <DataMasker value={caseItem.customer.account_number} type="account" />
                      </TableCell>
                      <TableCell className="py-3 text-sm text-gray-600">
                        {caseItem.customer.city}
                      </TableCell>
                      <TableCell className="py-3 text-sm text-gray-600">
                        {caseItem.customer.region || '—'}
                      </TableCell>
                      <TableCell className="py-3 text-sm text-gray-600">
                        {caseItem.assigned_to?.name || '—'}
                      </TableCell>
                      <TableCell className="py-3">
                        <span
                          className={`inline-block text-[11px] font-semibold px-3 py-1 rounded-full whitespace-nowrap ${config.bg} ${config.text}`}
                        >
                          {config.label}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        {filteredCases.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400 shrink-0">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredCases.length)} of {filteredCases.length} disputes
          </div>
        )}
      </div>

      {/* ── Page Footer ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-4 shrink-0">
        <span>
          © 2025, Made by{' '}
          <span className="text-[#2064B7] font-medium">ProofLine</span>
        </span>
        <div className="flex gap-4">
          <a href="#" className="text-[#2064B7] hover:underline">License</a>
          <a href="#" className="text-[#2064B7] hover:underline">Support</a>
        </div>
      </div>

      {/* ── Modals / Dialogs ────────────────────────────────────── */}
      <ImportModal open={importOpen} onOpenChange={setImportOpen} />
      <NoRecordFoundDialog open={noRecordOpen} onOpenChange={setNoRecordOpen} />
      <SingleAccountDialog
        open={singleAccountOpen}
        onOpenChange={setSingleAccountOpen}
        account={foundAccounts[0] || null}
        onProceed={handleSingleAccountProceed}
      />
      <MultipleAccountsDialog
        open={multiAccountOpen}
        onOpenChange={setMultiAccountOpen}
        accounts={foundAccounts}
        onProceed={handleMultiAccountProceed}
      />
    </div>
  );
}

export default CaseListPage;
