/**
 * WebSocket server that receives audio analysis data from Python daemon
 * and broadcasts it to connected clients (Next.js pages).
 * Run this server in a separate process while Next.js is running.
 */

import WebSocket, { WebSocketServer } from "ws";
import http from "http";

const PORT = 8766; // Different port from Python daemon

interface AudioData {
  bass: number;
  mids: number;
  treble: number;
  beat: boolean;
  total_energy: number;
  timestamp: number;
}

// Store the latest audio data
let latestAudioData: AudioData | null = null;

// Connected WebSocket clients
const clients = new Set<WebSocket>();

// Create HTTP server
const server = http.createServer();

// Create WebSocket server
const wss = new WebSocketServer({ server });

// WebSocket server receives connections from browser clients
wss.on("connection", (ws: WebSocket) => {
  console.log("Browser client connected");
  clients.add(ws);

  // Send latest audio data immediately if available
  if (latestAudioData) {
    ws.send(JSON.stringify(latestAudioData));
  }

  ws.on("close", () => {
    console.log("Browser client disconnected");
    clients.delete(ws);
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
    clients.delete(ws);
  });
});

// Create client WebSocket to connect to Python daemon
function connectToPythonDaemon() {
  const pythonWs = new WebSocket("ws://localhost:8765");

  pythonWs.on("open", () => {
    console.log("Connected to Python audio daemon");
  });

  pythonWs.on("message", (data: WebSocket.Data) => {
    try {
      const textData = data.toString();
      latestAudioData = JSON.parse(textData);

      // Broadcast to all connected browser clients as TEXT (not binary)
      const jsonString = JSON.stringify(latestAudioData);
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(jsonString);
        }
      });
    } catch (error) {
      console.error("Error processing audio data:", error);
    }
  });

  pythonWs.on("close", () => {
    console.log("Disconnected from Python daemon, reconnecting in 3 seconds...");
    setTimeout(connectToPythonDaemon, 3000);
  });

  pythonWs.on("error", (error) => {
    console.error("Python daemon connection error:", error);
  });
}

// Start listening for browser clients (on all interfaces so Pi can connect)
server.listen(PORT, "0.0.0.0", () => {
  console.log(`WebSocket server running on ws://0.0.0.0:${PORT} (accessible from network)`);
  console.log("Attempting to connect to Python audio daemon on ws://localhost:8765...");

  // Try to connect to Python daemon
  connectToPythonDaemon();
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down WebSocket server...");
  server.close(() => {
    process.exit(0);
  });
});
