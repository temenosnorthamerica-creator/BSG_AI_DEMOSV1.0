import { useQuery } from '@tanstack/react-query';
import { applicationService } from '../api/services';
import type { ApplicationSearchRequest } from '../types';

export function useApplications(params: ApplicationSearchRequest) {
  return useQuery({
    queryKey: ['applications', params],
    queryFn: () => applicationService.search(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useApplication(applicationId: string | undefined) {
  return useQuery({
    queryKey: ['application', applicationId],
    queryFn: () => applicationService.getById(applicationId!),
    enabled: !!applicationId,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePreApprovalOffers(tin: string | undefined) {
  return useQuery({
    queryKey: ['preApprovalOffers', tin],
    queryFn: () => applicationService.getPreApprovalOffers(tin!),
    enabled: !!tin,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
