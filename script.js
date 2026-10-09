
  // ====================================================
  // LIVE PREVIEW + BACK TO SELECTION (NO MP3 REQUIRED)
  // ====================================================

  addCSS(`
    #studio-screen .studio-header {
      position: relative;
    }

    #return-to-selection {
      display: block;
      margin: 0 0 14px;
      padding: 10px 14px;
      font-size: 12px;
      color: white;
      background: #292638;
      border: 1px solid var(--accent, #ff80c8);
    }

    #return-to-selection:disabled,
    #reset-live-preview:disabled {
      opacity: .45;
      cursor: not-allowed;
    }

    #reset-live-preview {
      display: block;
      width: 100%;
      margin: 0 0 10px;
      padding: 11px 8px;
      font-size: 12px;
      color: white;
      background: #51405a;
      border: 1px solid var(--accent, #ff80c8);
      border-radius: 9px;
    }
  `);

  // BACK TO SELECTION

  const backToSelection = document.createElement('button');

  backToSelection.id = 'return-to-selection';
  backToSelection.type = 'button';
  backToSelection.textContent = '← Back to Selection';

  studio.querySelector('.studio-header').prepend(
    backToSelection
  );

  // RESET PREVIEW

  const previewResetButton = document.createElement('button');

  previewResetButton.id = 'reset-live-preview';
  previewResetButton.type = 'button';
  previewResetButton.textContent = '↺ Reset Preview';

  const quickActions = $('studio-side-tools');

  if (quickActions) {
    restartButton.before(previewResetButton);

    const notes = quickActions.querySelectorAll(
      '.studio-side-note'
    );

    if (notes.length) {
      notes[notes.length - 1].textContent =
        'Press member shortcuts to test without MP3. Reset Preview clears test seconds.';
    }
  } else {
    recordingPanel.append(previewResetButton);
  }

  // LIVE PREVIEW DATA
  // Separate from real recorded MP3 lines.

  const previewStore = new WeakMap();

  const previewData = member => {
    if (!previewStore.has(member)) {
      previewStore.set(member, {
        seconds: 0,
        started: null
      });
    }

    return previewStore.get(member);
  };

  const previewRunning = () =>
    recording === 'idle' &&
    members.some(member =>
      previewData(member).started !== null
    );

  // LIVE PREVIEW RESULTS

  const originalUpdateResults = updateResults;

  updateResults = function () {
    if (recording !== 'idle') {
      originalUpdateResults();
      return;
    }

    const now = performance.now();
    let total = 0;

    members.forEach(member => {
      const preview = previewData(member);

      const elapsed = preview.started === null
        ? 0
        : Math.max(
            0,
            (now - preview.started) / 1000
          );

      member.totalSeconds =
        preview.seconds + elapsed;

      total += member.totalSeconds;
    });

    members.forEach(member => {
      member.percentage = total
        ? member.totalSeconds / total * 100
        : 0;
    });

    updateClassic();
    updateVisual();
  };

  // CLASSIC LIVE HIGHLIGHT

  const originalUpdateClassic = updateClassic;

  updateClassic = function () {
    originalUpdateClassic();

    if (recording !== 'idle') return;

    members.forEach(member => {
      const ui = member.classicUI;
      if (!ui) return;

      const active =
        previewData(member).started !== null;

      ui.photo.style.boxShadow = active
        ? `0 0 8px ${member.color},0 0 17px ${member.color}`
        : '';

      ui.progress.style.boxShadow = active
        ? `0 0 9px ${member.color}`
        : '';
    });
  };

  // VISUAL LIVE HIGHLIGHT

  const originalUpdateVisual = updateVisual;

  updateVisual = function () {
    originalUpdateVisual();

    if (recording !== 'idle') return;

    members.forEach(member => {
      member.visualUI?.node.classList.toggle(
        'is-singing',
        previewData(member).started !== null
      );
    });
  };

  // BUTTON STATES

  const originalSetButtons = setButtons;

  setButtons = function () {
    originalSetButtons();

    restartButton.disabled =
      !musicReady &&
      !members.length &&
      recording === 'idle';

    previewResetButton.disabled =
      recording !== 'idle' ||
      !members.length;

    backToSelection.disabled = isLocked();
  };

  // RECORDING STATUS

  const originalSetStatus = setStatus;

  setStatus = function (message) {
    if (message || recording !== 'idle') {
      originalSetStatus(message);
      return;
    }

    const active = members.filter(member =>
      previewData(member).started !== null
    );

    status.textContent = active.length
      ? 'LIVE PREVIEW: ' +
        active.map(member => member.name).join(', ') +
        ' — press the same key to stop.'
      : musicReady
        ? 'Press a member key to test, or Start Recording.'
        : 'Press a member key to test. MP3 is optional!';
  };

  // LIVE CLOCK
  // Continues even without music playing.

  tick = function () {
    frame = null;

    updateResults();

    if (
      previewRunning() ||
      (
        recording === 'recording' &&
        !audio.paused
      )
    ) {
      frame = requestAnimationFrame(tick);
    }
  };

  startTimer = function () {
    if (
      frame === null &&
      (
        previewRunning() ||
        (
          recording === 'recording' &&
          !audio.paused
        )
      )
    ) {
      frame = requestAnimationFrame(tick);
    }
  };

  audio.addEventListener('pause', () => {
    startTimer();
  });

  // RESET TEST RESULTS

  function resetPreview() {
    members.forEach(member => {
      const preview = previewData(member);

      preview.seconds = 0;
      preview.started = null;
    });

    if (recording === 'idle') {
      stopTimer();
      updateResults();
      setStatus();
      setButtons();
    }
  }

  // KEY TOGGLE IN LIVE PREVIEW

  function togglePreview(member) {
    const preview = previewData(member);
    const now = performance.now();

    if (preview.started === null) {
      preview.started = now;
    } else {
      preview.seconds += Math.max(
        0,
        (now - preview.started) / 1000
      );

      preview.started = null;
    }

    updateResults();

    if (previewRunning()) {
      startTimer();
    } else {
      stopTimer();
    }

    setStatus();
  }

  previewResetButton.addEventListener(
    'click',
    resetPreview
  );

  // PROJECT RESET ALSO CLEARS LIVE PREVIEW

  const originalResetRecording = resetRecording;

  resetRecording = function () {
    members.forEach(member => {
      const preview = previewData(member);

      preview.seconds = 0;
      preview.started = null;
    });

    originalResetRecording();
  };

  // REAL RECORDING ALWAYS STARTS WITH
  // CLEAN TEST RESULTS

  start.addEventListener('click', () => {
    if (
      recording === 'idle' &&
      musicReady &&
      members.length
    ) {
      resetPreview();
    }
  }, true);

  // RESTART ALL WITHOUT MP3

  const originalRestartAll = restartAll;

  restartAll = function () {
    if (!musicReady) {
      resetRecording();
      return;
    }

    originalRestartAll();
  };

  // The existing click listener keeps its original
  // reference, so intercept only the no-MP3 case.

  restartButton.addEventListener('click', event => {
    if (musicReady) return;

    event.stopImmediatePropagation();
    resetRecording();
  }, true);

  // RETURN TO MODE SELECTION
  // Keeps members, photos, MP3 and results.

  backToSelection.addEventListener('click', () => {
    if (isLocked()) return;

    const now = performance.now();

    members.forEach(member => {
      const preview = previewData(member);

      if (preview.started !== null) {
        preview.seconds += Math.max(
          0,
          (now - preview.started) / 1000
        );

        preview.started = null;
      }
    });

    stopTimer();
    audio.pause();

    updateResults();
    setStatus();

    studio.hidden = true;
    welcome.hidden = false;

    window.scrollTo(0, 0);
  });

  // KEYBOARD LIVE PREVIEW
  // Normal MP3 recording shortcuts remain unchanged.

  document.addEventListener('keydown', event => {
    if (
      event.repeat ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey ||
      recording !== 'idle' ||
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
        event.target.closest(
          'input,textarea,select'
        ) ||
        event.target.isContentEditable
      )
    ) {
      return;
    }

    const key = event.key.toUpperCase();

    if (!/^[A-Z0-9]$/.test(key)) return;

    const member = members.find(person =>
      person.shortcut === key
    );

    if (!member) return;

    event.preventDefault();
    togglePreview(member);
  });

  // INITIALIZE NEW CONTROLS

  setButtons();
  setStatus();

});
