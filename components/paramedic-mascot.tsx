import Image from "next/image"

export type MascotType = "default" | "large" | "small"

interface DentalMascotProps {
  width?: number
  height?: number
  className?: string
  type?: MascotType
}

export function DentalMascot({ width = 24, height = 24, className = "", type = "default" }: DentalMascotProps) {
  // すべてのタイプで同じTMC DENTALロゴを使用
  const logoPath = "/tmc-dental-logo.png"

  return (
    <div className={`relative inline-block ${className}`} style={{ width, height }}>
      <Image
        src={logoPath}
        alt="TMC DENTAL ロゴ"
        fill
        className="object-contain"
        priority
      />
    </div>
  )
}
