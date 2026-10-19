(function () {
  "use strict";

  /* Lead delivery config.
     Set FORM_ENDPOINT to a form backend to post leads straight to your inbox.
     This site is static (GitHub Pages), so a browser cannot send email by
     itself — the endpoint receives the submission and relays it as an email.

     Using Web3Forms: put your access key below (get it free at web3forms.com
     by entering gymhoppdvg@outlook.com). Submissions are emailed to that
     address the moment the visitor presses submit.
     Any other backend (Formspree, Basin) works too — just paste its full URL.

     While it is empty we fall back to opening the visitor's mail client with
     the details pre-filled, so an enquiry is never silently dropped. */
  var WEB3FORMS_ACCESS_KEY = "832c6f21-2888-44f9-8ddb-bddbaf796da7";
  var FORM_ENDPOINT = WEB3FORMS_ACCESS_KEY
    ? "https://api.web3forms.com/submit"
    : "";
  var CONTACT_EMAIL = "gymhoppdvg@outlook.com";

  var header = document.querySelector(".site-header");
  var nav = document.getElementById("nav");
  var navToggle = document.getElementById("nav-toggle");

  function closeNav() {
    document.body.classList.remove("nav-open");
    if (navToggle) navToggle.setAttribute("aria-expanded", "false");
  }

  if (navToggle) {
    navToggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
  }

  if (nav) {
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeNav();
    });
  }

  document.addEventListener("click", function (event) {
    if (!document.body.classList.contains("nav-open")) return;
    if (header && header.contains(event.target)) return;
    closeNav();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeNav();
  });

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  var revealItems = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    revealItems.forEach(function (el, index) {
      el.style.transitionDelay = (index % 4) * 70 + "ms";
      observer.observe(el);
    });
  }

  var forms = document.querySelectorAll("form[data-form]");

  function setError(input, message) {
    var field = input.closest(".field");
    if (!field) return;
    var slot = field.querySelector(".error");
    if (slot) slot.textContent = message || "";
    field.classList.toggle("invalid", Boolean(message));
    if (message) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  }

  function validateField(input) {
    if (input.type === "hidden") return true;

    var value = input.value.trim();

    if (!value && !input.required) {
      setError(input, "");
      return true;
    }

    if (input.type === "email") {
      if (!value) {
        setError(input, "Please enter your email address.");
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        setError(input, "Enter a valid email address.");
        return false;
      }
      setError(input, "");
      return true;
    }

    if (input.id === "phone") {
      var digits = value.replace(/\D/g, "");
      if (!digits) {
        setError(input, "Please enter your phone number.");
        return false;
      }
      if (digits.length !== 10) {
        setError(input, "Enter a 10-digit mobile number.");
        return false;
      }
      setError(input, "");
      return true;
    }

    if (!value) {
      setError(input, "This field is required.");
      return false;
    }

    if (value.length < 2) {
      setError(input, "Please enter at least 2 characters.");
      return false;
    }

    setError(input, "");
    return true;
  }

  function setStatus(form, message, kind) {
    var status = form.querySelector("[data-status]");
    if (!status) return;
    status.textContent = message || "";
    status.className = "form-status" + (kind ? " form-status-" + kind : "");
    status.hidden = !message;
  }

  function mailtoHref(form, data) {
    var kind = form.getAttribute("data-form") === "waitlist"
      ? "Early access request"
      : "Partner gym application";
    var lines = Object.keys(data).map(function (key) {
      return key.charAt(0).toUpperCase() + key.slice(1) + ": " + data[key];
    });
    var body = lines.join("\n") + "\n\nSent from " + window.location.href;
    return "mailto:" + CONTACT_EMAIL +
      "?subject=" + encodeURIComponent("GymHopp — " + kind) +
      "&body=" + encodeURIComponent(body);
  }

  function initForm(form) {
    var inputs = Array.prototype.slice.call(form.querySelectorAll("input, textarea, select"));
    var submitBtn = form.querySelector('button[type="submit"]');
    var honeypot = form.querySelector('[name="_gotcha"]');
    var btnText = submitBtn ? submitBtn.textContent : "";

    inputs.forEach(function (input) {
      input.addEventListener("blur", function () {
        if (input.type !== "hidden" && input.value.trim()) validateField(input);
      });

      input.addEventListener("input", function () {
        var field = input.closest(".field");
        if (field && field.classList.contains("invalid")) validateField(input);
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (honeypot && honeypot.value) {
        form.reset();
        return;
      }

      var firstInvalid = null;
      var allValid = true;

      inputs.forEach(function (input) {
        if (!validateField(input)) {
          allValid = false;
          if (!firstInvalid) firstInvalid = input;
        }
      });

      if (!allValid) {
        setStatus(form, "Please fix the highlighted fields and try again.", "error");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var data = {};
      inputs.forEach(function (input) {
        if (input.type === "hidden") return;
        data[input.name] = input.value.trim();
      });
      data.page = window.location.href;
      data.submittedAt = new Date().toISOString();

      if (WEB3FORMS_ACCESS_KEY) {
        var kind = form.getAttribute("data-form") === "waitlist"
          ? "Early access request"
          : "Partner gym application";
        data.access_key = WEB3FORMS_ACCESS_KEY;
        data.subject = "GymHopp — " + kind;
        data.from_name = "GymHopp website";
        /* Web3Forms replies to from_name, so only pass an address we know is
           well-formed. A malformed reply-to makes the whole request fail. */
        if (data.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
          data.replyto = data.email;
        }
      }

      setStatus(form, "", "");

      function restoreButton() {
        if (!submitBtn) return;
        submitBtn.disabled = false;
        submitBtn.textContent = btnText;
      }

      function finish(message, kind) {
        form.reset();
        inputs.forEach(function (input) { setError(input, ""); });
        restoreButton();
        setStatus(form, message, kind);
        var status = form.querySelector("[data-status]");
        if (status) status.focus();
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending…";
      }

      if (FORM_ENDPOINT) {
        fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data)
        })
          .then(function (response) {
            return response.json().catch(function () { return {}; });
          })
          .then(function (result) {
            if (!result.success) throw new Error(result.message || "Request failed");
            finish("Thanks — you're on the list. We'll reach out shortly.", "ok");
          })
          .catch(function () {
            restoreButton();
            setStatus(
              form,
              "That didn't send — please try again, or reach us directly at " +
                (CONTACT_EMAIL || "our email") + ".",
              "error"
            );
          });
        return;
      }

      /* No form endpoint configured yet. Fail loudly and honestly instead of
         opening an empty mailto: draft that silently drops the enquiry.
         Set WEB3FORMS_ACCESS_KEY (or FORM_ENDPOINT) at the top of this file
         to make submissions land in the inbox automatically. */
      if (!CONTACT_EMAIL) {
        restoreButton();
        setStatus(
          form,
          "This form isn't connected to an inbox yet, so your message was not sent. Please try again soon.",
          "error"
        );
        return;
      }

      window.location.href = mailtoHref(form, data);
      finish("Your email app should now be open with everything filled in — just press send.", "ok");
    });
  }

  forms.forEach(initForm);
})();