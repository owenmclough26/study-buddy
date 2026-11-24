import { supabase } from './repo'
import { VAPID_PUBLIC_KEY } from './pushConfig'
import { isInstalled } from './analytics'

/** ok: can turn on. needs-install: iPhone/iPad that must add the app to the Home Screen first. */
export type PushSupport = 'ok' | 'needs-install' | 'unsupported'

const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export function pushSupport(): PushSupport {
  const hasApi = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  if (hasApi) return 'ok'
  return isIOS() && !isInstalled() ? 'needs-install' : 'unsupported'
}

/** The service worker only exists in the built app (not the dev server), so don't wait forever. */
async function swReady(timeoutMs = 5000): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  return Promise.race([navigator.serviceWorker.ready, new Promise<null>((r) => setTimeout(() => r(null), timeoutMs))])
}

function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (base64url.length % 4)) % 4)
  const raw = atob((base64url + pad).replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

function deviceLabel(): string {
  const ua = navigator.userAgent
  if (/iPhone/.test(ua)) return 'iPhone'
  if (/iPad/.test(ua) || isIOS()) return 'iPad'
  if (/Android/.test(ua)) return 'Android'
  if (/Mac/.test(ua)) return 'Mac'
  if (/Windows/.test(ua)) return 'Windows'
  return 'Other'
}

export type PushResult = { ok: true } | { ok: false; reason: string }

/** Ask permission, register this device, and save it so the server can send to it. */
export async function enablePush(): Promise<PushResult> {
  if (!supabase) return { ok: false, reason: 'Reminders need an account. Sign in first.' }
  if (pushSupport() !== 'ok') return { ok: false, reason: 'This browser can’t show notifications.' }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return {
      ok: false,
      reason:
        permission === 'denied'
          ? 'Notifications are blocked for this site. Allow them in your phone or browser settings, then try again.'
          : 'No problem. You can turn reminders on any time.',
    }
  }

  const reg = await swReady()
  if (!reg) return { ok: false, reason: 'The app is still setting itself up. Reload the page and try again.' }

  try {
    const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) }))
    const json = sub.toJSON()
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({ endpoint: sub.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth, device: deviceLabel() }, { onConflict: 'endpoint' })
    if (error) return { ok: false, reason: `Couldn’t save this device: ${error.message}` }
    return { ok: true }
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : 'Couldn’t turn on notifications.' }
  }
}

/** Stop notifications on this device. */
export async function disablePush(): Promise<void> {
  const reg = await swReady(2000)
  const sub = await reg?.pushManager.getSubscription()
  if (!sub) return
  await supabase?.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
  await sub.unsubscribe().catch(() => {})
}

export async function deviceSubscribed(): Promise<boolean> {
  if (pushSupport() !== 'ok' || Notification.permission !== 'granted') return false
  const reg = await swReady(2000)
  return !!(await reg?.pushManager.getSubscription())
}

/** Shows a sample notification right on this device (no server involved). */
export async function testNotification(buddyName: string): Promise<boolean> {
  const reg = await swReady(2000)
  if (!reg) return false
  await reg.showNotification('Study Buddy', {
    body: `This is what a reminder looks like. ${buddyName} says hi! 🐱`,
    icon: '/pwa-192.png',
    tag: 'test',
    data: { url: '/' },
  })
  return true
}
