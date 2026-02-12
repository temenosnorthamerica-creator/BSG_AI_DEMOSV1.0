/**
 * Form Configuration Service
 * Infers smart form configuration from field names and sample data
 */

// CloudEvents envelope fields that should be hidden from user input
const CLOUDEVENTS_HIDDEN_FIELDS = [
  'specversion',
  'datacontenttype'
];

// Fields that should be auto-generated
const AUTO_GENERATE_PATTERNS = [
  /^id$/i,
  /^time$/i,
  /createdat$/i,
  /updatedat$/i,
  /timestamp$/i
];

// Fields that should be readonly (shown but not editable)
const READONLY_PATTERNS = [
  /^type$/i,
  /^source$/i,
  /^subject$/i
];

// Common enum values for known field patterns
const KNOWN_ENUMS = {
  customerType: ['INDIVIDUAL', 'CORPORATE', 'SME'],
  status: ['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED'],
  kycStatus: ['VERIFIED', 'PENDING', 'REJECTED', 'NOT_STARTED'],
  kycLevel: ['BASIC', 'STANDARD', 'FULL', 'ENHANCED'],
  addressType: ['RESIDENTIAL', 'BUSINESS', 'MAILING', 'BILLING'],
  type: ['RESIDENTIAL', 'BUSINESS', 'MAILING', 'PRIMARY', 'SECONDARY']
};

/**
 * Infer the input type for a field based on its name and value
 */
function inferInputType(fieldName, sampleValue) {
  const lowerName = fieldName.toLowerCase();

  // Date patterns
  if (/date|dob|birth|birthday/i.test(lowerName) && !/update|create/i.test(lowerName)) {
    return 'date';
  }

  // DateTime patterns (timestamps)
  if (/time|timestamp|at$/i.test(lowerName) || /^\d{4}-\d{2}-\d{2}T/.test(String(sampleValue))) {
    return 'datetime';
  }

  // Email patterns
  if (/email|e-mail|mail/i.test(lowerName)) {
    return 'email';
  }

  // Phone patterns
  if (/phone|mobile|tel|fax|cell/i.test(lowerName)) {
    return 'tel';
  }

  // URL patterns
  if (/url|link|website|href/i.test(lowerName)) {
    return 'url';
  }

  // Check for known enums
  const lastPart = fieldName.split('.').pop();
  if (KNOWN_ENUMS[lastPart]) {
    return 'select';
  }

  // Infer from value type
  if (typeof sampleValue === 'boolean') {
    return 'boolean';
  }

  if (typeof sampleValue === 'number') {
    return 'number';
  }

  // Long text
  if (typeof sampleValue === 'string' && sampleValue.length > 100) {
    return 'textarea';
  }

  return 'text';
}

/**
 * Determine field visibility
 */
function inferVisibility(fieldPath, isCloudEvent = true) {
  const fieldName = fieldPath.split('.').pop();
  const isRootField = !fieldPath.includes('.');
  const isDataField = fieldPath.startsWith('data.');

  // CloudEvents envelope fields at root level
  if (isCloudEvent && isRootField) {
    if (CLOUDEVENTS_HIDDEN_FIELDS.includes(fieldName)) {
      return 'hidden';
    }
    if (READONLY_PATTERNS.some(p => p.test(fieldName))) {
      return 'readonly';
    }
    if (AUTO_GENERATE_PATTERNS.some(p => p.test(fieldName))) {
      return 'auto';
    }
  }

  // Auto-generate patterns anywhere
  if (AUTO_GENERATE_PATTERNS.some(p => p.test(fieldName))) {
    return 'auto';
  }

  return 'editable';
}

/**
 * Get enum options for a field
 */
function getEnumOptions(fieldName, sampleValue) {
  const lastPart = fieldName.split('.').pop();

  // Check known enums
  if (KNOWN_ENUMS[lastPart]) {
    const options = [...KNOWN_ENUMS[lastPart]];
    // Add sample value if not in list
    if (sampleValue && !options.includes(sampleValue)) {
      options.unshift(sampleValue);
    }
    return options;
  }

  return null;
}

/**
 * Generate a human-readable label from field name
 */
function generateLabel(fieldName) {
  const lastPart = fieldName.split('.').pop();

  // Handle camelCase and special patterns
  return lastPart
    .replace(/([A-Z])/g, ' $1')  // Add space before capitals
    .replace(/([a-z])(\d)/g, '$1 $2')  // Add space before numbers
    .replace(/^./, str => str.toUpperCase())  // Capitalize first letter
    .replace(/\bid\b/gi, 'ID')  // Fix ID capitalization
    .replace(/\bkyc\b/gi, 'KYC')  // Fix KYC capitalization
    .trim();
}

/**
 * Detect if the sample data follows CloudEvents specification
 */
function isCloudEventFormat(sampleData) {
  if (!sampleData || typeof sampleData !== 'object') return false;

  // CloudEvents required fields
  const hasSpecversion = 'specversion' in sampleData;
  const hasType = 'type' in sampleData;
  const hasSource = 'source' in sampleData;
  const hasId = 'id' in sampleData;

  return hasSpecversion && hasType && hasSource && hasId;
}

/**
 * Generate form configuration for a list of fields
 */
export function generateFormConfig(fields, sampleData) {
  const isCloudEvent = isCloudEventFormat(sampleData);
  const config = {
    isCloudEvent,
    fields: {}
  };

  // Helper to get nested value
  function getNestedValue(obj, path) {
    if (!obj || !path) return undefined;
    const parts = path.replace(/\[\]/g, '[0]').split(/[\.\[\]]+/).filter(Boolean);
    let current = obj;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    return current;
  }

  for (const fieldPath of fields) {
    const sampleValue = getNestedValue(sampleData, fieldPath);
    const inputType = inferInputType(fieldPath, sampleValue);
    const visibility = inferVisibility(fieldPath, isCloudEvent);
    const enumOptions = getEnumOptions(fieldPath, sampleValue);

    config.fields[fieldPath] = {
      path: fieldPath,
      label: generateLabel(fieldPath),
      inputType: enumOptions ? 'select' : inputType,
      visibility,
      options: enumOptions,
      placeholder: sampleValue !== undefined ? `e.g., ${sampleValue}` : null,
      defaultValue: visibility === 'auto' ? null : sampleValue,
      autoGenerate: visibility === 'auto',
      validation: inferValidation(fieldPath, inputType)
    };
  }

  return config;
}

/**
 * Infer basic validation rules
 */
function inferValidation(fieldPath, inputType) {
  const validation = {};
  const fieldName = fieldPath.split('.').pop().toLowerCase();

  // Required fields (common patterns)
  if (/firstname|lastname|email|phone|mobile/i.test(fieldName)) {
    validation.required = true;
  }

  // Email validation pattern (message only shown on actual validation failure)
  if (inputType === 'email') {
    validation.pattern = '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$';
  }

  // Phone validation pattern (message only shown on actual validation failure)
  if (inputType === 'tel') {
    validation.pattern = '^[+]?[0-9\\s-]{7,15}$';
  }

  return Object.keys(validation).length > 0 ? validation : null;
}

/**
 * Generate auto-values for fields marked as auto-generate
 */
export function generateAutoValues(formConfig) {
  const autoValues = {};

  for (const [fieldPath, fieldConfig] of Object.entries(formConfig.fields)) {
    if (fieldConfig.visibility === 'auto' || fieldConfig.visibility === 'hidden') {
      const fieldName = fieldPath.split('.').pop().toLowerCase();

      if (fieldName === 'id' || fieldPath === 'id') {
        autoValues[fieldPath] = generateUUID();
      } else if (fieldName === 'time' || fieldPath === 'time') {
        autoValues[fieldPath] = new Date().toISOString();
      } else if (/createdat|updatedat|timestamp/i.test(fieldName)) {
        autoValues[fieldPath] = new Date().toISOString();
      } else if (fieldPath === 'specversion') {
        autoValues[fieldPath] = '1.0';
      } else if (fieldPath === 'datacontenttype') {
        autoValues[fieldPath] = 'application/json';
      }
    }
  }

  return autoValues;
}

/**
 * Generate a UUID v4
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Merge user form data with auto-generated values
 */
export function mergeWithAutoValues(formData, formConfig) {
  const autoValues = generateAutoValues(formConfig);
  const result = JSON.parse(JSON.stringify(formData));

  // Helper to set nested value
  function setNestedValue(obj, path, value) {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    current[parts[parts.length - 1]] = value;
  }

  for (const [path, value] of Object.entries(autoValues)) {
    setNestedValue(result, path, value);
  }

  return result;
}

export default {
  generateFormConfig,
  generateAutoValues,
  mergeWithAutoValues,
  isCloudEventFormat
};
