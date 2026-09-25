/* ==========================================================================
   Houston Apollos — site behaviour
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

  /* --- Hero starfield -----------------------------------------------------
     A slow drift of stars behind the hero that answers to the cursor: the
     field parts around the pointer, the stars it passes brighten, and short
     lines stitch them into a constellation.

     It is pure decoration, so it gives way easily — no starfield at all for
     reduced-motion visitors, and no cursor interaction on touch devices
     (there is no cursor to follow, and no reason to spend their battery).  */

  var canvas = document.querySelector(".hero__stars");

  if (canvas && canvas.getContext && !reduceMotion) {
    var ctx = canvas.getContext("2d");
    var stars = [];
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0;
    var h = 0;

    var REACH = 175; // px — radius of the cursor's influence
    var SHOVE = 28; // px — how far a star directly under the cursor is pushed
    var LINK = 95; // px — how close two lit stars must be to be joined

    // Pointer state in canvas coordinates. `now` values are eased toward the
    // `to` values every frame so the field glides instead of snapping, and
    // `str` fades the whole effect in and out as the cursor comes and goes.
    var ptr = { x: 0, y: 0, toX: 0, toY: 0, str: 0, toStr: 0, seen: false };

    // Lit stars for this frame, kept in parallel arrays we reuse rather than
    // reallocating sixty times a second.
    var litX = [];
    var litY = [];
    var litG = [];

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
        // depth 0 = far away, 1 = close. It drives drift speed, parallax
        // travel and size together, which is what sells the illusion.
        var depth = Math.random();
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          depth: depth,
          r: 0.25 + depth * 1.3,
          vx: -(0.02 + depth * 0.14),
          a: Math.random() * 0.5 + 0.2,
          tw: Math.random() * 0.012 + 0.003,
          dir: Math.random() > 0.5 ? 1 : -1,
          ox: 0,
          oy: 0,
          scarlet: i % 11 === 0
        });
      }
    }

    function paint() {
      // Ease pointer position and influence.
      ptr.str += (ptr.toStr - ptr.str) * 0.07;
      ptr.x += (ptr.toX - ptr.x) * 0.13;
      ptr.y += (ptr.toY - ptr.y) * 0.13;

      var live = ptr.str > 0.01;
      // Parallax runs off the cursor's offset from the centre of the hero.
      var parX = live ? ((ptr.x - w / 2) / w) * 30 * ptr.str : 0;
      var parY = live ? ((ptr.y - h / 2) / h) * 18 * ptr.str : 0;

      ctx.clearRect(0, 0, w, h);
      litX.length = litY.length = litG.length = 0;

      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];

        s.x += s.vx;
        if (s.x < -4) {
          s.x = w + 4;
          s.y = Math.random() * h;
        }

        s.a += s.tw * s.dir;
        if (s.a <= 0.15 || s.a >= 0.8) s.dir *= -1;

        // Nearer stars travel further with the cursor than distant ones.
        var px = s.x - parX * s.depth;
        var py = s.y - parY * s.depth;

        // Push away from the cursor, with a squared falloff so the edge of
        // the effect is soft rather than a visible circle.
        var wantX = 0;
        var wantY = 0;
        var glow = 0;

        if (live) {
          var dx = px - ptr.x;
          var dy = py - ptr.y;
          var d2 = dx * dx + dy * dy;

          if (d2 < REACH * REACH) {
            var d = Math.sqrt(d2) || 0.0001;
            var f = 1 - d / REACH;
            f *= f;
            wantX = (dx / d) * SHOVE * f * ptr.str;
            wantY = (dy / d) * SHOVE * f * ptr.str;
            glow = f * ptr.str;
          }
        }

        // Spring toward the target offset — and back to rest when the cursor
        // moves on, so nothing stays permanently displaced.
        s.ox += (wantX - s.ox) * 0.14;
        s.oy += (wantY - s.oy) * 0.14;

        var x = px + s.ox;
        var y = py + s.oy;
        var alpha = Math.min(s.a + glow * 0.7, 1);

        ctx.fillStyle = s.scarlet
          ? "rgba(236, 39, 67, " + alpha.toFixed(3) + ")"
          : "rgba(255, 255, 255, " + alpha.toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(x, y, s.r + glow * 0.9, 0, Math.PI * 2);
        ctx.fill();

        if (glow > 0.12) {
          litX.push(x);
          litY.push(y);
          litG.push(glow);
        }
      }

      // Constellation. Only the handful of lit stars are considered, so the
      // pairwise pass stays cheap no matter how dense the field is.
      ctx.lineWidth = 1;

      for (var a = 0; a < litX.length; a++) {
        ctx.strokeStyle = "rgba(236, 39, 67, " + (litG[a] * 0.45).toFixed(3) + ")";
        ctx.beginPath();
        ctx.moveTo(ptr.x, ptr.y);
        ctx.lineTo(litX[a], litY[a]);
        ctx.stroke();

        for (var b = a + 1; b < litX.length; b++) {
          var lx = litX[a] - litX[b];
          var ly = litY[a] - litY[b];
          var l2 = lx * lx + ly * ly;

          if (l2 < LINK * LINK) {
            var o = (1 - Math.sqrt(l2) / LINK) * Math.min(litG[a], litG[b]) * 0.4;
            ctx.strokeStyle = "rgba(255, 255, 255, " + o.toFixed(3) + ")";
            ctx.beginPath();
            ctx.moveTo(litX[a], litY[a]);
            ctx.lineTo(litX[b], litY[b]);
            ctx.stroke();
          }
        }
      }
    }

    /* Run loop. The field only paints while it is both on screen and in a
       visible tab — scrolling past the hero costs nothing.                  */

    var running = false;
    var onScreen = true;

    function loop() {
      if (!running) return;
      paint();
      requestAnimationFrame(loop);
    }

    function sync() {
      var shouldRun = onScreen && !document.hidden;
      if (shouldRun === running) return;
      running = shouldRun;
      if (running) requestAnimationFrame(loop);
    }

    if (window.matchMedia("(pointer: fine)").matches) {
      window.addEventListener(
        "mousemove",
        function (e) {
          // Measured per move so the mapping survives scrolling and layout
          // shifts without a cache to keep in sync.
          var r = canvas.getBoundingClientRect();
          ptr.toX = e.clientX - r.left;
          ptr.toY = e.clientY - r.top;

          // Start where the cursor actually is, so the first move doesn't
          // drag a wave across the hero from the top-left corner.
          if (!ptr.seen) {
            ptr.seen = true;
            ptr.x = ptr.toX;
            ptr.y = ptr.toY;
          }

          ptr.toStr = 1;
        },
        { passive: true }
      );

      // Cursor left the window entirely.
      document.addEventListener("mouseleave", function () {
        ptr.toStr = 0;
      });
    }

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(seed, 200);
    });

    document.addEventListener("visibilitychange", sync);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        sync();
      }).observe(canvas);
    }

    seed();
    sync();
  }

  /* --- Descent indicator --------------------------------------------------
     A lander rides a rail down the left margin as you scroll: nose up, with
     its retro-thrust firing downward, which is the attitude a real Mars
     lander holds on the way to the surface. Scroll to the end of the page
     and it touches down.

     The dots are the page's sections — they light as you pass them and jump
     to them when clicked, so the thing navigates as well as decorates.

     Built here rather than in the markup: it needs JS to mean anything, so
     a no-JS visitor misses nothing, and the five pages stay free of another
     duplicated block to keep in sync.                                      */

  if (document.querySelector("main")) {
    var descent = document.createElement("descent");
    descent.className = "descent";
    descent.setAttribute("aria-label", "Page sections");
    descent.innerHTML =
      '<div class="descent__rail"><span class="descent__trail"></span></div>' +
      '<div class="descent__surface"></div>' +
      '<div class="descent__craft">' +
      '<svg viewBox="0 0 32 52" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="plumeGrad" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#ffd9a8"/>' +
      '<stop offset=".4" stop-color="#ec2743"/>' +
      '<stop offset="1" stop-color="#c8102e" stop-opacity="0"/>' +
      "</linearGradient></defs>" +
      '<g class="descent__thrust">' +
      '<path class="descent__plume" d="M16 33.5C19.5 39 18.6 45 16 51c-2.6-6-3.5-12 0-17.5z" fill="url(#plumeGrad)"/>' +
      "</g>" +
      '<path d="M9.4 22.5L4.6 31.2 9.4 29.2z" fill="#c8102e"/>' +
      '<path d="M22.6 22.5l4.8 8.7-4.8-2z" fill="#c8102e"/>' +
      '<path d="M16 2c4.4 6.2 6.6 13.4 6.6 21.2v6.4H9.4v-6.4C9.4 15.4 11.6 8.2 16 2z" fill="#e9eaee" stroke="#2a2e37" stroke-width="1.2"/>' +
      '<rect x="10.6" y="29.2" width="10.8" height="4.4" rx="1.6" fill="#3b414d"/>' +
      '<circle cx="16" cy="16" r="3.4" fill="#0c0d10" stroke="#c8102e" stroke-width="1.6"/>' +
      "</svg></div>";
    document.body.appendChild(descent);

    var rail = descent.querySelector(".descent__rail");
    var trail = descent.querySelector(".descent__trail");
    var craft = descent.querySelector(".descent__craft");
    var thrust = descent.querySelector(".descent__thrust");

    var marks = [];

    Array.prototype.forEach.call(
      document.querySelectorAll("main section[id]"),
      function (section) {
        // EDIT: a section's rail label comes from its data-nav attribute.
        // Falling back to the kicker, then the heading, then the id, so a
        // section added later still gets a sensible marker for free.
        var source = section.querySelector(".eyebrow") || section.querySelector("h2, h3");
        var label = (
          section.getAttribute("data-nav") ||
          (source ? source.textContent : section.id)
        ).replace(/\s+/g, " ").trim();
        if (label.length > 26) label = label.slice(0, 25).trim() + "\u2026";

        var dot = document.createElement("a");
        dot.className = "descent__dot";
        dot.href = "#" + section.id;
        dot.setAttribute("data-label", label);

        var name = document.createElement("span");
        name.className = "vh";
        name.textContent = label;
        dot.appendChild(name);

        descent.appendChild(dot);
        marks.push({ dot: dot, section: section, top: 0 });
      }
    );

    var span = 0; // scrollable distance
    var lastY = window.scrollY;
    var flare = 0;
    var ticking = false;

    // Reading layout is the expensive half, so it happens on resize and load
    // rather than on every scroll frame.
    function measure() {
      span = document.documentElement.scrollHeight - window.innerHeight;
      if (span < 240) {
        descent.classList.add("is-idle");
        return;
      }
      descent.classList.remove("is-idle");

      for (var i = 0; i < marks.length; i++) {
        marks[i].top = marks[i].section.getBoundingClientRect().top + window.scrollY;
        marks[i].dot.style.top = ((Math.min(marks[i].top / span, 1)) * 100).toFixed(2) + "%";
      }
    }

    function update() {
      ticking = false;

      var h = rail.clientHeight;
      if (!h || span < 240) return; // hidden at this width, or nothing to scroll

      var y = window.scrollY;
      var p = Math.min(Math.max(y / span, 0), 1);

      trail.style.height = (p * 100).toFixed(2) + "%";
      craft.style.transform = "translate3d(0," + (p * h - 18).toFixed(1) + "px,0)";
      descent.classList.toggle("is-landed", p > 0.995);

      // The plume flares when you scroll hard and settles when you stop.
      flare += (Math.min(Math.abs(y - lastY) / 55, 1) - flare) * 0.25;
      lastY = y;
      thrust.setAttribute(
        "transform",
        "translate(16 34) scale(1," + (0.7 + flare).toFixed(2) + ") translate(-16 -34)"
      );

      for (var i = 0; i < marks.length; i++) {
        marks[i].dot.classList.toggle("is-passed", y + 2 >= marks[i].top);
      }
    }

    function queue() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    var remeasure;
    window.addEventListener("resize", function () {
      clearTimeout(remeasure);
      remeasure = setTimeout(function () {
        measure();
        update();
      }, 150);
    });

    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("load", function () {
      measure();
      update();
    });

    measure();
    update();
  }

  /* --- Footer year ------------------------------------------------------- */

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
