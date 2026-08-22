import { motion } from "framer-motion";
import { ArrowRight, MapPin } from "lucide-react";
import { PROFILE } from "../data/content";

export default function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="container hero-grid">
        <div>
          <motion.div
            className="hero-kicker"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <MapPin size={12} style={{ display: "inline", marginRight: 6 }} />
            {PROFILE.location}
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            Software <span className="hl">Engineer</span>
          </motion.h1>

          <motion.p
            className="hero-blurb"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
          >
            {PROFILE.blurb}
          </motion.p>

          <motion.div
            className="hero-cta"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
          >
            <a href="#contact" className="btn btn-primary">
              Get in touch <ArrowRight size={16} />
            </a>
            <a href="#projects" className="btn btn-ghost">
              See my work
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="hero-photo-wrap">
            {/* Swap src to your own photo once ready. */}
            <img
              src="https://api.dicebear.com/9.x/initials/svg?seed=Keshri%20Nandan%20Tiwari&backgroundColor=1c1c21&textColor=e6e6e6"
              alt="Keshri Nandan Tiwari"
            />
            <div className="hero-photo-badge">{PROFILE.name}</div>
          </div>

          <div className="hero-role-tags">
            {PROFILE.tags.map((t) => (
              <div className="tag-box" key={t}>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
