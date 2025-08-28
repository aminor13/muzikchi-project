"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { createClient } from "@/utils/supabase/client"

type AvatarItem = {
  url: string
  rotationDeg: number
  translateX: number
  translateY: number
}

function getLayoutByViewport(width: number, height: number): { cols: number; rows: number } {
  if (width >= 1280 && height > 800) {
    // Tall desktop -> 3 rows, odd cols so total is odd (e.g., 3x3=9)
    return { cols: 3, rows: 3 }
  }
  if (width >= 1024) {
    // Desktop -> 2 rows of 5 = 10 tiles
    return { cols: 5, rows: 2 }
  }
  if (width >= 640) {
    // Tablet -> 2 rows of 4 = 8 tiles
    return { cols: 4, rows: 2 }
  }
  // Mobile -> 2 rows of 3 = 6 tiles (within requested 5-6)
  return { cols: 3, rows: 2 }
}

export default function AvatarMosaic() {
  const [avatars, setAvatars] = useState<AvatarItem[]>([])
  const [cols, setCols] = useState<number>(3)

  useEffect(() => {
    let isMounted = true
    const supabase = createClient()

    const run = async () => {
      try {
        const width = window.innerWidth
        const height = window.innerHeight
        const { cols, rows } = getLayoutByViewport(width, height)
        setCols(cols)

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

        const targetCount = Math.max(1, cols * rows)
        const selected = pool.slice(0, targetCount)

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

  const gridColsClass = useMemo(() => {
    const map: Record<number, string> = {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
      5: "grid-cols-5",
      6: "grid-cols-6",
    }
    return map[cols] || "grid-cols-3"
  }, [cols])

  return (
    <div className="absolute inset-0">
      {/* Mosaic */}
      <div className={`absolute inset-0 grid ${gridColsClass} gap-2 p-2`}>
        {avatars.map((a, idx) => (
          <div
            key={`${a.url}-${idx}`}
            className="relative w-full h-full min-h-24 sm:min-h-28 md:min-h-32 lg:min-h-36 overflow-hidden rounded-md"
            style={{
              transform: `rotate(${a.rotationDeg}deg) translate(${a.translateX}px, ${a.translateY}px)`,
            }}
          >
            <Image
              src={`${a.url}?width=320&quality=60`}
              alt="avatar"
              fill
              sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
              quality={60}
              className="object-cover filter grayscale"
              priority
            />
          </div>
        ))}
      </div>

      {/* Dark overlay so white text is readable */}
      <div className="absolute inset-0 bg-gray-900/60" />
    </div>
  )
}

