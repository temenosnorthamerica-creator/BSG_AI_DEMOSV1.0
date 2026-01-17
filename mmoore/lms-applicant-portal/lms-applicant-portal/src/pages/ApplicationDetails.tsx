import { useParams, useNavigate } from 'react-router-dom';
import { Header, Footer } from '../components/layout';
import { Card, Badge, Button } from '../components/common';
import { formatCurrency, formatDate } from '../utils';

// Mock data for demonstration
const mockApplicationDetails = {
  ApplicationIdentifier: 'app-001',
  ApplicationStatus: 'InProgress',
  ApplicationStatusDescription: 'In Progress',
  ApplicationDate: '2026-01-10',
  ProductName: 'Unsecured Signature Loan',
  ProductType: 'Loan',
  RequestedAmount: 15000,
  CreatedDate: '2026-01-10T10:30:00Z',
  ModifiedDate: '2026-01-12T14:45:00Z',
  Applicants: [
    {
      ApplicantId: '1',
      ApplicantType: 'Primary',
      FirstName: 'Michael',
      LastName: 'Moore',
      Email: 'michael.moore@example.com',
    },
  ],
};

export function ApplicationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // In real implementation: const { data: application } = useApplication(id);
  const application = mockApplicationDetails;

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'declined':
        return 'error';
      case 'inprogress':
      case 'underreview':
        return 'warning';
      case 'completed':
      case 'funded':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />

      <main className="flex-grow">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back button */}
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-primary hover:text-primary-dark mb-6 transition"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </button>

          {/* Application header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-2xl font-semibold text-gray-800">
                {application.ProductName}
              </h1>
              <Badge variant={getStatusVariant(application.ApplicationStatus)}>
                {application.ApplicationStatusDescription}
              </Badge>
            </div>
            <p className="text-gray-600">
              Application ID: {id}
            </p>
          </div>

          {/* Application details cards */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Loan details */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Loan Details
              </h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Product Type</dt>
                  <dd className="font-medium">{application.ProductType}</dd>
                </div>
                {application.RequestedAmount && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Requested Amount</dt>
                    <dd className="font-medium">
                      {formatCurrency(application.RequestedAmount)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-600">Application Date</dt>
                  <dd className="font-medium">
                    {formatDate(application.ApplicationDate)}
                  </dd>
                </div>
              </dl>
            </Card>

            {/* Applicant info */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Applicant Information
              </h2>
              {application.Applicants.map((applicant) => (
                <dl key={applicant.ApplicantId} className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Name</dt>
                    <dd className="font-medium">
                      {applicant.FirstName} {applicant.LastName}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Email</dt>
                    <dd className="font-medium">{applicant.Email}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Role</dt>
                    <dd className="font-medium">{applicant.ApplicantType}</dd>
                  </div>
                </dl>
              ))}
            </Card>
          </div>

          {/* Timeline / Status history */}
          <Card className="mt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Application Timeline
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 rounded-full bg-success mt-1.5"></div>
                <div>
                  <p className="font-medium">Application Created</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(application.CreatedDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 rounded-full bg-yellow-400 mt-1.5"></div>
                <div>
                  <p className="font-medium">In Progress</p>
                  <p className="text-sm text-gray-600">
                    Awaiting additional information
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Action buttons */}
          <div className="mt-6 flex gap-4">
            <Button variant="primary">Continue Application</Button>
            <Button variant="secondary">Upload Documents</Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
