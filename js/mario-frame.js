// Move Mario game controls outside the iframe once it loads

export function initMarioFrame() {
  const iframe = document.getElementById('mario-game')
  const controlsContainer = document.getElementById('mario-controls')
  if (!iframe || !controlsContainer) return

  function moveControls() {
    try {
      const innerDoc = iframe.contentDocument || iframe.contentWindow.document
      const controls = innerDoc.getElementById('controls')
      if (controls && controls.childElementCount > 0) {
        clearInterval(waiter)
        controls.remove()
        document.adoptNode(controls)
        controlsContainer.appendChild(controls)

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
      clearInterval(waiter)
      console.error('Failed to move Mario controls', err)
    }
  }

  let waiter
  iframe.addEventListener('load', () => {
    moveControls()
    waiter = setInterval(moveControls, 200)
    setTimeout(() => clearInterval(waiter), 15000)
  })
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMarioFrame)
} else {
  initMarioFrame()
}
