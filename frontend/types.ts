export type ConnectionStatus = "connected" | "disconnected"

export type BodeStatus = "ready" | "not_ready"

export type StatusResponse = {
  awg: ConnectionStatus
  scope: ConnectionStatus
  bode: BodeStatus
}

export type Port = {
  id: string
  name: string
}

export type BodeConfig = {
  start_freq: number
  stop_freq: number
  num_points: number
  n_samples: number
  amplitude: number
  tolerance: number
}

export type BodeDataPoint = {
  freq: number
  gain: number
  phase: number
}

