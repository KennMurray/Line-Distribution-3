
document.addEventListener("DOMContentLoaded", function () {

  // ==========================================
  // SECTION 1 — ELEMENTS AND DATA
  // ==========================================

  const welcomeScreen = document.getElementById("welcome-screen");
  const studioScreen = document.getElementById("studio-screen");
  const modeForm = document.getElementById("mode-form");

  const modal = document.getElementById("member-modal");
  const openButton = document.getElementById("open-member-modal");
  const closeButton = document.getElementById("close-member-modal");

  const memberForm = document.getElementById("member-form");
  const memberList = document.getElementById("member-list-items");

  const nameInput = document.getElementById("member-name");
  const imageInput = document.getElementById("member-image");
  const colorInput = document.getElementById("member-color");
  const shortcutInput = document.getElementById("member-shortcut");
  const shortcutError = document.getElementById("shortcut-error");

  const classicMembers = document.getElementById("classic-members");
  const classicLayout = document.getElementById("classic-layout");

  const musicFile = document.getElementById("music-file");
  const musicAudio = document.getElementById("music-audio");
  const musicTrackName = document.getElementById("music-track-name");
  const musicSeek = document.getElementById("music-seek");
  const musicCurrentTime = document.getElementById("music-current-time");
  const musicDuration = document.getElementById("music-duration");
  const musicToggle = document.getElementById("music-toggle");
  const musicRestart = document.getElementById("music-restart");
  const musicVolume = document.getElementById("music-volume");
  const musicError = document.getElementById("music-error");

  const members = [];
  const recordedLines = [];

  let selectedShortcut = "";
  let currentMusicURL = null;
  let musicIsReady = false;

  // idle / recording / awaitingFinish / finished
  let recordingState = "idle";
  let animationFrameId = null;

  musicRestart.textContent = "↺ Restart All (~)";


  // ==========================================
  // SECTION 2 — WELCOME SCREEN
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
  // SECTION 3 — ADD MEMBER MODAL
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
    if (event.target === modal) {
      closeModal();
    }
  });


  // ---------- CHECK MEMBER SHORTCUT ----------

  function validShortcut(key, currentMember = null) {

    if (!/^[A-Z0-9]$/.test(key)) {
      return "Choose a letter (A-Z) or number (0-9).";
    }

    const duplicate = members.some(function (member) {
      return (
        member !== currentMember &&
        member.shortcut === key
      );
    });

    if (duplicate) {
      return "This key is already assigned to another member.";
    }

    return "";
  }


  // ---------- CAPTURE NEW MEMBER KEY ----------

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
  // SECTION 4 — CLASSIC PREVIEW
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

    letter.style.cssText = [
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "font-weight:bold",
      "font-size:20px"
    ].join(";");

    letter.style.color = member.color;

    return letter;
  }


  // ---------- CREATE CLASSIC ROW ----------

  function createClassicRow(member) {

    const row = document.createElement("div");

    row.className = "classic-member";
    row.style.setProperty("--member-color", member.color);


    // Crown on the left of the photo.

    const crown = document.createElement("span");

    crown.className = "classic-crown";
    crown.textContent = "♕";
    crown.setAttribute("aria-hidden", "true");


    // Photo

    const photo = createClassicPhoto(member);


    // Information

    const info = document.createElement("div");
    info.className = "classic-info";

    const top = document.createElement("div");
    top.className = "classic-info-top";


    // Member name

    const name = document.createElement("span");

    name.className = "classic-name";
    name.textContent = member.name;


    // Seconds

    const seconds = document.createElement("span");

    seconds.className = "classic-seconds";
    seconds.textContent = "0.0s";

    top.append(name, seconds);


    // Progress bar

    const progress = document.createElement("div");
    progress.className = "classic-progress";

    const fill = document.createElement("div");
    fill.className = "classic-progress-fill";
    fill.style.width = "0%";

    progress.appendChild(fill);


    // Percentage

    const percentage = document.createElement("span");

    percentage.className = "classic-percentage";
    percentage.textContent = "0%";


    // Assemble complete row

    info.append(top, progress, percentage);

    row.append(crown, photo, info);


    // Save references for live updates.

    member.classicUI = {
      row: row,
      photo: photo,
      progress: progress,
      seconds: seconds,
      fill: fill,
      percentage: percentage
    };

    return row;
  }


  // ---------- RENDER CLASSIC MEMBERS ----------

  function renderClassicMembers() {

    if (!classicMembers) return;

    const fragment = document.createDocumentFragment();

    members.forEach(function (member) {
      fragment.appendChild(createClassicRow(member));
    });

    classicMembers.replaceChildren(fragment);
  }


  // ==========================================
  // SECTION 5 — ANIMATED RANKING
  // ==========================================

  function sortClassicRanking() {

    if (!classicMembers || members.length < 2) return;

    const ranking = members.slice().sort(function (a, b) {

      const difference = b.totalSeconds - a.totalSeconds;

      if (Math.abs(difference) < 0.005) {
        return members.indexOf(a) - members.indexOf(b);
      }

      return difference;
    });


    // Only animate when positions change.

    const currentRows = Array.from(classicMembers.children);

    const unchanged = ranking.every(function (member, index) {
      return currentRows[index] === member.classicUI.row;
    });

    if (unchanged) return;


    // Save old positions.

    const before = new Map();

    currentRows.forEach(function (row) {

      if (typeof row.getAnimations === "function") {

        row.getAnimations().forEach(function (animation) {

          if (animation.id === "rank-move") {
            animation.cancel();
          }
        });
      }

      before.set(
        row,
        row.getBoundingClientRect().top
      );
    });


    // Move existing rows.

    ranking.forEach(function (member) {
      classicMembers.appendChild(member.classicUI.row);
    });


    // Accessibility: reduced motion.

    if (
      window.matchMedia &&
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
    ) {
      return;
    }


    // Smooth movement between old and new positions.

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
          {
            transform: `translateY(${distance}px)`
          },
          {
            transform: "translateY(0)"
          }
        ],
        {
          duration: 460,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)"
        }
      );

      animation.id = "rank-move";
    });
  }


  // ==========================================
  // SECTION 6 — CLASSIC LIVE VALUES
  // ==========================================

  function updateClassicValues() {

    members.forEach(function (member) {

      const ui = member.classicUI;

      if (!ui) return;


      // Seconds

      ui.seconds.textContent =
        member.totalSeconds.toFixed(1) + "s";


      // Percentage

      ui.percentage.textContent =
        member.percentage === 0
          ? "0%"
          : member.percentage.toFixed(1) + "%";


      // Bar

      ui.fill.style.width =
        Math.max(
          0,
          Math.min(100, member.percentage)
        ) + "%";


      // Active singer glow

      const singing =
        recordingState === "recording" &&
        member.activeLine !== null &&
        !musicAudio.paused;

      if (singing) {

        ui.photo.style.boxShadow =
          `0 0 8px ${member.color}, ` +
          `0 0 17px ${member.color}`;

        ui.progress.style.boxShadow =
          `0 0 9px ${member.color}`;

      } else {

        ui.photo.style.boxShadow = "";
        ui.progress.style.boxShadow = "";
      }
    });

    sortClassicRanking();
  }


  // ==========================================
  // SECTION 7 — WINNER CROWN
  // ==========================================

  function updateWinnerCrown() {

    let winner = null;

    if (recordingState === "finished") {

      members.forEach(function (member) {

        if (
          member.totalSeconds > 0 &&
          (
            winner === null ||
            member.totalSeconds > winner.totalSeconds
          )
        ) {
          winner = member;
        }
      });
    }


    if (classicLayout) {

      classicLayout.classList.toggle(
        "finished",
        recordingState === "finished"
      );
    }


    members.forEach(function (member) {

      if (member.classicUI) {

        member.classicUI.row.classList.toggle(
          "winner",
          member === winner
        );
      }
    });
  }


  // ==========================================
  // SECTION 8 — CLICKABLE MEMBER CARDS
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

      card.style.setProperty(
        "--member-color",
        member.color
      );

      card.tabIndex = 0;

      card.setAttribute("role", "button");

      card.setAttribute(
        "aria-label",
        "Edit member " + member.name
      );


      // Member photo

      if (member.photoURL) {

        const image = document.createElement("img");

        image.src = member.photoURL;
        image.alt = member.name;

        card.appendChild(image);
      }


      // Member name

      const title = document.createElement("p");

      title.textContent = member.name;


      // Shortcut badge

      const badge = document.createElement("span");

      badge.className = "member-shortcut";

      badge.textContent = "Key: " + member.shortcut;


      // Edit hint

      const hint = document.createElement("div");

      hint.className = "member-card-edit-hint";

      hint.textContent = "Click to edit ✎";

      card.append(title, badge, hint);


      // Open settings by clicking.

      card.addEventListener("click", function () {
        openSettings(member);
      });


      // Keyboard accessibility.

      card.addEventListener("keydown", function (event) {

        if (
          event.key === "Enter" ||
          event.key === " "
        ) {

          event.preventDefault();

          openSettings(member);
        }
      });

      fragment.appendChild(card);
    });

    memberList.replaceChildren(fragment);
  }


  // ==========================================
  // SECTION 9 — MEMBER SETTINGS STYLES
  // ==========================================

  // These styles are added automatically.
  // style.css does not need to be modified.

  const settingsStyles = document.createElement("style");

  settingsStyles.textContent = `
    .member-card[role="button"] {
      cursor: pointer;
      border: 1px solid transparent;
      transition:
        transform 0.2s ease,
        border-color 0.2s ease;
    }

    .member-card[role="button"]:hover {
      transform: translateY(-3px);
      border-color: var(--member-color);
    }

    .member-card[role="button"]:focus-visible {
      outline: 2px solid var(--member-color);
      outline-offset: 3px;
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
      margin-top: 4px;
    }

    .edit-member-form input[type="text"],
    .edit-member-form input[type="file"] {
      width: 100%;
      min-width: 0;
      background: #292938;
      border: 1px solid #454555;
      border-radius: 8px;
      padding: 11px;
      color: #fff;
      font: inherit;
    }

    .edit-member-form input[type="color"] {
      width: 60px;
      height: 40px;
      cursor: pointer;
      border: 1px solid #454555;
      border-radius: 7px;
      background: transparent;
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

    .edit-member-form .small-hint {
      font-size: 12px;
      color: #aaa5ba;
      margin: 0;
    }

    .edit-member-form .edit-actions {
      display: flex;
      gap: 9px;
      flex-wrap: wrap;
      margin-top: 12px;
    }

    .edit-member-form .delete-member-button {
      background: #59313d;
      color: #ffe4ea;
    }

    .edit-member-form .cancel-member-button {
      background: #383443;
      color: #fff;
    }

    .edit-member-form .edit-error {
      font-size: 13px;
      color: #ff9b9b;
      margin: 0;
    }
  `;

  document.head.appendChild(settingsStyles);


  // ==========================================
  // SECTION 10 — MEMBER SETTINGS POP-UP
  // ==========================================

  const settingsModal = document.createElement("div");

  settingsModal.className = "modal-overlay";

  settingsModal.id = "member-settings-modal";


  // Build the settings window.

  settingsModal.innerHTML = `
    <div
      class="modal-content"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-member-title"
    >

      <button
        type="button"
        class="close-modal"
        id="close-edit-member"
        aria-label="Close"
      >
        ×
      </button>

      <h2 id="edit-member-title">
        Edit Member
      </h2>

      <form
        id="edit-member-form"
        class="edit-member-form"
      >

        <div
          id="edit-photo-preview"
          class="photo-preview"
        ></div>

        <label for="edit-member-name">
          Member Name
        </label>

        <input
          id="edit-member-name"
          type="text"
          maxlength="30"
          required
        >

        <label for="edit-member-color">
          Member Color
        </label>

        <input
          id="edit-member-color"
          type="color"
        >

        <label for="edit-member-image">
          Change Photo
        </label>

        <input
          id="edit-member-image"
          type="file"
          accept="image/*"
        >

        <p class="small-hint">
          Leave empty to keep the current photo.
        </p>

        <label
          style="display:flex;align-items:center;gap:9px;font-weight:normal"
        >
          <input
            type="checkbox"
            id="edit-remove-photo"
          >

          Remove current photo
        </label>

        <label for="edit-member-shortcut">
          Keyboard Shortcut
        </label>

        <input
          id="edit-member-shortcut"
          class="edit-shortcut"
          type="text"
          readonly
          required
          placeholder="Click and press a key"
        >

        <p
          class="edit-error"
          id="edit-member-error"
          role="alert"
          hidden
        ></p>

        <div class="edit-actions">

          <button type="submit">
            Save Changes
          </button>

          <button
            type="button"
            id="delete-member"
            class="delete-member-button"
          >
            Remove Member
          </button>

          <button
            type="button"
            id="cancel-edit-member"
            class="cancel-member-button"
          >
            Cancel
          </button>

        </div>

      </form>

    </div>
  `;


  // Add settings modal to the studio.

  studioScreen.appendChild(settingsModal);


  // ---------- SETTINGS INPUTS ----------

  const editForm = document.getElementById("edit-member-form");
  const editName = document.getElementById("edit-member-name");
  const editColor = document.getElementById("edit-member-color");
  const editImage = document.getElementById("edit-member-image");

  const editShortcut = document.getElementById(
    "edit-member-shortcut"
  );

  const editRemovePhoto = document.getElementById(
    "edit-remove-photo"
  );

  const editPhotoPreview = document.getElementById(
    "edit-photo-preview"
  );

  const editError = document.getElementById("edit-member-error");
  const deleteButton = document.getElementById("delete-member");

  let editingMember = null;
  let pendingShortcut = "";


  // ==========================================
  // SECTION 11 — OPEN AND CLOSE SETTINGS
  // ==========================================

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


  // ---------- CURRENT PHOTO PREVIEW ----------

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


  // ---------- OPEN MEMBER SETTINGS ----------

  function openSettings(member) {

    // Prevent editing during active recording.

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


  // ---------- CLOSE BUTTONS ----------

  document.getElementById("close-edit-member")
    .addEventListener("click", closeSettings);

  document.getElementById("cancel-edit-member")
    .addEventListener("click", closeSettings);

  settingsModal.addEventListener("click", function (event) {

    if (event.target === settingsModal) {
      closeSettings();
    }
  });


  // ---------- COLOR PREVIEW ----------

  editColor.addEventListener("input", function () {

    editPhotoPreview.style.setProperty(
      "--member-color",
      editColor.value
    );
  });


  // ==========================================
  // SECTION 12 — EDIT KEYBOARD SHORTCUT
  // ==========================================

  editShortcut.addEventListener("keydown", function (event) {

    event.preventDefault();
    event.stopPropagation();

    const key = event.key.toUpperCase();

    if (key === "ESCAPE") {
      closeSettings();
      return;
    }

    if (event.ctrlKey || event.altKey || event.metaKey) {

      showEditError(
        "Choose a key without Ctrl, Alt or Command."
      );

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
  // SECTION 13 — SAVE MEMBER CHANGES
  // ==========================================

  editForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!editingMember || isMemberEditingLocked()) return;

    const newName = editName.value.trim();

    if (!newName) {

      showEditError("Enter a member name.");

      return;
    }

    const error = validShortcut(
      pendingShortcut,
      editingMember
    );

    if (error) {

      showEditError(error);

      return;
    }


    // Validate new photo.

    const file = editImage.files[0];

    if (file && !file.type.startsWith("image/")) {

      showEditError("Please select an image file.");

      return;
    }


    // ---------- UPDATE MEMBER ----------

    const member = editingMember;

    const previousURL = member.photoURL;

    let newURL = previousURL;

    if (file) {

      newURL = URL.createObjectURL(file);

    } else if (editRemovePhoto.checked) {

      newURL = null;
    }

    member.name = newName;
    member.color = editColor.value;
    member.shortcut = pendingShortcut;
    member.photoURL = newURL;


    // Update shortcuts stored in existing lines.

    member.lines.forEach(function (line) {

      line.memberShortcut = pendingShortcut;
    });


    // ---------- REFRESH INTERFACE ----------

    closeSettings();

    renderMemberCards();
    renderClassicMembers();

    updateAllResults();
    updateWinnerCrown();


    // Release old image if it was replaced.

    if (previousURL && previousURL !== newURL) {

      URL.revokeObjectURL(previousURL);
    }
  });


  // ==========================================
  // SECTION 14 — REMOVE MEMBER
  // ==========================================

  deleteButton.addEventListener("click", function () {

    if (!editingMember || isMemberEditingLocked()) return;

    const member = editingMember;


    // Ask for confirmation before deleting.

    const confirmed = window.confirm(
      `Remove ${member.name}? Their recorded lines will also be deleted.`
    );

    if (!confirmed) return;

    const index = members.indexOf(member);

    if (index === -1) return;


    // ---------- DELETE MEMBER ----------

    members.splice(index, 1);


    // Remove their recording intervals.

    member.lines.forEach(function (line) {

      const lineIndex = recordedLines.indexOf(line);

      if (lineIndex !== -1) {

        recordedLines.splice(lineIndex, 1);
      }
    });


    // ---------- REFRESH INTERFACE ----------

    closeSettings();

    renderMemberCards();
    renderClassicMembers();

    updateAllResults();
    updateWinnerCrown();


    // Free the member photo.

    if (member.photoURL) {

      URL.revokeObjectURL(member.photoURL);
    }
  });


  // ==========================================
  // SECTION 15 — CREATE NEW MEMBER
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


    // ---------- MEMBER PHOTO ----------

    const photo = imageInput.files[0];

    const photoURL = photo
      ? URL.createObjectURL(photo)
      : null;


    // ---------- MEMBER DATA ----------

    const member = {

      name: name,
      color: colorInput.value,
      shortcut: selectedShortcut,
      photoURL: photoURL,

      lines: [],
      activeLine: null,

      totalSeconds: 0,
      percentage: 0,

      classicUI: null
    };

    members.push(member);


    // ---------- REFRESH INTERFACE ----------

    renderMemberCards();
    renderClassicMembers();

    updateAllResults();
    updateWinnerCrown();


    // ---------- RESET FORM ----------

    memberForm.reset();

    selectedShortcut = "";

    closeModal();
  });


  // ---------- ESCAPE KEY ----------

  document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {

      closeModal();
      closeSettings();
    }
  });


  // ==========================================
  // SECTION 16 — MUSIC PLAYER HELPERS
  // ==========================================

  function showMusicError(message) {
    musicError.textContent = message;
    musicError.hidden = false;
  }

  function clearMusicError() {
    musicError.textContent = "";
    musicError.hidden = true;
  }


  // ---------- FORMAT TIME ----------

  function formatTime(seconds) {

    if (!Number.isFinite(seconds) || seconds < 0) {
      return "0:00";
    }

    const all = Math.floor(seconds);

    const hours = Math.floor(all / 3600);
    const minutes = Math.floor((all % 3600) / 60);

    const remaining = String(
      all % 60
    ).padStart(2, "0");

    if (hours > 0) {

      return (
        hours + ":" +
        String(minutes).padStart(2, "0") + ":" +
        remaining
      );
    }

    return minutes + ":" + remaining;
  }


  function updateMusicPlayButton() {

    musicToggle.textContent = musicAudio.paused
      ? "▶ Play"
      : "⏸ Pause";
  }


  function updateMusicProgress() {

    const duration = musicAudio.duration;

    musicCurrentTime.textContent = formatTime(
      musicAudio.currentTime
    );

    if (Number.isFinite(duration) && duration > 0) {

      musicSeek.value = Math.max(
        0,
        Math.min(
          100,
          musicAudio.currentTime / duration * 100
        )
      );

      musicDuration.textContent = formatTime(duration);

    } else {

      musicSeek.value = 0;

      musicDuration.textContent = "0:00";
    }
  }


  // ==========================================
  // SECTION 17 — RECORDING PANEL
  // ==========================================

  const panel = document.createElement("section");

  panel.id = "recording-controls";

  panel.style.cssText = [
    "max-width:960px",
    "margin:24px auto",
    "padding:20px",
    "background:#1c1c28",
    "border:1px solid #393543",
    "border-radius:14px",
    "text-align:center"
  ].join(";");


  // ---------- HEADING ----------

  const heading = document.createElement("h2");

  heading.textContent = "RECORDING SYSTEM";

  heading.style.cssText =
    "color:#ff80c8;margin-top:0";


  // ---------- BUTTON ROW ----------

  const buttonRow = document.createElement("div");

  buttonRow.style.cssText = [
    "display:flex",
    "justify-content:center",
    "gap:12px",
    "flex-wrap:wrap"
  ].join(";");


  // ---------- START BUTTON ----------

  const startButton = document.createElement("button");

  startButton.id = "start-recording";
  startButton.type = "button";

  startButton.textContent = "● Start Recording";


  // ---------- FINISH BUTTON ----------

  const finishButton = document.createElement("button");

  finishButton.id = "finish-recording";
  finishButton.type = "button";

  finishButton.textContent = "■ Finish Recording";


  // ---------- STATUS ----------

  const status = document.createElement("p");

  status.id = "recording-status";

  status.style.color = "#c7c7d0";


  // ---------- ASSEMBLE ----------

  buttonRow.append(startButton, finishButton);

  panel.append(heading, buttonRow, status);


  document.querySelector(".music-player")
    .insertAdjacentElement("afterend", panel);


  // ==========================================
  // SECTION 18 — RECORDING BUTTON STATES
  // ==========================================

  function updateButtons() {

    startButton.disabled =
      !musicIsReady ||
      recordingState !== "idle";

    finishButton.disabled =
      recordingState !== "recording" &&
      recordingState !== "awaitingFinish";

    musicToggle.disabled =
      !musicIsReady ||
      recordingState === "awaitingFinish";

    musicRestart.disabled = !musicIsReady;

    musicSeek.disabled =
      !musicIsReady ||
      recordingState === "recording" ||
      recordingState === "awaitingFinish";


    // Do not allow adding members during recording.

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

    const active = members.filter(function (member) {
      return member.activeLine !== null;
    });

    if (active.length > 0) {

      status.textContent =
        "Recording: " +
        active.map(function (member) {
          return member.name;
        }).join(", ");

    } else {

      status.textContent =
        "Recording... Press a member's assigned key.";
    }
  }


  // ==========================================
  // SECTION 19 — RECORDING RESULTS
  // ==========================================

  function updateAllResults() {

    const now = musicAudio.currentTime || 0;

    let combined = 0;


    // ---------- SECONDS ----------

    members.forEach(function (member) {

      member.totalSeconds = member.lines.reduce(
        function (total, line) {

          const end = line.end === null
            ? now
            : line.end;

          return total + Math.max(
            0,
            end - line.start
          );
        },
        0
      );

      combined += member.totalSeconds;
    });


    // ---------- PERCENTAGES ----------

    // Overlapping vocals count separately.

    members.forEach(function (member) {

      member.percentage = combined > 0
        ? member.totalSeconds / combined * 100
        : 0;
    });


    // ---------- UPDATE CLASSIC ----------

    updateClassicValues();
  }


  // ==========================================
  // SECTION 20 — LIVE TIMER
  // ==========================================

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
  // SECTION 21 — MEMBER RECORDING KEYS
  // ==========================================

  function toggleMemberLine(member) {

    if (
      recordingState !== "recording" ||
      musicAudio.paused
    ) {
      return;
    }

    const now = musicAudio.currentTime;


    // ---------- END LINE ----------

    if (member.activeLine !== null) {

      member.activeLine.end = now;

      member.activeLine = null;

    } else {

      // ---------- START LINE ----------

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


  // ---------- CLOSE ACTIVE LINES ----------

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
  // SECTION 22 — START RECORDING
  // ==========================================

  async function startRecording() {

    if (!musicIsReady) return;

    if (recordingState !== "idle") return;

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

      showMusicError(
        "Could not start this MP3 file."
      );
    }
  }

  startButton.addEventListener("click", startRecording);


  // ==========================================
  // SECTION 23 — FINISH RECORDING
  // ==========================================

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


  // ==========================================
  // SECTION 24 — RESET RECORDING
  // ==========================================

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


  // ==========================================
  // SECTION 25 — RESTART ALL (~)
  // ==========================================

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
  // SECTION 26 — LOAD MP3
  // ==========================================

  musicFile.addEventListener("change", function () {

    clearMusicError();

    const file = musicFile.files[0];

    if (!file) return;


    // ---------- VALIDATE MP3 ----------

    if (!/\.mp3$/i.test(file.name)) {

      showMusicError(
        "Please select an MP3 file only."
      );

      musicFile.value = "";

      return;
    }


    // ---------- RESET OLD RECORDING ----------

    musicAudio.pause();

    resetRecording();

    musicIsReady = false;

    updateButtons();


    // ---------- LOAD SONG ----------

    const previousURL = currentMusicURL;

    currentMusicURL = URL.createObjectURL(file);

    musicAudio.src = currentMusicURL;

    musicAudio.load();


    if (previousURL) {

      URL.revokeObjectURL(previousURL);
    }


    // ---------- SONG NAME ----------

    musicTrackName.textContent = file.name.replace(
      /\.mp3$/i,
      ""
    );

    musicFile.value = "";

    musicSeek.value = 0;

    musicCurrentTime.textContent = "0:00";
    musicDuration.textContent = "0:00";

    updateMusicPlayButton();
    updateStatus();
  });


  // ---------- METADATA ----------

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
  // SECTION 27 — MUSIC PLAY / PAUSE
  // ==========================================

  musicToggle.addEventListener("click", async function () {

    if (!musicIsReady) return;

    if (recordingState === "awaitingFinish") return;

    clearMusicError();


    if (musicAudio.paused) {

      try {

        await musicAudio.play();

      } catch (error) {

        showMusicError(
          "Could not play this audio file."
        );
      }

    } else {

      musicAudio.pause();
    }

    updateMusicPlayButton();
  });


  // ---------- SEEK ----------

  musicSeek.addEventListener("input", function () {

    if (!musicIsReady || musicSeek.disabled) {
      return;
    }

    if (
      Number.isFinite(musicAudio.duration) &&
      musicAudio.duration > 0
    ) {

      musicAudio.currentTime =
        Number(musicSeek.value) /
        100 *
        musicAudio.duration;

      updateMusicProgress();
    }
  });


  // ---------- VOLUME ----------

  musicVolume.addEventListener("input", function () {

    musicAudio.volume = Number(musicVolume.value);
  });

  musicAudio.volume = Number(musicVolume.value);


  // ==========================================
  // SECTION 28 — AUDIO EVENTS
  // ==========================================

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


  // ---------- PLAY ----------

  musicAudio.addEventListener("play", function () {

    updateMusicPlayButton();

    updateStatus();
    startTimer();
  });


  // ---------- PAUSE ----------

  musicAudio.addEventListener("pause", function () {

    stopTimer();

    updateAllResults();

    updateMusicPlayButton();
    updateStatus();
  });


  // ---------- SONG ENDED ----------

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


  // ---------- AUDIO ERROR ----------

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
  // SECTION 29 — KEYBOARD CONTROLS
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
      settingsModal.classList.contains("open")
    ) {
      return;
    }


    // Ignore shortcuts while typing.

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


    // ---------- RESTART ALL ----------

    if (
      event.code === "Backquote" ||
      event.key === "~"
    ) {

      event.preventDefault();

      restartAll();

      return;
    }


    // ---------- MEMBER KEYS ----------

    if (recordingState !== "recording") return;

    const key = event.key.toUpperCase();

    if (!/^[A-Z0-9]$/.test(key)) return;

    const member = members.find(function (item) {
      return item.shortcut === key;
    });

    if (!member) return;

    event.preventDefault();

    toggleMemberLine(member);
  });


  // ==========================================
  // SECTION 30 — CLEANUP
  // ==========================================

  window.addEventListener("pagehide", function () {

    stopTimer();

    if (currentMusicURL) {

      URL.revokeObjectURL(currentMusicURL);

      currentMusicURL = null;
    }

    members.forEach(function (member) {

      if (member.photoURL) {

        URL.revokeObjectURL(member.photoURL);

        member.photoURL = null;
      }
    });
  });


  // ==========================================
  // SECTION 31 — INITIAL STATE
  // ==========================================

  updateMusicPlayButton();
  updateMusicProgress();

  updateButtons();
  updateStatus();

});
