import { getLiveBullionRates } from "@/app/lib/rates";
import CertificateLookup from "@/app/CertificateLookup";
import ProductShowcase from "@/app/ProductShowcase";
import RateChange from "@/app/RateChange";
import ScrollRateBar from "@/app/ScrollRateBar";

// Keep the page cache short enough to pick up the daily stored rate shortly after 11:00 NPT.
export const revalidate = 300;

const products = [
  {
    src: "/images/shrawan-shringar.png",
    alt: "Shrawan Shringar green and gold necklace with matching earrings",
  },
  {
    src: "/images/unakite-ganesha.png",
    alt: "Unakite Ganesha statement ring set with diamonds",
  },
  {
    src: "/images/golden-eclipse.png",
    alt: "Golden Eclipse gemstone statement ring",
  },
  {
    src: "/images/lavender-luxe.png",
    alt: "Lavender Luxe 925 silver drop earring",
  },
  {
    src: "/images/halo-dews.png",
    alt: "Halo Dews 925 silver pear-shaped stud earrings",
  },
  {
    src: "/images/olive-leaf.png",
    alt: "Olive Leaf 925 silver bracelet",
  },
  {
    src: "/images/midnight-trillion.png",
    alt: "Midnight Trillion 925 silver blue gemstone earrings",
  },
  {
    src: "/images/fleur-etoile.png",
    alt: "Fleur Étoile 925 silver floral stud earrings",
  },
  {
    src: "/images/moon-beam.png",
    alt: "Moon Beam 925 silver bangle",
  },
];

const news = [
  {
    date: "08 Sep 2026",
    title: "Gold rebounds by NPR 3,500; silver gains NPR 100 per tola",
    source: "Onlinekhabar",
    href: "https://english.onlinekhabar.com/gold-price-rise-2.html",
  },
  {
    date: "07 Sep 2026",
    title: "Nepal’s gold price slips NPR 2,400 in Monday’s trading",
    source: "Onlinekhabar",
    href: "https://english.onlinekhabar.com/gold-price-falls.html",
  },
  {
    date: "06 Aug 2026",
    title: "Silver imports overtake gold in Nepal for the first time",
    source: "The Kathmandu Post",
    href: "https://kathmandupost.com/money/2026/08/06/silver-imports-overtake-gold-in-nepal-for-the-first-time",
  },
];

export default async function Home() {
  const rates = await getLiveBullionRates();
  const dateParts = rates.dateBs.match(/^(\d+)\s+(.+)\s+(\d{4})$/);
  const rateDay = dateParts?.[1] ?? "—";
  const rateMonth = dateParts?.[2] ?? "Rate unavailable";
  const rateYear = dateParts?.[3] ?? "";

  return (
    <main>
      <ScrollRateBar>
      <section className="rateBar" aria-label={`Nepal gold and silver rates · Updated ${rates.dateBs}`}>
        <div className="rateStamp">
          <span className="liveDot" aria-hidden="true" />
          <span className="mobileDateLabel">Rates updated</span>
          <span className="calendarMark" aria-hidden="true"><i /></span>
          <span className="rateDateCopy">
            <strong><b>{rateDay}</b><small>{rateMonth}<em>,</em> {rateYear}</small></strong>
          </span>
        </div>

        <div className="rates">
          <div className="rateItem">
            <span>Fine Gold/Tola</span>
            <strong>{rates.isLive ? rates.fineGoldPerTola : "—"}</strong>
            <RateChange amount={rates.fineGoldChange} comparisonDate={rates.comparisonDate} />
          </div>
          <div className="rateDivider" aria-hidden="true" />
          <div className="rateItem">
            <span>Silver/Tola</span>
            <strong>{rates.isLive ? rates.silverPerTola : "—"}</strong>
            <RateChange amount={rates.silverChange} comparisonDate={rates.comparisonDate} />
          </div>
        </div>

        <a className="rateSource" href={rates.sourceUrl} target="_blank" rel="noreferrer">
          Official source <span aria-hidden="true">↗</span>
        </a>
      </section>

      </ScrollRateBar>

      <section className="frontScreen" id="top" aria-labelledby="hero-title">
        <header className="brandHeader">
          <a href="#top" aria-label="Aabhushan Crafts home">
            <img src="/images/aabhushan-logo.png" alt="Aabhushan Crafts logo" />
          </a>
          <span>Handcrafted · Kathmandu</span>
        </header>

        <div className="heroOrbit orbitOne" aria-hidden="true" />
        <div className="heroOrbit orbitTwo" aria-hidden="true" />

        <div className="heroContent">
          <p className="heroKicker">Aabhushan Crafts <span aria-hidden="true">·</span> <strong className="heroHeritage"><span>Since</span> <span className="heroHeritageYear">1940 AD</span></strong></p>
          <h1 id="hero-title">
            <span className="heroLine heroLinePrimary">Believe</span>
            <span className="heroLine heroLineSecondary">in Design</span>
          </h1>
          <p className="heroText">
            Jewellery shaped by thought, detail and the hands that make it real.
          </p>
          <div className="heroDetails" aria-label="Aabhushan jewellery materials">
            <span>Gold</span>
            <i aria-hidden="true" />
            <span>Diamond</span>
            <i aria-hidden="true" />
            <span>Silver</span>
          </div>
          <CertificateLookup />
          <a className="repairQuickLink" href="#repairs">Need a jewellery repair? <span aria-hidden="true">↗</span></a>
        </div>

        <a className="scrollCue" href="#products">
          <span>Our products</span>
          <span aria-hidden="true">↓</span>
        </a>
      </section>

      <ProductShowcase products={products} />

      <section className="repairSection" id="repairs" aria-labelledby="repair-title">
        <div className="repairIntro">
          <p className="repairEyebrow">Care beyond the purchase</p>
          <h2 id="repair-title">Some pieces deserve<br /><em>another chapter.</em></h2>
          <p className="repairDescription">A broken clasp. A ring that no longer fits. A piece that has lost its shine. Tell us what needs attention, and let’s explore how we can help.</p>
          <div className="repairTags"><span>Resizing enquiries</span><span>Repairs & restoration</span><span>Polishing & care</span></div>
        </div>
        <div className="repairContact">
          <span className="repairEyebrow"><strong>Jewellery repair</strong> enquiries</span>
          <h3>Start with a photo.</h3>
          <ol>
            <li><span>01</span>Open a chat with our team.</li>
            <li><span>02</span>Send a clear photo and describe the issue.</li>
            <li><span>03</span>Discuss the next steps before your visit.</li>
          </ol>
          <a className="repairButton" href={`https://wa.me/9779851043097?text=${encodeURIComponent("Hello Aabhushan Crafts, I would like to enquire about a jewellery repair. Jewellery type: __. Issue: __. I will attach a photo here.")}`} target="_blank" rel="noreferrer">Discuss a repair on WhatsApp <span aria-hidden="true">↗</span></a>
          <p className="repairNote">+977 985-1043097 · Attach your photo in WhatsApp.<br />Repair suitability, cost and timing are confirmed after assessment.</p>
        </div>
      </section>

      <section className="newsSection" aria-labelledby="news-title">
        <div className="newsIntro">
          <p>Market notes</p>
          <h2 id="news-title">Latest News</h2>
          <span className="newsDescription">Selected stories from Nepal’s jewellery and precious-metals market.</span>
        </div>

        <div className="newsList">
          {news.map((item) => (
            <a href={item.href} target="_blank" rel="noreferrer" key={item.title}>
              <span className="newsMeta">{item.date} · {item.source}</span>
              <h3>{item.title}</h3>
              <span className="newsArrow" aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </section>

      <footer className="conversationFooter" aria-labelledby="conversation-title">
        <div className="conversationLayout">
          <div className="conversationIntro">
            <p className="conversationEyebrow"><span aria-hidden="true">↗</span> Aabhushan Crafts on WhatsApp</p>
            <h2 id="conversation-title">Something in mind?<br /><em>Let’s make it yours.</em></h2>
            <p className="conversationDescription">A piece you love. An idea of your own. A favourite that needs a little care. Send us a message — we’d love to hear about it.</p>
            <a className="conversationCta" href={`https://wa.me/9779851043097?text=${encodeURIComponent("Hello Aabhushan Crafts! I’d like to enquire about your jewellery.")}`} target="_blank" rel="noreferrer">Start a conversation <span aria-hidden="true">↗</span></a>
            <p className="conversationHint">Opens WhatsApp · +977 985-1043097</p>
          </div>
          <div className="conversationPreview" aria-label="Choose a conversation starter">
            <div className="conversationIdentity"><img src="/images/aabhushan-logo.png" alt="" width={52} height={52} /><div><strong>Aabhushan Crafts</strong><span>Jewellery, with a personal touch.</span></div></div>
            <div className="conversationChat">
              <p className="conversationBubble">Every beautiful piece starts with a conversation.<br /><strong>What can we help you with?</strong></p>
              <p className="conversationPrompt">Choose a message to send on WhatsApp</p>
              {[
                ["Find my next favourite", "Hello Aabhushan Crafts! Could you help me choose a piece of jewellery?"],
                ["Bring my design to life", "Hello Aabhushan Crafts! I have an idea for a custom jewellery design. Can we discuss it?"],
                ["Care for a piece I love", "Hello Aabhushan Crafts! I’d like to enquire about repairing a piece of jewellery. I can share a photo."],
              ].map(([label, message]) => <a className="conversationStarter" key={label} href={`https://wa.me/9779851043097?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">{label}<span aria-hidden="true">↗</span></a>)}
              <span className="conversationPrivacy">Send a photo, share an idea, or simply say hello.</span>
            </div>
          </div>
        </div>
        <div className="conversationBottom"><span>Aabhushan Crafts · Naxal, Kathmandu</span><a href="#top">Back to top ↑</a><span>© 2026 Aabhushan Crafts</span></div>
      </footer>
    </main>
  );
}
