/**
 * GoWeb CMS & E-Service Manual Client Application
 * Features:
 * - Dynamic Table of Contents (TOC) with slugified heading anchors
 * - ScrollSpy for active section highlighting
 * - Real-time TOC Search / Filter
 * - Light / Dark Theme Switcher with local persistence
 * - Image Lightbox for screenshots
 * - Responsive mobile drawer navigation
 * - Print handling and Back-to-Top button
 */

(function () {
  'use strict';

  // --- Theme Management ---
  const THEME_KEY = 'goweb-manual-theme';
  const themeToggleBtn = document.getElementById('theme-toggle-btn');

  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
      updateThemeButton(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = prefersDark ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', initialTheme);
      updateThemeButton(initialTheme);
    }
  }

  function updateThemeButton(theme) {
    if (!themeToggleBtn) return;
    if (theme === 'dark') {
      themeToggleBtn.innerHTML = '<span>☀️ สว่าง</span>';
      themeToggleBtn.setAttribute('title', 'เปลี่ยนเป็นโหมดสว่าง');
    } else {
      themeToggleBtn.innerHTML = '<span>🌙 มืด</span>';
      themeToggleBtn.setAttribute('title', 'เปลี่ยนเป็นโหมดมืด');
    }
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem(THEME_KEY, newTheme);
      updateThemeButton(newTheme);
    });
  }

  initTheme();

  // --- Slugify helper ---
  function slugify(text) {
    return text
      .toString()
      .trim()
      .replace(/[\s\(\)\[\]\/\\:.,#?]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'section';
  }

  // --- Generate Table of Contents (TOC) ---
  const manualContent = document.getElementById('manual-content');
  const tocNav = document.getElementById('toc-nav');

  if (manualContent && tocNav) {
    const headings = manualContent.querySelectorAll('h2, h3');
    const fragment = document.createDocumentFragment();
    const usedSlugs = new Map();

    headings.forEach((heading) => {
      const level = heading.tagName.toLowerCase();
      const text = heading.textContent.trim();
      if (!text) return;

      let baseSlug = slugify(text);
      let count = usedSlugs.get(baseSlug) || 0;
      let uniqueSlug = count === 0 ? baseSlug : `${baseSlug}-${count}`;
      usedSlugs.set(baseSlug, count + 1);

      if (!heading.id) {
        heading.id = uniqueSlug;
      }

      const link = document.createElement('a');
      link.href = `#${heading.id}`;
      link.className = `toc-link toc-${level}`;
      link.textContent = text;
      link.setAttribute('data-target', heading.id);

      link.addEventListener('click', (e) => {
        // Close sidebar on mobile upon clicking
        const sidebar = document.getElementById('app-sidebar');
        if (sidebar && window.innerWidth <= 1024) {
          sidebar.classList.remove('open');
        }
      });

      fragment.appendChild(link);
    });

    tocNav.appendChild(fragment);
  }

  // --- ScrollSpy for Active TOC Link ---
  const tocLinks = document.querySelectorAll('.toc-link');
  const trackedHeadings = manualContent ? Array.from(manualContent.querySelectorAll('h2, h3')) : [];

  function onScrollSpy() {
    const scrollPos = window.scrollY + 100;
    let activeHeadingId = null;

    for (let i = trackedHeadings.length - 1; i >= 0; i--) {
      const heading = trackedHeadings[i];
      if (heading.offsetTop <= scrollPos) {
        activeHeadingId = heading.id;
        break;
      }
    }

    tocLinks.forEach((link) => {
      if (activeHeadingId && link.getAttribute('data-target') === activeHeadingId) {
        link.classList.add('active');
        // Scroll link into view in sidebar if necessary
        const sidebar = document.getElementById('app-sidebar');
        if (sidebar) {
          const linkTop = link.offsetTop;
          const sidebarScroll = sidebar.scrollTop;
          const sidebarHeight = sidebar.clientHeight;
          if (linkTop < sidebarScroll + 50 || linkTop > sidebarScroll + sidebarHeight - 50) {
            link.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        }
      } else {
        link.classList.remove('active');
      }
    });
  }

  let scrollThrottle = null;
  window.addEventListener('scroll', () => {
    if (!scrollThrottle) {
      scrollThrottle = setTimeout(() => {
        onScrollSpy();
        scrollThrottle = null;
      }, 50);
    }
  });

  // --- Sidebar Search / Filter ---
  const searchInput = document.getElementById('sidebar-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      tocLinks.forEach((link) => {
        const text = link.textContent.toLowerCase();
        if (!query || text.includes(query)) {
          link.style.display = '';
        } else {
          link.style.display = 'none';
        }
      });
    });
  }

  // --- Mobile Sidebar Drawer Toggle ---
  const menuToggleBtn = document.getElementById('menu-toggle-btn');
  const appSidebar = document.getElementById('app-sidebar');

  if (menuToggleBtn && appSidebar) {
    menuToggleBtn.addEventListener('click', () => {
      appSidebar.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (
        appSidebar.classList.contains('open') &&
        !appSidebar.contains(e.target) &&
        !menuToggleBtn.contains(e.target)
      ) {
        appSidebar.classList.remove('open');
      }
    });
  }

  // --- Back to Top Button ---
  const backToTopBtn = document.getElementById('back-to-top');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- Print Button ---
  const printBtn = document.getElementById('print-btn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // --- Image Lightbox ---
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');

  if (lightboxModal && lightboxImg) {
    const images = manualContent ? manualContent.querySelectorAll('img') : [];

    images.forEach((img) => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || 'ภาพขยาย';
        lightboxModal.classList.add('active');
      });
    });

    function closeLightbox() {
      lightboxModal.classList.remove('active');
      lightboxImg.src = '';
    }

    if (lightboxClose) {
      lightboxClose.addEventListener('click', closeLightbox);
    }

    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightboxModal.classList.contains('active')) {
        closeLightbox();
      }
    });
  }

})();
