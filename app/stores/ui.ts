import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', () => {
  const sidebarCollapsed = useCookie<boolean>('ui_sidebar_collapsed', { default: () => false, sameSite: 'lax' })
  const toggleSidebar = () => { sidebarCollapsed.value = !sidebarCollapsed.value }
  return { sidebarCollapsed, toggleSidebar }
})
