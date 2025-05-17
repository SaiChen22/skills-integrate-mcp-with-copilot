document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Add teacher login modal and user icon
  const header = document.querySelector('header');
  const loginIcon = document.createElement('span');
  loginIcon.id = 'teacher-login-icon';
  loginIcon.title = 'Teacher Login';
  loginIcon.innerHTML = '👤';
  loginIcon.style.cursor = 'pointer';
  loginIcon.style.fontSize = '2rem';
  loginIcon.style.float = 'right';
  loginIcon.style.marginLeft = '20px';
  header.appendChild(loginIcon);

  // Modal HTML
  const loginModal = document.createElement('div');
  loginModal.id = 'teacher-login-modal';
  loginModal.className = 'hidden';
  loginModal.innerHTML = `
    <div class="modal-content">
      <span class="close-modal">&times;</span>
      <h3>Teacher Login</h3>
      <form id="teacher-login-form">
        <div class="form-group">
          <label for="teacher-username">Username:</label>
          <input type="text" id="teacher-username" required />
        </div>
        <div class="form-group">
          <label for="teacher-password">Password:</label>
          <input type="password" id="teacher-password" required />
        </div>
        <button type="submit">Login</button>
      </form>
      <div id="teacher-login-message" class="hidden"></div>
    </div>
  `;
  document.body.appendChild(loginModal);

  // Modal styles (minimal, for demo)
  const modalStyle = document.createElement('style');
  modalStyle.innerHTML = `
  #teacher-login-modal {
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; z-index: 1000;
  }
  #teacher-login-modal.hidden { display: none; }
  #teacher-login-modal .modal-content {
    background: #fff; padding: 30px 25px; border-radius: 8px; min-width: 320px; box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    position: relative;
  }
  #teacher-login-modal .close-modal {
    position: absolute; top: 10px; right: 15px; font-size: 1.5rem; cursor: pointer;
  }
  #teacher-login-message.error { color: #c62828; margin-top: 10px; }
  #teacher-login-message.success { color: #2e7d32; margin-top: 10px; }
  `;
  document.head.appendChild(modalStyle);

  // Show modal on icon click
  loginIcon.addEventListener('click', () => {
    loginModal.classList.remove('hidden');
  });
  // Hide modal on close
  loginModal.querySelector('.close-modal').addEventListener('click', () => {
    loginModal.classList.add('hidden');
  });
  // Hide modal on outside click
  loginModal.addEventListener('click', (e) => {
    if (e.target === loginModal) loginModal.classList.add('hidden');
  });

  // Handle login form submit (demo only, does not persist session)
  document.getElementById('teacher-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('teacher-username').value;
    const password = document.getElementById('teacher-password').value;
    const loginMsg = document.getElementById('teacher-login-message');
    // Try a dummy request to check credentials
    try {
      const response = await fetch('/activities', {
        headers: {
          'Authorization': 'Basic ' + btoa(username + ':' + password)
        }
      });
      if (response.ok) {
        loginMsg.textContent = 'Login successful!';
        loginMsg.className = 'success';
        setTimeout(() => loginModal.classList.add('hidden'), 1000);
      } else {
        loginMsg.textContent = 'Invalid credentials.';
        loginMsg.className = 'error';
      }
    } catch {
      loginMsg.textContent = 'Login failed.';
      loginMsg.className = 'error';
    }
    loginMsg.classList.remove('hidden');
  });

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
