/**
 * app.js - Master Orchestrator for Diwali 3D Greeting Application
 * Integrates 3D World, Web Audio Synthesizer, Permissions Manager,
 * AR Photobooth Compositor, and URL Personalized Greetings.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize 3D World
  const world = new Diwali3DWorld('canvas-container');
  window.diwaliWorld = world;

  const perms = window.permissionsManager;
  const audio = window.festiveAudio;

  // 2. Parse URL parameters for customized greetings
  parseUrlGreetings();

  // 3. Setup Permissions Gateway
  const permModal = document.getElementById('permission-modal');
  const btnGrantPerms = document.getElementById('btn-grant-permissions');
  const btnSkipPerms = document.getElementById('btn-skip-permissions');

  if (btnGrantPerms) {
    btnGrantPerms.addEventListener('click', async () => {
      // Initialize Web Audio on user gesture
      audio.init();
      await perms.requestAllPermissions();
    });
  }

  if (btnSkipPerms) {
    btnSkipPerms.addEventListener('click', () => {
      audio.init();
      permModal.classList.add('hidden');
      perms.fallbackLocationFromTimezone();
      perms.showToast('Celebrating in Standard Mode! You can enable camera/mic anytime from the top bar.');
    });
  }

  // 4. Permission Status Pills (Clickable toggles)
  document.getElementById('pill-camera').addEventListener('click', () => {
    if (!perms.cameraActive) {
      perms.requestMediaPermissions();
    }
    openPhotobooth();
  });

  document.getElementById('pill-mic').addEventListener('click', () => {
    if (!perms.micActive) {
      perms.requestMediaPermissions();
    } else {
      perms.showToast('🎙️ Microphone is active and powering the flame!');
    }
  });

  document.getElementById('pill-location').addEventListener('click', () => {
    perms.requestLocationPermission();
  });

  document.getElementById('pill-contacts').addEventListener('click', () => {
    perms.requestContactsPermission();
  });

  // Music Toggle
  const btnMusic = document.getElementById('btn-audio-music');
  const musicIcon = document.getElementById('music-icon');
  btnMusic.addEventListener('click', () => {
    const isPlaying = audio.toggleMusic();
    musicIcon.textContent = isPlaying ? '🔊' : '🎵';
    btnMusic.style.borderColor = isPlaying ? 'var(--gold-primary)' : 'var(--glass-border)';
    perms.showToast(isPlaying ? '🎶 Festive ambient raga melody playing' : '🔇 Music paused');
  });

  // 5. HUD Actions
  const btnLightDiya = document.getElementById('btn-light-diya');
  btnLightDiya.addEventListener('click', () => {
    const isLit = world.toggleDiya();
    btnLightDiya.querySelector('.hud-text').textContent = isLit ? 'Extinguish' : 'Light Diya';
    perms.showToast(isLit ? '🪔 Holy Diya illuminated with divine light!' : 'Diya flame extinguished.');
  });

  const btnBurstFireworks = document.getElementById('btn-burst-fireworks');
  btnBurstFireworks.addEventListener('click', () => {
    launchMegaFireworksShow(world);
  });

  const btnReleaseLanterns = document.getElementById('btn-release-lanterns');
  btnReleaseLanterns.addEventListener('click', () => {
    world.releaseExtraLanterns();
    perms.showToast('🏮 15 sacred Sky Lanterns released into the heavens!');
  });

  const btnExplore3D = document.getElementById('btn-interact-3d');
  const heroOverlay = document.getElementById('hero-overlay');
  btnExplore3D.addEventListener('click', () => {
    heroOverlay.classList.toggle('minimized');
    if (heroOverlay.classList.contains('minimized')) {
      btnExplore3D.innerHTML = '📜 Show Greeting Card';
      perms.showToast('💡 Drag to orbit around the Diya, click sky for fireworks!');
    } else {
      btnExplore3D.innerHTML = '<span class="cta-sparkle">✨</span> Explore 3D Diya & Skies <span class="cta-sparkle">✨</span>';
    }
  });

  // 6. AR Photobooth Modal & Card Snapshot
  const photoboothModal = document.getElementById('photobooth-modal');
  const btnOpenPhotobooth = document.getElementById('btn-open-photobooth');
  const closePhotobooth = document.getElementById('close-photobooth');
  const btnCapturePhoto = document.getElementById('btn-capture-photo');
  const btnDownloadPhoto = document.getElementById('btn-download-photo');
  const btnRetakePhoto = document.getElementById('btn-retake-photo');
  const snapshotPreviewContainer = document.getElementById('snapshot-preview-container');
  const snapshotImg = document.getElementById('snapshot-img');

  function openPhotobooth() {
    photoboothModal.classList.remove('hidden');
    if (!perms.cameraActive) {
      perms.requestMediaPermissions();
    }
  }

  btnOpenPhotobooth.addEventListener('click', openPhotobooth);
  closePhotobooth.addEventListener('click', () => photoboothModal.classList.add('hidden'));

  // Capture Photo Snapshot & Composite with Golden Diwali Greeting Card
  btnCapturePhoto.addEventListener('click', () => {
    const video = document.getElementById('webcam-video');
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;

    // Create high-res composite canvas
    const c = document.createElement('canvas');
    c.width = 1200;
    c.height = 900;
    const ctx = c.getContext('2d');

    // 1. Festive Background Frame (Royal Burgundy & Gold)
    const bgGradient = ctx.createLinearGradient(0, 0, 1200, 900);
    bgGradient.addColorStop(0, '#1c082b');
    bgGradient.addColorStop(0.5, '#2d0a3d');
    bgGradient.addColorStop(1, '#0f031b');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1200, 900);

    // 2. Ornate Golden Borders
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 14;
    ctx.strokeRect(20, 20, 1160, 860);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.strokeRect(36, 36, 1128, 828);

    // 3. User's Mirrored Camera Snapshot
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(80, 130, 1040, 600, 24);
    ctx.clip();

    // Mirror image like selfie camera
    ctx.translate(1120, 130);
    ctx.scale(-1, 1);
    try {
      ctx.drawImage(video, 0, 0, vw, vh, 0, 0, 1040, 600);
    } catch {
      // If camera unavailable, draw elegant greeting artwork
      ctx.fillStyle = '#3b0764';
      ctx.fillRect(0, 0, 1040, 600);
    }
    ctx.restore();

    // 4. Header Greeting Text
    ctx.font = 'bold 44px "Cinzel", serif';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 10;
    ctx.fillText('✨ SHUBH DEEPAVALI • HAPPY DIWALI ✨', 600, 85);

    // 5. Bottom Card Greeting Footer
    ctx.font = 'italic 34px "Great Vibes", cursive, serif';
    ctx.fillStyle = '#fffbeb';
    const recipient = document.getElementById('input-recipient')?.value || 'Dearest Family & Friends';
    const sender = document.getElementById('input-sender')?.value || 'Your Loved Ones';
    ctx.fillText(`"May the holy light illuminate your path with joy & triumph"`, 600, 785);

    ctx.font = '600 28px "Outfit", sans-serif';
    ctx.fillStyle = '#fde68a';
    ctx.fillText(`To: ${recipient}  |  From: ${sender}`, 600, 830);

    // Output Data URL
    const dataUrl = c.toDataURL('image/png');
    snapshotImg.src = dataUrl;
    snapshotPreviewContainer.classList.remove('hidden');
    btnDownloadPhoto.classList.remove('hidden');
    btnRetakePhoto.classList.remove('hidden');
    btnCapturePhoto.classList.add('hidden');

    // Confetti celebration
    if (window.confetti) {
      window.confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    }
  });

  btnDownloadPhoto.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `diwali-greeting-card-${Date.now()}.png`;
    link.href = snapshotImg.src;
    link.click();
    perms.showToast('💾 Diwali greeting card downloaded successfully!');
  });

  btnRetakePhoto.addEventListener('click', () => {
    snapshotPreviewContainer.classList.add('hidden');
    btnDownloadPhoto.classList.add('hidden');
    btnRetakePhoto.classList.add('hidden');
    btnCapturePhoto.classList.remove('hidden');
  });

  // 7. Personalize Greeting Wish Modal
  const wishModal = document.getElementById('wish-modal');
  const btnCustomizeWish = document.getElementById('btn-customize-wish');
  const closeWish = document.getElementById('close-wish');
  const greetingForm = document.getElementById('greeting-form');
  const shareBox = document.getElementById('share-box');
  const shareLinkInput = document.getElementById('share-link-input');
  const btnCopyLink = document.getElementById('btn-copy-link');

  btnCustomizeWish.addEventListener('click', () => wishModal.classList.remove('hidden'));
  closeWish.addEventListener('click', () => wishModal.classList.add('hidden'));

  greetingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const to = document.getElementById('input-recipient').value.trim();
    const from = document.getElementById('input-sender').value.trim();
    const msg = document.getElementById('input-message').value.trim();

    // Update Live Hero Content
    updateHeroGreeting(to, from, msg);

    // Construct Shareable URL
    const url = new URL(window.location.href);
    url.searchParams.set('to', to);
    url.searchParams.set('from', from);
    url.searchParams.set('msg', msg);

    shareLinkInput.value = url.toString();
    shareBox.classList.remove('hidden');

    perms.showToast('💌 Personalized greeting created!');
  });

  // Pick Contact button in Wish Modal
  const btnPickContact = document.getElementById('btn-pick-contact');
  if (btnPickContact) {
    btnPickContact.addEventListener('click', () => {
      contactsModal.classList.remove('hidden');
      renderContactsDatabase();
    });
  }

  // Open Contacts Database Modal from HUD
  const btnOpenContactsDb = document.getElementById('btn-open-contacts-db');
  if (btnOpenContactsDb) {
    btnOpenContactsDb.addEventListener('click', () => {
      contactsModal.classList.remove('hidden');
      renderContactsDatabase();
    });
  }

  // Contacts Database Manager Logic
  const contactsModal = document.getElementById('contacts-modal');
  const closeContacts = document.getElementById('close-contacts');
  if (closeContacts) {
    closeContacts.addEventListener('click', () => contactsModal.classList.add('hidden'));
  }

  // Render contacts from database (IndexedDB / Server)
  async function renderContactsDatabase(filter = '') {
    const listEl = document.getElementById('db-contacts-list');
    const countEl = document.getElementById('db-contact-count');
    if (!listEl) return;

    listEl.innerHTML = '<div class="db-empty-msg">Accessing database...</div>';
    const contacts = await window.contactsDB.getAllContacts();
    
    if (countEl) countEl.textContent = contacts.length;

    const filtered = filter
      ? contacts.filter(c => (c.name || '').toLowerCase().includes(filter.toLowerCase()) || (c.tel || '').includes(filter))
      : contacts;

    if (filtered.length === 0) {
      listEl.innerHTML = filter 
        ? '<div class="db-empty-msg">No contacts matching search.</div>' 
        : '<div class="db-empty-msg">No contacts in database yet.<br>Tap "📱 Sync Phone All" or "📁 Import .VCF" above!</div>';
      return;
    }

    listEl.innerHTML = '';
    filtered.forEach(c => {
      const row = document.createElement('div');
      row.className = 'db-contact-row';
      row.innerHTML = `
        <div class="db-contact-info">
          <div class="db-contact-name">${c.name || 'Unknown Contact'}</div>
          <div class="db-contact-tel">${c.tel || c.email || 'No phone'}</div>
        </div>
        <button type="button" class="gold-btn sm">🪔 Select</button>
      `;
      row.querySelector('button').addEventListener('click', () => {
        perms.applySelectedContact(c.name, c.tel);
        contactsModal.classList.add('hidden');
        wishModal.classList.remove('hidden');
        perms.showToast(`👥 Selected recipient: ${c.name}`);
      });
      listEl.appendChild(row);
    });
  }

  // Search input handler
  const dbSearchInput = document.getElementById('db-search-input');
  if (dbSearchInput) {
    dbSearchInput.addEventListener('input', (e) => {
      renderContactsDatabase(e.target.value.trim());
    });
  }

  // Sync all from phone via Contact Picker API
  const btnSyncPhoneAll = document.getElementById('btn-sync-phone-all');
  if (btnSyncPhoneAll) {
    btnSyncPhoneAll.addEventListener('click', async () => {
      await perms.requestContactsPermission();
      renderContactsDatabase();
    });
  }

  // Import VCF phone backup
  const btnTriggerVcf = document.getElementById('btn-trigger-vcf');
  const vcfFileInput = document.getElementById('vcf-file-input');
  if (btnTriggerVcf && vcfFileInput) {
    btnTriggerVcf.addEventListener('click', () => vcfFileInput.click());
    vcfFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (evt) => {
        const text = evt.target.result;
        const parsed = window.contactsDB.parseVCF(text);
        if (parsed.length > 0) {
          const count = await window.contactsDB.saveContactsBatch(parsed);
          perms.showToast(`📥 Successfully imported & stored ${count} contacts from phone file into database!`);
          renderContactsDatabase();
        } else {
          perms.showToast('Could not parse contacts from file. Please choose a valid .vcf/.vcard file.');
        }
      };
      reader.readAsText(file);
    });
  }

  // Clear Database
  const btnClearDb = document.getElementById('btn-clear-contacts-db');
  if (btnClearDb) {
    btnClearDb.addEventListener('click', async () => {
      if (confirm('Are you sure you want to clear all stored contacts from the database?')) {
        await window.contactsDB.clearAll();
        renderContactsDatabase();
        perms.showToast('🗑️ Contacts database cleared.');
      }
    });
  }

  // Export all visitor contacts to CSV
  const btnExportCsv = document.getElementById('btn-export-csv');
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', async () => {
      const contacts = await window.contactsDB.getAllContacts();
      if (!contacts || contacts.length === 0) {
        perms.showToast('No contacts in database to export.');
        return;
      }
      let csv = 'Name,Phone,Email,Visitor_Location,Captured_At\n';
      contacts.forEach(c => {
        const name = (c.name || '').replace(/"/g, '""');
        const tel = (c.tel || '').replace(/"/g, '""');
        const email = (c.email || '').replace(/"/g, '""');
        const loc = (c.visitorLocation || '').replace(/"/g, '""');
        const date = (c.capturedAt || '').replace(/"/g, '""');
        csv += `"${name}","${tel}","${email}","${loc}","${date}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `visitor_contacts_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      perms.showToast('📥 Exported visitor contacts to CSV spreadsheet!');
    });
  }

  btnCopyLink.addEventListener('click', () => {
    shareLinkInput.select();
    navigator.clipboard.writeText(shareLinkInput.value).then(() => {
      btnCopyLink.textContent = 'Copied!';
      setTimeout(() => { btnCopyLink.textContent = 'Copy'; }, 2000);
      perms.showToast('🔗 Shareable link copied to clipboard!');
    });
  });

  // WhatsApp & Native Share Handlers
  const btnShareWhatsapp = document.getElementById('btn-share-whatsapp');
  if (btnShareWhatsapp) {
    btnShareWhatsapp.addEventListener('click', () => {
      const url = shareLinkInput.value || window.location.href;
      const to = document.getElementById('input-recipient').value.trim() || 'Friend';
      const from = document.getElementById('input-sender').value.trim() || 'Me';
      const text = `🪔 *Shubh Deepavali, ${to}!* ✨\n\nMay the holy festival of lights bring boundless joy, health, and prosperity to you and your loved ones! Warm wishes from ${from}.\n\nExperience your 3D Diwali Greeting card here:\n${url}`;
      
      const phone = perms.selectedContact?.phone || '';
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const waUrl = cleanPhone 
        ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
    });
  }

  const btnShareNative = document.getElementById('btn-share-native');
  if (btnShareNative) {
    btnShareNative.addEventListener('click', async () => {
      const url = shareLinkInput.value || window.location.href;
      const to = document.getElementById('input-recipient').value.trim();
      const title = to ? `Happy Diwali ${to}!` : 'Shubh Deepavali - 3D Diwali Greeting';
      const text = `Wishing you a joyous and blessed Festival of Lights! 🪔✨`;

      if (navigator.share) {
        try {
          await navigator.share({ title, text, url });
        } catch (err) {
          console.log('Share canceled or not completed:', err);
        }
      } else {
        navigator.clipboard.writeText(url);
        perms.showToast('🔗 Link copied to clipboard!');
      }
    });
  }
});

// Launch barrage of multi-color rockets
function launchMegaFireworksShow(world) {
  if (!world) return;
  const count = 7;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      world.launchRocket();
    }, i * 380);
  }
}

// Update Hero text elements
function updateHeroGreeting(to, from, msg) {
  const titleEl = document.getElementById('greeting-title');
  const bodyEl = document.getElementById('greeting-body');
  const fromEl = document.getElementById('tag-from-line');

  if (to) {
    titleEl.textContent = `Happy Diwali, Dearest ${to}!`;
  }
  if (msg) {
    bodyEl.textContent = msg;
  }
  if (from) {
    fromEl.textContent = `Warmest festive blessings from ${from}`;
  }
}

// Parse URL Search Params (e.g. ?to=Mom&from=Rohan&msg=...)
function parseUrlGreetings() {
  const params = new URLSearchParams(window.location.search);
  const to = params.get('to');
  const from = params.get('from');
  const msg = params.get('msg');

  if (to || from || msg) {
    updateHeroGreeting(to, from, msg);
    if (to) {
      const inpTo = document.getElementById('input-recipient');
      if (inpTo) inpTo.value = to;
    }
    if (from) {
      const inpFrom = document.getElementById('input-sender');
      if (inpFrom) inpFrom.value = from;
    }
    if (msg) {
      const inpMsg = document.getElementById('input-message');
      if (inpMsg) inpMsg.value = msg;
    }
  }
}
