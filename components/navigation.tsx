// Note: This component is not currently used in the app

import { Bell, Trophy, Users, Target, BarChart2, Settings, Video, X } from "lucide-react"

// Placeholder types since this component is unused
interface User {
  id: string;
  name: string;
  avatar?: string;
}

interface Notification {
  id: string;
  isRead: boolean | Record<string, boolean>;
}

// Simple utility function
const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ');

interface NavigationProps {
  currentUser: User | null
  currentPage: string
  onPageChange: (page: string) => void
  notifications: Notification[]
  onMarkAsRead: (notificationId: string, userId: string) => void
  onDismiss: (notificationId: string, userId: string) => void
  onToggleVideoDisplay: () => void
  isVideoDisplayActive: boolean
}

export function Navigation({
  currentUser,
  currentPage,
  onPageChange,
  notifications,
  onMarkAsRead,
  onDismiss,
  onToggleVideoDisplay,
  isVideoDisplayActive,
}: NavigationProps) {
  const unreadCount =
    currentUser && notifications
      ? notifications.filter((n) => {
          if (typeof n.isRead === "object") {
            return !n.isRead[currentUser.id]
          }
          return !n.isRead
        }).length
      : 0

  const navItems = [
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "my-goals", label: "My Goals", icon: Target },
    { id: "team-goals", label: "Team Goals", icon: Users },
    { id: "contest", label: "Contests", icon: BarChart2 },
  ]

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex-shrink-0">
              <img className="h-8 w-auto" src="/logo.png" alt="Rork" />
            </Link>
            <nav className="hidden md:flex space-x-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={cn(
                    "inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    currentPage === item.id
                      ? "bg-red-100 text-red-700"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
                  )}
                >
                  <item.icon className="mr-2 h-5 w-5" />
                  {item.label}
                </button>
              ))}
              {currentUser?.role === "admin" && (
                <Link
                  href="/admin"
                  className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                  <Settings className="mr-2 h-5 w-5" />
                  Admin
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleVideoDisplay}
              className={cn(isVideoDisplayActive && "bg-red-100 text-red-700")}
            >
              <Video className="h-5 w-5" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-600 ring-2 ring-white" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="p-4">
                  <h3 className="text-lg font-medium">Notifications</h3>
                  <div className="mt-4 space-y-4">
                    {notifications && notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div key={notif.id} className="flex items-start space-x-3">
                          <div className="flex-1">
                            <p className="font-semibold">{notif.title}</p>
                            <p className="text-sm text-gray-500">{notif.message}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => currentUser && onDismiss(notif.id, currentUser.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No new notifications.</p>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            {currentUser && (
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarImage src={currentUser.profilePicture || "/placeholder.svg"} alt={currentUser.name} />
                  <AvatarFallback>
                    {currentUser.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{currentUser.name}</p>
                  <p className="text-xs text-gray-500">{currentUser.role.replace("_", " ")}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
