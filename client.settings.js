// 设置页组件分块：入口在模块级 require.async 取用，返回组件工厂。
window.__ModuleLoader__.load({
  id: 'dsh-heipm',
  chunk: 'client.settings.js',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    /** deps: { useState, useRef, useEffect, applyTheme, saveTheme, themeState, THEME_DEFAULTS } */
    function createHeipmStyleSection(deps) {
      const { useState, useRef, useEffect, applyTheme, saveTheme, themeState, THEME_DEFAULTS } = deps
      return function HeipmStyleSection(props) {
        const t = typeof props.t === 'function' ? props.t : key => key
        const [theme, setTheme] = useState(themeState.theme)
        const timer = useRef(null)
        useEffect(() => {
          const sync = next => setTheme(next)
          themeState.listeners.push(sync)
          setTheme(themeState.theme)
          return () => {
            const at = themeState.listeners.indexOf(sync)
            if (at >= 0) themeState.listeners.splice(at, 1)
            if (timer.current) clearTimeout(timer.current)
          }
        }, [])
        const commit = next => {
          setTheme(next)
          applyTheme(next)
          if (timer.current) clearTimeout(timer.current)
          timer.current = setTimeout(() => { saveTheme(next).catch(() => {}) }, 400)
        }
        const chip = (label, background) => h('span', { className: 'pm-style-chip' },
          h('i', { className: 'pm-style-dot', style: { background } }),
          label,
        )
        const row = (key, label, hint) => h('div', { className: 'pm-style-row', key },
          h('div', { className: 'pm-style-text' },
            h('span', { className: 'pm-style-label' }, label),
            h('span', { className: 'pm-style-hint' }, hint),
          ),
          h('input', {
            className: 'pm-style-swatch',
            type: 'color',
            value: theme[key] || '#808080',
            onChange: event => commit({ ...theme, [key]: String(event.target.value || '') }),
          }),
          h('span', { className: 'pm-style-value' }, theme[key] || t('style.follow')),
          h('button', {
            type: 'button',
            className: 'pm-style-clear',
            onClick: () => commit({ ...theme, [key]: '' }),
          }, t('style.clear')),
        )
        return h('div', { className: 'pm-style' },
          h('p', { className: 'pm-style-desc' }, t('style.desc')),
          h('div', { className: 'pm-style-preview' },
            h('p', { className: 'pm-style-preview-title' }, t('style.preview')),
            chip(t('style.previewSelect'), 'var(--hm-accent, #ff9f43)'),
            chip(t('style.previewButton'), 'var(--hm-accent, #ff9f43)'),
            chip(t('style.previewHead'), 'var(--hm-card, #262a31)'),
            chip(t('style.previewPanel'), 'var(--hm-panel, #1b1f26)'),
            chip(t('style.previewMuted'), 'var(--hm-line, #94a3b8)'),
          ),
          row('accent', t('style.accent'), t('style.accentHint')),
          row('panel', t('style.panel'), t('style.panelHint')),
          row('card', t('style.card'), t('style.cardHint')),
          row('ink', t('style.ink'), t('style.inkHint')),
          row('dim', t('style.dim'), t('style.dimHint')),
          row('line', t('style.line'), t('style.lineHint')),
          h('div', { className: 'pm-style-row' },
            h('div', { className: 'pm-style-text' },
              h('span', { className: 'pm-style-label' }, t('style.radius')),
              h('span', { className: 'pm-style-hint' }, t('style.radiusHint')),
            ),
            h('span'),
            h('input', {
              className: 'pm-style-range',
              type: 'range',
              min: '0',
              max: '24',
              step: '1',
              value: String(theme.radius),
              onChange: event => commit({ ...theme, radius: Number(event.target.value) }),
            }),
            h('span', { className: 'pm-style-value' }, theme.radius + 'px'),
          ),
          h('div', { className: 'pm-style-actions' },
            h('button', {
              type: 'button',
              className: 'pm-style-reset',
              onClick: () => commit({ ...THEME_DEFAULTS }),
            }, t('style.reset')),
          ),
          h('p', { className: 'pm-style-note' }, t('style.note')),
        )
      }
    }

    return { createHeipmStyleSection }
  },
})
