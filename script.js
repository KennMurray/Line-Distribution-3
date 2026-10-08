
document.addEventListener("DOMContentLoaded", function () {

  // ==========================================
  // SECTION 1 — ADD MEMBER SYSTEM
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

  // ---------- KEYBOARD SHORTCUT SETUP ----------

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

    if (!name) return;

    if (!selectedShortcut) {
      showError("Choose a keyboard shortcut first.");
      shortcutInput.focus();
      return;
    }

    if (members.some(member => member.shortcut === selectedShortcut)) {
      showError("This key is already assigned.");
      return;
    }

    const member = {
      name: name,
      color: color,
      shortcut: selectedShortcut
    };

    members.push(member);

    // ---------- MEMBER CARD ----------

    const card = document.createElement("div");
    card.className = "member-card";
    card.style.setProperty("--member-color", color);

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

    const memberName = document.createElement("p");
    memberName.textContent = name;

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
  // SECTION 2 — MUSIC PLAYER
  // ==========================================

  // ---------- MUSIC PLAYER ELEMENTS ----------

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

  // ---------- MUSIC PLAYER ERROR MESSAGES ----------

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

    const paddedSeconds = String(remainingSeconds).padStart(2, "0");

    if (hours > 0) {
      return (
        hours + ":" +
        String(minutes).padStart(2, "0") + ":" +
        paddedSeconds
      );
    }

    return minutes + ":" + paddedSeconds;
  }

  // ---------- ENABLE / DISABLE MUSIC CONTROLS ----------

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

  // ---------- UPDATE SONG PROGRESS ----------

  function updateMusicProgress() {
    const currentTime = musicAudio.currentTime;
    const duration = musicAudio.duration;

    musicCurrentTime.textContent = formatMusicTime(currentTime);

    if (Number.isFinite(duration) && duration > 0) {
      const progress = (currentTime / duration) * 100;

      musicSeek.value = Math.min(100, Math.max(0, progress));
      musicDuration.textContent = formatMusicTime(duration);
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

  // ---------- UPLOAD MP3 FILE ----------

  musicFile.addEventListener("change", function () {
    clearMusicError();

    const file = musicFile.files[0];

    if (!file) {
      return;
    }

    // Accept MP3 extension only.
    // The browser will also check whether
    // the selected file can actually play.

    const isMP3 = /\.mp3$/i.test(file.name);

    if (!isMP3) {
      showMusicError("Please select an MP3 file only.");
      musicFile.value = "";
      return;
    }

    // Pause previous song before switching.

    musicAudio.pause();

    setMusicControlsEnabled(false);

    musicSeek.value = 0;
    musicCurrentTime.textContent = "0:00";
    musicDuration.textContent = "0:00";

    // Create local URL for selected song.

    const newMusicURL = URL.createObjectURL(file);
    const previousMusicURL = currentMusicURL;

    currentMusicURL = newMusicURL;

    musicAudio.src = newMusicURL;
    musicAudio.load();

    // Release previous audio file from memory.

    if (previousMusicURL) {
      URL.revokeObjectURL(previousMusicURL);
    }

    // Display song filename without .mp3.

    musicTrackName.textContent = file.name.replace(/\.mp3$/i, "");

    // Allow selecting the same file again.

    musicFile.value = "";

    updateMusicPlayButton();
  });

  // ---------- SONG METADATA LOADED ----------

  musicAudio.addEventListener("loadedmetadata", function () {
    const duration = musicAudio.duration;

    if (Number.isFinite(duration) && duration > 0) {
      setMusicControlsEnabled(true);
      clearMusicError();
    } else {
      setMusicControlsEnabled(false);
      showMusicError("Could not read this MP3 file's duration.");
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

  // ---------- RESTART SONG ----------

  musicRestart.addEventListener("click", function () {
    if (!musicIsReady) {
      return;
    }

    musicAudio.currentTime = 0;
    updateMusicProgress();
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

  musicAudio.addEventListener("timeupdate", updateMusicProgress);

  musicAudio.addEventListener("durationchange", function () {
    updateMusicProgress();
  });

  musicAudio.addEventListener("play", updateMusicPlayButton);
  musicAudio.addEventListener("pause", updateMusicPlayButton);

  musicAudio.addEventListener("ended", function () {
    updateMusicPlayButton();
    updateMusicProgress();
  });

  // ---------- AUDIO LOADING ERROR ----------

  musicAudio.addEventListener("error", function () {
    setMusicControlsEnabled(false);

    updateMusicPlayButton();

    showMusicError(
      "This MP3 file could not be loaded. Please try another file."
    );
  });

  // ---------- CLEAN UP AUDIO URL ----------

  window.addEventListener("pagehide", function () {
    if (currentMusicURL) {
      URL.revokeObjectURL(currentMusicURL);
      currentMusicURL = null;
    }
  });


  // ==========================================
  // SECTION 3 — RECORDING SYSTEM
  // Coming in the next development stage.
  // ==========================================

});
