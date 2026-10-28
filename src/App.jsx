import AsciiField from './components/AsciiField.jsx';

export default function App() {
  const year = new Date().getFullYear();

  return (
    <>
      <AsciiField />

      <header className="wrap header">
        <a href="#top" className="logo">wyind</a>
        <nav className="nav">
          <a href="#about">About</a>
          <a href="#projects">Projects</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main className="wrap" id="top">

        <section className="hero">
          <img className="avatar" src="/avatar.jpg" alt="wyind" width="72" height="72" />

          <h1>wyind</h1>
          <p className="tagline">I tinker with Linux, build browsers, and make terminal tools. Usually at 2am.</p>

          <p className="links">
            <a href="https://github.com/Wyind" target="_blank" rel="noopener">GitHub &#8599;</a>
            <a href="https://x.com/wyindszn" target="_blank" rel="noopener">X / Twitter &#8599;</a>
            <a href="#projects">Projects</a>
          </p>
        </section>

        <section id="about">
          <h2>## about</h2>
          <div className="prose">
            <p>
              Hey, I'm <strong>wyind.</strong> I make stuff for Linux. Mostly browsers, TUI tools, and whatever else sounds fun at 2am.
            </p>
            <p>
              My daily driver is a desktop running <strong>Ubuntu 26.04</strong>. The <strong>ThinkPad X13 Gen 2</strong> is a separate setup and stays on Fedora. There's also a <strong>T420</strong> sitting in a box with a broken screen &mdash; I'll fix it eventually, who really cares :)
            </p>
            <p>
              I'm really into <strong>right to repair</strong>. Things should be built to last, be fixable, and not need a subscription to exist. Same reason I love <strong>Casio watches</strong> and ThinkPads: honest, durable, repairable hardware. I keep thinking about a <strong>Fairphone 6</strong>, but I haven't committed yet.
            </p>
            <p>
              Outside of games and code, I like cat gifs quite a bit.
            </p>
          </div>

          <h3>What I'm running</h3>
          <ul className="specs">
            <li><span>os</span> Ubuntu 26.04.1 LTS</li>
            <li><span>host</span> wyind@fucksnaps &middot; desktop PC</li>
            <li><span>laptop</span> ThinkPad X13 Gen 2 &middot; Fedora</li>
            <li><span>cpu</span> Intel i9-9900K &middot; 8c / 16t</li>
            <li><span>gpu</span> NVIDIA RTX 3080</li>
            <li><span>ram</span> 48 GB</li>
            <li><span>editor</span> nvim / aether</li>
            <li><span>langs</span> C, Rust, Go, Python, Bash</li>
          </ul>
        </section>

        <section id="projects">
          <h2>## projects</h2>
          <p className="projects-intro">
            <img src="/abyss_software_logo_transparent_arrow.svg" alt="" width="20" height="20" />
            <span>Everything below lives under <a href="https://github.com/abysssoftware-dev" target="_blank" rel="noopener">Abyss Software &#8599;</a>, where my stuff ends up.</span>
          </p>

          <ul className="project-list">
            <li>
              <h3>Umbra Browser</h3>
              <p>A browser I'm building from scratch. Fast, private, and mine.</p>
              <a href="https://umbra-browser.org" target="_blank" rel="noopener">umbra-browser.org &#8599;</a>
            </li>

            <li>
              <h3>ascii-studio</h3>
              <p>Make ASCII art, avatars, and banners in your terminal.</p>
              <a href="https://github.com/Wyind/ascii-studio" target="_blank" rel="noopener">github.com/Wyind/ascii-studio &#8599;</a>
            </li>

            <li>
              <h3>aether</h3>
              <p>A TUI text editor. It lives in the terminal.</p>
              <a href="https://github.com/Wyind/aether" target="_blank" rel="noopener">github.com/Wyind/aether &#8599;</a>
            </li>
          </ul>
        </section>

        <section id="contact">
          <h2>## contact</h2>
          <p className="prose">If you want to talk about Linux, browsers, or open source, I'm easy to find.</p>
          <p className="links">
            <a href="https://github.com/Wyind" target="_blank" rel="noopener">GitHub &#8599;</a>
            <a href="https://x.com/wyindszn" target="_blank" rel="noopener">X / Twitter &#8599;</a>
          </p>
        </section>

      </main>

      <footer>
        <div className="wrap footer">
          <span>&copy; {year} wyind</span>
          <span>view source is encouraged</span>
        </div>
      </footer>
    </>
  );
}
