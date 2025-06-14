const addBtn = document.getElementById("addDashboardBtn");
const form = document.getElementById("dashboardForm");
const cancelBtn = document.getElementById("cancelBtn");
const dashboardList = document.getElementById("dashboardList");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");
const closeModal = document.getElementById("closeModal");
const deleteModal = document.getElementById("deleteModal");

const nameInput = document.getElementById("dashboardName");
const thumbnailInput = document.getElementById("thumbnail");
const descriptionInput = document.getElementById("description");
const videoLinkInput = document.getElementById("videoLink");

let selectedCard = null;
let isAdmin = false;

// Ask for secret passcode on load
(function checkPass() {
  const encodedPass = "Mjk1c2lkaHU="; // ----
  const answer = prompt("What is secret code?  Hint: happy").trim().toLowerCase();
  if (answer === atob(encodedPass)) {
    addBtn.style.display = "block"; 
    deleteModal.style.display = "inline-block";
    isAdmin = true;
  } else {
    // Hide Add, Cancel, Delete buttons
    addBtn.style.display = "none";
    //cancelBtn.style.display = "none";
    deleteModal.style.display = "none";
  }
})();

addBtn.addEventListener("click", () => {
  form.reset();
  form.removeAttribute("data-edit-id");
  form.classList.remove("hidden");
});

cancelBtn.addEventListener("click", () => {
  form.reset();
  form.classList.add("hidden");
  form.removeAttribute("data-edit-id");
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = nameInput.value.trim();
  const description = descriptionInput.value.trim();
  const thumbFile = thumbnailInput.files[0];
  const rawLink = videoLinkInput.value.trim();
  const videoLink = convertDriveLink(rawLink);

  if (!title || !videoLink) {
    alert("Please enter required fields.");
    return;
  }

  let thumbURL = "";

  if (thumbFile) {
    thumbURL = await uploadThumbnailToCloudinary(thumbFile);
  }

  let dashboards = JSON.parse(localStorage.getItem("dashboards") || "[]");
  const isEdit = form.dataset.editId;

  if (isEdit) {
    const id = parseInt(form.dataset.editId);
    dashboards = dashboards.map(d => {
      if (d.id === id) {
        return {
          ...d,
          title,
          description,
          videoLink,
          thumbURL: thumbURL || d.thumbURL,
          updatedAt: new Date().toISOString()
        };
      }
      return d;
    });
    form.removeAttribute("data-edit-id");
  } else {
    const newDashboard = {
      id: Date.now(),
      title,
      description,
      videoLink,
      thumbURL,
      createdAt: new Date().toISOString()
    };
    dashboards.push(newDashboard);
  }

  localStorage.setItem("dashboards", JSON.stringify(dashboards));
  dashboardList.innerHTML = "";
  dashboards.forEach(renderCard);
  form.reset();
  form.classList.add("hidden");
});

closeModal.addEventListener("click", () => {
  modal.style.display = "none";
  modalBody.innerHTML = "";
});

deleteModal.addEventListener("click", () => {
  if (!selectedCard) return;
  const confirmed = confirm("Are you sure you want to delete this dashboard?");
  if (!confirmed) return;

  const id = selectedCard.dataset.id;
  selectedCard.remove();
  modal.style.display = "none";

  const dashboards = JSON.parse(localStorage.getItem("dashboards") || "[]");
  const updated = dashboards.filter(d => d.id != id);
  localStorage.setItem("dashboards", JSON.stringify(updated));
});

function renderCard(data) {
  const card = document.createElement("div");
  card.classList.add("dashboard-card");
  card.dataset.id = data.id;

  card.innerHTML = `
    <h3>${data.title}</h3>
    ${data.thumbURL ? `<img src="${data.thumbURL}" alt="Thumbnail" />` : ""}
    ${data.description ? `<p class="dashboard-description">${data.description}</p>` : ""}
  `;

  if (isAdmin) {
    const editBtn = document.createElement("span");
    editBtn.classList.add("edit-btn");
    editBtn.textContent = "Edit";

    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      selectedCard = card;
      nameInput.value = data.title;
      descriptionInput.value = data.description || "";
      videoLinkInput.value = data.videoLink || "";
      form.dataset.editId = data.id;
      form.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    card.appendChild(editBtn);
  }

  card.addEventListener("click", () => {
    selectedCard = card;
    modalBody.innerHTML = `
      <h2>${data.title}</h2>
      ${data.description ? `<p class="dashboard-description">${data.description}</p>` : ""}
      <iframe src="${data.videoLink}" allow="autoplay" allowfullscreen frameborder="0" style="width:100%;height:400px;margin-top:10px;border-radius:10px;"></iframe>
    `;

    modal.style.display = "flex";
  });

  dashboardList.appendChild(card);
}

function loadDashboards() {
  const dashboards = JSON.parse(localStorage.getItem("dashboards") || "[]");
  dashboards.forEach(renderCard);
}

function convertDriveLink(link) {
  const match = link.match(/\/file\/d\/([a-zA-Z0-9_-]+)\//);
  if (match && match[1]) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  return link; // fallback if user already pasted embed link
}

async function uploadThumbnailToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "video_upload_preset"); // your unsigned preset

  const response = await fetch(
    "https://api.cloudinary.com/v1_1/dpyyd4iux/image/upload",
    {
      method: "POST",
      body: formData
    }
  );

  const data = await response.json();
  return data.secure_url;
}

loadDashboards();
