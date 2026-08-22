import { THEMES, useTheme } from "../ThemeContext";
import { PROFILE } from "../data/content";

export default function Nav() {
  const { theme, setTheme } = useTheme();

  return (
    <nav className="nav">
      <div className="nav-inner">
        <div className="brand font-display">
          KT<span className="brand-dot" />
        </div>

        <div className="nav-links nav-mobile-hide">
          <a href="#about">About</a>
          <a href="#skills">Skills</a>
          <a href="#projects">Projects</a>
          <a href="#contact">Contact</a>
        </div>

        <div className="theme-switch" role="tablist" aria-label="Theme">
          {Object.values(THEMES).map((t) => (
            <button
              key={t.id}
              className={`theme-dot ${theme === t.id ? "active" : ""}`}
              style={{ background: t.swatch }}
              onClick={() => setTheme(t.id)}
              title={t.label}
              aria-label={t.label}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}
