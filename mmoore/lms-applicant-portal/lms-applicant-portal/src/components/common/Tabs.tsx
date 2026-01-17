interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

// SECU Brand Tabs
export function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex gap-2 border-b border-gray-200 pb-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            px-5 py-2.5 text-sm font-semibold transition-all duration-200 rounded-t
            focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset
            ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-sm'
                : 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-primary'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
