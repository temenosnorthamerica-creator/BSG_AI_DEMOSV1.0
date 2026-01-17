export interface Applicant {
  ApplicantId: string;
  ApplicantType: 'Primary' | 'CoApplicant' | 'Guarantor';
  FirstName: string;
  MiddleName?: string;
  LastName: string;
  Suffix?: string;
  Email: string;
  TIN: string;
  DateOfBirth: string;
  Addresses: Address[];
  Phones: Phone[];
  Incomes: Income[];
}

export interface Address {
  AddressId: string;
  AddressType: 'Home' | 'Mailing' | 'Work' | 'Previous';
  Street1: string;
  Street2?: string;
  City: string;
  State: string;
  ZipCode: string;
  Country: string;
  IsPrimary: boolean;
  YearsAtAddress?: number;
  MonthsAtAddress?: number;
}

export interface Phone {
  PhoneId: string;
  PhoneType: 'Home' | 'Mobile' | 'Work';
  PhoneNumber: string;
  IsPrimary: boolean;
}

export interface Income {
  IncomeId: string;
  IncomeType: 'Employment' | 'SelfEmployment' | 'Retirement' | 'Other';
  EmployerName?: string;
  JobTitle?: string;
  AnnualIncome: number;
  MonthlyIncome: number;
  StartDate?: string;
  YearsEmployed?: number;
}

export interface ApplicantProfile {
  ApplicantId: string;
  FirstName: string;
  LastName: string;
  Email: string;
  TIN: string;
  PreApprovalOffers: import('./application').PreApprovalOffer[];
}
