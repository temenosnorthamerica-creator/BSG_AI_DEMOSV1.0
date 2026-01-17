import { useState } from 'react';
import { useAuth } from '../hooks';
import { Header, Footer } from '../components/layout';
import {
  WelcomeSection,
  PreApprovalBanner,
  ApplicationTabs,
  ApplicationCard,
  NewProductSection,
} from '../components/portal';
import type { ApplicationTabType } from '../components/portal';
import type { ApplicationSummary, PreApprovalOffer } from '../types';

// Mock data for demonstration
const mockPreApprovalOffer: PreApprovalOffer = {
  OfferId: '1',
  ProductName: 'Auto Loan',
  ProductType: 'Loan',
  ApprovedAmount: 45000,
  ExpirationDate: '2026-12-31',
};

const mockApplications: ApplicationSummary[] = [
  {
    ApplicationIdentifier: 'app-001',
    ApplicationStatus: 'InProgress',
    ApplicationDate: '2026-01-10',
    ProductName: 'Unsecured Signature Loan',
    ProductType: 'Loan',
  },
  {
    ApplicationIdentifier: 'app-002',
    ApplicationStatus: 'InProgress',
    ApplicationDate: '2026-01-08',
    ProductName: 'Prestige VISA',
    ProductType: 'CreditCard',
  },
];

const mockCompletedApplications: ApplicationSummary[] = [
  {
    ApplicationIdentifier: 'app-003',
    ApplicationStatus: 'Completed',
    ApplicationDate: '2025-12-15',
    ProductName: 'Personal Loan',
    ProductType: 'Loan',
    ApprovedAmount: 10000,
  },
];

export function PortalDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ApplicationTabType>('in_progress');

  // In a real implementation, these would come from API hooks:
  // const { data: applications } = useApplications({ ... });
  // const { data: offers } = usePreApprovalOffers(user?.tin);

  const displayedApplications =
    activeTab === 'in_progress' ? mockApplications : mockCompletedApplications;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />

      <main className="flex-grow">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <WelcomeSection firstName={user?.firstName || 'User'} />

          {/* Pre-approval banner - only show if there are offers */}
          <PreApprovalBanner offer={mockPreApprovalOffer} />

          {/* Application tabs and list */}
          <ApplicationTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="space-y-4">
            {displayedApplications.length > 0 ? (
              displayedApplications.map((app) => (
                <ApplicationCard key={app.ApplicationIdentifier} application={app} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No {activeTab === 'in_progress' ? 'in progress' : 'completed'} applications
              </div>
            )}
          </div>

          {/* New product section */}
          <NewProductSection />
        </div>
      </main>

      <Footer />
    </div>
  );
}
