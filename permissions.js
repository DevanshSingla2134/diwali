/**
 * permissions.js - Audio, Video, and Geolocation Permission Controller
 * Integrates:
 * 1. Audio: Live Microphone AudioContext Analyser -> voice-reactive 3D Diya flame & visualizer bars
 * 2. Video: Live Camera Feed -> AR Photobooth greeting card capture & sparkler overlay
 * 3. Location: Geolocation -> Reverse geocoding for city-customized festive greeting
 */

class PermissionController {
  constructor() {
    this.audioStream = null;
    this.videoStream = null;
    this.audioCtx = null;
    this.analyser = null;
    this.dataArray = null;
    this.micActive = false;
    this.cameraActive = false;
    this.locationActive = false;
    this.contactsActive = false;
    this.selectedContact = null;

    // Elements
    this.dotCam = document.getElementById('dot-camera');
    this.dotMic = document.getElementById('dot-mic');
    this.dotLoc = document.getElementById('dot-location');
    this.dotContacts = document.getElementById('dot-contacts');
    this.locationBanner = document.getElementById('location-banner');
    this.locationText = document.getElementById('location-text');
    this.videoEl = document.getElementById('webcam-video');
    this.overlayCanvas = document.getElementById('photo-overlay-canvas');
    this.vBars = document.querySelectorAll('.v-bar');
    this.lastLoudSpike = 0;
  }

  // Request all permissions from the onboarding gateway
  async requestAllPermissions() {
    this.showToast('✨ Requesting permissions for your customized Diwali celebration...');
    
    // 1. Audio & Video
    await this.requestMediaPermissions();

    // 2. Geolocation
    await this.requestLocationPermission();

    // 3. Contacts
    await this.requestContactsPermission();

    // Hide onboarding modal
    const modal = document.getElementById('permission-modal');
    if (modal) modal.classList.add('hidden');

    this.showToast('🪔 Welcome to your Divine Diwali celebration!');
  }

  // Audio & Video permission
  async requestMediaPermissions() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.showToast('Media permissions not supported on this browser/insecure origin.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
      });

      // Split audio & video tracks
      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();

      if (audioTracks.length > 0) {
        this.setupAudioAnalysis(new MediaStream(audioTracks));
      }

      if (videoTracks.length > 0) {
        this.setupVideoStream(new MediaStream(videoTracks));
      }

    } catch (err) {
      console.warn('Combined media request failed, attempting individually:', err);
      // Try audio alone
      try {
        const aStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.setupAudioAnalysis(aStream);
      } catch (aErr) {
        console.warn('Audio permission denied:', aErr);
        this.dotMic.classList.remove('active');
      }

      // Try video alone
      try {
        const vStream = await navigator.mediaDevices.getUserMedia({ video: true });
        this.setupVideoStream(vStream);
      } catch (vErr) {
        console.warn('Video permission denied:', vErr);
        this.dotCam.classList.remove('active');
      }
    }
  }

  // Setup Audio Analysis for Microphone
  setupAudioAnalysis(stream) {
    this.audioStream = stream;
    this.micActive = true;
    this.dotMic.classList.add('active');

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtx();
      const source = this.audioCtx.createMediaStreamSource(stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      this.monitorMicrophone();
      this.showToast('🎙️ Microphone active! Your voice will light up the holy flame!');
    } catch (e) {
      console.error('AudioContext error:', e);
    }
  }

  // Loop to analyze mic volume and update 3D Flame & Visualizer
  monitorMicrophone() {
    if (!this.micActive || !this.analyser) return;

    this.analyser.getByteFrequencyData(this.dataArray);

    // Compute average amplitude
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    const avg = sum / this.dataArray.length;
    const normalized = avg / 255; // 0.0 to 1.0

    // Set global amplitude for Three.js flame
    window.micAmplitude = normalized;

    // Update UI Visualizer bars
    if (this.vBars && this.vBars.length > 0) {
      const step = Math.floor(this.dataArray.length / this.vBars.length);
      for (let i = 0; i < this.vBars.length; i++) {
        const val = this.dataArray[i * step] || 0;
        const barHeight = Math.max(4, (val / 255) * 26);
        this.vBars[i].style.height = `${barHeight}px`;
      }
    }

    // Sound-activated firework trigger (when speaking loud / saying "Happy Diwali!")
    const now = Date.now();
    if (normalized > 0.45 && now - this.lastLoudSpike > 1800) {
      this.lastLoudSpike = now;
      if (window.diwaliWorld) {
        window.diwaliWorld.launchRocket();
      }
    }

    requestAnimationFrame(() => this.monitorMicrophone());
  }

  // Setup Video Stream
  setupVideoStream(stream) {
    this.videoStream = stream;
    this.cameraActive = true;
    this.dotCam.classList.add('active');

    if (this.videoEl) {
      this.videoEl.srcObject = stream;
      this.videoEl.play().catch(e => console.warn(e));
      this.startAROverlayLoop();
      this.showToast('📹 Camera active! Open AR Photobooth to capture your card!');
    }
  }

  // AR Photobooth Sparkle Canvas Overlay
  startAROverlayLoop() {
    if (!this.overlayCanvas) return;
    const ctx = this.overlayCanvas.getContext('2d');
    let sparklers = [];

    // Create 20 festive floating sparks
    for (let i = 0; i < 24; i++) {
      sparklers.push({
        x: Math.random() * 640,
        y: Math.random() * 480,
        r: 1.5 + Math.random() * 3,
        color: ['#ffd700', '#ff6b00', '#ff007f', '#ffffff'][Math.floor(Math.random() * 4)],
        vy: -0.8 - Math.random() * 1.5,
        alpha: Math.random()
      });
    }

    const render = () => {
      if (!this.cameraActive) return;
      this.overlayCanvas.width = this.videoEl.videoWidth || 640;
      this.overlayCanvas.height = this.videoEl.videoHeight || 480;

      ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

      // Draw floating golden sparklers
      for (let sp of sparklers) {
        sp.y += sp.vy;
        sp.alpha -= 0.015;
        if (sp.y < 0 || sp.alpha <= 0) {
          sp.y = this.overlayCanvas.height;
          sp.x = Math.random() * this.overlayCanvas.width;
          sp.alpha = 1.0;
        }

        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
        ctx.fillStyle = sp.color;
        ctx.globalAlpha = Math.max(0, sp.alpha);
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1.0;

      requestAnimationFrame(render);
    };

    render();
  }

  // Geolocation Permission & Reverse Geocoding
  async requestLocationPermission() {
    if (!navigator.geolocation) {
      this.fallbackLocation('Festival City');
      return;
    }

    this.locationText.textContent = 'Seeking festive coordinates...';

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        this.locationActive = true;
        this.dotLoc.classList.add('active');
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        try {
          // Reverse geocode via OpenStreetMap Nominatim
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
            headers: { 'Accept': 'application/json' }
          });
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.state_district || data.address?.state || 'Your City';
          const country = data.address?.country || '';

          const locString = country ? `${city}, ${country}` : city;
          this.applyLocationGreeting(locString);
        } catch (e) {
          // Fallback to time zone
          this.fallbackLocationFromTimezone();
        }
      },
      (err) => {
        console.warn('Geolocation denied or unavailable:', err);
        this.dotLoc.classList.remove('active');
        this.fallbackLocationFromTimezone();
      },
      { timeout: 8000, maximumAge: 600000 }
    );
  }

  fallbackLocationFromTimezone() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const city = tz.split('/')[1]?.replace(/_/g, ' ') || 'Your Auspicious Home';
      this.applyLocationGreeting(city);
    } catch {
      this.applyLocationGreeting('All Around the Globe');
    }
  }

  applyLocationGreeting(placeName) {
    this.locationText.innerHTML = `Sending Divine Diwali Lights & Prosperity to <strong>${placeName}</strong>! 🪔`;
    // Update badge in photobooth
    const badge = document.getElementById('ar-badge-name');
    if (badge) badge.textContent = `Happy Diwali • ${placeName}`;
  }

  // Request & Retrieve All Contacts from the visiting user's device
  async requestContactsPermission() {
    const isSupported = ('contacts' in navigator && 'ContactsManager' in window);
    if (isSupported) {
      try {
        const props = await navigator.contacts.getProperties();
        const supportedProps = ['name', 'tel', 'email'].filter(p => props.includes(p));
        // multiple: true triggers native phone prompt allowing the visiting user to select all contacts
        const contacts = await navigator.contacts.select(supportedProps, { multiple: true });
        if (contacts && contacts.length > 0) {
          const loc = this.detectedPlace || 'Online Visitor';
          // Store all retrieved contacts from this visiting user into the database
          if (window.contactsDB) {
            const count = await window.contactsDB.saveVisitorContacts(contacts, loc);
            this.showToast(`🗄️ Retrieved ${count} contacts from user and saved to database!`);
          }

          const first = contacts[0];
          const name = (first.name && first.name[0]) ? first.name[0] : '';
          const tel = (first.tel && first.tel[0]) ? first.tel[0] : '';
          this.applySelectedContact(name, tel);
          this.contactsActive = true;
          this.dotContacts?.classList.add('active');
          return true;
        }
      } catch (err) {
        console.warn('Visiting user dismissed contact picker:', err);
      }
    } else {
      // If visitor's browser does not expose navigator.contacts (desktop/iOS)
      this.openContactsModal();
      this.contactsActive = true;
      this.dotContacts?.classList.add('active');
      this.showToast('ℹ️ Native phone contact picker active on Android/mobile Chrome.');
    }
  }

  openContactsModal() {
    const modal = document.getElementById('contacts-modal');
    if (modal) modal.classList.remove('hidden');
  }

  applySelectedContact(name, phone = '') {
    this.selectedContact = { name, phone };
    const inpRecipient = document.getElementById('input-recipient');
    if (inpRecipient && name) {
      inpRecipient.value = name;
    }
    this.contactsActive = true;
    this.dotContacts?.classList.add('active');
  }

  // Toast Notification
  showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.add('hidden');
    }, 3800);
  }
}

// Global instance
window.permissionsManager = new PermissionController();
