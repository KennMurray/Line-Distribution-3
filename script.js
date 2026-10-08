
document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("member-modal");
  const openButton = document.getElementById("open-member-modal");
  const closeButton = document.getElementById("close-member-modal");

  const form = document.getElementById("member-form");
  const memberList = document.getElementById("member-list-items");

  const nameInput = document.getElementById("member-name");
  const imageInput = document.getElementById("member-image");
  const colorInput = document.getElementById("member-color");

  let memberCount = 0;

  function openModal() {
    modal.classList.add("open");
    nameInput.focus();
  }

  function closeModal() {
    modal.classList.remove("open");
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

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (memberCount >= 20) {
      alert("Maximum 20 members allowed!");
      return;
    }

    const name = nameInput.value.trim();
    const color = colorInput.value;
    const photo = imageInput.files[0];

    if (!name) return;

    const card = document.createElement("div");
    card.className = "member-card";
    card.style.setProperty("--member-color", color);

    const memberName = document.createElement("p");
    memberName.textContent = name;

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

    card.appendChild(memberName);
    memberList.appendChild(card);

    memberCount++;

    form.reset();
    closeModal();
  });
});
