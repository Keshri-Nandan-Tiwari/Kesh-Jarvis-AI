import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { FaGithub, FaLinkedin, FaInstagram, FaXTwitter } from "react-icons/fa6";
import { PROFILE } from "../data/content";

export default function Contact() {
  return (
    <section id="contact" style={{ background: "var(--bg-alt)" }}>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Get in touch</span>
          <h2>Let's build something.</h2>
        </div>

        <motion.div
          className="card contact-panel"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
        >
          <div className="contact-left">
            <h3>Get in touch</h3>
            <p>
              If you have a role, project, or question in mind, reach out directly —
              I usually reply within a day.
            </p>

            <div className="contact-links">
              <div className="contact-link-row">
                <div className="c-icon">
                  <Mail size={18} />
                </div>
                <div>
                  <span>Email</span>
                  <a href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>
                </div>
              </div>
              <div className="contact-link-row">
                <div className="c-icon">
                  <FaGithub size={18} />
                </div>
                <div>
                  <span>GitHub</span>
                  <a href={PROFILE.github} target="_blank" rel="noopener noreferrer">
                    Keshri-Nandan-Tiwari
                  </a>
                </div>
              </div>
              <div className="contact-link-row">
                <div className="c-icon">
                  <FaLinkedin size={18} />
                </div>
                <div>
                  <span>LinkedIn</span>
                  <a href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer">
                    keshri-nandan-tiwari
                  </a>
                </div>
              </div>
              <div className="contact-link-row">
                <div className="c-icon">
                  <FaInstagram size={18} />
                </div>
                <div>
                  <span>Instagram</span>
                  <a href={PROFILE.instagram} target="_blank" rel="noopener noreferrer">
                    @keshri_08__
                  </a>
                </div>
              </div>
              <div className="contact-link-row">
                <div className="c-icon">
                  <FaXTwitter size={18} />
                </div>
                <div>
                  <span>X (Twitter)</span>
                  <a href={PROFILE.x} target="_blank" rel="noopener noreferrer">
                    @keshrinandan_08
                  </a>
                </div>
              </div>
            </div>
          </div>

          <form
            className="contact-right"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target;
              window.location.href = `mailto:${PROFILE.email}?subject=Portfolio contact from ${encodeURIComponent(
                form.name.value
              )}&body=${encodeURIComponent(form.message.value)}%0A%0A${encodeURIComponent(
                form.email.value
              )}`;
            }}
          >
            <div>
              <label htmlFor="name">Name</label>
              <input id="name" name="name" required />
            </div>
            <div>
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required />
            </div>
            <div>
              <label htmlFor="message">Message</label>
              <textarea id="message" name="message" required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ justifyContent: "center" }}>
              Send
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
