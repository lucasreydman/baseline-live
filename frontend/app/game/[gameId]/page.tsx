'use client'

import { useState, use } from 'react'
import { useGameSummary } from '@/hooks/useGameSummary'
import { useBoxScore } from '@/hooks/useBoxScore'
import { usePlayByPlay } from '@/hooks/usePlayByPlay'
import { GameHeader } from '@/components/game/GameHeader'
import { SummaryTab } from '@/components/game/SummaryTab'
import { BoxScore } from '@/components/game/BoxScore'
import { PlayByPlay } from '@/components/game/PlayByPlay'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import { useGameTray } from '@/store/gameTray'
import type { GameDetailSummary } from '@/lib/types'

type Tab = 'summary' | 'boxscore' | 'playbyplay'

const TABS: { value: Tab; label: string }[] = [
  { value: 'summary', label: 'Summary' },
  { value: 'boxscore', label: 'Box Score' },
  { value: 'playbyplay', label: 'Play by Play' },
]

function HeaderSkeleton() {
  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 py-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <Skeleton className="h-4 w-20" />
        <div className="flex items-center justify-center gap-8">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  )
}

function TrayButton({ summary }: { summary: GameDetailSummary }) {
  const { addGame, removeGame, hasGame } = useGameTray()
  const inTray = hasGame(summary.gameId)

  function toggle() {
    if (inTray) {
      removeGame(summary.gameId)
    } else {
      addGame({
        gameId: summary.gameId,
        homeTricode: summary.homeTeam.teamTricode,
        awayTricode: summary.awayTeam.teamTricode,
        homeScore: summary.homeTeam.score,
        awayScore: summary.awayTeam.score,
        statusText: summary.gameStatusText,
        isLive: summary.isLive,
      })
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        'text-xs rounded-lg px-3 py-1.5 transition-colors',
        inTray
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
      )}
    >
      {inTray ? '✓ In Tray' : '+ Add to Tray'}
    </button>
  )
}

export default function GamePage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params)
  const [activeTab, setActiveTab] = useState<Tab>('summary')

  const { summary, isLoading: summaryLoading, error: summaryError } = useGameSummary(gameId)
  const { boxScore, isLoading: boxLoading, error: boxError } = useBoxScore(
    gameId,
    activeTab === 'boxscore'
  )
  const { playByPlay, isLoading: pbpLoading, error: pbpError } = usePlayByPlay(
    gameId,
    activeTab === 'playbyplay'
  )

  return (
    <div>
      {/* Sticky game header */}
      <div className="sticky top-14 z-30">
        {summaryLoading && !summary ? (
          <HeaderSkeleton />
        ) : summaryError ? (
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-4 text-center text-sm text-red-400">
            Unable to load game data — {summaryError.message}
          </div>
        ) : summary ? (
          <GameHeader summary={summary} />
        ) : null}
      </div>

      <div className="mx-auto max-w-5xl px-4 py-4">
        {/* Tray button + tabs row */}
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 rounded-xl p-1 border border-slate-800">
            {TABS.map((tab) => (
              <button
                type="button"
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  activeTab === tab.value
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {summary && <TrayButton summary={summary} />}
        </div>

        {/* Tab content */}
        {activeTab === 'summary' && (
          <SummaryTab
            summary={summary}
            isLoading={summaryLoading && !summary}
            error={summaryError as Error | undefined}
          />
        )}
        {activeTab === 'boxscore' && (
          <BoxScore
            boxScore={boxScore}
            isLoading={boxLoading && !boxScore}
            error={boxError as Error | undefined}
          />
        )}
        {activeTab === 'playbyplay' && (
          <PlayByPlay
            playByPlay={playByPlay}
            isLoading={pbpLoading && !playByPlay}
            error={pbpError as Error | undefined}
          />
        )}
      </div>
    </div>
  )
}
