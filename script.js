
document.addEventListener("DOMContentLoaded", function () {

  // ==========================================
  // SECTION 1 — WELCOME SCREEN
  // ==========================================

  const welcomeScreen = document.getElementById("welcome-screen");
  const studioScreen = document.getElementById("studio-screen");
  const modeForm = document.getElementById("mode-form");

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

    studioScreen.dataset.visualMode = selectedVisualMode;

    welcomeScreen.hidden = true;
    studioScreen.hidden = false;

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

  // Classic Line Distribution elements

  const classicMembers = document.getElementById("classic-members");
  const classicLayout = document.getElementById("classic-layout");

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

    if (members.some(function (member) {
      return member.shortcut === key;
    })) {
      showError("This key is already assigned to another member.");
      return;
    }

    selectedShortcut = key;
    shortcutInput.value = key;

    clearError();
  });


  // ==========================================
  // SECTION 3 — CLASSIC LINE DISTRIBUTION
  // ==========================================

  // This section displays members inside the
  // vertical 9:16 Classic video preview.
  //
  // Recording and ranking will be added later.

  // ---------- CREATE MEMBER PHOTO ----------

  function createClassicPhoto(member) {

    if (member.photoURL) {

      const image = document.createElement("img");

      image.className = "classic-photo";
      image.src = member.photoURL;
      image.alt = member.name;

      return image;
    }

    // If no photo was uploaded,
    // show the first letter of the member's name.

    const placeholder = document.createElement("div");

    placeholder.className = "classic-photo";

    placeholder.textContent = member.name
      .charAt(0)
      .toUpperCase();

    placeholder.style.display = "flex";
    placeholder.style.alignItems = "center";
    placeholder.style.justifyContent = "center";

    placeholder.style.boxSizing = "border-box";

    placeholder.style.color = member.color;
    placeholder.style.fontWeight = "bold";
    placeholder.style.fontSize = "20px";

    return placeholder;
  }


  // ---------- CREATE CLASSIC MEMBER ROW ----------

  function createClassicMemberRow(member) {

    const row = document.createElement("div");

    row.className = "classic-member";

    row.style.setProperty(
      "--member-color",
      member.color
    );


    // ---------- CROWN ----------

    // The crown is hidden for now.
    // After Finish Recording is implemented,
    // it will appear next to the winner's photo.

    const crown = document.createElement("span");

    crown.className = "classic-crown";
    crown.textContent = "♕";

    crown.setAttribute("aria-hidden", "true");


    // ---------- PHOTO ----------

    const photo = createClassicPhoto(member);


    // ---------- MEMBER INFORMATION ----------

    const info = document.createElement("div");

    info.className = "classic-info";


    // ---------- NAME AND SECONDS ----------

    const infoTop = document.createElement("div");

    infoTop.className = "classic-info-top";

    const name = document.createElement("span");

    name.className = "classic-name";
    name.textContent = member.name;

    const seconds = document.createElement("span");

    seconds.className = "classic-seconds";

    seconds.textContent =
      member.totalSeconds.toFixed(1) + "s";

    infoTop.appendChild(name);
    infoTop.appendChild(seconds);


    // ---------- PROGRESS BAR ----------

    const progress = document.createElement("div");

    progress.className = "classic-progress";

    const progressFill = document.createElement("div");

    progressFill.className = "classic-progress-fill";

    progressFill.style.width =
      Math.max(
        0,
        Math.min(100, member.percentage)
      ) + "%";

    progress.appendChild(progressFill);


    // ---------- PERCENTAGE ----------

    const percentage = document.createElement("span");

    percentage.className = "classic-percentage";

    if (member.percentage === 0) {
      percentage.textContent = "0%";
    } else {
      percentage.textContent =
        member.percentage.toFixed(1) + "%";
    }


    // ---------- ASSEMBLE MEMBER INFORMATION ----------

    info.appendChild(infoTop);
    info.appendChild(progress);
    info.appendChild(percentage);


    // ---------- ASSEMBLE COMPLETE ROW ----------

    row.appendChild(crown);
    row.appendChild(photo);
    row.appendChild(info);

    return row;
  }


  // ---------- RENDER CLASSIC MEMBERS ----------

  function renderClassicMembers() {

    if (!classicMembers) {
      return;
    }

    // Clear previous rows before rebuilding the list.

    classicMembers.replaceChildren();

    const fragment = document.createDocumentFragment();

    members.forEach(function (member) {

      const row = createClassicMemberRow(member);

      fragment.appendChild(row);
    });

    classicMembers.appendChild(fragment);
  }


  // ==========================================
  // SECTION 4 — SAVE MEMBER
  // ==========================================

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

    if (members.some(function (member) {
      return member.shortcut === selectedShortcut;
    })) {
      showError("This key is already assigned.");
      return;
    }

    // ---------- SAVE PHOTO URL ----------

    // Keep this URL available because both
    // the member card and Classic preview use it.

    const photoURL = photo
      ? URL.createObjectURL(photo)
      : null;


    // ---------- CREATE MEMBER ----------

    const member = {
      name: name,
      color: color,
      shortcut: selectedShortcut,
      photoURL: photoURL,

      lines: [],
      totalSeconds: 0,
      percentage: 0
    };

    members.push(member);


    // ---------- CREATE MEMBER CARD ----------

    const card = document.createElement("div");

    card.className = "member-card";

    card.style.setProperty(
      "--member-color",
      color
    );


    // ---------- MEMBER CARD PHOTO ----------

    if (photoURL) {

      const image = document.createElement("img");

      image.src = photoURL;
      image.alt = name;

      card.appendChild(image);
    }


    // ---------- MEMBER CARD NAME ----------

    const memberName = document.createElement("p");

    memberName.textContent = name;


    // ---------- MEMBER KEYBOARD SHORTCUT ----------

    const shortcutBadge = document.createElement("span");

    shortcutBadge.className = "member-shortcut";

    shortcutBadge.textContent =
      "Key: " + selectedShortcut;


    // ---------- ADD MEMBER CARD ----------

    card.appendChild(memberName);
    card.appendChild(shortcutBadge);

    memberList.appendChild(card);


    // ---------- UPDATE CLASSIC VIDEO PREVIEW ----------

    renderClassicMembers();


    // ---------- RESET MEMBER FORM ----------

    form.reset();

    selectedShortcut = "";

    closeModal();
  });


  // ==========================================
  // SECTION 5 — MUSIC PLAYER
  // ==========================================

  const musicFile = document.getElementById("music-file");
  const musicAudio = document.getElementById("music-audio");

  const musicTrackName = document.getElementById(
    "music-track-name"
  );

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

    const minutes = Math.floor(
      (totalSeconds % 3600) / 60
    );

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

  musicRestart.textContent = "↺ Restart All (~)";


  // ==========================================
  // SECTION 6 — RECORDING DATA
  // ==========================================

  // Recording will be implemented later.

  let recordedLines = [];


  // ---------- RESET MEMBER RESULTS ----------

  function resetMemberResults() {

    recordedLines = [];

    members.forEach(function (member) {

      member.lines = [];
      member.totalSeconds = 0;
      member.percentage = 0;
    });

    // Remove any future winner state.

    if (classicLayout) {
      classicLayout.classList.remove("finished");
    }

    // Reset the Classic preview values.

    renderClassicMembers();
  }


  // ==========================================
  // SECTION 7 — LOAD MP3 FILE
  // ==========================================

  musicFile.addEventListener("change", function () {

    clearMusicError();

    const file = musicFile.files[0];

    if (!file) {
      return;
    }

    // ---------- ACCEPT MP3 ONLY ----------

    const isMP3 = /\.mp3$/i.test(file.name);

    if (!isMP3) {

      showMusicError("Please select an MP3 file only.");

      musicFile.value = "";

      return;
    }


    // ---------- STOP CURRENT MUSIC ----------

    musicAudio.pause();

    setMusicControlsEnabled(false);

    musicSeek.value = 0;

    musicCurrentTime.textContent = "0:00";
    musicDuration.textContent = "0:00";


    // ---------- CREATE MUSIC URL ----------

    const newMusicURL = URL.createObjectURL(file);

    const previousMusicURL = currentMusicURL;

    currentMusicURL = newMusicURL;

    musicAudio.src = newMusicURL;
    musicAudio.load();


    // ---------- RELEASE PREVIOUS MUSIC URL ----------

    if (previousMusicURL) {
      URL.revokeObjectURL(previousMusicURL);
    }


    // ---------- DISPLAY SONG NAME ----------

    musicTrackName.textContent = file.name.replace(
      /\.mp3$/i,
      ""
    );

    musicFile.value = "";

    updateMusicPlayButton();


    // ---------- RESET RECORDING RESULTS ----------

    resetMemberResults();
  });


  // ---------- MP3 METADATA LOADED ----------

  musicAudio.addEventListener(
    "loadedmetadata",
    function () {

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
    }
  );


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

        showMusicError(
          "Could not play this audio file."
        );
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

      const percentage =
        Number(musicSeek.value) / 100;

      musicAudio.currentTime =
        percentage * duration;

      updateMusicProgress();
    }
  });


  // ---------- MUSIC VOLUME ----------

  musicVolume.addEventListener("input", function () {

    musicAudio.volume =
      Number(musicVolume.value);
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


  // ==========================================
  // SECTION 8 — CLEAN UP FILE URLS
  // ==========================================

  window.addEventListener("pagehide", function () {

    // Release music URL.

    if (currentMusicURL) {

      URL.revokeObjectURL(currentMusicURL);

      currentMusicURL = null;
    }

    // Release member photo URLs.

    members.forEach(function (member) {

      if (member.photoURL) {

        URL.revokeObjectURL(member.photoURL);

        member.photoURL = null;
      }
    });
  });


  // ==========================================
  // SECTION 9 — RESTART ALL
  // ==========================================

  function restartAll() {

    if (!musicIsReady) {
      return;
    }

    // ---------- STOP SONG ----------

    musicAudio.pause();


    // ---------- REWIND SONG ----------

    musicAudio.currentTime = 0;


    // ---------- RESET MEMBER RESULTS ----------

    resetMemberResults();


    // ---------- UPDATE PLAYER ----------

    updateMusicProgress();
    updateMusicPlayButton();

    // Keep:
    // - selected MP3
    // - members
    // - member photos
    // - member colors
    // - keyboard shortcuts
    // - selected visual mode
  }


  // ---------- RESTART BUTTON ----------

  musicRestart.addEventListener(
    "click",
    restartAll
  );


  // ---------- RESTART KEYBOARD SHORTCUT ----------

  document.addEventListener("keydown", function (event) {

    // Prevent repeated activation.

    if (event.repeat) {
      return;
    }

    // Ignore Ctrl, Alt and Command combinations.

    if (
      event.ctrlKey ||
      event.altKey ||
      event.metaKey
    ) {
      return;
    }

    // Only inside the studio.

    if (studioScreen.hidden) {
      return;
    }

    // Ignore while Add Member pop-up is open.

    if (modal.classList.contains("open")) {
      return;
    }

    // Ignore while typing or using inputs.

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

    // The ~ / Backquote key.

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
  // SECTION 10 — FUTURE RECORDING SYSTEM
  // ==========================================

  // Next features:
  //
  // - Start Recording button
  // - Member shortcuts while recording
  // - Live seconds counters
  // - Progress bars and percentages
  // - Automatic ranking
  // - Finish Recording button
  // - Winner crown with member-color glow
  // - Visual Line Distribution layout
  // - Video export

});
