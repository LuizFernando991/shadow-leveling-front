import { useState, useEffect } from "react";

export function useTimer(initialElapsed = 0) {
  const [elapsed, setElapsed] = useState(initialElapsed);

  useEffect(() => {
    const start = Date.now();
    const t = setInterval(
      () =>
        setElapsed(initialElapsed + Math.floor((Date.now() - start) / 1000)),
      1000,
    );
    return () => clearInterval(t);
  }, [initialElapsed]);

  return elapsed;
}
