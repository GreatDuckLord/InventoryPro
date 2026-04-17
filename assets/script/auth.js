document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("container");
  const selectionContainer = document.getElementById("selectionContainer");
  const authContainer = document.getElementById("authContainer");
  const businessOwnerBtn = document.getElementById("businessOwnerBtn");
  const clientBtn = document.getElementById("clientBtn");
  const registerBtn = document.getElementById("register");
  const loginBtn = document.getElementById("login");

  // Smooth transition from selection to auth
  businessOwnerBtn.addEventListener("click", () => {
    selectionContainer.style.opacity = "0";
    setTimeout(() => {
      selectionContainer.style.display = "none";
      authContainer.style.display = "block";

      // Trigger reflow to assure transitions occur
      void authContainer.offsetWidth;
      authContainer.style.opacity = "1";

      container.classList.remove("active");
    }, 400);
  });

  clientBtn.addEventListener("click", () => {
    clientBtn.style.transform = "scale(0.95)";
    setTimeout(() => {
      window.location.href = "tracking.html";
    }, 300);
  });

  // Elegant Form Toggler
  registerBtn.addEventListener("click", (e) => {
    e.preventDefault();
    container.classList.add("active");
  });

  loginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    container.classList.remove("active");
  });

  // Socials Integration Handlers
  if (typeof google !== "undefined") {
    google.accounts.id.initialize({
      client_id: "YOUR_GOOGLE_CLIENT_ID",
      callback: (response) => console.log("Google:", response.credential),
    });
  }

  window.fbAsyncInit = function () {
    if (typeof FB !== "undefined") {
      FB.init({
        appId: "YOUR_FACEBOOK_APP_ID",
        cookie: true,
        xfbml: true,
        version: "v18.0",
      });
    }
  };

  document.querySelectorAll(".social-icons .icon").forEach((icon) => {
    icon.addEventListener("click", (e) => {
      e.preventDefault();
      const provider = e.currentTarget.getAttribute("data-provider");
      if (provider === "google" && typeof google !== "undefined") {
        google.accounts.id.prompt();
      } else if (provider === "facebook" && typeof FB !== "undefined") {
        FB.login(
          (res) => {
            if (res.authResponse)
              console.log("FB:", res.authResponse.accessToken);
          },
          { scope: "email" },
        );
      } else if (provider === "github") {
        window.location.href = "#"; // Redirect handler for GitHub
      }
    });
  });

  // Elegant Validations and loading feedback
  const signInForm = document.querySelector(".sign-in form");
  const signUpForm = document.querySelector(".sign-up form");

  signInForm.addEventListener("submit", (e) => {
    e.preventDefault();
    verifyFormAndRedirect(signInForm, "dashboard.html");
  });

  signUpForm.addEventListener("submit", (e) => {
    e.preventDefault();
    verifyFormAndRedirect(signUpForm, "dashboard.html");
  });

  function verifyFormAndRedirect(form, redirectUrl) {
    const inputs = form.querySelectorAll("input[required]");
    let isValid = true;

    inputs.forEach((input) => {
      const val = input.value.trim();
      if (!val) {
        isValid = false;
        showError(input);
      } else {
        clearError(input);
      }

      if (input.type === "email" && val) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
          isValid = false;
          showError(input);
        }
      }
    });

    if (isValid) {
      const btn = form.querySelector('button[type="submit"]');
      btn.innerHTML =
        '<i class="fa-solid fa-circle-notch fa-spin"></i> Authenticating...';
      btn.style.opacity = "0.8";
      btn.style.pointerEvents = "none";

      setTimeout(() => {
        form.reset();
        window.location.href = redirectUrl;
      }, 1200);
    }
  }

  function showError(input) {
    input.style.borderColor = "#ff4d4d";
    input.style.boxShadow = "0 0 0 4px rgba(255, 77, 77, 0.15)";
  }

  function clearError(input) {
    input.style.borderColor = "rgba(255, 255, 255, 0.08)";
    input.style.boxShadow = "none";
  }

  // Reset error styling on typing
  document.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => {
      clearError(input);
    });
  });

  // Hide/Show Password feature
  document.querySelectorAll(".toggle-password").forEach((icon) => {
    icon.addEventListener("click", function () {
      const input = this.previousElementSibling;
      if (input.type === "password") {
        input.type = "text";
        this.classList.remove("fa-eye");
        this.classList.add("fa-eye-slash");
      } else {
        input.type = "password";
        this.classList.remove("fa-eye-slash");
        this.classList.add("fa-eye");
      }
    });
  });
});
