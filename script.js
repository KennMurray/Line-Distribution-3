
document.addEventListener("DOMContentLoaded", function () {
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
    if (event.target === modal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeModal();
    }
  });

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
});
