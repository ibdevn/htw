function goBack(event, url) {
  if (document.referrer && document.referrer.includes(url)) {
    window.history.back()
    // on js heavy pages, this may take some time
    event.preventDefault()
    setTimeout(() => {
      // Fallback in case history.back() fails
      if (document.location.pathname !== url) {
        window.location.href = url
      }
    }, 400)
  } else {
    window.location.href = url
  }
}

function showSource() {
  // If already open, do nothing
  if (document.getElementById('source-overlay')) return

  const htmlSource = (function () {
    const docType = document.doctype
    let dt = ''
    if (docType) {
      dt = `<!DOCTYPE ${docType.name}${docType.publicId ? ' PUBLIC "' + docType.publicId + '"' : ''}${docType.systemId ? ' "' + docType.systemId + '"' : ''}>\n`
    }
    return dt + document.documentElement.outerHTML
  })()

  const overlay = document.createElement('div')
  overlay.id = 'source-overlay'
  overlay.setAttribute('role', 'dialog')
  overlay.setAttribute('aria-label', 'Seitenquelltext')
  overlay.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:999999',
    'background:rgba(0,0,0,.85)',
    'backdrop-filter:blur(3px)',
    'display:flex',
    'flex-direction:column',
    'padding:16px',
    'box-sizing:border-box',
    'font-family:Consolas,monospace',
    'color:#222',
  ].join(';')

  const inner = document.createElement('div')
  inner.style.cssText = [
    'position:relative',
    'flex:1',
    'background:#f7f7f7',
    'border:1px solid #444',
    'border-radius:10px',
    'box-shadow:0 4px 25px rgba(0,0,0,.5)',
    'overflow:hidden',
    'display:flex',
    'flex-direction:column',
  ].join(';')

  const header = document.createElement('div')
  header.style.cssText = [
    'display:flex',
    'align-items:center',
    'justify-content:space-between',
    'padding:10px 14px',
    'background:linear-gradient(#ffffff,#e7e7e7)',
    'border-bottom:1px solid #ccc',
    'font-weight:600',
    'font-size:14px',
    'letter-spacing:.5px',
  ].join(';')
  header.textContent = 'Seitenquelltext'

  const closeBtn = document.createElement('button')
  closeBtn.type = 'button'
  closeBtn.setAttribute('aria-label', 'Schließen (Esc)')
  closeBtn.textContent = '×'
  closeBtn.style.cssText = [
    'cursor:pointer',
    'border:none',
    'background:transparent',
    'color:#333',
    'font-size:26px',
    'line-height:1',
    'padding:0 6px 4px',
    'margin:0',
    'font-family:inherit',
    'transition:color .15s ease',
  ].join(';')
  closeBtn.onmouseenter = () => (closeBtn.style.color = '#d00')
  closeBtn.onmouseleave = () => (closeBtn.style.color = '#333')

  const bodyWrap = document.createElement('div')
  bodyWrap.style.cssText = [
    'flex:1',
    'overflow:auto',
    'padding:16px',
    'font-size:16px',
    'line-height:1.4',
    'tab-size:2',
    'white-space:pre',
    'background:#1e1e1e',
    'color:#d6d6d6',
    'text-shadow:none',
  ].join(';')

  const pre = document.createElement('pre')
  pre.style.cssText = [
    'margin:0',
    'font-family:inherit',
    'white-space:pre-wrap',
    'word-break:break-word',
  ].join(';')
  pre.textContent = htmlSource
  bodyWrap.appendChild(pre)

  function close() {
    window.removeEventListener('keydown', onKey)
    overlay.remove()
  }
  function onKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    }
  }
  window.addEventListener('keydown', onKey)
  closeBtn.addEventListener('click', close)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close()
  })

  header.appendChild(closeBtn)
  inner.appendChild(header)
  inner.appendChild(bodyWrap)
  overlay.appendChild(inner)
  document.body.appendChild(overlay)
  // Focus for accessibility
  closeBtn.focus()
}

window.addEventListener('DOMContentLoaded', () => {
  const mapEl = document.getElementById('go-here-after-loading-map')
  if (mapEl) {
    mapEl.scrollIntoView({ block: 'center', inline: 'center' })
  }
  // Apply WebXRay accent color on page load
  applyWebXRayAccentColor()
})

function getLng() {
  return document.documentElement.lang === 'en' ? 'en' : 'de'
}

function loadXRay() {
  ;(function () {
    const script = document.createElement('script')
    script.src = '/webxray/webxray.js'
    script.className = 'webxray'
    script.setAttribute('data-lang', 'en-US')
    script.setAttribute('data-baseuri', document.location.origin + '/webxray')
    document.body.appendChild(script)
  })()
}

/**
 * Apply user's accent color to WebXRay elements
 * Reads the --main-color CSS variable (set by server) and applies it to WebXRay
 */
function applyWebXRayAccentColor() {
  try {
    const mainColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--main-color')
      .trim()
    
    if (mainColor && /^#[0-9a-fA-F]{6}$/.test(mainColor)) {
      document.documentElement.style.setProperty('--webxray-accent-color', mainColor)
      
      // Inject CSS into all iframes (WebXRay dialog iframes)
      injectAccentColorIntoIframes(mainColor)
    }
  } catch (e) {
    console.warn('Error applying WebXRay accent color:', e)
  }
}

/**
 * Inject the accent color CSS into WebXRay dialog iframes
 */
function injectAccentColorIntoIframes(accentColor) {
  try {
    const iframes = document.querySelectorAll('iframe')
    iframes.forEach((iframe) => {
      try {
        if (iframe.contentDocument) {
          // Inject CSS variable into iframe's root element
          if (iframe.contentDocument.documentElement) {
            iframe.contentDocument.documentElement.style.setProperty('--webxray-accent-color', accentColor)
          }
          
          // Inject a style tag if needed
          let styleTag = iframe.contentDocument.getElementById('webxray-accent-color-style')
          if (!styleTag) {
            styleTag = iframe.contentDocument.createElement('style')
            styleTag.id = 'webxray-accent-color-style'
            styleTag.innerHTML = `
              :root {
                --webxray-accent-color: ${accentColor};
              }
              button, input[type="button"], input[type="submit"] {
                background-color: var(--webxray-accent-color);
                color: white;
                border: none;
                padding: 8px 16px;
                cursor: pointer;
                border-radius: 4px;
                font-size: 14px;
                font-weight: 500;
              }
              button:hover, input[type="button"]:hover, input[type="submit"]:hover {
                opacity: 0.9;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
              }
              button:active, input[type="button"]:active, input[type="submit"]:active {
                opacity: 0.8;
              }
            `
            iframe.contentDocument.head.appendChild(styleTag)
          } else {
            // Update existing style tag
            styleTag.innerHTML = styleTag.innerHTML.replace(
              /--webxray-accent-color: #[0-9a-fA-F]{6}/,
              `--webxray-accent-color: ${accentColor}`
            )
          }
        }
      } catch (e) {
        // Cross-origin iframes will throw errors - that's expected
      }
    })
  } catch (e) {
    console.warn('Error injecting accent color into iframes:', e)
  }
}

// Listen for color changes and iframe creations
const observer = new MutationObserver((mutations) => {
  applyWebXRayAccentColor()
  // Also check for new iframes
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length > 0) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1 && node.tagName === 'IFRAME') {
          // Wait a bit for iframe to load before injecting
          setTimeout(applyWebXRayAccentColor, 100)
        }
      })
    }
  })
})

// Start observing for style changes and DOM additions on documentElement
observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['style'],
  childList: true,
  subtree: true,
})

// Also observe body for iframe additions
observer.observe(document.body, {
  childList: true,
  subtree: true,
})
