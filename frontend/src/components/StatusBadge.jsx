const STATUS_BADGE_VARIANTS = {
  Draft: 'secondary',
  Active: 'success',
  Paused: 'warning',
  Closed: 'dark',
  Pending: 'secondary',
  'Documents Pending': 'warning',
  'In Progress': 'info',
  Completed: 'success',
};

const StatusBadge = ({ status }) => {
  const variant = STATUS_BADGE_VARIANTS[status] || 'secondary';

  return <span className={`badge bg-${variant}`}>{status}</span>;
};

export default StatusBadge;
