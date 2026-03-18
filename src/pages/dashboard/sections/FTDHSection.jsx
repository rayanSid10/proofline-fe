import {
  Inbox,
  Send,
  Lock,
  ShieldOff,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
} from 'recharts';

// Animated stat card component
function StatCard({ title, value, description, icon: Icon, color, bgColor, subtitle }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold animate-count-up">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

// Custom tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-sm mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function FTDHSection({ data, formatCurrency }) {
  const {
    overview,
    channel_blocking,
    communication_status,
    aging_distribution,
    sla_compliance,
    layering,
    funds_status,
  } = data;

  // Prepare SLA compliance data for radial chart
  const slaData = [
    {
      name: 'Compliant',
      value: sla_compliance.compliance_rate,
      fill: '#10b981',
    },
  ];

  // Prepare communication funnel data
  const branchCommData = [
    { stage: 'Total Cases', count: communication_status.branch.total_cases, color: '#3b82f6' },
    { stage: 'Intimation Sent', count: communication_status.branch.intimation_sent, color: '#8b5cf6' },
    { stage: 'Response Received', count: communication_status.branch.response_received, color: '#10b981' },
  ];

  const memberBankCommData = [
    { stage: 'Total Cases', count: communication_status.member_bank.total_cases, color: '#3b82f6' },
    { stage: 'Comm Started', count: communication_status.member_bank.comm_started, color: '#f59e0b' },
    { stage: 'Comm Resolved', count: communication_status.member_bank.comm_resolved, color: '#10b981' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total FTDH Cases"
          value={overview.total_cases}
          description="All inward & outward"
          icon={Inbox}
          color="text-blue-500"
          bgColor="bg-blue-50"
          subtitle={`${overview.inward} inward, ${overview.outward} outward`}
        />
        <StatCard
          title="Inward Cases"
          value={overview.inward}
          description="From other banks"
          icon={Inbox}
          color="text-purple-500"
          bgColor="bg-purple-50"
        />
        <StatCard
          title="Outward Cases"
          value={overview.outward}
          description="Filed to other banks"
          icon={Send}
          color="text-orange-500"
          bgColor="bg-orange-50"
        />
        <StatCard
          title="Amount Under Lien"
          value={formatCurrency(overview.total_lien_amount)}
          description={`${overview.accounts_with_lien} accounts`}
          icon={Lock}
          color="text-green-500"
          bgColor="bg-green-50"
        />
        <StatCard
          title="Accounts Blocked"
          value={overview.accounts_blocked}
          description="Channels blocked"
          icon={ShieldOff}
          color="text-red-500"
          bgColor="bg-red-50"
        />
      </div>

      {/* Charts Row 1: Aging & SLA */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Aging Distribution Histogram */}
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>FTDH Aging Distribution</CardTitle>
            <CardDescription>Open cases by age (days since receipt)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={aging_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="bucket" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  name="Cases"
                  animationBegin={0}
                  animationDuration={800}
                  radius={[8, 8, 0, 0]}
                >
                  {aging_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* SLA Compliance Gauge */}
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>SLA Compliance</CardTitle>
            <CardDescription>10-day turnaround time compliance rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={200}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="70%"
                  outerRadius="100%"
                  data={slaData}
                  startAngle={180}
                  endAngle={0}
                >
                  <RadialBar
                    minAngle={15}
                    background
                    clockWise
                    dataKey="value"
                    cornerRadius={10}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="text-center mt-4">
                <p className="text-4xl font-bold text-green-600">
                  {sla_compliance.compliance_rate}%
                </p>
                <p className="text-sm text-muted-foreground mt-1">Compliance Rate</p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600">Compliant</p>
                    <p className="text-lg font-bold text-green-600">{sla_compliance.compliant}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600">Breached</p>
                    <p className="text-lg font-bold text-red-600">{sla_compliance.breached}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Communication Status */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Branch Communication */}
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Branch Communication Status</CardTitle>
            <CardDescription>Response rate: {communication_status.branch.response_rate}%</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={branchCommData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="stage" width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  name="Cases"
                  animationDuration={800}
                  radius={[0, 8, 8, 0]}
                >
                  {branchCommData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Response Rate</span>
                <span className="text-lg font-bold text-green-600">
                  {communication_status.branch.response_rate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${communication_status.branch.response_rate}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Member Bank Communication */}
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Member Bank Communication</CardTitle>
            <CardDescription>
              Resolution rate: {communication_status.member_bank.resolution_rate}%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={memberBankCommData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="stage" width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  name="Cases"
                  animationDuration={800}
                  radius={[0, 8, 8, 0]}
                >
                  {memberBankCommData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Resolution Rate</span>
                <span className="text-lg font-bold text-orange-600">
                  {communication_status.member_bank.resolution_rate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${communication_status.member_bank.resolution_rate}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3: Channel Blocking & Layering */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Channel Blocking */}
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Channel Blocking Status</CardTitle>
            <CardDescription>Breakdown by banking channel type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={channel_blocking}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="channel" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  name="Accounts Blocked"
                  animationDuration={800}
                  radius={[8, 8, 0, 0]}
                >
                  {channel_blocking.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Layering Detection & Outward FI */}
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Layering Detection & Outward FI</CardTitle>
            <CardDescription>Funds tracked to other banks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Layering Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                    <span className="text-3xl font-bold text-red-700">{layering.detected}</span>
                  </div>
                  <p className="text-sm text-gray-600">Layering Detected</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Send className="h-6 w-6 text-blue-600" />
                    <span className="text-3xl font-bold text-blue-700">{layering.outward_filed}</span>
                  </div>
                  <p className="text-sm text-gray-600">Outward FTDH Filed</p>
                </div>
              </div>

              {/* Funds Status Breakdown */}
              {funds_status && funds_status.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-3">Funds Status Breakdown</h4>
                  <div className="space-y-2">
                    {funds_status.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-sm font-medium">{item.status}</span>
                        <span className="text-sm font-bold text-blue-600">{item.count} cases</span>
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
