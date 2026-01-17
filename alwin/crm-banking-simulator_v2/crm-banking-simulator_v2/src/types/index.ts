export interface JourneyStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed';
  icon: string;
  crmActions: CRMAction[];
}

export interface CRMAction {
  id: string;
  type: 'api' | 'event';
  name: string;
  description: string;
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  eventType?: 'inbound' | 'outbound';
  payload?: Record<string, unknown>;
  temenosMapping?: string;
}

export interface BankingApplication {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  journeySteps: JourneyStep[];
}

export interface APIDefinition {
  name: string;
  endpoint: string;
  method: string;
  description: string;
  requestPayload: Record<string, unknown>;
  responsePayload: Record<string, unknown>;
  temenosIntegration: {
    api: string;
    description: string;
  };
}

export interface EventDefinition {
  name: string;
  type: 'inbound' | 'outbound';
  description: string;
  payload: Record<string, unknown>;
  temenosEvent: string;
}

export type ApplicationType = 'cards' | 'digital' | 'payments' | 'onboarding';

export interface SimulatorState {
  selectedApp: ApplicationType | null;
  currentStep: number;
  isSimulating: boolean;
  activeAction: CRMAction | null;
}
