// TRAXXR ambassador landing page (Deviant Ink) — served at /deviant-ambassadors
// Private / invite-only: noindex,nofollow. Not linked from public nav.
// Pure server component, no dependencies.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your free TRAXXR account",
  description:
    "For Deviant Ink ambassadors. The full TRAXXR Growth plan, free. All your stuff in one link.",
  robots: { index: false, follow: false },
};

const SIGNUP_URL = "/signup";

const css = `
  .traxxr-amb{
    --bg:#FFFFFF;
    --surface:#FFFFFF;
    --surface-2:#F5F7FA;
    --text:#0A2540;
    --muted:#5A6B86;
    --ink:#0A1124;
    --ink-2:#16264F;
    --accent:#2587DE;        /* TRAXXR brand blue */
    --accent-2:#5B8CFF;
    --accent-ink:#FFFFFF;
    --gold:#D9B36B;
    --accent-soft:rgba(37,135,222,.10);
    --border:#E4EAF5;
    --shadow:0 6px 20px rgba(10,37,64,.06);
    --radius:16px;
    --maxw:560px;
    --font:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    background:var(--bg);color:var(--text);font-family:var(--font);line-height:1.5;
    -webkit-font-smoothing:antialiased;display:block;min-height:100vh;
  }
  .traxxr-amb *{box-sizing:border-box;margin:0;padding:0}
  .traxxr-amb a{color:inherit;text-decoration:none}
  .traxxr-amb .wrap{max-width:var(--maxw);margin:0 auto;padding:0 20px}

  .traxxr-amb .vhero{
    background:
      radial-gradient(600px 300px at 50% -40px, rgba(37,135,222,.45), transparent 70%),
      linear-gradient(160deg, var(--ink) 0%, var(--ink-2) 100%);
    color:#EAF0FF;border-radius:0 0 28px 28px;padding:26px 22px 38px;text-align:center;
    box-shadow:0 20px 50px rgba(10,17,36,.28);
  }
  .traxxr-amb .logo-img{height:28px;width:auto;display:inline-block}
  .traxxr-amb .vipline{display:inline-flex;align-items:center;gap:10px;margin:18px 0 4px;font-size:11px;letter-spacing:2.4px;text-transform:uppercase;color:var(--gold);font-weight:700}
  .traxxr-amb .vipline::before,.traxxr-amb .vipline::after{content:"";width:26px;height:1px;background:var(--gold);opacity:.7}
  .traxxr-amb .seal{display:inline-block;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#0A1124;background:linear-gradient(135deg,#F0D6A6,var(--gold));border-radius:999px;padding:7px 16px;margin:10px 0 16px}
  .traxxr-amb .vhero h1{font-size:32px;line-height:1.12;font-weight:800;letter-spacing:-.4px;color:#fff}
  .traxxr-amb .vhero h1 .hl{color:var(--accent-2)}
  .traxxr-amb .vhero .sub{color:#B9C6E6;font-size:16px;margin-top:14px;max-width:450px;margin-left:auto;margin-right:auto}
  .traxxr-amb .btn{display:block;width:100%;text-align:center;font-weight:700;font-size:16px;padding:16px 18px;border-radius:var(--radius);margin-top:14px}
  .traxxr-amb .btn-primary{background:linear-gradient(135deg,var(--accent),var(--accent-2));color:#fff;box-shadow:0 10px 26px rgba(37,135,222,.45)}
  .traxxr-amb .btn-secondary{background:#FFFFFF;color:var(--text);border:1px solid var(--border);box-shadow:var(--shadow)}
  .traxxr-amb .vnote{color:#9DB0CE;font-size:13px;margin-top:12px}

  .traxxr-amb section{padding:30px 0}
  .traxxr-amb .eyebrow{color:var(--accent);font-size:13px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase}
  .traxxr-amb h2{font-size:22px;font-weight:800;margin-top:8px;letter-spacing:-.2px}
  .traxxr-amb .lead{color:var(--muted);font-size:15px;margin-top:10px}

  .traxxr-amb .phone{max-width:300px;margin:22px auto 0;background:var(--surface);border:1px solid var(--border);border-radius:28px;box-shadow:0 16px 40px rgba(10,37,64,.12);padding:20px 16px;text-align:center}
  .traxxr-amb .phone .ava{width:64px;height:64px;border-radius:50%;margin:4px auto 8px;background:linear-gradient(135deg,var(--accent),var(--accent-2))}
  .traxxr-amb .phone .nm{font-weight:800;font-size:15px}
  .traxxr-amb .phone .hd{color:var(--muted);font-size:12px;margin-bottom:14px}
  .traxxr-amb .phone .lnk{background:var(--surface-2);border:1px solid var(--border);border-radius:12px;padding:12px;font-weight:700;font-size:13px;margin-top:9px}
  .traxxr-amb .phone .lnk.acc{background:linear-gradient(135deg,var(--accent),var(--accent-2));color:#fff;border:none}

  .traxxr-amb .whatlist{display:flex;flex-direction:column;gap:10px;margin-top:18px}
  .traxxr-amb .whatrow{display:flex;gap:12px;align-items:flex-start;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;box-shadow:var(--shadow)}
  .traxxr-amb .whatrow .ic{flex:none;width:26px;height:26px;border-radius:8px;background:var(--accent-soft);color:var(--accent);font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center}
  .traxxr-amb .whatrow b{font-size:15px}
  .traxxr-amb .whatrow p{color:var(--muted);font-size:13px;margin-top:2px}

  .traxxr-amb .cards{display:flex;flex-direction:column;gap:12px;margin-top:18px}
  .traxxr-amb .card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;box-shadow:var(--shadow)}
  .traxxr-amb .card h3{font-size:16px;font-weight:700;display:flex;align-items:center;gap:10px}
  .traxxr-amb .dot{width:9px;height:9px;border-radius:50%;background:var(--accent);flex:none}
  .traxxr-amb .card p{color:var(--muted);font-size:14px;margin-top:7px}

  .traxxr-amb .steps{counter-reset:s;margin-top:18px;display:flex;flex-direction:column;gap:14px}
  .traxxr-amb .step{display:flex;gap:14px;align-items:flex-start}
  .traxxr-amb .step .n{counter-increment:s;flex:none;width:30px;height:30px;border-radius:50%;background:var(--accent);color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:14px}
  .traxxr-amb .step .n::before{content:counter(s)}
  .traxxr-amb .step p{font-size:15px}
  .traxxr-amb .step p b{color:var(--text)}
  .traxxr-amb .step p span{color:var(--muted);display:block;font-size:13px;margin-top:2px}

  .traxxr-amb .final{text-align:center;padding:40px 0 16px}
  .traxxr-amb .final h2{font-size:24px}

  .traxxr-amb footer{border-top:1px solid var(--border);padding:26px 0 40px;text-align:center;color:var(--muted);font-size:13px}
  .traxxr-amb footer .logo-img{height:18px;opacity:.65;margin-bottom:10px}
  @media(min-width:560px){ .traxxr-amb .vhero h1{font-size:40px} }
`;

export default function DeviantAmbassadorsPage() {
  return (
    <main className="traxxr-amb">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="vhero">
        <div className="wrap">
          <img className="logo-img" src="/traxxr-logo-white.png" alt="TRAXXR" />
          <div className="vipline">For Deviant Ink Ambassadors</div>
          <div className="seal">On the house</div>
          <h1>
            All your stuff, <span className="hl">one link.</span>
          </h1>
          <p className="sub">
            We set up every ambassador with a free account. Toss your codes,
            socials, and clips on one page so people can actually find them.
            Takes a couple minutes.
          </p>
          <a className="btn btn-primary" href="#activate">
            Grab your free account
          </a>
          <p className="vnote">
            Full Growth plan, free. No card, no countdown. Just a thanks for
            repping us.
          </p>
        </div>
      </div>

      <div className="wrap">
        <section>
          <div className="eyebrow">Your link in bio</div>
          <h2>All your stuff on one clean page.</h2>
          <p className="lead">
            Sure, Instagram lets you stack a few links now. But those are just
            plain links, no codes up front, no clips, and no idea what people
            tap. And every other platform handles it differently. This gives you
            one tidy page that works in every bio, updates everywhere when you
            change it, and shows you what is getting clicked.
          </p>

          <div className="phone">
            <div className="ava"></div>
            <div className="nm">@yourname</div>
            <div className="hd">Sledder</div>
            <div className="lnk acc">My gear and codes</div>
            <div className="lnk">Latest edit</div>
            <div className="lnk">Who I ride for</div>
            <div className="lnk">All my socials</div>
            <div className="lnk">Get on my list</div>
          </div>
        </section>

        <section>
          <div className="eyebrow">What goes on it</div>
          <h2>Pretty much whatever you want.</h2>
          <div className="whatlist">
            <div className="whatrow">
              <div className="ic">1</div>
              <div>
                <b>You, up top</b>
                <p>Your name, your face. Keep it you.</p>
              </div>
            </div>
            <div className="whatrow">
              <div className="ic">2</div>
              <div>
                <b>Your codes for the gear you rep</b>
                <p>
                  The discounts people are already asking you about in your DMs.
                  One tap.
                </p>
              </div>
            </div>
            <div className="whatrow">
              <div className="ic">3</div>
              <div>
                <b>Everyone you ride for</b>
                <p>All the brands you rep in one spot.</p>
              </div>
            </div>
            <div className="whatrow">
              <div className="ic">4</div>
              <div>
                <b>Your clips</b>
                <p>Latest edit, favorite send, whatever you want people to see.</p>
              </div>
            </div>
            <div className="whatrow">
              <div className="ic">5</div>
              <div>
                <b>All your socials</b>
                <p>Every platform, one tap.</p>
              </div>
            </div>
            <div className="whatrow">
              <div className="ic">6</div>
              <div>
                <b>Whatever else you got</b>
                <p>
                  Merch, ride days, anything going on. Or keep it simple. Up to
                  you.
                </p>
              </div>
            </div>
            <div className="whatrow">
              <div className="ic">7</div>
              <div>
                <b>A spot to collect emails</b>
                <p>If you want to build a little list. Totally optional.</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="eyebrow">Why it&apos;s handy</div>
          <h2>It just makes things easier.</h2>
          <div className="cards">
            <div className="card">
              <h3>
                <span className="dot"></span>Show your brands what you drive
              </h3>
              <p>
                See how many clicks each brand&apos;s links and codes are
                pulling, then shoot them the numbers. Showing how much traffic
                you send their way never hurts when it is time to talk deals
                again.
              </p>
            </div>
            <div className="card">
              <h3>
                <span className="dot"></span>Change it once, done
              </h3>
              <p>
                New code or new sponsor? Update your page and it changes
                everywhere. No redoing your bio every time.
              </p>
            </div>
            <div className="card">
              <h3>
                <span className="dot"></span>Stick it on your sled
              </h3>
              <p>
                Grab a QR for your sled, helmet, or trailer if you feel like it.
                One scan and they are on your page. You can even order them as
                stickers.
              </p>
            </div>
            <div className="card">
              <h3>
                <span className="dot"></span>See what people tap
              </h3>
              <p>Peek at what is getting clicks. Kind of fun to watch, honestly.</p>
            </div>
          </div>
        </section>

        <section>
          <div className="eyebrow">Couple minutes</div>
          <h2>Getting set up.</h2>
          <div className="steps">
            <div className="step">
              <div className="n"></div>
              <p>
                <b>Grab your free account</b>
                <span>It is already unlocked for you. No card.</span>
              </p>
            </div>
            <div className="step">
              <div className="n"></div>
              <p>
                <b>Add your stuff</b>
                <span>
                  Your @handle, codes, socials, clips, whatever you want on
                  there.
                </span>
              </p>
            </div>
            <div className="step">
              <div className="n"></div>
              <p>
                <b>Drop it in your bio</b>
                <span>That is it. Stick a QR on your sled if you feel like it.</span>
              </p>
            </div>
          </div>
        </section>

        <div className="final" id="activate">
          <div className="seal">On the house</div>
          <h2>Grab your free account.</h2>
          <p className="lead">Full Growth plan, free, no card. Thanks for repping us.</p>
          <a className="btn btn-primary" href={SIGNUP_URL}>
            Grab your free account
          </a>
          <a className="btn btn-secondary" href="/">
            See what else TRAXXR does
          </a>
        </div>
      </div>

      <footer>
        <div className="wrap">
          <img className="logo-img" src="/traxxr-logo.png" alt="TRAXXR" />
          <br />
          All your stuff. One link.
        </div>
      </footer>
    </main>
  );
}
