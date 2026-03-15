type SoundName = 'fire' | 'invader_killed' | 'player_hit' | 'ufo_killed' | 'level_clear'

export function useSounds(): { playSound: (name: string) => void } {
  let ctx: AudioContext | null = null

  function getCtx(): AudioContext {
    if (!ctx) ctx = new AudioContext()
    return ctx
  }

  function playBeep(freq: number, duration: number, type: OscillatorType = 'square', gainValue = 0.3): void {
    const ac   = getCtx()
    const osc  = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, ac.currentTime)
    gain.gain.setValueAtTime(gainValue, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration / 1000)
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.start(ac.currentTime)
    osc.stop(ac.currentTime + duration / 1000)
  }

  function playDescending(freqStart: number, freqEnd: number, duration: number, type: OscillatorType = 'square'): void {
    const ac   = getCtx()
    const osc  = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freqStart, ac.currentTime)
    osc.frequency.exponentialRampToValueAtTime(freqEnd, ac.currentTime + duration / 1000)
    gain.gain.setValueAtTime(0.3, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration / 1000)
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.start(ac.currentTime)
    osc.stop(ac.currentTime + duration / 1000)
  }

  function playNoise(duration: number): void {
    const ac         = getCtx()
    const bufferSize = Math.floor(ac.sampleRate * duration / 1000)
    const buffer     = ac.createBuffer(1, bufferSize, ac.sampleRate)
    const data       = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    const source = ac.createBufferSource()
    const gain   = ac.createGain()
    const filter = ac.createBiquadFilter()
    source.buffer = buffer
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(400, ac.currentTime)
    gain.gain.setValueAtTime(0.2, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration / 1000)
    source.connect(filter)
    filter.connect(gain)
    gain.connect(ac.destination)
    source.start(ac.currentTime)
    source.stop(ac.currentTime + duration / 1000)
  }

  function playArpeggio(freqs: number[], totalDuration: number): void {
    const ac           = getCtx()
    const stepDuration = totalDuration / freqs.length / 1000
    freqs.forEach((freq, i) => {
      const osc  = ac.createOscillator()
      const gain = ac.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(freq, ac.currentTime)
      const startTime = ac.currentTime + i * stepDuration
      gain.gain.setValueAtTime(0.3, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + stepDuration * 0.9)
      osc.connect(gain)
      gain.connect(ac.destination)
      osc.start(startTime)
      osc.stop(startTime + stepDuration)
    })
  }

  function playSound(name: string): void {
    try {
      switch (name as SoundName) {
        case 'fire':           playBeep(440, 80, 'square'); break
        case 'invader_killed': playDescending(800, 200, 150, 'square'); break
        case 'player_hit':     playNoise(200); break
        case 'ufo_killed':     playDescending(200, 800, 300, 'square'); break
        case 'level_clear':    playArpeggio([523, 659, 784], 400); break
        default: break
      }
    } catch {
      // Audio may be unavailable; fail silently
    }
  }

  return { playSound }
}
