import type { DeviceLocation, Settings } from '../shared/types';

export function requestLocationOnStartup(settings: Settings) {
  return (
    settings.useDeviceLocation &&
    (!settings.locationRequested || settings.locationPermission === 'granted')
  );
}

export function currentEnvironment(
  location = '',
  deviceLocation?: DeviceLocation,
  now = new Date(),
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
) {
  return {
    timeZone,
    localTime: new Intl.DateTimeFormat('en-GB', {
      timeZone,
      dateStyle: 'full',
      timeStyle: 'long',
    }).format(now),
    utcTime: now.toISOString(),
    location: deviceLocation
      ? {
          ...deviceLocation,
          source: 'device',
          measuredAt: new Date(deviceLocation.measuredAt).toISOString(),
        }
      : location.trim()
        ? { name: location.trim(), source: 'user' }
        : null,
  };
}

export function approximateLocation(position: any, now = Date.now()): DeviceLocation {
  const { latitude, longitude, accuracy, timestamp } = position || {};
  if (
    ![latitude, longitude, accuracy, timestamp].every(Number.isFinite) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180 ||
    accuracy < 0 ||
    timestamp < now - 300000 ||
    timestamp > now + 60000
  )
    throw new Error('The device did not return a recent valid location. Try again.');
  return {
    latitude: Math.round(latitude * 100) / 100,
    longitude: Math.round(longitude * 100) / 100,
    accuracyMetres: Math.ceil(Math.max(accuracy, 1500)),
    measuredAt: timestamp,
  };
}
