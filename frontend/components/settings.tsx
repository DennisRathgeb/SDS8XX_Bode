"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BodeConfig } from "../types";

interface SettingsProps {
  config: BodeConfig;
  onConfigChange: (config: BodeConfig) => void;
  disabled: boolean;
}

export default function Settings({
  config,
  onConfigChange,
  disabled,
}: SettingsProps) {
  const [startFreq, setStartFreq] = useState<string | number>(
    config.start_freq
  );
  const [stopFreq, setStopFreq] = useState<string | number>(config.stop_freq);
  const [numPoints, setNumPoints] = useState<string | number>(
    config.num_points
  );
  const [nSamples, setNSamples] = useState<string | number>(config.n_samples);
  const [amplitude, setAmplitude] = useState<string | number>(config.amplitude);
  const [tolerance, setTolerance] = useState<string | number>(config.tolerance);

  // Convert frequency to log scale for slider
  const freqToSlider = (freq: number) => {
    return Math.log10(freq);
  };

  // Convert slider value to frequency
  const sliderToFreq = (value: number) => {
    return Math.pow(10, value);
  };

  // Calculate slider values
  const minSlider = freqToSlider(100);
  const maxSlider = freqToSlider(99999999);
  const startSlider = freqToSlider(
    typeof startFreq === "string" ? Number.parseInt(startFreq) || 10 : startFreq
  );
  const stopSlider = freqToSlider(
    typeof stopFreq === "string"
      ? Number.parseInt(stopFreq) || 100000
      : stopFreq
  );

  const handleSliderChange = (values: number[]) => {
    const newStartFreq = Math.round(sliderToFreq(values[0]));
    const newStopFreq = Math.round(sliderToFreq(values[1]));

    setStartFreq(newStartFreq);
    setStopFreq(newStopFreq);

    updateConfig({
      start_freq: newStartFreq,
      stop_freq: newStopFreq,
    });
  };

  // Generic handler for text input changes
  const handleTextChange =
    (setter: React.Dispatch<React.SetStateAction<string | number>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
    };

  // Generic handler for validating and updating config after blur
  const handleBlur = (
    field: keyof BodeConfig,
    value: string | number,
    setter: React.Dispatch<React.SetStateAction<string | number>>,
    min: number,
    max: number
  ) => {
    let numValue: number;

    if (typeof value === "string") {
      numValue = Number.parseFloat(value);
      if (isNaN(numValue)) {
        numValue = field.includes("freq") ? 10 : 1;
      }
    } else {
      numValue = value;
    }

    // Clamp value to min/max
    if (numValue < min) numValue = min;
    if (numValue > max) numValue = max;

    // Update state and config
    setter(numValue);
    updateConfig({ [field]: numValue });
  };

  const updateConfig = (partialConfig: Partial<BodeConfig>) => {
    onConfigChange({
      ...config,
      ...partialConfig,
    });
  };

  // Add custom CSS to ensure both slider handles are visible
  useEffect(() => {
    // Add custom CSS to ensure both slider handles are visible
    const style = document.createElement("style");
    style.textContent = `
      .range-slider [data-orientation="horizontal"] {
        height: 2px;
      }
      
      .range-slider [role="slider"] {
        width: 16px !important;
        height: 16px !important;
        background: white !important;
        border: 2px solid black !important;
        border-radius: 50% !important;
        display: block !important;
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
      <h3 className="text-lg font-medium">Settings</h3>

      <div className="space-y-4">
        <div>
          <Label className="mb-2 block">Frequency Range</Label>
          <div className="range-slider">
            <Slider
              defaultValue={[startSlider, stopSlider]}
              min={minSlider}
              max={maxSlider}
              step={0.01}
              onValueChange={handleSliderChange}
              disabled={disabled}
              className="my-4"
              minStepsBetweenThumbs={1}
            />
          </div>
          <div className="flex gap-4">
            <div className="w-1/2">
              <Label htmlFor="start-freq">Start Frequency (Hz)</Label>
              <Input
                id="start-freq"
                type="text"
                value={startFreq}
                onChange={handleTextChange(setStartFreq)}
                onBlur={() =>
                  handleBlur(
                    "start_freq",
                    startFreq,
                    setStartFreq,
                    10,
                    typeof stopFreq === "string"
                      ? Number.parseInt(stopFreq) || 99999999
                      : stopFreq
                  )
                }
                disabled={disabled}
              />
            </div>
            <div className="w-1/2">
              <Label htmlFor="stop-freq">End Frequency (Hz)</Label>
              <Input
                id="stop-freq"
                type="text"
                value={stopFreq}
                onChange={handleTextChange(setStopFreq)}
                onBlur={() =>
                  handleBlur(
                    "stop_freq",
                    stopFreq,
                    setStopFreq,
                    typeof startFreq === "string"
                      ? Number.parseInt(startFreq) || 10
                      : startFreq,
                    99999999
                  )
                }
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="num-points">Bode Resolution</Label>
            <Input
              id="num-points"
              type="text"
              value={numPoints}
              onChange={handleTextChange(setNumPoints)}
              onBlur={() =>
                handleBlur("num_points", numPoints, setNumPoints, 1, 1000)
              }
              disabled={disabled}
            />
          </div>

          <div>
            <Label htmlFor="n-samples">Samples per Frequency</Label>
            <Input
              id="n-samples"
              type="text"
              value={nSamples}
              onChange={handleTextChange(setNSamples)}
              onBlur={() =>
                handleBlur("n_samples", nSamples, setNSamples, 1, 1000)
              }
              disabled={disabled}
            />
          </div>

          <div>
            <Label htmlFor="amplitude">Amplitude (V)</Label>
            <Input
              id="amplitude"
              type="text"
              value={amplitude}
              onChange={handleTextChange(setAmplitude)}
              onBlur={() =>
                handleBlur("amplitude", amplitude, setAmplitude, 0.01, 10)
              }
              disabled={disabled}
            />
          </div>

          <div>
            <Label htmlFor="tolerance">Tolerance</Label>
            <Input
              id="tolerance"
              type="text"
              value={tolerance}
              onChange={handleTextChange(setTolerance)}
              onBlur={() =>
                handleBlur("tolerance", tolerance, setTolerance, 0.01, 1)
              }
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
