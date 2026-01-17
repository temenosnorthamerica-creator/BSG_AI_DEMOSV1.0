import { apiClient, endpoints } from '../client';
import type {
  Application,
  ApplicationSearchRequest,
  ApplicationSearchResponse,
  PreApprovalOffer,
} from '../../types';

export const applicationService = {
  async search(params: ApplicationSearchRequest): Promise<ApplicationSearchResponse> {
    const response = await apiClient.post<ApplicationSearchResponse>(
      endpoints.application.search,
      params
    );
    return response.data;
  },

  async getById(applicationId: string): Promise<Application> {
    const response = await apiClient.get<{ Data: Application }>(
      endpoints.application.get(applicationId)
    );
    return response.data.Data;
  },

  async create(applicationData: Partial<Application>): Promise<{ Id: string }> {
    const response = await apiClient.post(endpoints.application.create, applicationData);
    return response.data;
  },

  async update(applicationId: string, applicationData: Partial<Application>): Promise<void> {
    await apiClient.put(endpoints.application.update(applicationId), applicationData);
  },

  async getPreApprovalOffers(tin: string): Promise<PreApprovalOffer[]> {
    try {
      const response = await apiClient.get<{ Offers: PreApprovalOffer[] }>(
        endpoints.prescreen.getOffers(tin)
      );
      return response.data.Offers || [];
    } catch {
      // Return empty array if no offers or error
      return [];
    }
  },
};
