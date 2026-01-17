import { useNavigate } from 'react-router-dom';
import { Card } from '../common';
import type { ApplicationSummary } from '../../types';

interface ApplicationCardProps {
  application: ApplicationSummary;
}

// Icon component for different product types
function ProductIcon({ productType }: { productType: string }) {
  const iconClass = 'w-10 h-10 text-primary';

  if (productType.toLowerCase().includes('card') || productType.toLowerCase().includes('visa')) {
    // Credit card icon
    return (
      <svg
        className={iconClass}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="1.5" />
        <path d="M2 10h20" strokeWidth="1.5" />
        <path d="M6 14h4" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  // Default: Bank/Loan icon
  return (
    <svg
      className={iconClass}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/application/${application.ApplicationIdentifier}`);
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'inprogress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'approved':
        return 'Approved';
      case 'declined':
        return 'Declined';
      default:
        return status;
    }
  };

  return (
    <Card className="mb-4" hoverable onClick={handleViewDetails}>
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <ProductIcon productType={application.ProductType || application.ProductName} />
        </div>

        <div className="flex-grow">
          <h3 className="text-lg font-semibold text-gray-800">
            {application.ProductName}
          </h3>
          <div className="text-sm text-gray-600">
            <span className="text-gray-500">Status</span>
            <br />
            <span className="font-medium">{getStatusLabel(application.ApplicationStatus)}</span>
          </div>
        </div>

        <div className="flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails();
            }}
            className="text-primary hover:text-primary-dark font-medium text-sm transition"
          >
            View Details
          </button>
        </div>
      </div>
    </Card>
  );
}
