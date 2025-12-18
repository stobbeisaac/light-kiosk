import { NextResponse } from "next/server";
import mqtt from "mqtt";

function getEnv(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log("[API] Rainbow toggle - starting");
    const body = await req.json();
    const enabled: boolean = !!body.enabled;
    let speedRaw = body.speed;
    const speed: number | undefined =
      speedRaw !== undefined && Number.isFinite(Number(speedRaw))
        ? Number(speedRaw)
        : undefined;
    console.log("[API] Body:", body, "Enabled:", enabled);

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
        client.end(true);
        reject(new Error("MQTT connection timeout"));
      }, 5000);

      client.once("connect", () => {
        clearTimeout(connectTimeout);
        console.log("[API] MQTT connected!");
        resolve();
      });
      client.once("error", (err) => {
        clearTimeout(connectTimeout);
        console.log("[API] MQTT connection error:", err);
        client.end(true);
        reject(err);
      });
    });

    const topic = `${prefix}/${device}/set`;
    // For Hue/Zigbee2MQTT, 'effect: "colorloop"' enables rainbow; 'effect: "none"' stops it.
    // Some devices support a non-standard 'color_loop' speed. We include it when provided.
    const payloadObj: Record<string, unknown> = enabled
      ? { state: "ON", effect: "colorloop" }
      : { state: "ON", effect: "none" };
    if (enabled && speed !== undefined) {
      (payloadObj as any).color_loop = { speed };
    }

    // When disabling rainbow, set a neutral white color temp if supported
    if (!enabled) {
      const neutralCt = Number(process.env.RAINBOW_NEUTRAL_CT ?? 370); // mireds; ~2700K-3000K
      (payloadObj as any).color_temp = neutralCt;
      const neutralBriRaw = process.env.RAINBOW_NEUTRAL_BRI;
      if (neutralBriRaw !== undefined && Number.isFinite(Number(neutralBriRaw))) {
        (payloadObj as any).brightness = Number(neutralBriRaw);
      }
    }
    const payload = JSON.stringify(payloadObj);
    console.log("[API] Publishing to topic:", topic, "Payload:", payload);

    await new Promise<void>((resolve, reject) => {
      client.publish(topic, payload, (err) => {
        if (err) {
          console.log("[API] Publish error:", err);
          client.end(true);
          reject(err);
        } else {
          console.log("[API] Publish complete");
          client.end(() => {
            console.log("[API] MQTT disconnected");
            resolve();
          });
        }
      });
    });

    return NextResponse.json({ ok: true, topic, payload });
  } catch (e) {
    console.log("[API] Error:", (e as Error).message);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}