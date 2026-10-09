
document.addEventListener("DOMContentLoaded", function () {

  // ==========================================
  // 1. ELEMENTS AND DATA
  // ==========================================

  const $ = id => document.getElementById(id);

  const welcomeScreen = $("welcome-screen");
  const studioScreen = $("studio-screen");
  const modeForm = $("mode-form");

  const modal = $("member-modal");
  const openButton = $("open-member-modal");
  const closeButton = $("close-member-modal");
  const memberForm = $("member-form");
  const memberList = $("member-list-items");

  const nameInput = $("member-name");
  const imageInput = $("member-image");
  const colorInput = $("member-color");
  const shortcutInput = $("member-shortcut");
  const shortcutError = $("shortcut-error");

  const classicMembers = $("classic-members");
  const classicLayout = $("classic-layout");

  const musicFile = $("music-file");
  const musicAudio = $("music-audio");
  const musicTrackName = $("music-track-name");
  const musicSeek = $("music-seek");
  const musicCurrentTime = $("music-current-time");
  const musicDuration = $("music-duration");
  const musicToggle = $("music-toggle");
  const musicRestart = $("music-restart");
  const musicVolume = $("music-volume");
  const musicError = $("music-error");

  const members = [];
  const recordedLines = [];

  let selectedShortcut = "";
  let currentMusicURL = null;
  let musicIsReady = false;
  let recordingState = "idle";
  let animationFrameId = null;

  musicRestart.textContent = "↺ Restart All (~)";


  // ==========================================
  // 2. WELCOME SCREEN
  // ==========================================

  modeForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const choice = modeForm.querySelector(
      'input[name="visual-mode"]:checked'
    );

    if (!choice) return;

    studioScreen.dataset.visualMode = choice.value;
    welcomeScreen.hidden = true;
    studioScreen.hidden = false;

    window.scrollTo(0, 0);
  });


  // ==========================================
  // 3. ADD MEMBER
  // ==========================================

  function showError(message) {
    shortcutError.textContent = message;
    shortcutError.hidden = false;
  }

  function clearError() {
    shortcutError.textContent = "";
    shortcutError.hidden = true;
  }

  function closeModal() {
    modal.classList.remove("open");
    clearError();
  }

  openButton.addEventListener("click", function () {
    if (isMemberEditingLocked()) return;
    modal.classList.add("open");
    nameInput.focus();
  });

  closeButton.addEventListener("click", closeModal);

  modal.addEventListener("click", function (event) {
    if (event.target === modal) closeModal();
  });

  function validShortcut(key, currentMember = null) {
    if (!/^[A-Z0-9]$/.test(key)) {
      return "Choose a letter (A-Z) or number (0-9).";
    }

    if (members.some(member =>
      member !== currentMember &&
      member.shortcut === key
    )) {
      return "This key is already assigned.";
    }

    return "";
  }

  shortcutInput.addEventListener("keydown", function (event) {
    event.preventDefault();
    event.stopPropagation();

    const key = event.key.toUpperCase();

    if (key === "ESCAPE") {
      closeModal();
      return;
    }

    if (event.ctrlKey || event.altKey || event.metaKey) {
      showError("Choose a key without Ctrl, Alt or Command.");
      return;
    }

    const error = validShortcut(key);

    if (error) {
      showError(error);
      return;
    }

    selectedShortcut = key;
    shortcutInput.value = key;
    clearError();
  });


  // ==========================================
  // 4. CLASSIC MEMBER ROWS
  // ==========================================

  function createClassicPhoto(member) {
    if (member.photoURL) {
      const image = document.createElement("img");
      image.className = "classic-photo";
      image.src = member.photoURL;
      image.alt = member.name;
      return image;
    }

    const letter = document.createElement("div");

    letter.className = "classic-photo";
    letter.textContent = member.name.charAt(0).toUpperCase();
    letter.style.cssText =
      "display:flex;align-items:center;justify-content:center;" +
      "font-weight:bold;font-size:20px";

    letter.style.color = member.color;

    return letter;
  }

  function createClassicRow(member) {
    const row = document.createElement("div");

    row.className = "classic-member";
    row.style.setProperty("--member-color", member.color);

    const crown = document.createElement("span");
    crown.className = "classic-crown";
    crown.textContent = "♕";
    crown.setAttribute("aria-hidden", "true");

    const photo = createClassicPhoto(member);

    const info = document.createElement("div");
    info.className = "classic-info";

    const top = document.createElement("div");
    top.className = "classic-info-top";

    const name = document.createElement("span");
    name.className = "classic-name";
    name.textContent = member.name;

    const seconds = document.createElement("span");
    seconds.className = "classic-seconds";
    seconds.textContent = "0.0s";

    top.append(name, seconds);

    const progress = document.createElement("div");
    progress.className = "classic-progress";

    const fill = document.createElement("div");
    fill.className = "classic-progress-fill";
    fill.style.width = "0%";

    progress.appendChild(fill);

    const percentage = document.createElement("span");
    percentage.className = "classic-percentage";
    percentage.textContent = "0%";

    info.append(top, progress, percentage);
    row.append(crown, photo, info);

    member.classicUI = {
      row,
      photo,
      progress,
      seconds,
      fill,
      percentage
    };

    return row;
  }

  function renderClassicMembers() {
    if (!classicMembers) return;

    const fragment = document.createDocumentFragment();

    members.forEach(member => {
      fragment.appendChild(createClassicRow(member));
    });

    classicMembers.replaceChildren(fragment);
  }


  // ==========================================
  // 5. ANIMATED CLASSIC RANKING
  // ==========================================

  function sortClassicRanking() {
    if (!classicMembers || members.length < 2) return;

    const ranking = members.slice().sort(function (a, b) {
      const difference = b.totalSeconds - a.totalSeconds;

      return Math.abs(difference) < 0.005
        ? members.indexOf(a) - members.indexOf(b)
        : difference;
    });

    const currentRows = Array.from(classicMembers.children);

    if (ranking.every((member, i) =>
      currentRows[i] === member.classicUI.row
    )) {
      return;
    }

    const before = new Map();

    currentRows.forEach(function (row) {
      if (typeof row.getAnimations === "function") {
        row.getAnimations().forEach(animation => {
          if (animation.id === "rank-move") {
            animation.cancel();
          }
        });
      }

      before.set(row, row.getBoundingClientRect().top);
    });

    ranking.forEach(member => {
      classicMembers.appendChild(member.classicUI.row);
    });

    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    ranking.forEach(function (member) {
      const row = member.classicUI.row;

      const distance =
        before.get(row) -
        row.getBoundingClientRect().top;

      if (
        Math.abs(distance) < 1 ||
        typeof row.animate !== "function"
      ) {
        return;
      }

      const animation = row.animate(
        [
          { transform: `translateY(${distance}px)` },
          { transform: "translateY(0)" }
        ],
        {
          duration: 460,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)"
        }
      );

      animation.id = "rank-move";
    });
  }

  function updateClassicValues() {
    members.forEach(function (member) {
      const ui = member.classicUI;
      if (!ui) return;

      ui.seconds.textContent =
        member.totalSeconds.toFixed(1) + "s";

      ui.percentage.textContent =
        member.percentage === 0
          ? "0%"
          : member.percentage.toFixed(1) + "%";

      ui.fill.style.width =
        Math.max(0, Math.min(100, member.percentage)) + "%";

      const singing =
        recordingState === "recording" &&
        member.activeLine !== null &&
        !musicAudio.paused;

      ui.photo.style.boxShadow = singing
        ? `0 0 8px ${member.color}, 0 0 17px ${member.color}`
        : "";

      ui.progress.style.boxShadow = singing
        ? `0 0 9px ${member.color}`
        : "";
    });

    sortClassicRanking();
  }

  function updateWinnerCrown() {
    const winner = recordingState === "finished"
      ? members.reduce((best, member) => {
          if (
            member.totalSeconds > 0 &&
            (!best || member.totalSeconds > best.totalSeconds)
          ) {
            return member;
          }
          return best;
        }, null)
      : null;

    if (classicLayout) {
      classicLayout.classList.toggle(
        "finished",
        recordingState === "finished"
      );
    }

    members.forEach(member => {
      if (member.classicUI) {
        member.classicUI.row.classList.toggle(
          "winner",
          member === winner
        );
      }
    });
  }


  // ==========================================
  // 6. CLICKABLE MEMBER CARDS
  // ==========================================

  function isMemberEditingLocked() {
    return (
      recordingState === "recording" ||
      recordingState === "awaitingFinish"
    );
  }

  function renderMemberCards() {
    const fragment = document.createDocumentFragment();

    members.forEach(function (member) {
      const card = document.createElement("div");

      card.className = "member-card";
      card.style.setProperty("--member-color", member.color);
      card.tabIndex = 0;
      card.setAttribute("role", "button");

      card.setAttribute(
        "aria-label",
        "Edit member " + member.name
      );

      if (member.photoURL) {
        const image = document.createElement("img");
        image.src = member.photoURL;
        image.alt = member.name;
        card.appendChild(image);
      }

      const title = document.createElement("p");
      title.textContent = member.name;

      const badge = document.createElement("span");
      badge.className = "member-shortcut";
      badge.textContent = "Key: " + member.shortcut;

      const hint = document.createElement("div");
      hint.className = "member-card-edit-hint";
      hint.textContent = "Click to edit ✎";

      card.append(title, badge, hint);

      card.addEventListener("click", () => openSettings(member));

      card.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openSettings(member);
        }
      });

      fragment.appendChild(card);
    });

    memberList.replaceChildren(fragment);
  }


  // ==========================================
  // 7. MEMBER SETTINGS STYLES
  // ==========================================

  const settingsStyles = document.createElement("style");

  settingsStyles.textContent = `
    .member-card[role="button"] {
      cursor:pointer;
      transition:transform .2s ease,border-color .2s ease;
      border:1px solid transparent;
    }
    .member-card[role="button"]:hover {
      transform:translateY(-3px);
      border-color:var(--member-color);
    }
    .member-card[role="button"]:focus-visible {
      outline:2px solid var(--member-color);
      outline-offset:3px;
    }
    .member-card-edit-hint {
      font-size:11px;
      color:#aaa5ba;
      margin-top:10px;
    }
    .edit-member-form {
      display:grid;
      gap:10px;
    }
    .edit-member-form label {
      font-size:13px;
      font-weight:bold;
      color:#e8e3ee;
      margin-top:4px;
    }
    .edit-member-form input[type="text"],
    .edit-member-form input[type="file"] {
      width:100%;
      min-width:0;
      background:#292938;
      border:1px solid #454555;
      border-radius:8px;
      padding:11px;
      color:#fff;
      font:inherit;
    }
    .edit-member-form input[type="color"] {
      width:60px;
      height:40px;
      cursor:pointer;
      border:1px solid #454555;
      border-radius:7px;
      background:transparent;
    }
    .edit-member-form .edit-shortcut {
      text-align:center;
      cursor:pointer;
      font-weight:bold;
    }
    .edit-member-form .photo-preview {
      width:64px;
      height:64px;
      display:flex;
      align-items:center;
      justify-content:center;
      overflow:hidden;
      border:2px solid var(--member-color);
      border-radius:10px;
      color:var(--member-color);
      font-size:25px;
      font-weight:bold;
    }
    .edit-member-form .photo-preview img {
      width:100%;
      height:100%;
      object-fit:cover;
    }
    .edit-member-form .small-hint {
      font-size:12px;
      color:#aaa5ba;
      margin:0;
    }
    .edit-member-form .edit-actions {
      display:flex;
      gap:9px;
      flex-wrap:wrap;
      margin-top:12px;
    }
    .edit-member-form .delete-member-button {
      background:#59313d;
      color:#ffe4ea;
    }
    .edit-member-form .cancel-member-button {
      background:#383443;
      color:#fff;
    }
    .edit-member-form .edit-error {
      font-size:13px;
      color:#ff9b9b;
      margin:0;
    }
    #edit-member-title {
      color:var(--accent);
    }
  `;

  document.head.appendChild(settingsStyles);


  // ==========================================
  // 8. MEMBER SETTINGS MODAL
  // ==========================================

  const settingsModal = document.createElement("div");

  settingsModal.className = "modal-overlay";
  settingsModal.id = "member-settings-modal";

  settingsModal.innerHTML = `
    <div class="modal-content" role="dialog"
         aria-modal="true" aria-labelledby="edit-member-title">

      <button type="button" class="close-modal"
              id="close-edit-member" aria-label="Close">×</button>

      <h2 id="edit-member-title">Edit Member</h2>

      <form id="edit-member-form" class="edit-member-form">

        <div id="edit-photo-preview" class="photo-preview"></div>

        <label for="edit-member-name">Member Name</label>
        <input id="edit-member-name" type="text" maxlength="30" required>

        <label for="edit-member-color">Member Color</label>
        <input id="edit-member-color" type="color">

        <label for="edit-member-image">Change Photo</label>
        <input id="edit-member-image" type="file" accept="image/*">

        <p class="small-hint">Leave empty to keep the current photo.</p>

        <label style="display:flex;align-items:center;gap:9px;font-weight:normal">
          <input type="checkbox" id="edit-remove-photo">
          Remove current photo
        </label>

        <label for="edit-member-shortcut">Keyboard Shortcut</label>
        <input id="edit-member-shortcut" class="edit-shortcut"
               type="text" readonly required
               placeholder="Click and press a key">

        <p class="edit-error" id="edit-member-error"
           role="alert" hidden></p>

        <div class="edit-actions">
          <button type="submit">Save Changes</button>
          <button type="button" id="delete-member"
                  class="delete-member-button">Remove Member</button>
          <button type="button" id="cancel-edit-member"
                  class="cancel-member-button">Cancel</button>
        </div>

      </form>
    </div>
  `;

  studioScreen.appendChild(settingsModal);

  const editForm = $("edit-member-form");
  const editName = $("edit-member-name");
  const editColor = $("edit-member-color");
  const editImage = $("edit-member-image");
  const editShortcut = $("edit-member-shortcut");
  const editRemovePhoto = $("edit-remove-photo");
  const editPhotoPreview = $("edit-photo-preview");
  const editError = $("edit-member-error");
  const deleteButton = $("delete-member");

  let editingMember = null;
  let pendingShortcut = "";

  function showEditError(message) {
    editError.textContent = message;
    editError.hidden = false;
  }

  function clearEditError() {
    editError.textContent = "";
    editError.hidden = true;
  }

  function closeSettings() {
    settingsModal.classList.remove("open");
    editingMember = null;
    clearEditError();
  }

  function showCurrentPhoto(member) {
    editPhotoPreview.replaceChildren();

    editPhotoPreview.style.setProperty(
      "--member-color",
      editColor.value
    );

    if (member.photoURL) {
      const image = document.createElement("img");
      image.src = member.photoURL;
      image.alt = member.name;
      editPhotoPreview.appendChild(image);
    } else {
      editPhotoPreview.textContent =
        member.name.charAt(0).toUpperCase();
    }
  }

  function openSettings(member) {
    if (isMemberEditingLocked()) {
      status.textContent =
        "Finish recording before editing members.";
      return;
    }

    editingMember = member;
    pendingShortcut = member.shortcut;

    editForm.reset();

    editName.value = member.name;
    editColor.value = member.color;
    editShortcut.value = member.shortcut;

    showCurrentPhoto(member);
    clearEditError();

    settingsModal.classList.add("open");
    editName.focus();
  }

  $("close-edit-member").addEventListener("click", closeSettings);
  $("cancel-edit-member").addEventListener("click", closeSettings);

  settingsModal.addEventListener("click", function (event) {
    if (event.target === settingsModal) closeSettings();
  });

  editColor.addEventListener("input", function () {
    editPhotoPreview.style.setProperty(
      "--member-color",
      editColor.value
    );
  });

  editShortcut.addEventListener("keydown", function (event) {
    event.preventDefault();
    event.stopPropagation();

    const key = event.key.toUpperCase();

    if (key === "ESCAPE") {
      closeSettings();
      return;
    }

    if (event.ctrlKey || event.altKey || event.metaKey) {
      showEditError("Choose a key without Ctrl, Alt or Command.");
      return;
    }

    const error = validShortcut(key, editingMember);

    if (error) {
      showEditError(error);
      return;
    }

    pendingShortcut = key;
    editShortcut.value = key;
    clearEditError();
  });


  // ==========================================
  // 9. SAVE OR DELETE MEMBER
  // ==========================================

  editForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!editingMember || isMemberEditingLocked()) return;

    const newName = editName.value.trim();

    if (!newName) {
      showEditError("Enter a member name.");
      return;
    }

    const error = validShortcut(pendingShortcut, editingMember);

    if (error) {
      showEditError(error);
      return;
    }

    const file = editImage.files[0];

    if (file && !file.type.startsWith("image/")) {
      showEditError("Please select an image file.");
      return;
    }

    const member = editingMember;
    const previousURL = member.photoURL;

    const newURL = file
      ? URL.createObjectURL(file)
      : editRemovePhoto.checked
        ? null
        : previousURL;

    member.name = newName;
    member.color = editColor.value;
    member.shortcut = pendingShortcut;
    member.photoURL = newURL;

    member.lines.forEach(line => {
      line.memberShortcut = pendingShortcut;
    });

    closeSettings();
    renderMemberCards();
    renderClassicMembers();
    updateAllResults();
    updateWinnerCrown();

    if (previousURL && previousURL !== newURL) {
      URL.revokeObjectURL(previousURL);
    }
  });

  deleteButton.addEventListener("click", function () {
    if (!editingMember || isMemberEditingLocked()) return;

    const member = editingMember;

    const confirmed = window.confirm(
      `Remove ${member.name}? Their recorded lines will also be deleted.`
    );

    if (!confirmed) return;

    const index = members.indexOf(member);

    if (index === -1) return;

    members.splice(index, 1);

    member.lines.forEach(line => {
      const lineIndex = recordedLines.indexOf(line);

      if (lineIndex !== -1) {
        recordedLines.splice(lineIndex, 1);
      }
    });

    closeSettings();
    renderMemberCards();
    renderClassicMembers();
    updateAllResults();
    updateWinnerCrown();

    if (member.photoURL) {
      URL.revokeObjectURL(member.photoURL);
    }
  });


  // ==========================================
  // 10. CREATE MEMBER
  // ==========================================

  memberForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (isMemberEditingLocked()) return;

    if (members.length >= 20) {
      showError("You cannot add more members.");
      return;
    }

    const name = nameInput.value.trim();

    if (!name) return;

    if (!selectedShortcut) {
      showError("Choose a keyboard shortcut first.");
      shortcutInput.focus();
      return;
    }

    const error = validShortcut(selectedShortcut);

    if (error) {
      showError(error);
      return;
    }

    const photo = imageInput.files[0];

    const member = {
      name: name,
      color: colorInput.value,
      shortcut: selectedShortcut,
      photoURL: photo ? URL.createObjectURL(photo) : null,
      lines: [],
      activeLine: null,
      totalSeconds: 0,
      percentage: 0,
      classicUI: null
    };

    members.push(member);

    renderMemberCards();
    renderClassicMembers();
    updateAllResults();
    updateWinnerCrown();

    memberForm.reset();
    selectedShortcut = "";

    closeModal();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeModal();
      closeSettings();
    }
  });


  // ==========================================
  // 11. MUSIC PLAYER
  // ==========================================

  function showMusicError(message) {
    musicError.textContent = message;
    musicError.hidden = false;
  }

  function clearMusicError() {
    musicError.textContent = "";
    musicError.hidden = true;
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return "0:00";
    }

    const all = Math.floor(seconds);
    const hours = Math.floor(all / 3600);
    const minutes = Math.floor((all % 3600) / 60);
    const remaining = String(all % 60).padStart(2, "0");

    return hours > 0
      ? hours + ":" + String(minutes).padStart(2, "0") + ":" + remaining
      : minutes + ":" + remaining;
  }

  function updateMusicPlayButton() {
    musicToggle.textContent = musicAudio.paused
      ? "▶ Play"
      : "⏸ Pause";
  }

  function updateMusicProgress() {
    const duration = musicAudio.duration;

    musicCurrentTime.textContent =
      formatTime(musicAudio.currentTime);

    if (Number.isFinite(duration) && duration > 0) {
      musicSeek.value = Math.max(
        0,
        Math.min(100, musicAudio.currentTime / duration * 100)
      );

      musicDuration.textContent = formatTime(duration);
    } else {
      musicSeek.value = 0;
      musicDuration.textContent = "0:00";
    }
  }


  // ==========================================
  // 12. RECORDING PANEL
  // ==========================================

  const panel = document.createElement("section");
  panel.id = "recording-controls";

  panel.style.cssText =
    "max-width:960px;margin:24px auto;padding:20px;" +
    "background:#1c1c28;border:1px solid #393543;" +
    "border-radius:14px;text-align:center";

  const heading = document.createElement("h2");
  heading.textContent = "RECORDING SYSTEM";
  heading.style.cssText = "color:var(--accent);margin-top:0";

  const buttonRow = document.createElement("div");
  buttonRow.style.cssText =
    "display:flex;justify-content:center;gap:12px;flex-wrap:wrap";

  const startButton = document.createElement("button");
  startButton.id = "start-recording";
  startButton.type = "button";
  startButton.textContent = "● Start Recording";

  const finishButton = document.createElement("button");
  finishButton.id = "finish-recording";
  finishButton.type = "button";
  finishButton.textContent = "■ Finish Recording";

  const status = document.createElement("p");
  status.id = "recording-status";
  status.style.color = "#c7c7d0";

  buttonRow.append(startButton, finishButton);
  panel.append(heading, buttonRow, status);

  document.querySelector(".music-player")
    .insertAdjacentElement("afterend", panel);


  // ==========================================
  // 13. RECORDING STATE
  // ==========================================

  function updateButtons() {
    startButton.disabled =
      !musicIsReady || recordingState !== "idle";

    finishButton.disabled =
      recordingState !== "recording" &&
      recordingState !== "awaitingFinish";

    musicToggle.disabled =
      !musicIsReady || recordingState === "awaitingFinish";

    musicRestart.disabled = !musicIsReady;

    musicSeek.disabled =
      !musicIsReady ||
      recordingState === "recording" ||
      recordingState === "awaitingFinish";

    openButton.disabled = isMemberEditingLocked();
  }

  function updateStatus() {
    if (recordingState === "idle") {
      status.textContent = musicIsReady
        ? "Ready! Press Start Recording."
        : "Upload an MP3 to begin.";
      return;
    }

    if (recordingState === "awaitingFinish") {
      status.textContent =
        "Song ended. Click Finish Recording to confirm results.";
      return;
    }

    if (recordingState === "finished") {
      status.textContent =
        "Recording finished! Final results are ready.";
      return;
    }

    if (musicAudio.paused) {
      status.textContent =
        "Recording paused. Press Play to continue.";
      return;
    }

    const active = members.filter(member =>
      member.activeLine !== null
    );

    status.textContent = active.length > 0
      ? "Recording: " + active.map(member => member.name).join(", ")
      : "Recording... Press a member's assigned key.";
  }


  // ==========================================
  // 14. CALCULATE RESULTS
  // ==========================================

  function updateAllResults() {
    const now = musicAudio.currentTime || 0;
    let combined = 0;

    members.forEach(function (member) {
      member.totalSeconds = member.lines.reduce(
        function (total, line) {
          const end = line.end === null
            ? now
            : line.end;

          return total + Math.max(0, end - line.start);
        },
        0
      );

      combined += member.totalSeconds;
    });

    members.forEach(function (member) {
      member.percentage = combined > 0
        ? member.totalSeconds / combined * 100
        : 0;
    });

    updateClassicValues();
  }

  function stopTimer() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }

    animationFrameId = null;
  }

  function tick() {
    animationFrameId = null;

    updateAllResults();

    if (
      recordingState === "recording" &&
      !musicAudio.paused
    ) {
      animationFrameId = requestAnimationFrame(tick);
    }
  }

  function startTimer() {
    if (
      animationFrameId === null &&
      recordingState === "recording" &&
      !musicAudio.paused
    ) {
      animationFrameId = requestAnimationFrame(tick);
    }
  }


  // ==========================================
  // 15. MEMBER RECORDING KEYS
  // ==========================================

  function toggleMemberLine(member) {
    if (
      recordingState !== "recording" ||
      musicAudio.paused
    ) {
      return;
    }

    const now = musicAudio.currentTime;

    if (member.activeLine !== null) {
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

    updateAllResults();
    updateStatus();
  }

  function closeAllActiveLines(endTime) {
    members.forEach(function (member) {
      if (member.activeLine !== null) {
        member.activeLine.end = Math.max(
          member.activeLine.start,
          endTime
        );

        member.activeLine = null;
      }
    });
  }


  // ==========================================
  // 16. START, FINISH AND RESET
  // ==========================================

  async function startRecording() {
    if (!musicIsReady || recordingState !== "idle") return;

    if (members.length === 0) {
      status.textContent =
        "Add at least one member before recording.";
      return;
    }

    clearMusicError();
    recordingState = "recording";
    updateButtons();
    startButton.blur();

    try {
      await musicAudio.play();
      updateStatus();
      startTimer();
    } catch (error) {
      recordingState = "idle";
      stopTimer();
      updateButtons();
      updateStatus();
      showMusicError("Could not start this MP3 file.");
    }
  }

  startButton.addEventListener("click", startRecording);

  function finishRecording() {
    if (
      recordingState !== "recording" &&
      recordingState !== "awaitingFinish"
    ) {
      return;
    }

    closeAllActiveLines(musicAudio.currentTime);
    recordingState = "finished";

    stopTimer();
    musicAudio.pause();

    updateAllResults();
    updateWinnerCrown();
    updateButtons();
    updateStatus();
    updateMusicPlayButton();
  }

  finishButton.addEventListener("click", finishRecording);

  function resetRecording() {
    stopTimer();
    recordingState = "idle";
    recordedLines.length = 0;

    members.forEach(function (member) {
      member.lines = [];
      member.activeLine = null;
      member.totalSeconds = 0;
      member.percentage = 0;
    });

    updateAllResults();
    updateWinnerCrown();
    updateButtons();
    updateStatus();
  }

  function restartAll() {
    if (!musicIsReady) return;

    musicAudio.pause();
    musicAudio.currentTime = 0;

    resetRecording();
    updateMusicProgress();
    updateMusicPlayButton();
  }

  musicRestart.addEventListener("click", restartAll);


  // ==========================================
  // 17. LOAD MP3
  // ==========================================

  musicFile.addEventListener("change", function () {
    clearMusicError();

    const file = musicFile.files[0];
    if (!file) return;

    if (!/\.mp3$/i.test(file.name)) {
      showMusicError("Please select an MP3 file only.");
      musicFile.value = "";
      return;
    }

    musicAudio.pause();
    resetRecording();

    musicIsReady = false;
    updateButtons();

    const previousURL = currentMusicURL;
    currentMusicURL = URL.createObjectURL(file);

    musicAudio.src = currentMusicURL;
    musicAudio.load();

    if (previousURL) {
      URL.revokeObjectURL(previousURL);
    }

    musicTrackName.textContent =
      file.name.replace(/\.mp3$/i, "");

    musicFile.value = "";
    musicSeek.value = 0;
    musicCurrentTime.textContent = "0:00";
    musicDuration.textContent = "0:00";

    updateMusicPlayButton();
    updateStatus();
  });

  musicAudio.addEventListener("loadedmetadata", function () {
    musicIsReady =
      Number.isFinite(musicAudio.duration) &&
      musicAudio.duration > 0;

    if (musicIsReady) {
      clearMusicError();
    } else {
      showMusicError(
        "Could not read this MP3 file's duration."
      );
    }

    updateMusicProgress();
    updateButtons();
    updateStatus();
  });


  // ==========================================
  // 18. MUSIC PLAYBACK
  // ==========================================

  musicToggle.addEventListener("click", async function () {
    if (!musicIsReady || recordingState === "awaitingFinish") {
      return;
    }

    clearMusicError();

    if (musicAudio.paused) {
      try {
        await musicAudio.play();
      } catch (error) {
        showMusicError("Could not play this audio file.");
      }
    } else {
      musicAudio.pause();
    }

    updateMusicPlayButton();
  });

  musicSeek.addEventListener("input", function () {
    if (!musicIsReady || musicSeek.disabled) return;

    if (
      Number.isFinite(musicAudio.duration) &&
      musicAudio.duration > 0
    ) {
      musicAudio.currentTime =
        Number(musicSeek.value) / 100 * musicAudio.duration;

      updateMusicProgress();
    }
  });

  musicVolume.addEventListener("input", function () {
    musicAudio.volume = Number(musicVolume.value);
  });

  musicAudio.volume = Number(musicVolume.value);

  musicAudio.addEventListener("timeupdate", function () {
    updateMusicProgress();

    if (recordingState === "recording") {
      updateAllResults();
    }
  });

  musicAudio.addEventListener(
    "durationchange",
    updateMusicProgress
  );

  musicAudio.addEventListener("play", function () {
    updateMusicPlayButton();
    updateStatus();
    startTimer();
  });

  musicAudio.addEventListener("pause", function () {
    stopTimer();
    updateAllResults();
    updateMusicPlayButton();
    updateStatus();
  });

  musicAudio.addEventListener("ended", function () {
    if (recordingState === "recording") {
      closeAllActiveLines(musicAudio.duration);
      recordingState = "awaitingFinish";

      stopTimer();
      updateAllResults();
      updateButtons();
      updateStatus();
    }

    updateMusicProgress();
    updateMusicPlayButton();
  });

  musicAudio.addEventListener("error", function () {
    musicIsReady = false;

    if (recordingState === "recording") {
      closeAllActiveLines(musicAudio.currentTime);
      recordingState = "awaitingFinish";

      stopTimer();
      updateAllResults();
    }

    updateButtons();
    updateMusicPlayButton();

    showMusicError(
      "This MP3 file could not be loaded. Please try another file."
    );
  });


  // ==========================================
  // 19. APPEARANCE SETTINGS — STORAGE
  // ==========================================

  const APPEARANCE_KEY = "lds-appearance-v1";
  const APPEARANCE_DB = "lds-appearance-assets";

  const DEFAULT_APPEARANCE = {
    accent: "#ff80c8",
    background: "#101018",
    dim: 25
  };

  function validHex(value) {
    return /^#[0-9a-f]{6}$/i.test(value);
  }

  function loadAppearanceColors() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(APPEARANCE_KEY) || "null"
      );

      if (!saved || typeof saved !== "object") {
        return { ...DEFAULT_APPEARANCE };
      }

      return {
        accent: validHex(saved.accent)
          ? saved.accent
          : DEFAULT_APPEARANCE.accent,

        background: validHex(saved.background)
          ? saved.background
          : DEFAULT_APPEARANCE.background,

        dim: Number.isFinite(Number(saved.dim))
          ? Math.max(0, Math.min(85, Number(saved.dim)))
          : DEFAULT_APPEARANCE.dim
      };
    } catch (error) {
      return { ...DEFAULT_APPEARANCE };
    }
  }


  // Store images in IndexedDB, not localStorage.

  function backgroundDatabase(action, file) {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) {
        reject(new Error("Image storage is unavailable."));
        return;
      }

      const open = indexedDB.open(APPEARANCE_DB, 1);

      open.onupgradeneeded = function () {
        const db = open.result;

        if (!db.objectStoreNames.contains("files")) {
          db.createObjectStore("files");
        }
      };

      open.onerror = function () {
        reject(
          open.error ||
          new Error("Could not open image storage.")
        );
      };

      open.onsuccess = function () {
        const db = open.result;

        let result = null;

        const transaction = db.transaction(
          "files",
          action === "read" ? "readonly" : "readwrite"
        );

        const store = transaction.objectStore("files");
        let request;

        if (action === "read") {
          request = store.get("background");
        }

        if (action === "write") {
          request = store.put(file, "background");
        }

        if (action === "delete") {
          request = store.delete("background");
        }

        if (request && action === "read") {
          request.onsuccess = function () {
            result = request.result || null;
          };
        }

        transaction.oncomplete = function () {
          db.close();
          resolve(result);
        };

        transaction.onerror = function () {
          db.close();

          reject(
            transaction.error ||
            new Error("Could not save image.")
          );
        };

        transaction.onabort = function () {
          db.close();

          reject(
            transaction.error ||
            new Error("Image storage was interrupted.")
          );
        };
      };
    });
  }


  // ==========================================
  // 20. APPEARANCE THEME DATA
  // ==========================================

  let savedAppearance = loadAppearanceColors();
  let draftAppearance = { ...savedAppearance };

  let savedBackgroundURL = null;
  let draftBackgroundURL = null;
  let pendingImageFile = null;
  let removeBackgroundImage = false;
  let imageRevision = 0;
  let appearanceSaving = false;

  function applyAppearance(values, imageURL) {
    const root = document.documentElement;

    root.style.setProperty("--accent", values.accent);

    root.style.setProperty(
      "--background",
      values.background
    );

    root.style.setProperty(
      "--background-image-dim",
      String(values.dim / 100)
    );

    root.style.setProperty(
      "--page-background-image",
      imageURL ? `url("${imageURL}")` : "none"
    );

    document.body.classList.toggle(
      "appearance-has-image",
      !!imageURL
    );
  }

  applyAppearance(savedAppearance, savedBackgroundURL);


  // ==========================================
  // 21. APPEARANCE CORNER BUTTON
  // ==========================================

  const appearanceToggle = document.createElement("button");

  appearanceToggle.type = "button";
  appearanceToggle.id = "appearance-toggle";

  appearanceToggle.textContent = "🎨 Appearance Settings";

  appearanceToggle.setAttribute("aria-haspopup", "dialog");
  appearanceToggle.setAttribute(
    "aria-controls",
    "appearance-overlay"
  );

  document.body.appendChild(appearanceToggle);


  // ==========================================
  // 22. APPEARANCE SETTINGS WINDOW
  // ==========================================

  const appearanceOverlay = document.createElement("div");

  appearanceOverlay.id = "appearance-overlay";
  appearanceOverlay.setAttribute("aria-hidden", "true");

  appearanceOverlay.innerHTML = `
    <div class="appearance-panel"
         role="dialog"
         aria-modal="true"
         aria-labelledby="appearance-title">

      <div class="appearance-panel-header">
        <h2 class="appearance-panel-title" id="appearance-title">
          🎨 Appearance Settings
        </h2>

        <button type="button"
                id="appearance-close"
                aria-label="Close appearance settings">×</button>
      </div>

      <p class="appearance-description">
        Personalize the website. Classic and Visual video
        previews keep their dark backgrounds.
      </p>

      <form id="appearance-form">

        <div class="appearance-setting">
          <label class="appearance-label" for="appearance-accent">
            Theme Accent Color
          </label>

          <p class="appearance-hint">
            Choose any color with your browser's full color palette.
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
                   aria-label="Accent color hex code"
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
                   aria-label="Page background hex code"
                   value="#101018">
          </div>
        </div>

        <div class="appearance-setting">
          <label class="appearance-label" for="appearance-image">
            Custom Background Image
          </label>

          <p class="appearance-hint">
            JPG, PNG, WebP, GIF or AVIF, up to 20 MB.
            Your image stays in your browser.
          </p>

          <input class="appearance-upload"
                 id="appearance-image"
                 type="file"
                 accept="image/jpeg,image/png,image/webp,image/gif,image/avif">

          <div id="appearance-image-preview"
               class="appearance-image-preview">
            No background image selected
          </div>

          <button type="button"
                  id="appearance-remove-image"
                  class="appearance-action appearance-action-secondary">
            Remove Background Image
          </button>
        </div>

        <div class="appearance-setting">
          <label class="appearance-label" for="appearance-dim">
            Background Image Darkness
          </label>

          <p class="appearance-hint">
            Darken your background for better readability.
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
                    for="appearance-dim">25%</output>
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

        <p id="appearance-notice"
           class="appearance-preview-notice"
           role="status">
          Changes are previewed live.
          Click Save Changes to keep them.
        </p>

      </form>
    </div>
  `;

  document.body.appendChild(appearanceOverlay);


  // ==========================================
  // 23. APPEARANCE FORM ELEMENTS
  // ==========================================

  const appearanceForm = $("appearance-form");
  const accentPicker = $("appearance-accent");
  const accentHex = $("appearance-accent-hex");
  const backgroundPicker = $("appearance-background");
  const backgroundHex = $("appearance-background-hex");
  const imagePicker = $("appearance-image");
  const imagePreview = $("appearance-image-preview");
  const dimSlider = $("appearance-dim");
  const dimValue = $("appearance-dim-value");
  const appearanceNotice = $("appearance-notice");
  const appearanceSave = $("appearance-save");


  // ==========================================
  // 24. LIVE APPEARANCE PREVIEW
  // ==========================================

  function currentDraftImage() {
    if (removeBackgroundImage) return null;

    return draftBackgroundURL || savedBackgroundURL;
  }

  function refreshAppearanceImagePreview() {
    const url = currentDraftImage();

    imagePreview.style.backgroundImage =
      url ? `url("${url}")` : "none";

    imagePreview.textContent = url
      ? ""
      : "No background image selected";
  }

  function previewAppearance() {
    applyAppearance(
      draftAppearance,
      currentDraftImage()
    );

    dimValue.textContent =
      draftAppearance.dim + "%";

    refreshAppearanceImagePreview();
  }

  function clearDraftImage() {
    if (draftBackgroundURL) {
      URL.revokeObjectURL(draftBackgroundURL);
    }

    draftBackgroundURL = null;
    pendingImageFile = null;
    imagePicker.value = "";
  }


  // ==========================================
  // 25. OPEN / CLOSE APPEARANCE SETTINGS
  // ==========================================

  function openAppearance() {
    if (appearanceSaving) return;

    draftAppearance = { ...savedAppearance };

    clearDraftImage();
    removeBackgroundImage = false;

    accentPicker.value = draftAppearance.accent;
    accentHex.value =
      draftAppearance.accent.toUpperCase();

    backgroundPicker.value =
      draftAppearance.background;

    backgroundHex.value =
      draftAppearance.background.toUpperCase();

    dimSlider.value = draftAppearance.dim;

    appearanceNotice.textContent =
      "Changes are previewed live. Click Save Changes to keep them.";

    previewAppearance();

    appearanceOverlay.classList.add("open");

    appearanceOverlay.setAttribute(
      "aria-hidden",
      "false"
    );

    appearanceToggle.setAttribute(
      "aria-expanded",
      "true"
    );

    accentPicker.focus();
  }

  function closeAppearance(commit = false) {
    if (appearanceSaving) return;

    appearanceOverlay.classList.remove("open");

    appearanceOverlay.setAttribute(
      "aria-hidden",
      "true"
    );

    appearanceToggle.setAttribute(
      "aria-expanded",
      "false"
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


  // ==========================================
  // 26. FULL COLOR PICKERS + HEX
  // ==========================================

  function connectColorPicker(picker, hex, property) {
    picker.addEventListener("input", function () {
      draftAppearance[property] = picker.value;
      hex.value = picker.value.toUpperCase();

      previewAppearance();
    });

    hex.addEventListener("input", function () {
      const color = hex.value.trim();

      if (!validHex(color)) return;

      draftAppearance[property] =
        color.toLowerCase();

      picker.value = color;

      previewAppearance();
    });

    hex.addEventListener("blur", function () {
      hex.value =
        draftAppearance[property].toUpperCase();
    });
  }

  connectColorPicker(
    accentPicker,
    accentHex,
    "accent"
  );

  connectColorPicker(
    backgroundPicker,
    backgroundHex,
    "background"
  );


  // ==========================================
  // 27. BACKGROUND IMAGE AND DARKNESS
  // ==========================================

  dimSlider.addEventListener("input", function () {
    draftAppearance.dim = Number(dimSlider.value);
    previewAppearance();
  });

  imagePicker.addEventListener("change", function () {
    const file = imagePicker.files[0];

    if (!file) return;

    const accepted = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif"
    ];

    if (
      !accepted.includes(file.type) ||
      file.size > 20 * 1024 * 1024
    ) {
      imagePicker.value = "";

      appearanceNotice.textContent =
        "Choose JPG, PNG, WebP, GIF or AVIF, up to 20 MB.";

      return;
    }

    clearDraftImage();

    pendingImageFile = file;
    draftBackgroundURL = URL.createObjectURL(file);

    removeBackgroundImage = false;
    imageRevision++;

    previewAppearance();

    appearanceNotice.textContent =
      "New image previewed. Click Save Changes to keep it.";
  });

  $("appearance-remove-image").addEventListener(
    "click",
    function () {
      clearDraftImage();

      removeBackgroundImage = true;
      imageRevision++;

      previewAppearance();

      appearanceNotice.textContent =
        "Image will be removed when you save changes.";
    }
  );


  // ==========================================
  // 28. RESET TO DEFAULT
  // ==========================================

  $("appearance-reset").addEventListener("click", function () {
    clearDraftImage();

    draftAppearance = { ...DEFAULT_APPEARANCE };
    removeBackgroundImage = true;

    imageRevision++;

    accentPicker.value = draftAppearance.accent;
    accentHex.value =
      draftAppearance.accent.toUpperCase();

    backgroundPicker.value =
      draftAppearance.background;

    backgroundHex.value =
      draftAppearance.background.toUpperCase();

    dimSlider.value = draftAppearance.dim;

    previewAppearance();

    appearanceNotice.textContent =
      "Defaults selected. Click Save Changes to confirm.";
  });


  // ==========================================
  // 29. SAVE APPEARANCE SETTINGS
  // ==========================================

  appearanceForm.addEventListener(
    "submit",
    async function (event) {
      event.preventDefault();

      if (appearanceSaving) return;

      const newImage = pendingImageFile;

      const deleteImage =
        removeBackgroundImage && !newImage;

      appearanceSaving = true;
      appearanceSave.disabled = true;

      appearanceNotice.textContent =
        "Saving appearance settings...";

      try {
        if (newImage) {
          await backgroundDatabase("write", newImage);

        } else if (deleteImage) {
          try {
            await backgroundDatabase("delete");
          } catch (error) {
            if (savedBackgroundURL) {
              throw error;
            }
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

        let colorsStored = true;

        try {
          localStorage.setItem(
            APPEARANCE_KEY,
            JSON.stringify(savedAppearance)
          );
        } catch (error) {
          colorsStored = false;
        }

        applyAppearance(
          savedAppearance,
          savedBackgroundURL
        );

        appearanceSaving = false;
        appearanceSave.disabled = false;

        closeAppearance(true);

        if (!colorsStored) {
          window.alert(
            "Appearance applied, but the browser blocked saving colors for the next visit."
          );
        }

      } catch (error) {
        appearanceSaving = false;
        appearanceSave.disabled = false;

        appearanceNotice.textContent =
          "Could not save the background image in this browser. " +
          "Try another image or remove it.";
      }
    }
  );


  // ==========================================
  // 30. APPEARANCE BUTTON EVENTS
  // ==========================================

  appearanceToggle.addEventListener(
    "click",
    openAppearance
  );

  $("appearance-close").addEventListener(
    "click",
    function () {
      closeAppearance();
    }
  );

  $("appearance-cancel").addEventListener(
    "click",
    function () {
      closeAppearance();
    }
  );

  appearanceOverlay.addEventListener(
    "click",
    function (event) {
      if (event.target === appearanceOverlay) {
        closeAppearance();
      }
    }
  );

  document.addEventListener("keydown", function (event) {
    if (
      event.key === "Escape" &&
      appearanceOverlay.classList.contains("open")
    ) {
      closeAppearance();
    }
  });


  // ==========================================
  // 31. RESTORE SAVED BACKGROUND IMAGE
  // ==========================================

  const initialImageRevision = imageRevision;

  backgroundDatabase("read").then(function (file) {
    if (
      !file ||
      imageRevision !== initialImageRevision
    ) {
      return;
    }

    savedBackgroundURL = URL.createObjectURL(file);

    if (!appearanceOverlay.classList.contains("open")) {
      applyAppearance(
        savedAppearance,
        savedBackgroundURL
      );
    } else {
      refreshAppearanceImagePreview();
    }

  }).catch(function () {
    // Color settings still work if image storage
    // is unavailable in this browser.
  });


  // ==========================================
  // 32. KEYBOARD SHORTCUTS
  // ==========================================

  document.addEventListener("keydown", function (event) {
    if (
      event.repeat ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey
    ) {
      return;
    }

    if (
      studioScreen.hidden ||
      modal.classList.contains("open") ||
      settingsModal.classList.contains("open") ||
      appearanceOverlay.classList.contains("open")
    ) {
      return;
    }

    if (
      event.target instanceof Element &&
      (
        event.target.closest(
          "input, textarea, select"
        ) ||
        event.target.isContentEditable
      )
    ) {
      return;
    }

    if (
      event.code === "Backquote" ||
      event.key === "~"
    ) {
      event.preventDefault();
      restartAll();
      return;
    }

    if (recordingState !== "recording") return;

    const key = event.key.toUpperCase();

    if (!/^[A-Z0-9]$/.test(key)) return;

    const member = members.find(
      member => member.shortcut === key
    );

    if (!member) return;

    event.preventDefault();

    toggleMemberLine(member);
  });


  // ==========================================
  // 33. CLEANUP
  // ==========================================

  window.addEventListener("pagehide", function () {
    stopTimer();

    if (currentMusicURL) {
      URL.revokeObjectURL(currentMusicURL);
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
  });


  // ==========================================
  // 34. INITIAL STATE
  // ==========================================

  updateMusicPlayButton();
  updateMusicProgress();
  updateButtons();
  updateStatus();

});
