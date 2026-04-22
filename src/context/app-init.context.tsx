import { useState, type ReactNode } from "react";

import { LoadingOverlay } from "@/components/loading/LoadingOverlay";
import { useAuth } from "@/hooks/useAuth";

interface AppInitProviderProps {
  children: ReactNode;
}

/**
 * Gates the app behind a loading overlay until all initialization sources
 * are ready. Add new readiness checks here as more init data sources are introduced.
 */
export function AppInitProvider({ children }: AppInitProviderProps) {
  const { isReady: authReady } = useAuth();
  const [overlayExited, setOverlayExited] = useState(false);

  // Add future init readiness flags here:
  // const { isReady: profileReady } = useSomeOtherInit()
  const allReady = authReady;

  return (
    <>
      <LoadingOverlay
        canExit={allReady}
        onExited={() => setOverlayExited(true)}
      />
      {overlayExited && children}
    </>
  );
}
