/**
 * API route to set light color and brightness based on audio data
 * Called by the Next.js client when rainbow mode is on and audio data is available
 */

import { NextResponse } from "next/server";
import mqtt from "mqtt";

function getEnv(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
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

    // For Zigbee RGB lights, send color in hex format (RGB)
    // Some devices use XY color space; adjust as needed for your bulbs
    const colorHex = `#${color.toString(16).padStart(6, "0")}`;

    const payloadObj: Record<string, unknown> = {
      state: "ON",
      brightness: Math.max(1, Math.min(254, brightness)),
      color: {
        hex: colorHex,
      },
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
