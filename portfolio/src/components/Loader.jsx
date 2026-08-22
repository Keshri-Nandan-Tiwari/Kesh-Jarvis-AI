import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const STAGES = ["ready", "hello", "name", "done"];
const STAGE_DURATIONS = { ready: 1400, hello: 1000, name: 1600 };

export default function Loader({ onFinish }) {
  const [stageIndex, setStageIndex] = useState(0);
  const stage = STAGES[stageIndex];

  useEffect(() => {
    if (stage === "done") {
      const t = setTimeout(onFinish, 500);
      return () => clearTimeout(t);
    }
    const duration = STAGE_DURATIONS[stage];
    const t = setTimeout(() => setStageIndex((i) => i + 1), duration);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const skip = () => {
    setStageIndex(STAGES.length - 1);
  };

  const nameWords = ["I", "am", "KESHRI"];

  return (
    <AnimatePresence>
      {stage !== "done" && (
        <motion.div
          className="loader"
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <div className="loader-stage">
            <AnimatePresence mode="wait">
              {stage === "ready" && (
                <motion.div
                  key="ready"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24, transition: { duration: 0.35 } }}
                  transition={{ duration: 0.5 }}
                  className="loader-ready"
                >
                  Ready to begin?
                </motion.div>
              )}

              {stage === "hello" && (
                <motion.div
                  key="hello"
                  initial={{ opacity: 0, y: -140, scale: 1.4 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { type: "spring", stiffness: 260, damping: 14 },
                  }}
                  exit={{ opacity: 0, y: 60, transition: { duration: 0.3 } }}
                  className="loader-hello"
                >
                  HELLO!
                </motion.div>
              )}

              {stage === "name" && (
                <motion.div
                  key="name"
                  className="loader-imkeshri"
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, scale: 1.1, transition: { duration: 0.35 } }}
                >
                  {nameWords.map((w, i) => (
                    <motion.span
                      key={w}
                      style={{
                        display: "inline-block",
                        marginRight: "0.4em",
                        color: w === "KESHRI" ? "var(--highlight)" : "inherit",
                      }}
                      initial={{ opacity: 0, y: -160, rotate: -8 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        rotate: 0,
                        transition: {
                          delay: i * 0.28,
                          type: "spring",
                          stiffness: 300,
                          damping: 13,
                        },
                      }}
                    >
                      {w}
                    </motion.span>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="loader-dots">
            {STAGES.slice(0, 3).map((s, i) => (
              <span key={s} className={`loader-dot ${i <= stageIndex ? "active" : ""}`} />
            ))}
          </div>

          <button className="loader-skip" onClick={skip}>
            Skip →
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
