"use client"

import { useState, useEffect } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getPorts, connectAWG } from "../api"
import type { ConnectionStatus } from "../types"

interface AWGSectionProps {
  status: ConnectionStatus
  onStatusChange: () => void
}

export default function AWGSection({ status, onStatusChange }: AWGSectionProps) {
  const [ports, setPorts] = useState<string[]>([])
  const [selectedPort, setSelectedPort] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const fetchPorts = async () => {
    setIsLoading(true)
    try {
      const portsData = await getPorts()
      setPorts(portsData)
      if (portsData.length > 0 && !selectedPort) {
        setSelectedPort(portsData[0])
      }
    } catch (error) {
      console.error("Failed to fetch ports:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPorts()
  }, [])

  const handleConnect = async () => {
    if (!selectedPort) return

    setIsLoading(true)
    try {
      await connectAWG(selectedPort)
      onStatusChange()
    } catch (error) {
      console.error("Failed to connect AWG:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <h2 className="text-lg font-semibold">AWG</h2>
      <Button variant="outline" size="icon" onClick={fetchPorts} disabled={isLoading} className="h-8 w-8">
        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        <span className="sr-only">Refresh ports</span>
      </Button>

      <Select value={selectedPort} onValueChange={setSelectedPort}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select port" />
        </SelectTrigger>
        <SelectContent>
          {ports.map((port) => (
            <SelectItem key={port} value={port}>
              {port}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {status === "connected" ? (
        <span className="text-green-500 font-medium">Connected</span>
      ) : (
        <Button onClick={handleConnect} disabled={!selectedPort || isLoading} className="ml-2">
          Connect
        </Button>
      )}
    </div>
  )
}

