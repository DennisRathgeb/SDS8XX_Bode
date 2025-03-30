"use client"

import { useState, useEffect } from "react"
import Header from "../components/header"
import BodePlot from "../components/bode-plot"
import Settings from "../components/settings"
import { Button } from "@/components/ui/button"
import { configureBode, startBodeStream } from "../api"
import type { BodeConfig, BodeDataPoint, StatusResponse } from "../types"

export default function BodePlotApp() {
  const [status, setStatus] = useState<StatusResponse>({
    awg: "disconnected",
    scope: "disconnected",
    bode: "not_ready",
  })

  const [config, setConfig] = useState<BodeConfig>({
    start_freq: 10,
    stop_freq: 100000,
    num_points: 100,
    n_samples: 10,
    amplitude: 1.0,
    tolerance: 0.1,
  })

  const [bodeData, setBodeData] = useState<BodeDataPoint[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isRunning, setIsRunning] = useState(false)

  const handleStatusChange = (newStatus: StatusResponse) => {
    setStatus(newStatus)
  }

  const handleConfigChange = (newConfig: BodeConfig) => {
    setConfig(newConfig)
  }

  const handleRunBode = async () => {
    try {
      setIsRunning(true)
      // Clear previous data
      setBodeData([])

      // Configure Bode
      await configureBode(config)

      // Start streaming
      setIsStreaming(true)

      // Start Bode stream
      const cleanup = startBodeStream((data: BodeDataPoint) => {
        setBodeData((prevData) => [...prevData, data])
      })

      // Return cleanup function
      return cleanup
    } catch (error) {
      console.error("Failed to run Bode:", error)
      setIsStreaming(false)
      setIsRunning(false)
    }
  }

  // Clean up event source on unmount
  useEffect(() => {
    return () => {
      // Any cleanup needed
    }
  }, [])

  const isBodeReady = status.awg === "connected" && status.scope === "connected" && status.bode === "ready"

  return (
    <div className="min-h-screen bg-gray-100">
      <Header onStatusChange={handleStatusChange} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6 flex justify-center">
          <Button
            size="lg"
            className={`px-8 ${isBodeReady ? "bg-green-500 hover:bg-green-600" : "bg-gray-400"}`}
            disabled={!isBodeReady || isRunning}
            onClick={handleRunBode}
          >
            Run Bode
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <BodePlot data={bodeData} isStreaming={isStreaming} />

          <Settings config={config} onConfigChange={handleConfigChange} disabled={isStreaming} />
        </div>
      </main>
    </div>
  )
}

