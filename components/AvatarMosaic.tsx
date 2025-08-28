"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/utils/supabase/client"

type AvatarItem = {
  url: string
  rotationDeg: number
  translateX: number
  translateY: number
}

function getTargetCountByWidth(width: number): number {
  if (width < 640) {
    return 5 + Math.floor(Math.random() * 2) // 5-6
  }
  if (width >= 1024) {
    return 8 + Math.floor(Math.random() * 3) // 8-10
  }
  return 6 + Math.floor(Math.random() * 3) // 6-8 for tablet
}

export default function AvatarMosaic() {
  const [avatars, setAvatars] = useState<AvatarItem[]>([])

  useEffect(() => {
    let isMounted = true
    const supabase = createClient()

    const run = async () => {
      try {
        const width = window.innerWidth
        const targetCount = getTargetCountByWidth(width)

        // Fetch a pool larger than needed for randomness
        const { data, error } = await supabase
          .from("profiles")
          .select("avatar_url")
          .not("avatar_url", "is", null)
          .neq("avatar_url", "")
          .limit(40)

        if (error) throw error

        const pool = (data || [])
          .map((r: any) => r.avatar_url as string)
          .filter(Boolean)

        // Shuffle
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[pool[i], pool[j]] = [pool[j], pool[i]]
        }

        const selected = pool.slice(0, Math.max(5, targetCount))

        const items: AvatarItem[] = selected.map((url: string) => ({
          url,
          rotationDeg: (Math.random() - 0.5) * 6, // -3..+3 deg
          translateX: (Math.random() - 0.5) * 8, // px, slight jitter
          translateY: (Math.random() - 0.5) * 8,
        }))

        if (isMounted) setAvatars(items)
      } catch (e) {
        console.error("Failed to load avatars for mosaic", e)
        if (isMounted) setAvatars([])
      }
    }

    run()
    return () => {
      isMounted = false
    }
  }, [])

  const gridTemplate = useMemo(() => {
    // Responsive columns with fairly large tiles to roughly match hero background
    // We rely on container size; each cell is square and fills area.
    return "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-6"
  }, [])

  return (
    <div className="absolute inset-0">
      {/* Mosaic */}
      <div className={`absolute inset-0 grid ${gridTemplate} gap-2 p-2`}>
        {avatars.map((a, idx) => (
          <div
            key={`${a.url}-${idx}`}
            className="relative w-full h-full min-h-24 sm:min-h-28 md:min-h-32 lg:min-h-36 overflow-hidden rounded-md"
            style={{
              transform: `rotate(${a.rotationDeg}deg) translate(${a.translateX}px, ${a.translateY}px)`,
            }}
          >
            <img
              src={a.url}
              alt="avatar"
              className="w-full h-full object-cover filter grayscale"
              loading="eager"
              decoding="async"
            />
          </div>
        ))}
      </div>

      {/* Dark overlay so white text is readable */}
      <div className="absolute inset-0 bg-gray-900/60" />
    </div>
  )
}

