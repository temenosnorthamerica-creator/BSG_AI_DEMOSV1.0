export interface ApiResult {
  Success: boolean;
  Messages: string[];
  Warnings: string[];
}

export interface ApiSaveResult extends ApiResult {
  Id: string;
}

export interface LoginRequest {
  Username: string;
  Password: string;
}

export interface LoginResponse {
  Token: string;
  ExpiresIn: number;
  UserId: string;
}

export interface ApiKeyLoginRequest {
  ApiKey: string;
}

export interface ApiKeyLoginResponse {
  Token: string;
  Result: boolean;
  Messages: string[];
  ExceptionId: number;
}

export interface VerifyApplicantRequest {
  TIN: string;
  LastName: string;
  DateOfBirth: string;
  ZipCode: string;
}

export interface ApplicationSearchRequest {
  ApplicantTIN?: number;
  TIN?: string;
  ApplicationStatus?: string;
  ApplicantLastName?: string;
  PageNumber?: number;
  PageSize?: number;
}

export interface ApplicationSearchResponse {
  Applications: ApplicationSummary[];
  TotalCount: number;
  PageNumber: number;
  PageSize: number;
}

export interface ApplicationSummary {
  ApplicationIdentifier: string;
  ApplicationStatus: string;
  ApplicationDate: string;
  ProductName: string;
  ProductType: string;
  ApprovedAmount?: number;
}
