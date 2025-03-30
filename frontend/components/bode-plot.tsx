"use client"

import { useRef } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { BodeDataPoint } from "../types"

interface BodePlotProps {
  data: BodeDataPoint[]
  isStreaming: boolean
}

export default function BodePlot({ data, isStreaming }: BodePlotProps) {
  const gainChartRef = useRef<HTMLDivElement>(null)
  const phaseChartRef = useRef<HTMLDivElement>(null)

  // Process data for plotting
  const processedData = data.map((point) => ({
    freq: point.freq,
    gain_dB: 20 * Math.log10(point.gain),
    phase: point.phase,
  }))

  const handleSaveGainChart = () => {
    if (gainChartRef.current) {
      // Implementation for saving chart as image
      alert("Save gain chart functionality would be implemented here")
    }
  }

  const handleSavePhaseChart = () => {
    if (phaseChartRef.current) {
      // Implementation for saving chart as image
      alert("Save phase chart functionality would be implemented here")
    }
  }

  const formatFrequency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`
    }
    return value.toString()
  }

  return (
    <div className="space-y-6">
      {/* Gain Plot */}
      <div className="relative" ref={gainChartRef}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">Gain (dB)</h3>
          <Button variant="outline" size="icon" onClick={handleSaveGainChart} className="h-8 w-8">
            <Save className="h-4 w-4" />
            <span className="sr-only">Save gain chart</span>
          </Button>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={processedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="freq"
                scale="log"
                domain={["auto", "auto"]}
                type="number"
                tickFormatter={formatFrequency}
                label={{ value: "Frequency (Hz)", position: "insideBottomRight", offset: -5 }}
              />
              <YAxis label={{ value: "Gain (dB)", angle: -90, position: "insideLeft" }} />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(2)} dB`, "Gain"]}
                labelFormatter={(label) => `Frequency: ${label} Hz`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="gain_dB"
                stroke="#8884d8"
                name="Gain"
                dot={!isStreaming}
                isAnimationActive={!isStreaming}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Phase Plot */}
      <div className="relative" ref={phaseChartRef}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">Phase (degrees)</h3>
          <Button variant="outline" size="icon" onClick={handleSavePhaseChart} className="h-8 w-8">
            <Save className="h-4 w-4" />
            <span className="sr-only">Save phase chart</span>
          </Button>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={processedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="freq"
                scale="log"
                domain={["auto", "auto"]}
                type="number"
                tickFormatter={formatFrequency}
                label={{ value: "Frequency (Hz)", position: "insideBottomRight", offset: -5 }}
              />
              <YAxis domain={[-180, 180]} label={{ value: "Phase (°)", angle: -90, position: "insideLeft" }} />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(2)}°`, "Phase"]}
                labelFormatter={(label) => `Frequency: ${label} Hz`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="phase"
                stroke="#82ca9d"
                name="Phase"
                dot={!isStreaming}
                isAnimationActive={!isStreaming}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

