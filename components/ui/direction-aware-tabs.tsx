"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface Tab {
  id: number
  label: string
  content: React.ReactNode
}

interface DirectionAwareTabsProps {
  tabs: Tab[]
  className?: string
  rounded?: string
  onChange?: () => void
}

export function DirectionAwareTabs({
  tabs,
  className,
  rounded = "rounded-lg",
  onChange,
}: DirectionAwareTabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || 0)

  const handleTabChange = (tabId: number) => {
    setActiveTab(tabId)
    onChange?.()
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="flex border-b border-neutral-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "relative px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "text-[#13EEE3]"
                : "text-neutral-400 hover:text-neutral-200"
            )}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#13EEE3]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  )
}
