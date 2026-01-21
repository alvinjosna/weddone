(function(){
  const gate = document.getElementById('gate');
  const main = document.querySelector('main.main');
  const gateForm = document.getElementById('gateForm');
  const guestNameInput = document.getElementById('guestName');
  const inviteCodeInput = document.getElementById('inviteCode');
  const gateMsg = document.getElementById('gateMsg');
  const copyLink = document.getElementById('copyLink');

  const personalGreeting = document.getElementById('personalGreeting');
  // Optional meta line (may be removed in some designs)
  const inviteMeta = document.getElementById('inviteMeta');

  const rsvpName = document.getElementById('rsvpName');
  const rsvpForm = document.getElementById('rsvpForm');
  const rsvpMsg = document.getElementById('rsvpMsg');

  // Photo upload (client-side preview)
  const photoInput = document.getElementById('photoInput');
  const photoPreview = document.getElementById('photoPreview');
  const sharePhotosBtn = document.getElementById('sharePhotos');

  const musicBtn = document.getElementById('musicBtn');
  const openInvite = document.getElementById('openInvite');
  const bgm = document.getElementById('bgm');

  const cdDays = document.getElementById('cdDays');
  const cdHours = document.getElementById('cdHours');
  const cdMins = document.getElementById('cdMins');
  const cdSecs = document.getElementById('cdSecs');

  const WEDDING_ISO = '2026-04-26T15:30:00+05:30'; // Kerala time (IST)

  // Config from guestlist.js
  const SETTINGS = window.INVITE_SETTINGS || {};
  const REQUIRE_CODE = SETTINGS.REQUIRE_CODE !== false; // default true
  const MASTER_CODE = (SETTINGS.MASTER_CODE || '').trim();
  const WHATSAPP_NUMBER = String(SETTINGS.WHATSAPP_NUMBER || '61420852655').replace(/\D/g,'');

  // Helpers
  const norm = (s) => (s || '').trim().toLowerCase().replace(/\s+/g,' ');
  const normCode = (s) => (s || '').trim().toUpperCase().replace(/\s+/g,'');

  let currentGuest = null;

  function getGuestList(){
    return Array.isArray(window.GUEST_LIST) ? window.GUEST_LIST : [];
  }

  function findGuestByName(name){
    const list = getGuestList();
    const key = norm(name);
    if(!key) return null;

    // Exact match first
    let hit = list.find(g => norm(g.name) === key);

    // Soft match: contains all tokens
    if(!hit){
      const tokens = key.split(' ').filter(Boolean);
      if(tokens.length >= 2){
        hit = list.find(g => {
          const gn = norm(g.name);
          return tokens.every(t => gn.includes(t));
        });
      }
    }

    return hit || null;
  }

  function isCodeValidForGuest(code, guest){
    const c = normCode(code);
    if(!REQUIRE_CODE) return true;

    // Master code always works
    if(MASTER_CODE && c === normCode(MASTER_CODE)) return true;

    // Guest code match
    if(guest && guest.code){
      return c === normCode(guest.code);
    }

    return false;
  }

  function eventLabel(events){
    if(!events || !events.length) return 'Wedding';
    if(events.includes('Both')) return 'Betrothal + Wedding';
    return events[0];
  }

  function applyEventVisibility(guest){
    // Hide sections/cards that the guest is NOT invited to see
    // (This is the "Guests only see the exact event" feature.)
    const invited = guest?.events || [];
    const showBetrothal = invited.includes('Both') || invited.includes('Betrothal');
    const showWedding = invited.includes('Both') || invited.includes('Wedding') || invited.length === 0;

    document.querySelectorAll('[data-event="Betrothal"]').forEach(el => {
      el.style.display = showBetrothal ? '' : 'none';
    });

    document.querySelectorAll('[data-event="Wedding"]').forEach(el => {
      el.style.display = showWedding ? '' : 'none';
    });
  }

  function openGate(){
    gate.style.display = 'grid';
    gate.setAttribute('aria-hidden','false');
    gateMsg.textContent = '';

    guestNameInput.value = (localStorage.getItem('inviteeName') || '');
    inviteCodeInput.value = (localStorage.getItem('inviteeCode') || '');

    setTimeout(() => guestNameInput.focus(), 60);
  }

  function unlockSite(guestPayload, codeUsed){
    main.dataset.locked = 'false';
    gate.setAttribute('aria-hidden','true');
    gate.style.display = 'none';
    // Guest visibility
    currentGuest = guestPayload || null;
    applyEventVisibility(guestPayload);

    // Personal greeting
    if(guestPayload && guestPayload.name){
      personalGreeting.textContent = `Dear  ${guestPayload.name}, we can’t wait to celebrate with you.`;
      // Keep the design clean: no seats / invitation meta text in Wishes section
      if(inviteMeta) inviteMeta.textContent = '';
      rsvpName.value = guestPayload.name;

      localStorage.setItem('inviteeName', guestPayload.name);
      if(codeUsed) localStorage.setItem('inviteeCode', codeUsed);
    } else {
      personalGreeting.textContent = 'We can’t wait to celebrate with you.';
      if(inviteMeta) inviteMeta.textContent = '';
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function tryAutoUnlock(){
    // Auto unlock if ?guest=Name&code=CODE
    const params = new URLSearchParams(window.location.search);
    const qGuest = params.get('guest');
    const qCode = params.get('code');

    if(qGuest && qCode){
      const guest = findGuestByName(qGuest);
      if(isCodeValidForGuest(qCode, guest)){
        unlockSite(guest || { name: qGuest, seats: 1, events: ['Wedding'] }, qCode);
        return true;
      }
    }

    // Local storage auto unlock
    const storedName = localStorage.getItem('inviteeName');
    const storedCode = localStorage.getItem('inviteeCode');

    if(storedName && storedCode){
      const guest = findGuestByName(storedName);
      if(isCodeValidForGuest(storedCode, guest)){
        unlockSite(guest || { name: storedName, seats: 1, events: ['Wedding'] }, storedCode);
        return true;
      }
    }

    return false;
  }

  // Gate form submit (NAME + CODE is required)
  gateForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = guestNameInput.value.trim();
    const code = inviteCodeInput.value.trim();
    const guest = findGuestByName(name);

    if(REQUIRE_CODE && !code){
      gateMsg.textContent = 'Please enter your invite code.';
      inviteCodeInput.focus();
      return;
    }

    if(!isCodeValidForGuest(code, guest)){
      gateMsg.textContent = 'Invalid code. Please check and try again.';
      inviteCodeInput.focus();
      return;
    }

    gateMsg.textContent = 'Welcome — opening your invite…';

    // If guest not found, unlock general invite (still code-valid via MASTER_CODE)
    if(!guest){
      unlockSite({ name: name || null, seats: 1, events: ['Wedding'] }, code);
      return;
    }

    unlockSite(guest, code);
  });

  // Copy personalised link
  copyLink.addEventListener('click', async () => {
    const name = (guestNameInput.value || localStorage.getItem('inviteeName') || '').trim();
    const code = (inviteCodeInput.value || localStorage.getItem('inviteeCode') || '').trim();

    if(!name){
      gateMsg.textContent = 'Type your name first to generate a link.';
      return;
    }

    if(REQUIRE_CODE && !code){
      gateMsg.textContent = 'Enter your code first to generate a link.';
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set('guest', name);
    if(code) url.searchParams.set('code', code);

    try{
      await navigator.clipboard.writeText(url.toString());
      gateMsg.textContent = 'Invite link copied! Send it on WhatsApp.';
    }catch(err){
      gateMsg.textContent = 'Could not copy automatically. Please copy the URL from the address bar.';
    }
  });

  if(openInvite){
    openInvite.addEventListener('click', openGate);
  }

  // Countdown
  function updateCountdown(){
    const target = new Date(WEDDING_ISO).getTime();
    const now = Date.now();
    const diff = Math.max(0, target - now);

    const s = Math.floor(diff/1000);
    const days = Math.floor(s / (3600*24));
    const hours = Math.floor((s % (3600*24)) / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = Math.floor(s % 60);

    cdDays.textContent = String(days);
    cdHours.textContent = String(hours).padStart(2,'0');
    cdMins.textContent = String(mins).padStart(2,'0');
    cdSecs.textContent = String(secs).padStart(2,'0');
  }

  setInterval(updateCountdown, 1000);
  updateCountdown();

  // Smooth anchors
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const el = document.querySelector(id);
      if(!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Music toggle (optional)
  if(musicBtn && bgm){
    musicBtn.addEventListener('click', async () => {
      const pressed = musicBtn.getAttribute('aria-pressed') === 'true';
      try{
        if(!pressed){
          await bgm.play();
          bgm.volume = 0.5;
          musicBtn.setAttribute('aria-pressed','true');
          musicBtn.textContent = 'Music: On';
        } else {
          bgm.pause();
          musicBtn.setAttribute('aria-pressed','false');
          musicBtn.textContent = 'Music: Off';
        }
      }catch(err){
        musicBtn.textContent = 'Music: Blocked';
      }
    });
  }

  function openWhatsApp(message){
    if(!WHATSAPP_NUMBER){
      rsvpMsg.textContent = 'WhatsApp number is not configured yet.';
      return;
    }

    const text = encodeURIComponent(message);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
    window.open(url, '_blank', 'noopener');
  }

  // Photo upload preview + WhatsApp share helper
  let selectedFiles = [];
  function renderPhotoPreview(){
    if(!photoPreview) return;
    photoPreview.innerHTML = '';
    selectedFiles.slice(0, 8).forEach((file) => {
      const url = URL.createObjectURL(file);
      const thumb = document.createElement('div');
      thumb.className = 'thumb';
      const img = document.createElement('img');
      img.src = url;
      img.alt = file.name || 'Selected photo';
      img.loading = 'lazy';
      img.addEventListener('load', () => URL.revokeObjectURL(url));
      thumb.appendChild(img);
      photoPreview.appendChild(thumb);
    });
  }

  if(photoInput){
    photoInput.addEventListener('change', (e) => {
      selectedFiles = Array.from(e.target.files || []).filter(Boolean);
      renderPhotoPreview();
    });
  }

  if(sharePhotosBtn){
    sharePhotosBtn.addEventListener('click', () => {
      const name = (rsvpName.value || '').trim() || (localStorage.getItem('inviteeName') || '').trim() || 'a guest';
      const count = selectedFiles.length;
      const msg = [
        'Hi Alvin & Josna! ✨',
        `This is ${name}.`,
        count ? `I’m sharing ${count} photo${count === 1 ? '' : 's'} from your special day 🤍` : 'I’d love to share some photos from your special day 🤍',
        'Please attach the photos and send this message.',
        '— Sent from your wedding website'
      ].join('\n');

      // WhatsApp cannot auto-attach images from the browser.
      // This opens WhatsApp with a message; the user attaches photos manually.
      openWhatsApp(msg);
    });
  }

  rsvpForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = (rsvpName.value || '').trim() || (localStorage.getItem('inviteeName') || '').trim() || 'a guest';
    const notes = (document.getElementById('rsvpNotes').value || '').trim();

    const payload = {
      name,
      notes,
      at: new Date().toISOString(),
    };

    // Local backup (optional)
    const key = 'wish:' + norm(payload.name || 'guest');
    localStorage.setItem(key, JSON.stringify(payload));

    const lines = [
      'Hi Alvin & Josna! ✨',
      `This is ${payload.name}.`,
      notes ? `Message: ${notes}` : 'Sending you lots of love and blessings! 🤍',
      '— Sent from your wedding website'
    ];

    rsvpMsg.textContent = 'Opening WhatsApp…';
    openWhatsApp(lines.join('\n'));
  });

  // Start: ALWAYS show gate first (before website opens)
  main.dataset.locked = 'true';

  // If user has valid saved code/link, unlock silently
  const unlocked = tryAutoUnlock();
  if(!unlocked){
    openGate();
  }
})();
