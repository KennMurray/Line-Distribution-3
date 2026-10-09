
document.addEventListener("DOMContentLoaded", function () {

  // ==========================================
  // SECTION 1 — WELCOME SCREEN
  // ==========================================

  const welcomeScreen = document.getElementById("welcome-screen");
  const studioScreen = document.getElementById("studio-screen");
  const modeForm = document.getElementById("mode-form");

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

  const shortcutInput = document.getElementById(
    "member-shortcut"
  );

  const shortcutError = document.getElementById(
    "shortcut-error"
  );

  const classicMembers = document.getElementById(
    "classic-members"
  );

  const classicLayout = document.getElementById(
    "classic-layout"
  );

  const members = [];
  const recordedLines = [];

  let selectedShortcut = "";


  // ---------- MEMBER ERRORS ----------

  function showError(message) {
    shortcutError.textContent = message;
    shortcutError.hidden = false;
  }

  function clearError() {
    shortcutError.textContent = "";
    shortcutError.hidden = true;
  }


  // ---------- MEMBER MODAL ----------

  function closeModal() {
    modal.classList.remove("open");
    clearError();
  }

  openButton.addEventListener("click", function () {
    modal.classList.add("open");
    nameInput.focus();
  });

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


  // ---------- MEMBER SHORTCUT SETUP ----------

  shortcutInput.addEventListener("keydown", function (event) {
    event.preventDefault();
    event.stopPropagation();

    const key = event.key.toUpperCase();

    if (key === "ESCAPE") {
      closeModal();
      return;
    }

    if (
      event.ctrlKey ||
      event.altKey ||
      event.metaKey ||
      !/^[A-Z0-9]$/.test(key)
    ) {
      showError(
        "Choose a single letter (A-Z) or number (0-9)."
      );
      return;
    }

    const alreadyAssigned = members.some(function (member) {
      return member.shortcut === key;
    });

    if (alreadyAssigned) {
      showError(
        "This key is already assigned to another member."
      );
      return;
    }

    selectedShortcut = key;
    shortcutInput.value = key;

    clearError();
  });


  // ==========================================
  // SECTION 3 — CLASSIC MEMBER ROWS
  // ==========================================

  function createClassicPhoto(member) {

    if (member.photoURL) {

      const image = document.createElement("img");

      image.className = "classic-photo";
      image.src = member.photoURL;
      image.alt = member.name;

      return image;
    }

    // Placeholder if no photo was uploaded.

    const placeholder = document.createElement("div");

    placeholder.className = "classic-photo";

    placeholder.textContent = member.name
      .charAt(0)
      .toUpperCase();

    placeholder.style.display = "flex";
    placeholder.style.alignItems = "center";
    placeholder.style.justifyContent = "center";

    placeholder.style.fontWeight = "bold";
    placeholder.style.fontSize = "20px";
    placeholder.style.color = member.color;

    return placeholder;
  }


  // ---------- CREATE CLASSIC ROW ----------

  function createClassicRow(member) {

    const row = document.createElement("div");

    row.className = "classic-member";

    row.style.setProperty(
      "--member-color",
      member.color
    );


    // ---------- CROWN ----------

    const crown = document.createElement("span");

    crown.className = "classic-crown";
    crown.textContent = "♕";

    crown.setAttribute("aria-hidden", "true");


    // ---------- PHOTO ----------

    const photo = createClassicPhoto(member);


    // ---------- INFORMATION ----------

    const info = document.createElement("div");
    info.className = "classic-info";

    const top = document.createElement("div");
    top.className = "classic-info-top";


    // ---------- NAME ----------

    const name = document.createElement("span");

    name.className = "classic-name";
    name.textContent = member.name;


    // ---------- SECONDS ----------

    const seconds = document.createElement("span");

    seconds.className = "classic-seconds";
    seconds.textContent = "0.0s";

    top.append(name, seconds);


    // ---------- PROGRESS BAR ----------

    const progress = document.createElement("div");

    progress.className = "classic-progress";

    const fill = document.createElement("div");

    fill.className = "classic-progress-fill";
    fill.style.width = "0%";

    progress.appendChild(fill);


    // ---------- PERCENTAGE ----------

    const percentage = document.createElement("span");

    percentage.className = "classic-percentage";
    percentage.textContent = "0%";


    // ---------- ASSEMBLE ROW ----------

    info.append(top, progress, percentage);

    row.append(crown, photo, info);


    // Save elements for real-time updates.

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
  // SECTION 4 — ANIMATED CLASSIC RANKING
  // ==========================================

  function sortClassicRanking() {

    if (!classicMembers || members.length < 2) {
      return;
    }

    // Sort by TOTAL singing time.
    // If times are equal, keep original member order.

    const ranking = members.slice().sort(function (a, b) {

      const difference =
        b.totalSeconds - a.totalSeconds;

      if (Math.abs(difference) < 0.005) {
        return members.indexOf(a) - members.indexOf(b);
      }

      return difference;
    });


    // Check if the ranking actually changed.

    const currentRows = Array.from(
      classicMembers.children
    );

    const unchanged = ranking.every(function (member, index) {
      return currentRows[index] === member.classicUI.row;
    });

    if (unchanged) {
      return;
    }


    // ---------- FIRST: OLD POSITIONS ----------

    const before = new Map();

    currentRows.forEach(function (row) {

      // Cancel previous ranking movement if necessary.

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


    // ---------- MOVE ROWS INTO NEW ORDER ----------

    // We move existing elements rather than
    // rebuilding them, so photos and timers stay intact.

    ranking.forEach(function (member) {
      classicMembers.appendChild(member.classicUI.row);
    });


    // ---------- CHECK REDUCED MOTION ----------

    const reducedMotion =
      window.matchMedia &&
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

    if (reducedMotion) {
      return;
    }


    // ---------- ANIMATE NEW POSITIONS ----------

    ranking.forEach(function (member) {

      const row = member.classicUI.row;

      const oldTop = before.get(row);
      const newTop = row.getBoundingClientRect().top;

      const distance = oldTop - newTop;

      if (
        Math.abs(distance) < 1 ||
        typeof row.animate !== "function"
      ) {
        return;
      }

      // Smooth movement:
      // old position -> new position.

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
  // SECTION 5 — UPDATE CLASSIC VALUES
  // ==========================================

  function updateClassicValues() {

    members.forEach(function (member) {

      const ui = member.classicUI;

      if (!ui) return;


      // ---------- SECONDS ----------

      ui.seconds.textContent =
        member.totalSeconds.toFixed(1) + "s";


      // ---------- PERCENTAGES ----------

      ui.percentage.textContent =
        member.percentage === 0
          ? "0%"
          : member.percentage.toFixed(1) + "%";


      // ---------- PROGRESS BAR ----------

      ui.fill.style.width =
        Math.max(
          0,
          Math.min(100, member.percentage)
        ) + "%";


      // ---------- ACTIVE SINGER GLOW ----------

      // Glow is applied to photo and bar only,
      // not to the whole member row.

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


    // Check the ranking after updating the results.

    sortClassicRanking();
  }


  // ==========================================
  // SECTION 6 — SAVE MEMBER
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

    const duplicate = members.some(function (member) {
      return member.shortcut === selectedShortcut;
    });

    if (duplicate) {

      showError("This key is already assigned.");

      return;
    }


    // ---------- MEMBER PHOTO ----------

    const photoURL = photo
      ? URL.createObjectURL(photo)
      : null;


    // ---------- MEMBER DATA ----------

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


    // ---------- MEMBER CARD ----------

    const card = document.createElement("div");

    card.className = "member-card";

    card.style.setProperty(
      "--member-color",
      color
    );

    if (photoURL) {

      const img = document.createElement("img");

      img.src = photoURL;
      img.alt = name;

      card.appendChild(img);
    }


    // ---------- MEMBER NAME ----------

    const title = document.createElement("p");

    title.textContent = name;


    // ---------- MEMBER SHORTCUT ----------

    const badge = document.createElement("span");

    badge.className = "member-shortcut";

    badge.textContent =
      "Key: " + selectedShortcut;


    // ---------- COMPLETE MEMBER CARD ----------

    card.append(title, badge);

    memberList.appendChild(card);


    // ---------- UPDATE CLASSIC PREVIEW ----------

    renderClassicMembers();
    updateAllResults();


    // ---------- RESET FORM ----------

    memberForm.reset();

    selectedShortcut = "";

    closeModal();
  });


  // ==========================================
  // SECTION 7 — MUSIC PLAYER
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


  // ---------- PLAY BUTTON ----------

  function updateMusicPlayButton() {

    musicToggle.textContent = musicAudio.paused
      ? "▶ Play"
      : "⏸ Pause";
  }


  // ---------- SONG PROGRESS ----------

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
  // SECTION 8 — RECORDING PANEL
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


  // ---------- PANEL HEADING ----------

  const heading = document.createElement("h2");

  heading.textContent = "RECORDING SYSTEM";

  heading.style.cssText =
    "color:#ff80c8;margin-top:0";


  // ---------- BUTTON CONTAINER ----------

  const buttonRow = document.createElement("div");

  buttonRow.style.cssText = [
    "display:flex",
    "justify-content:center",
    "gap:12px",
    "flex-wrap:wrap"
  ].join(";");


  // ---------- START RECORDING ----------

  const startButton = document.createElement("button");

  startButton.type = "button";
  startButton.id = "start-recording";

  startButton.textContent = "● Start Recording";


  // ---------- FINISH RECORDING ----------

  const finishButton = document.createElement("button");

  finishButton.type = "button";
  finishButton.id = "finish-recording";

  finishButton.textContent = "■ Finish Recording";


  // ---------- RECORDING STATUS ----------

  const status = document.createElement("p");

  status.id = "recording-status";
  status.style.color = "#c7c7d0";


  // ---------- ASSEMBLE PANEL ----------

  buttonRow.append(startButton, finishButton);

  panel.append(heading, buttonRow, status);


  // Add panel below Music Player.

  document.querySelector(".music-player")
    .insertAdjacentElement("afterend", panel);


  // ==========================================
  // SECTION 9 — RECORDING STATE
  // ==========================================

  // idle
  // recording
  // awaitingFinish
  // finished

  let recordingState = "idle";

  let animationFrameId = null;


  // ---------- ENABLE / DISABLE BUTTONS ----------

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
  }


  // ---------- RECORDING STATUS ----------

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
  // SECTION 10 — LIVE RECORDING RESULTS
  // ==========================================

  function updateAllResults() {

    const now = musicAudio.currentTime || 0;

    let combined = 0;


    // ---------- MEMBER SECONDS ----------

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


    // ---------- MEMBER PERCENTAGES ----------

    // Overlapping vocals are counted separately.

    members.forEach(function (member) {

      member.percentage = combined > 0
        ? member.totalSeconds / combined * 100
        : 0;
    });


    // ---------- UPDATE CLASSIC ----------

    updateClassicValues();
  }


  // ==========================================
  // SECTION 11 — LIVE TIMER
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
  // SECTION 12 — MEMBER KEY TOGGLE
  // ==========================================

  function toggleMemberLine(member) {

    if (
      recordingState !== "recording" ||
      musicAudio.paused
    ) {
      return;
    }

    const now = musicAudio.currentTime;


    // ---------- END MEMBER LINE ----------

    if (member.activeLine !== null) {

      member.activeLine.end = now;

      member.activeLine = null;

    } else {

      // ---------- START MEMBER LINE ----------

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


  // ---------- CLOSE ALL ACTIVE LINES ----------

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
  // SECTION 13 — START RECORDING
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


    // Remove focus from the Start button,
    // so member shortcuts work immediately.

    startButton.blur();


    // ---------- START MUSIC ----------

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
  // SECTION 14 — FINISH RECORDING
  // ==========================================

  function finishRecording() {

    if (
      recordingState !== "recording" &&
      recordingState !== "awaitingFinish"
    ) {
      return;
    }


    // ---------- SAVE ACTIVE LINES ----------

    closeAllActiveLines(musicAudio.currentTime);

    recordingState = "finished";

    stopTimer();

    musicAudio.pause();

    updateAllResults();


    // ---------- FIND WINNER ----------

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


    // ---------- SHOW WINNER CROWN ----------

    if (classicLayout) {

      classicLayout.classList.add("finished");
    }

    members.forEach(function (member) {

      if (member.classicUI) {

        member.classicUI.row.classList.toggle(
          "winner",
          member === winner
        );
      }
    });

    updateButtons();
    updateStatus();
    updateMusicPlayButton();
  }

  finishButton.addEventListener("click", finishRecording);


  // ==========================================
  // SECTION 15 — RESET RECORDING
  // ==========================================

  function resetRecording() {

    stopTimer();

    recordingState = "idle";

    recordedLines.length = 0;


    // ---------- RESET MEMBERS ----------

    members.forEach(function (member) {

      member.lines = [];
      member.activeLine = null;

      member.totalSeconds = 0;
      member.percentage = 0;

      if (member.classicUI) {

        member.classicUI.row.classList.remove("winner");
      }
    });


    // ---------- HIDE CROWN ----------

    if (classicLayout) {

      classicLayout.classList.remove("finished");
    }


    // ---------- UPDATE UI ----------

    updateAllResults();

    updateButtons();
    updateStatus();
  }


  // ==========================================
  // SECTION 16 — RESTART ALL (~)
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
  // SECTION 17 — LOAD MP3
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


    // ---------- RESET PREVIOUS RECORDING ----------

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


    // ---------- DISPLAY SONG NAME ----------

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


  // ---------- MP3 METADATA ----------

  musicAudio.addEventListener("loadedmetadata", function () {

    musicIsReady =
      Number.isFinite(musicAudio.duration) &&
      musicAudio.duration > 0;

    if (!musicIsReady) {

      showMusicError(
        "Could not read this MP3 file's duration."
      );

    } else {

      clearMusicError();
    }

    updateMusicProgress();

    updateButtons();
    updateStatus();
  });


  // ==========================================
  // SECTION 18 — MUSIC PLAY / PAUSE
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


  // ---------- MUSIC SEEK ----------

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


  // ---------- MUSIC VOLUME ----------

  musicVolume.addEventListener("input", function () {

    musicAudio.volume =
      Number(musicVolume.value);
  });

  musicAudio.volume = Number(musicVolume.value);


  // ==========================================
  // SECTION 19 — AUDIO EVENTS
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


  // ---------- AUDIO PLAY ----------

  musicAudio.addEventListener("play", function () {

    updateMusicPlayButton();

    updateStatus();
    startTimer();
  });


  // ---------- AUDIO PAUSE ----------

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
  // SECTION 20 — KEYBOARD SHORTCUTS
  // ==========================================

  document.addEventListener("keydown", function (event) {

    // Ignore repeated keys and combinations.

    if (
      event.repeat ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey
    ) {
      return;
    }

    if (studioScreen.hidden) return;

    if (modal.classList.contains("open")) return;


    // Do not activate shortcuts while editing inputs.

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


    // ---------- MEMBER SHORTCUTS ----------

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
  // SECTION 21 — CLEANUP
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
  // SECTION 22 — INITIAL STATE
  // ==========================================

  updateMusicPlayButton();
  updateMusicProgress();

  updateButtons();
  updateStatus();

});
