// Move Mario game controls outside the iframe once it loads

export function initMarioFrame() {
  const iframe = document.getElementById('mario-game')
  const controlsContainer = document.getElementById('mario-controls')
  if (!iframe || !controlsContainer) return

  iframe.addEventListener('load', () => {
    try {
      const innerDoc = iframe.contentDocument || iframe.contentWindow.document
      const controls = innerDoc.getElementById('controls')
      if (controls) {
        // remove from iframe and adopt into outer document
        controls.remove()
        document.adoptNode(controls)
        controlsContainer.appendChild(controls)

        // make controls clickable instead of hover-based
        const buttons = controls.querySelectorAll('.control')
        buttons.forEach((btn) => {
          btn.onmouseover = null
          btn.onmouseout = null
          btn.addEventListener('click', () => {
            const isActive = btn.getAttribute('active') === 'on'
            btn.setAttribute('active', isActive ? 'off' : 'on')
          })
        })
      }
    } catch (err) {
      console.error('Failed to move Mario controls', err)
    }
  })
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMarioFrame)
} else {
  initMarioFrame()
}
