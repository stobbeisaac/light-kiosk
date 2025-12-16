import { NextResponse } from "next/server";
import mqtt from "mqtt";

function getEnv(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    let bri: number = Number(body.brightness ?? 0);
    if (!Number.isFinite(bri)) bri = 0;
    bri = Math.max(0, Math.min(254, bri));

    const brokerUrl = getEnv("MQTT_URL", "mqtt://localhost:1883");
    const username = process.env.MQTT_USERNAME;
    const password = process.env.MQTT_PASSWORD;
    const prefix = getEnv("Z2M_TOPIC_PREFIX", "zigbee2mqtt");
    const device = params.id;

    const client = mqtt.connect(brokerUrl, {
      username,
      password,
      reconnectPeriod: 0,
    });

    await new Promise<void>((resolve, reject) => {
      client.once("connect", () => resolve());
      client.once("error", (err) => reject(err));
    });

    const topic = `${prefix}/${device}/set`;
    const payload = JSON.stringify({ brightness: bri });
    client.publish(topic, payload);

    client.end(true);

    return NextResponse.json({ ok: true, topic, payload });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
