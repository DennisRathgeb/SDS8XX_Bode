"use client";

import { useState, useEffect, useRef } from "react";
import Header from "../components/header";
import BodePlot from "../components/bode-plot";
import Settings from "../components/settings";
import { Button } from "@/components/ui/button";
import { configureBode, startBodeStream } from "../api";
import type { BodeConfig, BodeDataPoint, StatusResponse } from "../types";

export default function BodePlotApp() {
  const [status, setStatus] = useState<StatusResponse>({
    awg: "disconnected",
    scope: "disconnected",
    bode: "not_ready",
  });

  const [config, setConfig] = useState<BodeConfig>({
    start_freq: 100,
    stop_freq: 100000,
    num_points: 30,
    n_samples: 3,
    amplitude: 1.0,
    tolerance: 0.1,
  });

  const [bodeData, setBodeData] = useState<BodeDataPoint[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const eventSourceRef = useRef<() => void | null>(null);
  const expectedPointsRef = useRef<number>(0);

  const handleStatusChange = (newStatus: StatusResponse) => {
    setStatus(newStatus);
  };

  const handleConfigChange = (newConfig: BodeConfig) => {
    setConfig(newConfig);
  };

  const handleRunBode = async () => {
    try {
      setIsRunning(true);
      setIsComplete(false);
      // Clear previous data
      setBodeData([]);

      // Configure Bode
      await configureBode(config);

      // Start streaming
      setIsStreaming(true);

      // Set expected number of points
      expectedPointsRef.current = config.num_points;

      // Start Bode stream
      const cleanup = startBodeStream((data: BodeDataPoint) => {
        setBodeData((prevData) => {
          const newData = [...prevData, data];
          // Check if we've received all expected points
          if (newData.length >= expectedPointsRef.current) {
            setIsStreaming(false);
            setIsComplete(true);
            setIsRunning(false);
          }
          return newData;
        });
      });

      // Store cleanup function
      eventSourceRef.current = cleanup;
    } catch (error) {
      console.error("Failed to run Bode:", error);
      setIsStreaming(false);
      setIsRunning(false);
    }
  };

  // Clean up event source on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current();
      }
    };
  }, []);

  const isBodeReady =
    status.awg === "connected" &&
    status.scope === "connected" &&
    status.bode === "ready";

  return (
    <div className="min-h-screen bg-gray-100">
      <Header onStatusChange={handleStatusChange} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6 flex justify-center">
          <Button
            size="lg"
            className={`px-8 ${
              isBodeReady ? "bg-green-500 hover:bg-green-600" : "bg-gray-400"
            }`}
            disabled={!isBodeReady || (isRunning && !isComplete)}
            onClick={handleRunBode}
          >
            Run Bode
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <BodePlot data={bodeData} isStreaming={isStreaming} />

          <Settings
            config={config}
            onConfigChange={handleConfigChange}
            disabled={isStreaming}
          />
        </div>
      </main>
    </div>
  );
}
