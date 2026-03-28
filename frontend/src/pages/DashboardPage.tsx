import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboard, type UserResponse, type DashboardDayChild } from "@/api";

interface DashboardPageProps {
  user: UserResponse;
}

export default function DashboardPage({ user }: DashboardPageProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    retry: false,
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {data && data.children.length === 0 && (
        <p className="text-muted-foreground">No children in your family yet.</p>
      )}

      {data && data.children.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.children.map((child) => (
            <Card key={child.id}>
              <CardHeader>
                <CardTitle>{child.email}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Tasks completed</span>
                    <p className="text-lg font-semibold">{child.tasks_completed_percent}%</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Streak</span>
                    <p className="text-lg font-semibold">{child.streak}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Earned</span>
                    <p className="text-lg font-semibold">{child.exbucks_earned}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Spent</span>
                    <p className="text-lg font-semibold">{child.exbucks_spent}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data && Object.keys(data.weekly_overview).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {DAYS.map((day) => {
                const entries = data.weekly_overview[day] ?? [];
                return (
                  <div key={day} className="flex items-start gap-4">
                    <span className="w-24 shrink-0 font-medium">{day}</span>
                    <div className="flex flex-wrap gap-2">
                      {entries.length === 0 ? (
                        <span className="text-sm text-muted-foreground">—</span>
                      ) : (
                        entries.map((entry) => (
                          <span
                            key={entry.child_id}
                            className="rounded bg-muted px-2 py-1 text-sm"
                          >
                            {entry.email}: {entry.approved}/{entry.total}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
