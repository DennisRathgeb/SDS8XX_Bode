"use client"

import type React from "react"

import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BodeConfig } from "../types"

interface SettingsProps {
  config: BodeConfig
  onConfigChange: (config: BodeConfig) => void
  disabled: boolean
}

export default function Settings({ config, onConfigChange, disabled }: SettingsProps) {
  const [startFreq, setStartFreq] = useState(config.start_freq)
  const [stopFreq, setStopFreq] = useState(config.stop_freq)
  const [numPoints, setNumPoints] = useState(config.num_points)
  const [nSamples, setNSamples] = useState(config.n_samples)
  const [amplitude, setAmplitude] = useState(config.amplitude)
  const [tolerance, setTolerance] = useState(config.tolerance)

  // Convert frequency to log scale for slider
  const freqToSlider = (freq: number) => {
    return Math.log10(freq)
  }

  // Convert slider value to frequency
  const sliderToFreq = (value: number) => {
    return Math.pow(10, value)
  }

  // Calculate slider values
  const minSlider = freqToSlider(10)
  const maxSlider = freqToSlider(99999999)
  const startSlider = freqToSlider(startFreq)
  const stopSlider = freqToSlider(stopFreq)

  const handleSliderChange = (values: number[]) => {
    const newStartFreq = Math.round(sliderToFreq(values[0]))
    const newStopFreq = Math.round(sliderToFreq(values[1]))

    setStartFreq(newStartFreq)
    setStopFreq(newStopFreq)

    updateConfig({
      start_freq: newStartFreq,
      stop_freq: newStopFreq,
    })
  }

  const handleStartFreqChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value) && value > 0) {
      setStartFreq(value)
      updateConfig({ start_freq: value })
    }
  }

  const handleStopFreqChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value) && value > 0) {
      setStopFreq(value)
      updateConfig({ stop_freq: value })
    }
  }

  const handleNumPointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value) && value > 0) {
      setNumPoints(value)
      updateConfig({ num_points: value })
    }
  }

  const handleNSamplesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value) && value > 0) {
      setNSamples(value)
      updateConfig({ n_samples: value })
    }
  }

  const handleAmplitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    if (!isNaN(value) && value > 0) {
      setAmplitude(value)
      updateConfig({ amplitude: value })
    }
  }

  const handleToleranceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    if (!isNaN(value) && value > 0) {
      setTolerance(value)
      updateConfig({ tolerance: value })
    }
  }

  const updateConfig = (partialConfig: Partial<BodeConfig>) => {
    onConfigChange({
      ...config,
      ...partialConfig,
    })
  }

  return (
    <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
      <h3 className="text-lg font-medium">Settings</h3>

      <div className="space-y-4">
        <div>
          <Label className="mb-2 block">Frequency Range</Label>
          <Slider
            defaultValue={[startSlider, stopSlider]}
            min={minSlider}
            max={maxSlider}
            step={0.01}
            onValueChange={handleSliderChange}
            disabled={disabled}
            className="my-4"
          />
          <div className="flex gap-4">
            <div className="w-1/2">
              <Label htmlFor="start-freq">Start Freq (Hz)</Label>
              <Input
                id="start-freq"
                type="number"
                value={startFreq}
                onChange={handleStartFreqChange}
                disabled={disabled}
              />
            </div>
            <div className="w-1/2">
              <Label htmlFor="stop-freq">End Freq (Hz)</Label>
              <Input
                id="stop-freq"
                type="number"
                value={stopFreq}
                onChange={handleStopFreqChange}
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="num-points">Bode Resolution (num_points)</Label>
            <Input
              id="num-points"
              type="number"
              value={numPoints}
              onChange={handleNumPointsChange}
              disabled={disabled}
            />
          </div>

          <div>
            <Label htmlFor="n-samples">Samples per Frequency</Label>
            <Input id="n-samples" type="number" value={nSamples} onChange={handleNSamplesChange} disabled={disabled} />
          </div>

          <div>
            <Label htmlFor="amplitude">Amplitude</Label>
            <Input
              id="amplitude"
              type="number"
              step="0.01"
              value={amplitude}
              onChange={handleAmplitudeChange}
              disabled={disabled}
            />
          </div>

          <div>
            <Label htmlFor="tolerance">Tolerance</Label>
            <Input
              id="tolerance"
              type="number"
              step="0.01"
              value={tolerance}
              onChange={handleToleranceChange}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

