export type ReplayGain = {
  trackGain?: number;
  albumGain?: number;
  trackPeak?: number;
  albumPeak?: number;
  baseGain?: number;
};

export function readReplayGain(value: any): ReplayGain | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const result: ReplayGain = {};
  for (const key of ['trackGain', 'albumGain', 'baseGain'] as const) {
    if (typeof value[key] === 'number' && Number.isFinite(value[key]) && Math.abs(value[key]) <= 60)
      result[key] = value[key];
  }
  for (const key of ['trackPeak', 'albumPeak'] as const) {
    if (typeof value[key] === 'number' && Number.isFinite(value[key]) && value[key] > 0)
      result[key] = value[key];
  }
  return Object.keys(result).length ? result : undefined;
}

export function volumeGain(volume: number): number {
  if (!Number.isFinite(volume) || volume <= 0) return 0;
  // Match librespot's 16-bit control and explicit 60 dB logarithmic curve.
  const position = Math.floor((Math.min(volume, 100) / 100) * 65535) / 65535;
  if (position === 0) return 0;
  return 10 ** (3 * (position - 1));
}

export function normalizationGain(data: ReplayGain | undefined, album: boolean): number {
  const gain = album ? data?.albumGain : data?.trackGain;
  if (gain === undefined) return 1;
  const peak = album ? data?.albumPeak : data?.trackPeak;
  const base = data?.baseGain || 0;
  // Standard ReplayGain 2 uses -18 LUFS; Spotify's supplied gains target -14.
  // Codec output gain is already applied by the decoder.
  const factor = 10 ** ((gain + 4 - base) / 20);
  const decodedPeak = peak === undefined ? 1 : peak * 10 ** (base / 20);
  return Math.min(1, factor, 1 / decodedPeak);
}
