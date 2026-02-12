import React, { useState } from 'react';
import { ChevronDown, ChevronRight, User, MapPin, CreditCard, Building, FileText, Settings, Package, Info } from 'lucide-react';

// Convert technical section names to human-readable titles
function humanizeSectionTitle(title) {
  if (!title) return '';

  return title
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

// Get appropriate icon based on section name
function getSectionIcon(title) {
  const name = title.toLowerCase();

  if (name.includes('personal') || name.includes('customer') || name.includes('user') || name.includes('contact')) {
    return User;
  }
  if (name.includes('address') || name.includes('location')) {
    return MapPin;
  }
  if (name.includes('account') || name.includes('payment') || name.includes('card') || name.includes('bank')) {
    return CreditCard;
  }
  if (name.includes('company') || name.includes('organization') || name.includes('business')) {
    return Building;
  }
  if (name.includes('document') || name.includes('file') || name.includes('form')) {
    return FileText;
  }
  if (name.includes('setting') || name.includes('config') || name.includes('preference')) {
    return Settings;
  }
  if (name.includes('product') || name.includes('item') || name.includes('order')) {
    return Package;
  }
  return Info;
}

function FormSection({ title, children, defaultOpen = false, fieldCount = 0, depth = 0 }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const humanizedTitle = humanizeSectionTitle(title);
  const SectionIcon = getSectionIcon(title);
  const depthClass = `depth-${Math.min(depth, 3)}`;

  return (
    <div className={`form-section-clean ${depthClass}`}>
      <div
        className="section-header-clean"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="section-header-left-clean">
          <div className="section-icon-wrapper">
            <SectionIcon size={14} />
          </div>
          <span className="section-title-clean">{humanizedTitle}</span>
        </div>
        <div className="section-header-right-clean">
          {fieldCount > 0 && (
            <span className="section-field-count">{fieldCount} fields</span>
          )}
          <span className="section-chevron">
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        </div>
      </div>
      {isOpen && (
        <div className="section-content-clean">
          <div className="section-fields-grid">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export default FormSection;
