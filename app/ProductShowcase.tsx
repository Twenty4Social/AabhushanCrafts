"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

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

const slideCount = products.length + 1;

export default function ProductShowcase() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(true);

  const updateCarouselState = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const slides = Array.from(
      scroller.querySelectorAll<HTMLElement>("[data-product-slide]"),
    );
    const inlinePadding = Number.parseFloat(
      window.getComputedStyle(scroller).paddingInlineStart,
    );
    const viewportStart = scroller.scrollLeft + inlinePadding;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    slides.forEach((slide, index) => {
      const distance = Math.abs(slide.offsetLeft - viewportStart);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setCurrentSlide(closestIndex);
    setCanGoBack(scroller.scrollLeft > 4);
    setCanGoForward(
      scroller.scrollLeft < scroller.scrollWidth - scroller.clientWidth - 4,
    );
  };

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    scroller.scrollLeft = 0;
    updateCarouselState();

    const handleResize = () => updateCarouselState();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const moveCarousel = (direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const slides = Array.from(
      scroller.querySelectorAll<HTMLElement>("[data-product-slide]"),
    );
    const nextIndex = Math.min(
      Math.max(currentSlide + direction, 0),
      slides.length - 1,
    );
    const target = slides[nextIndex];
    const inlinePadding = Number.parseFloat(
      window.getComputedStyle(scroller).paddingInlineStart,
    );

    scroller.scrollTo({
      left: target.offsetLeft - inlinePadding,
      behavior: "smooth",
    });
  };

  return (
    <section
      className="productsSection"
      id="products"
      aria-labelledby="products-title"
    >
      <div className="productsHeading">
        <div>
          <p>Designed at Aabhushan</p>
          <h2 id="products-title">Our Products</h2>
        </div>

        <div
          className="productsNavigation"
          aria-label="Product carousel controls"
        >
          <span className="productProgress" aria-live="polite">
            {String(currentSlide + 1).padStart(2, "0")}
            <i>/</i>
            {String(slideCount).padStart(2, "0")}
          </span>
          <button
            type="button"
            aria-label="Previous product"
            onClick={() => moveCarousel(-1)}
            disabled={!canGoBack}
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Next product"
            onClick={() => moveCarousel(1)}
            disabled={!canGoForward}
          >
            →
          </button>
        </div>
      </div>

      <div
        className="productScroller"
        ref={scrollerRef}
        role="region"
        aria-label="Aabhushan product collection"
        tabIndex={0}
        onScroll={updateCarouselState}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            moveCarousel(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
      >
        {products.map((product, index) => (
          <figure className="productCard" data-product-slide key={product.src}>
            <Image
              src={product.src}
              alt={product.alt}
              width={1080}
              height={1350}
              sizes="(max-width: 700px) 82vw, (max-width: 1200px) 34vw, 420px"
              loading={index < 2 ? "eager" : "lazy"}
            />
            <figcaption>{String(index + 1).padStart(2, "0")}</figcaption>
          </figure>
        ))}

        <div
          className="endCard"
          data-product-slide
          aria-label="End of collection"
        >
          <Image
            src="/images/aabhushan-logo.png"
            alt=""
            width={1024}
            height={1024}
            sizes="140px"
          />
          <p>Crafted to be remembered.</p>
          <a
            href="https://m.me/aabhushancrafts"
            target="_blank"
            rel="noreferrer"
          >
            Enquire <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>

      <p className="swipeNote">Swipe, drag or use the arrows to explore</p>
    </section>
  );
}
