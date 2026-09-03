import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Ticker from "@/components/Ticker";
import Philosophy from "@/components/Philosophy";
import Pipeline from "@/components/Pipeline";
import Playground from "@/components/Playground";
import Benchmarks from "@/components/Benchmarks";
import StackTable from "@/components/StackTable";
import Install from "@/components/Install";
import Integrations from "@/components/Integrations";
import ModelCard from "@/components/ModelCard";
import Footer from "@/components/Footer";
import CornerChat from "@/components/CornerChat";
import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const card = (e.target as HTMLElement).closest?.(".card-sheen") as HTMLElement | null;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--my", `${e.clientY - rect.top}px`);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className="grain relative min-h-screen bg-bg text-ink">
      <Nav />
      <main>
        <Hero />
        <Ticker />
        <Philosophy />
        <Pipeline />
        <Playground />
        <Benchmarks />
        <StackTable />
        <Install />
        <Integrations />
        <ModelCard />
      </main>
      <Footer />
      <CornerChat />
    </div>
  );
}
