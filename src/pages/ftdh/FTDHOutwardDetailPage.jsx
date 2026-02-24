import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, List, Mail, UserRound, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MOCK_FTDH_CASES } from '@/data/mockFTDH';
import { FTDHOutwardReportModal } from '@/components/modals/FTDHOutwardReportModal';

const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const sec = String(d.getSeconds()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${sec}`;
};

const formatDateTimePretty = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dd = String(d.getDate()).padStart(2, '0');
  const mon = months[d.getMonth()];
  const yyyy = d.getFullYear();
  let hh = d.getHours();
  const min = String(d.getMinutes()).padStart(2, '0');
  const ampm = hh >= 12 ? 'PM' : 'AM';
  hh = hh % 12 || 12;
  return `${dd}-${mon}-${yyyy} ${String(hh).padStart(2, '0')}:${min} ${ampm}`;
};

const formatCurrency = (amount) => `PKR ${Number(amount || 0).toLocaleString('en-PK')}`;

const shortBank = (full) => full?.match(/\(([^)]+)\)/)?.[1] || full?.split(' ')?.[0] || '—';

function SectionIcon({ children }) {
  return (
    <div className="h-9 w-9 rounded-full bg-[#2064B7] text-white flex items-center justify-center">
      {children}
    </div>
  );
}

function Field({ label, value, subValue }) {
  return (
    <div>
      <p className="text-[14px] text-[#AFAFAF] font-medium">{label}</p>
      <p className="text-[32px] sr-only">{value}</p>
      <p className="text-[19px] text-[#4C4C4C] font-medium leading-tight">{value}</p>
      {subValue && <p className="text-[10px] text-[#4C4C4C] mt-1">{subValue}</p>}
    </div>
  );
}

export function FTDHOutwardDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reportOpen, setReportOpen] = useState(false);

  const record = useMemo(() => {
    const found = MOCK_FTDH_CASES.find((c) => c.id === id) || MOCK_FTDH_CASES[0];
    const init = found?.initialData || {};
    const isLayer = !!found?.actionsTaken?.fundsLayering;
    return {
      id: found?.id,
      type: isLayer ? 'Layer' : 'OnUs',
      accountNo: (init.senderAccount || '').replace(/[^0-9]/g, '').slice(-13) || '000017900357003',
      complaintNo: init.stan || '89301',
      customerDisputeDateTime: formatDateTimePretty(init.transactionDateTime),
      bankName: shortBank(init.receivingBank),
      bankFtdhDisputeId: (init.disputeId || '').replace('FTDH-INW', 'Raast').slice(0, 18),
      bankReceivingDateTime: formatDateTimePretty(init.transactionDateTime),
      disputeId: (init.disputeId || '').replace('FTDH-INW', 'IBFT').slice(0, 11) + '...',
      beneficiary: shortBank(init.receivingBank),
      beneficiaryAccount: init.beneficiaryAccount || '—',
      sender: shortBank(init.sendingBank),
      senderAccount: init.senderAccount || '—',
      trxDateTime: formatDateTime(init.transactionDateTime),
      stan: init.stan || '—',
      amount: formatCurrency(init.amount),
      aging: isLayer ? '01' : '05',
      fundsStatus: found?.actionsTaken?.fundsStatus || 'SF',
      reminderAt: formatDateTime(found?.memberBankCommunication?.memberReminder1DateTime || found?.memberBankCommunication?.initialSubmissionDate || found?.updatedAt),
      caseId: found?.disputeId,
      layeringBank: shortBank(init.sendingBank),
    };
  }, [id]);

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] font-['Inter',sans-serif]">
      <div className="flex-1 rounded-[15px] border-2 border-[#DAE1E7] bg-white overflow-hidden">
        <div className="h-[46px] bg-[#2064B7] px-3 flex items-center">
          <button
            onClick={() => navigate('/ftdh/outward')}
            className="text-white hover:opacity-90"
            title="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>

        <div className="h-[calc(100%-46px)] overflow-auto bg-white flex flex-col">
          <div className="p-6">
            <div className="space-y-7">
              {record.type === 'OnUs' ? (
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <SectionIcon><UserRound className="h-5 w-5" /></SectionIcon>
                    <h2 className="text-[30px] sr-only">Customer Details</h2>
                    <h2 className="text-[30px] sr-only">Sender Bank Details</h2>
                    <h2 className="text-[30px] sr-only">FTDH Details</h2>
                    <h2 className="text-[20px] text-[#2064B7] font-semibold">Customer Details</h2>
                    <Button
                      className="ml-auto h-[28px] rounded-[18px] px-4 text-[12px] bg-[#05AEE5] hover:bg-[#099ac9]"
                      onClick={() => setReportOpen(true)}
                    >
                      Generate Report
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-8 border-b border-[#DAE1E7] pb-5">
                    <Field label="Account Number / CNIC" value={record.accountNo} />
                    <Field label="Customer Dispute Date & Time" value={record.customerDisputeDateTime} />
                    <Field label="Complaint Number" value={record.complaintNo} />
                  </div>
                </section>
              ) : (
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <SectionIcon><Building2 className="h-5 w-5" /></SectionIcon>
                    <h2 className="text-[20px] text-[#2064B7] font-semibold">Sender Bank Details</h2>
                    <Button
                      className="ml-auto h-[28px] rounded-[18px] px-4 text-[12px] bg-[#05AEE5] hover:bg-[#099ac9]"
                      onClick={() => setReportOpen(true)}
                    >
                      Generate Report
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-8 border-b border-[#DAE1E7] pb-5">
                    <Field label="Bank Name" value={record.bankName} />
                    <Field label="Bank FTDH Dispute ID" value={record.bankFtdhDisputeId} />
                    <Field label="Bank FTDH receiving Date & Time" value={record.bankReceivingDateTime} />
                  </div>
                </section>
              )}

              <section>
                <div className="flex items-center gap-3 mb-4">
                  <SectionIcon><List className="h-5 w-5" /></SectionIcon>
                  <h2 className="text-[20px] text-[#2064B7] font-semibold">FTDH Details</h2>
                </div>

                <div className="grid grid-cols-[1.2fr_1fr_1fr_1.2fr_.7fr_1fr] gap-8 border-b border-[#DAE1E7] pb-5">
                  <Field label="Dispute ID" value={record.disputeId} />
                  <Field label="Beneficiary" value={record.beneficiary} subValue={record.beneficiaryAccount.slice(0, 15)} />
                  <Field label="Sender" value={record.sender} subValue={record.senderAccount.slice(0, 15)} />
                  <Field label="Trx Date & Time" value={record.trxDateTime} />
                  <Field label="Stan" value={record.stan} />
                  <Field label="Trx Amount" value={record.amount} />
                </div>

                <div className="grid grid-cols-3 gap-8 pt-5">
                  <Field label="FTDH Aging" value={record.aging} />
                  {record.type === 'OnUs' && <Field label="Funds Status (FTDH Portal)" value={record.fundsStatus} />}
                  <Field label="FTDH Type" value={record.type} />
                </div>
              </section>
            </div>
          </div>

          <div className="bg-[#F8F8F8] px-6 py-5 min-h-[280px] flex-1">
            {record.type === 'OnUs' ? (
              <>
                <h3 className="text-[20px] text-[#4C4C4C] font-semibold mb-4">Communication with Member Bank</h3>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full border-[6px] border-[#2064B7] bg-white" />
                  <div>
                    <p className="text-[16px] text-[#4C4C4C] font-medium">1st Reminder Sent</p>
                    <p className="text-[10px] text-[#AFAFAF]">{record.reminderAt}</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-[20px] text-[#4C4C4C] font-semibold mb-4">Email history</h3>
                <div className="flex items-start gap-3">
                  <SectionIcon><Mail className="h-4 w-4" /></SectionIcon>
                  <div>
                    <p className="text-[18px] text-[#4C4C4C] font-medium">Email Sent</p>
                    <p className="text-[10px] text-[#AFAFAF]">{record.reminderAt}</p>
                    <p className="text-[10px] text-[#4C4C4C] mt-1">
                      The email has been sent to MBL and NayaPay. <a href="#" className="text-[#08ADE7]">Email Link</a>
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
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

      <FTDHOutwardReportModal open={reportOpen} onOpenChange={setReportOpen} record={record} />
    </div>
  );
}

export default FTDHOutwardDetailPage;
