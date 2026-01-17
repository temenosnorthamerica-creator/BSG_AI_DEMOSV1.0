import type { Applicant } from './applicant';

export interface Application {
  ApplicationIdentifier: string;
  ApplicationStatus: string;
  ApplicationStatusDescription: string;
  ApplicationDate: string;
  ProductId: string;
  ProductName: string;
  ProductType: string;
  SubProductId?: string;
  SubProductName?: string;
  RequestedAmount?: number;
  ApprovedAmount?: number;
  ApprovedTerm?: number;
  ApprovedRate?: number;
  MonthlyPayment?: number;
  Applicants: Applicant[];
  CreatedDate: string;
  ModifiedDate: string;
}

export interface AccountProduct {
  ApplicationAccountProductId: string;
  ProductId: string;
  ProductName: string;
  ProductType: string;
  RequestedAmount?: number;
  ApprovedAmount?: number;
  Status: string;
}

export interface PreApprovalOffer {
  OfferId: string;
  ProductName: string;
  ProductType: 'Loan' | 'CreditCard' | 'Account';
  ApprovedAmount: number;
  InterestRate?: number;
  Term?: number;
  ExpirationDate: string;
  Description?: string;
}

export type ApplicationStatusType =
  | 'InProgress'
  | 'Submitted'
  | 'UnderReview'
  | 'Approved'
  | 'Declined'
  | 'Funded'
  | 'Cancelled'
  | 'Completed';

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatusType, string> = {
  InProgress: 'In Progress',
  Submitted: 'Submitted',
  UnderReview: 'Under Review',
  Approved: 'Approved',
  Declined: 'Declined',
  Funded: 'Funded',
  Cancelled: 'Cancelled',
  Completed: 'Completed',
};
