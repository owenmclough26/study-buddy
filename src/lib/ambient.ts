/** Background sounds generated with the Web Audio API, so there are no audio files to load. */
export type Ambient = 'off' | 'rain' | 'brown' | 'waves' | 'fire'

export const AMBIENTS: { key: Ambient; label: string }[] = [
  { key: 'off', label: 'No sound' },
  { key: 'rain', label: 'Rain' },
  { key: 'brown', label: 'Brown noise' },
  { key: 'waves', label: 'Ocean waves' },
  { key: 'fire', label: 'Fireplace' },
]

function noiseBuffer(ctx: AudioContext, kind: 'white' | 'pink' | 'brown'): AudioBuffer {
  const len = ctx.sampleRate * 4
  const buf = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    let last = 0
    let b0 = 0, b1 = 0, b2 = 0
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1
      if (kind === 'white') d[i] = w
      else if (kind === 'brown') {
        last = (last + 0.02 * w) / 1.02
        d[i] = last * 3.5
      } else {
        b0 = 0.99765 * b0 + w * 0.099046
        b1 = 0.963 * b1 + w * 0.2965164
        b2 = 0.57 * b2 + w * 1.0526913
        d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.11
      }
    }
  }
  return buf
}

export class AmbientPlayer {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private nodes: AudioNode[] = []
  private timers: number[] = []
  private volume = 0.5

  setVolume(v: number) {
    this.volume = v
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1)
  }

  play(kind: Ambient) {
    this.stop()
    if (kind === 'off') return
    const ctx = (this.ctx ??= new AudioContext())
    void ctx.resume()
    const master = ctx.createGain()
    master.gain.value = this.volume
    master.connect(ctx.destination)
    this.master = master

    const src = ctx.createBufferSource()
    src.loop = true
    if (kind === 'rain') {
      src.buffer = noiseBuffer(ctx, 'pink')
      const hp = ctx.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 400
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 7000
      src.connect(hp).connect(lp).connect(master)
      this.nodes.push(hp, lp)
    } else if (kind === 'brown') {
      src.buffer = noiseBuffer(ctx, 'brown')
      src.connect(master)
    } else if (kind === 'waves') {
      src.buffer = noiseBuffer(ctx, 'brown')
      const g = ctx.createGain()
      g.gain.value = 0.55
      const lfo = ctx.createOscillator()
      lfo.frequency.value = 0.09
      const depth = ctx.createGain()
      depth.gain.value = 0.45
      lfo.connect(depth).connect(g.gain)
      lfo.start()
      src.connect(g).connect(master)
      this.nodes.push(g, lfo, depth)
    } else if (kind === 'fire') {
      src.buffer = noiseBuffer(ctx, 'brown')
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 900
      src.connect(lp).connect(master)
      this.nodes.push(lp)
      // crackles
      const crackle = noiseBuffer(ctx, 'white')
      const pop = () => {
        if (!this.master) return
        const s = ctx.createBufferSource()
        s.buffer = crackle
        const bp = ctx.createBiquadFilter()
        bp.type = 'bandpass'
        bp.frequency.value = 1500 + Math.random() * 2500
        const g = ctx.createGain()
        const t = ctx.currentTime
        g.gain.setValueAtTime(0.0001, t)
        g.gain.exponentialRampToValueAtTime(0.4 + Math.random() * 0.5, t + 0.005)
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04 + Math.random() * 0.05)
        s.connect(bp).connect(g).connect(master)
        s.start(t, Math.random() * 3, 0.12)
        this.timers.push(window.setTimeout(pop, 60 + Math.random() * 500))
      }
      pop()
    }
    src.start()
    this.nodes.push(src)
  }

  stop() {
    this.timers.forEach((t) => window.clearTimeout(t))
    this.timers = []
    for (const n of this.nodes) {
      try {
        if (n instanceof AudioScheduledSourceNode) n.stop()
        n.disconnect()
      } catch {
        /* already stopped */
      }
    }
    this.nodes = []
    this.master?.disconnect()
    this.master = null
  }

  dispose() {
    this.stop()
    void this.ctx?.close()
    this.ctx = null
  }
}

/** A soft purr for petting: low rumbling noise pulsing about 24 times a second. */
export function purr() {
  try {
    const ctx = new AudioContext()
    const t = ctx.currentTime
    const src = ctx.createBufferSource()
    src.buffer = noiseBuffer(ctx, 'brown')
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 260
    const amp = ctx.createGain()
    amp.gain.value = 0
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 24
    const depth = ctx.createGain()
    depth.gain.value = 0.5
    lfo.connect(depth).connect(amp.gain)
    const env = ctx.createGain()
    env.gain.setValueAtTime(0.0001, t)
    env.gain.exponentialRampToValueAtTime(0.9, t + 0.15)
    env.gain.exponentialRampToValueAtTime(0.0001, t + 1.3)
    src.connect(lp).connect(amp).connect(env).connect(ctx.destination)
    lfo.start(t)
    src.start(t)
    src.stop(t + 1.4)
    lfo.stop(t + 1.4)
    window.setTimeout(() => void ctx.close(), 1800)
  } catch {
    /* audio unavailable */
  }
}
