import { ConceptTest } from "@/components/concept-test/concept-test";

export default function Home() {
  return (
    <>
      {/* The flow renders in the browser; this gives crawlers and no-JS visitors a real heading. */}
      <noscript>
        <main style={{ maxWidth: 640, margin: "80px auto", padding: "0 16px", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
          <h1>Help us shape Portainer&apos;s Experience</h1>
          <p>Try Portainer V3 early and tell us what you really think. It takes 15–30 minutes, saves as you go, and every finisher gets a free Portainer t-shirt and swag pack.</p>
          <p>Please turn on JavaScript to take part.</p>
        </main>
      </noscript>
      <ConceptTest />
    </>
  );
}
