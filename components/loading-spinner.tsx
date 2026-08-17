"use client"

interface LoadingSpinnerProps {
  message?: string
  size?: "sm" | "md" | "lg"
}

export function LoadingSpinner({ message = "Loading...", size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    xl: "h-32 w-32",
    md: "h-16 w-16",
    lg: "h-24 w-24",
  }

  const dotSize = {
    sm: "h-1 w-1",
    xl: "h-3 w-3",
    md: "h-2 w-2",
    lg: "h-3 w-3",
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`relative ${sizeClasses[size]}`}>
        {/* soft ambient glow */}
        <div className="absolute inset-0 rounded-full bg-[#BC2030]/10 blur-xl" />

        {/* rotating comet ring */}
        <div className="absolute inset-0 rounded-full animate-spin-slow [background:conic-gradient(from_0deg,transparent_0deg,transparent_200deg,rgba(188,32,48,0.08)_250deg,rgba(188,32,48,0.4)_305deg,#BC2030_330deg,#BC2030_340deg,transparent_345deg)] [mask:radial-gradient(farthest-side,transparent_calc(100%-3px),#000_calc(100%-2px))]" />

        {/* counter-rotating shimmer band */}
        <div className="absolute inset-0 rounded-full animate-spin-reverse opacity-60 [background:conic-gradient(from_90deg,transparent_0deg,transparent_320deg,#FF8A97_345deg,transparent_355deg)] [mask:radial-gradient(farthest-side,transparent_calc(100%-4px),#000_calc(100%-3px))]" />

        {/* orbiting dot */}
        <div className="absolute inset-0 animate-spin-slow">
          <div
            className={`absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#BC2030] shadow-[0_0_10px_2px_rgba(188,32,48,0.55)] ${dotSize[size]}`}
          />
        </div>

        {/* center pulse */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`rounded-full bg-[#BC2030]/15 animate-ping-once ${dotSize[size]}`} />
          <div className={`absolute rounded-full bg-[#BC2030] ${dotSize[size]}`} />
        </div>
      </div>
      {message && <p className="text-gray-700 text-center mt-5 text-xl">{message}</p>}
    </div>
  )
}