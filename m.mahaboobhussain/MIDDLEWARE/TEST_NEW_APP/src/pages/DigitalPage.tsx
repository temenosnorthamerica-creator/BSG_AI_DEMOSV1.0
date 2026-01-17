import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Monitor, Users, UserPlus, Search, ChevronDown, ChevronRight, Wallet, PlusCircle, List } from 'lucide-react'
import CreateCustomer from '../components/digital/CreateCustomer'
import SearchCustomer from '../components/digital/SearchCustomer'
import CreateAccount from '../components/digital/CreateAccount'
import SearchAccount from '../components/digital/SearchAccount'
import ListCustomers from '../components/digital/ListCustomers'

type MenuView = 'create-customer' | 'search-customer' | 'create-account' | 'search-account' | 'list-customers' | null

interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  children?: {
    id: MenuView
    label: string
    icon: React.ReactNode
  }[]
}

const menuItems: MenuItem[] = [
  {
    id: 'customer-servicing',
    label: 'Customer Servicing',
    icon: <Users className="w-5 h-5" />,
    children: [
      {
        id: 'create-customer',
        label: 'Create Customer',
        icon: <UserPlus className="w-4 h-4" />
      },
      {
        id: 'search-customer',
        label: 'Search Customer',
        icon: <Search className="w-4 h-4" />
      },
      {
        id: 'list-customers',
        label: 'List Customers',
        icon: <List className="w-4 h-4" />
      },
      {
        id: 'create-account',
        label: 'Create Account',
        icon: <PlusCircle className="w-4 h-4" />
      },
      {
        id: 'search-account',
        label: 'Search Account',
        icon: <Wallet className="w-4 h-4" />
      }
    ]
  }
]

function DigitalPage() {
  const navigate = useNavigate()
  const [activeView, setActiveView] = useState<MenuView>('create-customer')
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['customer-servicing'])

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    )
  }

  const renderContent = () => {
    switch (activeView) {
      case 'create-customer':
        return <CreateCustomer />
      case 'search-customer':
        return <SearchCustomer />
      case 'list-customers':
        return <ListCustomers />
      case 'create-account':
        return <CreateAccount />
      case 'search-account':
        return <SearchAccount />
      default:
        return (
          <div className="text-center text-[#94a3b8] py-12">
            <Monitor className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Select an option from the menu</p>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen p-8">
      <button
        onClick={() => navigate('/')}
        className="btn-secondary flex items-center gap-2 mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </button>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-purple-500 w-16 h-16 rounded-lg flex items-center justify-center text-white">
            <Monitor className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">DIGITAL</h1>
            <p className="text-[#94a3b8]">Digital Banking Services</p>
          </div>
        </div>

        {/* Main Layout with Sidebar */}
        <div className="flex gap-6">
          {/* Sidebar Menu */}
          <div className="w-64 flex-shrink-0">
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-4">Menu</h3>
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <div key={item.id}>
                    {/* Parent Menu Item */}
                    <button
                      onClick={() => toggleMenu(item.id)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[#E2E8F0] hover:bg-[#334155] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {item.children && (
                        expandedMenus.includes(item.id)
                          ? <ChevronDown className="w-4 h-4" />
                          : <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    {/* Child Menu Items */}
                    {item.children && expandedMenus.includes(item.id) && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <button
                            key={child.id}
                            onClick={() => setActiveView(child.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                              activeView === child.id
                                ? 'bg-[#0066CC] text-white'
                                : 'text-[#94a3b8] hover:bg-[#334155] hover:text-white'
                            }`}
                          >
                            {child.icon}
                            <span>{child.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DigitalPage
