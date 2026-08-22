import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FACTS } from "../data/content";

export default function LoopingFacts() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % FACTS.length), 2200);
    return () => clearInterval(t);
  }, []);

  const current = FACTS[index];

  return (
    <section id="about">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">A little about me</span>
          <h2>One fact at a time.</h2>
        </div>

        <div className="facts-stage">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              className={`facts-word ${current.weight}`}
              initial={{ opacity: 0, y: 26, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -26, filter: "blur(6px)" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {current.text}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
