
document.addEventListener("DOMContentLoaded", function () {

  // ==========================================
  // SECTION 1 — WELCOME SCREEN
  // ==========================================

  const welcomeScreen = document.getElementById("welcome-screen");
  const studioScreen = document.getElementById("studio-screen");
  const modeForm = document.getElementById("mode-form");

  let selectedVisualMode = null;

  modeForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const selected = modeForm.querySelector(
      'input[name="visual-mode"]:checked'
    );

    if (!selected) return;

    selectedVisualMode = selected.value;
    studioScreen.dataset.visualMode = selectedVisualMode;

    welcomeScreen.hidden = true;
    studioScreen.hidden = false;

    window.scrollTo(0, 0);
  });


  // ==========================================
  // SECTION 2 — MEMBER SETUP
  // ==========================================

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

  const members = [];
  const recordedLines = [];

  let selectedShortcut = "";

  function showError(message) {
    shortcutError.textContent = message;
    shortcutError.hidden = false;
  }

  function clearError() {
    shortcutError.textContent = "";
    shortcutError.hidden = true;
  }

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
    if (event.target === modal) closeModal();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeModal();
  });


  // ---------- CHOOSE MEMBER SHORTCUT ----------

  shortcutInput.addEventListener("keydown", function (event) {
    event.preventDefault();
    event.stopPropagation();

    const key = event.key.toUpperCase();

    if (key === "ESCAPE") {
      closeModal();
      return;
    }

    if (
      key.length !== 1 ||
      !/^[A-Z0-9]$/.test(key)
    ) {
      showError("Choose a letter (A-Z) or number (0-9).");
      return;
    }

    if (event.ctrlKey || event.altKey || event.metaKey) {
      showError("Choose a key without Ctrl, Alt or Command.");
      return;
    }

    if (members.some(function (member) {
      return member.shortcut === key;
    })) {
      showError("This key is already assigned.");
      return;
    }

    selectedShortcut = key;
    shortcutInput.value = key;

    clearError();
  });


  // ==========================================
  // SECTION 3 — CLASSIC LAYOUT
  // ==========================================

  function createClassicPhoto(member) {

    if (member.photoURL) {
      const image = document.createElement("img");

      image.className = "classic-photo";
      image.src = member.photoURL;
      image.alt = member.name;

      return image;
    }

    const placeholder = document.createElement("div");

    placeholder.className = "classic-photo";
    placeholder.textContent = member.name.charAt(0).toUpperCase();

    placeholder.style.display = "flex";
    placeholder.style.alignItems = "center";
    placeholder.style.justifyContent = "center";
    placeholder.style.boxSizing = "border-box";
    placeholder.style.color = member.color;
    placeholder.style.fontSize = "20px";
    placeholder.style.fontWeight = "bold";

    return placeholder;
  }


  // ---------- CREATE ONE CLASSIC ROW ----------

  function createClassicMemberRow(member) {

    const row = document.createElement("div");

    row.className = "classic-member";
    row.style.setProperty("--member-color", member.color);

    // Crown on the LEFT of the photo.

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

    const name = document.createElement("span");
    name.className = "classic-name";
    name.textContent = member.name;

    const seconds = document.createElement("span");
    seconds.className = "classic-seconds";
    seconds.textContent = "0.0s";

    top.appendChild(name);
    top.appendChild(seconds);

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

    info.appendChild(top);
    info.appendChild(progress);
    info.appendChild(percentage);

    row.appendChild(crown);
    row.appendChild(photo);
    row.appendChild(info);

    // Save references for live updates.
    // This avoids rebuilding the whole row every frame.

    member.classicUI = {
      row: row,
      seconds: seconds,
      fill: fill,
      percentage: percentage
    };

    return row;
  }


  // ---------- DISPLAY CLASSIC MEMBERS ----------

  function renderClassicMembers() {

    if (!classicMembers) return;

    classicMembers.replaceChildren();

    const fragment = document.createDocumentFragment();

    members.forEach(function (member) {
      fragment.appendChild(createClassicMemberRow(member));
    });

    classicMembers.appendChild(fragment);
  }


  // ---------- UPDATE CLASSIC VALUES ----------

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

      // Temporary active member highlight.
      // Animated ranking will be added later.

      if (
        member.activeLine &&
        recordingState === "recording"
      ) {
        ui.row.style.boxShadow =
          "0 0 12px " + member.color + "55";
      } else {
        ui.row.style.boxShadow = "";
      }
    });
  }


  // ==========================================
  // SECTION 4 — SAVE MEMBER
  // ==========================================

  memberForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (members.length >= 20) {
      showError("You cannot add more members.");
      return;
    }

    const name = nameInput.value.trim();
    const color = colorInput.value;
    const photo = imageInput.files[0];

    if (!name) return;

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

    const photoURL = photo
      ? URL.createObjectURL(photo)
      : null;

    const member = {
      name: name,
      color: color,
      shortcut: selectedShortcut,
      photoURL: photoURL,

      lines: [],
      activeLine: null,

      totalSeconds: 0,
      percentage: 0,

      classicUI: null
    };

    members.push(member);

    // Member card under the Music Player

    const card = document.createElement("div");
    card.className = "member-card";
    card.style.setProperty("--member-color", color);

    if (photoURL) {
      const image = document.createElement("img");

      image.src = photoURL;
      image.alt = name;

      card.appendChild(image);
    }

    const memberName = document.createElement("p");
    memberName.textContent = name;

    const badge = document.createElement("span");
    badge.className = "member-shortcut";
    badge.textContent = "Key: " + selectedShortcut;

    card.appendChild(memberName);
    card.appendChild(badge);

    memberList.appendChild(card);

    // Update Classic preview

    renderClassicMembers();
    updateAllResults();

    // Reset form

    memberForm.reset();
    selectedShortcut = "";

    closeModal();
  });


  // ==========================================
  // SECTION 5 — MUSIC PLAYER
  // ==========================================

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

  let currentMusicURL = null;
  let musicIsReady = false;

  musicRestart.textContent = "↺ Restart All (~)";


  // ---------- MUSIC ERRORS ----------

  function showMusicError(message) {
    musicError.textContent = message;
    musicError.hidden = false;
  }

  function clearMusicError() {
    musicError.textContent = "";
    musicError.hidden = true;
  }


  // ---------- FORMAT MUSIC TIME ----------

  function formatMusicTime(seconds) {

    if (!Number.isFinite(seconds) || seconds < 0) {
      return "0:00";
    }

    const total = Math.floor(seconds);

    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const remaining = total % 60;

    if (hours > 0) {
      return (
        hours + ":" +
        String(minutes).padStart(2, "0") + ":" +
        String(remaining).padStart(2, "0")
      );
    }

    return minutes + ":" + String(remaining).padStart(2, "0");
  }


  function updateMusicPlayButton() {
    musicToggle.textContent = musicAudio.paused
      ? "▶ Play"
      : "⏸ Pause";
  }


  function updateMusicProgress() {

    const current = musicAudio.currentTime;
    const duration = musicAudio.duration;

    musicCurrentTime.textContent = formatMusicTime(current);

    if (Number.isFinite(duration) && duration > 0) {
      musicSeek.value = Math.min(
        100,
        Math.max(0, current / duration * 100)
      );

      musicDuration.textContent = formatMusicTime(duration);

    } else {
      musicSeek.value = 0;
      musicDuration.textContent = "0:00";
    }
  }


  // ==========================================
  // SECTION 6 — RECORDING CONTROLS
  // ==========================================

  // Add recording buttons automatically.
  // No index.html changes are required.

  const recordingPanel = document.createElement("section");

  recordingPanel.id = "recording-controls";

  recordingPanel.style.cssText = [
    "max-width:960px",
    "margin:24px auto",
    "padding:20px",
    "background:#1c1c28",
    "border:1px solid #393543",
    "border-radius:14px",
    "text-align:center"
  ].join(";");

  const recordingHeading = document.createElement("h2");

  recordingHeading.textContent = "RECORDING SYSTEM";
  recordingHeading.style.color = "#ff80c8";
  recordingHeading.style.marginTop = "0";

  const recordingButtons = document.createElement("div");

  recordingButtons.style.cssText = [
    "display:flex",
    "justify-content:center",
    "gap:12px",
    "flex-wrap:wrap"
  ].join(";");

  const startRecordingButton = document.createElement("button");

  startRecordingButton.id = "start-recording";
  startRecordingButton.type = "button";
  startRecordingButton.textContent = "● Start Recording";

  const finishRecordingButton = document.createElement("button");

  finishRecordingButton.id = "finish-recording";
  finishRecordingButton.type = "button";
  finishRecordingButton.textContent = "■ Finish Recording";

  const recordingStatus = document.createElement("p");

  recordingStatus.id = "recording-status";
  recordingStatus.style.color = "#c7c7d0";
  recordingStatus.textContent = "Upload an MP3 to begin.";

  recordingButtons.appendChild(startRecordingButton);
  recordingButtons.appendChild(finishRecordingButton);

  recordingPanel.appendChild(recordingHeading);
  recordingPanel.appendChild(recordingButtons);
  recordingPanel.appendChild(recordingStatus);

  // Put controls immediately after the Music Player.

  document.querySelector(".music-player").insertAdjacentElement(
    "afterend",
    recordingPanel
  );


  // ==========================================
  // SECTION 7 — RECORDING STATE
  // ==========================================

  // idle          = no recording yet
  // recording     = currently recording lines
  // awaitingFinish = song ended, results saved
  // finished      = final results confirmed

  let recordingState = "idle";

  let animationFrameId = null;


  // ---------- REFRESH BUTTON STATES ----------

  function updateRecordingButtons() {

    startRecordingButton.disabled =
      !musicIsReady || recordingState !== "idle";

    finishRecordingButton.disabled =
      recordingState !== "recording" &&
      recordingState !== "awaitingFinish";

    musicToggle.disabled =
      !musicIsReady ||
      recordingState === "awaitingFinish";

    musicRestart.disabled = !musicIsReady;

    // Seeking during active recording would break
    // the timing of saved intervals, so disable it.

    musicSeek.disabled =
      !musicIsReady ||
      recordingState === "recording" ||
      recordingState === "awaitingFinish";
  }


  // ---------- REFRESH RECORDING STATUS ----------

  function updateRecordingStatus() {

    if (recordingState === "idle") {

      recordingStatus.textContent = musicIsReady
        ? "Ready! Press Start Recording."
        : "Upload an MP3 to begin.";

      return;
    }

    if (recordingState === "awaitingFinish") {

      recordingStatus.textContent =
        "Song ended. Click Finish Recording to confirm results.";

      return;
    }

    if (recordingState === "finished") {

      recordingStatus.textContent =
        "Recording finished! Final results are ready.";

      return;
    }

    const active = members.filter(function (member) {
      return member.activeLine !== null;
    });

    if (musicAudio.paused) {

      recordingStatus.textContent =
        "Recording paused. Press Play to continue.";

    } else if (active.length === 0) {

      recordingStatus.textContent =
        "Recording... Press a member's assigned key.";

    } else {

      recordingStatus.textContent =
        "Recording: " +
        active.map(function (member) {
          return member.name;
        }).join(", ");
    }
  }


  // ==========================================
  // SECTION 8 — RECORDING TIMERS
  // ==========================================

  // Each member owns their own singing intervals.
  //
  // Example:
  // Karina: 10s–20s
  // Winter: 15s–23s
  //
  // Both receive credit for the overlapping time.

  function updateAllResults() {

    const now = musicAudio.currentTime || 0;

    let combinedSeconds = 0;

    // Calculate the duration of each member's lines.

    members.forEach(function (member) {

      let total = 0;

      member.lines.forEach(function (line) {

        const end = line.end === null
          ? now
          : line.end;

        total += Math.max(0, end - line.start);
      });

      member.totalSeconds = total;
      combinedSeconds += total;
    });

    // Percentages use the TOTAL credited singing time.
    // This includes overlapping vocal parts.

    members.forEach(function (member) {

      member.percentage = combinedSeconds > 0
        ? member.totalSeconds / combinedSeconds * 100
        : 0;
    });

    updateClassicValues();
  }


  // ---------- LIVE UPDATE LOOP ----------

  function stopTimerLoop() {

    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function timerTick() {

    animationFrameId = null;

    updateAllResults();

    if (
      recordingState === "recording" &&
      !musicAudio.paused
    ) {
      animationFrameId = requestAnimationFrame(timerTick);
    }
  }

  function startTimerLoop() {

    if (animationFrameId !== null) return;

    if (
      recordingState !== "recording" ||
      musicAudio.paused
    ) {
      return;
    }

    animationFrameId = requestAnimationFrame(timerTick);
  }


  // ==========================================
  // SECTION 9 — MEMBER KEY TOGGLE
  // ==========================================

  function toggleMemberLine(member) {

    if (recordingState !== "recording") return;

    // Only register a new change while song is playing.

    if (musicAudio.paused) return;

    const now = musicAudio.currentTime;

    // ---------- STOP MEMBER ----------

    if (member.activeLine !== null) {

      member.activeLine.end = now;

      member.activeLine = null;

    } else {

      // ---------- START MEMBER ----------

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
    updateRecordingStatus();
  }


  // ---------- CLOSE EVERY ACTIVE LINE ----------

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
  // SECTION 10 — START RECORDING
  // ==========================================

  async function startRecording() {

    if (!musicIsReady) return;
    if (recordingState !== "idle") return;

    if (members.length === 0) {

      recordingStatus.textContent =
        "Add at least one member before recording.";

      return;
    }

    clearMusicError();

    recordingState = "recording";

    updateRecordingButtons();

    // Start the MP3 when recording starts.

    try {

      await musicAudio.play();

      updateRecordingStatus();
      startTimerLoop();

    } catch (error) {

      recordingState = "idle";

      stopTimerLoop();
      updateRecordingButtons();
      updateRecordingStatus();

      showMusicError(
        "Could not start the music. Please try again."
      );
    }
  }

  startRecordingButton.addEventListener(
    "click",
    startRecording
  );


  // ==========================================
  // SECTION 11 — FINISH RECORDING
  // ==========================================

  function finishRecording() {

    if (
      recordingState !== "recording" &&
      recordingState !== "awaitingFinish"
    ) {
      return;
    }

    // Save every currently active singer.

    closeAllActiveLines(musicAudio.currentTime);

    recordingState = "finished";

    stopTimerLoop();
    musicAudio.pause();

    updateAllResults();

    // ---------- FIND THE WINNER ----------

    let winner = null;

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

    // Show the prepared crown on the winning row.

    if (classicLayout) {

      classicLayout.classList.add("finished");

      members.forEach(function (member) {

        if (member.classicUI) {

          member.classicUI.row.classList.toggle(
            "winner",
            member === winner
          );
        }
      });
    }

    updateRecordingButtons();
    updateRecordingStatus();
    updateMusicPlayButton();
  }

  finishRecordingButton.addEventListener(
    "click",
    finishRecording
  );


  // ==========================================
  // SECTION 12 — RESET RECORDING
  // ==========================================

  function resetMemberResults() {

    stopTimerLoop();

    recordingState = "idle";

    recordedLines.length = 0;

    members.forEach(function (member) {

      member.lines = [];
      member.activeLine = null;

      member.totalSeconds = 0;
      member.percentage = 0;

      if (member.classicUI) {
        member.classicUI.row.classList.remove("winner");
      }
    });

    if (classicLayout) {
      classicLayout.classList.remove("finished");
    }

    updateAllResults();
    updateRecordingButtons();
    updateRecordingStatus();
  }


  // ==========================================
  // SECTION 13 — LOAD MP3
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

    // Reset previous recording before loading new music.

    resetMemberResults();

    musicIsReady = false;
    updateRecordingButtons();

    musicSeek.value = 0;
    musicCurrentTime.textContent = "0:00";
    musicDuration.textContent = "0:00";

    const newURL = URL.createObjectURL(file);
    const previousURL = currentMusicURL;

    currentMusicURL = newURL;

    musicAudio.src = newURL;
    musicAudio.load();

    if (previousURL) {
      URL.revokeObjectURL(previousURL);
    }

    musicTrackName.textContent = file.name.replace(
      /\.mp3$/i,
      ""
    );

    musicFile.value = "";

    updateMusicPlayButton();
    updateRecordingStatus();
  });


  // ---------- MP3 METADATA ----------

  musicAudio.addEventListener("loadedmetadata", function () {

    const duration = musicAudio.duration;

    if (Number.isFinite(duration) && duration > 0) {

      musicIsReady = true;
      clearMusicError();

    } else {

      musicIsReady = false;

      showMusicError(
        "Could not read this MP3 file's duration."
      );
    }

    updateMusicProgress();
    updateRecordingButtons();
    updateRecordingStatus();
  });


  // ==========================================
  // SECTION 14 — PLAYBACK
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

    if (!musicIsReady || musicSeek.disabled) return;

    const duration = musicAudio.duration;

    if (Number.isFinite(duration) && duration > 0) {

      musicAudio.currentTime =
        Number(musicSeek.value) / 100 * duration;

      updateMusicProgress();
    }
  });


  // ---------- VOLUME ----------

  musicVolume.addEventListener("input", function () {

    musicAudio.volume = Number(musicVolume.value);
  });

  musicAudio.volume = Number(musicVolume.value);


  // ---------- AUDIO EVENTS ----------

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
    updateRecordingStatus();
    startTimerLoop();
  });

  musicAudio.addEventListener("pause", function () {

    stopTimerLoop();

    updateAllResults();
    updateMusicPlayButton();
    updateRecordingStatus();
  });


  // ---------- SONG FINISHED ----------

  musicAudio.addEventListener("ended", function () {

    if (recordingState === "recording") {

      closeAllActiveLines(musicAudio.duration);

      recordingState = "awaitingFinish";

      stopTimerLoop();
      updateAllResults();

      updateRecordingButtons();
      updateRecordingStatus();
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
      stopTimerLoop();
      updateAllResults();
    }

    updateRecordingButtons();
    updateMusicPlayButton();

    showMusicError(
      "This MP3 file could not be loaded. Please try another file."
    );
  });


  // ==========================================
  // SECTION 15 — RESTART ALL (~)
  // ==========================================

  function restartAll() {

    if (!musicIsReady) return;

    musicAudio.pause();
    musicAudio.currentTime = 0;

    resetMemberResults();

    updateMusicProgress();
    updateMusicPlayButton();

    // Keep:
    // - MP3
    // - members and photos
    // - colors
    // - shortcuts
    // - selected Visual / Classic mode
  }

  musicRestart.addEventListener("click", restartAll);


  // ==========================================
  // SECTION 16 — KEYBOARD CONTROLS
  // ==========================================

  document.addEventListener("keydown", function (event) {

    if (event.repeat) return;

    if (
      event.ctrlKey ||
      event.altKey ||
      event.metaKey
    ) {
      return;
    }

    if (studioScreen.hidden) return;

    if (modal.classList.contains("open")) return;

    const target = event.target;

    if (
      target instanceof Element &&
      (
        target.closest("input, textarea, select, button") ||
        target.isContentEditable
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


    // ---------- MEMBER RECORDING KEYS ----------

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
  // SECTION 17 — CLEAN UP FILE URLS
  // ==========================================

  window.addEventListener("pagehide", function () {

    stopTimerLoop();

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
  // SECTION 18 — INITIAL STATE
  // ==========================================

  updateMusicPlayButton();
  updateMusicProgress();

  updateRecordingButtons();
  updateRecordingStatus();


  // ==========================================
  // FUTURE FEATURES
  // ==========================================

  // - Animated Classic ranking
  // - Automatic scaling for larger groups
  // - Visual Line Distribution member rings
  // - Visual Zoom In / Zoom Out
  // - Recording timeline editing
  // - Video export

});
