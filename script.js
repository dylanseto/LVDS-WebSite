/* ==========================================================================
   Le Voyage de Setojeda — Screenplay Website Template
   Highlights the current scene in the sidebar TOC as the user scrolls.
   ========================================================================== */

(function () {
  "use strict";

  /* ======================================================================
     Mobile sidebar toggle
     - Hamburger button opens the drawer.
     - Backdrop and close button close it.
     - Tapping a TOC link also closes the drawer on mobile.
     ====================================================================== */

  const sidebar = document.querySelector(".sidebar");
  const toggleBtn = document.getElementById("sidebar-toggle");
  const closeBtn = document.getElementById("sidebar-close");
  const backdrop = document.getElementById("sidebar-backdrop");

  function openSidebar() {
    if (sidebar) sidebar.classList.add("is-open");
    if (toggleBtn) toggleBtn.classList.add("is-open");
    if (backdrop) {
      backdrop.classList.add("is-active");
      // Trigger transition on next frame
      requestAnimationFrame(function () {
        backdrop.classList.add("is-visible");
      });
    }
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "true");
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove("is-open");
    if (toggleBtn) toggleBtn.classList.remove("is-open");
    if (backdrop) {
      backdrop.classList.remove("is-visible");
      // Hide after fade transition
      setTimeout(function () {
        backdrop.classList.remove("is-active");
      }, 200);
    }
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "false");
  }

  function isMobile() {
    return window.matchMedia("(max-width: 768px)").matches;
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      if (sidebar && sidebar.classList.contains("is-open")) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", closeSidebar);
  }

  if (backdrop) {
    backdrop.addEventListener("click", closeSidebar);
  }

  // Close the drawer with the Escape key.
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && sidebar && sidebar.classList.contains("is-open")) {
      closeSidebar();
    }
  });

  /* ======================================================================
     Tab switching (Contents / About)
     ====================================================================== */

  const tabs = Array.from(document.querySelectorAll(".tab"));
  const panels = Array.from(document.querySelectorAll(".tab-panel"));

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      const targetPanelId = tab.getAttribute("aria-controls");

      // Deactivate all tabs and panels.
      tabs.forEach(function (t) {
        t.classList.remove("is-active");
        t.setAttribute("aria-selected", "false");
      });
      panels.forEach(function (p) {
        p.classList.remove("is-active");
        p.setAttribute("hidden", "");
      });

      // Activate the clicked tab and its panel.
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");
      const panel = document.getElementById(targetPanelId);
      if (panel) {
        panel.classList.add("is-active");
        panel.removeAttribute("hidden");
      }
    });
  });

  /* ======================================================================
     Scroll-spy + TOC navigation
     ====================================================================== */

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
        // Close the drawer on mobile after navigating.
        if (isMobile()) {
          closeSidebar();
        }
      }
    });
  });

  /* ----------------------------------------------------------------------
     Character filter dropdown
     - Auto-populates from every .character cue in the screenplay.
     - Normalizes names by stripping parentheticals (e.g. "MAYA (O.S.)" -> "MAYA").
     - Hides scenes (and their TOC entries) that don't feature the chosen character.
     ---------------------------------------------------------------------- */

  const filterSelect = document.getElementById("character-filter");
  const filterReset = document.getElementById("filter-reset");

  // Normalize a character cue to its base name: "MAYA (O.S.)" -> "MAYA"
  function normalizeCharacterName(raw) {
    return raw.replace(/\s*\([^)]*\)\s*/g, "").trim().toUpperCase();
  }

  // Collect the set of characters that appear in a given scene element.
  function charactersInScene(sceneEl) {
    const cues = Array.from(sceneEl.querySelectorAll(".character"));
    return cues.map(function (c) {
      return normalizeCharacterName(c.textContent || "");
    });
  }

  // Named characters only — generic/background roles are excluded from the
  // filter dropdown but still appear in the screenplay text.
  var NAMED_CHARACTERS = {
    "DYLAN": true,
    "IZZY": true,
    "FRED": true,
    "MONICA": true,
    "DANIELLE": true,
    "GABRIEL": true,
    "EUGENE": true,
    "LOUISE": true,
    "IRENE": true,
    "PAUL": true,
    "SAV": true,
    "JODI": true,
    "JP": true,
    "GERALDINE": true
  };

  // Build a sorted, unique list of named characters in the screenplay.
  var characterSet = {};
  scenes.forEach(function (scene) {
    charactersInScene(scene).forEach(function (name) {
      if (name && NAMED_CHARACTERS[name]) {
        characterSet[name] = true;
      }
    });
  });
  var characterNames = Object.keys(characterSet).sort();

  // Populate the dropdown (the "All Characters" option already exists in HTML).
  if (filterSelect) {
    characterNames.forEach(function (name) {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      filterSelect.appendChild(opt);
    });
  }

  // Map scene id -> its TOC <li> for hiding TOC entries alongside scenes.
  const tocItemBySceneId = {};
  tocLinks.forEach(function (link) {
    const href = link.getAttribute("href") || "";
    if (href.startsWith("#")) {
      const li = link.closest("li");
      if (li) {
        tocItemBySceneId[href.slice(1)] = li;
      }
    }
  });

  // Container for the "no scenes" notice.
  let emptyNote = null;

  function ensureEmptyNote() {
    if (!emptyNote) {
      emptyNote = document.createElement("div");
      emptyNote.className = "empty-note";
      const content = document.querySelector(".content");
      if (content) {
        content.appendChild(emptyNote);
      }
    }
    return emptyNote;
  }

  function applyFilter(character) {
    const showAll = !character || character === "all";
    let visibleCount = 0;

    scenes.forEach(function (scene) {
      const id = scene.getAttribute("id");
      const hasCharacter = showAll || charactersInScene(scene).indexOf(character) !== -1;

      // The title page has no characters; only show it when "all" is selected.
      const isTitlePage = id === "title-page";
      const shouldShow = showAll ? true : (isTitlePage ? false : hasCharacter);

      if (shouldShow) {
        scene.classList.remove("hidden-scene");
        visibleCount++;
      } else {
        scene.classList.add("hidden-scene");
      }

      // Mirror visibility to the TOC entry.
      const tocItem = tocItemBySceneId[id];
      if (tocItem) {
        if (shouldShow) {
          tocItem.classList.remove("hidden-toc");
        } else {
          tocItem.classList.add("hidden-toc");
        }
      }
    });

    // Show / hide the "no scenes" notice.
    const note = ensureEmptyNote();
    if (visibleCount === 0) {
      note.textContent = "No scenes featuring " + character + ".";
      note.style.display = "block";
    } else {
      note.style.display = "none";
    }

    // Re-observe: trigger observer refresh by re-observing visible scenes.
    // (Simple approach: remove and re-add the observer on visible scenes.)
  }

  if (filterSelect) {
    filterSelect.addEventListener("change", function () {
      applyFilter(filterSelect.value);
    });
  }

  if (filterReset) {
    filterReset.addEventListener("click", function () {
      if (filterSelect) {
        filterSelect.value = "all";
      }
      applyFilter("all");
    });
  }

  /* ----------------------------------------------------------------------
     Twemoji — replace Unicode emoji with Apple-style image icons so they
     render consistently on all platforms (Windows would otherwise show
     Segoe UI Emoji).  We parse only the About panel to keep it scoped.
     ---------------------------------------------------------------------- */

  if (window.twemoji) {
    var aboutPanel = document.getElementById("panel-about");
    if (aboutPanel) {
      window.twemoji.parse(aboutPanel, {
        base: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/",
        ext: ".png",
        className: "emoji-icon",
      });
    }
  }
})();
