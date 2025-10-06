import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusCard } from "@/components/ui/status-card"
import { Users, Calendar, Clock, TrendingUp } from "lucide-react"

export default function DashboardPage() {
  const stats = [
    {
      title: "Total Employees",
      status: "248",
      subtitle: "+12 this month",
      icon: Users,
      statusColor: "primary" as const,
    },
    {
      title: "Pending Requests",
      status: "18",
      subtitle: "5 urgent",
      icon: Calendar,
      statusColor: "warning" as const,
    },
    {
      title: "Active Projects",
      status: "32",
      subtitle: "8 due this week",
      icon: TrendingUp,
      statusColor: "success" as const,
    },
    {
      title: "Avg. Attendance",
      status: "94.2%",
      subtitle: "+2.1% from last month",
      icon: Clock,
      statusColor: "info" as const,
    },
  ]

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h2>
        <p className="text-sm text-muted-foreground md:text-base">Overview of your organization's key metrics</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatusCard
            key={stat.title}
            title={stat.title}
            status={stat.status}
            subtitle={stat.subtitle}
            icon={stat.icon}
            statusColor={stat.statusColor}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-l-4 border-l-primary bg-gradient-to-br from-card to-muted/20">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { user: "Sarah Johnson", action: "submitted a leave request", time: "2 hours ago" },
                { user: "Mike Chen", action: "completed Project Alpha milestone", time: "4 hours ago" },
                { user: "Emma Davis", action: "clocked in", time: "5 hours ago" },
                { user: "James Wilson", action: "uploaded expense report", time: "6 hours ago" },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {activity.user.charAt(0)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user}</span>{" "}
                      <span className="text-muted-foreground">{activity.action}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary bg-gradient-to-br from-card to-muted/20">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: "Team Meeting", date: "Today, 2:00 PM", type: "Meeting" },
                { title: "Project Deadline: Beta Release", date: "Tomorrow", type: "Deadline" },
                { title: "Sarah Johnson - Annual Leave", date: "Dec 20-27", type: "Leave" },
                { title: "Quarterly Review", date: "Dec 31", type: "Review" },
              ].map((event, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-medium">
                    {event.date.split(" ")[0].slice(0, 3)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.date}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    {event.type}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
