import { useState, useEffect } from 'react'
import { Key, UserCheck, Lock, Shield, Eye, Server, Cloud, KeyRound, FileCheck, X, type LucideIcon } from 'lucide-react'

interface SecurityCard {
  id: number
  title: string
  icon: LucideIcon
  color: string
  bgColor: string
}

const cards: SecurityCard[] = [
  {
    id: 1,
    title: 'Authentication',
    icon: Key,
    color: '#3B82F6', // Blue
    bgColor: '#DBEAFE', // Light blue background
  },
  {
    id: 2,
    title: 'Authorization',
    icon: UserCheck,
    color: '#10B981', // Green
    bgColor: '#D1FAE5', // Light green background
  },
  {
    id: 3,
    title: 'Privacy & Encryption',
    icon: Lock,
    color: '#8B5CF6', // Purple
    bgColor: '#EDE9FE', // Light purple background
  },
  {
    id: 4,
    title: 'Segregation',
    icon: Shield,
    color: '#F59E0B', // Amber
    bgColor: '#FEF3C7', // Light amber background
  },
  {
    id: 5,
    title: 'Access Management',
    icon: Eye,
    color: '#EF4444', // Red
    bgColor: '#FEE2E2', // Light red background
  },
  {
    id: 6,
    title: 'Platform Management',
    icon: Server,
    color: '#06B6D4', // Cyan
    bgColor: '#CFFAFE', // Light cyan background
  },
  {
    id: 7,
    title: 'SaaS Security Model',
    icon: Cloud,
    color: '#6366F1', // Indigo
    bgColor: '#E0E7FF', // Light indigo background
  },
  {
    id: 8,
    title: 'SaaS Access Control',
    icon: KeyRound,
    color: '#14B8A6', // Teal
    bgColor: '#CCFBF1', // Light teal background
  },
  {
    id: 9,
    title: 'Compliance and Risk Management',
    icon: FileCheck,
    color: '#F97316', // Orange
    bgColor: '#FFEDD5', // Light orange background
  },
]

const securityCategories = [
  { id: 1, name: 'Application Security' },
  { id: 2, name: 'Infrastructure Security' },
  { id: 3, name: 'SaaS Security' },
]

// HTML5 Security Architecture Diagram Content
const SecurityArchitectureHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Temenos Security Architecture</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            background: #f5f5f5;
            overflow: hidden;
            width: 100vw;
            height: 100vh;
        }
        
        .container {
            width: 100%;
            height: 100%;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        svg {
            width: 100%;
            height: 100%;
            max-width: 100%;
            max-height: 100%;
        }
        
        .label {
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 255, 255, 0.95);
            padding: 15px 30px;
            border-radius: 5px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            font-weight: bold;
            font-size: 16pt;
            color: #283054;
            z-index: 1000;
            text-align: center;
            line-height: 1.6;
            white-space: normal;
        }
        
        .tooltip {
            position: absolute;
            background: white;
            border: 2px solid #ff0000;
            border-radius: 4px;
            padding: 12px;
            max-width: 450px;
            font-size: 14pt;
            line-height: 1.5;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 2000;
            display: none;
            pointer-events: none;
            word-wrap: break-word;
            white-space: pre-wrap;
        }
        
        .tooltip.show {
            display: block;
        }
        
        .tooltip-title {
            font-weight: bold;
            font-size: 14pt;
            margin-bottom: 8px;
            color: #283054;
        }
        
        .tooltip-description {
            color: #333;
            font-size: 14pt;
        }
        
        .tooltip-button {
            position: absolute;
            bottom: 20px;
            right: 20px;
            background: #ff0000;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            font-size: 14pt;
            font-weight: bold;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        
        .tooltip-button:hover {
            background: #cc0000;
        }
        
        .clickable {
            cursor: pointer;
        }
        
        text {
            font-family: Arial, sans-serif;
            font-size: 14pt;
            fill: #000;
        }
        
        .title-text {
            font-size: 14pt;
            font-weight: bold;
        }
        
        .small-text {
            font-size: 14pt;
        }
        
        .temenos-box {
            fill: #d3d3d3;
            stroke: #3B82F6;
            stroke-width: 3;
        }
        
        .grey-box {
            fill: #9ca3af;
            stroke: #000;
            stroke-width: 2;
        }
        
        .purple-box {
            fill: #9333ea;
            stroke: #000;
            stroke-width: 2;
        }
        
        .entry-bar {
            fill: #3b82f6;
            stroke: #000;
            stroke-width: 2;
        }
        
        .entry-item-grey {
            fill: #9ca3af;
            stroke: #000;
            stroke-width: 2;
        }
        
        .line-red {
            stroke: #ff0000;
            stroke-width: 2;
            fill: none;
        }
        
        .line-dotted {
            stroke: #ff0000;
            stroke-width: 2;
            stroke-dasharray: 5,5;
            fill: none;
        }
        
        .text-white {
            fill: #fff;
        }
        
        .text-black {
            fill: #000;
        }
        
        .db-cylinder {
            fill: #10b981;
            stroke: #000;
            stroke-width: 2;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="label">
            Here is the Temenos Security Architecture<br>
            <span style="font-size: 14pt; font-weight: normal;">click on elements to get more details</span>
        </div>
        <div id="tooltip" class="tooltip">
            <div class="tooltip-title" id="tooltip-title"></div>
            <div class="tooltip-description" id="tooltip-description"></div>
        </div>
        <svg viewBox="0 0 1400 800" preserveAspectRatio="xMidYMid meet">
            <!-- Entry Points Bar (Left Vertical) - TLS 1.2 Container -->
            <rect id="tls-entry-points" x="50" y="200" width="80" height="400" class="entry-bar clickable" rx="5"/>
            <text x="90" y="230" text-anchor="middle" class="text-white title-text">TLS 1.2</text>
            
            <!-- User Interface (Grey) - Positioned between TLS 1.2 and Temenos Software -->
            <rect x="155" y="270" width="120" height="50" class="grey-box"/>
            <text x="215" y="290" text-anchor="middle" class="text-white">User</text>
            <text x="215" y="310" text-anchor="middle" class="text-white">Interface</text>
            
            <!-- APIs (Grey) - Positioned between TLS 1.2 and Temenos Software -->
            <rect x="155" y="340" width="120" height="40" class="grey-box"/>
            <text x="215" y="365" text-anchor="middle" class="text-white">APIs</text>
            
            <!-- Events (Grey) - Positioned between TLS 1.2 and Temenos Software -->
            <rect x="155" y="400" width="120" height="40" class="grey-box"/>
            <text x="215" y="425" text-anchor="middle" class="text-white">Events</text>
            
            <!-- Temenos Software (Central Light Grey Block with Blue Border) -->
            <rect x="290" y="150" width="500" height="500" class="temenos-box" rx="5"/>
            <text x="540" y="180" text-anchor="middle" class="text-black title-text" style="font-size: 14pt; font-weight: bold;">Temenos software</text>
            
            <!-- Authentication Box -->
            <rect id="authentication-box" x="340" y="220" width="180" height="120" fill="#2563eb" stroke="#000" stroke-width="1" class="clickable"/>
            <text x="430" y="245" text-anchor="middle" class="text-white title-text">Authentication</text>
            <text x="430" y="270" text-anchor="middle" class="text-white small-text">oAuth 2.0</text>
            <text x="430" y="290" text-anchor="middle" class="text-white small-text">OpenID Connect</text>
            <text x="430" y="310" text-anchor="middle" class="text-white small-text">JWT, SAML</text>
            
            <!-- Authorization Box -->
            <rect id="authorization-box" x="560" y="220" width="180" height="120" fill="#2563eb" stroke="#000" stroke-width="1" class="clickable"/>
            <text x="650" y="245" text-anchor="middle" class="text-white title-text">Authorization</text>
            <text x="650" y="270" text-anchor="middle" class="text-white small-text">RBAC, ABAC</text>
            
            <!-- Audit Box -->
            <rect id="audit-box" x="440" y="360" width="100" height="50" fill="#2563eb" stroke="#000" stroke-width="1" class="clickable"/>
            <text x="490" y="385" text-anchor="middle" class="text-white">Audit</text>
            
            <!-- DB Box - Green Cylinder outside Temenos Software, close to lower border -->
            <!-- Cylinder shape: ellipse on top, rectangle in middle, ellipse on bottom -->
            <ellipse cx="150" cy="700" rx="60" ry="15" class="db-cylinder"/>
            <rect x="90" y="700" width="120" height="100" class="db-cylinder"/>
            <ellipse cx="150" cy="800" rx="60" ry="15" class="db-cylinder"/>
            <text x="150" y="745" text-anchor="middle" class="text-white title-text">DB</text>
            <text x="220" y="825" text-anchor="start" class="text-black small-text" style="font-weight: bold;">Transparent Data Encryption TDE</text>
            
            <!-- Temenos Vault Box -->
            <rect id="temenos-vault" x="640" y="570" width="150" height="80" fill="#2563eb" stroke="#000" stroke-width="1" class="clickable"/>
            <text x="715" y="595" text-anchor="middle" class="text-white title-text">Temenos</text>
            <text x="715" y="615" text-anchor="middle" class="text-white title-text">Vault</text>
            
            <!-- Externalized authorization Box - Moved 40px right -->
            <rect id="externalized-auth" x="640" y="450" width="140" height="110" fill="#2563eb" stroke="#000" stroke-width="1" class="clickable"/>
            <text x="710" y="485" text-anchor="middle" class="text-white small-text">Externalized</text>
            <text x="710" y="505" text-anchor="middle" class="text-white small-text">authorization</text>
            <text x="710" y="520" text-anchor="middle" class="text-white small-text">(XACML)</text>
            
            <!-- Bank's IAM (Purple Box) -->
            <rect id="bank-iam" x="800" y="150" width="200" height="120" class="purple-box clickable" rx="5"/>
            <text x="900" y="180" text-anchor="middle" class="text-white title-text">Bank's identity</text>
            <text x="900" y="205" text-anchor="middle" class="text-white title-text">access</text>
            <text x="900" y="230" text-anchor="middle" class="text-white title-text">management</text>
            <text x="900" y="255" text-anchor="middle" class="text-white small-text">(IAM)</text>
            
            <!-- Secrets management (Purple Box) -->
            <rect id="secrets-management" x="1050" y="220" width="180" height="100" class="purple-box clickable" rx="5"/>
            <text x="1140" y="250" text-anchor="middle" class="text-white title-text">Secrets</text>
            <text x="1140" y="275" text-anchor="middle" class="text-white title-text">management</text>
            
            <!-- Key management (Purple Box) -->
            <rect id="key-management" x="1050" y="360" width="180" height="100" class="purple-box clickable" rx="5"/>
            <text x="1140" y="390" text-anchor="middle" class="text-white title-text">Key</text>
            <text x="1140" y="415" text-anchor="middle" class="text-white title-text">management</text>
            
            <!-- Certificate Management (Purple Box) -->
            <rect id="certificate-management" x="1050" y="500" width="180" height="100" class="purple-box clickable" rx="5"/>
            <text x="1140" y="530" text-anchor="middle" class="text-white title-text">Certificate</text>
            <text x="1140" y="555" text-anchor="middle" class="text-white title-text">Management</text>
            
            <!-- Data Encryption (Purple Box) - Centered horizontally with DB, 30px below DB -->
            <rect id="data-encryption" x="50" y="830" width="200" height="80" class="purple-box clickable" rx="5"/>
            <text x="150" y="860" text-anchor="middle" class="text-white title-text">Data Encryption</text>
            <text x="150" y="885" text-anchor="middle" class="text-white small-text">(Data-at-rest,</text>
            <text x="150" y="900" text-anchor="middle" class="text-white small-text">in transit)</text>
            
            <!-- Lines - All Red, connecting to borders -->
            
            <!-- TLS 1.2 to User Interface -->
            <line x1="130" y1="295" x2="155" y2="295" class="line-red"/>
            
            <!-- TLS 1.2 to APIs -->
            <line x1="130" y1="360" x2="155" y2="360" class="line-red"/>
            
            <!-- TLS 1.2 to Events -->
            <line x1="130" y1="420" x2="155" y2="420" class="line-red"/>
            
            <!-- User Interface to Temenos Software -->
            <line x1="275" y1="295" x2="290" y2="280" class="line-red"/>
            
            <!-- APIs to Temenos Software -->
            <line x1="275" y1="360" x2="290" y2="350" class="line-red"/>
            
            <!-- Events to Temenos Software -->
            <line x1="275" y1="400" x2="290" y2="400" class="line-red"/>
            
            <!-- Authentication to Authorization (role) -->
            <line x1="520" y1="280" x2="560" y2="280" class="line-red"/>
            <text x="540" y="275" text-anchor="middle" class="text-black small-text">role</text>
            
            <!-- Bank's IAM to Authentication -->
            <line x1="800" y1="210" x2="430" y2="220" class="line-red"/>
            
            <!-- Authorization to Externalized authorization -->
            <line x1="650" y1="340" x2="710" y2="450" class="line-red"/>
            
            <!-- DB top center to TLS bottom center -->
            <line x1="150" y1="685" x2="90" y2="600" class="line-red"/>
            
            <!-- DB top center to Temenos Software bottom center -->
            <line x1="150" y1="685" x2="540" y2="650" class="line-red"/>
            
            <!-- DB to Data Encryption -->
            <line x1="150" y1="800" x2="150" y2="830" class="line-red"/>
            
            <!-- Externalized authorization to Secrets management -->
            <line x1="780" y1="505" x2="1050" y2="270" class="line-red"/>
            
            <!-- Externalized authorization to Key management -->
            <line x1="780" y1="505" x2="1050" y2="410" class="line-red"/>
            
            <!-- Externalized authorization to Certificate Management -->
            <line x1="780" y1="505" x2="1050" y2="550" class="line-red"/>
            
            <!-- Temenos Vault to Secrets management -->
            <line x1="790" y1="610" x2="1050" y2="270" class="line-red"/>
            
            <!-- Temenos Vault to Key management -->
            <line x1="790" y1="610" x2="1050" y2="410" class="line-red"/>
            
            <!-- Temenos Vault to Certificate Management -->
            <line x1="790" y1="610" x2="1050" y2="550" class="line-red"/>
        </svg>
        <button class="tooltip-button" onclick="window.parent.postMessage({type: 'showDetailedExplanation'}, '*')">Move to Detailed Explanation</button>
    </div>
    
    <script>
        // Tooltip Configuration
        const tooltips = [
            {
                id: "key-management",
                title: "Key Management",
                description: "The system checks for file integrity upon upload and download using checksums and cryptographic hashing methods. SSH keys and certificates are stored in Azure Key Vault to ensure secure key management practices.",
                position: "right"
            },
            {
                id: "secrets-management",
                title: "Secrets Management",
                description: "Secrets management depends on stack deployment and requirements. Runtime secrets can be held within Hashicorp Vault, and minimum privilege should be used around key issuance, with audit logging of issued secrets. Good practice dictates that all runtime secrets are rotated at each deploy, and Cryptographic keys are rotated every 3 months, or whenever required by the organization. For Azure deployment, Temenos recommend using Azure Key Vault - Azure Key Vault: Azure Key Vault is a secure and centralized key management service that helps you safeguard cryptographic keys, certificates, and secrets used by cloud applications and services. Azure Key Vault is a cloud service that provides secure storage of keys for encrypting data. Multiple keys, and multiple versions of the same key, can be kept in the Azure Key Vault. Cryptographic keys in Azure Key Vault are represented as JSON Web Key (JWK) objects.",
                position: "right"
            },
            {
                id: "temenos-vault",
                title: "Temenos Vault",
                description: "Users should be able to create and store the application Certificates into the Vault (Azure Key vault). Applications should be able to retrieve the Certificates from the vault (Azure Key vault) and use it on the fly without any storing mechanism. Temenos Vault APIs should be created to support the above requirements to interact with the Vault (Azure Key vault). Temenos Vault – provides common framework for our products to integrate with underlaying platform Secrets services. Temenos Vault provides a facade that can be used by products and can be configured to point to the relevant Vault implementation based on the deployment environment. As well as this it can be used by the SaaS platform for provisioning the secrets, keys, and certificates for product or for the platform. We will support Azure Key Vault, AWS Secret, Key and Certificate Manager as well as Hashicorp Vault for On Premise solutions.",
                position: "bottom"
            },
            {
                id: "externalized-auth",
                title: "Externalized Authorization",
                description: "Temenos solution supports the externalized mechanism based on SAML 2.0, OIDC/ JSON Web Token (JWT) for authentication.  OAuth is an open standard authorization protocol. It enables your account information to be obtained by third-party services. Without exposing user credentials, OAuth provides an access token and a refresh token for third-party services.",
                position: "bottom"
            },
            {
                id: "data-encryption",
                title: "Data Encryption",
                description: "Temenos uses a range of security controls to protect data at rest, at use and in transit.  One of these mechanisms is Transparent Data Encryption (TDE) which provides real-time encryption and decryption of the database, associated backups, and transaction log files at rest. TDE protects data and log files, using AES (256-bit encryption) encryption algorithms. Temenos can offer encryption today via eXate as part of the Temenos Exchange ecosystem.  (requiring a dedicated discussion and license with eXate company).",
                position: "top"
            },
            {
                id: "certificate-management",
                title: "Certificate Management",
                description: "Certificates management (DigiCert used) procedures for Temenos SaaS\\n\\nTemenos renews the certificates annually for the Temenos cloud hosted environments for clients. During deployment of application, we leverage Temenos managed domain for App deployment and secure it with our SSL certificates for Application endpoint. These certificates are renewed every year.",
                position: "right"
            },
            {
                id: "bank-iam",
                title: "Bank's Identity and Access Management",
                description: "For authentication, Temenos solution makes use of Bank's Identity and Access Management (IaM) solution like Active Directory. The bank's individual employees are authenticated at Active Directory. Temenos comes pre-integrated with KeyCloak. KeyCloak will become the defacto IaM system for Temenos applications. It acts as the identity broker for redirecting authentication requests to the Bank managed IaM solution.",
                position: "left"
            },
            {
                id: "authentication-box",
                title: "Authentication",
                description: "In Temenos solution, authentication is primarily managed through Keycloak, an open-source identity and access management system. The process involves several key steps:\\n\\n1. Integration with Identity Management: Temenos applications are integrated with the bank's Identity and Access Management (IAM) solutions, such as Active Directory. Keycloak acts as an identity broker, redirecting authentication requests to the bank's IAM system.\\n\\n2. User Authentication: When a user attempts to log in, they are authenticated via the bank's IAM. Upon successful authentication, the IAM generates a JSON Web Token (JWT) for authorization.\\n\\n3. Token Exchange: The application exchanges the authorization code for an ID Token and a refresh token. The ID Token contains user information, while the access token allows access to resources.",
                position: "top"
            },
            {
                id: "authorization-box",
                title: "Authorization",
                description: "Temenos has embedded internal mechanism, native to the solution. The internal mechanism provides sufficient and granular access management to all applications as well as role/group facilities. The Temenos Security Management System (SMS) provides role-based access limits and full transaction and user activity audit. Each user has their own profile within the SMS which contains full user details and security settings to control the user's access within the system. SMS managing the access control, executing the following steps: Checks each user activity against the profile to determine validity; unacceptable actions are prevented and recorded (User Profile), Validates each contract against conditions, such as limits and exchange rate tolerance bands, before it is accepted (User Authority), Make specific data inaccessible to specified users or user groups based on conditions (Data Security).",
                position: "top"
            },
            {
                id: "audit-box",
                title: "Audit",
                description: "Temenos provides a full audit and logging across the entire business and technical landscape which can be utilized to track important security related events. The audit trails are stored as part of each data record and include details of the change made, by whom and when. Optionally it can include a delivery reference and IP address. Auditing is done both for users who use the solution directly or via APIs.\\n\\nAuditing includes: User activity auditing includes details of; Applications accessed, ID of transactions executed, Time connected, No. of operations executed etc. Application activity auditing includes details of; ID of new transactions, Inputter and Authorizer,  Security violation reports store details of unauthorised access attempts including who accessed the system, when and the target application",
                position: "top"
            },
            {
                id: "tls-entry-points",
                title: "TLS 1.2 Entry Points Container",
                description: "Within Temenos solution, data in transit security is implemented through a structured approach that includes the following steps:\\n\\n1. Encryption Protocols: All data transmitted over networks is secured using TLS 1.2, ensuring that data is encrypted during transmission to protect against interception.\\n\\n2. Secure File Transfers: For file transfers, protocols such as SFTP and FTPS are utilized, ensuring that files are encrypted during transit. Additionally, SSH encryption standards are applied for secure connections.\\n\\n3. Logging and Monitoring: All data transfers and user actions are logged for auditing purposes. This includes monitoring for unauthorized access attempts and ensuring compliance with security policies.",
                position: "right"
            }
        ];
        
        const tooltip = document.getElementById('tooltip');
        const tooltipTitle = document.getElementById('tooltip-title');
        const tooltipDescription = document.getElementById('tooltip-description');
        
        function showTooltip(config, element) {
            tooltipTitle.textContent = config.title;
            tooltipDescription.textContent = config.description;
            tooltip.classList.add('show');
            
            setTimeout(function() {
                const rect = element.getBoundingClientRect();
                const containerRect = document.querySelector('.container').getBoundingClientRect();
                const tooltipRect = tooltip.getBoundingClientRect();
                
                let left, top;
                
                switch(config.position) {
                    case 'right':
                        left = rect.right + 15;
                        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                        break;
                    case 'left':
                        left = rect.left - tooltipRect.width - 15;
                        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                        break;
                    case 'top':
                        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                        top = rect.top - tooltipRect.height - 15;
                        break;
                    case 'bottom':
                    default:
                        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                        top = rect.bottom + 15;
                        break;
                }
                
                // Ensure tooltip stays within container bounds
                if (left < containerRect.left) {
                    left = containerRect.left + 10;
                }
                if (left + tooltipRect.width > containerRect.right) {
                    left = containerRect.right - tooltipRect.width - 10;
                }
                if (top < containerRect.top) {
                    top = containerRect.top + 10;
                }
                if (top + tooltipRect.height > containerRect.bottom - 80) {
                    top = containerRect.bottom - tooltipRect.height - 90;
                }
                
                tooltip.style.left = (left - containerRect.left) + 'px';
                tooltip.style.top = (top - containerRect.top) + 'px';
            }, 10);
        }
        
        function hideTooltip() {
            tooltip.classList.remove('show');
        }
        
        // Attach click handlers to all elements with tooltips
        tooltips.forEach(function(config) {
            const element = document.getElementById(config.id);
            if (element) {
                element.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (tooltip.classList.contains('show') && tooltipTitle.textContent === config.title) {
                        hideTooltip();
                    } else {
                        showTooltip(config, element);
                    }
                });
            }
        });
        
        // Hide tooltip when clicking outside
        document.addEventListener('click', function(e) {
            if (!tooltip.contains(e.target) && !e.target.classList.contains('clickable')) {
                hideTooltip();
            }
        });
    </script>
</body>
</html>`

// HTML5 Temenos Authentication Diagram Content
const TemenosAuthenticationHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Temenos Authentication</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            background: #f5f5f5;
            overflow: hidden;
            width: 100vw;
            height: 100vh;
        }
        
        .container {
            width: 100%;
            height: 100%;
            position: relative;
            display: flex;
            flex-direction: column;
            padding: 20px;
        }
        
        .title-label {
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 255, 255, 0.95);
            padding: 12px 24px;
            border-radius: 5px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            font-weight: bold;
            font-size: 18px;
            color: #283054;
            z-index: 1000;
            text-align: center;
        }
        
        .text-section {
            display: flex;
            justify-content: space-between;
            padding: 80px 40px 20px 40px;
            margin-bottom: 20px;
        }
        
        .bank-staff-auth {
            flex: 1;
            padding-right: 40px;
        }
        
        .customer-auth {
            flex: 1;
            padding-left: 40px;
        }
        
        .text-section h3 {
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 12px;
            color: #ff0000;
        }
        
        .text-section ul {
            list-style-type: disc;
            padding-left: 20px;
            font-size: 14pt;
            line-height: 1.6;
            color: #333;
        }
        
        .text-section li {
            margin-bottom: 8px;
        }
        
        .diagram-container {
            flex: 1;
            position: relative;
            overflow: hidden;
        }
        
        svg {
            width: 100%;
            height: 100%;
        }
        
        text {
            font-family: Arial, sans-serif;
            font-size: 12px;
            fill: #000;
        }
        
        .title-text {
            font-size: 14px;
            font-weight: bold;
        }
        
        .title-text-11pt {
            font-size: 14pt;
            font-weight: bold;
        }
        
        .small-text-14pt {
            font-size: 14pt;
        }
        
        .small-text {
            font-size: 14px;
        }
        
        .light-blue-box {
            fill: #ADD8E6;
            stroke: #000;
            stroke-width: 2;
        }
        
        .dark-blue-box {
            fill: #1E3A8A;
            stroke: #000;
            stroke-width: 2;
        }
        
        .purple-box {
            fill: #9333ea;
            stroke: #000;
            stroke-width: 2;
        }
        
        .teal-box {
            fill: #14B8A6;
            stroke: #000;
            stroke-width: 2;
        }
        
        .teal-container {
            fill: #0D9488;
            stroke: #000;
            stroke-width: 2;
        }
        
        .arrow-red {
            stroke: #ff0000;
            stroke-width: 2.5;
            fill: none;
            marker-end: url(#arrowhead-red);
        }
        
        .text-white {
            fill: #fff;
        }
        
        .text-black {
            fill: #000;
        }
        
        .db-cylinder {
            fill: #10b981;
            stroke: #000;
            stroke-width: 2;
        }
        
        .clickable {
            cursor: pointer;
        }
        
        .tooltip {
            position: absolute;
            background: white;
            border: 2px solid #ff0000;
            border-radius: 4px;
            padding: 12px;
            max-width: 500px;
            font-size: 16px;
            line-height: 1.5;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 2000;
            display: none;
            pointer-events: none;
            word-wrap: break-word;
            white-space: pre-wrap;
        }
        
        .tooltip.show {
            display: block;
        }
        
        .tooltip-title {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 8px;
            color: #283054;
        }
        
        .tooltip-description {
            color: #333;
            font-size: 16px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="title-label">Here is the Temenos Authentication</div>
        <div id="tooltip" class="tooltip">
            <div class="tooltip-title" id="tooltip-title"></div>
            <div class="tooltip-description" id="tooltip-description"></div>
        </div>
        
        <!-- Text Sections -->
        <div class="text-section">
            <div class="bank-staff-auth">
                <h3>Bank Staff Authentication</h3>
                <ul>
                    <li>User Identity and authentication are externalized, utilizing Single Sign-On (SSO) with enterprise Identity Management (IdM) systems, specifically mentioning "Azure Entra ID" as an example.</li>
                    <li>User identity and trust are established through a "security token oAuth 2.0 JWT".</li>
                    <li>All product integration and validation are handled with "KeyCloak IdM".</li>
                </ul>
            </div>
            <div class="customer-auth">
                <h3>Customer Authentication</h3>
                <ul>
                    <li>Based on the open standards "OIDC" (OpenID Connect) and "JWT" (JSON Web Token), integrated with "Temenos Digital".</li>
                    <li>"SCA Authentication partner" is the preferred approach for compliance with "PSD2" (Payment Services Directive 2) and open banking regulatory requirements.</li>
                    <li>"HID, Uniken" are identified as exchange partners for "Temenos Digital SCA integration & certification".</li>
                </ul>
            </div>
        </div>
        
        <!-- Diagram Container -->
        <div class="diagram-container">
            <svg viewBox="0 0 1400 600" preserveAspectRatio="xMidYMid meet">
                <!-- Arrow marker definition -->
                <defs>
                    <marker id="arrowhead-red" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                        <polygon points="0 0, 10 3, 0 6" fill="#ff0000" />
                    </marker>
                </defs>
                
                <!-- UI Configuration of Users, Roles, SSO etc. (Light Blue Box) -->
                <rect id="ui-configuration" x="50" y="100" width="200" height="80" class="light-blue-box clickable" rx="5"/>
                <text x="150" y="130" text-anchor="middle" class="text-black title-text-11pt">UI Configuration of</text>
                <text x="150" y="150" text-anchor="middle" class="text-black title-text-11pt">Users, Roles, SSO etc.</text>
                
                <!-- Keycloak / External IdM (Dark Blue Box) -->
                <rect id="keycloak" x="50" y="220" width="200" height="100" class="dark-blue-box clickable" rx="5"/>
                <text x="150" y="250" text-anchor="middle" class="text-white title-text-11pt">Keycloak /</text>
                <text x="150" y="275" text-anchor="middle" class="text-white title-text-11pt">External IdM</text>
                
                <!-- DB Cylinder (Green) - Outside Keycloak, close to lower border (Keycloak lower border is at y=320) -->
                <ellipse cx="220" cy="340" rx="40" ry="12" class="db-cylinder"/>
                <rect x="180" y="340" width="80" height="60" class="db-cylinder"/>
                <ellipse cx="220" cy="400" rx="40" ry="12" class="db-cylinder"/>
                <text x="220" y="375" text-anchor="middle" class="text-white title-text">DB</text>
                
                <!-- Authentication Service (Purple Box) -->
                <rect id="authentication-service" x="350" y="220" width="220" height="100" class="purple-box clickable" rx="5"/>
                <text x="460" y="250" text-anchor="middle" class="text-white title-text-11pt">Authentication Service</text>
                <text x="460" y="275" text-anchor="middle" class="text-white small-text-14pt">SAML / OIDC / Federated</text>
                
                <!-- Temenos Application (Dark Blue Box) -->
                <rect id="temenos-application" x="650" y="220" width="200" height="100" class="dark-blue-box clickable" rx="5"/>
                <text x="750" y="260" text-anchor="middle" class="text-white title-text-11pt">Temenos</text>
                <text x="750" y="285" text-anchor="middle" class="text-white title-text-11pt">Application</text>
                
                <!-- Temenos Security (Teal Container) -->
                <rect id="temenos-security" x="950" y="180" width="300" height="180" class="teal-container clickable" rx="5"/>
                <text x="1100" y="210" text-anchor="middle" class="text-white title-text-11pt">Temenos Security</text>
                
                <!-- Auth Filter (Teal Box inside Temenos Security) -->
                <rect x="970" y="230" width="260" height="50" class="teal-box" rx="5"/>
                <text x="1100" y="260" text-anchor="middle" class="text-white title-text">Auth Filter</text>
                
                <!-- Security Token Validation (Teal Box inside Temenos Security) -->
                <rect x="970" y="300" width="260" height="50" class="teal-box" rx="5"/>
                <text x="1100" y="325" text-anchor="middle" class="text-white small-text">Security Token Validation</text>
                <text x="1100" y="340" text-anchor="middle" class="text-white small-text">SAML / OIDC / FS</text>
                
                <!-- Arrows - All Red, connecting to borders -->
                
                <!-- UI Configuration to Keycloak (from bottom border to top border) -->
                <line x1="150" y1="180" x2="150" y2="220" class="arrow-red"/>
                
                <!-- Keycloak to Authentication Service (from right border to left border) -->
                <line x1="250" y1="270" x2="350" y2="270" class="arrow-red"/>
                <text x="300" y="205" text-anchor="middle" class="text-black small-text">Identity &amp; Attributes</text>
                
                <!-- Authentication Service to Temenos Application (from right border to left border) -->
                <line x1="570" y1="270" x2="650" y2="270" class="arrow-red"/>
                <text x="610" y="205" text-anchor="middle" class="text-black small-text">Security Token</text>
                
                <!-- Temenos Application to Auth Filter (from right border to left border of Temenos Security container) -->
                <line x1="850" y1="270" x2="950" y2="255" class="arrow-red"/>
                <text x="900" y="200" text-anchor="middle" class="text-black small-text">Security Token</text>
                
                <!-- Auth Filter to Security Token Validation (from bottom border to top border) -->
                <line x1="1100" y1="280" x2="1100" y2="300" class="arrow-red"/>
                
                <!-- Security Token Validation back to Temenos Application (from left border of Temenos Security to right border of Temenos Application) -->
                <line x1="950" y1="325" x2="850" y2="270" class="arrow-red"/>
                <text x="900" y="240" text-anchor="middle" class="text-black small-text">Identity &amp; Attributes</text>
            </svg>
        </div>
    </div>
    
    <script>
        // Tooltip Configuration
        const tooltips = [
            {
                id: 'ui-configuration',
                title: 'UI Configuration of Users, Roles',
                description: 'Temenos UI Explorer application redirects a user\\'s browser from the application to the Keycloak authentication server where they enter their credentials. This redirection is important because users are completely isolated from applications and applications never see a user\\'s credentials.\\n\\nIdentity token or assertion (for SAML protocol) is cryptographically signed.\\n\\nThese tokens can have identity information like username, address, email, and other profile data.\\n\\nTemenos Security Management System (SMS) based on Role Based Access in which the ability to access or perform action is tied to the permission granted. The internal mechanism provides sufficient and granular access management to all applications as well as role/group facilities. When a user attempts to log in, they are authenticated via the bank\\'s IAM. Upon successful authentication, the IAM generates a JSON Web Token (JWT) for authorization. The application exchanges the authorization code for an ID Token and a refresh token. The ID Token contains user information, while the access token allows access to resources.',
                position: 'bottom'
            },
            {
                id: 'keycloak',
                title: 'Keycloak',
                description: 'Temenos solutions use Keycloak, an open-source Identity and Access Management (IAM) tool, to manage authentication. Keycloak enables Single Sign-On (SSO) based on federated security, letting users log in once to access multiple applications seamlessly.\\n\\nKeycloak integrates with the bank\\'s existing Identity Provider (IdP), like Entra ID (AD), which manages users and passwords. This integration uses standard protocols such as SAML 2.0 or OpenID Connect. Keycloak acts here as an identity broker, redirecting authentication requests to Banks\\' preferred IAM. After successful authentication, Bank\\' IAM issues JSON Web Tokens (JWTs) that carry user identity and role information, which the solution uses to enforce authorization based on assigned permissions.',
                position: 'right'
            },
            {
                id: 'authentication-service',
                title: 'Authentication Service',
                description: '1. User Identity, authentication externalised and SSO with enterprise IAM e.g.,\\n\\n2. Entra ID Establish user identity and trust through security token oAuth 2.0 JWT,\\n\\n3. All products integrate and validate with KeyCloak IaM',
                position: 'bottom'
            },
            {
                id: 'temenos-application',
                title: 'Temenos Application',
                description: 'User activities, including successful and failed login attempts, are logged. Session IDs do not contain sensitive data and are invalidated upon logout.',
                position: 'top'
            },
            {
                id: 'temenos-security',
                title: 'Temenos Security',
                description: 'Choosing between OpenID Connect and SAML is not just a matter of using a newer protocol (OIDC) instead of the older more mature protocol (SAML). In most cases Keycloak recommends using OIDC. SAML 2.0 tends to be a bit more verbose than OIDC. Beyond verbosity of exchanged data, OIDC was designed to work with the web while SAML2.0 was retrofitted to work on top of the web.',
                position: 'left'
            }
        ];
        
        const tooltip = document.getElementById('tooltip');
        const tooltipTitle = document.getElementById('tooltip-title');
        const tooltipDescription = document.getElementById('tooltip-description');
        
        function showTooltip(config, element) {
            tooltipTitle.textContent = config.title;
            tooltipDescription.textContent = config.description;
            tooltip.classList.add('show');
            
            setTimeout(function() {
                const rect = element.getBoundingClientRect();
                const containerRect = document.querySelector('.container').getBoundingClientRect();
                const tooltipRect = tooltip.getBoundingClientRect();
                
                let left, top;
                
                switch(config.position) {
                    case 'right':
                        left = rect.right + 15;
                        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                        break;
                    case 'left':
                        left = rect.left - tooltipRect.width - 15;
                        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                        break;
                    case 'top':
                        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                        top = rect.top - tooltipRect.height - 15;
                        break;
                    case 'bottom':
                    default:
                        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                        top = rect.bottom + 15;
                        break;
                }
                
                // Ensure tooltip stays within container bounds
                if (left < containerRect.left) {
                    left = containerRect.left + 10;
                }
                if (left + tooltipRect.width > containerRect.right) {
                    left = containerRect.right - tooltipRect.width - 10;
                }
                if (top < containerRect.top) {
                    top = containerRect.top + 10;
                }
                if (top + tooltipRect.height > containerRect.bottom) {
                    top = containerRect.bottom - tooltipRect.height - 10;
                }
                
                tooltip.style.left = (left - containerRect.left) + 'px';
                tooltip.style.top = (top - containerRect.top) + 'px';
            }, 10);
        }
        
        function hideTooltip() {
            tooltip.classList.remove('show');
        }
        
        // Attach click handlers to all elements with tooltips
        tooltips.forEach(function(config) {
            const element = document.getElementById(config.id);
            if (element) {
                element.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (tooltip.classList.contains('show') && tooltipTitle.textContent === config.title) {
                        hideTooltip();
                    } else {
                        showTooltip(config, element);
                    }
                });
            }
        });
        
        // Hide tooltip when clicking outside
        document.addEventListener('click', function(e) {
            if (!tooltip.contains(e.target) && !e.target.classList.contains('clickable')) {
                hideTooltip();
            }
        });
    </script>
</body>
</html>`

// HTML5 Authorization Diagram Content
const TemenosAuthorizationHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Temenos Authorization - Role Based Access</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            background: #ffffff;
            overflow: hidden;
            width: 100vw;
            height: 100vh;
        }
        
        .container {
            width: 100%;
            height: 100%;
            position: relative;
            display: flex;
            padding: 60px 40px 40px 120px;
            gap: 80px;
            align-items: flex-start;
        }
        
        .left-section {
            flex: 0 0 45%;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }
        
        .right-section {
            flex: 0 0 45%;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            margin-top: 30px;
        }
        
        .title-label {
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            font-weight: bold;
            font-size: 18px;
            color: #000;
            z-index: 1000;
        }
        
        /* Left Section Styles */
        .icon-group {
            display: flex;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .icon-circle {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: #10b981;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 30px;
        }
        
        .flow-box {
            border: 3px solid #9333ea;
            background: white;
            padding: 15px 25px;
            border-radius: 5px;
            font-weight: bold;
            font-size: 16px;
            color: #9333ea;
            min-width: 150px;
            text-align: center;
        }
        
        .arrow-label {
            font-size: 14px;
            font-weight: bold;
            color: #000;
            margin: 5px 0;
        }
        
        .arrow-examples {
            font-size: 12px;
            color: #333;
            margin-left: 10px;
        }
        
        .list-section {
            margin-top: 30px;
        }
        
        .list-title {
            font-weight: bold;
            font-size: 14px;
            color: #000;
            margin-bottom: 10px;
        }
        
        .list-items {
            font-size: 13px;
            color: #333;
            line-height: 1.8;
        }
        
        /* Right Section Styles */
        .example-label {
            font-size: 16px;
            font-weight: bold;
            color: #000;
            margin-bottom: 20px;
        }
        
        .hierarchy-block {
            background: #1e3a8a;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            margin-bottom: 15px;
            min-width: 400px;
            position: relative;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .hierarchy-block::before {
            content: '';
            position: absolute;
            left: -25px;
            top: 0;
            bottom: -15px;
            width: 3px;
            background: #6b7280;
        }
        
        .hierarchy-block:first-child::before {
            display: none;
        }
        
        .hierarchy-block:not(:last-child)::after {
            content: '';
            position: absolute;
            left: -25px;
            bottom: -15px;
            width: 3px;
            height: 15px;
            background: #6b7280;
        }
        
        .padlock-icon {
            font-size: 24px;
            color: #6b7280;
        }
        
        .block-title {
            font-weight: bold;
            font-size: 15px;
            margin-bottom: 8px;
        }
        
        .block-examples {
            font-size: 13px;
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        }
        
        .block-icon {
            font-size: 20px;
            color: #6b7280;
            margin-left: auto;
        }
        
        /* Tooltip Styles */
        .tooltip {
            position: absolute;
            background: white;
            border: 2px solid #ff0000;
            border-radius: 8px;
            padding: 12px 16px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            display: none;
            max-width: 500px;
            width: auto;
            min-width: 200px;
        }
        
        .tooltip.show {
            display: block;
        }
        
        .tooltip-title {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 8px;
            color: #000;
        }
        
        .tooltip-description {
            color: #333;
            font-size: 16px;
            line-height: 1.5;
            white-space: pre-line;
        }
        
        .clickable {
            cursor: pointer;
        }
        
        .action-button {
            position: absolute;
            bottom: 20px;
            right: 20px;
            background: #ff0000;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            z-index: 1000;
        }
        
        .action-button:hover {
            background: #cc0000;
        }
    </style>
</head>
<body>
    <div class="title-label">Role Based Access</div>
    <div class="container">
        <!-- Left Section: Role-Based Access Model -->
        <div class="left-section">
            <!-- Flow Diagram and Bottom Lists Container -->
            <div style="display: flex; align-items: flex-start; gap: 30px; margin-top: 90px;">
                <!-- Bottom Lists -->
                <div class="list-section" style="margin-top: 0;">
                    <div class="list-title">User Groups:</div>
                    <div class="list-items">
                        Back-office Team,<br>
                        Front office team<br>
                        Audit Group.
                    </div>
                    
                    <div class="list-title" style="margin-top: 20px;">Actual users with profiles:</div>
                    <div class="list-items">
                        John Doe
                    </div>
                    
                    <div class="list-title" style="margin-top: 20px;">Role Based Access:</div>
                    <div class="list-items">
                        Payments Operator,<br>
                        Check Issuer,<br>
                        Wire Room Authorizer,<br>
                        Account Executive
                    </div>
                </div>
                
                <!-- Vertical Purple Line -->
                <div style="width: 4px; background-color: #9333ea; align-self: stretch; flex-shrink: 0;"></div>
                
                <!-- Flow Diagram -->
                <div style="position: relative;">
                    <!-- User Group Box with Icon -->
                    <div style="display: flex; align-items: center; gap: 40px; margin-bottom: 20px;">
                        <div class="icon-circle">👥</div>
                        <div class="flow-box">User Group</div>
                    </div>
                    
                    <!-- Arrow to User -->
                    <div style="margin-left: 30px; margin-bottom: 10px;">
                        <div style="width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 15px solid #000; margin-bottom: 5px;"></div>
                        <div class="arrow-label">Properties</div>
                        <div class="arrow-examples">
                            Start Date/Time<br>
                            End Date/Time
                        </div>
                    </div>
                    
                    <!-- User Box with Icon -->
                    <div style="display: flex; align-items: center; gap: 40px; margin-bottom: 20px;">
                        <div class="icon-circle">👤</div>
                        <div id="user-box" class="flow-box clickable" style="background: #ff0000; color: white;">User</div>
                    </div>
                    
                    <!-- Arrow to Role -->
                    <div style="margin-left: 30px; margin-bottom: 10px;">
                        <div style="width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 15px solid #000; margin-bottom: 5px;"></div>
                        <div class="arrow-label">Access</div>
                        <div class="arrow-examples">
                            Belongs to US Entity,<br>
                            Can process Payments,<br>
                            Only Checks,<br>
                            Authorize Checks,<br>
                            Edit Ben. Account #
                        </div>
                    </div>
                    
                    <!-- Role Box with Icon -->
                    <div style="display: flex; align-items: center; gap: 40px;">
                        <div class="icon-circle">🔒</div>
                        <div id="role-box" class="flow-box clickable">Role</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Right Section: Hierarchical System Components -->
        <div id="right-section" class="right-section clickable">
            <div class="example-label">Example</div>
            
            <!-- ENTITY Block -->
            <div class="hierarchy-block">
                <span class="padlock-icon">🔒</span>
                <div style="flex: 1;">
                    <div class="block-title">ENTITY (Company)</div>
                    <div class="block-examples">
                        <span>Entity A</span>
                        <span>Entity B</span>
                    </div>
                </div>
                <span class="block-icon">🏢</span>
            </div>
            
            <!-- PRODUCT Block -->
            <div class="hierarchy-block">
                <span class="padlock-icon">🔒</span>
                <div style="flex: 1;">
                    <div class="block-title">PRODUCT (Module)</div>
                    <div class="block-examples">
                        <span>Payments</span>
                        <span>Forex</span>
                    </div>
                </div>
                <span class="block-icon">⊞</span>
            </div>
            
            <!-- SUB-PRODUCT Block -->
            <div class="hierarchy-block">
                <span class="padlock-icon">🔒</span>
                <div style="flex: 1;">
                    <div class="block-title">SUB-PRODUCT (Application)</div>
                    <div class="block-examples">
                        <span>ACH, Wires, Checks, Swift</span>
                        <span>Forex, Spot</span>
                    </div>
                </div>
                <span class="block-icon">🔍</span>
            </div>
            
            <!-- ACTIVITY Block -->
            <div class="hierarchy-block">
                <span class="padlock-icon">🔒</span>
                <div style="flex: 1;">
                    <div class="block-title">ACTIVITY (Function)</div>
                    <div class="block-examples" style="flex-direction: column; gap: 5px;">
                        <div>
                            <span>Create, Amend, View,</span><br>
                            <span>First Level Approval,</span><br>
                            <span>Second Level Approval</span>
                        </div>
                        <div>
                            <span>Creator, Authorizer,</span><br>
                            <span>Manager, Reviewer</span>
                        </div>
                    </div>
                </div>
                <span class="block-icon">👆</span>
            </div>
            
            <!-- DATA Block -->
            <div class="hierarchy-block">
                <span class="padlock-icon">🔒</span>
                <div style="flex: 1;">
                    <div class="block-title">DATA (Fields)</div>
                    <div class="block-examples">
                        <span>Payment Amount, Beneficiary</span>
                    </div>
                </div>
                <span class="block-icon">📄</span>
            </div>
        </div>
    </div>
    
    <!-- Tooltip Element -->
    <div id="tooltip" class="tooltip">
        <div class="tooltip-title" id="tooltip-title"></div>
        <div class="tooltip-description" id="tooltip-description"></div>
    </div>
    
    <script>
        // Tooltip Configuration
        const tooltips = [
            {
                id: 'right-section',
                title: 'Right Section',
                description: 'Access rights are defined and managed centrally by Bank\\' administrators, allowing precise control over what users can view or do within the system. At the core, user roles determine access permissions, which can be configured to cover multiple levels including:\\n\\n1. Organization or business unit level (e.g., company or branch level), enabling Bank to restrict access to data and functions relevant only to specific legal entities or subsidiaries.\\n\\n2. Application or module level, controlling which banking products or services a user can access.\\n\\n3. Screen and menu levels, allowing fine-grained control over user interface elements and navigation options.\\n\\n4. Functional level, specifying allowed actions such as input, authorization, viewing, or deletion.\\n\\n5. Data element or field level, enabling restrictions on specific data fields or values, for example limiting transaction amounts or excluding certain account types',
                position: 'right'
            },
            {
                id: 'user-box',
                title: 'User',
                description: 'Each user profile contains a unique user identifier, password, language, and conditions.\\n\\nUser roles and permissions are managed within the solution, with role-based access control (RBAC) ensuring that users access only the data and functions authorized for their specific roles. After successful authentication, user identity and permissions are propagated via tokens, enabling consistent enforcement of access rights across all components and services. This identity propagation supports granular authorization at multiple levels, including company, application, API, screen, and field levels.',
                position: 'right'
            },
            {
                id: 'role-box',
                title: 'Role',
                description: 'So, permissions and rights are assigned to roles rather than directly to users.\\n\\nThus, a single role for the whole group of users who perform the same task.\\n\\nThis is mapped to the organizational structure so that the users can be assigned with a different role if they physically change their roles in the organization.',
                position: 'right'
            }
        ];
        
        const tooltip = document.getElementById('tooltip');
        const tooltipTitle = document.getElementById('tooltip-title');
        const tooltipDescription = document.getElementById('tooltip-description');
        
        function showTooltip(config, element) {
            tooltipTitle.textContent = config.title;
            tooltipDescription.textContent = config.description;
            tooltip.classList.add('show');
            
            setTimeout(function() {
                const rect = element.getBoundingClientRect();
                const containerRect = document.querySelector('.container').getBoundingClientRect();
                const tooltipRect = tooltip.getBoundingClientRect();
                
                let left, top;
                
                switch(config.position) {
                    case 'right':
                        left = rect.right + 15;
                        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                        break;
                    case 'left':
                        left = rect.left - tooltipRect.width - 15;
                        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                        break;
                    case 'top':
                        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                        top = rect.top - tooltipRect.height - 15;
                        break;
                    case 'bottom':
                    default:
                        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                        top = rect.bottom + 15;
                        break;
                }
                
                // Ensure tooltip stays within container bounds
                if (left < containerRect.left) {
                    left = containerRect.left + 10;
                }
                if (left + tooltipRect.width > containerRect.right) {
                    left = containerRect.right - tooltipRect.width - 10;
                }
                if (top < containerRect.top) {
                    top = containerRect.top + 10;
                }
                if (top + tooltipRect.height > containerRect.bottom - 80) {
                    top = containerRect.bottom - tooltipRect.height - 90;
                }
                
                tooltip.style.left = (left - containerRect.left) + 'px';
                tooltip.style.top = (top - containerRect.top) + 'px';
            }, 10);
        }
        
        function hideTooltip() {
            tooltip.classList.remove('show');
        }
        
        // Attach click handlers to all elements with tooltips
        tooltips.forEach(function(config) {
            const element = document.getElementById(config.id);
            if (element) {
                element.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (tooltip.classList.contains('show') && tooltipTitle.textContent === config.title) {
                        hideTooltip();
                    } else {
                        showTooltip(config, element);
                    }
                });
            }
        });
        
        // Hide tooltip when clicking outside
        document.addEventListener('click', function(e) {
            if (!tooltip.contains(e.target) && !e.target.classList.contains('clickable') && !e.target.closest('.clickable')) {
                hideTooltip();
            }
        });
    </script>
    
    <!-- Action Button -->
    <button class="action-button" onclick="window.parent.postMessage({type: 'showUserManagement'}, '*')">Move to User Management Explanation</button>
</body>
</html>`

const UserManagementHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Management</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            background: #ffffff;
            overflow: hidden;
            width: 100vw;
            height: 100vh;
        }
        
        .title-label {
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            font-weight: bold;
            font-size: 18px;
            color: #000;
            z-index: 1000;
        }
        
        .container {
            width: 100%;
            height: 100%;
            position: relative;
            display: flex;
            padding: 80px 40px 40px 40px;
            gap: 40px;
            align-items: flex-start;
        }
        
        .left-section {
            flex: 0 0 35%;
            display: flex;
            flex-direction: column;
            gap: 20px;
            position: relative;
            font-size: 16pt;
        }
        
        .right-section {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        
        .explanation-box {
            background: #f0f0f0;
            border: 2px solid #333;
            border-radius: 5px;
            padding: 12px 15px;
            font-size: 13px;
            line-height: 1.6;
            color: #000;
            position: relative;
        }
        
        .arrow-line {
            position: absolute;
            right: -30px;
            width: 30px;
            height: 2px;
            background: #000;
            top: 50%;
            transform: translateY(-50%);
        }
        
        .arrow-head {
            position: absolute;
            right: -35px;
            top: 50%;
            transform: translateY(-50%);
            width: 0;
            height: 0;
            border-left: 8px solid #000;
            border-top: 6px solid transparent;
            border-bottom: 6px solid transparent;
        }
        
        .form-container {
            background: #fff;
            border: 1px solid #ccc;
            border-radius: 5px;
            padding: 20px;
        }
        
        .tabs {
            display: flex;
            gap: 0;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
        }
        
        .tab {
            padding: 10px 20px;
            background: #e0e0e0;
            border: 1px solid #ccc;
            border-bottom: none;
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
        }
        
        .tab.active {
            background: #fff;
            border-bottom: 2px solid #fff;
            margin-bottom: -2px;
        }
        
        .tab-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .check-icon {
            width: 24px;
            height: 24px;
            background: #4CAF50;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 16px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-row {
            display: flex;
            gap: 15px;
            margin-bottom: 15px;
            align-items: center;
        }
        
        .form-label {
            min-width: 140px;
            font-size: 13px;
            font-weight: bold;
            color: #000;
        }
        
        .form-input {
            flex: 1;
            padding: 6px 10px;
            border: 1px solid #999;
            border-radius: 3px;
            font-size: 13px;
        }
        
        .form-input-small {
            width: 100px;
            padding: 6px 10px;
            border: 1px solid #999;
            border-radius: 3px;
            font-size: 13px;
        }
        
        .radio-group {
            display: flex;
            gap: 15px;
        }
        
        .radio-option {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .dropdown {
            padding: 6px 10px;
            border: 1px solid #999;
            border-radius: 3px;
            font-size: 13px;
            background: white;
        }
        
        .icon-button {
            width: 24px;
            height: 24px;
            border: 1px solid #999;
            border-radius: 3px;
            background: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 14px;
        }
        
        .section-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 10px;
            margin-top: 15px;
            color: #000;
        }
    </style>
</head>
<body>
    <div class="title-label">User Management main points</div>
    <div class="container">
        <!-- Left Section: Explanatory Text Boxes -->
        <div class="left-section">
            <!-- Explanation Box 1: User Identification -->
            <div class="explanation-box" style="margin-top: 60px; background: #00BFFF;">
                <div>Sign-on name</div>
                <div>Is the user a bank employee (e.g., internal)</div>
                <div>Language</div>
                <div>Company the user can access</div>
                <div class="arrow-line"></div>
                <div class="arrow-head"></div>
            </div>
            
            <!-- Explanation Box 2: User Validity Period -->
            <div class="explanation-box" style="margin-top: 140px; background: #C9D9E2;">
                <div>Validity of the User</div>
                <div class="arrow-line"></div>
                <div class="arrow-head"></div>
            </div>
            
            <!-- Explanation Box 3: Daily Work Duration -->
            <div class="explanation-box" style="margin-top: 60px; background: #CCFF00;">
                <div>Duration for which the user can work in CBS (e.g., or all 7 days)</div>
                <div class="arrow-line"></div>
                <div class="arrow-head"></div>
            </div>
            
            <!-- Explanation Box 4: Application and Function Access -->
            <div class="explanation-box" style="margin-top: 100px; background: #F4C430;">
                <div>Give access to applications, company wise</div>
                <div>and operations allowed (e.g., authorize)</div>
                <div class="arrow-line"></div>
                <div class="arrow-head"></div>
            </div>
            
            <!-- Explanation Box 5: Specific Day and Time Access -->
            <div class="explanation-box" style="margin-top: 100px; background: #f0f8ff;">
                <div>Specific time of access for certain days</div>
                <div>1 – Mon , 2 – Tue and so on</div>
                <div class="arrow-line"></div>
                <div class="arrow-head"></div>
            </div>
        </div>
        
        <!-- Right Section: Form -->
        <div class="right-section">
            <div class="form-container">
                <!-- Tabs -->
                <div class="tabs">
                    <div class="tab active">USER</div>
                    <div class="tab">INPUTTER</div>
                </div>
                
                <!-- Tab Header with Check Icon -->
                <div class="tab-header">
                    <div></div>
                    <div class="check-icon">✓</div>
                </div>
                
                <!-- Form Fields -->
                <!-- User Identification Section -->
                <div class="form-group">
                    <div class="form-row">
                        <div class="form-label">User Name</div>
                        <input type="text" class="form-input" value="INPUTTER">
                    </div>
                    <div class="form-row">
                        <div class="form-label">Sign On Name</div>
                        <input type="text" class="form-input" value="INPUTT">
                    </div>
                    <div class="form-row">
                        <div class="form-label">Classification</div>
                        <div class="radio-group">
                            <div class="radio-option">
                                <input type="radio" name="classification" id="ext" value="Ext">
                                <label for="ext">Ext</label>
                            </div>
                            <div class="radio-option">
                                <input type="radio" name="classification" id="int" value="Int" checked>
                                <label for="int">Int</label>
                            </div>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-label">Language</div>
                        <input type="text" class="form-input-small" value="1">
                        <select class="dropdown">
                            <option>English</option>
                        </select>
                    </div>
                    <div class="form-row">
                        <div class="form-label">Company.1</div>
                        <input type="text" class="form-input" value="GB0010001">
                        <div style="margin-left: 10px;">Model Bank</div>
                        <div class="icon-button">+</div>
                    </div>
                </div>
                
                <!-- User Validity Period Section -->
                <div class="section-title">User Validity Period</div>
                <div class="form-group">
                    <div class="form-row">
                        <div class="form-label">Start Date</div>
                        <input type="text" class="form-input" value="09 OCT 2018">
                        <div class="icon-button">📅</div>
                    </div>
                    <div class="form-row">
                        <div class="form-label">End Date</div>
                        <input type="text" class="form-input" value="31 DEC 2099">
                        <div class="icon-button">📅</div>
                    </div>
                </div>
                
                <!-- Daily Work Duration Section -->
                <div class="section-title">Daily Work Duration</div>
                <div class="form-group">
                    <div class="form-row">
                        <div class="form-label">Start Time.1</div>
                        <input type="text" class="form-input-small" value="0">
                    </div>
                    <div class="form-row">
                        <div class="form-label">End Time.1</div>
                        <input type="text" class="form-input-small" value="2400">
                    </div>
                </div>
                
                <!-- Application and Function Access Section -->
                <div class="section-title">Application and Function Access</div>
                <div class="form-group">
                    <div class="form-row">
                        <div class="form-label">Company Restr.1</div>
                        <input type="text" class="form-input" value="ALL">
                    </div>
                    <div class="form-row">
                        <div class="form-label">User Group.1</div>
                        <input type="text" class="form-input" value="ALL.PG">
                    </div>
                    <div class="form-row">
                        <div class="form-label">Version.1</div>
                        <input type="text" class="form-input" value="">
                    </div>
                    <div class="form-row">
                        <div class="form-label">Function Allowed.1</div>
                        <input type="text" class="form-input" value="A2BCDEFHILPRSV">
                    </div>
                </div>
                
                <!-- Specific Day and Time Access Section -->
                <div class="section-title">Specific Day and Time Access</div>
                <div class="form-group">
                    <div class="form-row">
                        <div class="form-label">Allowed Days.1</div>
                        <input type="text" class="form-input-small" value="1">
                    </div>
                    <div class="form-row">
                        <div class="form-label">Day St Time.1</div>
                        <input type="text" class="form-input-small" value="1000">
                    </div>
                    <div class="form-row">
                        <div class="form-label">Day End Time.1</div>
                        <input type="text" class="form-input-small" value="2000">
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`

// eXate HTML Content
const eXateHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>eXate Solution</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            background: white;
            width: 100vw;
            height: 100vh;
            overflow: auto;
            display: flex;
            flex-direction: column;
            padding: 20px;
        }
        
        .header-label {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            color: #283054;
            margin-bottom: 30px;
            padding: 10px;
            width: 100%;
        }
        
        .main-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            position: relative;
            min-height: 600px;
        }
        
        .diagram-container {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 40px 20px;
            position: relative;
            min-height: 400px;
            max-width: 1200px;
            margin: 0 auto;
            width: 100%;
        }
        
        .temenos-core {
            background-color: #007BA7;
            color: white;
            padding: 30px 20px;
            border-radius: 8px;
            width: 180px;
            height: 300px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            font-weight: bold;
            font-size: 16px;
            line-height: 1.4;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        
        .exate-jdbc {
            background-color: #E0F2F7;
            border: 2px solid #B0D4E0;
            border-radius: 8px;
            padding: 20px;
            width: 220px;
            height: 300px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            text-align: center;
            position: relative;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        
        .exate-logo {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #87CEEB, #9370DB, #FFB6C1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            font-weight: bold;
            color: white;
            margin-bottom: 15px;
        }
        
        .jdbc-text {
            font-size: 18px;
            font-weight: bold;
            color: #283054;
            margin-top: 10px;
        }
        
        .protected-storage {
            background-color: #8A2BE2;
            color: white;
            padding: 30px 20px;
            border-radius: 8px;
            width: 180px;
            height: 300px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            font-weight: bold;
            font-size: 16px;
            line-height: 1.4;
            position: relative;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        
        .protected-storage::before {
            content: '';
            position: absolute;
            top: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 20px solid transparent;
            border-right: 20px solid transparent;
            border-bottom: 15px solid #8A2BE2;
        }
        
        .data-flow {
            position: absolute;
            height: 50px;
            display: flex;
            align-items: center;
            font-size: 14px;
            font-weight: bold;
            color: #283054;
            background-color: #D0E0F0;
            border: 2px solid #283054;
            border-radius: 4px;
            padding: 8px 12px;
            white-space: nowrap;
        }
        
        .data-flow-top {
            top: 180px;
        }
        
        .data-flow-bottom {
            bottom: 180px;
        }
        
        .data-flow-1 {
            left: 200px;
            width: 180px;
        }
        
        .data-flow-2 {
            right: 200px;
            width: 180px;
        }
        
        .data-flow-3 {
            right: 200px;
            width: 180px;
        }
        
        .data-flow-4 {
            left: 200px;
            width: 180px;
        }
        
        .encrypted-text {
            color: #ff0000;
            text-decoration: underline;
            text-decoration-style: dotted;
        }
        
        .arrow {
            position: absolute;
            width: 0;
            height: 0;
            border-style: solid;
        }
        
        .arrow-right {
            border-top: 8px solid transparent;
            border-bottom: 8px solid transparent;
            border-left: 15px solid #000;
        }
        
        .arrow-left {
            border-top: 8px solid transparent;
            border-bottom: 8px solid transparent;
            border-right: 15px solid #000;
        }
        
        .arrow-up {
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-bottom: 15px solid #000;
        }
        
        .arrow-1 {
            left: 380px;
            top: 205px;
        }
        
        .arrow-2 {
            right: 380px;
            top: 205px;
        }
        
        .arrow-3 {
            right: 380px;
            bottom: 205px;
        }
        
        .arrow-4 {
            left: 380px;
            bottom: 205px;
        }
        
        .arrow-5 {
            position: absolute;
            left: calc(50% - 200px);
            top: 50%;
            transform: translateY(-50%);
        }
        
        .arrow-6 {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            bottom: 320px;
        }
        
        .supporting-components {
            display: flex;
            justify-content: flex-start;
            align-items: center;
            gap: 30px;
            margin-top: -60px;
            padding: 0;
            padding-left: 20px;
            position: relative;
        }
        
        .metadata-management {
            background-color: #E0F2F7;
            border: 2px solid #B0D4E0;
            border-radius: 8px;
            padding: 15px 20px;
            display: flex;
            align-items: center;
            gap: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .metadata-logo {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #87CEEB, #9370DB, #FFB6C1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            color: white;
            flex-shrink: 0;
        }
        
        .metadata-text {
            font-size: 16px;
            font-weight: bold;
            color: #283054;
        }
        
        .datagator {
            background-color: white;
            border: 2px solid #283054;
            border-radius: 8px;
            padding: 15px 20px;
            display: flex;
            align-items: center;
            gap: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .datagator-logo {
            width: 40px;
            height: 40px;
            background-color: #283054;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            color: white;
            flex-shrink: 0;
        }
        
        .datagator-text {
            display: flex;
            flex-direction: column;
        }
        
        .datagator-name {
            font-size: 18px;
            font-weight: bold;
            color: #283054;
        }
        
        .datagator-subtitle {
            font-size: 12px;
            color: #666;
        }
        
        .connecting-line {
            height: 2px;
            background-color: #ff0000;
            flex: 0 0 30px;
            align-self: center;
        }
        
        .benefits-section {
            margin-top: 50px;
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 8px;
        }
        
        .benefits-title {
            font-size: 20px;
            font-weight: bold;
            color: #283054;
            margin-bottom: 15px;
        }
        
        .benefits-list {
            list-style: none;
            padding-left: 0;
        }
        
        .benefits-list li {
            font-size: 16px;
            color: #333;
            margin-bottom: 10px;
            line-height: 1.6;
        }
        
        .benefits-list li::before {
            content: '• ';
            font-weight: bold;
            color: #283054;
            margin-right: 8px;
        }
        
        .benefits-list li ul {
            list-style: none;
            padding-left: 30px;
            margin-top: 5px;
        }
        
        .benefits-list li ul li::before {
            content: '• ';
            font-weight: bold;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header-label">eXate (Temenos Exchange) solution for field encryption data at rest</div>
    
    <div class="main-container">
        <div class="diagram-container">
            <!-- Temenos Banking Core -->
            <div class="temenos-core">
                Temenos<br>Banking<br>Core
            </div>
            
            <!-- Data Flow 1: John Smith (top, left to right) -->
            <div class="data-flow data-flow-top data-flow-1">
                1. John Smith
            </div>
            <div class="arrow arrow-right arrow-1"></div>
            
            <!-- eXate JDBC encryption -->
            <div class="exate-jdbc">
                <div class="exate-logo">e</div>
                <div class="jdbc-text">JDBC encryption</div>
            </div>
            
            <!-- Data Flow 2: XY ZI %yusHUhndn98 (top, right) -->
            <div class="data-flow data-flow-top data-flow-2">
                3. XY ZI <span class="encrypted-text">%yusHUhndn98</span>
            </div>
            <div class="arrow arrow-right arrow-2"></div>
            
            <!-- Protected storage -->
            <div class="protected-storage">
                Protected<br>storage
            </div>
            
            <!-- Data Flow 3: XY ZI %yusHUhndn98 (bottom, right) -->
            <div class="data-flow data-flow-bottom data-flow-3">
                2. XY ZI <span class="encrypted-text">%yusHUhndn98</span>
            </div>
            <div class="arrow arrow-left arrow-3"></div>
            
            <!-- Data Flow 4: John Smith (bottom, left) -->
            <div class="data-flow data-flow-bottom data-flow-4">
                4. John Smith
            </div>
            <div class="arrow arrow-left arrow-4"></div>
        </div>
        
        <!-- Supporting Components -->
        <div class="supporting-components">
            <div class="metadata-management">
                <div class="metadata-logo">e</div>
                <div class="metadata-text">Metadata Management</div>
            </div>
            
            <div class="connecting-line"></div>
            <div class="arrow arrow-right arrow-5"></div>
            
            <div class="datagator">
                <div class="datagator-logo">A</div>
                <div class="datagator-text">
                    <div class="datagator-name">datagator</div>
                    <div class="datagator-subtitle">an exate company</div>
                </div>
            </div>
        </div>
        
        <!-- Arrow from datagator to JDBC -->
        <div class="arrow arrow-up arrow-6"></div>
        
        <!-- Benefits Section -->
        <div class="benefits-section">
            <div class="benefits-title">Benefits For Banks:</div>
            <ul class="benefits-list">
                <li>Additional layer of security for PII (Personally Identifiable Information) and other regulated sensitive data.
                    <ul>
                        <li>For data-at-rest</li>
                    </ul>
                </li>
                <li>Data Protection compliance is more easily auditable and reportable</li>
            </ul>
        </div>
    </div>
</body>
</html>`

// Privacy & Encryption HTML Content
const PrivacyEncryptionHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy & Encryption</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            background: #f5f5f5;
            width: 100vw;
            height: 100vh;
            overflow: auto;
            display: flex;
            flex-direction: column;
            padding: 20px;
        }
        
        .header-label {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            color: #283054;
            margin-bottom: 25px;
            padding: 10px;
            width: 100%;
        }
        
        .intro-statements {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 30px;
            padding: 0 20px;
        }
        
        .intro-statement {
            font-size: 16px;
            color: #333;
            line-height: 1.6;
        }
        
        .main-container {
            display: flex;
            flex: 1;
            gap: 0;
            min-height: 0;
            position: relative;
        }
        
        .divider {
            width: 2px;
            background-color: #000;
            flex-shrink: 0;
        }
        
        .section {
            flex: 1;
            display: flex;
            flex-direction: column;
            padding: 0 20px;
        }
        
        .section-title {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            margin-bottom: 12px;
        }
        
        .section-description {
            font-size: 16px;
            color: #666;
            margin-bottom: 20px;
            line-height: 1.5;
        }
        
        .arrow-container {
            display: flex;
            justify-content: center;
            margin-bottom: 15px;
        }
        
        .arrow {
            width: 0;
            height: 0;
            border-left: 12px solid transparent;
            border-right: 12px solid transparent;
            border-top: 25px solid #8B5CF6;
        }
        
        .content-box {
            background: #B0E0E6;
            border: 2px solid #87CEEB;
            border-radius: 6px;
            padding: 18px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            min-height: 150px;
        }
        
        .content-item {
            font-size: 14px;
            color: #333;
            line-height: 1.5;
        }
        
        .exate-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #EF4444;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            transition: background-color 0.3s ease;
        }
        
        .exate-button:hover {
            background-color: #DC2626;
        }
        
        .tooltip {
            position: absolute;
            background: white;
            border: 2px solid #ff0000;
            border-radius: 4px;
            padding: 12px;
            max-width: 500px;
            width: fit-content;
            height: fit-content;
            font-size: 16px;
            line-height: 1.5;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 2000;
            display: none;
            pointer-events: none;
            word-wrap: break-word;
            white-space: pre-wrap;
            text-align: left;
            vertical-align: top;
        }
        
        .tooltip.show {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        .tooltip-title {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 8px;
            color: #283054;
            text-align: left;
        }
        
        .tooltip-description {
            color: #333;
            font-size: 16px;
            text-align: left;
        }
        
        .section {
            cursor: pointer;
        }
        
        .section:hover {
            opacity: 0.9;
        }
        
        @media (max-width: 768px) {
            .main-container {
                flex-direction: column;
            }
            
            .divider {
                width: 100%;
                height: 2px;
                margin: 20px 0;
            }
            
            .section {
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <div class="header-label">Temenos Privacy & Encryption</div>
    
    <div class="intro-statements">
        <div class="intro-statement">
            1. All components storing data (as a permanent data store or transitory, e.g., Cloud Storage, Event Hub, virtual disks) must support encryption at the block level
        </div>
        <div class="intro-statement">
            2. Encryption in transit - TLS for all traffic (e.g., PostgreSQL, Azure SQL), or encrypted protocol (e.g., SSH)
        </div>
        <div class="intro-statement">
            3. Encrypt data using supplementary encryption, e.g., TLS1.2, SSH, AES256, IPSEC and DLP usage
        </div>
    </div>
    
    <div class="main-container">
        <!-- Left Section: Data in Transit -->
        <div id="left-section" class="section">
            <div class="section-title">Data in Transit</div>
            <div class="section-description">
                Data that is traversing a network or temporarily residing in computer memory to be read or updated.
            </div>
            <div class="arrow-container">
                <div class="arrow"></div>
            </div>
            <div class="content-box">
                <div class="content-item">HTTPS (TLS 1.2)</div>
                <div class="content-item">SMBv3 / SFTP / FTPS</div>
                <div class="content-item">Data Loss Prevention</div>
            </div>
        </div>
        
        <!-- Vertical Divider -->
        <div class="divider"></div>
        
        <!-- Right Section: Data at Rest -->
        <div id="right-section" class="section">
            <div class="section-title">Data at Rest</div>
            <div class="section-description">
                Inactive data stored physically in databases, data warehouses, spreadsheets, archives, tapes, off-site backups, etc...
            </div>
            <div class="arrow-container">
                <div class="arrow"></div>
            </div>
            <div class="content-box">
                <div class="content-item">Transparent Data Encryption for Databases</div>
                <div class="content-item">Database audit monitoring</div>
                <div class="content-item">Block level encryption in storage, queues</div>
                <div class="content-item">Data Loss Prevention</div>
            </div>
        </div>
    </div>
    
    <button class="exate-button" onclick="window.parent.postMessage({type: 'showExate'}, '*');">eXate (Temenos Exchange) solution</button>
    
    <div id="tooltip" class="tooltip">
        <div class="tooltip-title" id="tooltip-title"></div>
        <div class="tooltip-description" id="tooltip-description"></div>
    </div>
    
    <script>
        // Tooltip Configuration
        const tooltips = [
            {
                id: "left-section",
                title: "Left Section",
                description: "Data in Transit: \\n\\nFor data in transit, all communications are secured using modern Transport Layer Security (TLS) protocols, specifically TLS 1.2.\\n\\nAPI communications are encrypted end-to-end, leveraging partner-supported encryption mechanisms to maintain data security during exchanges. File transfers, including SFTP services, use SSH encryption standards and secure key management practices. Connections to web applications and APIs are exclusively over HTTPS.\\n\\nSecure Access: Access to interfaces that are not classified as public is subject to additional access controls. Public interfaces have to be protected by Web Application Firewalls (WAF) and Denial of Service (DoS) protection (done for Temenos SaaS.\\n\\nSecure File Transfers: For file transfers, protocols such as SFTP and FTPS are utilised, ensuring that files are encrypted during transit. Additionally, SSH encryption standards are applied for secure connections.\\n\\nLogging and Monitoring: All data transfers and user actions are logged for auditing purposes. This includes monitoring for unauthorised access attempts and ensuring compliance with security policies.",
                position: "right"
            },
            {
                id: "right-section",
                title: "Right Section",
                description: "Data at Rest: \\n\\nFor data at rest, encryption is applied comprehensively across storage layers. \\n\\n1. Databases utilise Transparent Data Encryption (TDE) with AES 256-bit encryption algorithms. TDE performs real-time I/O encryption and decryption of the data at the page level. Each page is decrypted when it's read into memory and then encrypted before being written to disk. \\n\\n2. TDE encrypts the entire database, including logs and backups, protecting data on disks and during backups.\\n\\n3. Storage devices, including disk volumes and containers, benefit from full disk encryption and block-level encryption.",
                position: "left"
            }
        ];
        
        const tooltip = document.getElementById('tooltip');
        const tooltipTitle = document.getElementById('tooltip-title');
        const tooltipDescription = document.getElementById('tooltip-description');
        
        function showTooltip(config, element) {
            if (!tooltip || !tooltipTitle || !tooltipDescription) {
                console.error('Tooltip elements not found');
                return;
            }
            
            tooltipTitle.textContent = config.title;
            tooltipDescription.textContent = config.description.replace(/\\\\n/g, '\\n');
            
            // Hide tooltip first to reset state
            tooltip.style.display = 'none';
            tooltip.classList.remove('show');
            
            // Show tooltip temporarily to measure
            tooltip.style.display = 'block';
            tooltip.style.visibility = 'hidden';
            tooltip.style.opacity = '0';
            tooltip.style.position = 'absolute';
            tooltip.style.left = '-9999px';
            tooltip.style.top = '-9999px';
            
            setTimeout(function() {
                const rect = element.getBoundingClientRect();
                const container = document.body;
                const containerRect = container.getBoundingClientRect();
                const tooltipRect = tooltip.getBoundingClientRect();
                
                let left, top;
                
                // Position based on config
                if (config.position === 'right') {
                    left = rect.right + 15;
                    top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                } else if (config.position === 'left') {
                    left = rect.left - tooltipRect.width - 15;
                    top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                } else if (config.position === 'top') {
                    left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                    top = rect.top - tooltipRect.height - 15;
                } else { // bottom
                    left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                    top = rect.bottom + 15;
                }
                
                // Ensure tooltip stays within container bounds
                if (left < containerRect.left) {
                    left = containerRect.left + 10;
                }
                if (left + tooltipRect.width > containerRect.right) {
                    left = containerRect.right - tooltipRect.width - 10;
                }
                if (top < containerRect.top) {
                    top = containerRect.top + 10;
                }
                if (top + tooltipRect.height > containerRect.bottom - 80) {
                    top = containerRect.bottom - tooltipRect.height - 90;
                }
                
                // Position and show tooltip
                tooltip.style.left = (left - containerRect.left) + 'px';
                tooltip.style.top = (top - containerRect.top) + 'px';
                tooltip.style.visibility = 'visible';
                tooltip.style.opacity = '1';
                tooltip.classList.add('show');
            }, 10);
        }
        
        function hideTooltip() {
            if (tooltip) {
                tooltip.classList.remove('show');
                tooltip.style.display = 'none';
                tooltip.style.visibility = 'hidden';
                tooltip.style.opacity = '0';
            }
        }
        
        function initializeTooltips() {
            tooltips.forEach(function(config) {
                const element = document.getElementById(config.id);
                if (element) {
                    element.addEventListener('click', function(e) {
                        e.stopPropagation();
                        const isSameTooltip = tooltip && tooltip.classList.contains('show') && tooltipTitle && tooltipTitle.textContent === config.title;
                        if (isSameTooltip) {
                            hideTooltip();
                        } else {
                            showTooltip(config, element);
                        }
                    });
                }
            });
            
            // Hide tooltip when clicking outside
            document.addEventListener('click', function(e) {
                const target = e.target;
                const isTooltipElement = tooltips.some(function(config) {
                    const element = document.getElementById(config.id);
                    return element && element.contains(target);
                });
                const isTooltipBox = tooltip && tooltip.contains(target);
                if (!isTooltipElement && !isTooltipBox) {
                    hideTooltip();
                }
            });
        }
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeTooltips);
        } else {
            initializeTooltips();
        }
    </script>
</body>
</html>`

export function SecurityContentViewer() {
  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const [showDetailedExplanation, setShowDetailedExplanation] = useState(false)
  const [showUserManagement, setShowUserManagement] = useState(false)
  const [showExate, setShowExate] = useState(false)

  const handleCardClick = (cardId: number) => {
    if (cardId === 1 || cardId === 2 || cardId === 3) {
      setSelectedCard(cardId)
    }
  }

  const handleBack = () => {
    setSelectedCard(null)
    setShowDetailedExplanation(false)
    setShowUserManagement(false)
    setShowExate(false)
  }

  const handleBackToArchitecture = () => {
    setShowDetailedExplanation(false)
  }

  // Listen for postMessage from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'showDetailedExplanation') {
        setShowDetailedExplanation(true)
      }
      if (event.data && event.data.type === 'showUserManagement') {
        setShowUserManagement(true)
      }
      if (event.data && event.data.type === 'showExate') {
        setShowExate(true)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  // Show HTML5 diagram when card 3 is selected
  if (selectedCard === 3) {
    // Show eXate page if button was clicked
    if (showExate) {
      return (
        <div className="card" style={{ height: 'calc(100vh - 200px)', position: 'relative', padding: 0 }}>
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => setShowExate(false)}
              className="flex items-center gap-2 px-4 py-2 bg-[#283054] text-white rounded-lg hover:bg-[#1e2440] transition-colors shadow-lg"
            >
              <X className="w-5 h-5" />
              <span>Back</span>
            </button>
          </div>
          <iframe
            srcDoc={eXateHTML}
            className="w-full h-full border-0 rounded-lg"
            title="eXate Solution"
            sandbox="allow-same-origin allow-scripts"
            style={{ minHeight: '600px' }}
          />
        </div>
      )
    }
    
    // Show PrivacyEncryption by default
    return (
      <div className="card" style={{ height: 'calc(100vh - 200px)', position: 'relative', padding: 0 }}>
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 bg-[#283054] text-white rounded-lg hover:bg-[#1e2440] transition-colors shadow-lg"
          >
            <X className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
        <iframe
          srcDoc={PrivacyEncryptionHTML}
          className="w-full h-full border-0 rounded-lg"
          title="Privacy & Encryption"
          sandbox="allow-same-origin allow-scripts"
          style={{ minHeight: '600px' }}
        />
      </div>
    )
  }

  // Show HTML5 diagram when card 2 is selected
  if (selectedCard === 2) {
    // Show UserManagement if button was clicked
    if (showUserManagement) {
      return (
        <div className="card" style={{ height: 'calc(100vh - 200px)', position: 'relative', padding: 0 }}>
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => setShowUserManagement(false)}
              className="flex items-center gap-2 px-4 py-2 bg-[#283054] text-white rounded-lg hover:bg-[#1e2440] transition-colors shadow-lg"
            >
              <X className="w-5 h-5" />
              <span>Back</span>
            </button>
          </div>
          <iframe
            srcDoc={UserManagementHTML}
            className="w-full h-full border-0 rounded-lg"
            title="User Management"
            sandbox="allow-same-origin allow-scripts"
            style={{ minHeight: '600px' }}
          />
        </div>
      )
    }
    
    // Show TemenosAuthorization by default
    return (
      <div className="card" style={{ height: 'calc(100vh - 200px)', position: 'relative', padding: 0 }}>
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 bg-[#283054] text-white rounded-lg hover:bg-[#1e2440] transition-colors shadow-lg"
          >
            <X className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
        <iframe
          srcDoc={TemenosAuthorizationHTML}
          className="w-full h-full border-0 rounded-lg"
          title="Temenos Authorization"
          sandbox="allow-same-origin allow-scripts"
          style={{ minHeight: '600px' }}
        />
      </div>
    )
  }

  // Show HTML5 diagram when card 1 is selected
  if (selectedCard === 1) {
    // Show TemenosAuthentication if button was clicked
    if (showDetailedExplanation) {
      return (
        <div className="card" style={{ height: 'calc(100vh - 200px)', position: 'relative', padding: 0 }}>
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={handleBackToArchitecture}
              className="flex items-center gap-2 px-4 py-2 bg-[#283054] text-white rounded-lg hover:bg-[#1e2440] transition-colors shadow-lg"
            >
              <X className="w-5 h-5" />
              <span>Back</span>
            </button>
          </div>
          <iframe
            srcDoc={TemenosAuthenticationHTML}
            className="w-full h-full border-0 rounded-lg"
            title="Temenos Authentication"
            sandbox="allow-same-origin allow-scripts"
            style={{ minHeight: '600px' }}
          />
        </div>
      )
    }
    
    // Show SecurityArchitecture by default
    return (
      <div className="card" style={{ height: 'calc(100vh - 200px)', position: 'relative', padding: 0 }}>
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 bg-[#283054] text-white rounded-lg hover:bg-[#1e2440] transition-colors shadow-lg"
          >
            <X className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
        <iframe
          srcDoc={SecurityArchitectureHTML}
          className="w-full h-full border-0 rounded-lg"
          title="Temenos Security Architecture"
          sandbox="allow-scripts"
          style={{ minHeight: '600px' }}
        />
      </div>
    )
  }

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#283054] mb-2">Security Content</h2>
        <p className="text-[#4A5568]">Select a security category and explore content</p>
      </div>

      {/* Layout: Column with categories + Card palette - Vertical center alignment */}
      <div className="flex gap-6">
        {/* Security Categories Column - Vertical */}
        <div className="w-64 flex-shrink-0 flex flex-col justify-center">
          <div className="space-y-4">
            {securityCategories.map((category) => {
              return (
                <div
                  key={category.id}
                  className="card hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-[#283054] flex items-center justify-center"
                  style={{
                    minHeight: '200px',
                    height: '200px',
                  }}
                >
                  <div className="flex flex-col items-center justify-center text-center p-6 w-full">
                    <h3 className="text-base font-semibold text-[#283054]">
                      {category.name}
                    </h3>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Card Palette - 3 rows x 3 cards - Grouped by rows for alignment */}
        <div className="flex-1">
          <div className="space-y-4">
            {/* Row 1: Cards 1, 2, 3 */}
            <div className="grid grid-cols-3 gap-4">
              {cards.slice(0, 3).map((card) => {
                const IconComponent = card.icon
                return (
                  <div
                    key={card.id}
                    onClick={() => handleCardClick(card.id)}
                    className="card hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-[#283054]"
                    style={{
                      borderColor: card.color,
                      minHeight: '200px',
                      height: '200px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <div className="flex flex-col items-center text-center p-6 w-full">
                      <div 
                        className="mb-4 p-4 rounded-lg"
                        style={{
                          backgroundColor: card.bgColor,
                        }}
                      >
                        <IconComponent 
                          className="w-8 h-8" 
                          style={{ color: card.color }}
                        />
                      </div>
                      <h3 
                        className="text-lg font-semibold mb-2"
                        style={{ color: card.color }}
                      >
                        {card.title}
                      </h3>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Row 2: Cards 4, 5, 6 */}
            <div className="grid grid-cols-3 gap-4">
              {cards.slice(3, 6).map((card) => {
                const IconComponent = card.icon
                return (
                  <div
                    key={card.id}
                    onClick={() => handleCardClick(card.id)}
                    className="card hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-[#283054]"
                    style={{
                      borderColor: card.color,
                      minHeight: '200px',
                      height: '200px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <div className="flex flex-col items-center text-center p-6 w-full">
                      <div 
                        className="mb-4 p-4 rounded-lg"
                        style={{
                          backgroundColor: card.bgColor,
                        }}
                      >
                        <IconComponent 
                          className="w-8 h-8" 
                          style={{ color: card.color }}
                        />
                      </div>
                      <h3 
                        className="text-lg font-semibold mb-2"
                        style={{ color: card.color }}
                      >
                        {card.title}
                      </h3>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Row 3: Cards 7, 8, 9 */}
            <div className="grid grid-cols-3 gap-4">
              {cards.slice(6, 9).map((card) => {
                const IconComponent = card.icon
                return (
                  <div
                    key={card.id}
                    onClick={() => handleCardClick(card.id)}
                    className="card hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-[#283054]"
                    style={{
                      borderColor: card.color,
                      minHeight: '200px',
                      height: '200px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <div className="flex flex-col items-center text-center p-6 w-full">
                      <div 
                        className="mb-4 p-4 rounded-lg"
                        style={{
                          backgroundColor: card.bgColor,
                        }}
                      >
                        <IconComponent 
                          className="w-8 h-8" 
                          style={{ color: card.color }}
                        />
                      </div>
                      <h3 
                        className="text-lg font-semibold mb-2"
                        style={{ color: card.color }}
                      >
                        {card.title}
                      </h3>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
