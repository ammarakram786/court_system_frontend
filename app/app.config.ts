/**
 * Single source of truth for the design system.
 *
 * Only official Tailwind palette names are allowed here (e.g. 'indigo', 'slate').
 * Never use raw hex / rgb values anywhere in the app. To re-theme the whole
 * dashboard, change the values in this file only.
 */
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'indigo',
      secondary: 'sky',
      success: 'emerald',
      info: 'blue',
      warning: 'amber',
      error: 'red',
      neutral: 'slate'
    }
  }
})
