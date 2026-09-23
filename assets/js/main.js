/* ==========================================================================
   UH Mars Rover — site behaviour
   Vanilla JS, no dependencies. Every feature degrades gracefully:
   with JS off the site is still fully readable and navigable.
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Mobile navigation ------------------------------------------------ */

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("primary-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    // Close the drawer after tapping a link.
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  /* --- Header shadow on scroll ------------------------------------------ */

  var header = document.querySelector(".site-header");

  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* --- Scroll reveal ----------------------------------------------------- */

  var revealables = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window) || reduceMotion) {
    revealables.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            show(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 }
    );

    revealables.forEach(function (el) {
      revealObserver.observe(el);
    });

    // Safety net. A fast flick-scroll or an anchor jump can outrun the observer,
    // and a block stuck at opacity 0 is far worse than a missed animation — so
    // sweep anything that has reached the viewport on every (throttled) scroll.
    var sweeping = false;

    var sweep = function () {
      sweeping = false;
      var left = 0;
      revealables.forEach(function (el) {
        if (el.classList.contains("is-visible")) return;
        if (el.getBoundingClientRect().top < window.innerHeight) {
          show(el);
        } else {
          left++;
        }
      });
      if (!left) {
        window.removeEventListener("scroll", queueSweep);
        window.removeEventListener("resize", queueSweep);
      }
    };

    var queueSweep = function () {
      if (sweeping) return;
      sweeping = true;
      requestAnimationFrame(sweep);
    };

    window.addEventListener("scroll", queueSweep, { passive: true });
    window.addEventListener("resize", queueSweep);
    queueSweep();
  }

  function show(el) {
    el.classList.add("is-visible");
    if (typeof revealObserver !== "undefined") revealObserver.unobserve(el);
  }

  /* --- Stat counters ------------------------------------------------------
     Markup: <span class="stat__value" data-count="38" data-suffix="+">38+</span>
     The final value is already in the HTML, so no-JS visitors see it too.   */

  var counters = document.querySelectorAll("[data-count]");

  if (counters.length && "IntersectionObserver" in window && !reduceMotion) {
    var countObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          countObserver.unobserve(entry.target);
          animateCount(entry.target);
        });
      },
      { threshold: 0.6 }
    );

    counters.forEach(function (el) {
      countObserver.observe(el);
    });
  }

  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    if (isNaN(target)) return;

    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var decimals = (el.getAttribute("data-count").split(".")[1] || "").length;
    var duration = 1100;
    var start = null;

    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      // easeOutCubic
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  /* --- Hero starfield ----------------------------------------------------
     A slow parallax drift of stars behind the hero. Skipped entirely when
     the visitor prefers reduced motion (the CSS gradients carry the look). */

  var canvas = document.querySelector(".hero__stars");

  if (canvas && canvas.getContext && !reduceMotion) {
    var ctx = canvas.getContext("2d");
    var stars = [];
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0;
    var h = 0;
    var running = true;

    function seed() {
      var rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var density = Math.min(Math.round((w * h) / 9000), 220);
      stars = [];
      for (var i = 0; i < density; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.3 + 0.25,
          // Deeper stars drift slower — cheap parallax.
          vx: -(Math.random() * 0.14 + 0.02),
          a: Math.random() * 0.5 + 0.2,
          tw: Math.random() * 0.012 + 0.003,
          dir: Math.random() > 0.5 ? 1 : -1
        });
      }
    }

    function draw() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.x += s.vx;
        if (s.x < -2) {
          s.x = w + 2;
          s.y = Math.random() * h;
        }

        s.a += s.tw * s.dir;
        if (s.a <= 0.15 || s.a >= 0.8) s.dir *= -1;

        // A handful of stars carry the scarlet tint.
        ctx.fillStyle =
          i % 11 === 0
            ? "rgba(236, 39, 67, " + s.a.toFixed(3) + ")"
            : "rgba(255, 255, 255, " + s.a.toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(draw);
    }

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(seed, 200);
    });

    // Stop painting when the hero scrolls out of view or the tab is hidden.
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        running = false;
      } else if (!running) {
        running = true;
        requestAnimationFrame(draw);
      }
    });

    seed();
    requestAnimationFrame(draw);
  }

  /* --- Footer year ------------------------------------------------------- */

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
