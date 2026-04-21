import "../src/globals.css";

/**
 * Wrap every rendered component in the RoadTest preview environment.
 * Add providers, themes, or global styles here — anything that your
 * components expect to exist at runtime.
 */
export default function Wrapper({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: "inherit", color: "inherit" }}>{children}</div>;
}
