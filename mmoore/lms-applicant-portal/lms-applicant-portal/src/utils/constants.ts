export const PRODUCT_TYPES = {
  LOAN: 'Loan',
  CREDIT_CARD: 'CreditCard',
  ACCOUNT: 'Account',
} as const;

export const APPLICATION_STATUSES = {
  IN_PROGRESS: 'InProgress',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'UnderReview',
  APPROVED: 'Approved',
  DECLINED: 'Declined',
  FUNDED: 'Funded',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  APPLICATION_DETAILS: '/application/:id',
  PRODUCTS: '/products',
} as const;
