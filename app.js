/**
 * YORU (夜) — Japanese Jazz Kissaten
 * Unhurried, analog scripts:
 * 1. Deliberate Tonearm needle lowering on scroll when Menu enters view.
 * 2. Standalone Web Audio API vinyl room crackle synthesizer (zero external assets).
 * 3. Live Dusk-till-Dawn JST Tokyo operating status.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const tonearm = document.getElementById('tonearm');
  const deckReadout = document.getElementById('deck-readout');
  const menuSection = document.getElementById('menu-section');
  const needleObserverText = document.getElementById('needle-observer-text');
  const ambientBtn = document.getElementById('ambient-audio-btn');
  const audioPulse = document.getElementById('audio-pulse');
  const audioLabel = document.getElementById('audio-label');
  const filamentIndicator = document.getElementById('filament-indicator');
  const liveStatusText = document.getElementById('live-status-text');

  /* ==========================================================================
     1. Deliberate Motion Moment: Tonearm Needle Lowering on Scroll
     ========================================================================== */
  let isNeedleDropped = false;

  if (menuSection && tonearm) {
    const observerOptions = {
      root: null,
      rootMargin: '-10% 0px -20% 0px',
      threshold: 0.15
    };

    const menuObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (!isNeedleDropped) {
            isNeedleDropped = true;
            tonearm.classList.add('needle-dropped');
            if (deckReadout) {
              deckReadout.textContent = '[ STYLUS: IN GROOVE — 33⅓ RPM ]';
              deckReadout.style.color = 'var(--accent)';
            }
            if (needleObserverText) {
              needleObserverText.textContent = 'Stylus tracking Side A &bull; 33⅓ RPM';
            }
            // Trigger gentle tactile audio needle drop click if audio is active
            if (audioActive) {
              playNeedleDropSound();
            }
          }
        } else {
          // If scrolled back up into hero
          const boundingRect = entry.boundingClientRect;
          if (boundingRect.top > 0) {
            if (isNeedleDropped) {
              isNeedleDropped = false;
              tonearm.classList.remove('needle-dropped');
              if (deckReadout) {
                deckReadout.textContent = '[ STYLUS: RESTING ]';
                deckReadout.style.color = 'rgba(201, 162, 39, 0.7)';
              }
              if (needleObserverText) {
                needleObserverText.textContent = 'Scroll to engage the stylus';
              }
            }
          }
        }
      });
    }, observerOptions);

    menuObserver.observe(menuSection);
  }

  /* ==========================================================================
     2. Standalone Web Audio API Vinyl Crackle & Ambient Room Noise
     Synthesized procedural audio: warmth, pink noise hum, low-pass filter, pops.
     ========================================================================== */
  let audioCtx = null;
  let noiseNode = null;
  let gainNode = null;
  let popInterval = null;
  let audioActive = false;

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function startVinylNoise() {
    initAudioContext();

    // 1. Create Pink/Brown Noise buffer for continuous warm analog surface hum
    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.02;
      b6 = white * 0.115926;
    }

    noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;

    // Filter to emulate analog phonograph frequency curve (warm lows, gentle roll-off)
    const lowpass = audioCtx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(3200, audioCtx.currentTime);

    const highpass = audioCtx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(140, audioCtx.currentTime);

    gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.35, audioCtx.currentTime + 1.2);

    noiseNode.connect(lowpass);
    lowpass.connect(highpass);
    highpass.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    noiseNode.start();

    // 2. Periodic subtle dust/groove pops
    popInterval = setInterval(() => {
      if (!audioActive || !audioCtx) return;
      if (Math.random() < 0.65) {
        triggerVinylPop();
      }
    }, 450);
  }

  function triggerVinylPop() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const popGain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.value = 1800 + Math.random() * 2400;
    filter.Q.value = 8;

    osc.type = 'triangle';
    osc.frequency.value = 80 + Math.random() * 200;

    const now = audioCtx.currentTime;
    const strength = 0.04 + Math.random() * 0.12;

    popGain.gain.setValueAtTime(strength, now);
    popGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

    osc.connect(filter);
    filter.connect(popGain);
    popGain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.02);
  }

  function playNeedleDropSound() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.16);

    // Follow with a small crackle burst
    setTimeout(triggerVinylPop, 80);
    setTimeout(triggerVinylPop, 120);
  }

  function stopVinylNoise() {
    if (gainNode && audioCtx) {
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);
      setTimeout(() => {
        if (noiseNode) {
          try { noiseNode.stop(); } catch(e) {}
          noiseNode.disconnect();
          noiseNode = null;
        }
      }, 700);
    }
    if (popInterval) {
      clearInterval(popInterval);
      popInterval = null;
    }
  }

  if (ambientBtn) {
    ambientBtn.addEventListener('click', () => {
      audioActive = !audioActive;
      if (audioActive) {
        startVinylNoise();
        ambientBtn.classList.add('active');
        if (audioPulse) audioPulse.style.display = 'inline-block';
        if (audioLabel) audioLabel.textContent = 'Vinyl Ambiance: Playing';
      } else {
        stopVinylNoise();
        ambientBtn.classList.remove('active');
        if (audioPulse) audioPulse.style.display = 'none';
        if (audioLabel) audioLabel.textContent = 'Vinyl Ambiance: Off';
      }
    });
  }

  /* ==========================================================================
     3. Live Dusk-Till-Dawn Indicator (JST Tokyo Clock: 18:00 - 04:30)
     ========================================================================== */
  function updateKissatenStatus() {
    // Current UTC time converted to Tokyo (JST is UTC+9)
    const now = new Date();
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const tokyoHours = (utcHours + 9) % 24;
    const formattedMinutes = utcMinutes.toString().padStart(2, '0');
    const formattedHours = tokyoHours.toString().padStart(2, '0');

    // Open from 18:00 to 04:30 JST
    const isOpen = (tokyoHours >= 18 || tokyoHours < 4 || (tokyoHours === 4 && utcMinutes <= 30));

    if (isOpen) {
      if (filamentIndicator) {
        filamentIndicator.style.opacity = '1';
        filamentIndicator.style.boxShadow = '0 0 10px 2px var(--brass-glow)';
      }
      if (liveStatusText) {
        liveStatusText.innerHTML = `Door unlocked &bull; Dusk till dawn (${formattedHours}:${formattedMinutes} JST)`;
      }
    } else {
      if (filamentIndicator) {
        filamentIndicator.style.opacity = '0.45';
        filamentIndicator.style.boxShadow = 'none';
      }
      if (liveStatusText) {
        liveStatusText.innerHTML = `Door latched &bull; Opens at dusk 18:00 JST (${formattedHours}:${formattedMinutes} JST)`;
      }
    }
  }

  updateKissatenStatus();
  // Check every 60 seconds
  setInterval(updateKissatenStatus, 60000);
});
