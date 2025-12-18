/**
 * Audio-to-color mapping utilities
 * Converts frequency bin data (bass, mids, treble) and beat detection to RGB colors
 */

export interface AudioData {
  bass: number; // 0-255
  mids: number; // 0-255
  treble: number; // 0-255
  beat: boolean;
  total_energy: number;
  timestamp: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Convert frequency data to RGB color
 * Bass (low freq) → Red, Mids (mid freq) → Green, Treble (high freq) → Blue
 */
export function audioToRGB(audio: AudioData): RGB {
  return {
    r: audio.bass,
    g: audio.mids,
    b: audio.treble,
  };
}

/**
 * Convert RGB to Zigbee hex color (0-65535 range, actually xy format for Philips Hue)
 * For Zigbee2MQTT, we might just use standard RGB or specific color formats
 * This returns a simple RGB hex for now
 */
export function rgbToHex(rgb: RGB): string {
  const r = Math.round(rgb.r).toString(16).padStart(2, "0");
  const g = Math.round(rgb.g).toString(16).padStart(2, "0");
  const b = Math.round(rgb.b).toString(16).padStart(2, "0");
  return `0x${r}${g}${b}`;
}

/**
 * Convert RGB to Zigbee color format (assumes 16-bit format used by some bulbs)
 * Could also be converted to XY format for more accurate Philips Hue bulbs
 */
export function rgbToZigbeeColor(rgb: RGB): number {
  const r = Math.round(rgb.r) & 0xff;
  const g = Math.round(rgb.g) & 0xff;
  const b = Math.round(rgb.b) & 0xff;
  // Common 16-bit RGB565 format: RRRRRGGGGGGBBBBB
  return ((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3);
}

/**
 * Calculate overall brightness from audio energy
 * Uses beat spike to enhance brightness on beat detection
 */
export function getAudioBrightness(audio: AudioData, beakMultiplier: number = 1.5): number {
  // Average of all frequency bands for overall brightness
  const avgFreq = (audio.bass + audio.mids + audio.treble) / 3;

  // If beat detected, multiply brightness for a spike effect
  const multiplier = audio.beat ? beakMultiplier : 1;

  return Math.min(254, Math.round((avgFreq / 255) * 254 * multiplier));
}

/**
 * Smooth audio data using exponential moving average
 * Reduces flickering from rapid frequency changes
 */
export function smoothAudio(current: AudioData, previous: AudioData | null, alpha: number = 0.3): AudioData {
  if (!previous) return current;

  return {
    bass: Math.round(current.bass * alpha + previous.bass * (1 - alpha)),
    mids: Math.round(current.mids * alpha + previous.mids * (1 - alpha)),
    treble: Math.round(current.treble * alpha + previous.treble * (1 - alpha)),
    beat: current.beat,
    total_energy: current.total_energy * alpha + previous.total_energy * (1 - alpha),
    timestamp: current.timestamp,
  };
}

/**
 * Create a color "preset" based on audio frequency dominance
 * Useful for more varied color effects beyond simple RGB
 */
export function frequencyToHue(audio: AudioData): number {
  const maxFreq = Math.max(audio.bass, audio.mids, audio.treble);

  if (maxFreq === 0) return 0;

  // Determine hue based on dominant frequency
  // 0° = Red (bass), 120° = Green (mids), 240° = Blue (treble)
  if (audio.bass === maxFreq) {
    return 0; // Red
  } else if (audio.mids === maxFreq) {
    return 120; // Green
  } else {
    return 240; // Blue
  }
}

/**
 * Convert HSV to RGB
 * Useful for creating smooth color transitions based on audio
 */
export function hsvToRGB(h: number, s: number, v: number): RGB {
  s = s / 100;
  v = v / 100;

  const c = v * s;
  const x = c * (1 - ((h / 60) % 2 - 1));
  const m = v - c;

  let r = 0,
    g = 0,
    b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
  } else if (h >= 120 && h < 180) {
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}
