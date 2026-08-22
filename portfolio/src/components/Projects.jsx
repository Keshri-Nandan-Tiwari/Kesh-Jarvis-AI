import { motion } from "framer-motion";
import { PROJECTS } from "../data/content";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.55 } } };

export default function Projects() {
  return (
    <section id="projects">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Selected work</span>
          <h2>Things I've shipped.</h2>
        </div>

        <motion.div
          className="projects-grid"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          {PROJECTS.map((p) => (
            <motion.div className="card project-card" variants={item} key={p.title}>
              <span className="project-tag">{p.tag}</span>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
              <div className="project-stack">
                {p.stack.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
