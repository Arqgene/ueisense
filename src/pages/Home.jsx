import Navbar from "../components/Navbar.jsx";
import Hero from "../components/Hero.jsx";
import ClinicalProblem from "../components/ClinicalProblem.jsx";
import Pipeline from "../components/Pipeline.jsx";
import DashboardPreview from "../components/DashboardPreview.jsx";
import Explainability from "../components/Explainability.jsx";
import RecurrenceEngine from "../components/RecurrenceEngine.jsx";
import NoveltyGrid from "../components/NoveltyGrid.jsx";
import CTA from "../components/CTA.jsx";
import Footer from "../components/Footer.jsx";

export default function Home() {
  return (
    <div className="app-shell">
      <Navbar />
      <main>
        <Hero />
        <ClinicalProblem />
        <Pipeline />
        <DashboardPreview />
        <Explainability />
        <RecurrenceEngine />
        <NoveltyGrid />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
