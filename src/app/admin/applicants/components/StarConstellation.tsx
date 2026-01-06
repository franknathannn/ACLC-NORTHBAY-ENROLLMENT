// src/app/admin/applicants/components/StarConstellation.tsx

import { useEffect, useState, memo } from "react"

export const StarConstellation = memo(function StarConstellation() {
 const [stars, setStars] = useState<Array<{x: number, y: number, size: number}>>([])
 const [connections, setConnections] = useState<Array<{x1: number, y1: number, x2: number, y2: number}>>([])

 useEffect(() => {
  // Generate stars
  const starCount = 50
  const newStars: Array<{x: number, y: number, size: number}> = []
  for (let i = 0; i < starCount; i++) {
   newStars.push({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1
   })
  }
  setStars(newStars)

  // Generate connections between nearby stars
  const newConnections: Array<{x1: number, y1: number, x2: number, y2: number}> = []
  for (let i = 0; i < newStars.length; i++) {
   for (let j = i + 1; j < newStars.length; j++) {
    const dx = newStars[i].x - newStars[j].x
    const dy = newStars[i].y - newStars[j].y
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance < 15) {
     newConnections.push({
      x1: newStars[i].x,
      y1: newStars[i].y,
      x2: newStars[j].x,
      y2: newStars[j].y
     })
    }
   }
  }
  setConnections(newConnections)
 }, [])

 return (
  <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
   <svg className="w-full h-full opacity-30">
    {/* Connections */}
    {connections.map((conn, i) => (
     <line
      key={`conn-${i}`}
      x1={`${conn.x1}%`}
      y1={`${conn.y1}%`}
      x2={`${conn.x2}%`}
      y2={`${conn.y2}%`}
      stroke="rgb(59 130 246)"
      strokeWidth="0.5"
      strokeOpacity="0.3"
      className="animate-pulse"
      style={{ animationDelay: `${i * 0.1}s` }}
     />
    ))}
    {/* Stars */}
    {stars.map((star, i) => (
     <circle
      key={`star-${i}`}
      cx={`${star.x}%`}
      cy={`${star.y}%`}
      r={star.size}
      fill="rgb(59 130 246)"
      className="animate-pulse"
      style={{ animationDelay: `${i * 0.05}s` }}
     />
    ))}
   </svg>
  </div>
 )
})
