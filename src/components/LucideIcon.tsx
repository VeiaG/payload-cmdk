import { icons } from 'lucide-react'

export function LucideIconDynamic({
  name,
  className,
  size,
}: {
  className?: string
  name: keyof typeof icons
  size?: number
}) {
  const Icon = icons[name]
  if (!Icon) {
    return null
  }

  return <Icon className={className} size={size}></Icon>
}
