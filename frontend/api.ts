const API_BASE = "http://localhost:8000"

export async function getPorts(): Promise<string[]> {
  const response = await fetch(`${API_BASE}/ports`)
  if (!response.ok) {
    throw new Error("Failed to fetch ports");
  }

  const data = await response.json();
  return data.ports;
}

export async function getStatus() {
  const response = await fetch(`${API_BASE}/status`)
  if (!response.ok) throw new Error("Failed to fetch status")
  return response.json()
}

export async function connectAWG(port: string) {
  const response = await fetch(`${API_BASE}/connect/awg`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ port }),
  })
  if (!response.ok) throw new Error("Failed to connect AWG")
  return response.json()
}

export async function connectScope() {
  const response = await fetch(`${API_BASE}/connect/scope`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
  if (!response.ok) throw new Error("Failed to connect Scope")
  return response.json()
}

export async function configureBode(config: {
  start_freq: number
  stop_freq: number
  num_points: number
  n_samples: number
  amplitude: number
  tolerance: number
}) {
  const response = await fetch(`${API_BASE}/bode/config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  })
  if (!response.ok) throw new Error("Failed to configure Bode")
  return response.json()
}

export function startBodeStream(onData: (data: any) => void) {
  const eventSource = new EventSource(`${API_BASE}/bode/start`)
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data)
    onData(data)
  }
  eventSource.onerror = () => {
    eventSource.close()
  }
  return () => {
    eventSource.close()
  }
}
