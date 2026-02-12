import React, { useState, useEffect, useMemo } from 'react';
import { RotateCcw, Trash2, Eye, EyeOff, Send, Settings, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import FormField from './FormField';
import FormSection from './FormSection';
import FormArray from './FormArray';

function DynamicForm({
  fields,
  sampleData,
  formConfig,
  onSubmit,
  submitLabel = 'Submit',
  disabled = false,
  showHiddenFields: showHiddenFieldsProp = false,
  fieldVariables = {},
  formSettings = null
}) {
  const [formData, setFormData] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [showAutoFields, setShowAutoFields] = useState(false);
  const [showHiddenFieldsState, setShowHiddenFieldsState] = useState(showHiddenFieldsProp);
  const [showReadonlyFields, setShowReadonlyFields] = useState(false); // Hidden by default

  // Combine prop and state for showing hidden fields
  const showHiddenFields = showHiddenFieldsProp || showHiddenFieldsState;

  const originalSampleData = useMemo(() => {
    return sampleData ? JSON.parse(JSON.stringify(sampleData)) : null;
  }, [sampleData]);

  // Get fields configuration map
  const fieldsConfig = useMemo(() => {
    return formConfig?.fields || {};
  }, [formConfig]);

  useEffect(() => {
    if (sampleData) {
      // Filter out hidden fields from initial data if not showing them
      const filteredData = filterFormData(JSON.parse(JSON.stringify(sampleData)));
      setFormData(filteredData);
    } else {
      setFormData(createDefaultData(buildHierarchy(fields)));
    }
  }, [fields, sampleData, formConfig]);

  // Filter form data based on visibility settings
  const filterFormData = (data) => {
    if (!formConfig || showHiddenFields) return data;

    const result = JSON.parse(JSON.stringify(data));

    // Remove hidden fields from the editable data
    for (const [fieldPath, config] of Object.entries(fieldsConfig)) {
      if (config.visibility === 'hidden') {
        // Don't remove from result - we'll handle display separately
      }
    }

    return result;
  };

  // Get visible fields (excluding hidden ones)
  const getVisibleFields = () => {
    if (!formConfig || showHiddenFields) return fields;

    return fields.filter(fieldPath => {
      const config = fieldsConfig[fieldPath];
      return !config || config.visibility !== 'hidden';
    });
  };

  // Separate fields into categories
  const categorizedFields = useMemo(() => {
    const categories = {
      editable: [],
      auto: [],
      readonly: [],
      hidden: []
    };

    fields.forEach(fieldPath => {
      const config = fieldsConfig[fieldPath];
      const visibility = config?.visibility || 'editable';
      categories[visibility]?.push(fieldPath) || categories.editable.push(fieldPath);
    });

    return categories;
  }, [fields, fieldsConfig]);

  const buildHierarchy = (fieldList) => {
    const hierarchy = {};

    if (!fieldList || fieldList.length === 0) return hierarchy;

    fieldList.forEach(fieldPath => {
      const parts = parsePath(fieldPath);
      let current = hierarchy;

      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;

        if (!current[part.key]) {
          current[part.key] = {
            name: part.key,
            type: part.isArray ? 'array' : (isLast ? 'string' : 'object'),
            children: {}
          };
          if (part.isArray) {
            current[part.key].itemSchema = { type: 'object', children: {} };
          }
        }

        if (part.isArray && !isLast) {
          current = current[part.key].itemSchema.children;
        } else if (!isLast) {
          current = current[part.key].children;
        }
      });
    });

    if (originalSampleData) {
      inferTypes(hierarchy, originalSampleData);
    }

    return hierarchy;
  };

  const inferTypes = (hierarchy, data, path = '') => {
    for (const [key, schema] of Object.entries(hierarchy)) {
      const value = getNestedValue(data, path ? `${path}.${key}` : key);

      if (schema.type === 'array' && Array.isArray(value) && value.length > 0) {
        const firstItem = value[0];
        if (typeof firstItem === 'object' && firstItem !== null) {
          inferTypes(schema.itemSchema.children, firstItem, '');
        } else {
          schema.itemSchema.type = typeof firstItem;
        }
      } else if (schema.type === 'object' && schema.children && Object.keys(schema.children).length > 0) {
        inferTypes(schema.children, data, path ? `${path}.${key}` : key);
      } else if (value !== undefined) {
        schema.type = typeof value;
      }
    }
  };

  const parsePath = (path) => {
    const parts = [];
    const regex = /([^.\[\]]+)(\[\])?/g;
    let match;

    while ((match = regex.exec(path)) !== null) {
      parts.push({
        key: match[1],
        isArray: !!match[2]
      });
    }

    return parts;
  };

  const getNestedValue = (obj, path) => {
    if (!obj || !path) return undefined;
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    return current;
  };

  const setNestedValue = (obj, path, value) => {
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
  };

  const createDefaultData = (hierarchy) => {
    const data = {};
    for (const [key, schema] of Object.entries(hierarchy)) {
      if (schema.type === 'array') {
        data[key] = [];
      } else if (schema.type === 'object' && schema.children && Object.keys(schema.children).length > 0) {
        data[key] = createDefaultData(schema.children);
      } else {
        data[key] = getDefaultValue(schema.type);
      }
    }
    return data;
  };

  const getDefaultValue = (type) => {
    switch (type) {
      case 'number': return 0;
      case 'boolean': return false;
      default: return '';
    }
  };

  const handleFieldChange = (path, value) => {
    setFormData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      setNestedValue(newData, path, value);
      return newData;
    });
  };

  const handleReset = () => {
    if (originalSampleData) {
      setFormData(filterFormData(JSON.parse(JSON.stringify(originalSampleData))));
    } else {
      setFormData(createDefaultData(buildHierarchy(fields)));
    }
  };

  const handleClear = () => {
    setFormData(createDefaultData(buildHierarchy(fields)));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const countFields = (schema) => {
    let count = 0;
    for (const [, fieldSchema] of Object.entries(schema)) {
      if (fieldSchema.type === 'array' || (fieldSchema.type === 'object' && fieldSchema.children && Object.keys(fieldSchema.children).length > 0)) {
        count += countFields(fieldSchema.children || (fieldSchema.itemSchema?.children || {}));
      } else {
        count++;
      }
    }
    return count;
  };

  // Check if a field should be visible based on formConfig and formSettings
  const isFieldVisible = (fieldPath) => {
    if (showHiddenFields) return true;

    // Check formSettings visibility first (admin-configured visibility)
    if (formSettings?.fields?.[fieldPath]?.visible === false) {
      return false;
    }

    // Then check formConfig visibility
    const config = fieldsConfig[fieldPath];
    if (!config) return true;
    if (config.visibility === 'hidden') return false;
    if (config.visibility === 'auto' && !showAutoFields) return false;
    if (config.visibility === 'readonly' && !showReadonlyFields) return false;
    return true;
  };

  const renderNestedFields = (schema, data, onFieldChange, basePath, sampleDataContext, depth = 0) => {
    return Object.entries(schema).map(([key, fieldSchema]) => {
      const currentPath = basePath ? `${basePath}.${key}` : key;
      const currentValue = data ? data[key] : undefined;
      const sampleValue = sampleDataContext ? sampleDataContext[key] : undefined;

      // Check visibility
      if (!isFieldVisible(currentPath)) {
        return null;
      }

      // Get field config
      const fieldConfig = fieldsConfig[currentPath];

      if (fieldSchema.type === 'array') {
        return (
          <FormArray
            key={currentPath}
            field={fieldSchema}
            items={currentValue || []}
            onChange={(_, value) => onFieldChange(key, value)}
            path={currentPath}
            renderNestedFields={(childSchema, childData, childOnChange, childBasePath, childSample) =>
              renderNestedFields(childSchema, childData, childOnChange, childBasePath, childSample, depth + 1)
            }
            sampleItems={sampleValue}
            fieldConfig={fieldConfig}
          />
        );
      }

      if (fieldSchema.type === 'object' && fieldSchema.children && Object.keys(fieldSchema.children).length > 0) {
        // Check if all children are hidden
        const childPaths = Object.keys(fieldSchema.children).map(k =>
          currentPath ? `${currentPath}.${k}` : k
        );
        const visibleChildren = childPaths.filter(p => isFieldVisible(p));

        if (visibleChildren.length === 0) {
          return null;
        }

        return (
          <FormSection
            key={currentPath}
            title={fieldConfig?.label || fieldSchema.name || key}
            fieldCount={visibleChildren.length}
            depth={depth}
          >
            {renderNestedFields(fieldSchema.children, currentValue || {}, (nestedKey, value) => {
              const nestedData = { ...(currentValue || {}), [nestedKey]: value };
              onFieldChange(key, nestedData);
            }, currentPath, sampleValue, depth + 1)}
          </FormSection>
        );
      }

      return (
        <FormField
          key={currentPath}
          field={fieldSchema}
          value={currentValue}
          onChange={(_, value) => onFieldChange(key, value)}
          path={currentPath}
          sampleValue={sampleValue}
          fieldConfig={fieldConfig}
          variableInfo={fieldVariables[currentPath]}
        />
      );
    }).filter(Boolean);
  };

  const renderForm = () => {
    const visibleFields = getVisibleFields();
    const hierarchy = buildHierarchy(visibleFields);
    return renderNestedFields(hierarchy, formData, (key, value) => {
      handleFieldChange(key, value);
    }, '', originalSampleData, 0);
  };

  // Count visible fields by category
  const fieldCounts = useMemo(() => ({
    editable: categorizedFields.editable.length,
    auto: categorizedFields.auto.length,
    readonly: categorizedFields.readonly.length,
    hidden: categorizedFields.hidden.length
  }), [categorizedFields]);

  return (
    <form className="dynamic-form" onSubmit={handleSubmit} noValidate>
      <div className="dynamic-form-toolbar">
        <div className="toolbar-left">
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPreview ? 'Hide JSON' : 'Show JSON'}
          </button>
          {fieldCounts.auto > 0 && (
            <button
              type="button"
              className={`btn btn-sm ${showAutoFields ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setShowAutoFields(!showAutoFields)}
              title={showAutoFields ? 'Hide auto-generated fields' : 'Show auto-generated fields'}
            >
              <Settings size={14} />
              Auto ({fieldCounts.auto})
            </button>
          )}
          {fieldCounts.readonly > 0 && (
            <button
              type="button"
              className={`btn btn-sm ${showReadonlyFields ? 'btn-secondary' : 'btn-ghost'}`}
              onClick={() => setShowReadonlyFields(!showReadonlyFields)}
              title={showReadonlyFields ? 'Hide read-only fields' : 'Show read-only fields'}
            >
              <Lock size={14} />
              Read-only ({fieldCounts.readonly})
            </button>
          )}
          {fieldCounts.hidden > 0 && (
            <button
              type="button"
              className={`btn btn-sm ${showHiddenFieldsState ? 'btn-warning' : 'btn-ghost'}`}
              onClick={() => setShowHiddenFieldsState(!showHiddenFieldsState)}
              title={showHiddenFieldsState ? 'Hide unmapped fields' : 'Show unmapped fields'}
            >
              {showHiddenFieldsState ? <Eye size={14} /> : <EyeOff size={14} />}
              Hidden ({fieldCounts.hidden})
            </button>
          )}
        </div>
        <div className="toolbar-right">
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={handleClear}
            title="Clear all fields"
          >
            <Trash2 size={14} />
            Clear
          </button>
          {originalSampleData && (
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={handleReset}
              title="Reset to sample data"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Field Summary - Clean Design */}
      {formConfig && (
        <div className="form-summary-clean">
          <div className="summary-stats">
            <div className="summary-stat editable">
              <span className="stat-value">{fieldCounts.editable}</span>
              <span className="stat-label">Editable</span>
            </div>
            {fieldCounts.auto > 0 && (
              <div className="summary-stat auto">
                <span className="stat-value">{fieldCounts.auto}</span>
                <span className="stat-label">Auto-generated</span>
              </div>
            )}
            {fieldCounts.readonly > 0 && (
              <div className="summary-stat readonly">
                <span className="stat-value">{fieldCounts.readonly}</span>
                <span className="stat-label">Read-only</span>
              </div>
            )}
            {fieldCounts.hidden > 0 && (
              <div className="summary-stat hidden">
                <span className="stat-value">{fieldCounts.hidden}</span>
                <span className="stat-label">Hidden</span>
              </div>
            )}
          </div>
        </div>
      )}

      {showPreview && (
        <div className="json-preview-panel">
          <pre>{JSON.stringify(formData, null, 2)}</pre>
        </div>
      )}

      <div className="dynamic-form-fields-clean">
        {renderForm()}
      </div>

      <div className="dynamic-form-actions">
        <button type="submit" className="btn btn-primary" disabled={disabled}>
          <Send size={16} />
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export default DynamicForm;
