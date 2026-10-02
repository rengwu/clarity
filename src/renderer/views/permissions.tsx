import React, { useEffect, useState } from 'react';
import { call, useApp, useResource, Field, ErrorText } from '../api';
import type { Settings } from '../../shared/types';
import { SettingRow, SettingToggle } from './settings-controls';

export function Permissions() {
  const app = useApp();
  const settings: Settings = app.bootstrap.settings;
  const [location, setLocation] = useState(settings.location);
  const [useDeviceLocation, setUseDeviceLocation] = useState(settings.useDeviceLocation);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const sites = useResource<{ id: string; title: string; origins: string[] }[]>(
    () => call('permissions.sites'),
    [],
    'actions',
  );
  useEffect(() => setLocation(settings.location), [settings.location]);
  useEffect(() => setUseDeviceLocation(settings.useDeviceLocation), [settings]);
  const locating = app.bootstrap.locating || busy === 'location.request';
  async function change(method: string, args?: any) {
    setBusy(method);
    setError('');
    try {
      await call(method, args);
    } catch (failure: any) {
      setError(failure.message);
    } finally {
      await app.refresh().catch(app.error);
      setBusy('');
    }
  }
  return (
    <section aria-labelledby="permissions-heading">
      <h2 id="permissions-heading">Permissions</h2>
      <ErrorText>{error || sites.error}</ErrorText>
      <h3 className="settings-group-heading">Location</h3>
      <div className="settings-group">
        <SettingRow title="Timezone" description="From your device.">
          <span className="settings-value">{app.bootstrap.timeZone}</span>
        </SettingRow>
        {app.bootstrap.deviceLocationAvailable && (
          <>
            <SettingToggle
              label="Use device location"
              description="Share an approximate location with your AI provider in chats and automations. Checked at startup or when you refresh."
              checked={useDeviceLocation}
              disabled={locating ? !useDeviceLocation : !!busy}
              onChange={(checked) => {
                setUseDeviceLocation(checked);
                void change(
                  checked ? 'location.request' : 'settings.save',
                  checked ? undefined : { useDeviceLocation: false },
                );
              }}
            />
            <div className="settings-detail">
              <p role="status">
                {locating
                  ? 'Requesting location…'
                  : settings.locationPermission === 'granted'
                    ? 'Last request: allowed'
                    : settings.locationPermission === 'denied'
                      ? 'Last request: denied'
                      : settings.locationRequested
                        ? 'No location received'
                        : 'Not requested yet'}
              </p>
              {settings.deviceLocation && (
                <p>
                  Last reading: {settings.deviceLocation.latitude.toFixed(2)},{' '}
                  {settings.deviceLocation.longitude.toFixed(2)}
                  {' · '}
                  {new Date(settings.deviceLocation.measuredAt).toLocaleString()}
                </p>
              )}
              <ErrorText>
                {settings.locationError !== error ? settings.locationError : ''}
              </ErrorText>
              <div className="row">
                <button
                  disabled={!!busy || locating}
                  onClick={() => void change('location.request')}
                >
                  {settings.useDeviceLocation ? 'Refresh location' : 'Enable device location'}
                </button>
                <button
                  onClick={() => void call('permissions.openLocationSettings').catch(app.error)}
                >
                  Open macOS Location Settings
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <form
        className="settings-form settings-group"
        onSubmit={(event) => {
          event.preventDefault();
          void change('settings.save', { location });
        }}
      >
        <Field label="Manual location (optional)">
          <input
            value={location}
            maxLength={200}
            placeholder="City, country"
            onChange={(event) => setLocation(event.target.value)}
          />
        </Field>
        <p className="muted">Used instead of device location. Shared with your AI provider.</p>
        <button disabled={!!busy || locating || location.trim() === settings.location}>
          Save location
        </button>
      </form>
      <h3 className="settings-group-heading website-permissions-heading">Websites</h3>
      <p className="muted">Access is granted per chat. Revoking closes that chat’s browser page.</p>
      {settings.autoApproveActions.includes('browser.authorize') && (
        <p>
          Automatic website access is enabled under Agent approvals; agents can grant access again.
        </p>
      )}
      {!sites.loading && !sites.data?.length && (
        <div className="settings-empty">No website access granted.</div>
      )}
      {sites.data?.map((chat) => (
        <div className="settings-group website-grants" key={chat.id}>
          <h4 className="settings-group-heading">{chat.title}</h4>
          {chat.origins.map((origin) => (
            <div className="permission-site setting-row" key={origin}>
              <span className="spacer">{origin}</span>
              <button
                disabled={!!busy}
                aria-label={`Revoke ${origin} in ${chat.title}`}
                onClick={() =>
                  void change('permissions.revokeSite', {
                    chatId: chat.id,
                    origin,
                  })
                }
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}
