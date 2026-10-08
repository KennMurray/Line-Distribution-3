
document.addEventListener("DOMContentLoaded", function () {

  // ==========================================
  // SECTION 1 — WELCOME SCREEN
  // ==========================================

  const welcomeScreen = document.getElementById("welcome-screen");
  const studioScreen = document.getElementById("studio-screen");
  const modeForm = document.getElementById("mode-form");

  // Selected visual style for the current session.
  // The actual visual layouts will be added later.

  let selectedVisualMode = null;

  // ---------- START GENERATOR ----------

  modeForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const selectedOption = modeForm.querySelector(
      'input[name="visual-mode"]:checked'
    );

    if (!selectedOption) {
      return;
    }

    selectedVisualMode = selectedOption.value;

    // Store the selected mode on the main studio.
    // Future layouts can use this value.

    studioScreen.dataset.visualMode = selectedVisualMode;

    // Hide welcome screen and show generator.

    welcomeScreen.hidden = true;
    studioScreen.hidden = false;

    // Return to the top of the page.

    window.scrollTo(0, 0);
  });


  // ==========================================
  // SECTION 2 — ADD MEMBER SYSTEM
  // ==========================================

  const modal = document.getElementById("member-modal");
  const openButton = document.getElementById("open-member-modal");
  const closeButton = document.getElementById("close-member-modal");

  const form = document.getElementById("member-form");
  const memberList = document.getElementById("member-list-items");

  const nameInput = document.getElementById("member-name");
  const imageInput = document.getElementById("member-image");
  const colorInput = document.getElementById("member-color");
  const shortcutInput = document.getElementById("member-shortcut");
  const shortcutError = document.getElementById("shortcut-error");

  const members = [];
  let selectedShortcut = "";

  // ---------- MEMBER ERROR MESSAGES ----------

  function showError(message) {
    shortcutError.textContent = message;
    shortcutError.hidden = false;
  }

  function clearError() {
    shortcutError.textContent = "";
    shortcutError.hidden = true;
  }

  // ---------- MEMBER POP-UP ----------

  function openModal() {
    modal.classList.add("open");
    nameInput.focus();
  }

  function closeModal() {
    modal.classList.remove("open");
    clearError();
  }

  openButton.addEventListener("click", openModal);
  closeButton.addEventListener("click", closeModal);

  modal.addEventListener("click", function (event) {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeModal();
    }
  });

  // ---------- MEMBER KEYBOARD SHORTCUT SETUP ----------

  shortcutInput.addEventListener("keydown", function (event) {
    event.preventDefault();
    event.stopPropagation();

    const key = event.key.toUpperCase();

    if (key === "ESCAPE") {
      closeModal();
      return;
    }

    if (
      key === " " ||
      key === "SPACE" ||
      key === "ENTER" ||
      key === "TAB" ||
      key === "BACKSPACE" ||
      key === "DELETE" ||
      key === "CONTROL" ||
      key === "SHIFT" ||
      key === "ALT" ||
      key === "META"
    ) {
      showError("This key is reserved. Choose another key.");
      return;
    }

    if (key.length !== 1 || !/^[A-Z0-9]$/.test(key)) {
      showError("Choose a letter (A-Z) or number (0-9).");
      return;
    }

    if (members.some(member => member.shortcut === key)) {
      showError("This key is already assigned to another member.");
      return;
    }

    selectedShortcut = key;
    shortcutInput.value = key;

    clearError();
  });

  // ---------- SAVE MEMBER ----------

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (members.length >= 20) {
      showError("You cannot add more members.");
      return;
    }

    const name = nameInput.value.trim();
    const color = colorInput.value;
    const photo = imageInput.files[0];

    if (!name) {
      return;
    }

    if (!selectedShortcut) {
      showError("Choose a keyboard shortcut first.");
      shortcutInput.focus();
      return;
    }

    if (members.some(member => member.shortcut === selectedShortcut)) {
      showError("This key is already assigned.");
      return;
    }

    // Create member with recording data.

    const member = {
      name: name,
      color: color,
      shortcut: selectedShortcut,

      lines: [],
      totalSeconds: 0,
      percentage: 0
    };

    members.push(member);

    // ---------- CREATE MEMBER CARD ----------

    const card = document.createElement("div");
    card.className = "member-card";

    card.style.setProperty("--member-color", color);

    // ---------- MEMBER PHOTO ----------

    if (photo) {
      const image = document.createElement("img");
      const photoUrl = URL.createObjectURL(photo);

      image.src = photoUrl;
      image.alt = name;

      image.addEventListener("load", function () {
        URL.revokeObjectURL(photoUrl);
      }, { once: true });

      card.appendChild(image);
    }

    // ---------- MEMBER NAME ----------

    const memberName = document.createElement("p");
    memberName.textContent = name;

    // ---------- MEMBER SHORTCUT BADGE ----------

    const shortcutBadge = document.createElement("span");

    shortcutBadge.className = "member-shortcut";
    shortcutBadge.textContent = "Key: " + selectedShortcut;

    card.appendChild(memberName);
    card.appendChild(shortcutBadge);

    memberList.appendChild(card);

    form.reset();
    selectedShortcut = "";

    closeModal();
  });


  // ==========================================
  // SECTION 3 — MUSIC PLAYER
  // ==========================================

  const musicFile = document.getElementById("music-file");
  const musicAudio = document.getElementById("music-audio");

  const musicTrackName = document.getElementById("music-track-name");

  const musicSeek = document.getElementById("music-seek");

  const musicCurrentTime = document.getElementById(
    "music-current-time"
  );

  const musicDuration = document.getElementById(
    "music-duration"
  );

  const musicToggle = document.getElementById("music-toggle");
  const musicRestart = document.getElementById("music-restart");

  const musicVolume = document.getElementById("music-volume");
  const musicError = document.getElementById("music-error");

  let currentMusicURL = null;
  let musicIsReady = false;

  // ---------- MUSIC PLAYER ERRORS ----------

  function showMusicError(message) {
    musicError.textContent = message;
    musicError.hidden = false;
  }

  function clearMusicError() {
    musicError.textContent = "";
    musicError.hidden = true;
  }

  // ---------- FORMAT SONG TIME ----------

  function formatMusicTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return "0:00";
    }

    const totalSeconds = Math.floor(seconds);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;

    const paddedSeconds = String(
      remainingSeconds
    ).padStart(2, "0");

    if (hours > 0) {
      return (
        hours + ":" +
        String(minutes).padStart(2, "0") + ":" +
        paddedSeconds
      );
    }

    return minutes + ":" + paddedSeconds;
  }

  // ---------- ENABLE MUSIC CONTROLS ----------

  function setMusicControlsEnabled(enabled) {
    musicIsReady = enabled;

    musicToggle.disabled = !enabled;
    musicRestart.disabled = !enabled;
    musicSeek.disabled = !enabled;
  }

  // ---------- UPDATE PLAY BUTTON ----------

  function updateMusicPlayButton() {
    if (musicAudio.paused) {
      musicToggle.textContent = "▶ Play";
    } else {
      musicToggle.textContent = "⏸ Pause";
    }
  }

  // ---------- UPDATE MUSIC PROGRESS ----------

  function updateMusicProgress() {
    const currentTime = musicAudio.currentTime;
    const duration = musicAudio.duration;

    musicCurrentTime.textContent = formatMusicTime(
      currentTime
    );

    if (Number.isFinite(duration) && duration > 0) {
      const progress = (currentTime / duration) * 100;

      musicSeek.value = Math.min(
        100,
        Math.max(0, progress)
      );

      musicDuration.textContent = formatMusicTime(
        duration
      );
    } else {
      musicSeek.value = 0;
      musicDuration.textContent = "0:00";
    }
  }

  // ---------- INITIAL MUSIC PLAYER STATE ----------

  setMusicControlsEnabled(false);

  musicAudio.volume = Number(musicVolume.value);

  updateMusicPlayButton();
  updateMusicProgress();

  // Set Restart All button label.

  musicRestart.textContent = "↺ Restart All (~)";


  // ==========================================
  // SECTION 4 — RECORDING DATA
  // ==========================================

  // This will store all recorded singing intervals.
  // Recording functionality will be implemented later.

  let recordedLines = [];

  // ---------- RESET MEMBER RESULTS ----------

  function resetMemberResults() {

    recordedLines = [];

    members.forEach(function (member) {
      member.lines = [];
      member.totalSeconds = 0;
      member.percentage = 0;
    });

    // Future elements to reset:
    // - member timers
    // - percentage counters
    // - progress bars
    // - ranking positions
    // - recording timeline
    // - active singing indicators
  }


  // ==========================================
  // SECTION 5 — LOAD MP3 FILE
  // ==========================================

  musicFile.addEventListener("change", function () {
    clearMusicError();

    const file = musicFile.files[0];

    if (!file) {
      return;
    }

    // Accept MP3 files only.

    const isMP3 = /\.mp3$/i.test(file.name);

    if (!isMP3) {
      showMusicError("Please select an MP3 file only.");
      musicFile.value = "";
      return;
    }

    // Stop currently playing audio.

    musicAudio.pause();

    setMusicControlsEnabled(false);

    musicSeek.value = 0;
    musicCurrentTime.textContent = "0:00";
    musicDuration.textContent = "0:00";

    // Create URL for the new MP3.

    const newMusicURL = URL.createObjectURL(file);
    const previousMusicURL = currentMusicURL;

    currentMusicURL = newMusicURL;

    musicAudio.src = newMusicURL;
    musicAudio.load();

    // Release previous music URL.

    if (previousMusicURL) {
      URL.revokeObjectURL(previousMusicURL);
    }

    // Display selected song name.

    musicTrackName.textContent = file.name.replace(
      /\.mp3$/i,
      ""
    );

    musicFile.value = "";

    updateMusicPlayButton();

    // Clear recording results for the new song.

    resetMemberResults();
  });

  // ---------- MP3 METADATA LOADED ----------

  musicAudio.addEventListener("loadedmetadata", function () {
    const duration = musicAudio.duration;

    if (Number.isFinite(duration) && duration > 0) {
      setMusicControlsEnabled(true);
      clearMusicError();
    } else {
      setMusicControlsEnabled(false);

      showMusicError(
        "Could not read this MP3 file's duration."
      );
    }

    updateMusicProgress();
  });

  // ---------- PLAY / PAUSE ----------

  musicToggle.addEventListener("click", async function () {
    if (!musicIsReady) {
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

  // ---------- SEEK THROUGH SONG ----------

  musicSeek.addEventListener("input", function () {
    if (!musicIsReady) {
      return;
    }

    const duration = musicAudio.duration;

    if (Number.isFinite(duration) && duration > 0) {
      const percentage = Number(musicSeek.value) / 100;

      musicAudio.currentTime = percentage * duration;

      updateMusicProgress();
    }
  });

  // ---------- MUSIC VOLUME ----------

  musicVolume.addEventListener("input", function () {
    musicAudio.volume = Number(musicVolume.value);
  });

  // ---------- AUDIO EVENTS ----------

  musicAudio.addEventListener(
    "timeupdate",
    updateMusicProgress
  );

  musicAudio.addEventListener(
    "durationchange",
    updateMusicProgress
  );

  musicAudio.addEventListener(
    "play",
    updateMusicPlayButton
  );

  musicAudio.addEventListener(
    "pause",
    updateMusicPlayButton
  );

  musicAudio.addEventListener("ended", function () {
    updateMusicPlayButton();
    updateMusicProgress();
  });

  // ---------- AUDIO ERROR ----------

  musicAudio.addEventListener("error", function () {
    setMusicControlsEnabled(false);

    updateMusicPlayButton();

    showMusicError(
      "This MP3 file could not be loaded. Please try another file."
    );
  });

  // ---------- CLEAN UP MUSIC FILE URL ----------

  window.addEventListener("pagehide", function () {
    if (currentMusicURL) {
      URL.revokeObjectURL(currentMusicURL);
      currentMusicURL = null;
    }
  });


  // ==========================================
  // SECTION 6 — RESTART ALL
  // ==========================================

  function restartAll() {
    if (!musicIsReady) {
      return;
    }

    // Stop the song.

    musicAudio.pause();

    // Rewind the song to 0:00.

    musicAudio.currentTime = 0;

    // Reset all member recording results.

    resetMemberResults();

    // Update player display.

    updateMusicProgress();
    updateMusicPlayButton();

    // Keep:
    // - selected MP3
    // - all members
    // - member photos
    // - member colors
    // - member shortcuts
    // - chosen visual style
  }

  // ---------- RESTART BUTTON ----------

  musicRestart.addEventListener("click", restartAll);

  // ---------- RESTART KEYBOARD SHORTCUT ----------

  document.addEventListener("keydown", function (event) {

    // Prevent repeated activation.

    if (event.repeat) {
      return;
    }

    // Ignore Ctrl, Alt and Command combinations.

    if (event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }

    // Only activate shortcuts inside the studio.

    if (studioScreen.hidden) {
      return;
    }

    // Ignore shortcuts while Add Member is open.

    if (modal.classList.contains("open")) {
      return;
    }

    // Ignore shortcuts when typing or using inputs.

    const target = event.target;

    if (
      target instanceof Element &&
      (
        target.closest("input, textarea, select") ||
        target.isContentEditable
      )
    ) {
      return;
    }

    // The ~ key / physical Backquote key.

    const isRestartKey =
      event.code === "Backquote" ||
      event.key === "~";

    if (!isRestartKey) {
      return;
    }

    event.preventDefault();

    restartAll();
  });


  // ==========================================
  // SECTION 7 — FUTURE RECORDING SYSTEM
  // ==========================================

  // Next features:
  //
  // - Start Recording button
  // - Member keyboard shortcuts while recording
  // - Live member timers
  // - Automatic ranking
  // - Classic Line Distribution layout
  // - Visual Line Distribution layout
  // - Video export

});
