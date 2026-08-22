import { useState } from "react";
import "./index.css";
import "./App.css";
import { ThemeProvider } from "./ThemeContext";
import Loader from "./components/Loader";
import Scene3D from "./components/Scene3D";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import LoopingFacts from "./components/LoopingFacts";
import Skills from "./components/Skills";
import Projects from "./components/Projects";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

export default function App() {
  const [loading, setLoading] = useState(true);

  return (
    <ThemeProvider>
      {loading && <Loader onFinish={() => setLoading(false)} />}
      <Scene3D />
      <Nav />
      <Hero />
      <Marquee />
      <LoopingFacts />
      <Skills />
      <Projects />
      <Contact />
      <Footer />
    </ThemeProvider>
  );
}
