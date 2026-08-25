import { ArrowLeft, Home } from "lucide-react";
import { ScreenId } from "../types";
import PageShell, { PageHeader } from "./layout/PageShell";

interface NotFoundScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export default function NotFoundScreen({ onNavigate }: NotFoundScreenProps) {
  return (
    <PageShell>
      <PageHeader
        title="Page not found"
        subtitle="This address is not part of KEYLINK360. Use the menu or go back to your dashboard."
      />
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="key-btn-primary !w-auto px-5 py-2.5"
          onClick={() => onNavigate(ScreenId.DASHBOARD)}
        >
          <Home className="h-4 w-4" />
          Go to Dashboard
        </button>
        <button
          type="button"
          className="key-btn-secondary !w-auto px-5 py-2.5"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Go back
        </button>
        <button
          type="button"
          className="key-btn-secondary !w-auto px-5 py-2.5"
          onClick={() => onNavigate(ScreenId.HELP_CENTER)}
        >
          Help Center
        </button>
      </div>
    </PageShell>
  );
}
