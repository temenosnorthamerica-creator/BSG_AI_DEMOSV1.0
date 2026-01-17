import { Tabs } from '../common';

export type ApplicationTabType = 'in_progress' | 'completed';

interface ApplicationTabsProps {
  activeTab: ApplicationTabType;
  onTabChange: (tab: ApplicationTabType) => void;
}

const tabs = [
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
];

export function ApplicationTabs({ activeTab, onTabChange }: ApplicationTabsProps) {
  return (
    <div className="mb-6">
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => onTabChange(tabId as ApplicationTabType)}
      />
    </div>
  );
}
