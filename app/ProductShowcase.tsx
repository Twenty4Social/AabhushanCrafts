"use client";

import { useEffect, useRef } from "react";

export default function ProductShowcase({ products }: { products: { src: string; alt: string }[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; left: number } | null>(null);
  const pauseUntilRef = useRef(0);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    let visible = false;
    let frame = 0;
    let previous = 0;
    let position = scroller.scrollLeft;
    let loopWidth = 0;
    let touching = false;
    let lastAutoPosition = scroller.scrollLeft;
    const pause = () => { pauseUntilRef.current = performance.now() + 5000; };
    const touchStart = () => { touching = true; pause(); };
    const touchEnd = () => { touching = false; pause(); };
    const onScroll = () => {
      // Native swipe momentum and trackpad scrolling retain control until settled.
      if (Math.abs(scroller.scrollLeft - lastAutoPosition) > 1) {
        position = scroller.scrollLeft;
        pause();
      }
    };
    scroller.addEventListener("touchstart", touchStart, { passive: true });
    scroller.addEventListener("touchend", touchEnd, { passive: true });
    scroller.addEventListener("touchcancel", touchEnd, { passive: true });
    scroller.addEventListener("wheel", pause, { passive: true });
    scroller.addEventListener("keydown", pause);
    scroller.addEventListener("scroll", onScroll, { passive: true });
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.2 });
    observer.observe(scroller);
    const tick = (now: number) => {
      const elapsed = previous ? Math.min(now - previous, 50) : 0;
      previous = now;
      if (visible && !document.hidden && !motion.matches && !dragRef.current && !touching && now >= pauseUntilRef.current) {
        // Accumulate fractions for the same gentle speed on every display.
        position += elapsed * 0.022;
        if (loopWidth > 0 && position >= loopWidth) {
          position -= loopWidth;
        }
        scroller.scrollLeft = position;
        lastAutoPosition = scroller.scrollLeft;
      } else {
        position = scroller.scrollLeft;
      }
    };
    const firstGroup = scroller.querySelector<HTMLElement>(".productLoopGroup");
    const measure = () => {
      position = scroller.scrollLeft;
      loopWidth = firstGroup ? firstGroup.scrollWidth + (parseFloat(window.getComputedStyle(scroller).columnGap) || 0) : 0;
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(scroller);
    if (firstGroup) resize.observe(firstGroup);
    frame = requestAnimationFrame(function loop(now) {
      tick(now);
      frame = requestAnimationFrame(loop);
    });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      scroller.removeEventListener("touchstart", touchStart);
      scroller.removeEventListener("touchend", touchEnd);
      scroller.removeEventListener("touchcancel", touchEnd);
      scroller.removeEventListener("wheel", pause);
      scroller.removeEventListener("keydown", pause);
      scroller.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <section className="productsSection" id="products" aria-labelledby="products-title">
      <div className="productsHeading">
        <div><p>Designed at Aabhushan</p><h2 id="products-title">Our Products</h2></div>
      </div>
      <div className="productScroller" ref={scrollerRef} role="region" aria-label="Aabhushan product collection" tabIndex={0}
        onPointerDown={(event) => {
          pauseUntilRef.current = performance.now() + 5000;
          if (event.pointerType !== "mouse" || event.button !== 0 || (event.target as HTMLElement).closest("a, button")) return;
          dragRef.current = { x: event.clientX, left: event.currentTarget.scrollLeft };
          event.currentTarget.setPointerCapture(event.pointerId);
          event.currentTarget.classList.add("isDragging");
        }}
        onPointerMove={(event) => {
          if (dragRef.current) event.currentTarget.scrollLeft = dragRef.current.left - (event.clientX - dragRef.current.x);
        }}
        onPointerUp={(event) => {
          dragRef.current = null;
          pauseUntilRef.current = performance.now() + 5000;
          event.currentTarget.classList.remove("isDragging");
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          dragRef.current = null;
          pauseUntilRef.current = performance.now() + 5000;
        }}
        onLostPointerCapture={(event) => { dragRef.current = null; event.currentTarget.classList.remove("isDragging"); }}>
        {[0, 1].map((group) => (
          <div className="productLoopGroup" key={group} aria-hidden={group === 1}>
            {products.map((product, index) => (
              <figure className="productCard" key={`${group}-${product.src}`}>
                <img src={product.src} alt={group === 0 ? product.alt : ""} loading={group === 0 && index < 2 ? "eager" : "lazy"} width={1080} height={1350} draggable={false} />
              </figure>
            ))}
          </div>
        ))}
      </div>
      <p className="carouselFootnote">Swipe or drag to explore · the collection moves slowly on its own</p>
    </section>
  );
}
