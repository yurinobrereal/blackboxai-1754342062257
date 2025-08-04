// Global JavaScript for Kenku Theme

class MenuDrawer extends HTMLElement {
  constructor() {
    super();

    this.mainDetailsToggle = this.querySelector('details');

    this.addEventListener('keyup', this.onKeyUp.bind(this));
    this.addEventListener('focusout', this.onFocusOut.bind(this));
    this.bindEvents();
  }

  bindEvents() {
    this.querySelectorAll('summary').forEach(summary => summary.addEventListener('click', this.onSummaryClick.bind(this)));
    this.querySelectorAll('button').forEach(button => button.addEventListener('click', this.onCloseButtonClick.bind(this)));
  }

  onKeyUp(event) {
    if(event.code.toUpperCase() !== 'ESCAPE') return;

    const openDetailsElement = event.target.closest('details[open]');
    if(!openDetailsElement) return;

    openDetailsElement === this.mainDetailsToggle ? this.closeMenuDrawer(event, this.mainDetailsToggle.querySelector('summary')) : this.closeSubmenu(openDetailsElement);
  }

  onSummaryClick(event) {
    const detailsElement = event.currentTarget.parentNode;
    const parentMenuElement = detailsElement.closest('.has-submenu');
    const isOpen = detailsElement.hasAttribute('open');
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function addTrapFocus() {
      trapFocus(detailsElement.querySelector('.submenu'), detailsElement.querySelector('summary'));
    }

    if (detailsElement === this.mainDetailsToggle) {
      if(isOpen) event.preventDefault();
      isOpen ? this.closeMenuDrawer(event, event.currentTarget) : this.openMenuDrawer(event.currentTarget);
    } else {
      setTimeout(() => {
        detailsElement.classList.add('menu-opening');
        if(!reducedMotion || reducedMotion.matches) {
          addTrapFocus();
        } else {
          detailsElement.addEventListener('transitionend', addTrapFocus, { once: true });
        }
      }, 100);
    }
  }

  openMenuDrawer(summaryElement) {
    setTimeout(() => {
      this.mainDetailsToggle.classList.add('menu-opening');
    });
    summaryElement.setAttribute('aria-expanded', true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus = false) {
    if (event === undefined) return;

    this.mainDetailsToggle.classList.remove('menu-opening');
    this.mainDetailsToggle.querySelectorAll('details').forEach(details => {
      details.removeAttribute('open');
      details.classList.remove('menu-opening');
    });
    this.mainDetailsToggle.querySelectorAll('.submenu').forEach(submenu => submenu.classList.remove('submenu-open'));
    document.body.classList.remove(`overflow-hidden-${this.dataset.breakpoint}`);
    removeTrapFocus(elementToFocus);
    this.closeAnimation(this.mainDetailsToggle);
  }

  onFocusOut(event) {
    setTimeout(() => {
      if (this.mainDetailsToggle.hasAttribute('open') && !this.mainDetailsToggle.contains(document.activeElement)) this.closeMenuDrawer();
    });
  }

  onCloseButtonClick(event) {
    const detailsElement = event.currentTarget.closest('details');
    this.closeSubmenu(detailsElement);
  }

  closeSubmenu(detailsElement) {
    const parentMenuElement = detailsElement.closest('.submenu');

    parentMenuElement.classList.remove('submenu-open');
    detailsElement.classList.remove('menu-opening');
    detailsElement.querySelector('summary').setAttribute('aria-expanded', false);
    removeTrapFocus(detailsElement.querySelector('summary'));
    this.closeAnimation(detailsElement);
  }

  closeAnimation(detailsElement) {
    let animationStart;

    const handleAnimation = (time) => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      if (elapsedTime < 400) {
        window.requestAnimationFrame(handleAnimation);
      } else {
        detailsElement.removeAttribute('open');
        if (detailsElement.closest('details[open]')) {
          trapFocus(detailsElement.closest('details[open]'), detailsElement.querySelector('summary'));
        }
      }
    }

    window.requestAnimationFrame(handleAnimation);
  }
}

customElements.define('menu-drawer', MenuDrawer);

// Utility Functions
function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  );
}

function trapFocus(container, elementToFocus = container) {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  container.setAttribute('tabindex', '-1');
  elementToFocus.focus();

  function handleKeydown(event) {
    if (event.code.toUpperCase() !== 'TAB') return;

    if (event.shiftKey) {
      if (event.target === first) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (event.target === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  document.addEventListener('keydown', handleKeydown);

  container.addEventListener('focusout', function(event) {
    if (container.contains(event.relatedTarget)) return;
    elementToFocus.focus();
  });
}

function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener('keydown', trapFocus);

  if (elementToFocus) elementToFocus.focus();
}

function pauseAllMedia() {
  document.querySelectorAll('.js-youtube').forEach((video) => {
    video.contentWindow.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*');
  });
  document.querySelectorAll('.js-vimeo').forEach((video) => {
    video.contentWindow.postMessage('{"method":"pause"}', '*');
  });
  document.querySelectorAll('video').forEach((video) => video.pause());
  document.querySelectorAll('product-model').forEach((model) => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function fetchConfig(type = 'json') {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': `application/${type}` }
  };
}

// Kenku specific functions
function changeMainImage(thumbnail) {
  const mainImage = document.querySelector('.product-main-image');
  const thumbnails = document.querySelectorAll('.thumbnail');
  
  // Remove active class from all thumbnails
  thumbnails.forEach(thumb => thumb.classList.remove('active'));
  
  // Add active class to clicked thumbnail
  thumbnail.classList.add('active');
  
  // Change main image source
  const newSrc = thumbnail.src.replace('width=100', 'width=600');
  mainImage.src = newSrc;
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
  // Set first thumbnail as active by default
  const firstThumbnail = document.querySelector('.thumbnail');
  if (firstThumbnail) {
    firstThumbnail.classList.add('active');
  }

  // Add scroll animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  // Observe elements for animation
  document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
  });
});

// Global window functions
window.pauseAllMedia = pauseAllMedia;
window.debounce = debounce;
window.fetchConfig = fetchConfig;
window.changeMainImage = changeMainImage;
