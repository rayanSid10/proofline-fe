import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Upload,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Plus,
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
import { MOCK_FTDH_CASES } from '@/data/mockFTDH';
import {
  FTDHOutwardTypeModal,
  FTDHOutwardSourceModal,
  FTDHOutwardLayeringModal,
} from '@/components/modals/FTDHOutwardModals';

const formatDisplayDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hh}:${mm}:${ss}`;
};

const formatCurrency = (value) => `PKR ${Number(value || 0).toLocaleString('en-PK')}`;

const EmptyStateIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="230" height="230" viewBox="0 0 230 230" fill="none">
    <path d="M130.339 201.978L182.666 171.767C188.252 168.542 191.04 166.929 193.071 164.673C194.868 162.677 196.227 160.326 197.057 157.772C197.993 154.891 197.993 151.672 197.993 145.252V84.7418C197.993 78.3219 197.993 75.1034 197.057 72.2231C196.227 69.6685 194.868 67.3155 193.071 65.3194C191.049 63.0732 188.267 61.4674 182.729 58.2702L130.33 28.0171C124.744 24.7921 121.956 23.1828 118.987 22.5517C116.36 21.9932 113.643 21.9932 111.016 22.5517C108.047 23.1828 105.25 24.7921 99.6639 28.0171L47.3266 58.2341C41.7472 61.4554 38.9596 63.0647 36.9295 65.3194C35.1322 67.3155 33.7749 69.6685 32.9449 72.2231C32.0068 75.1102 32.0068 78.337 32.0068 84.7872V145.21C32.0068 151.66 32.0068 154.884 32.9449 157.772C33.7749 160.326 35.1322 162.677 36.9295 164.673C38.9608 166.929 41.7504 168.542 47.3364 171.767L99.6639 201.978C105.25 205.203 108.047 206.813 111.016 207.445C113.643 208.003 116.36 208.003 118.987 207.445C121.956 206.813 124.753 205.203 130.339 201.978Z" stroke="#4C4C4C" strokeWidth="9.78723" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M86.25 114.997C86.25 130.875 99.1218 143.747 115 143.747C130.878 143.747 143.75 130.875 143.75 114.997C143.75 99.1189 130.878 86.2471 115 86.2471C99.1218 86.2471 86.25 99.1189 86.25 114.997Z" stroke="#4C4C4C" strokeWidth="9.78723" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export function FTDHOutwardPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [layeringModalOpen, setLayeringModalOpen] = useState(false);

  const outwardCases = useMemo(() => {
    const onUsCase = MOCK_FTDH_CASES.find((c) => c.actionsTaken?.fundsLayering === false);
    const layeringCase = MOCK_FTDH_CASES.find((c) => c.actionsTaken?.fundsLayering === true);

    return [onUsCase, layeringCase]
      .filter(Boolean)
      .map((caseItem) => {
        const init = caseItem.initialData || {};
        const senderShort = init.sendingBank?.match(/\(([^)]+)\)/)?.[1]
          || init.sendingBank?.split(' ')?.[0]
          || '—';
        const beneficiaryShort = init.receivingBank?.match(/\(([^)]+)\)/)?.[1]
          || init.receivingBank?.split(' ')?.[0]
          || '—';

        return {
          id: caseItem.id,
          fullDisputeId: init.disputeId || '—',
          disputeId: (init.disputeId || '').replace('FTDH-INW', 'IBFT').slice(0, 11) + '...',
          beneficiary: beneficiaryShort,
          beneficiaryAccount: init.beneficiaryAccount || '—',
          sender: senderShort,
          senderAccount: init.senderAccount || '—',
          trxDateTime: formatDisplayDateTime(init.transactionDateTime),
          stan: init.stan || '—',
          amount: formatCurrency(init.amount),
          status: caseItem.actionsTaken?.fundsLayering ? 'Layer' : 'OnUs',
        };
      });
  }, []);

  const filteredCases = useMemo(() => {
    if (!searchQuery.trim()) return outwardCases;
    const q = searchQuery.toLowerCase();
    return outwardCases.filter((c) =>
      c.disputeId.toLowerCase().includes(q)
      || c.sender.toLowerCase().includes(q)
      || c.beneficiary.toLowerCase().includes(q)
      || c.senderAccount.toLowerCase().includes(q)
      || c.beneficiaryAccount.toLowerCase().includes(q)
    );
  }, [outwardCases, searchQuery]);

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] font-['Inter',sans-serif]">
      <div className="flex items-start justify-between mb-5 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[28px] font-semibold text-[#4C4C4C] leading-tight">Outward FTDH</h1>
            <span className="text-[12px] font-semibold bg-[#2592FF] text-white px-1.5 py-[2px] rounded-[3px] leading-none">1 New</span>
          </div>
          <p className="text-[16px] font-medium text-[#AFAFAF] mt-1">
            Manage Inward FTDH cases here
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-[44px] px-4 text-[15px] border-[#111] text-[#4C4C4C] hover:bg-[#f8f8f8] gap-2 rounded-[6px]"
            onClick={() => setTypeModalOpen(true)}
          >
            <Plus className="h-5 w-5" />
            Add
          </Button>
          <Button
            variant="outline"
            className="h-[44px] px-4 text-[15px] border-[#111] text-[#4C4C4C] hover:bg-[#f8f8f8] gap-2 rounded-[6px]"
            disabled
            title="Import functionality coming soon"
          >
            <Upload className="h-5 w-5" />
            Import
          </Button>
        </div>
      </div>

      <div className="rounded-[8px] border border-[#DAE1E7] bg-[#F9FAFB] p-6 mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#AFAFAF]" />
            <Input
              placeholder="Search by Account number, IBAN"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-[50px] text-[16px] border-[#DAE1E7] placeholder:text-[#AFAFAF] bg-white rounded-[10px]"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[205px] h-[50px] text-[16px] bg-white border-[#DAE1E7] rounded-[10px]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="h-[50px] px-5 text-[16px] border-[#DAE1E7] text-[#4C4C4C] hover:bg-gray-50 rounded-[10px] gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            More Filters
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 rounded-[8px] border border-[#DAE1E7] bg-[#F9FAFB] overflow-hidden relative">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#DAE1E7]">
          <div className="flex items-center gap-3">
            <Checkbox checked={false} onCheckedChange={() => {}} />
            <button className="p-1 rounded hover:bg-gray-100 transition-colors" title="Delete selected">
              <Trash2 className="h-4 w-4 text-[#AFAFAF]" />
            </button>
          </div>
          <div className="flex items-center gap-0.5">
            <button className="p-1 rounded hover:bg-gray-100 transition-colors">
              <ChevronLeft className="h-4 w-4 text-[#AFAFAF]" />
            </button>
            <button className="p-1 rounded hover:bg-gray-100 transition-colors">
              <ChevronRight className="h-4 w-4 text-[#AFAFAF]" />
            </button>
          </div>
        </div>

        <div className="px-6 pt-3">
          <div className="grid grid-cols-[1.3fr_1fr_1fr_1.2fr_.7fr_1fr_.5fr] text-[14px] text-[#4C4C4C]/65 font-medium pb-3 border-b border-[#DAE1E7] gap-3">
            <span>Dispute ID</span>
            <span>Beneficiary</span>
            <span>Sender</span>
            <span>Trx Date & Time</span>
            <span>Stan</span>
            <span>Trx Amount</span>
            <span className="text-right">Status</span>
          </div>
        </div>

        {filteredCases.length === 0 ? (
          <div className="flex flex-col items-start justify-center h-[calc(100%-64px)] pl-16 pb-14">
            <div className="mb-4"><EmptyStateIcon /></div>
            <p className="text-[24px] font-semibold text-[#4C4C4C] mb-2">No record yet</p>
            <p className="text-[16px] font-medium text-[#4C4C4C]">
              Outward FTDH record investigations will appear here once added.
            </p>
          </div>
        ) : (
          <div className="px-6">
            {filteredCases.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1.3fr_1fr_1fr_1.2fr_.7fr_1fr_.5fr] gap-3 h-[81px] items-center border-b border-[#DAE1E7] text-[#4C4C4C] cursor-pointer hover:bg-[#EEF6FF]/40"
                onClick={() => navigate(`/ftdh/outward/${row.id}`)}
              >
                <p className="text-[16px] font-medium" title={row.fullDisputeId}>{row.disputeId}</p>
                <div>
                  <p className="text-[16px] font-medium">{row.beneficiary}</p>
                  <p className="text-[10px]">{row.beneficiaryAccount.slice(0, 15)}</p>
                </div>
                <div>
                  <p className="text-[16px] font-medium">{row.sender}</p>
                  <p className="text-[10px]">{row.senderAccount.slice(0, 15)}</p>
                </div>
                <p className="text-[14px]">{row.trxDateTime}</p>
                <p className="text-[16px] font-medium">{row.stan}</p>
                <p className="text-[14px] font-semibold">{row.amount}</p>
                <p className="text-[14px] font-semibold text-right">{row.status}</p>
              </div>
            ))}
          </div>
        )}

        <div className="absolute bottom-0 left-0 h-[13px] w-full bg-[#EDF1F4]" />
      </div>

      <div className="flex items-center justify-between text-[16px] text-gray-400 pt-4 shrink-0">
        <span>
          © 2025, Made by <span className="text-[#2064B7] font-medium">ProofLine</span>
        </span>
        <div className="flex gap-4">
          <a href="#" className="text-[#2064B7] hover:underline">License</a>
          <a href="#" className="text-[#2064B7] hover:underline">Support</a>
        </div>
      </div>

      <FTDHOutwardTypeModal
        open={typeModalOpen}
        onOpenChange={setTypeModalOpen}
        onSelectSource={() => setSourceModalOpen(true)}
        onSelectLayering={() => setLayeringModalOpen(true)}
      />
      <FTDHOutwardSourceModal open={sourceModalOpen} onOpenChange={setSourceModalOpen} />
      <FTDHOutwardLayeringModal open={layeringModalOpen} onOpenChange={setLayeringModalOpen} />
    </div>
  );
}

export default FTDHOutwardPage;
