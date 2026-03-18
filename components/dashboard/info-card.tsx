import type { LucideIcon } from "lucide-react"
import { Users } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function InfoCard({ title, icon, value, text }: { title: string, icon?: LucideIcon, value: string | number, text?: string }) {
  const Icon = icon || Users
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  )
}
