"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { connectScope } from "../api"
import type { ConnectionStatus } from "../types"

interface ScopeSectionProps {
  status: ConnectionStatus
  onStatusChange: () => void
}

export default function ScopeSection({ status, onStatusChange }: ScopeSectionProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      await connectScope()
      onStatusChange()
    } catch (error) {
      console.error("Failed to connect Scope:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <h2 className="text-lg font-semibold">SCOPE</h2>

      {status === "connected" ? (
        <span className="text-green-500 font-medium">Connected</span>
      ) : (
        <Button onClick={handleConnect} disabled={isLoading}>
          Connect Scope
        </Button>
      )}
    </div>
  )
}

