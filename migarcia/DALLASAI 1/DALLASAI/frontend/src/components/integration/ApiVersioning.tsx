import { ArrowLeft, Check } from 'lucide-react'

interface ApiVersioningProps {
  onBack: () => void
}

export function ApiVersioning({ onBack }: ApiVersioningProps) {
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to API Overview</span>
      </button>

      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-[#283054] mb-2">API Versioning</h1>
        <div className="h-1 w-20 bg-purple-600 rounded"></div>
      </div>

      {/* Main Content */}
      <div className="card">
        <div className="space-y-6">
          <p className="text-gray-700 leading-relaxed">
            Temenos employs semantic versioning for its REST APIs, following a structured format of major.minor.patch. This approach ensures backward compatibility as the system evolves, allowing clients to rely on stable API behavior while benefiting from incremental improvements and fixes. The APIs are well-documented using OpenAPI Specifications (Swagger), which facilitates clear understanding and integration by developers. Semantic versioning enables Temenos to introduce new features or changes without disrupting existing integrations, as major versions indicate breaking changes, minor versions add backward-compatible functionality, and patch versions address bug fixes. This disciplined versioning strategy supports a smooth upgrade path and reduces operational risks for banks integrating with Temenos.
          </p>

          <p className="text-gray-700 leading-relaxed">
            The versioning is integral to the comprehensive REST API framework that covers most functionalities needed by financial institutions. Developers can access these APIs via the Temenos developer portal, which provides detailed documentation and a shared sandbox environment for testing. Additionally, banks can create custom APIs using the Workbench low-code tool, which aligns with the versioning strategy to maintain consistency and compatibility.
          </p>

          <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded-r-lg">
            <h3 className="font-bold text-purple-900 mb-2">Business Benefit</h3>
            <p className="text-gray-700">
              This clear and structured API versioning approach minimizes integration disruptions and supports seamless evolution of banking services. It empowers banks to innovate confidently, knowing their systems remain stable and compatible with Temenos' continuous enhancements.
            </p>
          </div>

          {/* Key Points */}
          <div className="mt-6">
            <h3 className="text-xl font-bold text-[#283054] mb-4">Key Points</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-gray-900">Semantic Versioning (Major.Minor.Patch - xx.xx.xx)</span>
                  <p className="text-gray-600 text-sm">
                    as per{' '}
                    <a
                      href="https://semver.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800 underline"
                    >
                      semver.org
                    </a>
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-gray-900">Change to API means a new version to be created</span>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-gray-900">Maintains backward compatibility</span>
                </div>
              </div>
            </div>
          </div>

          {/* Version Scenarios Matrix */}
          <div className="mt-6">
            <h3 className="text-xl font-bold text-[#283054] mb-4">Version Scenarios</h3>
            <div className="overflow-x-auto">
              <table className="border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-purple-600 text-white">
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Sample Version</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Scenario</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-mono font-semibold text-purple-700">v1.0.0</td>
                    <td className="border border-gray-300 px-4 py-2 text-gray-700">Initial version</td>
                  </tr>
                  <tr className="bg-gray-50 hover:bg-gray-100">
                    <td className="border border-gray-300 px-4 py-2 font-mono font-semibold text-purple-700">v1.0.1</td>
                    <td className="border border-gray-300 px-4 py-2 text-gray-700">Adding a new field to an existing API</td>
                  </tr>
                  <tr className="bg-white hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-mono font-semibold text-purple-700">v1.1.0</td>
                    <td className="border border-gray-300 px-4 py-2 text-gray-700">Adding a new endpoint to the existing service</td>
                  </tr>
                  <tr className="bg-gray-50 hover:bg-gray-100">
                    <td className="border border-gray-300 px-4 py-2 font-mono font-semibold text-purple-700">v2.0.0</td>
                    <td className="border border-gray-300 px-4 py-2 text-gray-700">Adding a breaking change. For example, adding a mandatory selection criteria to an existing API</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Example */}
          <div className="mt-6">
            <h3 className="text-xl font-bold text-[#283054] mb-4">Example</h3>
            <div className="bg-gray-100 rounded-lg p-4 border-l-4 border-purple-600">
              <code className="text-purple-700 font-mono text-lg">/api/v1.0.1/party/customers</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
