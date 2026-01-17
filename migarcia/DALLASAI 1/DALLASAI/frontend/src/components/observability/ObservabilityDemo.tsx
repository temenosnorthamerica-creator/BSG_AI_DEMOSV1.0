import { BarChart3, Activity, ExternalLink } from 'lucide-react'

const GRAFANA_DASHBOARDS_URL = 'https://transactwb.temenos.com/grafana/dashboards'
const DASHBOARD_1_URL = 'https://transactwb.temenos.com/grafana/d/mrtS77BGz/channel-transaction-summary?orgId=1'
const DASHBOARD_2_URL = 'https://transactwb.temenos.com/grafana/d/dwgixTnnzj/iris-monitor?orgId=1'

export function ObservabilityDemo() {
  const openGrafanaDashboards = () => {
    window.open(GRAFANA_DASHBOARDS_URL, '_blank', 'noopener,noreferrer')
  }

  const openDashboard1 = () => {
    window.open(DASHBOARD_1_URL, '_blank', 'noopener,noreferrer,width=1400,height=900')
  }

  const openDashboard2 = () => {
    window.open(DASHBOARD_2_URL, '_blank', 'noopener,noreferrer,width=1400,height=900')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <button
        onClick={openGrafanaDashboards}
        className="card bg-gradient-to-br from-purple-600 to-indigo-700 text-white overflow-hidden relative w-full text-left transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer group"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>

        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Activity className="w-9 h-9 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-1">Grafana Dashboard</h2>
              <p className="text-purple-100">Enterprise-grade monitoring & analytics</p>
            </div>
            <ExternalLink className="w-6 h-6 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </button>

      {/* Dashboard Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={openDashboard1}
          className="card text-left transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 transition-colors">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[#283054] mb-1">Channel Transaction Summary</h3>
              <p className="text-sm text-[#4A5568]">View transaction metrics and channel performance</p>
            </div>
            <ExternalLink className="w-5 h-5 text-[#4A5568] group-hover:text-[#283054] transition-colors" />
          </div>
        </button>

        <button
          onClick={openDashboard2}
          className="card text-left transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-600 transition-colors">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[#283054] mb-1">IRIS Monitor</h3>
              <p className="text-sm text-[#4A5568]">Monitor IRIS system metrics and health</p>
            </div>
            <ExternalLink className="w-5 h-5 text-[#4A5568] group-hover:text-[#283054] transition-colors" />
          </div>
        </button>
      </div>
    </div>
  )
}
