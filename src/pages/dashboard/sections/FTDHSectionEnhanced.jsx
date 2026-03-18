import {
  Inbox,
  Send,
  Lock,
  ShieldOff,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Target,
  MessageSquare,
  Building2,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatLargeNumber, formatCurrencyAbbreviated, formatCurrencyFull, formatNumberWithCommas } from '@/utils/numberFormat';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  AreaChart,
  Area,
  LineChart,
  Line,
  ComposedChart,
} from 'recharts';

// Sophisticated color palette
const COLORS = {
  primary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#8b5cf6',
  teal: '#14b8a6',
  rose: '#f43f5e',
};

// Animated stat card with gradients
function StatCard({ title, value, description, icon: Icon, gradient, subtitle, fullValue }) {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-700">{title}</CardTitle>
        <div className={`p-3 rounded-xl ${gradient} bg-opacity-10`}>
          <Icon className="h-5 w-5 text-white" style={{ filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.5))' }} />
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent animate-count-up cursor-help"
          title={fullValue ? `Full value: ${fullValue}` : undefined}
        >
          {value}
        </div>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
        {subtitle && (
          <p className="text-xs text-indigo-600 font-medium mt-2 bg-indigo-50 px-2 py-1 rounded-full inline-block">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Custom tooltip with gradient
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border-0 rounded-xl shadow-2xl backdrop-blur-sm">
        <p className="font-bold text-sm mb-2 text-gray-800">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm flex items-center gap-2" style={{ color: entry.color }}>
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
            {entry.name}: <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function FTDHSectionEnhanced({ data, formatCurrency }) {
  const {
    overview,
    channel_blocking,
    communication_status,
    aging_distribution,
    sla_compliance,
    layering,
    funds_status,
  } = data;

  // Prepare SLA data for radial chart
  const slaData = [
    {
      name: 'Compliant',
      value: sla_compliance.compliance_rate,
      fill: 'url(#slaGradient)',
    },
  ];

  // Prepare communication data for composed chart
  const branchCommData = [
    { stage: 'Intimation Sent', count: communication_status.branch.intimation_sent, type: 'sent' },
    { stage: 'Response Received', count: communication_status.branch.response_received, type: 'received' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards with Gradients */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="Total FTDH Cases"
          value={overview.total_cases}
          description="All inward & outward"
          icon={Inbox}
          gradient="bg-gradient-to-r from-blue-500 to-cyan-500"
          subtitle={`${overview.inward} in, ${overview.outward} out`}
        />
        <StatCard
          title="Inward Cases"
          value={overview.inward}
          description="From other banks"
          icon={Inbox}
          gradient="bg-gradient-to-r from-purple-500 to-pink-500"
        />
        <StatCard
          title="Outward Cases"
          value={overview.outward}
          description="Filed to other banks"
          icon={Send}
          gradient="bg-gradient-to-r from-orange-500 to-red-500"
        />
        <StatCard
          title="Amount Under Lien"
          value={formatCurrencyAbbreviated(overview.total_lien_amount)}
          fullValue={formatCurrencyFull(overview.total_lien_amount)}
          description={`${overview.accounts_with_lien} accounts`}
          icon={Lock}
          gradient="bg-gradient-to-r from-emerald-500 to-teal-500"
        />
        <StatCard
          title="Accounts Blocked"
          value={overview.accounts_blocked}
          description="Channels blocked"
          icon={ShieldOff}
          gradient="bg-gradient-to-r from-rose-500 to-red-600"
        />
      </div>

      {/* Charts Row 1: Aging Area Chart & SLA Radial */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Aging Distribution with Area Chart */}
        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0">
          <CardHeader>
            <CardTitle className="text-gray-800 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              FTDH Aging Distribution
            </CardTitle>
            <CardDescription>Open cases by age (days since receipt)</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={aging_distribution}>
                <defs>
                  <linearGradient id="agingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="bucket" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#f59e0b"
                  fill="url(#agingGradient)"
                  name="Cases"
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* SLA Compliance with Enhanced Radial Gauge */}
        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0">
          <CardHeader>
            <CardTitle className="text-gray-800 flex items-center gap-2">
              <Target className="h-5 w-5 text-emerald-600" />
              SLA Compliance
            </CardTitle>
            <CardDescription>10-day turnaround time compliance rate</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={200}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  data={slaData}
                  startAngle={180}
                  endAngle={0}
                >
                  <defs>
                    <linearGradient id="slaGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                  </defs>
                  <RadialBar
                    minAngle={15}
                    background={{ fill: '#f1f5f9' }}
                    clockWise
                    dataKey="value"
                    cornerRadius={10}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="text-center">
                <p className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {sla_compliance.compliance_rate}%
                </p>
                <p className="text-sm text-gray-500 mt-2">Compliance Rate</p>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200">
                    <p className="text-xs text-gray-600 font-medium">Compliant</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{sla_compliance.compliant}</p>
                  </div>
                  <div className="bg-gradient-to-br from-rose-50 to-red-50 p-4 rounded-xl border border-rose-200">
                    <p className="text-xs text-gray-600 font-medium">Breached</p>
                    <p className="text-2xl font-bold text-rose-600 mt-1">{sla_compliance.breached}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Communication Status with Composed Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Branch Communication with Line + Bar */}
        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0">
          <CardHeader>
            <CardTitle className="text-gray-800 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              Branch Communication Flow
            </CardTitle>
            <CardDescription>Response rate: {communication_status.branch.response_rate}%</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={branchCommData}>
                <defs>
                  <linearGradient id="branchGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="stage" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="url(#branchGradient)" name="Cases" radius={[12, 12, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ fill: '#6366f1', r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Response Rate</span>
                <span className="text-2xl font-bold text-purple-600">
                  {communication_status.branch.response_rate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mt-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 h-3 rounded-full transition-all duration-1000 shadow-lg"
                  style={{ width: `${communication_status.branch.response_rate}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Member Bank Communication */}
        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0">
          <CardHeader>
            <CardTitle className="text-gray-800 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-teal-600" />
              Member Bank Communication
            </CardTitle>
            <CardDescription>Resolution rate: {communication_status.member_bank.resolution_rate}%</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={[
                  { stage: 'Started', count: communication_status.member_bank.comm_started },
                  { stage: 'Resolved', count: communication_status.member_bank.comm_resolved },
                ]}
              >
                <defs>
                  <linearGradient id="memberBankGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="stage" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#14b8a6"
                  fill="url(#memberBankGradient)"
                  name="Cases"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-4 p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Resolution Rate</span>
                <span className="text-2xl font-bold text-teal-600">
                  {communication_status.member_bank.resolution_rate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mt-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 h-3 rounded-full transition-all duration-1000 shadow-lg"
                  style={{ width: `${communication_status.member_bank.resolution_rate}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Blocking & Layering */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Channel Blocking with Pie Chart */}
        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0">
          <CardHeader>
            <CardTitle className="text-gray-800 flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-blue-600" />
              Channel Blocking Status
            </CardTitle>
            <CardDescription>Distribution by banking channel</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <defs>
                  {channel_blocking.map((entry, index) => (
                    <linearGradient key={`gradient-${index}`} id={`channelGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={entry.color} stopOpacity={0.9}/>
                      <stop offset="100%" stopColor={entry.color} stopOpacity={0.6}/>
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={channel_blocking}
                  dataKey="count"
                  nameKey="channel"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ channel, count }) => count > 0 ? `${channel}: ${count}` : ''}
                  animationDuration={1000}
                >
                  {channel_blocking.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#channelGradient${index})`} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Layering Detection */}
        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0">
          <CardHeader>
            <CardTitle className="text-gray-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              Layering Detection & FI
            </CardTitle>
            <CardDescription>Funds tracked to other banks</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Layering Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-rose-50 to-red-100 p-6 rounded-xl border border-rose-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <AlertTriangle className="h-6 w-6 text-rose-600" />
                    <span className="text-4xl font-bold text-rose-700">{layering.detected}</span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">Layering Detected</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-xl border border-blue-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <Send className="h-6 w-6 text-blue-600" />
                    <span className="text-4xl font-bold text-blue-700">{layering.outward_filed}</span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">Outward FI Filed</p>
                </div>
              </div>

              {/* Funds Status Breakdown */}
              {funds_status && funds_status.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-3 text-gray-700">Funds Status</h4>
                  <div className="space-y-2">
                    {funds_status.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-100 rounded-xl hover:shadow-md transition-all border border-gray-200"
                      >
                        <span className="text-sm font-medium text-gray-700">{item.status}</span>
                        <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          {item.count} cases
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
