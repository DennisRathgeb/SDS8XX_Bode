"use client";

import { useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BodeDataPoint } from "../types";

interface BodePlotProps {
  data: BodeDataPoint[];
  isStreaming: boolean;
}

export default function BodePlot({ data, isStreaming }: BodePlotProps) {
  const gainChartRef = useRef<HTMLDivElement>(null);
  const phaseChartRef = useRef<HTMLDivElement>(null);

  // Process data for plotting
  const processedData = data.map((point) => ({
    freq: point.freq,
    gain_dB: 20 * Math.log10(point.gain),
    phase: point.phase,
  }));

  const handleSaveGainChart = () => {
    if (gainChartRef.current) {
      // Implementation for saving chart as image
      alert("Save gain chart functionality would be implemented here");
    }
  };

  const handleSavePhaseChart = () => {
    if (phaseChartRef.current) {
      // Implementation for saving chart as image
      alert("Save phase chart functionality would be implemented here");
    }
  };

  // Generate logarithmic ticks for x-axis based on data range
  const generateLogTicks = () => {
    if (processedData.length === 0) return [10, 100, 1000, 10000, 100000];

    const freqValues = processedData.map((d) => d.freq);
    const minFreq = Math.min(...freqValues);
    const maxFreq = Math.max(...freqValues);

    // Find the powers of 10 that contain the data range
    const minExponent = Math.floor(Math.log10(minFreq));
    const maxExponent = Math.ceil(Math.log10(maxFreq));

    // Include one power of 10 below and above the range
    const startExponent = Math.max(minExponent - 1, 0);
    const endExponent = maxExponent + 1;

    const ticks = [];
    for (let i = startExponent; i <= endExponent; i++) {
      ticks.push(Math.pow(10, i));
    }

    return ticks;
  };

  // Format frequency for x-axis labels
  const formatFrequency = (value: number) => {
    const exponent = Math.log10(value);
    if (Number.isInteger(exponent)) {
      return `10^${exponent}`;
    }
    return "";
  };

  // Generate phase ticks
  const phaseTickValues = [-180, -90, -45, 0, 45, 90, 180];

  // Generate gain ticks (dynamically based on data with whole numbers)
  const generateGainTicks = () => {
    if (processedData.length === 0) return [-30, -20, -10, 0, 10, 20, 30, 40];

    const gainValues = processedData.map((d) => d.gain_dB);
    const minGain = Math.min(...gainValues);
    const maxGain = Math.max(...gainValues);

    // Add padding to min and max
    const paddedMin = Math.floor(minGain / 10) * 10 - 10; // Round down to nearest 10 and subtract 10
    const paddedMax = Math.ceil(maxGain / 10) * 10 + 10; // Round up to nearest 10 and add 10

    // Generate whole number ticks between paddedMin and paddedMax
    const range = paddedMax - paddedMin;
    const tickCount = 8; // Aim for about 8 ticks
    const step = Math.ceil(range / (tickCount - 1));

    // Ensure step is a nice round number (5, 10, 20, etc.)
    let niceStep = 10;
    if (step <= 5) niceStep = 5;
    else if (step <= 10) niceStep = 10;
    else if (step <= 20) niceStep = 20;
    else niceStep = Math.ceil(step / 10) * 10;

    const ticks = [];
    for (let i = paddedMin; i <= paddedMax; i += niceStep) {
      ticks.push(i);
    }

    return ticks;
  };

  // Calculate gain domain with padding
  const calculateGainDomain = () => {
    if (processedData.length === 0) return [-30, 40];

    const gainValues = processedData.map((d) => d.gain_dB);
    const minGain = Math.min(...gainValues);
    const maxGain = Math.max(...gainValues);

    // Add padding to min and max
    const paddedMin = Math.floor(minGain / 10) * 10 - 10; // Round down to nearest 10 and subtract 10
    const paddedMax = Math.ceil(maxGain / 10) * 10 + 10; // Round up to nearest 10 and add 10

    return [paddedMin, paddedMax];
  };

  // Calculate frequency domain with padding
  const calculateFreqDomain = () => {
    if (processedData.length === 0) return [10, 100000];

    const freqValues = processedData.map((d) => d.freq);
    const minFreq = Math.min(...freqValues);
    const maxFreq = Math.max(...freqValues);

    // Add padding as a multiplier/divider (since it's logarithmic)
    const paddingFactor = 1.5;
    const paddedMin = minFreq / paddingFactor;
    const paddedMax = maxFreq * paddingFactor;

    return [paddedMin, paddedMax];
  };

  return (
    <div className="space-y-6">
      {/* Gain Plot */}
      <div className="relative" ref={gainChartRef}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">Gain (dB)</h3>
          <Button
            variant="outline"
            size="icon"
            onClick={handleSaveGainChart}
            className="h-8 w-8"
          >
            <Save className="h-4 w-4" />
            <span className="sr-only">Save gain chart</span>
          </Button>
        </div>
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={processedData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="freq"
                scale="log"
                domain={["auto", "auto"]}
                type="number"
                ticks={generateLogTicks()}
                tickFormatter={formatFrequency}
                label={{
                  value: "Frequency (Hz)",
                  position: "insideBottomRight",
                  offset: -5,
                }}
              />
              <YAxis
                domain={calculateGainDomain()}
                ticks={generateGainTicks()}
                label={{
                  value: "Gain (dB)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                formatter={(value: number) => [
                  `${value.toFixed(2)} dB`,
                  "Gain",
                ]}
                labelFormatter={(label) => `Frequency: ${label} Hz`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="gain_dB"
                stroke="#8884d8"
                name="Gain"
                dot={false}
                isAnimationActive={!isStreaming}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Phase Plot */}
      <div className="relative" ref={phaseChartRef}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">Phase (degrees)</h3>
          <Button
            variant="outline"
            size="icon"
            onClick={handleSavePhaseChart}
            className="h-8 w-8"
          >
            <Save className="h-4 w-4" />
            <span className="sr-only">Save phase chart</span>
          </Button>
        </div>
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={processedData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="freq"
                scale="log"
                domain={["auto", "auto"]}
                type="number"
                ticks={generateLogTicks()}
                tickFormatter={formatFrequency}
                label={{
                  value: "Frequency (Hz)",
                  position: "insideBottomRight",
                  offset: -5,
                }}
              />
              <YAxis
                domain={[-180, 180]}
                ticks={phaseTickValues}
                label={{
                  value: "Phase (°)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
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
                dot={false}
                isAnimationActive={!isStreaming}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
