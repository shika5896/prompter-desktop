import { A } from '@solidjs/router'
import { useI18n } from '../i18n'
import './MenuScreen.css'

export default function MenuScreen() {
  const t = useI18n()

  return (
    <div class="menu-screen">
      <h1 class="menu-title">{t('menu_title')}</h1>
      <nav class="menu-nav">
        <A href="/edit" class="menu-btn">
          <span class="menu-btn-icon">✎</span>
          <span class="menu-btn-label">{t('menu_edit')}</span>
        </A>
        <A href="/display" class="menu-btn">
          <span class="menu-btn-icon">▶</span>
          <span class="menu-btn-label">{t('menu_display')}</span>
        </A>
        <A href="/settings" class="menu-btn">
          <span class="menu-btn-icon">⚙</span>
          <span class="menu-btn-label">{t('menu_settings')}</span>
        </A>
      </nav>
    </div>
  )
}
