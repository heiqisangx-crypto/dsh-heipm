// 工作区右键菜单分块：入口在模块级 require.async 取用，返回安装函数工厂。
window.__ModuleLoader__.load({
  id: 'dsh-heipm',
  chunk: 'client.workspace.js',
  factory(require) {
    /** deps: { api, HOST_CONTRACT, WS_CTX_ICON, WS_CTX_CSS, workspaceTitleOf, workspaceErrorText, normalizeWorkspaceTitle, clampMenuPosition, workspaceKeyId } */
    function createWorkspaceMenu(deps) {
      const { api, HOST_CONTRACT, WS_CTX_ICON, WS_CTX_CSS, workspaceTitleOf, workspaceErrorText, normalizeWorkspaceTitle, clampMenuPosition, workspaceKeyId } = deps
  function installWorkspaceMenuStyles(doc) {
    if (!doc || !doc.head || typeof doc.createElement !== 'function') return () => {}
    if (typeof doc.querySelector === 'function' && doc.querySelector('style[data-plugin-css="heipm:workspace-menu"]')) return () => {}
    const tag = doc.createElement('style')
    tag.setAttribute('data-plugin-css', 'heipm:workspace-menu')
    tag.textContent = WS_CTX_CSS
    doc.head.appendChild(tag)
    return () => {
      if (typeof tag.remove === 'function') tag.remove()
    }
  }

  function installWorkspaceContextMenu(workspaces, t) {
    if (typeof document === 'undefined' || !document.body || !workspaces) return () => {}
    const doc = document
    const win = typeof window === 'undefined' ? null : window
    const stopStyles = installWorkspaceMenuStyles(doc)
    let menu = null
    let dialog = null
    let lastFocus = null

    const create = (tag, className, text) => {
      const node = doc.createElement(tag)
      if (className) node.className = className
      if (text !== undefined) node.textContent = text
      return node
    }

    const closeMenu = () => {
      if (!menu) return
      if (typeof menu.__cleanup === 'function') menu.__cleanup()
      if (menu.parentNode) menu.parentNode.removeChild(menu)
      menu = null
    }

    const closeDialog = () => {
      if (!dialog) return
      if (typeof dialog.__cleanup === 'function') dialog.__cleanup()
      if (dialog.parentNode) dialog.parentNode.removeChild(dialog)
      dialog = null
      const focus = lastFocus
      lastFocus = null
      if (focus && typeof focus.focus === 'function') {
        try { focus.focus() } catch {}
      }
    }

    const showToast = message => {
      const node = create('div', 'pm-ctx-toast', message)
      node.setAttribute('role', 'status')
      doc.body.appendChild(node)
      if (win && typeof win.setTimeout === 'function') {
        win.setTimeout(() => {
          if (node.parentNode) node.parentNode.removeChild(node)
        }, 2600)
      }
    }

    const openFolder = async id => {
      try {
        await api({ action: 'open-folder', workspaceId: id })
      } catch {
        showToast(t('ctx.error.open'))
      }
    }

    const notifyChanged = () => {
      try {
        if (!win || typeof win.CustomEvent !== 'function' || typeof win.dispatchEvent !== 'function') return
        win.dispatchEvent(new win.CustomEvent('dsh-heipm:workspaces-changed'))
      } catch {}
    }

    const menuItem = (iconName, label, danger, onPick) => {
      const button = create('button', `pm-ctx-item${danger ? ' danger' : ''}`)
      button.type = 'button'
      button.setAttribute('role', 'menuitem')
      const icon = create('span', 'pm-ctx-icon')
      icon.innerHTML = WS_CTX_ICON[iconName] || ''
      const text = create('span', 'pm-ctx-label', label)
      button.appendChild(icon)
      button.appendChild(text)
      button.addEventListener('click', event => {
        event.preventDefault()
        event.stopPropagation()
        onPick()
      })
      return button
    }

    const openShell = label => {
      closeMenu()
      closeDialog()
      lastFocus = doc.activeElement
      const overlay = create('div', 'pm-ctx-overlay')
      const panel = create('div', 'pm-ctx-dialog')
      panel.setAttribute('role', 'dialog')
      panel.setAttribute('aria-modal', 'true')
      panel.setAttribute('aria-label', label)
      panel.appendChild(create('h2', 'pm-ctx-dialog-title', label))
      overlay.appendChild(panel)
      doc.body.appendChild(overlay)
      dialog = overlay
      const onKeyDown = event => {
        if (event.key !== 'Escape') return
        event.preventDefault()
        event.stopPropagation()
        closeDialog()
      }
      const onPointerDown = event => {
        if (event.target === overlay) closeDialog()
      }
      doc.addEventListener('keydown', onKeyDown, true)
      overlay.addEventListener('pointerdown', onPointerDown)
      overlay.__cleanup = () => {
        doc.removeEventListener('keydown', onKeyDown, true)
        overlay.removeEventListener('pointerdown', onPointerDown)
      }
      return panel
    }

    const openRename = (id, currentTitle) => {
      const panel = openShell(t('ctx.renameTitle'))
      panel.appendChild(create('p', 'pm-ctx-dialog-body', t('ctx.renameBody')))
      const form = create('form', 'pm-ctx-form')
      form.appendChild(create('div', 'pm-ctx-label-row', t('ctx.renameLabel')))
      const input = create('input', 'pm-ctx-input')
      input.type = 'text'
      input.value = currentTitle
      input.maxLength = 200
      input.autocomplete = 'off'
      input.spellcheck = false
      form.appendChild(input)
      const error = create('div', 'pm-ctx-error')
      form.appendChild(error)
      const foot = create('div', 'pm-ctx-foot')
      const cancel = create('button', 'pm-ctx-btn', t('ctx.cancel'))
      cancel.type = 'button'
      const confirm = create('button', 'pm-ctx-btn primary', t('ctx.confirm'))
      confirm.type = 'submit'
      foot.appendChild(cancel)
      foot.appendChild(confirm)
      form.appendChild(foot)
      panel.appendChild(form)

      let busy = false
      const setBusy = value => {
        busy = value
        input.disabled = value
        cancel.disabled = value
        confirm.disabled = value
        confirm.textContent = value ? t('ctx.working') : t('ctx.confirm')
      }
      form.addEventListener('submit', async event => {
        event.preventDefault()
        if (busy) return
        const next = normalizeWorkspaceTitle(input.value)
        error.textContent = ''
        if (!next) {
          error.textContent = t('ctx.error.blank')
          if (typeof input.focus === 'function') input.focus()
          return
        }
        if (next === normalizeWorkspaceTitle(currentTitle)) {
          closeDialog()
          return
        }
        setBusy(true)
        try {
          await workspaces.rename(id, next)
          closeDialog()
          notifyChanged()
        } catch (failure) {
          error.textContent = workspaceErrorText(failure, t, 'ctx.error.rename')
          setBusy(false)
        }
      })
      cancel.addEventListener('click', () => closeDialog())
      if (typeof input.focus === 'function') input.focus()
      if (typeof input.select === 'function') input.select()
    }

    const openDelete = (id, title) => {
      const panel = openShell(t('ctx.deleteTitle'))
      panel.appendChild(create('p', 'pm-ctx-dialog-body', t('ctx.deleteBody', { name: title || t('ctx.unnamed') })))
      const error = create('div', 'pm-ctx-error')
      panel.appendChild(error)
      const foot = create('div', 'pm-ctx-foot')
      const cancel = create('button', 'pm-ctx-btn', t('ctx.cancel'))
      cancel.type = 'button'
      const confirm = create('button', 'pm-ctx-btn danger', t('ctx.deleteConfirm'))
      confirm.type = 'button'
      foot.appendChild(cancel)
      foot.appendChild(confirm)
      panel.appendChild(foot)

      let busy = false
      const setBusy = value => {
        busy = value
        cancel.disabled = value
        confirm.disabled = value
        confirm.textContent = value ? t('ctx.working') : t('ctx.deleteConfirm')
      }
      confirm.addEventListener('click', async () => {
        if (busy) return
        error.textContent = ''
        setBusy(true)
        try {
          await workspaces.delete(id)
          closeDialog()
          notifyChanged()
        } catch (failure) {
          error.textContent = workspaceErrorText(failure, t, 'ctx.error.delete')
          setBusy(false)
        }
      })
      cancel.addEventListener('click', () => closeDialog())
      if (typeof cancel.focus === 'function') cancel.focus()
    }

    const openMenu = (id, x, y, fallbackTitle) => {
      closeMenu()
      closeDialog()
      const title = workspaceTitleOf(workspaces, id) || fallbackTitle || ''
      const node = create('div', 'pm-ctx')
      node.setAttribute('role', 'menu')
      node.setAttribute('tabindex', '-1')
      node.appendChild(menuItem('open', t('ctx.open'), false, () => {
        closeMenu()
        openFolder(id)
      }))
      node.appendChild(menuItem('rename', t('ctx.rename'), false, () => {
        closeMenu()
        openRename(id, title)
      }))
      node.appendChild(menuItem('delete', t('ctx.delete'), true, () => {
        closeMenu()
        openDelete(id, title)
      }))
      node.style.visibility = 'hidden'
      doc.body.appendChild(node)
      const bounds = typeof node.getBoundingClientRect === 'function' ? node.getBoundingClientRect() : { width: 0, height: 0 }
      const viewportWidth = win && Number.isFinite(win.innerWidth) ? win.innerWidth : 1280
      const viewportHeight = win && Number.isFinite(win.innerHeight) ? win.innerHeight : 800
      const spot = clampMenuPosition(x, y, bounds.width, bounds.height, viewportWidth, viewportHeight)
      node.style.left = `${spot.left}px`
      node.style.top = `${spot.top}px`
      node.style.visibility = ''
      menu = node
      const onPointerDown = event => {
        if (node.contains(event.target)) return
        closeMenu()
      }
      const onKeyDown = event => {
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          closeMenu()
          return
        }
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
        const items = Array.from(node.querySelectorAll('.pm-ctx-item'))
        if (!items.length) return
        event.preventDefault()
        const index = items.indexOf(doc.activeElement)
        const step = event.key === 'ArrowDown' ? 1 : -1
        const next = index < 0 ? 0 : (index + step + items.length) % items.length
        if (typeof items[next].focus === 'function') items[next].focus()
      }
      const onDismiss = () => closeMenu()
      doc.addEventListener('pointerdown', onPointerDown, true)
      doc.addEventListener('keydown', onKeyDown, true)
      if (win) {
        win.addEventListener('resize', onDismiss)
        win.addEventListener('scroll', onDismiss, true)
        win.addEventListener('blur', onDismiss)
      }
      node.__cleanup = () => {
        doc.removeEventListener('pointerdown', onPointerDown, true)
        doc.removeEventListener('keydown', onKeyDown, true)
        if (!win) return
        win.removeEventListener('resize', onDismiss)
        win.removeEventListener('scroll', onDismiss, true)
        win.removeEventListener('blur', onDismiss)
      }
      if (typeof node.focus === 'function') node.focus()
    }

    const rowTitle = row => {
      try {
        const title = row.querySelector(HOST_CONTRACT.workspaceTitle)
        if (title && title.textContent) return String(title.textContent).trim()
        return String(row.textContent || '').trim()
      } catch {
        return ''
      }
    }

    const onContextMenu = event => {
      if (event.defaultPrevented) return
      const target = event.target
      if (!target || typeof target.closest !== 'function') return
      if (target.closest('.pm-ctx, .pm-ctx-overlay')) return
      const row = target.closest(HOST_CONTRACT.workspaceRow)
      const id = row ? workspaceKeyId(row.getAttribute('data-row-key')) : null
      if (menu) closeMenu()
      if (!id) return
      event.preventDefault()
      event.stopPropagation()
      openMenu(id, event.clientX || 0, event.clientY || 0, rowTitle(row))
    }

    doc.addEventListener('contextmenu', onContextMenu, true)
    return () => {
      closeMenu()
      closeDialog()
      doc.removeEventListener('contextmenu', onContextMenu, true)
      stopStyles()
    }
  }

      return { installWorkspaceContextMenu, installWorkspaceMenuStyles }
    }

    return { createWorkspaceMenu }
  },
})
