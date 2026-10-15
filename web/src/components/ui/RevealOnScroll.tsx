"use client"

import React, { useEffect, useRef, useState } from "react"

interface RevealOnScrollProps {
  children: React.ReactNode
  direction?: "up" | "down" | "left" | "right" | "fade" | "scale"
  delay?: number // ms
  duration?: number // ms
  className?: string
}

export function RevealOnScroll({
  children,
  direction = "up",
  delay = 0,
  duration = 600,
  className = "",
}: RevealOnScrollProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(element)
        }
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -20px 0px",
      }
    )

    observer.observe(element)

    return () => {
      if (element) observer.unobserve(element)
    }
  }, [])

  const getTransformStyle = () => {
    if (isVisible) {
      return "opacity-100 translate-x-0 translate-y-0 scale-100"
    }

    switch (direction) {
      case "up":
        return "opacity-0 translate-y-8"
      case "down":
        return "opacity-0 -translate-y-8"
      case "left":
        return "opacity-0 -translate-x-8"
      case "right":
        return "opacity-0 translate-x-8"
      case "scale":
        return "opacity-0 scale-95"
      case "fade":
      default:
        return "opacity-0"
    }
  }

  return (
    <div
      ref={ref}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
      className={`transition-all ease-out ${getTransformStyle()} ${className}`}
    >
      {children}
    </div>
  )
}
