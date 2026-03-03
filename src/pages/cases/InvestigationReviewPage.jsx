import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  AlertTriangle,
  FileText,
  User,
  CreditCard,
  CircleDollarSign,
  MessageSquareWarning,
  Wallet,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataMasker } from '@/components/shared/DataMasker';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SubmissionProgressBar } from '@/components/modals/SubmissionProgressBar';
import { SubmissionSuccessDialog } from '@/components/modals/SubmissionSuccessDialog';
import { fraudTypes, channels } from '@/data/mockCases';
import { getAllCases } from '@/data/caseStorage';

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

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b pb-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right text-[#4c4c4c]">{value || '—'}</span>
    </div>
  );
}

function TwoColumnRows({ rows }) {
  return (
    <div>
      {rows.map((row, idx) => (
        <div
          key={idx}
          className="grid grid-cols-1 md:grid-cols-2 md:gap-10"
        >
          <div className="px-5 py-2">
            <div className="flex justify-between gap-3 pb-2 border-b border-[#dae1e7] text-sm">
              <span className="text-muted-foreground">{row.left.label}</span>
              <span className="text-right text-[#4c4c4c]">{row.left.value || '—'}</span>
            </div>
          </div>
          <div className="px-5 py-2">
            <div className="flex justify-between gap-3 pb-2 border-b border-[#dae1e7] text-sm">
              <span className="text-muted-foreground">{row.right.label}</span>
              <span className="text-right text-[#4c4c4c]">{row.right.value || '—'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function InvestigationOfficerHeadingIcon() {
  return (
    <BlueCircleIcon>
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="20" viewBox="0 0 20 23" fill="none" className="shrink-0">
        <path d="M7.22712 0.0283527C6.61488 0.110245 6.26002 0.301325 5.91685 0.730281C5.67118 1.03835 5.51519 1.43221 5.22272 2.4734C5.07064 3.00765 4.82496 3.86556 4.67288 4.3803C4.52079 4.89505 4.32581 5.56578 4.23612 5.86995L4.07624 6.42759H2.94146C2.23173 6.42759 1.74818 6.44319 1.65069 6.47049C1.41671 6.53678 1.18664 6.79026 1.10475 7.06713C0.960462 7.56238 1.19444 7.99913 1.67409 8.14732C1.85737 8.20191 17.8925 8.19411 18.0992 8.13952C18.3137 8.08102 18.5359 7.84315 18.6178 7.58187C18.6763 7.39469 18.6802 7.3362 18.6373 7.14902C18.5788 6.88775 18.3995 6.63817 18.185 6.52898C18.0368 6.45099 17.9588 6.44709 16.8123 6.43539C15.8452 6.42759 15.5918 6.41589 15.5918 6.373C15.5918 6.3457 15.4358 5.76466 15.2447 5.07833C15.0536 4.3959 14.7533 3.30792 14.5779 2.66448C14.223 1.36202 14.0748 0.987655 13.7784 0.683486C13.2637 0.149241 12.5111 -0.0925341 11.7701 0.0322523C11.6103 0.0595493 11.232 0.16484 10.9317 0.270129C10.2922 0.484606 9.96463 0.554799 9.71116 0.515803C9.60977 0.504105 9.29 0.414413 9.00143 0.324723C8.04993 0.0205545 7.71456 -0.0340405 7.22712 0.0283527ZM12.4799 1.95086C12.5423 2.06784 12.8581 3.15193 13.5835 5.73736C13.6848 6.09613 13.7589 6.4003 13.7511 6.41199C13.7394 6.41979 11.9768 6.42369 9.83205 6.41979L5.93245 6.4081L6.05724 5.97914C6.3887 4.87555 7.09063 2.4578 7.16862 2.15363C7.22712 1.91966 7.3753 1.78707 7.57028 1.78707C7.66777 1.78707 8.08113 1.90406 8.59977 2.08344C9.86324 2.5085 9.87884 2.5085 11.3022 2.04055C12.2966 1.71298 12.3551 1.70908 12.4799 1.95086Z" fill="white"/>
        <path d="M4.12934 9.4114C4.12934 9.4231 4.17223 9.63368 4.22683 9.88716C4.33602 10.398 4.53489 11.0297 4.73767 11.5055C4.86636 11.8097 4.87026 11.8253 4.80397 11.8993C4.76497 11.9383 3.99675 12.5272 3.09594 13.2018C2.19514 13.8803 1.33722 14.5472 1.19294 14.6915C0.50661 15.3622 0.136149 16.1733 0.0308594 17.2496C-0.0276345 17.8462 0.00356225 19.9715 0.0698554 20.1548C0.182944 20.4434 0.41302 20.5955 0.841976 20.6617C1.01746 20.689 2.81517 20.7007 6.22342 20.6929L11.3397 20.6812L11.1447 20.4473C10.8483 20.0924 10.5793 19.6322 10.4428 19.2501L10.318 18.9069H6.05574H1.78958V18.1153C1.79348 16.8986 1.89487 16.5204 2.35112 16.0329C2.47591 15.8964 2.95946 15.4987 3.42351 15.1477C3.88756 14.7967 4.5193 14.3093 4.83126 14.0714C5.4903 13.5606 6.09083 13.1355 6.15323 13.1355C6.17663 13.1355 6.3833 13.2798 6.61338 13.4553C7.29581 13.97 7.98214 14.2898 8.80885 14.4653C9.38989 14.5901 10.4428 14.5901 11.0199 14.4692C12.3692 14.1806 13.5586 13.4358 14.3541 12.379C14.8142 11.7668 15.4772 10.2303 15.5396 9.62978L15.5669 9.39191L14.6777 9.39971L13.7886 9.4114L13.6756 9.82086C13.4377 10.6788 12.9424 11.4782 12.3536 11.9422C11.2695 12.8002 9.91244 13.038 8.63337 12.5896C7.24902 12.1021 6.25852 10.9634 5.94265 9.4972L5.92315 9.39191H5.02624C4.531 9.39191 4.12934 9.39971 4.12934 9.4114Z" fill="white"/>
        <path d="M14.1288 14.3049C13.579 14.379 13.1188 14.5545 12.6703 14.8547C11.9957 15.3071 11.5356 15.9544 11.2977 16.789C11.169 17.2335 11.169 18.0914 11.2977 18.5282C11.7071 19.9476 13.0369 20.9381 14.5305 20.9342C14.9516 20.9342 15.2987 20.8601 15.7276 20.6885L16.0591 20.556L17.2017 21.7063C17.9387 22.4473 18.3989 22.8801 18.5002 22.9269C18.8161 23.0751 19.2178 22.9932 19.4868 22.7241C19.7403 22.4707 19.8105 22.1977 19.7091 21.8467C19.6467 21.6362 19.596 21.5738 18.5158 20.4819C17.8958 19.854 17.3889 19.3237 17.3889 19.3042C17.3889 19.2847 17.4513 19.1326 17.5292 18.9688C17.7515 18.4814 17.8256 18.1382 17.8256 17.6001C17.8256 17.058 17.7437 16.6876 17.5253 16.2196C17.0808 15.2837 16.2151 14.5935 15.2051 14.3673C14.8619 14.2893 14.4174 14.2659 14.1288 14.3049ZM15.17 16.2001C15.6379 16.4224 15.9811 16.8708 16.0513 17.3505C16.2073 18.3878 15.4508 19.2262 14.4096 19.1716C13.4152 19.1209 12.7249 18.146 13.0057 17.1867C13.0798 16.9332 13.1812 16.7578 13.384 16.5394C13.6998 16.1962 14.0547 16.0558 14.5617 16.0675C14.8619 16.0792 14.9516 16.0987 15.17 16.2001Z" fill="white"/>
      </svg>
    </BlueCircleIcon>
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

function CustomerComplaintIcon() {
  return (
    <BlueCircleIcon>
      <MessageSquareWarning className="w-6 h-6" />
    </BlueCircleIcon>
  );
}

function DisputedTransactionIcon() {
  return (
    <BlueCircleIcon>
      <Wallet className="w-6 h-6" />
    </BlueCircleIcon>
  );
}

function AnnxIcon() {
  return (
    <BlueCircleIcon>
      <FileText className="w-6 h-6" />
    </BlueCircleIcon>
  );
}

function SystemFactsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="54" height="54" viewBox="0 0 70 70" fill="none" className="shrink-0">
      <circle cx="35" cy="35" r="35" fill="#2064B7"/>
      <path d="M41.7918 43.1787C41.3924 43.5936 40.8797 43.6899 40.3259 43.6673C38.1463 43.5795 35.8194 43.1843 33.6256 42.996C33.2616 42.9648 32.8948 42.9266 32.5308 42.9251C32.0535 43.0781 32.0478 43.8415 32.5719 43.9321L40.5256 44.7295C41.9107 44.823 43.1698 43.7381 43.2888 42.3601L51.4507 38.2302C52.3062 37.8563 53.1007 37.4173 54.0694 37.6113C55.5608 37.9116 55.8199 39.3307 54.4901 40.0855C50.3744 42.7524 46.338 45.5467 42.1982 48.1753C40.4109 49.3097 38.7326 50.6594 36.4779 50.1963C35.1509 49.9244 33.6284 49.372 32.3254 48.9485C30.8114 48.4557 29.2323 47.7872 27.724 47.3609C26.3516 46.9714 24.907 47.021 23.529 47.3666C23.0432 47.4884 22.5772 47.6937 22.0957 47.8056L22.1127 38.0645L22.1849 37.9767C23.2811 37.5334 24.4864 37.1071 25.669 36.9697C27.1787 36.7941 28.6346 37.2204 30.0183 37.7742C30.667 38.0334 31.3737 38.4483 32.0209 38.6494C32.5634 38.818 33.2304 38.9199 33.7955 39.0432C35.6607 39.4454 37.5444 39.7655 39.4082 40.1719C40.0356 40.3079 40.9278 40.4155 41.4476 40.7738C42.2322 41.3149 42.4928 42.4549 41.7918 43.1815V43.1787Z" fill="white"/>
      <path d="M16.369 35.6731C17.6606 35.7496 19.1491 35.5343 20.4181 35.6632C20.7396 35.6958 20.962 35.853 21.0597 36.1646L21.0413 50.5185C20.9903 50.7139 20.7566 50.9391 20.5583 50.9816L16.3563 51C16.1042 50.9504 15.8719 50.7876 15.794 50.5369C15.6892 46.6563 15.7558 42.7531 15.7699 38.8696C15.7728 38.0921 15.6779 37.197 15.7444 36.4308C15.7784 36.0385 15.9569 35.734 16.3676 35.6731H16.369Z" fill="white"/>
      <path d="M31.4938 23.3014C27.82 26.8307 29.0606 32.9533 33.8618 34.6783C38.0369 36.1781 42.6002 33.4433 43.1072 29.0203C43.1511 28.6393 43.0859 28.0119 43.1652 27.6989C43.3508 26.9695 44.4852 27.08 44.5659 27.8377C44.7642 29.6916 43.8649 32.0412 42.6936 33.456C38.9249 38.0079 31.7274 37.4018 28.9077 32.1814C25.8867 26.5857 30.1823 19.6814 36.5442 20.0114C37.5285 20.0624 39.6118 20.5482 40.361 21.2011C40.8666 21.6429 40.5168 22.4615 39.8611 22.4417C39.5509 22.4318 39.2408 22.1783 38.9547 22.0551C36.3558 20.9334 33.5488 21.3271 31.4938 23.3014Z" fill="white"/>
      <path d="M45.6085 22.5133C43.5421 24.4494 41.6826 26.5171 39.8159 28.6458C38.867 29.7278 37.9634 30.9147 36.9791 31.9584C36.4225 32.5476 35.7371 33.3096 34.927 32.5504C34.5049 32.1553 33.9341 31.205 33.5447 30.6994C32.8323 29.776 32.0406 28.8554 31.3679 27.9093C31.0464 27.4575 30.6427 26.9222 30.892 26.3443C31.0804 25.9067 31.4883 25.8047 31.9315 25.8472C32.7813 25.9294 34.0829 27.0227 34.7117 27.6006C35.036 27.898 35.3207 28.2634 35.6705 28.5226L38.3373 25.9846C40.187 24.3219 42.0494 22.6351 44.1993 21.3605C44.9896 20.8917 46.5106 20.008 47.427 20.1283C47.6805 20.1609 47.713 20.3932 47.6182 20.6C47.427 21.0135 46.0333 22.1154 45.6085 22.5133Z" fill="white"/>
      <path d="M43.1451 41.3393L42.75 40.5122L49.3243 36.7775C49.8753 36.5509 50.5466 36.5608 51.0621 36.871C51.1655 36.9333 51.4912 37.1528 51.3184 37.2746C48.5879 38.6187 45.9125 40.0774 43.1437 41.3407L43.1451 41.3393Z" fill="white"/>
      <path d="M46.46 37.1996C46.5322 37.269 46.1767 37.456 46.1314 37.4815C44.7888 38.276 43.3938 38.9926 42.054 39.7928C41.8769 39.8367 41.571 39.603 41.3855 39.5336C41.2212 39.4727 41.0342 39.4387 40.8615 39.4062C40.8416 39.3141 40.8742 39.3424 40.9124 39.3184C41.4011 39.0025 42.0695 38.6839 42.595 38.4006C43.1771 38.0876 44.7831 37.1501 45.3397 37.0849C45.7193 37.041 46.0889 37.143 46.4586 37.1996H46.46Z" fill="white"/>
    </svg>
  );
}

function ObservationIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="54" height="54" viewBox="0 0 70 70" fill="none" className="shrink-0">
      <circle cx="35" cy="35" r="35" fill="#2064B7"/>
      <path d="M33.2368 40.7159C32.1035 39.066 31.5035 37.1327 31.5035 35.0995C31.5035 32.4496 32.4535 29.8497 34.4201 28.0664C36.3367 26.3165 39.2199 25.2999 40.6365 25.1832C38.0366 23.4166 34.8867 22 31.4202 22C22.5205 22 15.5708 31.433 15.2875 31.8329C14.9042 32.3663 14.9042 33.0996 15.2875 33.6329C15.5708 34.0329 22.5205 43.4658 31.4202 43.4658C32.7535 43.4658 34.0368 43.2492 35.2534 42.8992C34.9534 42.6659 34.6701 42.4159 34.4034 42.1492C33.9701 41.6826 33.5868 41.2159 33.2368 40.7159ZM30.6536 29.483C30.3869 29.5164 29.4536 29.8664 28.8536 30.7163C28.3036 31.4996 28.1703 32.5163 28.4703 33.7495C28.6703 34.5662 28.1703 35.3995 27.3537 35.5995C27.237 35.6328 27.1204 35.6495 26.987 35.6495C26.3037 35.6495 25.6704 35.1828 25.5038 34.4828C24.8204 31.683 25.6871 29.7997 26.537 28.7164C27.7037 27.2331 29.5036 26.4332 30.6202 26.4332C31.4702 26.4332 32.1535 27.1165 32.1535 27.9664C32.1702 28.7997 31.5035 29.483 30.6536 29.483ZM18.4874 32.7162C19.854 31.0996 23.0372 27.6998 26.987 26.0165C24.7038 27.4665 23.1872 29.983 23.1872 32.8829C23.1872 35.2828 24.2371 37.4327 25.8871 38.916C22.4539 37.1161 19.7206 34.1995 18.4874 32.7162Z" fill="white"/>
      <path d="M40.9696 38.4665C38.7863 38.0665 38.2363 35.95 38.2197 35.85C38.103 35.4 37.6697 35.1167 37.203 35.2333C36.7364 35.35 36.4697 35.7833 36.5697 36.25C36.6031 36.3833 37.3697 39.5332 40.6696 40.1331C40.7196 40.1331 40.7696 40.1498 40.8196 40.1498C41.2195 40.1498 41.5695 39.8665 41.6529 39.4498C41.7362 38.9998 41.4362 38.5499 40.9696 38.4665Z" fill="white"/>
      <path d="M53.9373 43.9997L50.7208 40.7832C50.2208 40.2832 49.4209 40.2832 48.9375 40.7832L48.0542 39.8999C50.3875 36.7 50.1208 32.1835 47.2209 29.3003C45.6877 27.7504 43.6211 26.9004 41.4378 26.9004C39.2546 26.9004 37.2213 27.767 35.6714 29.317C34.1215 30.8669 33.2715 32.9168 33.2715 35.1001C33.2715 37.2833 34.1215 39.3332 35.6714 40.8832C37.2213 42.4331 39.2713 43.2831 41.4545 43.2831C43.2044 43.2831 44.8877 42.7331 46.271 41.7165L47.1376 42.5998C46.6376 43.0998 46.6543 43.8997 47.1376 44.383L50.3542 47.5996C50.8875 48.1329 51.7374 48.1329 52.2541 47.5996L53.9207 45.933C54.4707 45.383 54.4707 44.533 53.9373 43.9997ZM45.4543 39.0832C44.3877 40.1499 42.9711 40.7332 41.4712 40.7332C39.9712 40.7332 38.5379 40.1499 37.4713 39.0832C36.4047 38.0166 35.8214 36.6 35.8214 35.0834C35.8214 34.1334 36.0547 33.2168 36.5047 32.4002C36.7547 31.9335 37.088 31.4835 37.4713 31.1002C37.5213 31.0502 37.588 30.9836 37.638 30.9336C38.6879 29.9669 40.0379 29.4503 41.4545 29.4503C42.9711 29.4503 44.3877 30.0336 45.4377 31.1002C45.6543 31.3169 45.8543 31.5502 46.021 31.7835C47.6376 34.0001 47.4376 37.1 45.4543 39.0832Z" fill="white"/>
      <path d="M36.7363 33.5335C36.7363 33.7545 36.8241 33.9665 36.9804 34.1227C37.1367 34.279 37.3486 34.3668 37.5696 34.3668C37.7906 34.3668 38.0026 34.279 38.1589 34.1227C38.3151 33.9665 38.4029 33.7545 38.4029 33.5335C38.4029 33.3125 38.3151 33.1005 38.1589 32.9443C38.0026 32.788 37.7906 32.7002 37.5696 32.7002C37.3486 32.7002 37.1367 32.788 36.9804 32.9443C36.8241 33.1005 36.7363 33.3125 36.7363 33.5335Z" fill="white"/>
    </svg>
  );
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

function yn(value, yesText, noText, empty = '—') {
  if (value === 'yes') return yesText;
  if (value === 'no') return noText;
  return empty;
}

export function InvestigationReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const caseData = getAllCases().find((c) => c.id === parseInt(id));
  const f = location.state?.draftForm;
  const uploadedFiles = location.state?.uploadedFiles || [];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmissionStep(1);
    for (let i = 1; i <= 6; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 500));
      setSubmissionStep(i);
    }
    await new Promise((r) => setTimeout(r, 300));
    setIsSubmitting(false);
    setShowSuccess(true);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setSubmissionStep(0);
    toast.success('Investigation report submitted for supervisor review');
    navigate(`/cases/${id}`);
  };

  const channelLabel =
    channels.find((c) => c.value === (caseData?.case_receiving_channel || caseData?.channel))?.label ||
    caseData?.case_receiving_channel ||
    caseData?.channel ||
    '—';
  const fraudTypeLabel =
    fraudTypes.find((t) => t.value === caseData?.fraud_type)?.label || caseData?.fraud_type || '—';

  const totalDisputed =
    caseData?.total_disputed_amount ||
    caseData?.transactions?.reduce((sum, t) => sum + (Number(t.disputed_amount) || 0), 0) ||
    0;

  const totalDisputedTxnSum =
    caseData?.transactions?.reduce((sum, t) => sum + (Number(t.disputed_amount) || 0), 0) || 0;

  const customerStancePoints = useMemo(() => {
    const points = [];
    if (f?.initialCustomerStance?.trim()) points.push(f.initialCustomerStance.trim());
    if (f?.ioCallStance?.trim()) points.push(f.ioCallStance.trim());
    if (points.length === 0) {
      return ['Customer states disputed activities were not performed by them.'];
    }
    return points;
  }, [f?.initialCustomerStance, f?.ioCallStance]);

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

  if (!f) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(`/cases/${id}/investigation`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Investigation Form
        </Button>
        <Card>
          <CardContent className="py-10 text-center space-y-2">
            <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
            <p className="font-medium">Draft report data not found</p>
            <p className="text-sm text-muted-foreground">
              Please complete the investigation form first, then open review again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {isSubmitting && (
        <div className="fixed inset-0 bg-[#2A2A2A]/90 flex items-center justify-center z-[100]">
          <SubmissionProgressBar currentStep={submissionStep} totalSteps={6} />
        </div>
      )}

      <div className="space-y-4">
        <div className="rounded-xl border border-[#dae1e7] overflow-hidden">
          <div className="bg-[#2064b7] px-4 py-3 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/15 hover:text-white"
                onClick={() =>
                  navigate(`/cases/${id}/investigation`, {
                    state: { draftForm: f, uploadedFiles },
                  })
                }
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h2 className="text-lg font-semibold">Investigation Report</h2>
                <p className="text-xs text-white/80">{f.caseReferenceNo || caseData.reference_number}</p>
              </div>
              <StatusBadge status={caseData.status} />
            </div>

            <div className="flex items-center gap-2">
              <Button
                className="bg-[#22c55e] hover:bg-[#16a34a] text-white"
                onClick={handleSubmit}
              >
                <Send className="mr-2 h-4 w-4" />
                Submit For Review
              </Button>
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 space-y-4">
            <SectionTitle title="Investigation Officer" icon={<InvestigationOfficerHeadingIcon />} />
            <Card>
              <CardContent className="p-0">
                <TwoColumnRows
                  rows={[
                    {
                      left: { label: 'IO Name', value: f.investigationOfficer || caseData.assigned_to?.name },
                      right: { label: 'IO Position', value: 'Analyst Investigation' },
                    },
                    {
                      left: { label: 'IO Region', value: caseData.customer?.region || '—' },
                      right: { label: 'Report Prepared Date', value: formatDateSafe(new Date()) },
                    },
                  ]}
                />
              </CardContent>
            </Card>

            <SectionTitle title="Customer / Complaint Details" icon={<CustomerComplaintIcon />} />
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Customer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <TwoColumnRows
                  rows={[
                    {
                      left: { label: 'Customer Name', value: f.customerNameField || caseData.customer?.name },
                      right: { label: 'CNIC', value: <DataMasker value={caseData.customer?.cnic} type="cnic" /> },
                    },
                    {
                      left: {
                        label: 'Customer City (Region)',
                        value: `${caseData.customer?.city || '—'}${caseData.customer?.region ? ` (${caseData.customer.region})` : ''}`,
                      },
                      right: { label: 'Customer Contact Number', value: f.customerCli || caseData.customer?.mobile || '—' },
                    },
                    {
                      left: {
                        label: 'Account Number',
                        value: <DataMasker value={f.customerAccountNoField || caseData.customer?.account_number} type="account" />,
                      },
                      right: { label: 'Customer Account Type', value: f.customerAccountType || caseData.customer?.account_type || '—' },
                    },
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CircleDollarSign className="h-4 w-4" />
                  Dispute Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <TwoColumnRows
                  rows={[
                    {
                      left: { label: 'Complaint No#', value: f.complaintNo || caseData.complaint_number || '—' },
                      right: { label: 'Reference Number', value: f.caseReferenceNo || caseData.reference_number || '—' },
                    },
                    {
                      left: { label: 'Type of Incident', value: fraudTypeLabel || '—' },
                      right: {
                        label: 'Date(s) Incident Occurred',
                        value: `${formatDateSafe(f.incidentDate)}${f.incidentDateTo ? ` to ${formatDateSafe(f.incidentDateTo)}` : ''}`,
                      },
                    },
                    {
                      left: { label: 'Dispute Amount at Risk', value: formatCurrency(f.disputeAmountAtRisk || totalDisputed) },
                      right: { label: 'Case Receiving Channel', value: f.caseReceivingChannel || channelLabel || '—' },
                    },
                    {
                      left: { label: 'Case Receiving Date', value: formatDateSafe(f.caseReceivingDate || caseData.case_received_date) },
                      right: { label: 'Customer Communication Date', value: formatDateSafe(f.caseReceivingDate || caseData.case_received_date) },
                    },
                    {
                      left: { label: 'Customer / Beneficiary SIM Blocked', value: f.simBlocked === 'yes' ? 'Yes' : f.simBlocked === 'no' ? 'No' : '—' },
                      right: { label: 'Fund Layered A/C#', value: f.fundLayeredFlag === 'yes' ? 'Yes' : f.fundLayeredFlag === 'no' ? 'No' : '—' },
                    },
                    {
                      left: { label: 'Source of IB Channel Creation', value: f.mbCreationSource || '—' },
                      right: { label: 'Expected Recovery from On-Us Beneficiary', value: f.expectedRecovery || '—' },
                    },
                    {
                      left: { label: 'Expected Recovery from Member / Bank Beneficiary', value: f.expectedRecoveryMemberBank || '—' },
                      right: { label: 'Net Loss Booked', value: f.netLossBooked || '0' },
                    },
                  ]}
                />
              </CardContent>
            </Card>

            <div className="space-y-4 pl-4 md:pl-8">
              <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Customer Background and Statement</p>
              <p className="text-[#4c4c4c] pl-5 text-[18px] leading-[1.56]">
                On {formatDateSafe(f.caseReceivingDate || caseData.case_received_date)}, customer reported unauthorized transactions totaling {formatCurrency(f.disputeAmountAtRisk || totalDisputed)}.
              </p>
              <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Customer Stance</p>
              <ul className="list-disc pl-12 space-y-1 text-[#4c4c4c] text-[18px] leading-[1.56]">
                {customerStancePoints.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
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
                      <th className="px-3 py-2">Branch Code</th>
                      <th className="px-3 py-2">Amount (PKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {caseData.transactions.map((txn) => (
                      <tr key={txn.id} className="border-t border-[#dae1e7]">
                        <td className="px-3 py-2">{txn.transaction_id}</td>
                        <td className="px-3 py-2">
                          {format(new Date(txn.transaction_date), 'dd/MM/yyyy')}
                          <p className="text-xs text-muted-foreground">{txn.transaction_time?.slice(0, 5) || '--:--'}</p>
                        </td>
                        <td className="px-3 py-2">{txn.branch_name || txn.branch || caseData.branch_code || '—'}</td>
                        <td className="px-3 py-2 text-[#1e8fff] font-semibold">{formatCurrency(txn.disputed_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#edf1f4] border-t border-[#dae1e7]">
                      <td colSpan={3} className="px-3 py-2 font-semibold uppercase text-[#4c4c4c]">
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
                    <tbody>
                      <tr className="border-t border-[#dae1e7]">
                        <td className="px-3 py-2">Detection / Authorization Feedback</td>
                        <td className="px-3 py-2">{f.fmsAlertGenerated ? f.fmsAlertGenerated.toUpperCase() : '—'}</td>
                        <td className="px-3 py-2">{f.fmsAlertGenerated === 'yes' ? 'Feedback received' : '—'}</td>
                        <td className="px-3 py-2">{f.fmsAlertGenerated === 'no' ? 'Disputed amount is below the defined threshold for mandatory feedback.' : '—'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Customer Channels Blocking Detail</p>
                <div className="overflow-x-auto rounded-sm border border-[#dae1e7]">
                  <table className="w-full text-[14px]">
                    <thead className="bg-[#2064b7] text-white">
                      <tr>
                        <th className="px-3 py-2 text-left">Channel</th>
                        <th className="px-3 py-2 text-left">Blocking Date / Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">Blocking of MB Channel</td><td className="px-3 py-2">{formatDateSafe(f.mbCreationDatetime, 'dd-MMM-yyyy @ HH:mm')}</td></tr>
                      <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">Blocking of Debit Card</td><td className="px-3 py-2">{formatDateSafe(f.dcCreationDatetime, 'dd-MMM-yyyy @ HH:mm')}</td></tr>
                      <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">Blocking of Credit Card</td><td className="px-3 py-2">{formatDateSafe(f.ccCreationDatetime, 'dd-MMM-yyyy @ HH:mm')}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Other Details</p>
                <div className="overflow-x-auto rounded-sm border border-[#dae1e7]">
                  <table className="w-full text-[14px]">
                    <thead className="bg-[#2064b7] text-white">
                      <tr>
                        <th className="px-3 py-2 text-left">Channel</th>
                        <th className="px-3 py-2 text-left">Date / Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">Transaction SMS Alerts</td><td className="px-3 py-2">{formatDateSafe(f.cxCallDatetime, 'dd-MMM-yyyy @ HH:mm')}</td></tr>
                      <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">Complaint Lodgment by the Customer at DCE</td><td className="px-3 py-2">{formatDateSafe(f.caseReceivingDate)}</td></tr>
                      <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">FTDH Lodgment</td><td className="px-3 py-2">{f.ftdhStatus || '—'}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Customer Account Profile</p>
                <div className="overflow-x-auto rounded-sm border border-[#dae1e7]">
                  <table className="w-full text-[14px]">
                    <thead className="bg-[#2064b7] text-white">
                      <tr>
                        <th className="px-3 py-2 text-left">Customer Credit Card Profile</th>
                        <th className="px-3 py-2 text-left"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">Account Opening Date</td><td className="px-3 py-2">{formatDateSafe(f.customerAccountOpeningDate)}</td></tr>
                      <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">Account Type</td><td className="px-3 py-2">{f.customerAccountType || '—'}</td></tr>
                      <tr className="border-t border-[#dae1e7]"><td className="px-3 py-2">Debit Card Creation / Activation Date</td><td className="px-3 py-2">{formatDateSafe(f.dcCreationDatetime)}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Details of User</p>
                <div className="overflow-x-auto rounded-sm border border-[#dae1e7]">
                  <table className="w-full text-[14px]">
                    <thead className="bg-[#2064b7] text-white">
                      <tr>
                        <th className="px-3 py-2 text-left">Action</th>
                        <th className="px-3 py-2 text-left">Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-[#dae1e7] align-top"><td className="px-3 py-2">Mobile</td><td className="px-3 py-2">{f.customerCli || '—'}</td></tr>
                      <tr className="border-t border-[#dae1e7] align-top"><td className="px-3 py-2">Device ID / IMEI / MAC Address</td><td className="px-3 py-2">{f.initialDeviceId || '—'}</td></tr>
                      <tr className="border-t border-[#dae1e7] align-top"><td className="px-3 py-2">IP Address</td><td className="px-3 py-2">{f.loginIp || '—'}</td></tr>
                      <tr className="border-t border-[#dae1e7] align-top"><td className="px-3 py-2">Caller-known information (as claimed by customer)</td><td className="px-3 py-2">{f.rcChannel || '—'}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-[#2064b7] uppercase text-[20px]">• P-II Data Analysis / Staff Review</p>
                <div className="overflow-x-auto rounded-sm border border-[#dae1e7]">
                  <table className="w-full text-[14px]">
                    <thead className="bg-[#2064b7] text-white">
                      <tr>
                        <th className="px-3 py-2 text-left">Action</th>
                        <th className="px-3 py-2 text-left">Status / Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-[#dae1e7] align-top"><td className="px-3 py-2">P-II Review (Staff)</td><td className="px-3 py-2">{yn(f.piiReviewedFlag, 'P-II review was conducted.', 'No fraudulent element observed. P-II was not reviewed.', '—')}</td></tr>
                      <tr className="border-t border-[#dae1e7] align-top"><td className="px-3 py-2">Transaction Reversal Request</td><td className="px-3 py-2">{yn(f.fundLayeredFlag, 'Fund layering details shared by member bank.', 'No detail shared by member bank related to layering.', '—')}</td></tr>
                      <tr className="border-t border-[#dae1e7] align-top"><td className="px-3 py-2">Customer Communication</td><td className="px-3 py-2">{f.ioCallStance || '—'}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4 text-[#4c4c4c]">
                <div>
                  <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Communication with xxx Bank:</p>
                  <p className="text-[18px] leading-[1.56] pl-5">{f.ftdhStatus || 'Data not available/detailed in source documents.'}</p>
                </div>
                <div>
                  <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Communication with On-us A/c # xxxxx:</p>
                  <p className="text-[18px] leading-[1.56] pl-5">{yn(f.pstrFlag, 'PSTR was raised against observed account.', 'PSTR was not raised.', 'Data not available/detailed in source documents.')}</p>
                </div>
                <div>
                  <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Communication with Merchant against 3D/POS secure activities:</p>
                  <p className="text-[18px] leading-[1.56] pl-5">{f.factFindings || 'Data not available/detailed in source documents.'}</p>
                </div>
              </div>
            </div>

            <SectionTitle title="Observations & Conclusion" icon={<ObservationIcon />} />
            <div className="space-y-4 pl-3 md:pl-6 text-[#4c4c4c]">
              <div>
                <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Observation</p>
                <p className="text-[18px] leading-[1.56] pl-5">{f.factFindings || '—'}</p>
              </div>
              <div>
                <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Conclusions</p>
                <p className="text-[18px] leading-[1.56] pl-5">{f.finalConclusionType || '—'}</p>
              </div>
              <div>
                <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Control Breaches</p>
                <p className="text-[18px] leading-[1.56] pl-5">{f.controlBreachesObserved || yn(f.controlBreaches, 'Control breach has been identified.', 'No Control Breach is observed.', '—')}</p>
              </div>
              <div>
                <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Control Weaknesses</p>
                <p className="text-[18px] leading-[1.56] pl-5">{yn(f.gapIdentified, 'Internal gap has been identified in this case.', 'No internal gap is observed in this case.', '—')}</p>
              </div>
              <div>
                <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Root Cause</p>
                <p className="text-[18px] leading-[1.56] pl-5">{f.rootCause || '—'}</p>
              </div>
              <div>
                <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Recommendation</p>
                <p className="text-[18px] leading-[1.56] pl-5">{f.recommendation || '—'}</p>
              </div>
              <div>
                <p className="font-bold text-[#2064b7] uppercase text-[20px]">• Action Owner</p>
                <p className="text-[18px] leading-[1.56] pl-5">{f.actionOwner || '—'} — {f.actionStatus || '—'}</p>
              </div>
            </div>

            <SectionTitle title="Annx" icon={<AnnxIcon />} />
            <div className="flex flex-wrap gap-3 text-sm pl-2">
              {(uploadedFiles.length > 0 ? uploadedFiles : [{ name: 'proof.pdf' }, { name: 'court-file.pdf' }]).map((file, idx) => (
                <span key={idx} className="inline-flex items-center rounded border border-[#dae1e7] px-3 py-1.5 bg-white">
                  <FileText className="mr-2 h-3.5 w-3.5 text-[#2064b7]" />
                  {file.name || `attachment-${idx + 1}.pdf`}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SubmissionSuccessDialog open={showSuccess} onClose={handleSuccessClose} />
    </>
  );
}

export default InvestigationReviewPage;