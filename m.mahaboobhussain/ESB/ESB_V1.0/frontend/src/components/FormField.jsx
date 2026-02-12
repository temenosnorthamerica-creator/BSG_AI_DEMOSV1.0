import React, { useState } from 'react';
import { Calendar, Clock, Mail, Phone, Link, HelpCircle, Lock, Zap, Variable, Info } from 'lucide-react';

// Convert technical field names to human-readable labels
function humanizeFieldName(path) {
  if (!path) return '';

  // Get the last part of the path (the actual field name)
  const fieldName = path.split('.').pop().replace(/\[\]/g, '');

  // Convert camelCase to Title Case with spaces
  return fieldName
    // Insert space before capital letters
    .replace(/([A-Z])/g, ' $1')
    // Insert space before numbers
    .replace(/([0-9]+)/g, ' $1')
    // Handle common abbreviations
    .replace(/\bId\b/gi, 'ID')
    .replace(/\bUrl\b/gi, 'URL')
    .replace(/\bApi\b/gi, 'API')
    // Capitalize first letter and trim
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

// Get a friendly description based on field name patterns
// Hints disabled - return null for cleaner UI
function getFieldHint(fieldName, fieldType) {
  return null;
}

function FormField({ field, value, onChange, path, sampleValue, fieldConfig, variableInfo }) {
  const [showTechnical, setShowTechnical] = useState(false);

  const fieldId = `field-${path.replace(/\./g, '-')}`;
  const fieldType = fieldConfig?.inputType || field.type || 'string';
  const configLabel = fieldConfig?.label;
  const humanLabel = humanizeFieldName(path);
  const fieldName = configLabel || humanLabel;
  const visibility = fieldConfig?.visibility || 'editable';
  const options = fieldConfig?.options || [];
  const validation = fieldConfig?.validation || {};
  const fieldHint = getFieldHint(path, fieldType);

  // Skip hidden fields
  if (visibility === 'hidden') {
    return null;
  }

  const isReadOnly = visibility === 'readonly';
  const isAutoGenerate = visibility === 'auto';
  const hasVariable = variableInfo && variableInfo.length > 0;

  const handleChange = (e) => {
    if (isReadOnly) return;

    let newValue;
    if (fieldType === 'boolean') {
      newValue = e.target.checked;
    } else if (fieldType === 'number') {
      newValue = e.target.value === '' ? '' : Number(e.target.value);
    } else {
      newValue = e.target.value;
    }
    onChange(path, newValue);
  };

  const getPlaceholder = () => {
    if (fieldConfig?.placeholder) {
      return fieldConfig.placeholder;
    }
    if (sampleValue !== undefined && sampleValue !== null && typeof sampleValue !== 'object') {
      return `e.g., ${sampleValue}`;
    }
    return `Enter ${fieldName.toLowerCase()}`;
  };

  // Format date value for input
  const formatDateValue = (val) => {
    if (!val) return '';
    if (typeof val === 'string') {
      if (val.includes('T')) {
        return val.split('T')[0];
      }
      return val;
    }
    return '';
  };

  // Format datetime value for input
  const formatDateTimeValue = (val) => {
    if (!val) return '';
    if (typeof val === 'string') {
      if (val.includes('T')) {
        return val.slice(0, 16);
      }
    }
    return '';
  };

  const renderInput = () => {
    const baseClassName = `form-control-clean ${isReadOnly ? 'readonly' : ''} ${isAutoGenerate ? 'auto-generate' : ''}`;

    switch (fieldType) {
      case 'boolean':
        return (
          <label className="toggle-switch">
            <input
              type="checkbox"
              id={fieldId}
              checked={!!value}
              onChange={handleChange}
              disabled={isReadOnly}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label">{value ? 'Yes' : 'No'}</span>
          </label>
        );

      case 'number':
        return (
          <input
            type="number"
            id={fieldId}
            value={value ?? ''}
            onChange={handleChange}
            className={baseClassName}
            placeholder={getPlaceholder()}
            disabled={isReadOnly}
            required={validation.required}
          />
        );

      case 'date':
        return (
          <div className="input-with-icon">
            <Calendar size={16} className="input-icon" />
            <input
              type="date"
              id={fieldId}
              value={formatDateValue(value)}
              onChange={handleChange}
              className={baseClassName}
              disabled={isReadOnly}
              required={validation.required}
            />
          </div>
        );

      case 'datetime':
        return (
          <div className="input-with-icon">
            <Clock size={16} className="input-icon" />
            <input
              type="datetime-local"
              id={fieldId}
              value={formatDateTimeValue(value)}
              onChange={handleChange}
              className={baseClassName}
              disabled={isReadOnly}
              required={validation.required}
            />
          </div>
        );

      case 'email':
        return (
          <div className="input-with-icon">
            <Mail size={16} className="input-icon" />
            <input
              type="text"
              id={fieldId}
              value={value ?? ''}
              onChange={handleChange}
              className={baseClassName}
              placeholder={getPlaceholder()}
              disabled={isReadOnly}
            />
          </div>
        );

      case 'tel':
        return (
          <div className="input-with-icon">
            <Phone size={16} className="input-icon" />
            <input
              type="text"
              id={fieldId}
              value={value ?? ''}
              onChange={handleChange}
              className={baseClassName}
              placeholder={getPlaceholder()}
              disabled={isReadOnly}
            />
          </div>
        );

      case 'url':
        return (
          <div className="input-with-icon">
            <Link size={16} className="input-icon" />
            <input
              type="text"
              id={fieldId}
              value={value ?? ''}
              onChange={handleChange}
              className={baseClassName}
              placeholder={getPlaceholder()}
              disabled={isReadOnly}
            />
          </div>
        );

      case 'select':
        return (
          <select
            id={fieldId}
            value={value ?? ''}
            onChange={handleChange}
            className={baseClassName}
            disabled={isReadOnly}
            required={validation.required}
          >
            <option value="">Select {fieldName.toLowerCase()}...</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            id={fieldId}
            value={value ?? ''}
            onChange={handleChange}
            className={baseClassName}
            placeholder={getPlaceholder()}
            rows={3}
            disabled={isReadOnly}
            required={validation.required}
          />
        );

      default:
        // Check if it looks like a long text field
        const isLongText = sampleValue && typeof sampleValue === 'string' && sampleValue.length > 50;
        if (isLongText) {
          return (
            <textarea
              id={fieldId}
              value={value ?? ''}
              onChange={handleChange}
              className={baseClassName}
              placeholder={getPlaceholder()}
              rows={2}
              disabled={isReadOnly}
              required={validation.required}
            />
          );
        }
        return (
          <input
            type="text"
            id={fieldId}
            value={value ?? ''}
            onChange={handleChange}
            className={baseClassName}
            placeholder={getPlaceholder()}
            disabled={isReadOnly}
            required={validation.required}
          />
        );
    }
  };

  return (
    <div className={`form-field-clean ${isReadOnly ? 'field-readonly' : ''} ${isAutoGenerate ? 'field-auto' : ''}`}>
      <label htmlFor={fieldId} className="field-label-clean">
        <span className="label-text">
          {fieldName}
          {validation.required && <span className="required-mark">*</span>}
        </span>
        <div className="label-indicators">
          {isAutoGenerate && (
            <span className="indicator auto" title="Auto-generated on submit">
              <Zap size={12} />
            </span>
          )}
          {isReadOnly && (
            <span className="indicator readonly" title="Read-only field">
              <Lock size={12} />
            </span>
          )}
          {hasVariable && (
            <span
              className={`indicator variable ${variableInfo[0]?.hasValue ? 'has-value' : ''}`}
              title={variableInfo[0]?.hasValue ? `Variable: ${variableInfo[0].value}` : 'Variable not set'}
            >
              <Variable size={12} />
            </span>
          )}
          <button
            type="button"
            className="info-btn"
            onClick={() => setShowTechnical(!showTechnical)}
            title="Show technical details"
          >
            <Info size={12} />
          </button>
        </div>
      </label>

      {/* Technical details (hidden by default) */}
      {showTechnical && (
        <div className="technical-details">
          <code>{path}</code>
          <span className="tech-type">{fieldType}</span>
        </div>
      )}

      {/* Field hint */}
      {fieldHint && !showTechnical && (
        <p className="field-hint">{fieldHint}</p>
      )}

      <div className="field-input-clean">
        {renderInput()}
      </div>

      {validation.message && (
        <span className="validation-message">{validation.message}</span>
      )}
    </div>
  );
}

export default FormField;
