
document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);

  const welcome = $('welcome-screen');
  const studio = $('studio-screen');
  const modeForm = $('mode-form');

  const memberModal = $('member-modal');
  const memberForm = $('member-form');
  const memberList = $('member-list-items');
  const memberName = $('member-name');
  const memberImage = $('member-image');
  const memberColor = $('member-color');
  const memberShortcut = $('member-shortcut');
  const shortcutError = $('shortcut-error');

  const classicMembers = $('classic-members');
  const classicLayout = $('classic-layout');

  const visualStage = $('visual-stage');
  const visualMembers = $('visual-members');
  const visualTemplate = $('visual-member-template');
  const visualHint = $('visual-drag-hint');

  const audio = $('music-audio');
  const audioFile = $('music-file');
  const seek = $('music-seek');
  const trackName = $('music-track-name');
  const timeNow = $('music-current-time');
  const timeLength = $('music-duration');
  const playButton = $('music-toggle');
  const restartButton = $('music-restart');
  const volume = $('music-volume');
  const musicError = $('music-error');

  const groupButton = $('open-groups-modal');
  const groupsModal = $('groups-modal');
  const editorModal = $('group-editor-modal');
  const loadModal = $('group-load-modal');

  const members = [];
  const recordedLines = [];
  const KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  let chosenKey = '';
  let musicURL = null;
  let musicReady = false;
  let recording = 'idle';
  let frame = null;
  let editingMember = null;
  let editingKey = '';

  restartButton.textContent = '↺ Restart All (~)';

  // ==========================================
  // GLOBAL COMPONENT STYLES
  // ==========================================

  const addCSS = css => {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.append(style);
  };

  addCSS(`
    .member-card[role=button] {
      cursor: pointer;
      border: 1px solid transparent;
      transition: .2s;
    }

    .member-card[role=button]:hover {
      border-color: var(--member-color);
      transform: translateY(-3px);
    }

    .member-card-edit-hint {
      font-size: 11px;
      color: #aaa5ba;
      margin-top: 10px;
    }

    .edit-member-form {
      display: grid;
      gap: 10px;
    }

    .edit-member-form label {
      font-size: 13px;
      font-weight: bold;
      color: #e8e3ee;
    }

    .edit-member-form input[type=text],
    .edit-member-form input[type=file] {
      width: 100%;
      min-width: 0;
      padding: 11px;
      background: #292938;
      border: 1px solid #454555;
      border-radius: 8px;
      color: white;
    }

    .edit-member-form input[type=color] {
      width: 60px;
      height: 40px;
      cursor: pointer;
    }

    .edit-member-form .edit-shortcut {
      text-align: center;
      cursor: pointer;
      font-weight: bold;
    }

    .edit-member-form .photo-preview {
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border: 2px solid var(--member-color);
      border-radius: 10px;
      color: var(--member-color);
      font-size: 25px;
      font-weight: bold;
    }

    .edit-member-form .photo-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .edit-member-form .edit-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 9px;
      margin-top: 10px;
    }

    .edit-member-form .delete-member-button {
      background: #59313d;
      color: #ffe4ea;
    }

    .edit-member-form .cancel-member-button {
      background: #383443;
      color: white;
    }

    .edit-error {
      color: #ff9b9b;
      font-size: 13px;
    }

    #edit-member-title {
      color: var(--accent);
    }

    /* VISUAL PREVIEW */

    #studio-screen[data-visual-mode=visual] .preview {
      aspect-ratio: 16 / 9;
      background: #101018 !important;
    }

    #visual-layout {
      position: relative;
      padding: clamp(6px, 2vw, 22px);
      overflow: hidden;
    }

    #visual-stage {
      position: relative;
      width: 100%;
      height: 100%;
    }

    #visual-members {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    #visual-empty-state {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      pointer-events: none;
    }

    #visual-stage:has(#visual-members:not(:empty))
    #visual-empty-state {
      display: none;
    }

    .visual-member {
      position: absolute;
      left: 50%;
      top: 50%;
      width: var(--visual-card-width, 125px);
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      text-align: center;
      cursor: grab;
      touch-action: none;
      user-select: none;
      pointer-events: auto;
      z-index: 1;
    }

    .visual-member.is-dragging {
      z-index: 5;
      cursor: grabbing;
    }

    .visual-avatar {
      position: relative;
      flex: none;
      width: var(--visual-photo-size, 96px);
      height: var(--visual-photo-size, 96px);
      transition: transform .19s, filter .19s;
    }

    .visual-progress-ring {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
      pointer-events: none;
    }

    .visual-ring-track,
    .visual-ring-fill {
      fill: none;
      stroke-width: 7;
    }

    .visual-ring-track {
      stroke: #393846;
    }

    .visual-ring-fill {
      stroke: var(--member-color);
      stroke-linecap: round;
      transform: rotate(-90deg);
      transform-origin: 50% 50%;
      transition: stroke-dashoffset .14s;
    }

    .visual-photo,
    .visual-initial {
      position: absolute;
      inset: 11%;
      width: 78%;
      height: 78%;
      border-radius: 50%;
      border: 2px solid var(--member-color);
      background: #292938;
      box-shadow: 0 0 9px var(--member-color);
    }

    .visual-photo {
      object-fit: cover;
      pointer-events: none;
      -webkit-user-drag: none;
    }

    .visual-initial {
      display: flex;
      justify-content: center;
      align-items: center;
      color: var(--member-color);
      font-size: calc(var(--visual-photo-size, 96px) * .35);
      font-weight: 800;
    }

    .visual-photo[hidden],
    .visual-initial[hidden] {
      display: none !important;
    }

    .visual-crown {
      position: absolute;
      left: 50%;
      top: -27%;
      transform: translateX(-50%);
      font-size: calc(var(--visual-photo-size, 96px) * .36);
      color: white;
      visibility: hidden;
      filter: drop-shadow(0 0 7px var(--member-color));
      pointer-events: none;
    }

    .visual-member.is-winner .visual-crown {
      visibility: visible;
    }

    .visual-member-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1px;
      width: 100%;
      line-height: 1.14;
      font-variant-numeric: tabular-nums;
    }

    .visual-name {
      width: 100%;
      font-size: clamp(
        8px,
        calc(var(--visual-photo-size, 96px) * .14),
        15px
      );
      font-weight: 800;
      color: var(--member-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .visual-seconds,
    .visual-percentage {
      font-size: clamp(
        8px,
        calc(var(--visual-photo-size, 96px) * .12),
        14px
      );
    }

    .visual-seconds {
      color: white;
      font-weight: 700;
    }

    .visual-percentage {
      color: #cccbd7;
    }

    .visual-member.is-singing {
      z-index: 3;
    }

    .visual-member.is-singing .visual-avatar {
      transform: scale(1.12);
      filter:
        drop-shadow(0 0 8px var(--member-color))
        drop-shadow(0 0 12px var(--member-color));
    }

    #visual-drag-hint {
      position: absolute;
      bottom: 1%;
      left: 0;
      right: 0;
      font-size: 11px;
      color: #9996ab;
      pointer-events: none;
      margin: 0;
    }

    #visual-drag-hint[hidden] {
      display: none !important;
    }

    /* GROUP PRESETS */

    .group-card {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
      background: #1a1a26;
      border: 1px solid #464053;
      border-radius: 12px;
      padding: 13px;
    }

    .group-card-photos {
      display: flex;
      align-items: center;
      min-height: 45px;
    }

    .group-card-photos img,
    .group-card-photos span {
      width: 43px;
      height: 43px;
      border-radius: 50%;
      object-fit: cover;
      background: #34313f;
      border: 2px solid var(--member-color);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      margin-left: -8px;
    }

    .group-card-photos :first-child {
      margin-left: 0;
    }

    .group-card-details {
      flex: 1;
      min-width: 100px;
    }

    .group-card-name {
      margin: 0;
      color: white;
      overflow-wrap: anywhere;
    }

    .group-card-count {
      margin: 4px 0 0;
      color: #bbb4c8;
      font-size: 12px;
    }

    .group-card-actions button {
      padding: 9px 13px;
    }

    .group-editor-member {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      background: #292837;
      border: 1px solid #464053;
      border-radius: 10px;
      flex-wrap: wrap;
    }

    .group-editor-member img,
    .group-editor-member span {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--member-color);
      display: flex;
      justify-content: center;
      align-items: center;
      color: var(--member-color);
    }

    .group-editor-details {
      flex: 1;
      min-width: 90px;
      overflow-wrap: anywhere;
    }

    .group-editor-details strong {
      display: block;
      color: var(--member-color);
    }

    .group-editor-details small {
      color: #c3bdcb;
    }

    #group-member-shortcut {
      cursor: pointer;
      text-align: center;
      font-weight: bold;
    }

    .groups-actions button:disabled {
      opacity: .5;
      cursor: not-allowed;
    }

    @media (prefers-reduced-motion: reduce) {
      .visual-avatar,
      .visual-ring-fill {
        transition: none;
      }
    }
  `);

  // ==========================================
  // COMMON HELPERS
  // ==========================================

  function isLocked() {
    return recording === 'recording' ||
           recording === 'awaitingFinish';
  }

  function groupDialogOpen() {
    return [groupsModal, editorModal, loadModal]
      .some(element => element.classList.contains('open'));
  }

  function show(element) {
    element.classList.add('open');
  }

  function hide(element) {
    element.classList.remove('open');
  }

  function validKey(key, except = null) {
    if (!/^[A-Z0-9]$/.test(key)) {
      return 'Choose a letter (A-Z) or number (0-9).';
    }

    if (members.some(member =>
      member !== except &&
      member.shortcut === key
    )) {
      return 'This key is already assigned.';
    }

    return '';
  }

  function newMember(data) {
    return {
      name: data.name,
      color: data.color,
      shortcut: data.shortcut,
      photoURL: data.photoURL || null,
      lines: [],
      activeLine: null,
      totalSeconds: 0,
      percentage: 0,
      classicUI: null,
      visualUI: null,
      visualPosition: data.visualPosition || null
    };
  }

  function positionCopy(position) {
    if (
      !position ||
      !Number.isFinite(position.x) ||
      !Number.isFinite(position.y)
    ) {
      return null;
    }

    return {
      x: Math.max(0, Math.min(100, position.x)),
      y: Math.max(0, Math.min(100, position.y)),
      custom: !!position.custom
    };
  }

  // ==========================================
  // WELCOME SCREEN
  // ==========================================

  modeForm.addEventListener('submit', event => {
    event.preventDefault();

    const choice = modeForm.querySelector(
      'input[name="visual-mode"]:checked'
    );

    if (!choice) return;

    studio.dataset.visualMode = choice.value;
    welcome.hidden = true;
    studio.hidden = false;

    requestAnimationFrame(layoutVisual);
    window.scrollTo(0, 0);
  });

  // ==========================================
  // ADD MEMBER
  // ==========================================

  $('open-member-modal').addEventListener('click', () => {
    if (isLocked()) return;
    show(memberModal);
    memberName.focus();
  });

  $('close-member-modal').addEventListener('click', () => {
    hide(memberModal);
  });

  memberModal.addEventListener('click', event => {
    if (event.target === memberModal) {
      hide(memberModal);
    }
  });

  memberShortcut.addEventListener('keydown', event => {
    event.preventDefault();
    event.stopPropagation();

    if (event.key === 'Escape') {
      hide(memberModal);
      return;
    }

    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    const key = event.key.toUpperCase();
    const error = validKey(key);

    shortcutError.hidden = !error;
    shortcutError.textContent = error;

    if (!error) {
      chosenKey = key;
      memberShortcut.value = key;
    }
  });

  memberForm.addEventListener('submit', event => {
    event.preventDefault();

    if (isLocked()) return;

    const name = memberName.value.trim();

    if (
      members.length >= 20 ||
      !name ||
      !chosenKey ||
      validKey(chosenKey)
    ) {
      shortcutError.textContent = members.length >= 20
        ? 'Maximum 20 members.'
        : 'Choose a free keyboard shortcut.';

      shortcutError.hidden = false;
      return;
    }

    const photo = memberImage.files[0];

    members.push(newMember({
      name,
      color: memberColor.value,
      shortcut: chosenKey,
      photoURL: photo ? URL.createObjectURL(photo) : null
    }));

    chosenKey = '';
    memberForm.reset();
    shortcutError.hidden = true;

    hide(memberModal);
    renderMembers();
  });

  // ==========================================
  // CLASSIC LINE DISTRIBUTION
  // ==========================================

  function classicPhoto(member) {
    if (member.photoURL) {
      const image = document.createElement('img');
      image.className = 'classic-photo';
      image.src = member.photoURL;
      image.alt = member.name;
      return image;
    }

    const element = document.createElement('div');

    element.className = 'classic-photo';
    element.textContent = member.name.charAt(0).toUpperCase();

    element.style.cssText =
      'display:flex;align-items:center;' +
      'justify-content:center;font-weight:bold;font-size:20px';

    element.style.color = member.color;
    return element;
  }

  function classicRow(member) {
    const row = document.createElement('div');
    row.className = 'classic-member';

    row.style.setProperty('--member-color', member.color);

    const crown = document.createElement('span');
    crown.className = 'classic-crown';
    crown.textContent = '♕';

    const photo = classicPhoto(member);

    const info = document.createElement('div');
    info.className = 'classic-info';

    const top = document.createElement('div');
    top.className = 'classic-info-top';

    const name = document.createElement('span');
    name.className = 'classic-name';
    name.textContent = member.name;

    const seconds = document.createElement('span');
    seconds.className = 'classic-seconds';
    seconds.textContent = '0.0s';

    top.append(name, seconds);

    const progress = document.createElement('div');
    progress.className = 'classic-progress';

    const fill = document.createElement('div');
    fill.className = 'classic-progress-fill';

    progress.append(fill);

    const percent = document.createElement('span');
    percent.className = 'classic-percentage';
    percent.textContent = '0%';

    info.append(top, progress, percent);
    row.append(crown, photo, info);

    member.classicUI = {
      row,
      photo,
      progress,
      fill,
      seconds,
      percent
    };

    return row;
  }

  function rankClassic() {
    if (members.length < 2) return;

    const sorted = [...members].sort(
      (a, b) =>
        b.totalSeconds - a.totalSeconds ||
        members.indexOf(a) - members.indexOf(b)
    );

    if (sorted.every((member, index) =>
      classicMembers.children[index] === member.classicUI.row
    )) {
      return;
    }

    const before = new Map();

    [...classicMembers.children].forEach(row => {
      row.getAnimations?.().forEach(animation => {
        if (animation.id === 'rank-move') {
          animation.cancel();
        }
      });

      before.set(row, row.getBoundingClientRect().top);
    });

    sorted.forEach(member => {
      classicMembers.append(member.classicUI.row);
    });

    if (
      matchMedia('(prefers-reduced-motion:reduce)').matches
    ) {
      return;
    }

    sorted.forEach(member => {
      const row = member.classicUI.row;
      const distance =
        before.get(row) -
        row.getBoundingClientRect().top;

      if (Math.abs(distance) > 1 && row.animate) {
        const animation = row.animate(
          [
            { transform: `translateY(${distance}px)` },
            { transform: 'translateY(0)' }
          ],
          {
            duration: 460,
            easing: 'cubic-bezier(.22,1,.36,1)'
          }
        );

        animation.id = 'rank-move';
      }
    });
  }

  function updateClassic() {
    members.forEach(member => {
      const ui = member.classicUI;
      if (!ui) return;

      ui.seconds.textContent =
        member.totalSeconds.toFixed(1) + 's';

      ui.percent.textContent = member.percentage
        ? member.percentage.toFixed(1) + '%'
        : '0%';

      ui.fill.style.width =
        Math.max(0, Math.min(100, member.percentage)) + '%';

      const singing =
        recording === 'recording' &&
        member.activeLine &&
        !audio.paused;

      ui.photo.style.boxShadow = singing
        ? `0 0 8px ${member.color},0 0 17px ${member.color}`
        : '';

      ui.progress.style.boxShadow = singing
        ? `0 0 9px ${member.color}`
        : '';
    });

    rankClassic();
  }

  // ==========================================
  // VISUAL LINE DISTRIBUTION
  // ==========================================

  const CIRCUMFERENCE = Math.PI * 106;

  function visualCols(count) {
    if (count <= 3) return Math.max(1, count);
    if (count <= 6) return 3;
    if (count <= 12) return 4;
    return 5;
  }

  function fitVisual(member) {
    if (!member.visualUI || !member.visualPosition) {
      return;
    }

    const rect = visualStage.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    const node = member.visualUI.node;

    const paddingX = Math.min(
      48,
      node.offsetWidth / rect.width * 50
    );

    const paddingY = Math.min(
      48,
      node.offsetHeight / rect.height * 50
    );

    member.visualPosition.x = Math.max(
      paddingX,
      Math.min(100 - paddingX, member.visualPosition.x)
    );

    member.visualPosition.y = Math.max(
      paddingY,
      Math.min(100 - paddingY, member.visualPosition.y)
    );

    node.style.left = member.visualPosition.x + '%';
    node.style.top = member.visualPosition.y + '%';
  }

  function layoutVisual() {
    const rect = visualStage.getBoundingClientRect();

    if (!members.length || !rect.width || !rect.height) {
      return;
    }

    const columns = visualCols(members.length);
    const rows = Math.ceil(members.length / columns);

    const width = rect.width / columns;
    const height = rect.height / rows;

    const size = Math.max(
      25,
      Math.min(
        116,
        Math.floor(Math.min(width * .73, height * .64))
      )
    );

    visualStage.style.setProperty(
      '--visual-photo-size',
      size + 'px'
    );

    visualStage.style.setProperty(
      '--visual-card-width',
      Math.max(35, Math.min(width * .94, size * 1.47)) + 'px'
    );

    members.forEach((member, index) => {
      if (!member.visualPosition?.custom) {
        const row = Math.floor(index / columns);
        const column = index % columns;

        const inRow = Math.min(
          columns,
          members.length - row * columns
        );

        member.visualPosition = {
          x: (column + 1) / (inRow + 1) * 100,
          y: (row + .5) / rows * 100,
          custom: false
        };
      }

      fitVisual(member);
    });
  }

  function dragVisual(member, node) {
    let drag = null;

    node.addEventListener('pointerdown', event => {
      if (
        isLocked() ||
        (
          event.pointerType === 'mouse' &&
          event.button !== 0
        )
      ) {
        return;
      }

      const rect = visualStage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      event.preventDefault();

      drag = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        px: member.visualPosition.x,
        py: member.visualPosition.y
      };

      node.classList.add('is-dragging');
      node.setPointerCapture(event.pointerId);
    });

    node.addEventListener('pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;

      const rect = visualStage.getBoundingClientRect();

      member.visualPosition = {
        x: drag.px +
          (event.clientX - drag.x) / rect.width * 100,
        y: drag.py +
          (event.clientY - drag.y) / rect.height * 100,
        custom: true
      };

      fitVisual(member);
    });

    const stop = event => {
      if (!drag || drag.id !== event.pointerId) return;

      drag = null;
      node.classList.remove('is-dragging');

      if (node.hasPointerCapture(event.pointerId)) {
        node.releasePointerCapture(event.pointerId);
      }
    };

    node.addEventListener('pointerup', stop);
    node.addEventListener('pointercancel', stop);

    node.addEventListener('lostpointercapture', () => {
      drag = null;
      node.classList.remove('is-dragging');
    });
  }

  function visualCard(member) {
    const node = visualTemplate.content
      .firstElementChild.cloneNode(true);

    node.style.setProperty(
      '--member-color',
      member.color
    );

    const image = node.querySelector('.visual-photo');
    const initial = node.querySelector('.visual-initial');

    if (member.photoURL) {
      image.src = member.photoURL;
      image.alt = member.name;
      image.hidden = false;
      initial.hidden = true;
    } else {
      image.hidden = true;
      initial.hidden = false;
      initial.textContent =
        member.name.charAt(0).toUpperCase();
    }

    node.querySelector('.visual-name').textContent =
      member.name;

    const ring = node.querySelector('.visual-ring-fill');

    ring.style.strokeDasharray = CIRCUMFERENCE;
    ring.style.strokeDashoffset = CIRCUMFERENCE;

    member.visualUI = {
      node,
      ring,
      seconds: node.querySelector('.visual-seconds'),
      percent: node.querySelector('.visual-percentage')
    };

    dragVisual(member, node);

    return node;
  }

  function updateVisual() {
    members.forEach(member => {
      if (!member.visualUI) return;

      const ui = member.visualUI;

      ui.seconds.textContent =
        member.totalSeconds.toFixed(1) + 's';

      ui.percent.textContent = member.percentage
        ? member.percentage.toFixed(1) + '%'
        : '0%';

      const fraction =
        Math.max(0, Math.min(100, member.percentage)) / 100;

      ui.ring.style.strokeDashoffset =
        CIRCUMFERENCE * (1 - fraction);

      ui.node.classList.toggle(
        'is-singing',
        recording === 'recording' &&
        !!member.activeLine &&
        !audio.paused
      );
    });
  }

  if (window.ResizeObserver) {
    new ResizeObserver(layoutVisual).observe(visualStage);
  } else {
    window.addEventListener('resize', layoutVisual);
  }

  // ==========================================
  // EDIT MEMBER WINDOW
  // ==========================================

  const editOverlay = document.createElement('div');

  editOverlay.id = 'member-settings-modal';
  editOverlay.className = 'modal-overlay';

  editOverlay.innerHTML = `
    <div class="modal-content"
         role="dialog"
         aria-modal="true"
         aria-labelledby="edit-member-title">

      <button type="button"
              class="close-modal"
              id="close-edit-member">×</button>

      <h2 id="edit-member-title">Edit Member</h2>

      <form id="edit-member-form" class="edit-member-form">

        <div id="edit-photo-preview"
             class="photo-preview"></div>

        <label for="edit-member-name">
          Member Name
        </label>

        <input id="edit-member-name"
               type="text"
               maxlength="30"
               required>

        <label for="edit-member-color">
          Member Color
        </label>

        <input id="edit-member-color" type="color">

        <label for="edit-member-image">
          Change Photo
        </label>

        <input id="edit-member-image"
               type="file"
               accept="image/*">

        <p style="font-size:12px;color:#aaa5ba">
          Leave empty to keep the current photo.
        </p>

        <label>
          <input id="edit-remove-photo" type="checkbox">
          Remove current photo
        </label>

        <label for="edit-member-shortcut">
          Keyboard Shortcut
        </label>

        <input id="edit-member-shortcut"
               class="edit-shortcut"
               type="text"
               readonly
               required>

        <p id="edit-member-error"
           class="edit-error"
           hidden></p>

        <div class="edit-actions">

          <button type="submit">
            Save Changes
          </button>

          <button type="button"
                  id="delete-member"
                  class="delete-member-button">
            Remove Member
          </button>

          <button type="button"
                  id="cancel-edit-member"
                  class="cancel-member-button">
            Cancel
          </button>

        </div>
      </form>
    </div>
  `;

  studio.append(editOverlay);

  const editName = $('edit-member-name');
  const editColor = $('edit-member-color');
  const editImage = $('edit-member-image');
  const editShortcut = $('edit-member-shortcut');
  const editError = $('edit-member-error');
  const editPreview = $('edit-photo-preview');

  function closeEdit() {
    hide(editOverlay);
    editingMember = null;
    editError.hidden = true;
  }

  function openEdit(member) {
    if (isLocked()) {
      setStatus('Finish recording before editing members.');
      return;
    }

    editingMember = member;
    editingKey = member.shortcut;

    $('edit-member-form').reset();

    editName.value = member.name;
    editColor.value = member.color;
    editShortcut.value = member.shortcut;

    editPreview.replaceChildren();

    editPreview.style.setProperty(
      '--member-color',
      member.color
    );

    if (member.photoURL) {
      const image = document.createElement('img');
      image.src = member.photoURL;
      image.alt = member.name;
      editPreview.append(image);
    } else {
      editPreview.textContent =
        member.name.charAt(0).toUpperCase();
    }

    editError.hidden = true;
    show(editOverlay);
    editName.focus();
  }

  $('close-edit-member').addEventListener('click', closeEdit);
  $('cancel-edit-member').addEventListener('click', closeEdit);

  editOverlay.addEventListener('click', event => {
    if (event.target === editOverlay) {
      closeEdit();
    }
  });

  editColor.addEventListener('input', () => {
    editPreview.style.setProperty(
      '--member-color',
      editColor.value
    );
  });

  editShortcut.addEventListener('keydown', event => {
    event.preventDefault();
    event.stopPropagation();

    if (event.key === 'Escape') {
      closeEdit();
      return;
    }

    const key = event.key.toUpperCase();
    const error = validKey(key, editingMember);

    editError.textContent = error;
    editError.hidden = !error;

    if (!error) {
      editingKey = key;
      editShortcut.value = key;
    }
  });

  $('edit-member-form').addEventListener('submit', event => {
    event.preventDefault();

    if (!editingMember || isLocked()) return;

    const name = editName.value.trim();
    const error = validKey(editingKey, editingMember);
    const photo = editImage.files[0];

    if (
      !name ||
      error ||
      (photo && !photo.type.startsWith('image/'))
    ) {
      editError.textContent =
        error || 'Enter a valid name and photo.';

      editError.hidden = false;
      return;
    }

    const member = editingMember;
    const oldURL = member.photoURL;

    member.photoURL = photo
      ? URL.createObjectURL(photo)
      : $('edit-remove-photo').checked
        ? null
        : oldURL;

    member.name = name;
    member.color = editColor.value;
    member.shortcut = editingKey;

    member.lines.forEach(line => {
      line.memberShortcut = editingKey;
    });

    closeEdit();
    renderMembers();

    if (oldURL && oldURL !== member.photoURL) {
      URL.revokeObjectURL(oldURL);
    }
  });

  $('delete-member').addEventListener('click', () => {
    const member = editingMember;

    if (!member || isLocked()) return;

    if (!confirm(
      `Remove ${member.name}? Their recorded lines will also be deleted.`
    )) {
      return;
    }

    members.splice(members.indexOf(member), 1);

    member.lines.forEach(line => {
      const index = recordedLines.indexOf(line);

      if (index !== -1) {
        recordedLines.splice(index, 1);
      }
    });

    closeEdit();
    renderMembers();

    if (member.photoURL) {
      URL.revokeObjectURL(member.photoURL);
    }
  });

  // ==========================================
  // MEMBER CARDS
  // ==========================================

  function renderCards() {
    const fragment = document.createDocumentFragment();

    members.forEach(member => {
      const card = document.createElement('div');

      card.className = 'member-card';
      card.style.setProperty(
        '--member-color',
        member.color
      );

      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute(
        'aria-label',
        'Edit member ' + member.name
      );

      if (member.photoURL) {
        const image = document.createElement('img');

        image.src = member.photoURL;
        image.alt = member.name;

        card.append(image);
      }

      const title = document.createElement('p');
      title.textContent = member.name;

      const badge = document.createElement('span');
      badge.className = 'member-shortcut';
      badge.textContent = 'Key: ' + member.shortcut;

      const hint = document.createElement('div');
      hint.className = 'member-card-edit-hint';
      hint.textContent = 'Click to edit ✎';

      card.append(title, badge, hint);

      card.addEventListener('click', () => {
        openEdit(member);
      });

      card.addEventListener('keydown', event => {
        if (
          event.key === 'Enter' ||
          event.key === ' '
        ) {
          event.preventDefault();
          openEdit(member);
        }
      });

      fragment.append(card);
    });

    memberList.replaceChildren(fragment);
  }

  function winnerCrown() {
    const winner = recording === 'finished'
      ? members.reduce((best, member) => {
          if (
            member.totalSeconds > 0 &&
            (
              !best ||
              member.totalSeconds > best.totalSeconds
            )
          ) {
            return member;
          }

          return best;
        }, null)
      : null;

    classicLayout.classList.toggle(
      'finished',
      recording === 'finished'
    );

    members.forEach(member => {
      member.classicUI?.row.classList.toggle(
        'winner',
        member === winner
      );

      member.visualUI?.node.classList.toggle(
        'is-winner',
        member === winner
      );
    });
  }

  function renderMembers() {
    renderCards();

    const classics = document.createDocumentFragment();
    const visuals = document.createDocumentFragment();

    members.forEach(member => {
      classics.append(classicRow(member));
      visuals.append(visualCard(member));
    });

    classicMembers.replaceChildren(classics);
    visualMembers.replaceChildren(visuals);

    layoutVisual();
    updateResults();
    winnerCrown();
    setButtons();
  }

  // ==========================================
  // MUSIC PLAYER AND RECORDING
  // ==========================================

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return '0:00';
    }

    const number = Math.floor(seconds);
    const minutes = Math.floor(number / 60);
    const remaining = String(number % 60).padStart(2, '0');

    return minutes >= 60
      ? `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}:${remaining}`
      : `${minutes}:${remaining}`;
  }

  function progress() {
    timeNow.textContent = formatTime(audio.currentTime);

    const duration = audio.duration;

    seek.value =
      Number.isFinite(duration) && duration > 0
        ? Math.max(
            0,
            Math.min(100, audio.currentTime / duration * 100)
          )
        : 0;

    timeLength.textContent = formatTime(duration);
  }

  function playLabel() {
    playButton.textContent = audio.paused
      ? '▶ Play'
      : '⏸ Pause';
  }

  const recordingPanel = document.createElement('section');
  recordingPanel.id = 'recording-controls';

  recordingPanel.style.cssText =
    'max-width:960px;margin:24px auto;padding:20px;' +
    'background:#1c1c28;border:1px solid #393543;' +
    'border-radius:14px;text-align:center';

  recordingPanel.innerHTML = `
    <h2 style="color:var(--accent);margin-top:0">
      RECORDING SYSTEM
    </h2>
  `;

  const buttonRow = document.createElement('div');

  buttonRow.style.cssText =
    'display:flex;justify-content:center;' +
    'gap:12px;flex-wrap:wrap';

  const start = document.createElement('button');
  start.id = 'start-recording';
  start.textContent = '● Start Recording';

  const finish = document.createElement('button');
  finish.id = 'finish-recording';
  finish.textContent = '■ Finish Recording';

  const status = document.createElement('p');
  status.id = 'recording-status';
  status.style.color = '#c7c7d0';

  buttonRow.append(start, finish);
  recordingPanel.append(buttonRow, status);

  document.querySelector('.music-player').after(
    recordingPanel
  );

  function setStatus(value) {
    if (value) {
      status.textContent = value;
      return;
    }

    if (recording === 'idle') {
      status.textContent = musicReady
        ? 'Ready! Press Start Recording.'
        : 'Upload an MP3 to begin.';
      return;
    }

    if (recording === 'awaitingFinish') {
      status.textContent =
        'Song ended. Click Finish Recording to confirm results.';
      return;
    }

    if (recording === 'finished') {
      status.textContent =
        'Recording finished! Final results are ready.';
      return;
    }

    if (audio.paused) {
      status.textContent =
        'Recording paused. Press Play to continue.';
      return;
    }

    const active = members.filter(member =>
      member.activeLine
    );

    status.textContent = active.length
      ? 'Recording: ' +
        active.map(member => member.name).join(', ')
      : "Recording... Press a member's assigned key.";
  }

  function setButtons() {
    start.disabled =
      !musicReady ||
      recording !== 'idle';

    finish.disabled =
      recording !== 'recording' &&
      recording !== 'awaitingFinish';

    playButton.disabled =
      !musicReady ||
      recording === 'awaitingFinish';

    restartButton.disabled = !musicReady;

    seek.disabled =
      !musicReady ||
      isLocked();

    $('open-member-modal').disabled = isLocked();

    if (groupButton) {
      groupButton.disabled = isLocked();
    }

    if (visualHint) {
      visualHint.hidden =
        !members.length ||
        isLocked();
    }
  }

  function updateResults() {
    let total = 0;
    const now = audio.currentTime || 0;

    members.forEach(member => {
      member.totalSeconds = member.lines.reduce(
        (sum, line) => {
          const end = line.end === null
            ? now
            : line.end;

          return sum + Math.max(0, end - line.start);
        },
        0
      );

      total += member.totalSeconds;
    });

    members.forEach(member => {
      member.percentage = total
        ? member.totalSeconds / total * 100
        : 0;
    });

    updateClassic();
    updateVisual();
  }

  function stopTimer() {
    if (frame !== null) {
      cancelAnimationFrame(frame);
    }

    frame = null;
  }

  function tick() {
    frame = null;
    updateResults();

    if (
      recording === 'recording' &&
      !audio.paused
    ) {
      frame = requestAnimationFrame(tick);
    }
  }

  function startTimer() {
    if (
      frame === null &&
      recording === 'recording' &&
      !audio.paused
    ) {
      frame = requestAnimationFrame(tick);
    }
  }

  function closeLines(time) {
    members.forEach(member => {
      if (!member.activeLine) return;

      member.activeLine.end = Math.max(
        member.activeLine.start,
        time
      );

      member.activeLine = null;
    });
  }

  function toggleLine(member) {
    if (
      recording !== 'recording' ||
      audio.paused
    ) {
      return;
    }

    const now = audio.currentTime;

    if (member.activeLine) {
      member.activeLine.end = now;
      member.activeLine = null;
    } else {
      const line = {
        memberShortcut: member.shortcut,
        start: now,
        end: null
      };

      member.lines.push(line);
      recordedLines.push(line);
      member.activeLine = line;
    }

    updateResults();
    setStatus();
  }

  function resetRecording() {
    stopTimer();

    recording = 'idle';
    recordedLines.length = 0;

    members.forEach(member => {
      member.lines = [];
      member.activeLine = null;
      member.totalSeconds = 0;
      member.percentage = 0;
    });

    updateResults();
    winnerCrown();
    setButtons();
    setStatus();
  }

  function restartAll() {
    if (!musicReady) return;

    audio.pause();
    audio.currentTime = 0;

    resetRecording();
    progress();
    playLabel();
  }

  restartButton.addEventListener('click', restartAll);

  start.addEventListener('click', async () => {
    if (
      !musicReady ||
      recording !== 'idle'
    ) {
      return;
    }

    if (!members.length) {
      setStatus('Add at least one member before recording.');
      return;
    }

    musicError.hidden = true;
    recording = 'recording';
    setButtons();
    start.blur();

    try {
      await audio.play();
      setStatus();
      startTimer();
    } catch {
      recording = 'idle';
      stopTimer();
      setButtons();
      setStatus();

      musicError.textContent =
        'Could not start this MP3 file.';

      musicError.hidden = false;
    }
  });

  finish.addEventListener('click', () => {
    if (!isLocked()) return;

    closeLines(audio.currentTime);
    recording = 'finished';

    stopTimer();
    audio.pause();

    updateResults();
    winnerCrown();
    setButtons();
    setStatus();
    playLabel();
  });

  // ==========================================
  // MP3 EVENTS
  // ==========================================

  audioFile.addEventListener('change', () => {
    const file = audioFile.files[0];
    if (!file) return;

    if (!/\.mp3$/i.test(file.name)) {
      musicError.textContent =
        'Please select an MP3 file only.';

      musicError.hidden = false;
      audioFile.value = '';
      return;
    }

    audio.pause();
    resetRecording();

    musicReady = false;
    setButtons();

    const oldURL = musicURL;

    musicURL = URL.createObjectURL(file);
    audio.src = musicURL;
    audio.load();

    if (oldURL) URL.revokeObjectURL(oldURL);

    trackName.textContent =
      file.name.replace(/\.mp3$/i, '');

    audioFile.value = '';
    seek.value = 0;
    timeNow.textContent = '0:00';
    timeLength.textContent = '0:00';

    playLabel();
    setStatus();
    musicError.hidden = true;
  });

  audio.addEventListener('loadedmetadata', () => {
    musicReady =
      Number.isFinite(audio.duration) &&
      audio.duration > 0;

    if (!musicReady) {
      musicError.textContent =
        'Could not read this MP3 file duration.';

      musicError.hidden = false;
    } else {
      musicError.hidden = true;
    }

    progress();
    setButtons();
    setStatus();
  });

  playButton.addEventListener('click', async () => {
    if (
      !musicReady ||
      recording === 'awaitingFinish'
    ) {
      return;
    }

    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        musicError.textContent =
          'Could not play this audio file.';

        musicError.hidden = false;
      }
    } else {
      audio.pause();
    }

    playLabel();
  });

  seek.addEventListener('input', () => {
    if (seek.disabled || !musicReady) return;

    if (
      Number.isFinite(audio.duration) &&
      audio.duration > 0
    ) {
      audio.currentTime =
        Number(seek.value) / 100 * audio.duration;

      progress();
    }
  });

  volume.addEventListener('input', () => {
    audio.volume = Number(volume.value);
  });

  audio.volume = Number(volume.value);

  audio.addEventListener('timeupdate', () => {
    progress();

    if (recording === 'recording') {
      updateResults();
    }
  });

  audio.addEventListener('durationchange', progress);

  audio.addEventListener('play', () => {
    playLabel();
    setStatus();
    startTimer();
  });

  audio.addEventListener('pause', () => {
    stopTimer();
    updateResults();
    playLabel();
    setStatus();
  });

  audio.addEventListener('ended', () => {
    if (recording === 'recording') {
      closeLines(audio.duration);
      recording = 'awaitingFinish';

      stopTimer();
      updateResults();
      setButtons();
      setStatus();
    }

    progress();
    playLabel();
  });

  audio.addEventListener('error', () => {
    musicReady = false;

    if (recording === 'recording') {
      closeLines(audio.currentTime);
      recording = 'awaitingFinish';

      stopTimer();
      updateResults();
    }

    setButtons();
    playLabel();

    musicError.textContent =
      'This MP3 file could not be loaded. Please try another file.';

    musicError.hidden = false;
  });

  // ==========================================
  // APPEARANCE SETTINGS
  // ==========================================

  const APPEARANCE_KEY = 'lds-appearance-v1';
  const APPEARANCE_DB = 'lds-appearance-assets';

  const DEFAULT_APPEARANCE = {
    accent: '#ff80c8',
    background: '#101018',
    dim: 25
  };

  const validHex = value =>
    /^#[0-9a-f]{6}$/i.test(value);

  function loadAppearanceColors() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(APPEARANCE_KEY) || 'null'
      );

      if (!saved) return { ...DEFAULT_APPEARANCE };

      return {
        accent: validHex(saved.accent)
          ? saved.accent
          : DEFAULT_APPEARANCE.accent,

        background: validHex(saved.background)
          ? saved.background
          : DEFAULT_APPEARANCE.background,

        dim: Number.isFinite(Number(saved.dim))
          ? Math.max(0, Math.min(85, Number(saved.dim)))
          : 25
      };
    } catch {
      return { ...DEFAULT_APPEARANCE };
    }
  }

  function backgroundDatabase(action, file) {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('Image storage unavailable.'));
        return;
      }

      const request = indexedDB.open(APPEARANCE_DB, 1);

      request.onupgradeneeded = () => {
        if (
          !request.result.objectStoreNames.contains('files')
        ) {
          request.result.createObjectStore('files');
        }
      };

      request.onerror = () => reject(
        request.error ||
        new Error('Image storage unavailable.')
      );

      request.onsuccess = () => {
        const db = request.result;

        const transaction = db.transaction(
          'files',
          action === 'read' ? 'readonly' : 'readwrite'
        );

        const store = transaction.objectStore('files');

        let result = null;
        let operation;

        if (action === 'read') {
          operation = store.get('background');
        }

        if (action === 'write') {
          operation = store.put(file, 'background');
        }

        if (action === 'delete') {
          operation = store.delete('background');
        }

        if (action === 'read') {
          operation.onsuccess = () => {
            result = operation.result || null;
          };
        }

        transaction.oncomplete = () => {
          db.close();
          resolve(result);
        };

        transaction.onerror = () => {
          db.close();
          reject(
            transaction.error ||
            new Error('Could not save image.')
          );
        };

        transaction.onabort = () => {
          db.close();
          reject(new Error('Saving interrupted.'));
        };
      };
    });
  }

  let savedAppearance = loadAppearanceColors();
  let draftAppearance = { ...savedAppearance };

  let savedBackgroundURL = null;
  let draftBackgroundURL = null;
  let pendingImageFile = null;

  let removeBackgroundImage = false;
  let imageRevision = 0;
  let appearanceSaving = false;

  function applyAppearance(values, url) {
    const root = document.documentElement.style;

    root.setProperty('--accent', values.accent);
    root.setProperty('--background', values.background);

    root.setProperty(
      '--background-image-dim',
      String(values.dim / 100)
    );

    root.setProperty(
      '--page-background-image',
      url ? `url("${url}")` : 'none'
    );

    document.body.classList.toggle(
      'appearance-has-image',
      !!url
    );
  }

  applyAppearance(savedAppearance, null);

  const appearanceToggle = document.createElement('button');

  appearanceToggle.id = 'appearance-toggle';
  appearanceToggle.type = 'button';
  appearanceToggle.textContent = '🎨 Appearance Settings';

  appearanceToggle.setAttribute(
    'aria-haspopup',
    'dialog'
  );

  appearanceToggle.setAttribute(
    'aria-controls',
    'appearance-overlay'
  );

  document.body.append(appearanceToggle);

  const appearanceOverlay = document.createElement('div');

  appearanceOverlay.id = 'appearance-overlay';

  appearanceOverlay.setAttribute(
    'aria-hidden',
    'true'
  );

  appearanceOverlay.innerHTML = `
    <div class="appearance-panel"
         role="dialog"
         aria-modal="true"
         aria-labelledby="appearance-title">

      <div class="appearance-panel-header">

        <h2 id="appearance-title"
            class="appearance-panel-title">
          🎨 Appearance Settings
        </h2>

        <button type="button"
                id="appearance-close"
                aria-label="Close appearance settings">
          ×
        </button>

      </div>

      <p class="appearance-description">
        Personalize the website. Classic and Visual
        previews keep dark backgrounds.
      </p>

      <form id="appearance-form">

        <div class="appearance-setting">

          <label class="appearance-label"
                 for="appearance-accent">
            Theme Accent Color
          </label>

          <p class="appearance-hint">
            Buttons, headings and highlights will change.
          </p>

          <div class="appearance-color-row">

            <input class="appearance-color-input"
                   id="appearance-accent"
                   type="color"
                   value="#ff80c8">

            <input class="appearance-hex-input"
                   id="appearance-accent-hex"
                   type="text"
                   maxlength="7"
                   spellcheck="false"
                   aria-label="Accent color hex"
                   value="#FF80C8">

          </div>

        </div>

        <div class="appearance-setting">

          <label class="appearance-label"
                 for="appearance-background">
            Page Background Color
          </label>

          <p class="appearance-hint">
            Change the background outside the video preview.
          </p>

          <div class="appearance-color-row">

            <input class="appearance-color-input"
                   id="appearance-background"
                   type="color"
                   value="#101018">

            <input class="appearance-hex-input"
                   id="appearance-background-hex"
                   type="text"
                   maxlength="7"
                   spellcheck="false"
                   aria-label="Page background hex"
                   value="#101018">

          </div>

        </div>

        <div class="appearance-setting">

          <label class="appearance-label"
                 for="appearance-image">
            Custom Background Image
          </label>

          <p class="appearance-hint">
            JPG, PNG, WebP, GIF or AVIF, up to 20 MB.
          </p>

          <input class="appearance-upload"
                 id="appearance-image"
                 type="file"
                 accept="image/jpeg,image/png,image/webp,image/gif,image/avif">

          <div class="appearance-image-preview"
               id="appearance-image-preview">
            No background image selected
          </div>

          <button type="button"
                  id="appearance-remove-image"
                  class="appearance-action appearance-action-secondary">
            Remove Background Image
          </button>

        </div>

        <div class="appearance-setting">

          <label class="appearance-label"
                 for="appearance-dim">
            Background Image Darkness
          </label>

          <p class="appearance-hint">
            Darken your background for readability.
          </p>

          <div class="appearance-dim-row">

            <input class="appearance-range"
                   id="appearance-dim"
                   type="range"
                   min="0"
                   max="85"
                   step="1"
                   value="25">

            <output class="appearance-dim-value"
                    id="appearance-dim-value"
                    for="appearance-dim">
              25%
            </output>

          </div>

        </div>

        <div class="appearance-actions">

          <button type="submit"
                  class="appearance-action appearance-action-primary"
                  id="appearance-save">
            Save Changes
          </button>

          <button type="button"
                  class="appearance-action appearance-action-secondary"
                  id="appearance-reset">
            Reset to Default
          </button>

          <button type="button"
                  class="appearance-action appearance-action-secondary"
                  id="appearance-cancel">
            Cancel
          </button>

        </div>

        <p class="appearance-preview-notice"
           role="status"
           id="appearance-notice">
          Changes are previewed live.
          Click Save Changes to keep them.
        </p>

      </form>
    </div>
  `;

  document.body.append(appearanceOverlay);

  const appearanceForm = $('appearance-form');
  const accentPicker = $('appearance-accent');
  const accentHex = $('appearance-accent-hex');

  const backgroundPicker = $('appearance-background');
  const backgroundHex = $('appearance-background-hex');

  const imagePicker = $('appearance-image');
  const imagePreview = $('appearance-image-preview');

  const dimSlider = $('appearance-dim');
  const dimValue = $('appearance-dim-value');

  const appearanceNotice = $('appearance-notice');
  const appearanceSave = $('appearance-save');

  const currentDraftImage = () =>
    removeBackgroundImage
      ? null
      : draftBackgroundURL || savedBackgroundURL;

  function refreshAppearanceImagePreview() {
    const url = currentDraftImage();

    imagePreview.style.backgroundImage =
      url ? `url("${url}")` : 'none';

    imagePreview.textContent = url
      ? ''
      : 'No background image selected';
  }

  function previewAppearance() {
    applyAppearance(
      draftAppearance,
      currentDraftImage()
    );

    dimValue.textContent = draftAppearance.dim + '%';
    refreshAppearanceImagePreview();
  }

  function clearDraftImage() {
    if (draftBackgroundURL) {
      URL.revokeObjectURL(draftBackgroundURL);
    }

    draftBackgroundURL = null;
    pendingImageFile = null;
    imagePicker.value = '';
  }

  function openAppearance() {
    if (appearanceSaving) return;

    draftAppearance = { ...savedAppearance };
    clearDraftImage();

    removeBackgroundImage = false;

    accentPicker.value = draftAppearance.accent;
    accentHex.value = draftAppearance.accent.toUpperCase();

    backgroundPicker.value = draftAppearance.background;

    backgroundHex.value =
      draftAppearance.background.toUpperCase();

    dimSlider.value = draftAppearance.dim;

    appearanceNotice.textContent =
      'Changes are previewed live. Click Save Changes to keep them.';

    previewAppearance();
    show(appearanceOverlay);

    appearanceOverlay.setAttribute(
      'aria-hidden',
      'false'
    );

    appearanceToggle.setAttribute(
      'aria-expanded',
      'true'
    );

    accentPicker.focus();
  }

  function closeAppearance(commit = false) {
    if (appearanceSaving) return;

    hide(appearanceOverlay);

    appearanceOverlay.setAttribute(
      'aria-hidden',
      'true'
    );

    appearanceToggle.setAttribute(
      'aria-expanded',
      'false'
    );

    if (!commit) {
      applyAppearance(
        savedAppearance,
        savedBackgroundURL
      );
    }

    clearDraftImage();
    removeBackgroundImage = false;

    appearanceToggle.focus();
  }

  function connectColor(picker, hex, property) {
    picker.addEventListener('input', () => {
      draftAppearance[property] = picker.value;
      hex.value = picker.value.toUpperCase();
      previewAppearance();
    });

    hex.addEventListener('input', () => {
      const color = hex.value.trim();

      if (!validHex(color)) return;

      draftAppearance[property] = color.toLowerCase();
      picker.value = color;

      previewAppearance();
    });

    hex.addEventListener('blur', () => {
      hex.value =
        draftAppearance[property].toUpperCase();
    });
  }

  connectColor(
    accentPicker,
    accentHex,
    'accent'
  );

  connectColor(
    backgroundPicker,
    backgroundHex,
    'background'
  );

  dimSlider.addEventListener('input', () => {
    draftAppearance.dim = Number(dimSlider.value);
    previewAppearance();
  });

  imagePicker.addEventListener('change', () => {
    const file = imagePicker.files[0];
    if (!file) return;

    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/avif'
    ];

    if (
      !allowed.includes(file.type) ||
      file.size > 20 * 1024 * 1024
    ) {
      imagePicker.value = '';

      appearanceNotice.textContent =
        'Choose JPG, PNG, WebP, GIF or AVIF, up to 20 MB.';

      return;
    }

    clearDraftImage();

    pendingImageFile = file;
    draftBackgroundURL = URL.createObjectURL(file);

    removeBackgroundImage = false;
    imageRevision++;

    previewAppearance();

    appearanceNotice.textContent =
      'New image previewed. Click Save Changes to keep it.';
  });

  $('appearance-remove-image').addEventListener(
    'click',
    () => {
      clearDraftImage();

      removeBackgroundImage = true;
      imageRevision++;

      previewAppearance();

      appearanceNotice.textContent =
        'Image will be removed when you save changes.';
    }
  );

  $('appearance-reset').addEventListener('click', () => {
    clearDraftImage();

    draftAppearance = { ...DEFAULT_APPEARANCE };
    removeBackgroundImage = true;
    imageRevision++;

    accentPicker.value = draftAppearance.accent;

    accentHex.value =
      draftAppearance.accent.toUpperCase();

    backgroundPicker.value = draftAppearance.background;

    backgroundHex.value =
      draftAppearance.background.toUpperCase();

    dimSlider.value = draftAppearance.dim;

    previewAppearance();

    appearanceNotice.textContent =
      'Defaults selected. Click Save Changes to confirm.';
  });

  appearanceForm.addEventListener('submit', async event => {
    event.preventDefault();

    if (appearanceSaving) return;

    const newImage = pendingImageFile;

    const deleteImage =
      removeBackgroundImage && !newImage;

    appearanceSaving = true;
    appearanceSave.disabled = true;

    appearanceNotice.textContent = 'Saving settings...';

    try {
      if (newImage) {
        await backgroundDatabase('write', newImage);
      } else if (deleteImage) {
        try {
          await backgroundDatabase('delete');
        } catch (error) {
          if (savedBackgroundURL) throw error;
        }
      }

      const nextURL = newImage
        ? draftBackgroundURL
        : deleteImage
          ? null
          : savedBackgroundURL;

      if (
        savedBackgroundURL &&
        savedBackgroundURL !== nextURL
      ) {
        URL.revokeObjectURL(savedBackgroundURL);
      }

      savedBackgroundURL = nextURL;

      if (newImage) {
        draftBackgroundURL = null;
      }

      savedAppearance = { ...draftAppearance };

      let stored = true;

      try {
        localStorage.setItem(
          APPEARANCE_KEY,
          JSON.stringify(savedAppearance)
        );
      } catch {
        stored = false;
      }

      applyAppearance(
        savedAppearance,
        savedBackgroundURL
      );

      appearanceSaving = false;
      appearanceSave.disabled = false;

      closeAppearance(true);

      if (!stored) {
        alert(
          'Appearance applied, but the browser blocked saving colors for the next visit.'
        );
      }
    } catch {
      appearanceSaving = false;
      appearanceSave.disabled = false;

      appearanceNotice.textContent =
        'Could not save the background image. Try another image or remove it.';
    }
  });

  appearanceToggle.addEventListener(
    'click',
    openAppearance
  );

  $('appearance-close').addEventListener(
    'click',
    () => closeAppearance()
  );

  $('appearance-cancel').addEventListener(
    'click',
    () => closeAppearance()
  );

  appearanceOverlay.addEventListener('click', event => {
    if (event.target === appearanceOverlay) {
      closeAppearance();
    }
  });

  document.addEventListener('keydown', event => {
    if (
      event.key === 'Escape' &&
      appearanceOverlay.classList.contains('open')
    ) {
      closeAppearance();
    }
  });

  const initialImageRevision = imageRevision;

  backgroundDatabase('read').then(file => {
    if (
      !file ||
      imageRevision !== initialImageRevision
    ) {
      return;
    }

    savedBackgroundURL = URL.createObjectURL(file);

    if (!appearanceOverlay.classList.contains('open')) {
      applyAppearance(
        savedAppearance,
        savedBackgroundURL
      );
    } else {
      refreshAppearanceImagePreview();
    }
  }).catch(() => {});

  // ==========================================
  // GROUP PRESETS — LOCAL DATABASE
  // ==========================================

  const groupsList = $('groups-list');
  const groupsEmpty = $('groups-empty');
  const groupsStatus = $('groups-status');

  const groupEditorStatus = $('group-editor-status');
  const groupLoadStatus = $('group-load-status');

  const groupEditorName = $('group-editor-name');
  const groupEditorMembers = $('group-editor-members');
  const groupEditorEmpty = $('group-editor-empty');

  const groupMemberForm = $('group-member-form');
  const groupMemberName = $('group-member-name');
  const groupMemberColor = $('group-member-color');
  const groupMemberImage = $('group-member-image');

  const groupMemberShortcut = $('group-member-shortcut');

  const groupMemberRemovePhoto =
    $('group-member-remove-photo');

  const groupMemberSubmit = $('group-member-submit');
  const groupCardTemplate = $('group-card-template');

  const GROUP_DB_NAME = 'lds-group-presets-v1';
  const GROUP_KEYS = KEYS;
  const MAX_GROUP_MEMBERS = 20;
  const MAX_GROUP_PHOTO_SIZE = 12 * 1024 * 1024;

  let savedGroups = [];
  let editingGroupId = null;
  let draftGroupMembers = [];

  let editingGroupMemberIndex = -1;
  let pendingGroupShortcut = '';

  let selectedLoadGroup = null;
  let groupBusy = false;

  let groupListImageURLs = [];
  let groupEditorImageURLs = [];

  function groupMessage(element, message) {
    if (element) {
      element.textContent = message || '';
    }
  }

  function releaseGroupImages(urls) {
    urls.forEach(url => {
      URL.revokeObjectURL(url);
    });

    urls.length = 0;
  }

  function groupPhotoURL(photo, list) {
    if (!(photo instanceof Blob)) return '';

    const url = URL.createObjectURL(photo);
    list.push(url);

    return url;
  }

  function groupDatabase(action, data) {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(
          new Error('Browser storage is unavailable.')
        );
        return;
      }

      const request = indexedDB.open(GROUP_DB_NAME, 1);

      request.onupgradeneeded = () => {
        if (
          !request.result.objectStoreNames.contains('groups')
        ) {
          request.result.createObjectStore(
            'groups',
            { keyPath: 'id' }
          );
        }
      };

      request.onerror = () => {
        reject(
          request.error ||
          new Error('Could not open group storage.')
        );
      };

      request.onsuccess = () => {
        const db = request.result;

        const transaction = db.transaction(
          'groups',
          action === 'list' ? 'readonly' : 'readwrite'
        );

        const store = transaction.objectStore('groups');

        let result;
        let operation;

        if (action === 'list') {
          operation = store.getAll();
        }

        if (action === 'save') {
          operation = store.put(data);
        }

        if (action === 'delete') {
          operation = store.delete(data);
        }

        operation.onsuccess = () => {
          result = operation.result;
        };

        transaction.oncomplete = () => {
          db.close();
          resolve(result);
        };

        transaction.onerror = () => {
          db.close();

          reject(
            transaction.error ||
            new Error('Storage failed.')
          );
        };

        transaction.onabort = () => {
          db.close();
          reject(new Error('Storage canceled.'));
        };
      };
    });
  }

  function groupId() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === 'function'
    ) {
      return window.crypto.randomUUID();
    }

    return (
      'group-' +
      Date.now() +
      '-' +
      Math.random().toString(36).slice(2)
    );
  }

  async function photoBlobFromMember(member) {
    if (!member.photoURL) return null;

    const response = await fetch(member.photoURL);

    if (!response.ok) {
      throw new Error(
        'Could not read photo of ' + member.name + '.'
      );
    }

    return await response.blob();
  }

  function sortedGroups() {
    return [...savedGroups].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  // ==========================================
  // GROUP PHOTO THUMBNAILS
  // ==========================================

  function makeGroupPicture(person, container, urls) {
    const cssColor = validHex(person.color)
      ? person.color
      : '#ff80c8';

    let avatar;

    if (person.photo instanceof Blob) {
      avatar = document.createElement('img');

      avatar.src = groupPhotoURL(person.photo, urls);
      avatar.alt = '';
    } else {
      avatar = document.createElement('span');
      avatar.textContent =
        (person.name || '?').charAt(0).toUpperCase();
    }

    avatar.style.setProperty(
      '--member-color',
      cssColor
    );

    container.appendChild(avatar);
  }

  // ==========================================
  // SAVED GROUP LIST
  // ==========================================

  function renderGroupList() {
    releaseGroupImages(groupListImageURLs);

    groupsList.replaceChildren();
    groupsEmpty.hidden = savedGroups.length > 0;

    sortedGroups().forEach(group => {
      const card = groupCardTemplate.content
        .firstElementChild.cloneNode(true);

      card.querySelector(
        '.group-card-name'
      ).textContent = group.name;

      card.querySelector(
        '.group-card-count'
      ).textContent =
        group.members.length +
        (
          group.members.length === 1
            ? ' member'
            : ' members'
        );

      const faces = card.querySelector(
        '.group-card-photos'
      );

      group.members.slice(0, 4).forEach(person => {
        makeGroupPicture(
          person,
          faces,
          groupListImageURLs
        );
      });

      card.querySelector(
        '.group-card-load'
      ).addEventListener('click', () => {
        openGroupLoad(group);
      });

      card.querySelector(
        '.group-card-edit'
      ).addEventListener('click', () => {
        openGroupEditor(group);
      });

      card.querySelector(
        '.group-card-delete'
      ).addEventListener('click', () => {
        deleteGroup(group);
      });

      groupsList.appendChild(card);
    });
  }

  async function reloadGroupList() {
    savedGroups = await groupDatabase('list') || [];
    renderGroupList();
  }

  // ==========================================
  // GROUP MODAL HELPERS
  // ==========================================

  function showGroupModal(element) {
    show(element);
    element.setAttribute('aria-hidden', 'false');
  }

  function hideGroupModal(element) {
    hide(element);
    element.setAttribute('aria-hidden', 'true');
  }

  function closeGroupWindows() {
    if (groupBusy) return;

    hideGroupModal(loadModal);
    hideGroupModal(editorModal);
    hideGroupModal(groupsModal);

    groupMessage(groupsStatus, '');
    groupMessage(groupEditorStatus, '');
    groupMessage(groupLoadStatus, '');

    releaseGroupImages(groupEditorImageURLs);
    releaseGroupImages(groupListImageURLs);

    groupsList.replaceChildren();

    editingGroupId = null;
    draftGroupMembers = [];
    selectedLoadGroup = null;
  }

  groupButton.addEventListener('click', async () => {
    if (groupBusy || isLocked()) return;

    showGroupModal(groupsModal);

    groupMessage(
      groupsStatus,
      'Loading saved groups...'
    );

    try {
      await reloadGroupList();

      groupMessage(groupsStatus, '');
    } catch (error) {
      groupMessage(
        groupsStatus,
        'Unable to access saved groups in this browser. ' +
        error.message
      );
    }
  });

  $('close-groups-modal').addEventListener(
    'click',
    closeGroupWindows
  );

  function closeGroupEditor() {
    if (groupBusy) return;

    hideGroupModal(editorModal);
    releaseGroupImages(groupEditorImageURLs);

    showGroupModal(groupsModal);
  }

  $('close-group-editor').addEventListener(
    'click',
    closeGroupEditor
  );

  $('group-editor-cancel').addEventListener(
    'click',
    closeGroupEditor
  );

  $('close-group-load').addEventListener(
    'click',
    () => hideGroupModal(loadModal)
  );

  $('group-load-cancel').addEventListener(
    'click',
    () => hideGroupModal(loadModal)
  );

  [groupsModal, editorModal, loadModal].forEach(element => {
    element.addEventListener('click', event => {
      if (
        event.target !== element ||
        groupBusy
      ) {
        return;
      }

      if (element === editorModal) {
        closeGroupEditor();
      } else if (element === loadModal) {
        hideGroupModal(loadModal);
      } else {
        closeGroupWindows();
      }
    });
  });

  document.addEventListener('keydown', event => {
    if (
      event.key !== 'Escape' ||
      !groupDialogOpen() ||
      groupBusy
    ) {
      return;
    }

    event.stopImmediatePropagation();

    if (loadModal.classList.contains('open')) {
      hideGroupModal(loadModal);
    } else if (editorModal.classList.contains('open')) {
      closeGroupEditor();
    } else {
      closeGroupWindows();
    }
  }, true);

  // ==========================================
  // SAVE CURRENT MEMBERS AS GROUP
  // ==========================================

  $('save-current-group-form').addEventListener(
    'submit',
    async event => {
      event.preventDefault();

      if (groupBusy || isLocked()) return;

      const name = $('save-current-group-name')
        .value.trim();

      if (!name) return;

      if (!members.length) {
        groupMessage(
          groupsStatus,
          'Add at least one member before saving the group.'
        );
        return;
      }

      const duplicate = savedGroups.some(group =>
        group.name.toLowerCase() === name.toLowerCase()
      );

      if (duplicate) {
        groupMessage(
          groupsStatus,
          'A group with this name already exists. Edit that preset or choose another name.'
        );
        return;
      }

      groupBusy = true;

      groupMessage(
        groupsStatus,
        'Saving group and photos...'
      );

      try {
        const groupMembers = await Promise.all(
          members.map(async member => ({
            name: member.name,
            color: member.color,
            shortcut: member.shortcut,
            photo: await photoBlobFromMember(member),
            visualPosition: positionCopy(
              member.visualPosition
            )
          }))
        );

        await groupDatabase('save', {
          id: groupId(),
          name,
          members: groupMembers,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });

        await reloadGroupList();

        $('save-current-group-form').reset();

        groupMessage(
          groupsStatus,
          'Group saved! It will be available in this browser after you return.'
        );
      } catch (error) {
        groupMessage(
          groupsStatus,
          'Could not save group: ' + error.message
        );
      } finally {
        groupBusy = false;
      }
    }
  );

  // ==========================================
  // CREATE AND EDIT GROUP MEMBERS
  // ==========================================

  function clearGroupMemberFields() {
    editingGroupMemberIndex = -1;
    pendingGroupShortcut = '';

    groupMemberForm.reset();
    groupMemberSubmit.textContent = 'Add Member';

    groupMessage(groupEditorStatus, '');
  }

  function renderGroupEditorMembers() {
    releaseGroupImages(groupEditorImageURLs);

    groupEditorMembers.replaceChildren();

    groupEditorEmpty.hidden =
      draftGroupMembers.length > 0;

    draftGroupMembers.forEach((person, index) => {
      const card = document.createElement('div');

      card.className = 'group-editor-member';
      card.style.setProperty(
        '--member-color',
        person.color
      );

      makeGroupPicture(
        person,
        card,
        groupEditorImageURLs
      );

      const details = document.createElement('div');
      details.className = 'group-editor-details';

      const name = document.createElement('strong');
      name.textContent = person.name;

      const key = document.createElement('small');
      key.textContent = 'Key: ' + person.shortcut;

      details.append(name, key);

      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'groups-secondary';
      edit.textContent = 'Edit';

      edit.addEventListener('click', () => {
        editingGroupMemberIndex = index;
        pendingGroupShortcut = person.shortcut;

        groupMemberName.value = person.name;
        groupMemberColor.value = person.color;
        groupMemberShortcut.value = person.shortcut;

        groupMemberImage.value = '';
        groupMemberRemovePhoto.checked = false;

        groupMemberSubmit.textContent = 'Save Member';
        groupMemberName.focus();
      });

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'groups-secondary';
      remove.textContent = 'Remove';

      remove.addEventListener('click', () => {
        draftGroupMembers.splice(index, 1);

        clearGroupMemberFields();
        renderGroupEditorMembers();
      });

      card.append(details, edit, remove);
      groupEditorMembers.appendChild(card);
    });
  }

  function openGroupEditor(group = null) {
    if (groupBusy || isLocked()) return;

    editingGroupId = group ? group.id : null;

    draftGroupMembers = group
      ? group.members.map(person => ({
          name: person.name,
          color: person.color,
          shortcut: person.shortcut,
          photo: person.photo instanceof Blob
            ? person.photo
            : null,
          visualPosition: positionCopy(
            person.visualPosition
          )
        }))
      : [];

    $('group-editor-title').textContent = group
      ? 'Edit Group'
      : 'Create Group';

    groupEditorName.value = group
      ? group.name
      : '';

    clearGroupMemberFields();
    renderGroupEditorMembers();

    hideGroupModal(groupsModal);
    showGroupModal(editorModal);

    groupEditorName.focus();
  }

  $('create-group-button').addEventListener(
    'click',
    () => openGroupEditor()
  );

  groupMemberShortcut.addEventListener(
    'keydown',
    event => {
      event.preventDefault();
      event.stopPropagation();

      if (
        event.ctrlKey ||
        event.altKey ||
        event.metaKey
      ) {
        return;
      }

      const key = event.key.toUpperCase();

      if (!/^[A-Z0-9]$/.test(key)) {
        groupMessage(
          groupEditorStatus,
          'Choose one key from A-Z or 0-9.'
        );
        return;
      }

      const duplicate = draftGroupMembers.some(
        (person, index) =>
          index !== editingGroupMemberIndex &&
          person.shortcut === key
      );

      if (duplicate) {
        groupMessage(
          groupEditorStatus,
          'That shortcut is already used in this group.'
        );
        return;
      }

      pendingGroupShortcut = key;
      groupMemberShortcut.value = key;

      groupMessage(groupEditorStatus, '');
    }
  );

  groupMemberForm.addEventListener('submit', event => {
    event.preventDefault();

    if (groupBusy) return;

    const name = groupMemberName.value.trim();
    if (!name) return;

    if (!pendingGroupShortcut) {
      groupMessage(
        groupEditorStatus,
        'Choose a keyboard shortcut first.'
      );
      return;
    }

    if (
      editingGroupMemberIndex < 0 &&
      draftGroupMembers.length >= MAX_GROUP_MEMBERS
    ) {
      groupMessage(
        groupEditorStatus,
        'Each group can have at most 20 members.'
      );
      return;
    }

    const duplicate = draftGroupMembers.some(
      (person, index) =>
        index !== editingGroupMemberIndex &&
        person.shortcut === pendingGroupShortcut
    );

    if (duplicate) {
      groupMessage(
        groupEditorStatus,
        'This keyboard shortcut is already taken.'
      );
      return;
    }

    const file = groupMemberImage.files[0];

    if (
      file &&
      (
        !file.type.startsWith('image/') ||
        file.size > MAX_GROUP_PHOTO_SIZE
      )
    ) {
      groupMessage(
        groupEditorStatus,
        'Choose an image under 12 MB.'
      );
      return;
    }

    const previous = editingGroupMemberIndex >= 0
      ? draftGroupMembers[editingGroupMemberIndex]
      : null;

    const person = {
      name,
      color: groupMemberColor.value,
      shortcut: pendingGroupShortcut,

      photo: file || (
        groupMemberRemovePhoto.checked
          ? null
          : previous?.photo || null
      ),

      visualPosition: previous
        ? positionCopy(previous.visualPosition)
        : null
    };

    if (previous) {
      draftGroupMembers[editingGroupMemberIndex] =
        person;
    } else {
      draftGroupMembers.push(person);
    }

    clearGroupMemberFields();
    renderGroupEditorMembers();
  });

  $('group-member-cancel').addEventListener(
    'click',
    clearGroupMemberFields
  );

  // ==========================================
  // SAVE CREATED OR EDITED GROUP
  // ==========================================

  $('group-editor-form').addEventListener(
    'submit',
    async event => {
      event.preventDefault();

      if (groupBusy) return;

      const name = groupEditorName.value.trim();
      if (!name) return;

      if (!draftGroupMembers.length) {
        groupMessage(
          groupEditorStatus,
          'Add at least one member to your group.'
        );
        return;
      }

      const duplicate = savedGroups.some(group =>
        group.id !== editingGroupId &&
        group.name.toLowerCase() === name.toLowerCase()
      );

      if (duplicate) {
        groupMessage(
          groupEditorStatus,
          'Another saved group already has that name.'
        );
        return;
      }

      groupBusy = true;

      groupMessage(
        groupEditorStatus,
        'Saving group...'
      );

      try {
        const existing = savedGroups.find(group =>
          group.id === editingGroupId
        );

        await groupDatabase('save', {
          id: editingGroupId || groupId(),
          name,

          members: draftGroupMembers.map(person => ({
            name: person.name,
            color: person.color,
            shortcut: person.shortcut,
            photo: person.photo,
            visualPosition: positionCopy(
              person.visualPosition
            )
          })),

          createdAt: existing?.createdAt || Date.now(),
          updatedAt: Date.now()
        });

        await reloadGroupList();

        hideGroupModal(editorModal);
        releaseGroupImages(groupEditorImageURLs);

        showGroupModal(groupsModal);

        groupMessage(
          groupsStatus,
          'Group saved successfully!'
        );
      } catch (error) {
        groupMessage(
          groupEditorStatus,
          'Could not save group: ' + error.message
        );
      } finally {
        groupBusy = false;
      }
    }
  );

  // ==========================================
  // DELETE A SAVED GROUP
  // ==========================================

  async function deleteGroup(group) {
    if (groupBusy || isLocked()) return;

    const confirmed = confirm(
      `Permanently delete group "${group.name}" from this browser?`
    );

    if (!confirmed) return;

    groupBusy = true;

    try {
      await groupDatabase('delete', group.id);
      await reloadGroupList();

      groupMessage(groupsStatus, 'Group deleted.');
    } catch (error) {
      groupMessage(
        groupsStatus,
        'Could not delete group: ' + error.message
      );
    } finally {
      groupBusy = false;
    }
  }

  // ==========================================
  // LOAD GROUP — REPLACE OR ADD
  // ==========================================

  function openGroupLoad(group) {
    if (groupBusy || isLocked()) return;

    selectedLoadGroup = group;

    $('group-load-name').textContent = group.name;

    groupMessage(groupLoadStatus, '');
    showGroupModal(loadModal);
  }

  function shortcutForGroup(preferred, used) {
    if (
      /^[A-Z0-9]$/.test(preferred) &&
      !used.has(preferred)
    ) {
      used.add(preferred);
      return preferred;
    }

    const spare = [...GROUP_KEYS].find(
      key => !used.has(key)
    );

    if (spare) used.add(spare);

    return spare || null;
  }

  async function loadSelectedGroup(mode) {
    if (
      groupBusy ||
      isLocked() ||
      !selectedLoadGroup
    ) {
      return;
    }

    const source = selectedLoadGroup;

    const existingCount = mode === 'add'
      ? members.length
      : 0;

    if (
      existingCount + source.members.length >
      MAX_GROUP_MEMBERS
    ) {
      groupMessage(
        groupLoadStatus,
        'You can have a maximum of 20 members in the project. Remove some members or choose Replace.'
      );
      return;
    }

    if (
      recordedLines.length > 0 &&
      !confirm(
        'Loading this group will clear the current recording results. Continue?'
      )
    ) {
      return;
    }

    const used = new Set(
      mode === 'add'
        ? members.map(member => member.shortcut)
        : []
    );

    const assigned = source.members.map(person =>
      shortcutForGroup(person.shortcut, used)
    );

    if (assigned.some(key => !key)) {
      groupMessage(
        groupLoadStatus,
        'Not enough free keyboard shortcuts to load this group.'
      );
      return;
    }

    groupBusy = true;

    groupMessage(
      groupLoadStatus,
      'Loading members and photos...'
    );

    const newPhotoURLs = [];

    try {
      const newMembers = source.members.map(
        (person, index) => {
          let photoURL = null;

          if (person.photo instanceof Blob) {
            photoURL = URL.createObjectURL(person.photo);
            newPhotoURLs.push(photoURL);
          }

          return newMember({
            name: person.name,
            color: person.color,
            shortcut: assigned[index],
            photoURL,

            visualPosition: mode === 'replace'
              ? positionCopy(person.visualPosition)
              : null
          });
        }
      );

      audio.pause();
      audio.currentTime = 0;

      resetRecording();

      if (mode === 'replace') {
        members.forEach(member => {
          if (member.photoURL) {
            URL.revokeObjectURL(member.photoURL);
          }
        });

        members.splice(
          0,
          members.length,
          ...newMembers
        );
      } else {
        members.push(...newMembers);
      }

      renderMembers();

      progress();
      playLabel();
      setButtons();
      setStatus();

      groupBusy = false;
      closeGroupWindows();

      requestAnimationFrame(layoutVisual);
    } catch (error) {
      newPhotoURLs.forEach(url => {
        URL.revokeObjectURL(url);
      });

      groupMessage(
        groupLoadStatus,
        'Could not load group: ' + error.message
      );

      groupBusy = false;
    }
  }

  $('group-load-replace').addEventListener(
    'click',
    () => loadSelectedGroup('replace')
  );

  $('group-load-add').addEventListener(
    'click',
    () => loadSelectedGroup('add')
  );

  // Restore the saved group library.
  groupDatabase('list').then(groups => {
    savedGroups = groups || [];
  }).catch(() => {
    // The generator remains usable if storage is blocked.
  });

  // ==========================================
  // KEYBOARD CONTROLS
  // ==========================================

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      hide(memberModal);
      closeEdit();
    }

    if (
      event.repeat ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey ||
      studio.hidden ||
      memberModal.classList.contains('open') ||
      editOverlay.classList.contains('open') ||
      appearanceOverlay.classList.contains('open') ||
      groupDialogOpen()
    ) {
      return;
    }

    if (
      event.target instanceof Element &&
      (
        event.target.closest('input,textarea,select') ||
        event.target.isContentEditable
      )
    ) {
      return;
    }

    if (
      event.code === 'Backquote' ||
      event.key === '~'
    ) {
      event.preventDefault();
      restartAll();
      return;
    }

    if (recording !== 'recording') return;

    const key = event.key.toUpperCase();

    if (!/^[A-Z0-9]$/.test(key)) return;

    const member = members.find(person =>
      person.shortcut === key
    );

    if (member) {
      event.preventDefault();
      toggleLine(member);
    }
  });

  // ==========================================
  // CLEANUP
  // ==========================================

  window.addEventListener('pagehide', () => {
    stopTimer();

    if (musicURL) {
      URL.revokeObjectURL(musicURL);
    }

    members.forEach(member => {
      if (member.photoURL) {
        URL.revokeObjectURL(member.photoURL);
      }
    });

    clearDraftImage();

    if (savedBackgroundURL) {
      URL.revokeObjectURL(savedBackgroundURL);
    }

    releaseGroupImages(groupListImageURLs);
    releaseGroupImages(groupEditorImageURLs);
  });

  // ==========================================
  // INITIAL STATE
  // ==========================================

  renderMembers();
  playLabel();
  progress();
  setButtons();
  setStatus();

});
