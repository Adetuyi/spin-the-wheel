'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { PRIZES } from '@/lib/prizes'

// ── Wheel geometry helpers ────────────────────────────────────────────────────

const TOTAL_SEGMENTS = PRIZES.length
const SEGMENT_ANGLE = 360 / TOTAL_SEGMENTS // degrees per segment
const CENTER = 200 // SVG viewBox centre
const RADIUS = 190 // outer radius
const INNER_RADIUS = 36 // hub radius

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function segmentPath(index: number, total: number, cx: number, cy: number, r: number, inner: number) {
  const startAngle = index * (360 / total)
  const endAngle = startAngle + 360 / total
  const s = polarToCartesian(cx, cy, r, startAngle)
  const e = polarToCartesian(cx, cy, r, endAngle)
  const si = polarToCartesian(cx, cy, inner, startAngle)
  const ei = polarToCartesian(cx, cy, inner, endAngle)
  const largeArc = 360 / total > 180 ? 1 : 0
  return [
    `M ${si.x} ${si.y}`,
    `L ${s.x} ${s.y}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`,
    `L ${ei.x} ${ei.y}`,
    `A ${inner} ${inner} 0 ${largeArc} 0 ${si.x} ${si.y}`,
    'Z',
  ].join(' ')
}

// ── Spin animation ────────────────────────────────────────────────────────────

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SpinPage() {
  const router = useRouter()
  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [spinsRemaining, setSpinsRemaining] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [winningIndex, setWinningIndex] = useState<number | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const startRotRef = useRef(0)
  const totalRotRef = useRef(0)
  const durationRef = useRef(5000)

  // Fetch remaining spins
  useEffect(() => {
    fetch('/api/spin/status')
      .then((r) => r.json())
      .then((d) => setSpinsRemaining(d.spinsRemaining ?? 0))
      .catch(() => setSpinsRemaining(0))
  }, [])

  const handleSpin = async () => {
    if (isSpinning || spinsRemaining === 0) return
    setError('')
    setWinningIndex(null)
    setIsSpinning(true)

    // Call API to determine prize
    let prizeSlug = ''
    let prizeIndex = 0
    try {
      const res = await fetch('/api/spin', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Could not spin. Please try again.')
        setIsSpinning(false)
        return
      }
      prizeSlug = data.prizeSlug
      // Find the index of the prize in PRIZES array
      prizeIndex = PRIZES.findIndex((p) => p.slug === prizeSlug)
      if (prizeIndex === -1) prizeIndex = 0
      setSpinsRemaining(data.spinsRemaining)
    } catch {
      setError('Network error. Please try again.')
      setIsSpinning(false)
      return
    }

    // Calculate target rotation: land with the winning segment at the top (pointer)
    // Pointer is at 0° (top). Segment `prizeIndex` starts at prizeIndex * SEGMENT_ANGLE.
    // We want the middle of that segment at 0°.
    const segmentMid = prizeIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2
    // We need (startRot + totalRot) % 360 == (360 - segmentMid) at the top
    const targetOffset = (360 - segmentMid + 360) % 360
    const currentMod = ((rotation % 360) + 360) % 360
    let delta = (targetOffset - currentMod + 360) % 360
    if (delta < 10) delta += 360
    // Add extra full rotations for drama
    const extraRotations = 8 + Math.floor(Math.random() * 4)
    const totalRot = extraRotations * 360 + delta

    startRotRef.current = rotation
    totalRotRef.current = totalRot
    startTimeRef.current = performance.now()
    durationRef.current = 5500

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current
      const progress = Math.min(elapsed / durationRef.current, 1)
      const eased = easeOut(progress)
      const current = startRotRef.current + totalRotRef.current * eased
      setRotation(current)

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate)
      } else {
        setRotation(startRotRef.current + totalRotRef.current)
        setIsSpinning(false)
        setWinningIndex(prizeIndex)
        // Redirect to result after a brief pause
        setTimeout(() => {
          router.push(`/result?prize=${prizeSlug}`)
        }, 1800)
      }
    }

    animFrameRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  const canSpin = !isSpinning && (spinsRemaining ?? 0) > 0

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-between px-4 py-8 relative overflow-hidden"
      style={{ fontFamily: 'var(--font-instrument), sans-serif' }}
    >
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 60%, rgba(71,247,173,0.07) 0%, transparent 65%)',
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(71,247,173,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(71,247,173,0.025) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Header */}
      <header className="w-full max-w-sm flex items-center justify-between relative z-10">
        <div
          style={{
            padding: '8px 14px',
            background: 'rgba(21,56,83,0.5)',
            borderRadius: '12px',
            border: '1px solid rgba(71,247,173,0.2)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Image src="/logo.webp" alt="Chekkit" width={90} height={30} style={{ objectFit: 'contain', height: 28, width: 'auto' }} />
        </div>

        {spinsRemaining !== null && (
          <div
            className="badge"
            style={{
              background: canSpin ? 'rgba(71,247,173,0.15)' : 'rgba(239,68,68,0.1)',
              color: canSpin ? 'var(--primary)' : '#f87171',
              border: `1px solid ${canSpin ? 'rgba(71,247,173,0.3)' : 'rgba(239,68,68,0.3)'}`,
              fontFamily: 'var(--font-syne)',
            }}
          >
            {spinsRemaining} spin{spinsRemaining !== 1 ? 's' : ''} left
          </div>
        )}
      </header>

      {/* Main wheel area */}
      <main className="flex flex-col items-center gap-6 relative z-10 w-full max-w-sm">
        <div className="text-center">
          <h1
            style={{
              fontFamily: 'var(--font-syne)',
              fontSize: 'clamp(1.4rem, 5vw, 1.8rem)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}
          >
            Spin the Wheel
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {isSpinning ? 'Spinning…' : canSpin ? 'Tap the button below to spin!' : 'No spins remaining'}
          </p>
        </div>

        {/* Wheel container */}
        <div className="relative flex items-center justify-center" style={{ width: 320, height: 320 }}>
          {/* Outer glow ring */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              boxShadow: isSpinning
                ? '0 0 60px rgba(71,247,173,0.4), 0 0 120px rgba(71,247,173,0.15)'
                : '0 0 30px rgba(71,247,173,0.2)',
              transition: 'box-shadow 0.5s ease',
              borderRadius: '50%',
            }}
          />

          {/* Pointer / arrow at top */}
          <div
            className="absolute z-20 flex justify-center"
            style={{ top: -18, left: '50%', transform: 'translateX(-50%)' }}
          >
            <svg width="24" height="32" viewBox="0 0 24 32" fill="none">
              <path
                d="M12 28 L2 4 Q12 10 22 4 Z"
                fill="var(--primary)"
                style={{ filter: 'drop-shadow(0 0 8px rgba(71,247,173,0.8))' }}
              />
            </svg>
          </div>

          {/* SVG Wheel */}
          <svg
            width="320"
            height="320"
            viewBox="0 0 400 400"
            style={{
              transform: `rotate(${rotation}deg)`,
              willChange: 'transform',
              display: 'block',
            }}
          >
            <defs>
              <filter id="segment-shadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
              </filter>
            </defs>

            {/* Segments */}
            {PRIZES.map((prize, i) => {
              const midAngle = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2
              const textPoint = polarToCartesian(CENTER, CENTER, RADIUS * 0.68, midAngle)
              const emojiPoint = polarToCartesian(CENTER, CENTER, RADIUS * 0.88, midAngle)
              const isWinner = winningIndex === i

              return (
                <g key={prize.slug}>
                  <path
                    d={segmentPath(i, TOTAL_SEGMENTS, CENTER, CENTER, RADIUS, INNER_RADIUS)}
                    fill={prize.color}
                    stroke="rgba(11,34,51,0.8)"
                    strokeWidth="2"
                    style={{
                      filter: isWinner ? 'brightness(1.3)' : undefined,
                      transition: 'filter 0.3s ease',
                    }}
                  />

                  {/* Emoji near rim */}
                  <text
                    x={emojiPoint.x}
                    y={emojiPoint.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="16"
                    transform={`rotate(${midAngle}, ${emojiPoint.x}, ${emojiPoint.y})`}
                  >
                    {prize.emoji}
                  </text>

                  {/* Label */}
                  <text
                    x={textPoint.x}
                    y={textPoint.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="10.5"
                    fontWeight="700"
                    fontFamily="Syne, sans-serif"
                    fill={prize.textColor}
                    transform={`rotate(${midAngle}, ${textPoint.x}, ${textPoint.y})`}
                    letterSpacing="0.02em"
                  >
                    {prize.name.length > 12 ? (
                      <>
                        <tspan x={textPoint.x} dy="-6">{prize.name.split(' ').slice(0, 2).join(' ')}</tspan>
                        <tspan x={textPoint.x} dy="13">{prize.name.split(' ').slice(2).join(' ')}</tspan>
                      </>
                    ) : (
                      prize.name
                    )}
                  </text>
                </g>
              )
            })}

            {/* Divider lines between segments */}
            {PRIZES.map((_, i) => {
              const angle = i * SEGMENT_ANGLE
              const outer = polarToCartesian(CENTER, CENTER, RADIUS, angle)
              const inner = polarToCartesian(CENTER, CENTER, INNER_RADIUS, angle)
              return (
                <line
                  key={i}
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                  stroke="rgba(11,34,51,0.6)"
                  strokeWidth="2"
                />
              )
            })}

            {/* Hub */}
            <circle cx={CENTER} cy={CENTER} r={INNER_RADIUS} fill="#0B2233" stroke="var(--primary)" strokeWidth="3" />
            <circle cx={CENTER} cy={CENTER} r={INNER_RADIUS - 8} fill="var(--primary)" />
            <text
              x={CENTER}
              y={CENTER}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fontWeight="800"
              fontFamily="Syne, sans-serif"
              fill="#0B2233"
              letterSpacing="-0.02em"
            >
              WIN
            </text>
          </svg>
        </div>

        {/* Spin button */}
        <div className="flex flex-col items-center gap-3 w-full">
          <button
            onClick={handleSpin}
            disabled={!canSpin}
            className="btn-primary"
            style={{
              fontFamily: 'var(--font-syne)',
              fontSize: '1.05rem',
              padding: '16px 32px',
              animation: canSpin && !isSpinning ? 'pulse-glow 2s ease-in-out infinite' : undefined,
            }}
          >
            {isSpinning ? (
              <>
                <SpinnerIcon />
                Spinning…
              </>
            ) : canSpin ? (
              '🎰 Spin the Wheel!'
            ) : (
              '😔 No Spins Left'
            )}
          </button>

          {error && (
            <p style={{ color: '#f87171', fontSize: '0.85rem', textAlign: 'center' }}>{error}</p>
          )}

          {!canSpin && !isSpinning && spinsRemaining === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
              Refer a colleague to earn another spin!
            </p>
          )}
        </div>
      </main>

      {/* Prize legend */}
      <div className="w-full max-w-sm relative z-10">
        <div className="divider mb-4" />
        <div className="grid grid-cols-3 gap-2">
          {PRIZES.filter((p) => p.slug !== 'no_prize').map((prize) => (
            <div
              key={prize.slug}
              className="flex items-center gap-1.5 text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: prize.color }}
              />
              <span style={{ fontFamily: 'var(--font-instrument)' }}>{prize.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SpinnerIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ animation: 'spin 0.8s linear infinite' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
