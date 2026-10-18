/* ==========================================================================
   LVDS — Screenplay Website Template
   Highlights the current scene in the sidebar TOC as the user scrolls.
   ========================================================================== */

(function () {
  "use strict";

  // Collect every scene section and its corresponding TOC link.
  const scenes = Array.from(document.querySelectorAll(".scene"));
  const tocLinks = Array.from(document.querySelectorAll(".toc a"));

  // Build a map of scene id -> toc link for quick lookup.
  const linkBySceneId = {};
  tocLinks.forEach(function (link) {
    const href = link.getAttribute("href") || "";
    if (href.startsWith("#")) {
      linkBySceneId[href.slice(1)] = link;
    }
  });

  if (!scenes.length || !tocLinks.length) {
    return;
  }

  // Use IntersectionObserver to highlight the currently-visible scene.
  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id");
          tocLinks.forEach(function (link) {
            link.classList.remove("active");
          });
          const active = linkBySceneId[id];
          if (active) {
            active.classList.add("active");
          }
        }
      });
    },
    {
      // Highlight the scene when its heading is near the top third of the viewport.
      rootMargin: "-20% 0px -70% 0px",
      threshold: 0,
    }
  );

  scenes.forEach(function (scene) {
    observer.observe(scene);
  });

  // Smooth-scroll to scene on TOC click (with sidebar offset handled by CSS scroll-margin).
  tocLinks.forEach(function (link) {
    link.addEventListener("click", function (e) {
      const href = link.getAttribute("href") || "";
      if (href.startsWith("#")) {
        e.preventDefault();
        const target = document.getElementById(href.slice(1));
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  });
})();
