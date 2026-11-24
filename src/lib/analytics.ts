import type { PostHog } from 'posthog-js'

/**
 * Product analytics (PostHog). Off unless VITE_POSTHOG_KEY is set, and the PostHog
 * library is only downloaded in that case, so it never slows the app down otherwise.
 *
 * Privacy rules, since many users are minors:
 * - no autocapture, no session recordings, no emails, no task or class names
 * - users are identified only by their random account id
 * - event properties are numbers and fixed labels only
 */
const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const host = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://us.i.posthog.com'

let ph: PostHog | null = null
let started = false
/** calls made before the library finished loading */
const queue: ((p: PostHog) => void)[] = []

function run(fn: (p: PostHog) => void) {
  if (!key) return
  if (ph) {
    try {
      fn(ph)
    } catch {
      /* analytics must never break the app */
    }
  } else queue.push(fn)
}

export function initAnalytics() {
  if (!key || started) return
  started = true
  import('posthog-js')
    .then(({ default: posthog }) => {
      posthog.init(key, {
        api_host: host,
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        disable_session_recording: true,
        // the project's own settings can switch these on remotely; keep them off (they can record what was clicked)
        capture_dead_clicks: false,
        capture_heatmaps: false,
        rageclick: false,
        capture_performance: false,
        capture_exceptions: false,
        disable_surveys: true,
        person_profiles: 'identified_only',
        persistence: 'localStorage',
        ip: false,
      })
      ph = posthog
      for (const fn of queue.splice(0)) run(fn)
    })
    .catch(() => {
      /* blocked by an ad blocker, offline, etc. */
    })
  track('app_opened', { installed: isInstalled() })
}

export type AnalyticsEvent =
  | 'app_opened'
  | 'signed_up'
  | 'buddy_adopted'
  | 'coat_changed'
  | 'schedule_block_added'
  | 'task_added'
  | 'task_completed'
  | 'focus_session_saved'
  | 'relax_break_taken'
  | 'shop_purchase'
  | 'reminders_enabled'
  | 'opened_from_notification'

export function track(event: AnalyticsEvent, props?: Record<string, string | number | boolean>) {
  run((p) => p.capture(event, props))
}

/** Screen views by route name only (ids and query strings are stripped). */
export function pageview(pathname: string) {
  const screen = pathname.split('/').filter(Boolean)[0] ?? 'home'
  const room = pathname.startsWith('/rooms/') ? pathname.split('/')[2] : undefined
  run((p) => p.capture('$pageview', { $current_url: `${location.origin}/${screen === 'home' ? '' : screen}`, screen, ...(room ? { room } : {}) }))
}

export function identify(userId: string) {
  run((p) => p.identify(userId))
}

export function resetAnalytics() {
  run((p) => p.reset())
}

/** True when opened from the home screen as an installed app. */
export function isInstalled(): boolean {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
  } catch {
    return false
  }
}
