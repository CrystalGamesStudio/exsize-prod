import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGamificationProfile, type UserResponse } from "@/api";

interface ProfilePageProps {
  user: UserResponse;
}

export default function ProfilePage({ user }: ProfilePageProps) {
  const { data: profile } = useQuery({
    queryKey: ["gamification-profile"],
    queryFn: getGamificationProfile,
    retry: false,
    enabled: user.role === "child",
  });

  if (user.role !== "child") {
    return <p>Gamification profiles are for children only.</p>;
  }

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Level {profile.level}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">{profile.level_name}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {profile.xp} XP &middot; {profile.xp_for_next_level} XP to next level
          </p>
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{profile.progress_percent}%</span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={profile.progress_percent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-3 w-full overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${profile.progress_percent}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Streak</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {profile.streak} day streak
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Badges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
            {BADGES.map((badge) => {
              const earned = badge.earned;
              return (
                <div
                  key={badge.name}
                  data-badge
                  {...(!earned ? { "data-locked": "" } : {})}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center ${
                    earned
                      ? "border-primary bg-primary/10"
                      : "border-muted bg-muted/30 opacity-50"
                  }`}
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <span className="text-xs font-medium">{badge.name}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const BADGES = [
  { name: "Freemium", icon: "\u2B50", earned: true },
  { name: "First Task", icon: "\u2705", earned: false },
  { name: "Week Warrior", icon: "\uD83D\uDD25", earned: false },
  { name: "Level 10", icon: "\uD83C\uDFC6", earned: false },
  { name: "Big Spender", icon: "\uD83D\uDCB0", earned: false },
  { name: "Streak Master", icon: "\u26A1", earned: false },
];
