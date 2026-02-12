/**
 * Integration Data Generator Script
 *
 * This script reads apps_integration_info.txt and generates integrationData.js
 * Run automatically before dev/build via npm scripts
 *
 * Text file format: Source:Target|Pattern1,Pattern2
 * Example: CRM Banking Simulator:ESB - Enterprise Service Bus|Events,APIs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Path configuration
// scripts → DallasAiProjects → BG_DallasAiProjects → brian.grundleger → AMRBSGSYSINTDEMO
const PROJECT_ROOT = path.resolve(__dirname, '../../../../')
const INPUT_FILE = path.join(PROJECT_ROOT, 'apps_integration_info.txt')
const OUTPUT_FILE = path.join(__dirname, '../src/data/integrationData.js')

// Predefined colors for known systems (maintains consistency)
const KNOWN_SYSTEM_COLORS = {
  'CRM Banking Simulator': '#10B981',           // Emerald
  'Debit Cards Demo': '#3B82F6',                // Blue
  'LMS Applicant Portal': '#8B5CF6',            // Violet
  'Creditos - Sistema de Solicitudes': '#F59E0B', // Amber
  'ESB - Enterprise Service Bus': '#06B6D4',    // Cyan
  'Enterprise Service Bus': '#06B6D4',          // Cyan (alias)
  'Core': '#EF4444',                            // Red
  'Azure Event Hub': '#0EA5E9',                 // Sky Blue
  'Middleware Integration': '#EC4899',          // Pink
}

// Color palette for new/unknown systems
const COLOR_PALETTE = [
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#84CC16', // Lime
  '#A855F7', // Purple
  '#EAB308', // Yellow
  '#22D3EE', // Cyan
  '#FB7185', // Rose
  '#34D399', // Emerald
  '#60A5FA', // Blue
  '#C084FC', // Violet
]

// Pattern colors
const PATTERN_COLORS = {
  'Events': '#22C55E',  // Green
  'APIs': '#3B82F6',    // Blue
  'Files': '#F59E0B',   // Amber
  'Batch': '#8B5CF6',   // Violet
}

// Normalize system names (handle variations)
function normalizeSystemName(name) {
  const trimmed = name.trim()

  // Normalize ESB variations
  if (trimmed === 'Enterprise Service Bus') {
    return 'ESB - Enterprise Service Bus'
  }

  return trimmed
}

// Parse the integration info file
function parseIntegrationFile(filePath) {
  console.log(`Reading: ${filePath}`)

  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: File not found: ${filePath}`)
    process.exit(1)
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n').filter(line => line.trim() !== '')

  const connections = []
  const systems = new Set()
  const patterns = new Set()

  lines.forEach((line, index) => {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || line.trim() === '') {
      return
    }

    // Parse format: Source:Target|Pattern1,Pattern2
    const pipeIndex = line.lastIndexOf('|')
    if (pipeIndex === -1) {
      console.warn(`WARNING: Line ${index + 1} missing patterns separator '|': ${line}`)
      return
    }

    const leftPart = line.substring(0, pipeIndex)
    const patternsPart = line.substring(pipeIndex + 1)

    const colonIndex = leftPart.indexOf(':')
    if (colonIndex === -1) {
      console.warn(`WARNING: Line ${index + 1} missing source/target separator ':': ${line}`)
      return
    }

    const source = normalizeSystemName(leftPart.substring(0, colonIndex))
    const target = normalizeSystemName(leftPart.substring(colonIndex + 1))
    const linePatterns = patternsPart.split(',').map(p => p.trim()).filter(p => p !== '')

    if (!source || !target) {
      console.warn(`WARNING: Line ${index + 1} has empty source or target: ${line}`)
      return
    }

    systems.add(source)
    systems.add(target)
    linePatterns.forEach(p => patterns.add(p))

    connections.push({
      source,
      target,
      patterns: linePatterns
    })
  })

  return { connections, systems: Array.from(systems), patterns: Array.from(patterns) }
}

// Assign colors to systems
function assignSystemColors(systems) {
  const colors = {}
  let paletteIndex = 0

  systems.forEach(system => {
    if (KNOWN_SYSTEM_COLORS[system]) {
      colors[system] = KNOWN_SYSTEM_COLORS[system]
    } else {
      // Assign from palette
      colors[system] = COLOR_PALETTE[paletteIndex % COLOR_PALETTE.length]
      paletteIndex++
      console.log(`  New system detected: "${system}" → ${colors[system]}`)
    }
  })

  return colors
}

// Assign colors to patterns
function assignPatternColors(patterns) {
  const colors = {}
  const defaultPatternColors = ['#22C55E', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899']
  let colorIndex = 0

  patterns.forEach(pattern => {
    if (PATTERN_COLORS[pattern]) {
      colors[pattern] = PATTERN_COLORS[pattern]
    } else {
      colors[pattern] = defaultPatternColors[colorIndex % defaultPatternColors.length]
      colorIndex++
      console.log(`  New pattern detected: "${pattern}" → ${colors[pattern]}`)
    }
  })

  return colors
}

// Generate the JavaScript file
function generateJavaScript(connections, systemColors, patternColors) {
  const timestamp = new Date().toISOString()

  const code = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 *
 * Generated from: apps_integration_info.txt
 * Generated at: ${timestamp}
 *
 * To update this file, modify apps_integration_info.txt and run:
 *   npm run generate-data
 *
 * Or it will auto-regenerate on npm run dev / npm run build
 */

// Integration connections parsed from apps_integration_info.txt
export const integrationConnections = ${JSON.stringify(connections, null, 2)}

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
export const systemColors = ${JSON.stringify(systemColors, null, 2)}

// Pattern colors
export const patternColors = ${JSON.stringify(patternColors, null, 2)}

export default integrationConnections
`

  return code
}

// Main execution
function main() {
  console.log('\n🔄 Generating Integration Data...\n')

  // Parse the input file
  const { connections, systems, patterns } = parseIntegrationFile(INPUT_FILE)

  console.log(`\n📊 Found:`)
  console.log(`   ${connections.length} connections`)
  console.log(`   ${systems.length} systems`)
  console.log(`   ${patterns.length} patterns\n`)

  // Assign colors
  const systemColors = assignSystemColors(systems)
  const patternColors = assignPatternColors(patterns)

  // Generate JavaScript
  const jsCode = generateJavaScript(connections, systemColors, patternColors)

  // Write output file
  fs.writeFileSync(OUTPUT_FILE, jsCode, 'utf-8')

  console.log(`\n✅ Generated: ${OUTPUT_FILE}\n`)
}

main()
