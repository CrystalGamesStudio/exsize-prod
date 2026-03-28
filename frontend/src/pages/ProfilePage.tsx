import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProfile, getChildProfile, type UserResponse, type ProfileResponse } from "@/api";

interface ProfilePageProps {
  user: UserResponse;
}

export default function ProfilePage({ user }: ProfilePageProps) {
  const { childId } = useParams<{ childId: string }>();
  const childIdNum = childId ? Number(childId) : undefined;

  const { data: profile } = useQuery({
    queryKey: childIdNum ? ["child-profile", childIdNum] : ["profile"],
    queryFn: () => (childIdNum ? getChildProfile(childIdNum) : getProfile()),
    retry: false,
    enabled: user.role === "child" || (user.role === "parent" && childIdNum != null),
  });

  if (user.role === "parent" && childIdNum == null) {
    return <p>Select a child to view their profile.</p>;
  }

  if (user.role !== "child" && user.role !== "parent") {
    return <p>Profiles are for children only.</p>;
  }

  if (!profile) return null;

  return <ProfileView profile={profile} />;
}

function ProfileView({ profile }: { profile: ProfileResponse }) {
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
            {profile.badges.map((badge) => (
              <div
                key={badge}
                className="flex flex-col items-center gap-1 rounded-lg border border-primary bg-primary/10 p-3 text-center"
              >
                <span className="text-xs font-medium">{badge}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <div className="space-y-3">
              {profile.transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{txn.description}</p>
                    <p className="text-xs text-muted-foreground">{txn.type}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${txn.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {txn.amount >= 0 ? `+${txn.amount}` : `${txn.amount}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(txn.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
