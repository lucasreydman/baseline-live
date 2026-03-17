'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TrayGame } from '@/lib/types'

interface GameTrayState {
  openGames: TrayGame[]
  addGame: (game: TrayGame) => void
  removeGame: (gameId: string) => void
  updateGame: (gameId: string, updates: Partial<TrayGame>) => void
  hasGame: (gameId: string) => boolean
}

export const useGameTray = create<GameTrayState>()(
  persist(
    (set, get) => ({
      openGames: [],

      addGame: (game) =>
        set((state) => {
          if (state.openGames.some((g) => g.gameId === game.gameId)) return state
          return { openGames: [...state.openGames, game] }
        }),

      removeGame: (gameId) =>
        set((state) => ({
          openGames: state.openGames.filter((g) => g.gameId !== gameId),
        })),

      updateGame: (gameId, updates) =>
        set((state) => ({
          openGames: state.openGames.map((g) =>
            g.gameId === gameId ? { ...g, ...updates } : g
          ),
        })),

      hasGame: (gameId) => get().openGames.some((g) => g.gameId === gameId),
    }),
    {
      name: 'baseline-live-tray',
    }
  )
)
