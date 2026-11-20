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
    if (sidebar) {
      sidebar.style.transform = "";
      sidebar.classList.add("is-open");
    }
    if (toggleBtn) toggleBtn.classList.add("is-open");
    if (backdrop) {
      backdrop.classList.add("is-active");
      // Trigger transition on next frame
      requestAnimationFrame(function () {
        backdrop.classList.add("is-visible");
      });
    }
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "true");
    hideEdgeHint();
  }

  function closeSidebar() {
    if (sidebar) {
      sidebar.style.transform = "";
      sidebar.classList.remove("is-open");
    }
    if (toggleBtn) toggleBtn.classList.remove("is-open");
    if (backdrop) {
      backdrop.classList.remove("is-visible");
      // Hide after fade transition
      setTimeout(function () {
        backdrop.classList.remove("is-active");
      }, 200);
    }
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "false");
    showEdgeHint();
  }

  function isMobile() {
    return window.matchMedia("(max-width: 768px)").matches;
  }

  /* ----------------------------------------------------------------------
     Edge swipe-to-open + drag-to-close (mobile only)
     ---------------------------------------------------------------------- */

  var edgeZone = document.getElementById("sidebar-edge");
  var edgeHint = document.querySelector(".sidebar-edge-hint");

  // Distance from the left edge (px) where a touch starts the open gesture.
  var EDGE_ZONE_WIDTH = 24;
  // Minimum horizontal travel (px) before the gesture commits.
  var OPEN_THRESHOLD = 60;
  var CLOSE_THRESHOLD = 80;
  // Sidebar width — read from CSS var, fallback to 280.
  function sidebarWidth() {
    var v = getComputedStyle(document.documentElement)
      .getPropertyValue("--sidebar-width");
    return parseInt(v, 10) || 280;
  }

  function hideEdgeHint() {
    if (edgeHint) edgeHint.style.display = "none";
  }
  function showEdgeHint() {
    if (edgeHint && isMobile() && sidebar && !sidebar.classList.contains("is-open")) {
      edgeHint.style.display = "block";
    }
  }

  // Show the hint on load (mobile only).
  showEdgeHint();

  // --- Edge swipe-to-open ------------------------------------------------

  var dragState = {
    active: false,
    opening: false,
    startX: 0,
    startY: 0,
    currentX: 0,
  };

  if (edgeZone) {
    edgeZone.addEventListener("touchstart", function (e) {
      if (!isMobile()) return;
      if (sidebar && sidebar.classList.contains("is-open")) return;
      var t = e.touches[0];
      // Only respond to touches that start near the left edge.
      if (t.clientX > EDGE_ZONE_WIDTH) return;

      dragState.active = true;
      dragState.startX = t.clientX;
      dragState.startY = t.clientY;
      dragState.currentX = t.clientX;
      dragState.opening = true;
      // Disable the CSS transition while dragging for 1:1 follow.
      sidebar.style.transition = "none";
      // Show backdrop immediately but transparent, will fade in.
      backdrop.classList.add("is-active");
      backdrop.style.opacity = "0";
      hideEdgeHint();
    }, { passive: true });
  }

  // --- Unified touchmove / touchend (open + close) -----------------------

  function onTouchMove(e) {
    if (!dragState.active) return;
    var t = e.touches[0];
    dragState.currentX = t.clientX;
    var dx = t.clientX - dragState.startX;
    var dy = t.clientY - dragState.startY;

    // If the user is scrolling vertically, cancel the gesture.
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
      cancelDrag();
      return;
    }

    var width = sidebarWidth();

    if (dragState.opening) {
      // Opening: translate from -width to 0 as finger moves right.
      var progress = Math.max(0, Math.min(dx, width));
      sidebar.style.transform = "translateX(" + (-width + progress) + "px)";
      // Fade backdrop proportionally.
      backdrop.style.opacity = String(progress / width);
      // Prevent vertical scroll while dragging horizontally.
      e.preventDefault();
    } else {
      // Closing: translate from 0 toward -width as finger moves left.
      var pull = Math.min(0, dx); // negative
      sidebar.style.transform = "translateX(" + pull + "px)";
      backdrop.style.opacity = String(1 + pull / width);
      e.preventDefault();
    }
  }

  function onTouchEnd(e) {
    if (!dragState.active) return;
    dragState.active = false;
    var dx = dragState.currentX - dragState.startX;
    var width = sidebarWidth();

    // Restore the CSS transition for the snap animation.
    sidebar.style.transition = "";
    backdrop.style.opacity = "";

    if (dragState.opening) {
      if (dx > OPEN_THRESHOLD) {
        // Commit open.
        openSidebar();
      } else {
        // Snap back closed.
        closeSidebar();
      }
    } else {
      if (dx < -CLOSE_THRESHOLD) {
        closeSidebar();
      } else {
        // Snap back open.
        openSidebar();
      }
    }
  }

  function cancelDrag() {
    if (!dragState.active) return;
    dragState.active = false;
    sidebar.style.transition = "";
    sidebar.style.transform = "";
    backdrop.style.opacity = "";
    backdrop.classList.remove("is-active");
    backdrop.classList.remove("is-visible");
  }

  document.addEventListener("touchmove", onTouchMove, { passive: false });
  document.addEventListener("touchend", onTouchEnd, { passive: true });
  document.addEventListener("touchcancel", cancelDrag, { passive: true });

  // --- Swipe-to-close on the open sidebar --------------------------------

  if (sidebar) {
    sidebar.addEventListener("touchstart", function (e) {
      if (!isMobile()) return;
      if (!sidebar.classList.contains("is-open")) return;
      var t = e.touches[0];
      dragState.active = true;
      dragState.opening = false;
      dragState.startX = t.clientX;
      dragState.startY = t.clientY;
      dragState.currentX = t.clientX;
      sidebar.style.transition = "none";
    }, { passive: true });
  }

  // Hide hint when the sidebar opens via any means.
  if (sidebar) {
    var obs = new MutationObserver(function () {
      if (sidebar.classList.contains("is-open")) {
        hideEdgeHint();
      } else {
        showEdgeHint();
      }
    });
    obs.observe(sidebar, { attributes: true, attributeFilter: ["class"] });
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
          currentSceneId = id;
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

  // Track which scene the user is currently viewing (updated by the observer).
  var currentSceneId = null;

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

  /* ----------------------------------------------------------------------
     Screenplay search
     - Filters scenes by text content (dialogue, action, headings, etc.)
     - Highlights matching text with <mark> tags.
     - Combines with the character filter so both apply together.
     ---------------------------------------------------------------------- */

  const searchInput = document.getElementById("screenplay-search");
  const searchReset = document.getElementById("search-reset");
  const searchCount = document.getElementById("search-results-count");
  const searchNav = document.getElementById("search-nav");
  const searchPrev = document.getElementById("search-prev");
  const searchNext = document.getElementById("search-next");
  var currentSearchTerm = "";

  // List of <mark> elements for the current search, in document order.
  var matchMarks = [];
  // Index into matchMarks of the currently-focused match (-1 = none).
  var currentMatchIndex = -1;

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

  // Elements within a scene whose text we search & highlight.
  var SEARCH_SELECTORS = ".scene-heading, .action, .character, .parenthetical, .dialogue p, .transition";

  // Escape a string for safe use inside a RegExp.
  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Remove all previously-added <mark> highlights in a given element.
  function clearHighlights(el) {
    if (!el) return;
    var marks = el.querySelectorAll("mark.search-mark");
    marks.forEach(function (mark) {
      var parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ""), mark);
        parent.normalize();
      }
    });
  }

  // Highlight all occurrences of `term` inside `el` (case-insensitive).
  function highlightInElement(el, term) {
    if (!el || !term) return;
    // Use a non-global regex for the acceptNode test so lastIndex isn't sticky.
    var testRegex = new RegExp(escapeRegExp(term), "i");
    var replaceRegex = new RegExp(escapeRegExp(term), "gi");
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var p = node.parentNode;
        if (!p) return NodeFilter.FILTER_REJECT;
        if (p.nodeName === "MARK" || p.nodeName === "SCRIPT") {
          return NodeFilter.FILTER_REJECT;
        }
        return testRegex.test(node.nodeValue || "") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });

    var nodes = [];
    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }

    nodes.forEach(function (node) {
      var text = node.nodeValue || "";
      var frag = document.createDocumentFragment();
      var last = 0;
      var match;
      replaceRegex.lastIndex = 0;
      while ((match = replaceRegex.exec(text)) !== null) {
        if (match.index > last) {
          frag.appendChild(document.createTextNode(text.slice(last, match.index)));
        }
        var mark = document.createElement("mark");
        mark.className = "search-mark";
        mark.textContent = match[0];
        frag.appendChild(mark);
        last = match.index + match[0].length;
      }
      if (last < text.length) {
        frag.appendChild(document.createTextNode(text.slice(last)));
      }
      var parent = node.parentNode;
      if (parent) {
        parent.replaceChild(frag, node);
      }
    });
  }

  // Apply highlights across all visible scenes for the current search term.
  function refreshHighlights() {
    scenes.forEach(function (scene) {
      clearHighlights(scene);
      if (currentSearchTerm && !scene.classList.contains("hidden-scene")) {
        var els = scene.querySelectorAll(SEARCH_SELECTORS);
        els.forEach(function (el) {
          highlightInElement(el, currentSearchTerm);
        });
      }
    });
    // Rebuild the list of match marks (in document order).
    matchMarks = Array.from(document.querySelectorAll("mark.search-mark"));
  }

  // Scroll to and visually focus the match at matchIndex.
  function focusMatch(index) {
    // Remove previous current-match styling.
    matchMarks.forEach(function (m) { m.classList.remove("is-current"); });
    if (matchMarks.length === 0) {
      currentMatchIndex = -1;
      return;
    }
    // Wrap around.
    currentMatchIndex = ((index % matchMarks.length) + matchMarks.length) % matchMarks.length;
    var mark = matchMarks[currentMatchIndex];
    mark.classList.add("is-current");
    mark.scrollIntoView({ behavior: "smooth", block: "center" });
    updateSearchNavDisplay();
  }

  function nextMatch() {
    if (matchMarks.length === 0) return;
    focusMatch(currentMatchIndex + 1);
  }

  function prevMatch() {
    if (matchMarks.length === 0) return;
    focusMatch(currentMatchIndex - 1);
  }

  // Update the results-count text and prev/next button state.
  function updateSearchNavDisplay() {
    if (!searchCount || !searchNav) return;
    var total = matchMarks.length;
    if (total === 0) {
      searchCount.textContent = "0 matches";
      searchNav.hidden = true;
    } else {
      // 1-based display
      searchCount.textContent = (currentMatchIndex + 1) + " / " + total;
      searchNav.hidden = false;
    }
    if (searchPrev) searchPrev.disabled = total < 2;
    if (searchNext) searchNext.disabled = total < 2;
  }

  // Combined filter: character filter + search term.
  function applyAllFilters() {
    var character = filterSelect ? filterSelect.value : "all";
    var showAllCharacters = !character || character === "all";
    var term = currentSearchTerm.trim();
    var lowerTerm = term.toLowerCase();
    var hasSearch = lowerTerm.length > 0;
    var visibleCount = 0;
    var matchCount = 0;

    scenes.forEach(function (scene) {
      var id = scene.getAttribute("id");
      var isTitlePage = id === "title-page";

      // Character filter
      var passesCharacter = showAllCharacters
        ? true
        : (isTitlePage ? false : charactersInScene(scene).indexOf(character) !== -1);

      // Search filter
      var passesSearch = true;
      if (hasSearch) {
        if (isTitlePage) {
          passesSearch = false;
        } else {
          var els = scene.querySelectorAll(SEARCH_SELECTORS);
          passesSearch = false;
          for (var i = 0; i < els.length; i++) {
            if ((els[i].textContent || "").toLowerCase().indexOf(lowerTerm) !== -1) {
              passesSearch = true;
              break;
            }
          }
        }
      }

      var shouldShow = passesCharacter && passesSearch && !isTitlePage;
      if (showAllCharacters && !hasSearch && isTitlePage) {
        shouldShow = true;
      }

      if (shouldShow) {
        scene.classList.remove("hidden-scene");
        visibleCount++;
        if (hasSearch) matchCount++;
      } else {
        scene.classList.add("hidden-scene");
      }

      var tocItem = tocItemBySceneId[id];
      if (tocItem) {
        if (shouldShow) {
          tocItem.classList.remove("hidden-toc");
        } else {
          tocItem.classList.add("hidden-toc");
        }
      }
    });

    // Refresh highlights for the current search term (rebuilds matchMarks).
    refreshHighlights();

    // Reset or restore the current-match cursor.
    if (hasSearch) {
      // If we had a position, try to keep it clamped; otherwise start at first.
      if (currentMatchIndex >= matchMarks.length) {
        currentMatchIndex = matchMarks.length > 0 ? 0 : -1;
      }
      if (currentMatchIndex === -1 && matchMarks.length > 0) {
        currentMatchIndex = 0;
      }
      // Apply current-match styling without scrolling on filter changes.
      matchMarks.forEach(function (m) { m.classList.remove("is-current"); });
      if (currentMatchIndex >= 0 && matchMarks[currentMatchIndex]) {
        matchMarks[currentMatchIndex].classList.add("is-current");
      }
    } else {
      currentMatchIndex = -1;
      matchMarks.forEach(function (m) { m.classList.remove("is-current"); });
    }

    // Update the results-count + nav button display.
    updateSearchNavDisplay();

    // Show / hide the "no scenes" notice.
    var note = ensureEmptyNote();
    if (visibleCount === 0) {
      var reason = "";
      if (hasSearch && !showAllCharacters) {
        reason = "No scenes matching \"" + term + "\" with " + character + ".";
      } else if (hasSearch) {
        reason = "No scenes matching \"" + term + "\".";
      } else if (!showAllCharacters) {
        reason = "No scenes featuring " + character + ".";
      }
      note.textContent = reason;
      note.style.display = "block";
    } else {
      note.style.display = "none";
    }
  }

  // Debounce the search input so typing stays smooth.
  var searchTimer = null;
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        currentSearchTerm = searchInput.value || "";
        // Reset cursor when the search text changes.
        currentMatchIndex = -1;
        applyAllFilters();
      }, 120);
    });

    // Enter = next match, Shift+Enter = previous match.
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        if (matchMarks.length === 0) return;
        if (e.shiftKey) {
          prevMatch();
        } else {
          nextMatch();
        }
        if (isMobile()) closeSidebar();
      }
    });
  }

  if (searchReset) {
    searchReset.addEventListener("click", function () {
      if (searchInput) searchInput.value = "";
      currentSearchTerm = "";
      currentMatchIndex = -1;
      applyAllFilters();
      if (searchInput) searchInput.focus();
    });
  }

  if (searchPrev) {
    searchPrev.addEventListener("click", function () {
      prevMatch();
    });
  }

  if (searchNext) {
    searchNext.addEventListener("click", function () {
      nextMatch();
    });
  }

  if (filterSelect) {
    filterSelect.addEventListener("change", function () {
      applyAllFilters();
    });
  }

  if (filterReset) {
    filterReset.addEventListener("click", function () {
      if (filterSelect) {
        filterSelect.value = "all";
      }
      applyAllFilters();
    });
  }

  /* ----------------------------------------------------------------------
     Bookmark — save / restore reading position (front-end only, localStorage)
     - "Save Spot Here" captures the current scene + pixel offset.
     - On page load, if a bookmark exists, the page auto-scrolls to it.
     - The saved bookmark is shown in the sidebar with scene number + title.
     - The corresponding TOC entry gets a star indicator.
     ---------------------------------------------------------------------- */

  var BOOKMARK_KEY = "lvds-bookmark";
  var bookmarkBtn = document.getElementById("bookmark-btn");
  var bookmarkClearBtn = document.getElementById("bookmark-clear");
  var bookmarkInfo = document.getElementById("bookmark-info");
  var bookmarkText = document.getElementById("bookmark-text");

  // Desktop FAB elements
  var bookmarkBtnFab = document.getElementById("bookmark-btn-fab");
  var bookmarkClearFab = document.getElementById("bookmark-clear-fab");
  var bookmarkFabInfo = document.getElementById("bookmark-fab-info");
  var bookmarkFabText = document.getElementById("bookmark-fab-text");

  // Mobile header elements
  var bookmarkBtnMobile = document.getElementById("bookmark-btn-mobile");
  var bookmarkClearMobile = document.getElementById("bookmark-clear-mobile");
  var mobileBookmarkText = document.getElementById("mobile-bookmark-text");

  // Read the saved bookmark from localStorage. Returns null if none/corrupt.
  function readBookmark() {
    try {
      var raw = localStorage.getItem(BOOKMARK_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (data && typeof data.sceneId === "string") {
        return data;
      }
    } catch (e) {
      // Ignore parse errors — treat as no bookmark.
    }
    return null;
  }

  // Persist a bookmark object to localStorage.
  function writeBookmark(data) {
    try {
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify(data));
    } catch (e) {
      // Storage might be full or disabled — silently ignore.
    }
  }

  // Remove the bookmark from localStorage.
  function removeBookmark() {
    try {
      localStorage.removeItem(BOOKMARK_KEY);
    } catch (e) {
      // Ignore.
    }
  }

  // Extract a human-readable label from a scene element: "Scene 12 — INT. …"
  function sceneLabel(sceneEl) {
    if (!sceneEl) return "";
    var heading = sceneEl.querySelector(".scene-heading");
    var text = (heading ? heading.textContent : sceneEl.getAttribute("id")) || "";
    return text.trim();
  }

  // Add or remove the star indicator on the TOC link for a given scene id.
  function updateTocBookmarkIndicator(sceneId, add) {
    if (!sceneId) return;
    var link = linkBySceneId[sceneId];
    if (!link) return;
    if (add) {
      link.classList.add("has-bookmark");
    } else {
      link.classList.remove("has-bookmark");
    }
  }

  // Refresh the sidebar bookmark UI from the saved bookmark data (or lack thereof).
  function refreshBookmarkUI() {
    var bm = readBookmark();
    if (bm) {
      // --- Sidebar (original) ---
      if (bookmarkInfo) bookmarkInfo.hidden = false;
      if (bookmarkClearBtn) bookmarkClearBtn.hidden = false;
      if (bookmarkText) {
        bookmarkText.textContent = "Saved: " + bm.label;
      }
      // --- Desktop FAB ---
      if (bookmarkFabInfo) bookmarkFabInfo.hidden = false;
      if (bookmarkClearFab) bookmarkClearFab.hidden = false;
      if (bookmarkFabText) {
        bookmarkFabText.textContent = bm.label;
      }
      // --- Mobile header ---
      if (mobileBookmarkText) {
        mobileBookmarkText.textContent = "Saved: " + bm.label;
      }
      if (bookmarkClearMobile) bookmarkClearMobile.hidden = false;
      // Highlight the TOC entry.
      updateTocBookmarkIndicator(bm.sceneId, true);
    } else {
      // --- Sidebar (original) ---
      if (bookmarkInfo) bookmarkInfo.hidden = true;
      if (bookmarkClearBtn) bookmarkClearBtn.hidden = true;
      if (bookmarkText) {
        bookmarkText.textContent = "No bookmark saved";
      }
      // --- Desktop FAB ---
      if (bookmarkFabInfo) bookmarkFabInfo.hidden = true;
      if (bookmarkClearFab) bookmarkClearFab.hidden = true;
      if (bookmarkFabText) {
        bookmarkFabText.textContent = "";
      }
      // --- Mobile header ---
      if (mobileBookmarkText) {
        mobileBookmarkText.textContent = "No bookmark saved";
      }
      if (bookmarkClearMobile) bookmarkClearMobile.hidden = true;
    }
  }

  // Save the current reading spot.
  function saveBookmark() {
    var sceneId = currentSceneId;
    if (!sceneId) {
      // Fallback: find the topmost visible scene manually.
      for (var i = 0; i < scenes.length; i++) {
        var rect = scenes[i].getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          sceneId = scenes[i].getAttribute("id");
          break;
        }
      }
    }
    if (!sceneId) return;

    var sceneEl = document.getElementById(sceneId);
    if (!sceneEl) return;

    // Pixel offset of the scene's top from the viewport top, so we can
    // restore the exact scroll position within the scene.
    var sceneTop = sceneEl.offsetTop;
    var scrollY = window.scrollY || window.pageYOffset;
    var offsetInScene = scrollY - sceneTop;
    if (offsetInScene < 0) offsetInScene = 0;

    writeBookmark({
      sceneId: sceneId,
      label: sceneLabel(sceneEl),
      offset: offsetInScene,
      savedAt: new Date().toISOString(),
    });

    refreshBookmarkUI();

    // Brief visual feedback: flash "✓ Saved!" on whichever save button triggered the action.
    function flashSaved(btn, labelSelector, fallback) {
      if (!btn) return;
      var labelEl = labelSelector ? btn.querySelector(labelSelector) : btn;
      if (!labelEl) return;
      var orig = labelEl.textContent;
      labelEl.textContent = "\u2713 Saved!";
      setTimeout(function () {
        labelEl.textContent = orig || fallback || "Save Spot";
      }, 1500);
    }
    // Sidebar button
    if (bookmarkBtn) {
      flashSaved(bookmarkBtn, ".bookmark-label", "Save Spot Here");
    }
    // Desktop FAB
    if (bookmarkBtnFab) {
      flashSaved(bookmarkBtnFab, ".bookmark-fab-label", "Save Spot");
    }
    // Mobile header button
    if (bookmarkBtnMobile) {
      flashSaved(bookmarkBtnMobile, null, "Save Spot");
    }
  }

  // Clear the bookmark.
  function clearBookmark() {
    var bm = readBookmark();
    if (bm) {
      updateTocBookmarkIndicator(bm.sceneId, false);
    }
    removeBookmark();
    refreshBookmarkUI();
  }

  // Restore the bookmark on page load: scroll to the saved scene + offset.
  function restoreBookmark() {
    var bm = readBookmark();
    if (!bm) return;

    var sceneEl = document.getElementById(bm.sceneId);
    if (!sceneEl) return;

    var target = sceneEl.offsetTop + (bm.offset || 0);
    // Use instant jump on load — smooth-scrolling a long distance on load
    // is disorienting and delays the user.
    window.scrollTo(0, target);
  }

  // Wire up the buttons.
  if (bookmarkBtn) {
    bookmarkBtn.addEventListener("click", function () {
      saveBookmark();
    });
  }
  if (bookmarkClearBtn) {
    bookmarkClearBtn.addEventListener("click", function () {
      clearBookmark();
    });
  }
  // Desktop FAB
  if (bookmarkBtnFab) {
    bookmarkBtnFab.addEventListener("click", function () {
      saveBookmark();
    });
  }
  if (bookmarkClearFab) {
    bookmarkClearFab.addEventListener("click", function () {
      clearBookmark();
    });
  }
  // Mobile header
  if (bookmarkBtnMobile) {
    bookmarkBtnMobile.addEventListener("click", function () {
      saveBookmark();
    });
  }
  if (bookmarkClearMobile) {
    bookmarkClearMobile.addEventListener("click", function () {
      clearBookmark();
    });
  }

  // Initialize the UI and attempt to restore on load.
  refreshBookmarkUI();

  // Restore the bookmark after the page is fully loaded (fonts, layout).
  // Use requestAnimationFrame to ensure layout is settled before scrolling.
  if (document.readyState === "complete") {
    requestAnimationFrame(restoreBookmark);
  } else {
    window.addEventListener("load", function () {
      requestAnimationFrame(restoreBookmark);
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
