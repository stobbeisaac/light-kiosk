import { NextResponse } from "next/server";
import mqtt from "mqtt";

function getEnv(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log("[API] Brightness change - starting");
    const body = await req.json();
    let bri: number = Number(body.brightness ?? 0);
    if (!Number.isFinite(bri)) bri = 0;
    bri = Math.max(0, Math.min(254, bri));
    console.log("[API] Brightness:", bri);

    const brokerUrl = getEnv("MQTT_URL", "mqtt://localhost:1883");
    const username = process.env.MQTT_USERNAME;
    const password = process.env.MQTT_PASSWORD;
    const prefix = getEnv("Z2M_TOPIC_PREFIX", "zigbee2mqtt");
    const { id } = await params;
    const device = id;
    console.log("[API] Broker URL:", brokerUrl, "Device:", device, "Prefix:", prefix);

    const client = mqtt.connect(brokerUrl, {
      username,
      password,
      reconnectPeriod: 0,
    });

    await new Promise<void>((resolve, reject) => {
      const connectTimeout = setTimeout(() => {
        console.log("[API] Connection timeout");
        reject(new Error("MQTT connection timeout"));
      }, 5000);

      client.once("connect", () => {
        clearTimeout(connectTimeout);
        console.log("[API] MQTT connected!");
        resolve();
      });
      client.once("error", (err) => {
        clearTimeout(connectTimeout);
        console.log("[API] MQTT error:", err);
        reject(err);
      });
    });

    const topic = `${prefix}/${device}/set`;
    const payload = JSON.stringify({ brightness: bri });
    console.log("[API] Publishing to topic:", topic, "Payload:", payload);
    client.publish(topic, payload);
    console.log("[API] Publish complete");

    client.end(true);

    return NextResponse.json({ ok: true, topic, payload });
  } catch (e) {
    console.log("[API] Error:", (e as Error).message);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
