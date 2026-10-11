/* =====================================================================
   Nextcite — cinematic scroll engine
   Progressive enhancement: every effect is additive. If GSAP fails to
   load, or the user prefers reduced motion / is on a touch/low-power
   device, the page falls back to the base CSS + IntersectionObserver
   reveal and stays fully readable.
   ===================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Mobile navigation ---------- */
  var navToggle = document.getElementById("nav-toggle");
  var mainNav = document.getElementById("main-nav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = mainNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
    mainNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mainNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Scroll progress bar ---------- */
  var bar = document.querySelector(".scroll-progress span");
  var ticking = false;
  function updateProgress() {
    ticking = false;
    if (!bar) return;
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var p = max > 0 ? doc.scrollTop / max : 0;
    bar.style.transform = "scaleX(" + p + ")";
  }
  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateProgress);
    }
  }, { passive: true });
  updateProgress();

  /* ---------- IntersectionObserver reveal (base layer, always on) ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Performance mode ---------- */
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isCoarse = window.matchMedia("(pointer: coarse)").matches;
  var lowPower = (navigator.hardwareConcurrency || 8) <= 4;
  var lite = prefersReduced || isCoarse || lowPower;
  if (lite) root.classList.add("perf-lite");

  /* ---------- Cinematic layer (only when GSAP is actually available) ---------- */
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  if (!gsap || !ST || prefersReduced) return; // reveal fallback already covers entrances

  gsap.registerPlugin(ST);
  root.classList.add("gsap-ready");

  /* ===== Hero: entrance (on load) ===== */
  var heroScene = document.querySelector(".hero-scene");
  var wordsL = gsap.utils.toArray(".hero-scene .word-left");
  var wordsR = gsap.utils.toArray(".hero-scene .word-right");
  var intro = gsap.timeline({ delay: 0.15 });
  intro
    .from(".hero-scene .eyebrow", { y: 22, opacity: 0, duration: 0.6, ease: "power3.out" }, 0)
    .from("#ai-core", { scale: 0.35, opacity: 0, duration: 1.3, ease: "elastic.out(1, 0.7)" }, 0)
    .from(wordsL, { x: "-80vw", opacity: 0, duration: 1.1, ease: "power3.out", stagger: 0.06 }, 0.1)
    .from(wordsR, { x: "80vw", opacity: 0, duration: 1.1, ease: "power3.out", stagger: 0.06 }, 0.1)
    .from(".hero-scene .hero-sub", { y: 22, opacity: 0, duration: 0.7, ease: "power3.out" }, 0.5)
    .from(".hero-scene .hero-actions", { y: 22, opacity: 0, duration: 0.7, ease: "power3.out" }, 0.62)
    .from(".hero-scene .hero-stats", { y: 22, opacity: 0, duration: 0.7, ease: "power3.out" }, 0.74)
    .from(".hero-scene .chip", { scale: 0.6, opacity: 0, duration: 0.7, ease: "back.out(1.7)", stagger: 0.08 }, 0.55);

  // Safety net: never leave hero content stuck hidden if the timeline is throttled/paused.
  var introDone = false;
  intro.eventCallback("onComplete", function () { introDone = true; });
  window.setTimeout(function () { if (!introDone) intro.progress(1); }, 4000);

  /* ===== Hero: exit (scroll-scrubbed) ===== */
  if (heroScene) {
    var exit = gsap.timeline({
      scrollTrigger: {
        trigger: heroScene,
        start: "top top",
        end: "bottom bottom",
        scrub: 1
      }
    });
    exit
      .to({}, { duration: 0.5 }, 0) // hold while pinned
      .to(wordsL, { x: "-45vw", opacity: 0, ease: "power3.in" }, 0.5)
      .to(wordsR, { x: "45vw", opacity: 0, ease: "power3.in" }, 0.5)
      .to(".hero-scene .hero-sub, .hero-scene .hero-actions, .hero-scene .hero-stats, .hero-scene .eyebrow",
        { y: -40, opacity: 0, ease: "power2.in" }, 0.5)
      .to(".bleed-title", { scale: 1.25, opacity: 0, ease: "power2.in" }, 0.5)
      .to(".hero-scene .chip", { scale: 1.35, opacity: 0, stagger: 0.05, ease: "power2.in" }, 0.5)
      .to("#ai-core", { scale: 1.75, opacity: 0, ease: "power2.in" }, 0.5);

    /* Cursor parallax on the AI core + glow (pointer devices only) */
    if (!isCoarse) {
      var heroGlow = document.querySelector(".hero-scene .hero-glow");
      heroScene.addEventListener("pointermove", function (e) {
        var r = heroScene.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width - 0.5;
        var ny = (e.clientY - r.top) / r.height - 0.5;
        if (heroGlow) {
          heroGlow.style.setProperty("--mouse-x", (50 + nx * 60) + "%");
          heroGlow.style.setProperty("--mouse-y", (50 + ny * 60) + "%");
        }
        gsap.to("#ai-core", { x: nx * 34, y: ny * 34, duration: 0.7, ease: "power3.out", overwrite: "auto" });
      });
    }
  }

  /* ===== Multi-layer parallax (all scenes) ===== */
  var factors = { "0": 0.12, "1": 0.25, "2": 0.50, "3": 0.80, "5": 1.20 };
  gsap.utils.toArray(".scene [data-depth]").forEach(function (layer) {
    var d = layer.getAttribute("data-depth");
    if (d === "4") return; // in-flow content is never parallaxed
    var f = factors[d];
    if (f == null) return;
    gsap.fromTo(layer,
      { yPercent: 6 * f },
      {
        yPercent: -10 * f,
        ease: "none",
        scrollTrigger: {
          trigger: layer.closest(".scene"),
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      }
    );
  });

  /* ===== Product mockups: parallax + animated data bars ===== */
  gsap.utils.toArray(".product-visual").forEach(function (el) {
    gsap.fromTo(el, { yPercent: 6 }, {
      yPercent: -6,
      ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true }
    });
  });
  gsap.utils.toArray(".mock-chart").forEach(function (chart) {
    gsap.from(chart.querySelectorAll(".mock-bar-item"), {
      scaleY: 0,
      transformOrigin: "50% 100%",
      duration: 0.8,
      ease: "power3.out",
      stagger: 0.07,
      scrollTrigger: { trigger: chart, start: "top 88%" }
    });
  });

  /* ===== Pointer 3D tilt (pointer devices only) ===== */
  if (!isCoarse) {
    gsap.utils.toArray("[data-tilt]").forEach(function (el) {
      var host = el.closest(".product-card, .feature-card") || el.parentElement || el;
      var rX = gsap.quickTo(el, "rotationX", { duration: 0.5, ease: "power3" });
      var rY = gsap.quickTo(el, "rotationY", { duration: 0.5, ease: "power3" });
      host.addEventListener("pointermove", function (e) {
        var r = host.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width - 0.5;
        var ny = (e.clientY - r.top) / r.height - 0.5;
        rY(nx * 8);
        rX(-ny * 8);
      });
      host.addEventListener("pointerleave", function () { rX(0); rY(0); });
    });
  }

  /* ===== Process: scrubbed spine + sequential step lighting ===== */
  var processSteps = gsap.utils.toArray(".process-step");
  var processFill = document.getElementById("process-fill");
  if (processFill && processSteps.length) {
    ST.create({
      trigger: ".process-wrap",
      start: "top 78%",
      end: "bottom 55%",
      scrub: true,
      onUpdate: function (self) {
        var p = self.progress;
        processFill.style.transform = "scaleY(" + p + ")";
        var lit = Math.max(1, Math.round(p * processSteps.length));
        processSteps.forEach(function (step, i) {
          step.classList.toggle("is-lit", i < lit);
        });
      }
    });
  }

  /* ===== About: masked curtain line reveal ===== */
  var lineInner = document.querySelector(".about-section .line-mask .line-inner");
  if (lineInner) {
    gsap.to(lineInner, {
      y: 0,
      duration: 1,
      ease: "power4.out",
      scrollTrigger: { trigger: ".about-section", start: "top 72%" }
    });
  }

  /* ===== CTA: window-pane iris expand ===== */
  var ctaPanel = document.getElementById("cta-panel");
  if (ctaPanel) {
    gsap.fromTo(ctaPanel,
      { clipPath: "inset(42% 30% 42% 30% round 24px)", opacity: 0.35 },
      {
        clipPath: "inset(0% 0% 0% 0% round 28px)",
        opacity: 1,
        ease: "none",
        scrollTrigger: { trigger: "#contact", start: "top 82%", end: "top 32%", scrub: 1 }
      }
    );
  }

  /* Recalculate trigger positions once webfonts settle. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ST.refresh(); });
  }
})();
