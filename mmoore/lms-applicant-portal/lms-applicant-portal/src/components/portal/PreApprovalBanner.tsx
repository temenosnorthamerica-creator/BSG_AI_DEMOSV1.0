import { useNavigate } from 'react-router-dom';
import type { PreApprovalOffer } from '../../types';
import { formatCurrency } from '../../utils';
import { Button } from '../common';

interface PreApprovalBannerProps {
  offer: PreApprovalOffer;
}

export function PreApprovalBanner({ offer }: PreApprovalBannerProps) {
  const navigate = useNavigate();

  const handleApplyNow = () => {
    // Navigate to product application flow
    navigate('/products', { state: { selectedOffer: offer } });
  };

  return (
    <div className="bg-gradient-secu rounded-md p-8 text-white mb-8 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-2xl font-heading font-bold mb-3">{offer.ProductName}</h2>
          <p className="text-lg text-white/90">
            You've been pre-approved for <span className="font-bold text-white">{formatCurrency(offer.ApprovedAmount)}</span>
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleApplyNow}
          className="bg-white text-primary border-white hover:bg-gray-100 hover:text-primary-dark whitespace-nowrap shadow-md"
        >
          Apply Now
        </Button>
      </div>
    </div>
  );
}
