// TRAXXR VIP access landing page — standalone prospect lander.
// Served at https://traxxr.com/vip-access. Pure server component, no client JS.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TRAXXR | One link and one code for everything you make",
  description:
    "Dynamic QR codes you can edit after printing, a branded link in bio, analytics, lead capture, and in-house print. One tool, not five.",
};

const css = `
  .traxxr-vip{
    --bg:#FFFFFF;
    --surface:#FFFFFF;
    --surface-2:#F5F7FA;
    --text:#0A2540;
    --muted:#5A6B86;
    --accent:#2587DE;        /* TRAXXR brand blue */
    --accent-2:#1E88E5;
    --accent-ink:#FFFFFF;
    --accent-soft:rgba(37,135,222,.10);
    --accent-line:rgba(37,135,222,.28);
    --border:#E4EAF5;
    --shadow:0 6px 20px rgba(10,37,64,.06);
    --radius:16px;
    --maxw:520px;
    --font:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    background:
      radial-gradient(800px 360px at 50% -160px, rgba(37,135,222,.06), transparent 70%),
      var(--bg);
    color:var(--text);font-family:var(--font);line-height:1.5;
    -webkit-font-smoothing:antialiased;min-height:100vh;
  }
  .traxxr-vip *{box-sizing:border-box;margin:0;padding:0}
  .traxxr-vip a{color:inherit;text-decoration:none}
  .traxxr-vip .wrap{max-width:var(--maxw);margin:0 auto;padding:0 20px}
  .traxxr-vip header{padding:24px 0 6px;text-align:center}
  .traxxr-vip .logo-img{height:26px;width:auto;display:inline-block}
  .traxxr-vip .hero{padding:34px 0 26px;text-align:center}
  .traxxr-vip .badge{display:inline-block;font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--accent);background:#FFFFFF;border:1px solid var(--border);border-radius:999px;padding:7px 15px;margin-bottom:18px;box-shadow:var(--shadow)}
  .traxxr-vip h1{font-size:30px;line-height:1.18;font-weight:800;letter-spacing:-.4px}
  .traxxr-vip h1 .hl{color:var(--accent)}
  .traxxr-vip .sub{color:var(--muted);font-size:16px;margin-top:14px}
  .traxxr-vip .btn{display:block;width:100%;text-align:center;font-weight:700;font-size:16px;padding:16px 18px;border-radius:var(--radius);margin-top:14px}
  .traxxr-vip .btn-primary{background:linear-gradient(135deg,var(--accent),var(--accent-2));color:var(--accent-ink);box-shadow:0 8px 24px rgba(37,135,222,.35)}
  .traxxr-vip .btn-secondary{background:#FFFFFF;color:var(--text);border:1px solid var(--border);box-shadow:var(--shadow)}
  .traxxr-vip .cta-note{color:var(--muted);font-size:13px;margin-top:10px;text-align:center}
  .traxxr-vip section{padding:30px 0}
  .traxxr-vip .eyebrow{color:var(--accent);font-size:13px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase}
  .traxxr-vip h2{font-size:22px;font-weight:800;margin-top:8px;letter-spacing:-.2px}
  .traxxr-vip .lead{color:var(--muted);font-size:15px;margin-top:10px}
  .traxxr-vip .cards{display:flex;flex-direction:column;gap:12px;margin-top:18px}
  .traxxr-vip .card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;box-shadow:var(--shadow)}
  .traxxr-vip .card h3{font-size:16px;font-weight:700;display:flex;align-items:center;gap:10px}
  .traxxr-vip .dot{width:9px;height:9px;border-radius:50%;background:var(--accent);flex:none}
  .traxxr-vip .card p{color:var(--muted);font-size:14px;margin-top:7px}
  .traxxr-vip .steps{counter-reset:s;margin-top:18px;display:flex;flex-direction:column;gap:14px}
  .traxxr-vip .step{display:flex;gap:14px;align-items:flex-start}
  .traxxr-vip .step .n{counter-increment:s;flex:none;width:30px;height:30px;border-radius:50%;background:var(--accent);color:var(--accent-ink);font-weight:800;display:flex;align-items:center;justify-content:center;font-size:14px}
  .traxxr-vip .step .n::before{content:counter(s)}
  .traxxr-vip .step p{font-size:15px}
  .traxxr-vip .step p b{color:var(--text)}
  .traxxr-vip .step p span{color:var(--muted);display:block;font-size:13px;margin-top:2px}
  .traxxr-vip .artist{background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius);padding:22px;margin-top:6px;box-shadow:var(--shadow)}
  .traxxr-vip .artist h2{font-size:20px}
  .traxxr-vip .artist ul{list-style:none;margin-top:14px;display:flex;flex-direction:column;gap:9px}
  .traxxr-vip .artist li{font-size:14px;color:var(--muted);padding-left:24px;position:relative}
  .traxxr-vip .artist li::before{content:"";position:absolute;left:0;top:7px;width:10px;height:10px;border-radius:50%;background:var(--accent)}
  .traxxr-vip .final{text-align:center;padding:40px 0 16px}
  .traxxr-vip .final h2{font-size:24px}
  .traxxr-vip footer{border-top:1px solid var(--border);padding:26px 0 40px;text-align:center;color:var(--muted);font-size:13px}
  .traxxr-vip footer .logo-img{height:18px;opacity:.65;margin-bottom:10px}
  @media(min-width:560px){ .traxxr-vip h1{font-size:36px} }
`;

const SIGNUP_URL = "/signup";

export default function VipAccessPage() {
  return (
    <main className="traxxr-vip">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="wrap">
        <header>
          <a href="/" aria-label="TRAXXR home">
            <img className="logo-img" src="/traxxr-logo.png" alt="TRAXXR" />
          </a>
        </header>

        <div className="hero">
          <div className="badge">14 days of Growth free. No card.</div>
          <h1>
            One link and one code for{" "}
            <span className="hl">everything you make</span>.
          </h1>
          <p className="sub">
            A branded page for all your links, plus QR codes you can edit after
            they are printed. Every scan, click, and lead tracked in one place.
          </p>
          <a className="btn btn-primary" href={SIGNUP_URL}>
            Build your free page
          </a>
          <a className="btn btn-secondary" href="/">
            See how it works
          </a>
          <p className="cta-note">Free forever plan available. Upgrade anytime.</p>
        </div>

        <section>
          <div className="eyebrow">The unfair advantage</div>
          <h2>A printed TRAXXR code is never wrong.</h2>
          <p className="lead">
            Static QR codes are locked the second they are printed. Change the
            link and you reprint everything. TRAXXR codes are re-pointable
            forever, so you change the destination, not the print.
          </p>
        </section>

        <section>
          <div className="eyebrow">One tool, not five</div>
          <h2>Everything you were paying for separately.</h2>
          <div className="cards">
            <div className="card">
              <h3>
                <span className="dot"></span>Dynamic QR codes
              </h3>
              <p>
                Edit where any code points anytime, even after it is on a
                sticker, a sign, or a flash sheet. No reprints.
              </p>
            </div>
            <div className="card">
              <h3>
                <span className="dot"></span>Link in bio, your @handle
              </h3>
              <p>
                Booking, shop, socials, and a signup form on one branded page
                with its own QR built in.
              </p>
            </div>
            <div className="card">
              <h3>
                <span className="dot"></span>Analytics
              </h3>
              <p>
                Scans and clicks over time, top performers, locations, and
                devices. Stop guessing what works.
              </p>
            </div>
            <div className="card">
              <h3>
                <span className="dot"></span>Lead capture
              </h3>
              <p>
                Turn any code or page into a signup form, tagged by exactly where
                it came from.
              </p>
            </div>
            <div className="card">
              <h3>
                <span className="dot"></span>Print and Ship
              </h3>
              <p>
                Order your codes as real decals and signs, printed in house and
                shipped to you.
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="artist">
            <div className="eyebrow">Built for makers</div>
            <h2>Your flash sheet should do more than sit there.</h2>
            <ul>
              <li>Put a TRAXXR QR on your flash, prints, and merch.</li>
              <li>It links to booking, your shop, and your socials at once.</li>
              <li>Re-point it when your books open or close. No reprint.</li>
              <li>See exactly how many people scanned it.</li>
            </ul>
            <a
              className="btn btn-primary"
              href={SIGNUP_URL}
              style={{ marginTop: 18 }}
            >
              Claim your @handle
            </a>
          </div>
        </section>

        <section>
          <div className="eyebrow">Live in minutes</div>
          <h2>How it works.</h2>
          <div className="steps">
            <div className="step">
              <div className="n"></div>
              <p>
                <b>Claim your @handle</b>
                <span>Your name, your page, your colors and fonts.</span>
              </p>
            </div>
            <div className="step">
              <div className="n"></div>
              <p>
                <b>Add your links and design your code</b>
                <span>
                  Booking, shop, socials, a signup form, and a QR you actually
                  want to show.
                </span>
              </p>
            </div>
            <div className="step">
              <div className="n"></div>
              <p>
                <b>Share, print, and track</b>
                <span>
                  Put it anywhere, re-point it anytime, and watch every scan.
                </span>
              </p>
            </div>
          </div>
        </section>

        <div className="final">
          <h2>Start free in two minutes.</h2>
          <p className="lead">
            14 days of Growth, no credit card. Lapses to a free plan
            automatically.
          </p>
          <a className="btn btn-primary" href={SIGNUP_URL}>
            Build your free page
          </a>
        </div>
      </div>

      <footer>
        <div className="wrap">
          <img className="logo-img" src="/traxxr-logo.png" alt="TRAXXR" />
          <br />
          One platform for every code and link your business prints.
          <br />
          <a href="/" style={{ color: "var(--accent)" }}>
            traxxr.com
          </a>
        </div>
      </footer>
    </main>
  );
}
