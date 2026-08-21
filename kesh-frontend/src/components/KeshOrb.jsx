import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * The full-screen amber particle orb. Reacts to `state`:
 *  - idle:      slow rotation, gentle ambient breathing
 *  - listening: shrinks slightly, brightens, reacts live to micLevelRef (your voice volume)
 *  - thinking:  tightens, spins faster (Kesh is processing)
 *  - speaking:  expands and pulses in sync with speechPulseRef (word-by-word)
 *
 * micLevelRef and speechPulseRef are plain refs (not React state) written to
 * by useVoiceAssistant, and read here every animation frame — this keeps the
 * whole thing at 60fps without triggering React re-renders on every tick.
 */
export default function KeshOrb({ state = 'idle', micLevelRef, speechPulseRef }) {
  const mountRef = useRef(null)
  const stateRef = useRef(state)

  // Keep stateRef current without tearing down the Three.js scene on every
  // state change — the animation loop reads stateRef.current each frame.
  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    const mount = mountRef.current
    const width = mount.clientWidth
    const height = mount.clientHeight

    // --- Scene setup ---
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)
    camera.position.z = 6.5

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mount.appendChild(renderer.domElement)

    // --- Particle sphere: many points scattered across a sphere surface,
    // with a secondary swirl layer for the "vortex" look from the reference art ---
    const group = new THREE.Group()
    scene.add(group)

    function makeParticleLayer(count, radius, color, size, spread) {
      const positions = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        // Distribute roughly on a sphere shell with some radial jitter,
        // biased so more particles cluster near a swirling band (like the ref images)
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        const r = radius * (1 - spread + Math.random() * spread)
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
        positions[i * 3 + 2] = r * Math.cos(phi)
      }
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      const material = new THREE.PointsMaterial({
        color,
        size,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      return new THREE.Points(geometry, material)
    }

    const coreLayer = makeParticleLayer(1800, 1.4, 0xffb347, 0.045, 0.35)
    const midLayer = makeParticleLayer(2600, 2.1, 0xe8a33d, 0.03, 0.5)
    const outerLayer = makeParticleLayer(1400, 2.8, 0xff6b35, 0.022, 0.6)
    group.add(coreLayer, midLayer, outerLayer)

    // --- Color-cycling palette: the orb slowly drifts through a sequence of
    // stunning hues over time (amber -> ember -> violet -> cyan -> rose -> back)
    // rather than staying one fixed color, per the reference art's shifting glow. ---
    const PALETTE = [
      { core: 0xffb347, mid: 0xe8a33d, outer: 0xff6b35, glow: 0xffcf7a }, // amber
      { core: 0xff7a45, mid: 0xe85d3d, outer: 0xff3d5a, glow: 0xffab7a }, // ember/rose
      { core: 0xb388ff, mid: 0x8c5df0, outer: 0x6a3de8, glow: 0xd4bfff }, // violet
      { core: 0x5fd4ff, mid: 0x3ab0e0, outer: 0x2277cc, glow: 0xa8ecff }, // cyan
      { core: 0x7affb3, mid: 0x3de89a, outer: 0x22cc77, glow: 0xbfffd4 }, // emerald
    ]
    const colorObjA = new THREE.Color()
    const colorObjB = new THREE.Color()

    // Subtle ambient glow core
    const glowGeo = new THREE.SphereGeometry(0.55, 32, 32)
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffcf7a,
      transparent: true,
      opacity: 0.25,
    })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    group.add(glow)

    // --- Golden halo rings: bright, always-gold circles that encircle the
    // orb (independent of the color-cycling particles), matching the
    // reference art's bright golden ring motif. Three rings at different
    // radii/tilts, each rotating slowly on its own axis. ---
    function makeHaloRing(radius, tubeThickness, opacity, tilt) {
      const geo = new THREE.TorusGeometry(radius, tubeThickness, 8, 96)
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffd27a,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const ring = new THREE.Mesh(geo, mat)
      ring.rotation.x = Math.PI / 2 + tilt
      return ring
    }

    const haloRingInner = makeHaloRing(1.85, 0.012, 0.55, 0.15)
    const haloRingMid = makeHaloRing(2.2, 0.008, 0.4, -0.25)
    const haloRingOuter = makeHaloRing(2.55, 0.006, 0.28, 0.35)
    group.add(haloRingInner, haloRingMid, haloRingOuter)

    let colorCycleT = 0
    const COLOR_CYCLE_DURATION = 10 // seconds for one full loop through the palette

    // Sample a smoothly-interpolated color from the palette at any continuous
    // phase (0-1 = one full loop). Different layers use different phase
    // offsets below, so at any given instant the core, mid, outer, and glow
    // are all showing genuinely different colors from the cycle at once —
    // not just all synced to the same shifting hue.
    function sampleField(field, phase) {
      const wrapped = ((phase % 1) + 1) % 1
      const scaled = wrapped * PALETTE.length
      const i = Math.floor(scaled) % PALETTE.length
      const j = (i + 1) % PALETTE.length
      const blend = scaled - Math.floor(scaled)
      colorObjA.setHex(PALETTE[i][field])
      colorObjB.setHex(PALETTE[j][field])
      return colorObjA.clone().lerp(colorObjB, blend)
    }

    function updatePaletteColors(dt) {
      colorCycleT += dt
      const basePhase = colorCycleT / COLOR_CYCLE_DURATION

      coreLayer.material.color.copy(sampleField('core', basePhase))
      midLayer.material.color.copy(sampleField('mid', basePhase + 0.18))
      outerLayer.material.color.copy(sampleField('outer', basePhase + 0.36))
      glow.material.color.copy(sampleField('glow', basePhase + 0.5))
      haloRingInner.material.color.copy(sampleField('glow', basePhase + 0.08))
      haloRingMid.material.color.copy(sampleField('core', basePhase + 0.62))
      haloRingOuter.material.color.copy(sampleField('mid', basePhase + 0.75))
    }

    // --- Animation state ---
    let frameId
    let scale = 1
    let rotationSpeed = 0.0015
    const clock = new THREE.Clock()
    let lastT = 0

    function animate() {
      frameId = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()
      const dt = t - lastT
      lastT = t

      updatePaletteColors(dt)

      // Base per-state targets
      let targetScale = 1
      let targetRotSpeed = 0.0015
      const currentState = stateRef.current

      if (currentState === 'idle') {
        targetScale = 1 + Math.sin(t * 0.6) * 0.05 // gentle breathing loop
        targetRotSpeed = 0.0012
      } else if (currentState === 'listening') {
        const level = micLevelRef?.current ?? 0
        targetScale = 0.82 + level * 0.35 // shrinks, then swells with your voice
        targetRotSpeed = 0.002 + level * 0.01
      } else if (currentState === 'thinking') {
        targetScale = 0.72 + Math.sin(t * 4) * 0.04 // tight, fast, restless
        targetRotSpeed = 0.012
      } else if (currentState === 'speaking') {
        const lastPulse = speechPulseRef?.current ?? 0
        const sinceWord = performance.now() - lastPulse
        const wordPulse = Math.max(0, 1 - sinceWord / 260) // decays after each word
        targetScale = 1.05 + wordPulse * 0.28 + Math.sin(t * 2.2) * 0.05
        targetRotSpeed = 0.003
      }

      // Smoothly ease toward the target (this creates the "shrink, then come
      // out big, then loop" feel instead of jarring instant jumps)
      scale += (targetScale - scale) * 0.12
      rotationSpeed += (targetRotSpeed - rotationSpeed) * 0.08

      group.scale.setScalar(scale)
      group.rotation.y += rotationSpeed + 0.0025 // continuous baseline rotation, always turning
      group.rotation.x = Math.sin(t * 0.3) * 0.15

      coreLayer.rotation.y -= rotationSpeed * 1.5
      outerLayer.rotation.y += rotationSpeed * 0.6

      haloRingInner.rotation.z += 0.004
      haloRingMid.rotation.z -= 0.0027
      haloRingOuter.rotation.z += 0.0015

      // Shimmer/sparkle: gentle, fast opacity flicker layered on top of the
      // color-cycling, so the orb doesn't just shift color smoothly but
      // actually twinkles like the reference art.
      coreLayer.material.opacity = 0.78 + Math.sin(t * 6.1) * 0.12 + Math.sin(t * 13.7) * 0.06
      midLayer.material.opacity = 0.7 + Math.sin(t * 5.3 + 1.4) * 0.12
      outerLayer.material.opacity = 0.6 + Math.sin(t * 4.2 + 2.7) * 0.14
      const haloPulse = 1 + Math.sin(t * 1.4) * 0.03
      haloRingInner.scale.setScalar(haloPulse)
      haloRingMid.scale.setScalar(1 + Math.sin(t * 1.1 + 1) * 0.025)

      glow.scale.setScalar(scale * (1 + Math.sin(t * 1.5) * 0.08))

      renderer.render(scene, camera)
    }
    animate()

    // --- Resize handling ---
    function handleResize() {
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', handleResize)
      mount.removeChild(renderer.domElement)
      ;[coreLayer, midLayer, outerLayer].forEach((layer) => {
        layer.geometry.dispose()
        layer.material.dispose()
      })
      glowGeo.dispose()
      glowMat.dispose()
      ;[haloRingInner, haloRingMid, haloRingOuter].forEach((ring) => {
        ring.geometry.dispose()
        ring.material.dispose()
      })
      renderer.dispose()
    }
  }, [micLevelRef, speechPulseRef])

  return <div ref={mountRef} className="kesh-orb-canvas" />
}
