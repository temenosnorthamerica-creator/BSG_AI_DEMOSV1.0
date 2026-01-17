import { useState } from 'react'
import { Info, ArrowRight, ArrowLeft } from 'lucide-react'

interface TooltipConfig {
  id: string
  title: string
  description: string
}

export function SecurityArchitecture() {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const [showAuthDetails, setShowAuthDetails] = useState(false)

  const tooltips: Record<string, TooltipConfig> = {
    'key-management': {
      id: 'key-management',
      title: 'Key Management',
      description: 'The system checks for file integrity upon upload and download using checksums and cryptographic hashing methods. SSH keys and certificates are stored in Azure Key Vault to ensure secure key management practices.'
    },
    'secrets-management': {
      id: 'secrets-management',
      title: 'Secrets Management',
      description: 'Secrets management depends on stack deployment and requirements. Runtime secrets can be held within Hashicorp Vault, and minimum privilege should be used around key issuance, with audit logging of issued secrets. Good practice dictates that all runtime secrets are rotated at each deploy, and Cryptographic keys are rotated every 3 months, or whenever required by the organization. For Azure deployment, Temenos recommend using Azure Key Vault - Azure Key Vault: Azure Key Vault is a secure and centralized key management service that helps you safeguard cryptographic keys, certificates, and secrets used by cloud applications and services. Azure Key Vault is a cloud service that provides secure storage of keys for encrypting data. Multiple keys, and multiple versions of the same key, can be kept in the Azure Key Vault. Cryptographic keys in Azure Key Vault are represented as JSON Web Key [JWK] objects.'
    },
    'temenos-vault': {
      id: 'temenos-vault',
      title: 'Temenos Vault',
      description: 'Users should be able to create and store the application Certificates into the Vault (Azure Key vault). Applications should be able to retrieve the Certificates from the vault (Azure Key vault) and use it on the fly without any storing mechanism. Temenos Vault APIs should be created to support the above requirements to interact with the Vault (Azure Key vault). Temenos Vault – provides common framework for our products to integrate with underlaying platform Secrets services. Temenos Vault provides a facade that can be used by products and can be configured to point to the relevant Vault implementation based on the deployment environment. As well as this it can be used by the SaaS platform for provisioning the secrets, keys, and certificates for product or for the platform. We will support Azure Key Vault, AWS Secret, Key and Certificate Manager as well as Hashicorp Vault for On Premise solutions.'
    },
    'externalized-auth': {
      id: 'externalized-auth',
      title: 'Externalized Authorization',
      description: 'Temenos solution supports the externalized mechanism based on SAML 2.0, OIDC/ JSON Web Token (JWT) for authentication.  OAuth is an open standard authorization protocol. It enables your account information to be obtained by third-party services. Without exposing user credentials, OAuth provides an access token and a refresh token for third-party services.'
    },
    'data-encryption': {
      id: 'data-encryption',
      title: 'Data Encryption',
      description: 'Temenos uses a range of security controls to protect data at rest, at use and in transit.  One of these mechanisms is Transparent Data Encryption (TDE) which provides real-time encryption and decryption of the database, associated backups, and transaction log files at rest. TDE protects data and log files, using AES (256-bit encryption) encryption algorithms. Temenos can offer encryption today via eXate as part of the Temenos Exchange ecosystem.  (requiring a dedicated discussion and license with eXate company).'
    },
    'certificate-management': {
      id: 'certificate-management',
      title: 'Certificate Management',
      description: ''
    },
    'bank-iam': {
      id: 'bank-iam',
      title: 'Bank\'s Identity Access Management',
      description: 'For authentication, Temenos solution makes use of Bank\'s Identity and Access Management (IaM) solution like Active Directory. The bank\'s individual employees are authenticated at Active Directory. Temenos comes pre-integrated with KeyCloak. KeyCloak will become the defacto IaM system for Temenos applications. It acts as the identity broker for redirecting authentication requests to the Bank managed IaM solution.'
    },
    'authentication-box': {
      id: 'authentication-box',
      title: 'Authentication',
      description: 'The external authentication mechanism for Temenos solution leverages Keycloak solution. Temenos SaaS leverages Keycloak as authentication and authorization. Keycloak can be federated to another Bank\'s identity management system. A bank can replace Keycloak with any existing fit-for-purpose IAM solution capable of OIDC AZ Code & PKCE & client grant type private key JSON Web Token (JWT).'
    },
    'authorization-box': {
      id: 'authorization-box',
      title: 'Authorization',
      description: 'Temenos has embedded internal mechanism, native to the solution. The internal mechanism provides sufficient and granular access management to all applications as well as role/group facilities. The Temenos Security Management System (SMS) provides role-based access limits and full transaction and user activity audit. Each user has their own profile within the SMS which contains full user details and security settings to control the user\'s access within the system. SMS managing the access control, executing the following steps: Checks each user activity against the profile to determine validity; unacceptable actions are prevented and recorded (User Profile), Validates each contract against conditions, such as limits and exchange rate tolerance bands, before it is accepted (User Authority), Make specific data inaccessible to specified users or user groups based on conditions (Data Security).'
    },
    'audit-box': {
      id: 'audit-box',
      title: 'Audit',
      description: 'Temenos provides a full audit and logging across the entire business and technical landscape which can be utilized to track important security related events. The audit trails are stored as part of each data record and include details of the change made, by whom and when. Optionally it can include a delivery reference and IP address. Auditing is done both for users who use the solution directly or via APIs.\n\nAuditing includes: User activity auditing includes details of; Applications accessed, ID of transactions executed, Time connected, No. of operations executed etc. Application activity auditing includes details of; ID of new transactions, Inputter and Authorizer,  Security violation reports store details of unauthorised access attempts including who accessed the system, when and the target application'
    },
    'tls-entry': {
      id: 'tls-entry',
      title: 'TLS 1.2 Entry Points',
      description: 'All access to web applications and API endpoints is over HTTPS, using modern TLS ciphers (TLS 1.2).'
    }
  }

  // Authentication Details Page Component
  const AuthenticationDetailsPage = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#283054]">Authentication Details</h2>
        <button
          onClick={() => setShowAuthDetails(false)}
          className="flex items-center gap-2 px-4 py-2 bg-[#EF4444] text-white rounded-lg hover:bg-[#DC2626] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Architecture</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* Keycloak Section */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-xl font-bold text-[#283054] mb-4">Keycloak Authentication</h3>
          <p className="text-[#4A5568] mb-4">
            The external authentication mechanism for Temenos solution leverages Keycloak solution. Temenos SaaS leverages Keycloak as authentication and authorization. Keycloak can be federated to another Bank's identity management system.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <p className="text-sm text-[#4A5568]">
              <strong>Note:</strong> A bank can replace Keycloak with any existing fit-for-purpose IAM solution capable of OIDC AZ Code & PKCE & client grant type private key JSON Web Token (JWT).
            </p>
          </div>
        </div>

        {/* Bank's IAM Section */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-xl font-bold text-[#283054] mb-4">Bank's Identity Access Management (IAM)</h3>
          <p className="text-[#4A5568] mb-4">
            For authentication, Temenos solution makes use of Bank's Identity and Access Management (IaM) solution like Active Directory. The bank's individual employees are authenticated at Active Directory.
          </p>
          <ul className="list-disc list-inside space-y-2 text-[#4A5568]">
            <li>Temenos comes pre-integrated with KeyCloak</li>
            <li>KeyCloak will become the defacto IaM system for Temenos applications</li>
            <li>It acts as the identity broker for redirecting authentication requests to the Bank managed IaM solution</li>
          </ul>
        </div>

        {/* Externalized Authorization Section */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-xl font-bold text-[#283054] mb-4">Externalized Authorization</h3>
          <p className="text-[#4A5568] mb-4">
            Temenos solution supports the externalized mechanism based on SAML 2.0, OIDC/ JSON Web Token (JWT) for authentication.
          </p>
          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
            <p className="text-sm text-[#4A5568]">
              <strong>OAuth:</strong> OAuth is an open standard authorization protocol. It enables your account information to be obtained by third-party services. Without exposing user credentials, OAuth provides an access token and a refresh token for third-party services.
            </p>
          </div>
        </div>

        {/* Protocols Section */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-xl font-bold text-[#283054] mb-4">Supported Protocols</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-[#283054] mb-2">oAuth 2.0</h4>
              <p className="text-sm text-[#4A5568]">Open standard authorization protocol</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-[#283054] mb-2">OpenID Connect</h4>
              <p className="text-sm text-[#4A5568]">Identity layer on top of OAuth 2.0</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-[#283054] mb-2">JWT</h4>
              <p className="text-sm text-[#4A5568]">JSON Web Token for secure token transmission</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-[#283054] mb-2">SAML 2.0</h4>
              <p className="text-sm text-[#4A5568]">Security Assertion Markup Language</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Show Authentication Details page if toggled
  if (showAuthDetails) {
    return (
      <div className="card relative" style={{ minHeight: '600px', padding: '20px', backgroundColor: '#F5F7FA' }}>
        <AuthenticationDetailsPage />
      </div>
    )
  }

  return (
    <div className="card relative" style={{ minHeight: '600px', padding: '20px', backgroundColor: '#F5F7FA' }}>
      {/* Label in right upper corner */}
      <div className="absolute top-4 right-4 z-50">
        <div className="bg-white px-4 py-2 rounded-lg shadow-lg border-2 border-[#283054]">
          <p className="text-sm font-semibold text-[#283054]">Here is the Temenos Security Architecture</p>
        </div>
      </div>

      {/* Switch to Authentication Details button - Right lower corner */}
      <div className="absolute bottom-4 right-4 z-50">
        <button
          onClick={() => setShowAuthDetails(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#EF4444] text-white rounded-lg shadow-lg hover:bg-[#DC2626] transition-colors"
        >
          <span className="font-semibold">Authentication Details</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main SVG Container - Responsive and proportional */}
      <svg
        viewBox="0 0 1200 750"
        className="w-full h-auto"
        style={{ maxHeight: 'calc(100vh - 200px)' }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background */}
        <rect width="1200" height="750" fill="#F5F7FA" />

        {/* TLS 1.2 Entry Points Container (Leftmost Dark Blue) */}
        <g id="tls-entry">
          <rect x="20" y="80" width="180" height="480" fill="#1E3A8A" rx="8" />
          <text x="110" y="110" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">TLS 1.2</text>
          
          {/* User Interface */}
          <rect x="40" y="140" width="140" height="90" fill="#3B82F6" rx="4" />
          <text x="110" y="170" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">User Interface</text>
          
          {/* APIs */}
          <rect x="40" y="250" width="140" height="90" fill="#3B82F6" rx="4" />
          <text x="110" y="280" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">APIs</text>
          
          {/* Events */}
          <rect x="40" y="360" width="140" height="90" fill="#3B82F6" rx="4" />
          <text x="110" y="390" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">Events</text>
          
          {/* Interactive area for tooltip */}
          <rect 
            x="20" 
            y="80" 
            width="180" 
            height="480" 
            fill="transparent" 
            style={{ cursor: 'help' }}
            onMouseEnter={() => setActiveTooltip('tls-entry')}
            onMouseLeave={() => setActiveTooltip(null)}
          />
        </g>

        {/* Temenos Software Container (Central Dark Blue) */}
        <g id="temenos-software">
          <rect x="240" y="80" width="500" height="480" fill="#1E3A8A" rx="8" />
          <text x="490" y="110" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">Temenos Software</text>
          
          {/* Authentication Box */}
          <rect x="260" y="140" width="220" height="140" fill="#3B82F6" rx="4" />
          <text x="370" y="165" textAnchor="middle" fill="white" fontSize="15" fontWeight="bold">Authentication</text>
          <text x="370" y="195" textAnchor="middle" fill="white" fontSize="11">oAuth 2.0, OpenID Connect</text>
          <text x="370" y="215" textAnchor="middle" fill="white" fontSize="11">JWT, SAML</text>
          <text x="370" y="240" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">Role</text>
          <text x="370" y="265" textAnchor="middle" fill="white" fontSize="11">audit</text>
          <rect 
            x="260" 
            y="140" 
            width="220" 
            height="140" 
            fill="transparent" 
            style={{ cursor: 'help' }}
            onMouseEnter={() => setActiveTooltip('authentication-box')}
            onMouseLeave={() => setActiveTooltip(null)}
          />
          
          {/* Authorization Box */}
          <rect x="260" y="300" width="220" height="140" fill="#3B82F6" rx="4" />
          <text x="370" y="330" textAnchor="middle" fill="white" fontSize="15" fontWeight="bold">Authorization</text>
          <text x="370" y="360" textAnchor="middle" fill="white" fontSize="11">(RBAC, ABAC)</text>
          <text x="370" y="385" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">role</text>
          <rect 
            x="260" 
            y="300" 
            width="220" 
            height="140" 
            fill="transparent" 
            style={{ cursor: 'help' }}
            onMouseEnter={() => setActiveTooltip('authorization-box')}
            onMouseLeave={() => setActiveTooltip(null)}
          />
          
          {/* Audit Box */}
          <rect x="500" y="140" width="220" height="100" fill="#3B82F6" rx="4" />
          <text x="610" y="175" textAnchor="middle" fill="white" fontSize="15" fontWeight="bold">Audit</text>
          <rect 
            x="500" 
            y="140" 
            width="220" 
            height="100" 
            fill="transparent" 
            style={{ cursor: 'help' }}
            onMouseEnter={() => setActiveTooltip('audit-box')}
            onMouseLeave={() => setActiveTooltip(null)}
          />
        </g>

        {/* Bank's IAM (Top Right Purple) */}
        <g id="bank-iam">
          <rect x="780" y="80" width="200" height="110" fill="#8B5CF6" rx="4" />
          <text x="880" y="110" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">Bank&apos;s identity access</text>
          <text x="880" y="130" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">management (IAM)</text>
          <text x="880" y="160" textAnchor="middle" fill="white" fontSize="10">oAuth 2.0, OpenID Connect</text>
          <text x="880" y="175" textAnchor="middle" fill="white" fontSize="10">JWT, SAML</text>
          <rect 
            x="780" 
            y="80" 
            width="200" 
            height="110" 
            fill="transparent" 
            style={{ cursor: 'help' }}
            onMouseEnter={() => setActiveTooltip('bank-iam')}
            onMouseLeave={() => setActiveTooltip(null)}
          />
        </g>

        {/* Externalized Authorization (XACML) - Light Blue */}
        <g id="externalized-auth">
          <rect x="780" y="220" width="200" height="90" fill="#60A5FA" rx="4" />
          <text x="880" y="250" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">Externalized authorization</text>
          <text x="880" y="275" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">(XACML)</text>
          <rect 
            x="780" 
            y="220" 
            width="200" 
            height="90" 
            fill="transparent" 
            style={{ cursor: 'help' }}
            onMouseEnter={() => setActiveTooltip('externalized-auth')}
            onMouseLeave={() => setActiveTooltip(null)}
          />
        </g>

        {/* Temenos Vault (Light Blue) */}
        <g id="temenos-vault">
          <rect x="780" y="340" width="200" height="110" fill="#60A5FA" rx="4" />
          <text x="880" y="380" textAnchor="middle" fill="white" fontSize="15" fontWeight="bold">Temenos Vault</text>
          <rect 
            x="780" 
            y="340" 
            width="200" 
            height="110" 
            fill="transparent" 
            style={{ cursor: 'help' }}
            onMouseEnter={() => setActiveTooltip('temenos-vault')}
            onMouseLeave={() => setActiveTooltip(null)}
          />
        </g>

        {/* Secrets Management (Purple) */}
        <g id="secrets-management">
          <rect x="1020" y="280" width="160" height="70" fill="#8B5CF6" rx="4" />
          <text x="1100" y="310" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Secrets</text>
          <text x="1100" y="335" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">management</text>
          <rect 
            x="1020" 
            y="280" 
            width="160" 
            height="70" 
            fill="transparent" 
            style={{ cursor: 'help' }}
            onMouseEnter={() => setActiveTooltip('secrets-management')}
            onMouseLeave={() => setActiveTooltip(null)}
          />
        </g>

        {/* Key Management (Purple) */}
        <g id="key-management">
          <rect x="1020" y="370" width="160" height="70" fill="#8B5CF6" rx="4" />
          <text x="1100" y="400" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Key</text>
          <text x="1100" y="425" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">management</text>
          <rect 
            x="1020" 
            y="370" 
            width="160" 
            height="70" 
            fill="transparent" 
            style={{ cursor: 'help' }}
            onMouseEnter={() => setActiveTooltip('key-management')}
            onMouseLeave={() => setActiveTooltip(null)}
          />
        </g>

        {/* Certificate Management (Purple) */}
        <g id="certificate-management">
          <rect x="1020" y="460" width="160" height="70" fill="#8B5CF6" rx="4" />
          <text x="1100" y="490" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Certificate</text>
          <text x="1100" y="515" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Management</text>
          <rect 
            x="1020" 
            y="460" 
            width="160" 
            height="70" 
            fill="transparent" 
            style={{ cursor: 'help' }}
            onMouseEnter={() => setActiveTooltip('certificate-management')}
            onMouseLeave={() => setActiveTooltip(null)}
          />
        </g>

        {/* DB (Database) - Cylindrical representation - Aligned horizontally with Data Encryption */}
        <g id="database">
          <ellipse cx="490" cy="600" rx="80" ry="20" fill="#10B981" />
          <rect x="410" y="600" width="160" height="70" fill="#10B981" />
          <ellipse cx="490" cy="670" rx="80" ry="20" fill="#059669" />
          <text x="490" y="640" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">DB</text>
        </g>

        {/* Data Encryption (Bottom Left Purple) - Aligned horizontally with DB */}
        <g id="data-encryption">
          <rect x="20" y="600" width="300" height="110" fill="#8B5CF6" rx="4" />
          <text x="170" y="635" textAnchor="middle" fill="white" fontSize="15" fontWeight="bold">Data Encryption</text>
          <text x="170" y="660" textAnchor="middle" fill="white" fontSize="13">(Data-at-rest, in transit)</text>
          <text x="170" y="690" textAnchor="middle" fill="white" fontSize="11">Transparent data encryption</text>
          <rect 
            x="20" 
            y="600" 
            width="300" 
            height="110" 
            fill="transparent" 
            style={{ cursor: 'help' }}
            onMouseEnter={() => setActiveTooltip('data-encryption')}
            onMouseLeave={() => setActiveTooltip(null)}
          />
        </g>

        {/* Connection Lines - ALL RED COLOR */}
        {/* User Interface to Authentication */}
        <line x1="200" y1="185" x2="260" y2="210" stroke="#EF4444" strokeWidth="2.5" />
        
        {/* APIs to Authentication */}
        <line x1="200" y1="295" x2="260" y2="210" stroke="#EF4444" strokeWidth="2.5" />
        
        {/* Events to Authorization */}
        <line x1="200" y1="405" x2="260" y2="370" stroke="#EF4444" strokeWidth="2.5" />
        
        {/* Authentication to Bank's IAM */}
        <line x1="480" y1="210" x2="780" y2="135" stroke="#EF4444" strokeWidth="2.5" />
        
        {/* Authentication to Audit */}
        <line x1="480" y1="210" x2="500" y2="190" stroke="#EF4444" strokeWidth="2.5" />
        
        {/* Authentication to Authorization */}
        <line x1="370" y1="280" x2="370" y2="300" stroke="#EF4444" strokeWidth="2.5" />
        
        {/* Authorization to DB */}
        <line x1="370" y1="440" x2="450" y2="600" stroke="#EF4444" strokeWidth="2.5" />
        
        {/* DB to Temenos Vault */}
        <line x1="530" y1="635" x2="780" y2="395" stroke="#EF4444" strokeWidth="2.5" />
        
        {/* Temenos Vault to Secrets Management */}
        <line x1="980" y1="365" x2="1020" y2="315" stroke="#EF4444" strokeWidth="2" strokeDasharray="5,5" />
        
        {/* Temenos Vault to Key Management */}
        <line x1="980" y1="395" x2="1020" y2="405" stroke="#EF4444" strokeWidth="2" strokeDasharray="5,5" />
        
        {/* Temenos Vault to Certificate Management */}
        <line x1="980" y1="425" x2="1020" y2="495" stroke="#EF4444" strokeWidth="2" strokeDasharray="5,5" />
        
        {/* Externalized Authorization to Authorization */}
        <line x1="780" y1="265" x2="480" y2="370" stroke="#EF4444" strokeWidth="2" strokeDasharray="5,5" />

        {/* Connection Lines - Dotted lines - ALL RED COLOR */}
        {/* DB to Data Encryption */}
        <line x1="450" y1="635" x2="320" y2="600" stroke="#EF4444" strokeWidth="2" strokeDasharray="5,5" />
        
        {/* APIs to Data Encryption */}
        <line x1="110" y1="340" x2="110" y2="600" stroke="#EF4444" strokeWidth="2" strokeDasharray="5,5" />
        
        {/* Events to Data Encryption */}
        <line x1="110" y1="450" x2="110" y2="600" stroke="#EF4444" strokeWidth="2" strokeDasharray="5,5" />
      </svg>

      {/* Tooltip Display */}
      {activeTooltip && tooltips[activeTooltip] && tooltips[activeTooltip].description && (
        <div 
          className="fixed z-[9999] bg-white rounded-lg shadow-2xl p-4"
          style={{
            border: '2px solid #EF4444',
            maxWidth: '500px',
            width: 'auto',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
          onMouseEnter={() => setActiveTooltip(activeTooltip)}
          onMouseLeave={() => setActiveTooltip(null)}
        >
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="font-bold mb-2 text-[#EF4444] text-base">{tooltips[activeTooltip].title}</h4>
              <p className="text-gray-800 leading-relaxed text-sm whitespace-pre-line">
                {tooltips[activeTooltip].description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

