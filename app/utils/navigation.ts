import type { NavigationMenuItem } from '@nuxt/ui'

/**
 * Sidebar navigation – the single place to register new admin sections.
 * Add an item here when a new page/module is built.
 */
export const mainNavigation: NavigationMenuItem[] = [
  { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/' }
]
