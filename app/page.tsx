const collections = [
  {
    eyebrow: "विवाह · Bridal",
    title: "Bridal Heirlooms",
    copy: "Statement gold and gemstone pieces made to hold a family story.",
    image: "/images/bridal-hero.jpg",
    alt: "South Asian bride wearing traditional gold jewellery",
  },
  {
    eyebrow: "उत्सव · Festive",
    title: "Celebration Gold",
    copy: "Graceful pieces for Teej, Dashain, Tihar and every gathering in between.",
    image: "/images/gold-necklace.jpg",
    alt: "Gold necklace worn for a festive occasion",
  },
  {
    eyebrow: "सधैं · Everyday",
    title: "Modern Keepsakes",
    copy: "Quiet diamond, gemstone and silver details for the rhythm of every day.",
    image: "/images/gem-pendant.jpg",
    alt: "Delicate gold and gemstone pendant",
  },
];

const steps = [
  {
    number: "०१",
    title: "Share your story",
    copy: "Bring a reference, an heirloom, or simply an occasion. We begin by listening.",
  },
  {
    number: "०२",
    title: "Shape it together",
    copy: "We refine the metal, stones, details and fit around your taste and tradition.",
  },
  {
    number: "०३",
    title: "Made by hand",
    copy: "Your piece is crafted and carefully finished by our jewellery makers in Kathmandu.",
  },
];

export default function Home() {
  return (
    <main>
      <div className="announcement">
        <span>Handcrafted in Kathmandu</span>
        <span className="announcementDot" aria-hidden="true">◆</span>
        <span>Gold · Diamond · Silver</span>
      </div>

      <header className="siteHeader">
        <a className="brand" href="#top" aria-label="Aabhushan Crafts home">
          <span className="brandNepali">आभूषण</span>
          <span className="brandEnglish">Aabhushan Crafts</span>
        </a>

        <nav className="desktopNav" aria-label="Main navigation">
          <a href="#collections">Collections</a>
          <a href="#craft">Our craft</a>
          <a href="#visit">Visit</a>
        </nav>

        <a className="headerCta" href="https://m.me/aabhushancrafts" target="_blank" rel="noreferrer">
          Enquire <span aria-hidden="true">↗</span>
        </a>

        <details className="mobileMenu">
          <summary aria-label="Open navigation">Menu</summary>
          <nav aria-label="Mobile navigation">
            <a href="#collections">Collections</a>
            <a href="#craft">Our craft</a>
            <a href="#visit">Visit us</a>
            <a href="https://m.me/aabhushancrafts" target="_blank" rel="noreferrer">Send a message ↗</a>
          </nav>
        </details>
      </header>

      <section className="hero" id="top">
        <div className="heroCopy">
          <p className="kicker">घरदेखि उत्सवसम्म · From home to celebration</p>
          <h1>Jewellery that<br />feels like <em>home.</em></h1>
          <p className="heroIntro">
            Handcrafted in Kathmandu for weddings, festivals and every meaningful
            moment in between.
          </p>
          <div className="heroActions">
            <a className="primaryButton" href="#collections">Explore collections <span aria-hidden="true">↓</span></a>
            <a className="textLink" href="#visit">Visit our Naxal showroom <span aria-hidden="true">→</span></a>
          </div>
          <div className="heroNote">
            <span className="heroNoteMark" aria-hidden="true">✦</span>
            <span><strong>Made for you</strong><br />Personal consultations &amp; custom orders</span>
          </div>
        </div>

        <div className="heroVisual">
          <img src="/images/bridal-hero.jpg" alt="Bride wearing traditional gold jewellery" />
          <div className="imageFrame" aria-hidden="true" />
          <div className="heroCaption">
            <span>Bridal heirlooms</span>
            <span>01 / 03</span>
          </div>
        </div>
      </section>

      <section className="introSection" aria-labelledby="intro-heading">
        <p className="sectionLabel">Our belief</p>
        <h2 id="intro-heading">
          In Nepali homes, jewellery is never just an accessory. It carries
          <em> blessings, memory and belonging.</em>
        </h2>
        <div className="introDetail">
          <div className="sunMark" aria-hidden="true"><span>आ</span></div>
          <p>
            Aabhushan Crafts brings enduring materials and thoughtful handwork
            together—creating pieces that feel rooted in tradition and natural in
            the present.
          </p>
        </div>
      </section>

      <section className="collectionsSection" id="collections" aria-labelledby="collections-heading">
        <div className="sectionHeadingRow">
          <div>
            <p className="sectionLabel lightLabel">Made for your moments</p>
            <h2 id="collections-heading">Find your occasion</h2>
          </div>
          <p>Gold, diamond and silver pieces for the ways Nepal celebrates, gives and remembers.</p>
        </div>

        <div className="collectionGrid">
          {collections.map((collection, index) => (
            <a
              className="collectionCard"
              href="https://www.facebook.com/aabhushancrafts/photos"
              target="_blank"
              rel="noreferrer"
              key={collection.title}
            >
              <div className="collectionImageWrap">
                <img src={collection.image} alt={collection.alt} />
                <span className="collectionNumber">0{index + 1}</span>
              </div>
              <p className="cardEyebrow">{collection.eyebrow}</p>
              <h3>{collection.title}</h3>
              <p>{collection.copy}</p>
              <span className="cardLink">View inspiration <span aria-hidden="true">↗</span></span>
            </a>
          ))}
        </div>
      </section>

      <section className="craftSection" id="craft" aria-labelledby="craft-heading">
        <div className="craftImage">
          <img src="/images/gold-details.jpg" alt="Gold jewellery arranged on soft fabric" />
          <div className="materialTags" aria-label="Materials we work with">
            <span>Gold</span><span>Diamond</span><span>Silver</span>
          </div>
        </div>

        <div className="craftCopy">
          <p className="sectionLabel">Made personally</p>
          <h2 id="craft-heading">Your story,<br /><em>shaped by hand.</em></h2>
          <p className="craftLead">
            From a wedding set to a small gift for yourself, every custom piece
            starts with a conversation.
          </p>
          <ol className="stepsList">
            {steps.map((step) => (
              <li key={step.number}>
                <span className="stepNumber">{step.number}</span>
                <div><h3>{step.title}</h3><p>{step.copy}</p></div>
              </li>
            ))}
          </ol>
          <a className="primaryButton maroonButton" href="https://m.me/aabhushancrafts" target="_blank" rel="noreferrer">
            Begin a custom order <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>

      <section className="trustStrip" aria-label="Aabhushan Crafts at a glance">
        <div><strong>22kt</strong><span>Gold craftsmanship</span></div>
        <div><strong>1.4k+</strong><span>Facebook community</span></div>
        <div><strong>3</strong><span>Precious materials</span></div>
        <div><strong>1</strong><span>Naxal showroom</span></div>
      </section>

      <section className="visitSection" id="visit" aria-labelledby="visit-heading">
        <div className="visitPattern" aria-hidden="true">
          <span>आ</span><span>आ</span><span>आ</span><span>आ</span>
        </div>
        <div className="visitContent">
          <p className="sectionLabel lightLabel">Come sit with us</p>
          <h2 id="visit-heading">Find your piece<br />in <em>Naxal.</em></h2>
          <p>
            See the details up close, try on your favourites, or talk through a
            made-for-you design with our team.
          </p>
          <div className="visitActions">
            <a className="creamButton" href="https://www.google.com/maps/search/?api=1&query=Aabhushan+Crafts+Naxal+Kathmandu" target="_blank" rel="noreferrer">
              Get directions <span aria-hidden="true">↗</span>
            </a>
            <a className="lightTextLink" href="tel:+97714531085">Call +977 1 4531085</a>
          </div>
        </div>

        <address className="visitCard">
          <p className="visitCardLabel">Aabhushan Crafts</p>
          <h3>Naxal, Kathmandu<br />Nepal</h3>
          <p>Call ahead for showroom hours and personal appointments.</p>
          <div className="visitContacts">
            <a href="tel:+97714531085">01-4531085 <span aria-hidden="true">↗</span></a>
            <a href="mailto:aabhushancraft@gmail.com">aabhushancraft@gmail.com <span aria-hidden="true">↗</span></a>
          </div>
        </address>
      </section>

      <footer>
        <a className="brand footerBrand" href="#top" aria-label="Back to top">
          <span className="brandNepali">आभूषण</span>
          <span className="brandEnglish">Aabhushan Crafts</span>
        </a>
        <p>Handcrafted jewellery for Nepal and Nepali hearts everywhere.</p>
        <div className="footerLinks">
          <a href="https://www.facebook.com/aabhushancrafts" target="_blank" rel="noreferrer">Facebook ↗</a>
          <a href="mailto:aabhushancraft@gmail.com">Email ↗</a>
          <a href="#top">Back to top ↑</a>
        </div>
        <p className="copyright">© 2026 Aabhushan Crafts. Kathmandu, Nepal.</p>
      </footer>
    </main>
  );
}
