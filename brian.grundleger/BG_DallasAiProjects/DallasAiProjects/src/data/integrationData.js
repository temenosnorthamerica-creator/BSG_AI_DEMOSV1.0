/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 *
 * Generated from: apps_integration_info.txt
 * Generated at: 2026-02-12T00:57:30.345Z
 *
 * To update this file, modify apps_integration_info.txt and run:
 *   npm run generate-data
 *
 * Or it will auto-regenerate on npm run dev / npm run build
 */

// Integration connections parsed from apps_integration_info.txt
export const integrationConnections = [
  {
    "source": "CRM Banking Simulator",
    "target": "ESB - Enterprise Service Bus",
    "patterns": [
      "Events"
    ]
  },
  {
    "source": "ESB - Enterprise Service Bus",
    "target": "CRM Banking Simulator",
    "patterns": [
      "APIs"
    ]
  },
  {
    "source": "Debit Cards Demo",
    "target": "ESB - Enterprise Service Bus",
    "patterns": [
      "Events",
      "APIs"
    ]
  },
  {
    "source": "LMS Applicant Portal",
    "target": "ESB - Enterprise Service Bus",
    "patterns": [
      "APIs"
    ]
  },
  {
    "source": "Creditos - Sistema de Solicitudes",
    "target": "ESB - Enterprise Service Bus",
    "patterns": [
      "Events",
      "APIs"
    ]
  },
  {
    "source": "ESB - Enterprise Service Bus",
    "target": "Core",
    "patterns": [
      "APIs",
      "Files"
    ]
  },
  {
    "source": "Core",
    "target": "ESB - Enterprise Service Bus",
    "patterns": [
      "Events"
    ]
  },
  {
    "source": "Core",
    "target": "Azure Event Hub",
    "patterns": [
      "Events"
    ]
  },
  {
    "source": "Azure Event Hub",
    "target": "ESB - Enterprise Service Bus",
    "patterns": [
      "Events"
    ]
  }
]

// Extract unique systems from connections
export const getUniqueSystems = () => {
  const systems = new Set()
  integrationConnections.forEach(conn => {
    systems.add(conn.source)
    systems.add(conn.target)
  })
  return Array.from(systems)
}

// System colors for visual distinction
export const systemColors = {
  "CRM Banking Simulator": "#10B981",
  "ESB - Enterprise Service Bus": "#06B6D4",
  "Debit Cards Demo": "#3B82F6",
  "LMS Applicant Portal": "#8B5CF6",
  "Creditos - Sistema de Solicitudes": "#F59E0B",
  "Core": "#EF4444",
  "Azure Event Hub": "#0EA5E9"
}

// Pattern colors
export const patternColors = {
  "Events": "#22C55E",
  "APIs": "#3B82F6",
  "Files": "#F59E0B"
}

export default integrationConnections
