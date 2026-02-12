import React, { useState, useEffect } from 'react';
import { X, Save, Eye, EyeOff, RefreshCw, Globe, FileJson } from 'lucide-react';

function FormSettingsModal({ isOpen, onClose, apiSampleId, apiSampleName, settings, onSave, fields = [] }) {
  const [localSettings, setLocalSettings] = useState({
    sections: {
      headers: { visible: true, defaultValues: {} }
    },
    fields: {}
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && settings) {
      setLocalSettings({
        sections: settings.sections || { headers: { visible: true, defaultValues: {} } },
        fields: settings.fields || {}
      });
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSectionToggle = (sectionName) => {
    setLocalSettings(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionName]: {
          ...prev.sections[sectionName],
          visible: !prev.sections[sectionName]?.visible
        }
      }
    }));
  };

  const handleFieldToggle = (fieldPath) => {
    setLocalSettings(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldPath]: {
          ...prev.fields[fieldPath],
          visible: prev.fields[fieldPath]?.visible !== false ? false : true
        }
      }
    }));
  };

  const isFieldVisible = (fieldPath) => {
    return localSettings.fields[fieldPath]?.visible !== false;
  };

  const isSectionVisible = (sectionName) => {
    return localSettings.sections[sectionName]?.visible !== false;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(localSettings);
      onClose();
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setLocalSettings({
      sections: {
        headers: { visible: true, defaultValues: {} }
      },
      fields: {}
    });
  };

  // Convert field path to label
  const pathToLabel = (path) => {
    const lastPart = path.split('.').pop().replace(/\[\]/g, '');
    return lastPart
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  // Group fields by their parent section
  // fields is an array of strings (field paths)
  const groupedFields = {};
  fields.forEach(fieldPath => {
    const path = typeof fieldPath === 'string' ? fieldPath : fieldPath.path || fieldPath;
    const parts = path.split('.');
    const section = parts.length > 1 ? parts[0] : 'root';
    if (!groupedFields[section]) {
      groupedFields[section] = [];
    }
    groupedFields[section].push({
      path: path,
      label: pathToLabel(path)
    });
  });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="form-settings-modal">
        <div className="modal-header">
          <h2>Form Settings</h2>
          <span className="modal-subtitle">{apiSampleName}</span>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p className="settings-description">
            Configure which sections and fields are visible to users. Hidden sections/fields will still be included in form submissions with their default or current values.
          </p>

          {/* Sections */}
          <div className="settings-section">
            <h3>
              <Globe size={16} />
              Sections
            </h3>
            <div className="settings-list">
              <div className="settings-item">
                <div className="item-info">
                  <span className="item-name">Headers</span>
                  <span className="item-description">HTTP headers for API requests</span>
                </div>
                <button
                  className={`visibility-toggle ${isSectionVisible('headers') ? 'visible' : 'hidden'}`}
                  onClick={() => handleSectionToggle('headers')}
                  title={isSectionVisible('headers') ? 'Click to hide' : 'Click to show'}
                >
                  {isSectionVisible('headers') ? (
                    <>
                      <Eye size={16} />
                      <span>Visible</span>
                    </>
                  ) : (
                    <>
                      <EyeOff size={16} />
                      <span>Hidden</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Body Fields */}
          <div className="settings-section">
            <h3>
              <FileJson size={16} />
              Body Fields
            </h3>
            {Object.keys(groupedFields).length > 0 ? (
              <div className="settings-list">
                {Object.entries(groupedFields).map(([section, sectionFields]) => (
                  <div key={section} className="field-group">
                    {section !== 'root' && (
                      <div className="field-group-header">{section}</div>
                    )}
                    {sectionFields.map(field => (
                      <div key={field.path} className="settings-item">
                        <div className="item-info">
                          <span className="item-name">{field.label || field.path}</span>
                          <span className="item-path">{field.path}</span>
                        </div>
                        <button
                          className={`visibility-toggle ${isFieldVisible(field.path) ? 'visible' : 'hidden'}`}
                          onClick={() => handleFieldToggle(field.path)}
                          title={isFieldVisible(field.path) ? 'Click to hide' : 'Click to show'}
                        >
                          {isFieldVisible(field.path) ? (
                            <>
                              <Eye size={16} />
                              <span>Visible</span>
                            </>
                          ) : (
                            <>
                              <EyeOff size={16} />
                              <span>Hidden</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-fields-message">No body fields available to configure.</p>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleReset}>
            <RefreshCw size={16} />
            Reset to Default
          </button>
          <div className="footer-actions">
            <button className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        <style>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 1rem;
          }

          .form-settings-modal {
            background: var(--card-bg);
            border-radius: 0.75rem;
            width: 90%;
            max-width: 600px;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          }

          .form-settings-modal .modal-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid var(--border-color);
          }

          .form-settings-modal .modal-header h2 {
            margin: 0;
            font-size: 1.25rem;
          }

          .form-settings-modal .modal-subtitle {
            color: var(--text-secondary);
            font-size: 0.875rem;
            flex: 1;
          }

          .form-settings-modal .close-btn {
            background: none;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            padding: 0.5rem;
            display: flex;
            border-radius: 0.375rem;
            transition: all 0.2s;
          }

          .form-settings-modal .close-btn:hover {
            background: var(--bg-color);
            color: var(--text-primary);
          }

          .form-settings-modal .modal-body {
            flex: 1;
            overflow-y: auto;
            padding: 1.5rem;
          }

          .form-settings-modal .settings-description {
            color: var(--text-secondary);
            font-size: 0.875rem;
            margin: 0 0 1.5rem;
            padding: 0.75rem 1rem;
            background: var(--bg-color);
            border-radius: 0.5rem;
            border-left: 3px solid var(--primary-color);
          }

          .form-settings-modal .settings-section {
            margin-bottom: 1.5rem;
          }

          .form-settings-modal .settings-section h3 {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--text-primary);
            margin: 0 0 0.75rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid var(--border-color);
          }

          .form-settings-modal .settings-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .form-settings-modal .settings-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.75rem 1rem;
            background: var(--bg-color);
            border-radius: 0.5rem;
            border: 1px solid var(--border-color);
          }

          .form-settings-modal .item-info {
            display: flex;
            flex-direction: column;
            gap: 0.125rem;
          }

          .form-settings-modal .item-name {
            font-weight: 500;
            color: var(--text-primary);
            font-size: 0.875rem;
          }

          .form-settings-modal .item-description,
          .form-settings-modal .item-path {
            font-size: 0.75rem;
            color: var(--text-secondary);
          }

          .form-settings-modal .visibility-toggle {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            padding: 0.375rem 0.75rem;
            border-radius: 1rem;
            border: none;
            cursor: pointer;
            font-size: 0.75rem;
            font-weight: 500;
            transition: all 0.2s;
          }

          .form-settings-modal .visibility-toggle.visible {
            background: rgba(34, 197, 94, 0.1);
            color: var(--success-color);
          }

          .form-settings-modal .visibility-toggle.visible:hover {
            background: rgba(34, 197, 94, 0.2);
          }

          .form-settings-modal .visibility-toggle.hidden {
            background: rgba(239, 68, 68, 0.1);
            color: var(--error-color);
          }

          .form-settings-modal .visibility-toggle.hidden:hover {
            background: rgba(239, 68, 68, 0.2);
          }

          .form-settings-modal .field-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .form-settings-modal .field-group-header {
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-top: 0.5rem;
            padding-left: 0.25rem;
          }

          .form-settings-modal .no-fields-message {
            color: var(--text-secondary);
            font-size: 0.875rem;
            text-align: center;
            padding: 1rem;
            background: var(--bg-color);
            border-radius: 0.5rem;
          }

          .form-settings-modal .modal-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem 1.5rem;
            border-top: 1px solid var(--border-color);
            background: var(--bg-color);
          }

          .form-settings-modal .footer-actions {
            display: flex;
            gap: 0.75rem;
          }
        `}</style>
      </div>
    </div>
  );
}

export default FormSettingsModal;
