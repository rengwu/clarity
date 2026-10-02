import React, { useId } from 'react';
import { Icon } from '../icons';

export function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="setting-row">
      <div className="setting-copy">
        <span className="setting-title">{title}</span>
        {description && <div className="setting-description">{description}</div>}
      </div>
      <div className="setting-control">{children}</div>
    </div>
  );
}

export function SettingToggle({
  label,
  description,
  icon,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description?: string;
  icon?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  const descriptionId = useId();
  return (
    <label className="setting-row setting-toggle">
      {icon && <Icon name={icon} size={16} />}
      <span className="setting-copy">
        <span className="setting-title">{label}</span>
        {description && (
          <span className="setting-description" id={descriptionId}>
            {description}
          </span>
        )}
      </span>
      <input
        className="settings-switch"
        type="checkbox"
        aria-label={label}
        aria-describedby={description ? descriptionId : undefined}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
