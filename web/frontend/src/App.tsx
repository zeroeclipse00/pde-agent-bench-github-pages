import Navbar from "./sections/Navbar";
import Hero from "./sections/Hero";
import Abstract from "./sections/Abstract";
import FigureGallery from "./sections/FigureGallery";
import PDETypes from "./sections/PDETypes";
import Leaderboard from "./sections/Leaderboard";
import ResultsExplorer from "./sections/ResultsExplorer";
import EvaluationPipeline from "./sections/EvaluationPipeline";
import KeyFindings from "./sections/KeyFindings";
import ErrorAnalysis from "./sections/ErrorAnalysis";
import GettingStarted from "./sections/GettingStarted";
import Citation from "./sections/Citation";
import Authors from "./sections/Authors";
import Affiliations from "./sections/Affiliations";
import Footer from "./sections/Footer";
import PaperReader from "./sections/PaperReader";
import { useEffect, useState } from "react";

function getRoute() {
  return window.location.hash.replace(/^#/, "").split("?")[0];
}

export default function App() {
  const [route, setRoute] = useState<string>(getRoute());

  useEffect(() => {
    const onHash = () => setRoute(getRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (route === "/paper" || route === "paper") {
    return <PaperReader />;
  }

  return (
    <div className="min-h-screen bg-white text-ink-900">
      <Navbar />
      <main>
        <Hero />
        <Abstract />
        <FigureGallery />
        <PDETypes />
        <Leaderboard />
        <ResultsExplorer />
        <EvaluationPipeline />
        <KeyFindings />
        <ErrorAnalysis />
        <GettingStarted />
        <Citation />
        <Authors />
        <Affiliations />
      </main>
      <Footer />
    </div>
  );
}
