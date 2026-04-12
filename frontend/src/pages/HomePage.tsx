import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const [dark, setDark] = useState(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored) return stored === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {}
  }, [dark]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <span className="text-xl font-bold text-sky-600">ExSize</span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDark((d) => !d)}
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Link to="/login">
            <Button variant="outline" size="sm">
              Login
            </Button>
          </Link>
          <Link to="/register">
            <Button size="sm">Register</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-20 pb-16 max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Make chores fun for the whole family
        </h1>
        <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 max-w-xl">
          ExSize turns daily tasks into a rewarding game. Parents assign tasks,
          kids complete them, earn ExBucks, level up, and unlock rewards.
        </p>
        <div className="mt-8 flex gap-3">
          <Link to="/register">
            <Button size="lg">Get started</Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg">
              I have an account
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <div className="grid gap-8 sm:grid-cols-3">
          <FeatureCard
            icon="📝"
            title="Task Management"
            desc="Parents create and assign weekly tasks. Kids check them off as they go."
          />
          <FeatureCard
            icon="💰"
            title="ExBucks & Rewards"
            desc="Earn virtual currency for completed tasks. Spend it in the avatar shop."
          />
          <FeatureCard
            icon="🏆"
            title="Streaks & Levels"
            desc="Keep the streak alive! Level up, earn badges, and climb the family leaderboard."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="text-center px-6 py-16">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Ready to make tasks exciting?
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Create a free account and start today.</p>
        <Link to="/register">
          <Button size="lg" className="mt-6">
            Create account
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-400 dark:text-gray-600 py-8 border-t dark:border-gray-800">
        ExSize &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border bg-white dark:bg-gray-800 p-6 text-center shadow-sm">
      <div className="text-4xl">{icon}</div>
      <h3 className="mt-3 font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{desc}</p>
    </div>
  );
}
