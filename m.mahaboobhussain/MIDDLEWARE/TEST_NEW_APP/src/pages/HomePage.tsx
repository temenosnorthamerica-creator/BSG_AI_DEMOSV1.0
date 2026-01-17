import { useNavigate } from 'react-router-dom'
import { CreditCard, Users, Monitor, Banknote, Server } from 'lucide-react'

interface CardItem {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  path: string
}

const cards: CardItem[] = [
  {
    id: 'cards',
    title: 'CARDS',
    description: 'Card management and processing solutions',
    icon: <CreditCard className="w-8 h-8" />,
    color: 'bg-blue-500',
    path: '/cards'
  },
  {
    id: 'crm',
    title: 'CRM',
    description: 'Customer relationship management',
    icon: <Users className="w-8 h-8" />,
    color: 'bg-green-500',
    path: '/crm'
  },
  {
    id: 'digital',
    title: 'DIGITAL',
    description: 'Digital banking and channels',
    icon: <Monitor className="w-8 h-8" />,
    color: 'bg-purple-500',
    path: '/digital'
  },
  {
    id: 'payments',
    title: 'PAYMENTS',
    description: 'Payment processing and transactions',
    icon: <Banknote className="w-8 h-8" />,
    color: 'bg-red-500',
    path: '/payments'
  },
  {
    id: 'middleware',
    title: 'MIDDLEWARE',
    description: 'Integration and middleware services',
    icon: <Server className="w-8 h-8" />,
    color: 'bg-yellow-500',
    path: '/middleware'
  }
]

function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen p-8">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-white mb-2">TEST_NEW_APP</h1>
        <p className="text-[#94a3b8]">Select a module to explore</p>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={() => navigate(card.path)}
              className="card cursor-pointer hover:scale-105 transition-transform hover:border-temenos-accent"
            >
              <div className={`${card.color} w-14 h-14 rounded-lg flex items-center justify-center text-white mb-4`}>
                {card.icon}
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">{card.title}</h2>
              <p className="text-[#94a3b8]">{card.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default HomePage
