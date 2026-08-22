import { motion } from "framer-motion";
import { SKILLS } from "../data/content";

export default function Skills() {
  return (
    <section id="skills" style={{ background: "var(--bg-alt)" }}>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Toolbox</span>
          <h2>What I build with.</h2>
        </div>

        <motion.div
          className="skills-grid"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          {SKILLS.map((s) => (
            <span className="skill-chip" key={s}>
              {s}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
