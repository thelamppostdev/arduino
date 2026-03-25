const API_BASE = '/api';

export async function sendRingCommand(color: string, animation?: string) {
  const res = await fetch(`${API_BASE}/ring`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ color, animation }),
  });
  return res.json();
}

export async function getStatus() {
  const res = await fetch(`${API_BASE}/status`);
  return res.json();
}

export function connectWs(onMessage: (data: any) => void): WebSocket {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${protocol}//${location.host}/ws`);

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      onMessage(msg);
    } catch {
      // ignore
    }
  };

  ws.onclose = () => {
    // Reconnect after 2 seconds
    setTimeout(() => connectWs(onMessage), 2000);
  };

  return ws;
}
