import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig = {
  open: {
    label: 'Open',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200',
  },
  pending_review: {
    label: 'Pending Review',
    className: 'bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200',
  },
  approved: {
    label: 'Approved',
    className: 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200',
  },
  closed: {
    label: 'Closed',
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200',
  },
  // FTDH specific statuses
  pending: {
    label: 'Pending',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200',
  },
  responded: {
    label: 'Responded',
    className: 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200',
  },
  breached: {
    label: 'SLA Breached',
    className: 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200',
  },
};

export function StatusBadge({ status, className }) {
  const config = statusConfig[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-800',
  };

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}

export default StatusBadge;
