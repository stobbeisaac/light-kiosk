/**
 * API route to set light color and brightness based on audio data
 * For Philips Hue: Uses HSV (Hue, Saturation, Value/Brightness)
 */

import { NextResponse } from "next/server";
import mqtt from "mqtt";

function getEnv(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

/**
 * Convert RGB to HSV
 * Returns { hue: 0-65535, saturation: 0-254, brightness: 0-254 }
 * Philips Hue uses 0-65535 for hue (full circle)
 */
function rgbToHsv(r: number, g: number, b: number) {
  r = (r & 0xFF) / 255;
  g = (g & 0xFF) / 255;
  b = (b & 0xFF) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let hue = 0;
  if (delta !== 0) {
    if (max === r) {
      hue = 60 * (((g - b) / delta) % 6);
    } else if (max === g) {
      hue = 60 * ((b - r) / delta + 2);
    } else {
      hue = 60 * ((r - g) / delta + 4);
    }
  }

  if (hue < 0) hue += 360;

  const saturation = max === 0 ? 0 : (delta / max) * 254;
  const brightness = max * 254;

  // Convert hue from 0-360 to 0-65535 (Philips Hue format)
  const hueHue = Math.round((hue / 360) * 65535);

  return {
    hue: hueHue,
    saturation: Math.round(saturation),
    brightness: Math.round(brightness),
  };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const color: number = body.color ?? 0xff0000; // RGB color as 24-bit hex
    const brightness: number = body.brightness ?? 254;

    const brokerUrl = getEnv("MQTT_URL", "mqtt://localhost:1883");
    const username = process.env.MQTT_USERNAME;
    const password = process.env.MQTT_PASSWORD;
    const prefix = getEnv("Z2M_TOPIC_PREFIX", "zigbee2mqtt");
    const { id } = await params;
    const device = id;

    const client = mqtt.connect(brokerUrl, {
      username,
      password,
      reconnectPeriod: 0,
    });

    await new Promise<void>((resolve, reject) => {
      const connectTimeout = setTimeout(() => {
        client.end(true);
        reject(new Error("MQTT connection timeout"));
      }, 5000);

      client.once("connect", () => {
        clearTimeout(connectTimeout);
        resolve();
      });
      client.once("error", (err) => {
        clearTimeout(connectTimeout);
        client.end(true);
        reject(err);
      });
    });

    const topic = `${prefix}/${device}/set`;

    // Extract RGB and convert to HSV for Philips Hue
    const r = (color >> 16) & 0xFF;
    const g = (color >> 8) & 0xFF;
    const b = color & 0xFF;
    const { hue } = rgbToHsv(r, g, b);

    const payloadObj: Record<string, unknown> = {
      state: "ON",
      brightness: Math.max(1, Math.min(254, brightness)),
      hue: hue,
    };

    const payload = JSON.stringify(payloadObj);

    await new Promise<void>((resolve, reject) => {
      client.publish(topic, payload, (err) => {
        if (err) {
          client.end(true);
          reject(err);
        } else {
          client.end(() => {
            resolve();
          });
        }
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
