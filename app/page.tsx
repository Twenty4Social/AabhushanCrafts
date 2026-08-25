import { getLiveBullionRates } from "@/app/lib/rates";

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
    date: "06 Aug 2026",
    title: "Silver imports overtake gold in Nepal for the first time",
    source: "The Kathmandu Post",
    href: "https://kathmandupost.com/money/2026/08/06/silver-imports-overtake-gold-in-nepal-for-the-first-time",
  },
  {
    date: "24 Jan 2026",
    title: "Gold crosses NPR 300,000 per tola amid global uncertainty",
    source: "The Kathmandu Post",
    href: "https://kathmandupost.com/money/2026/01/24/gold-soars-past-rs300-000-per-tola",
  },
  {
    date: "31 Jul 2026",
    title: "Nepal bullion association publishes its latest market notice",
    source: "NEGOSIDA",
    href: "https://negosida.org/",
  },
];

export default async function Home() {
  const rates = await getLiveBullionRates();

  return (
    <main>
      <section className="rateBar" aria-label="Nepal gold and silver rates">
        <div className="rateStamp">
          <span className="liveDot" aria-hidden="true" />
          <span>नेपाल बजार दर</span>
          <strong>{rates.dateBs}</strong>
        </div>

        <div className="rates">
          <div className="rateItem">
            <span>Fine Gold</span>
            <strong>{rates.fineGoldPerTola}</strong>
            <small>per tola</small>
          </div>
          <div className="rateDivider" aria-hidden="true" />
          <div className="rateItem">
            <span>Silver</span>
            <strong>{rates.silverPerTola}</strong>
            <small>per tola</small>
          </div>
        </div>

        <a className="rateSource" href={rates.sourceUrl} target="_blank" rel="noreferrer">
          Official source <span aria-hidden="true">↗</span>
        </a>
      </section>

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
          <p className="heroKicker">Aabhushan Crafts · Since every idea deserves form</p>
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
            <span>925 Silver</span>
          </div>
        </div>

        <a className="scrollCue" href="#products">
          <span>Our products</span>
          <span aria-hidden="true">↓</span>
        </a>
      </section>

      <section className="productsSection" id="products" aria-labelledby="products-title">
        <div className="productsHeading">
          <div>
            <p>Designed at Aabhushan</p>
            <h2 id="products-title">Our Products</h2>
          </div>
          <p className="dragHint"><span aria-hidden="true">←</span> Swipe or scroll to explore <span aria-hidden="true">→</span></p>
        </div>

        <div className="productScroller" role="region" aria-label="Aabhushan product collection">
          {products.map((product, index) => (
            <figure className="productCard" key={`${product.src}-${index}`}>
              <img src={product.src} alt={product.alt} loading={index < 2 ? "eager" : "lazy"} />
              <figcaption>{String(index + 1).padStart(2, "0")}</figcaption>
            </figure>
          ))}
          <div className="endCard" aria-label="End of collection">
            <img src="/images/aabhushan-logo.png" alt="" />
            <p>Crafted to be remembered.</p>
            <a href="https://m.me/aabhushancrafts" target="_blank" rel="noreferrer">
              Enquire <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>

      <section className="newsSection" aria-labelledby="news-title">
        <div className="newsIntro">
          <p>Market notes</p>
          <h2 id="news-title">Jewellery News</h2>
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

      <footer>
        <span>Aabhushan Crafts · Naxal, Kathmandu</span>
        <a href="tel:+97714531085">+977 1 4531085</a>
        <span>© 2026</span>
      </footer>
    </main>
  );
}
