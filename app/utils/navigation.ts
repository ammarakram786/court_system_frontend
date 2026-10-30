import type { NavigationMenuItem } from '@nuxt/ui'

/**
 * Sidebar navigation – unified navigation tree for Pakistan Court & Case Management System.
 */
export const mainNavigation: NavigationMenuItem[] = [
  {
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    to: '/'
  },
  {
    label: 'Cases & Dockets',
    icon: 'i-lucide-scale',
    defaultOpen: true,
    children: [
      {
        label: 'All Cases',
        icon: 'i-lucide-folder-git-2',
        to: '/cases'
      },
      {
        label: 'Proceedings & Hearings',
        icon: 'i-lucide-gavel',
        to: '/proceedings'
      },
      {
        label: 'Case Categories',
        icon: 'i-lucide-tags',
        to: '/categories'
      }
    ]
  },
  {
    label: 'Court Roster',
    icon: 'i-lucide-calendar-days',
    defaultOpen: true,
    children: [
      {
        label: 'Daily Cause Lists',
        icon: 'i-lucide-list-ordered',
        to: '/cause-lists'
      }
    ]
  },
  {
    label: 'Judicial Setup',
    icon: 'i-lucide-landmark',
    children: [
      {
        label: 'Courts Directory',
        icon: 'i-lucide-building-2',
        to: '/courts'
      },
      {
        label: 'Police Stations',
        icon: 'i-lucide-shield-alert',
        to: '/police-stations'
      }
    ]
  },
  {
    label: 'Administration',
    icon: 'i-lucide-shield-check',
    children: [
      {
        label: 'Organizations',
        icon: 'i-lucide-network',
        to: '/organizations'
      },
      {
        label: 'Officers & Users',
        icon: 'i-lucide-users',
        to: '/users'
      },
      {
        label: 'Roles & RBAC',
        icon: 'i-lucide-lock',
        to: '/roles'
      },
      {
        label: 'Ranks & Appointments',
        icon: 'i-lucide-award',
        to: '/ranks-appointments'
      }
    ]
  }
]
