"use client";

import { useEffect, useState } from "react";
import AWGSection from "./awg-section";
import ScopeSection from "./scope-section";
import { getStatus } from "../api";
import type { StatusResponse } from "../types";

interface HeaderProps {
  onStatusChange: (status: StatusResponse) => void;
}

export default function Header({ onStatusChange }: HeaderProps) {
  const [status, setStatus] = useState<StatusResponse>({
    awg: "disconnected",
    scope: "disconnected",
    bode: "not_ready",
  });

  const fetchStatus = async () => {
    try {
      const statusData = await getStatus();
      setStatus(statusData);
      onStatusChange(statusData);
    } catch (error) {
      console.error("Failed to fetch status:", error);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Set up polling for status updates
    const intervalId = setInterval(fetchStatus, 5000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <header className="bg-white shadow-sm p-4 mb-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <AWGSection status={status.awg} onStatusChange={fetchStatus} />
        <ScopeSection status={status.scope} onStatusChange={fetchStatus} />
      </div>
    </header>
  );
}
