
document.addEventListener("DOMContentLoaded", function () {
  console.log("Line Distribution Studio is ready!");

  const preview = document.querySelector(".preview");

  if (preview) {
    preview.addEventListener("click", function () {
      preview.style.borderColor = "#80ffcc";
      console.log("Preview clicked!");
    });
  }
});
