import React, { useState } from 'react';
import { Plus, Trash2, List, Copy, AlertCircle } from 'lucide-react';
import FormField from './FormField';
import FormSection from './FormSection';

// Convert technical field names to human-readable labels
function humanizeFieldName(name) {
  if (!name) return '';
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/([0-9]+)/g, ' $1')
    .replace(/\bId\b/gi, 'ID')
    .replace(/\bUrl\b/gi, 'URL')
    .replace(/\bApi\b/gi, 'API')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

function FormArray({ field, items, onChange, path, renderNestedFields, sampleItems, fieldConfig }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const createDefaultItem = (itemSchema) => {
    if (!itemSchema || !itemSchema.children) {
      return getDefaultValue(itemSchema?.type || 'string');
    }

    const item = {};
    for (const [key, childSchema] of Object.entries(itemSchema.children)) {
      if (childSchema.type === 'object' && childSchema.children) {
        item[key] = createDefaultItem(childSchema);
      } else if (childSchema.type === 'array') {
        item[key] = [];
      } else {
        item[key] = getDefaultValue(childSchema.type);
      }
    }
    return item;
  };

  const getDefaultValue = (type) => {
    switch (type) {
      case 'number': return 0;
      case 'boolean': return false;
      default: return '';
    }
  };

  const handleAddItem = () => {
    const newItem = createDefaultItem(field.itemSchema);
    const newItems = [...(items || []), newItem];
    onChange(path, newItems);
  };

  const handleDuplicateItem = (index) => {
    const itemToDuplicate = JSON.parse(JSON.stringify(items[index]));
    const newItems = [...items];
    newItems.splice(index + 1, 0, itemToDuplicate);
    onChange(path, newItems);
  };

  const handleRemoveItem = (index) => {
    if (showDeleteConfirm === index) {
      const newItems = items.filter((_, i) => i !== index);
      onChange(path, newItems);
      setShowDeleteConfirm(null);
    } else {
      setShowDeleteConfirm(index);
      setTimeout(() => setShowDeleteConfirm(null), 3000);
    }
  };

  const handleItemChange = (index, itemPath, value) => {
    const newItems = [...items];
    if (itemPath) {
      setNestedValue(newItems[index], itemPath, value);
    } else {
      newItems[index] = value;
    }
    onChange(path, [...newItems]);
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

  const getSampleItem = (index) => {
    if (sampleItems && Array.isArray(sampleItems) && sampleItems[index]) {
      return sampleItems[index];
    }
    if (sampleItems && Array.isArray(sampleItems) && sampleItems[0]) {
      return sampleItems[0];
    }
    return null;
  };

  const renderArrayItem = (item, index) => {
    const itemPath = `${path}[${index}]`;
    const sampleItem = getSampleItem(index);

    if (!field.itemSchema || !field.itemSchema.children) {
      return (
        <FormField
          field={{ type: field.itemSchema?.type || 'string', name: `Item ${index + 1}` }}
          value={item}
          onChange={(_, val) => handleItemChange(index, null, val)}
          path={itemPath}
          sampleValue={sampleItem}
        />
      );
    }

    return renderNestedFields(field.itemSchema.children, item, (nestedPath, value) => {
      handleItemChange(index, nestedPath, value);
    }, '', sampleItem);
  };

  const rawFieldName = field.name || path.split('.').pop().replace(/\[\]/g, '');
  const configLabel = fieldConfig?.label;
  const fieldName = configLabel || humanizeFieldName(rawFieldName);

  return (
    <div className="form-array-clean">
      <div className="array-header-clean">
        <div className="array-header-left-clean">
          <div className="array-icon-wrapper">
            <List size={16} />
          </div>
          <span className="array-title-clean">{fieldName}</span>
        </div>
        <div className="array-header-right-clean">
          <span className="array-count-badge">{(items || []).length} items</span>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={handleAddItem}
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </div>

      <div className="array-items-clean">
        {(items || []).map((item, index) => (
          <div key={index} className={`array-item-clean ${showDeleteConfirm === index ? 'confirm-delete' : ''}`}>
            <div className="array-item-header-clean">
              <div className="item-header-left-clean">
                <span className="item-number">{index + 1}</span>
                <span className="item-label-clean">{fieldName} #{index + 1}</span>
              </div>
              <div className="item-actions-clean">
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => handleDuplicateItem(index)}
                  title="Duplicate"
                >
                  <Copy size={14} />
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${showDeleteConfirm === index ? 'btn-danger' : 'btn-ghost btn-danger-hover'}`}
                  onClick={() => handleRemoveItem(index)}
                  title={showDeleteConfirm === index ? 'Click again to confirm' : 'Remove'}
                >
                  {showDeleteConfirm === index ? (
                    <>
                      <AlertCircle size={14} />
                      Confirm
                    </>
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            </div>
            <div className="array-item-content-clean">
              <div className="array-item-fields-grid">
                {renderArrayItem(item, index)}
              </div>
            </div>
          </div>
        ))}

        {(!items || items.length === 0) && (
          <div className="array-empty-clean">
            <List size={28} className="empty-icon" />
            <p>No {fieldName.toLowerCase()} added yet</p>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={handleAddItem}
            >
              <Plus size={14} />
              Add First {fieldName}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default FormArray;
