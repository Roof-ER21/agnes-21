import { TableRow, TableCell } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Crown } from "lucide-react"
import type { Player } from "../types/player"

interface PlayerRowProps {
  player: Player
  isCurrentUser: boolean
}

export function PlayerRow({ player, isCurrentUser }: PlayerRowProps) {
  const getRankIndicator = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />
    if (rank === 2) return <span className="font-bold text-lg text-gray-400">2</span>
    if (rank === 3) return <span className="font-bold text-lg text-orange-500">3</span>
    return rank
  }

  return (
    <TableRow className={isCurrentUser ? "bg-red-50" : ""}>
      <TableCell className="font-medium text-center">{getRankIndicator(player.rank)}</TableCell>
      <TableCell>
        <div className="flex items-center">
          <Avatar className="h-10 w-10 mr-4">
            <AvatarImage src={player.avatar || "/placeholder.svg"} alt={player.name} />
            <AvatarFallback>
              {player.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{player.name}</p>
            <p className="text-sm text-gray-500">{player.team}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right font-semibold">${player.revenue.toLocaleString()}</TableCell>
      <TableCell className="text-right font-semibold">{player.signups}</TableCell>
    </TableRow>
  )
}
