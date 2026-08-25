import { LogOut, LayoutDashboard } from "lucide-react";
import type { UserProfile } from "../types";
import { ScreenId } from "../types";
import { screenToPath } from "../navigation";

interface LoggedInLoginPromptProps {
  user: UserProfile;
  onContinue: () => void;
  onLogout: () => void;
}

export default function LoggedInLoginPrompt({ user, onContinue, onLogout }: LoggedInLoginPromptProps) {
  return (
    <div className="key-auth-canvas h-full min-h-0 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1f2e] p-8 text-center shadow-2xl">
        <h1 className="text-xl font-bold text-white">Already signed in</h1>
        <p className="mt-3 text-sm text-slate-300">
          You are logged in as <strong className="text-white">{user.email || user.name}</strong>.
        </p>
        <p className="mt-2 text-xs text-slate-400">
          To use a different account, sign out first. Browser Back will not show the login form while a session is
          active.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button type="button" className="key-btn-primary w-full py-3" onClick={onContinue}>
            <LayoutDashboard className="h-4 w-4" />
            Continue to Dashboard
          </button>
          <button type="button" className="key-btn-secondary w-full py-3" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
        <p className="mt-4 text-[11px] text-slate-500">{screenToPath(ScreenId.LOGIN)}</p>
      </div>
    </div>
  );
}
