// ===================================================================
// MindPulse — script.js
// Talks to the existing FastAPI backend at http://127.0.0.1:2000
// ===================================================================

const API_BASE_URL = "https://mental-health-score-1-h1mv.onrender.com";
const PREDICT_ENDPOINT = `${API_BASE_URL}/predict`;

// Assumed display range for the liquid gauge. The model itself does not
// publish a hard max, so results outside this range are still shown as a
// number — the gauge just clamps visually at the edges.
const GAUGE_MIN = 0;
const GAUGE_MAX = 10;

const els = {
  form: document.getElementById("predictForm"),
  formCard: document.getElementById("formCard"),
  loadingCard: document.getElementById("loadingCard"),
  resultCard: document.getElementById("resultCard"),
  errorCard: document.getElementById("errorCard"),
  submitBtn: document.getElementById("submitBtn"),
  formError: document.getElementById("formError"),
  resetBtn: document.getElementById("resetBtn"),
  errorRetryBtn: document.getElementById("errorRetryBtn"),
  errorMessage: document.getElementById("errorMessage"),
  scoreValue: document.getElementById("scoreValue"),
  resultLabel: document.getElementById("resultLabel"),
  resultDescription: document.getElementById("resultDescription"),
  liquidFill: document.getElementById("liquidFill"),
  apiStatusDot: document.getElementById("apiStatusDot"),
  apiStatusText: document.getElementById("apiStatusText"),
};

// ---------------------------------------------------------------
// Apple-style Theme Switcher Logic
// ---------------------------------------------------------------
const themeLightBtn = document.getElementById("themeLightBtn");
const themeDarkBtn = document.getElementById("themeDarkBtn");
const themePill = document.querySelector(".theme-switch__pill");
const themeSwitch = document.querySelector(".theme-switch");

function updatePillPosition(activeBtn) {
  if (!activeBtn || !themePill || !themeSwitch) return;
  const parentRect = themeSwitch.getBoundingClientRect();
  const btnRect = activeBtn.getBoundingClientRect();
  const left = btnRect.left - parentRect.left;
  themePill.style.transform = `translateX(${left}px)`;
  themePill.style.width = `${btnRect.width}px`;
}

function setTheme(themeName) {
  document.documentElement.setAttribute("data-theme", themeName);
  localStorage.setItem("theme", themeName);
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) meta.content = themeName;

  const isLight = themeName === "light";
  themeLightBtn?.classList.toggle("is-active", isLight);
  themeDarkBtn?.classList.toggle("is-active", !isLight);
  themeLightBtn?.setAttribute("aria-checked", isLight ? "true" : "false");
  themeDarkBtn?.setAttribute("aria-checked", !isLight ? "true" : "false");

  const activeBtn = isLight ? themeLightBtn : themeDarkBtn;
  requestAnimationFrame(() => updatePillPosition(activeBtn));
}

const savedTheme = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
setTheme(initialTheme);

themeLightBtn?.addEventListener("click", () => setTheme("light"));
themeDarkBtn?.addEventListener("click", () => setTheme("dark"));

window.addEventListener("resize", () => {
  const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
  const activeBtn = currentTheme === "light" ? themeLightBtn : themeDarkBtn;
  updatePillPosition(activeBtn);
});

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  if (!localStorage.getItem("theme")) {
    setTheme(e.matches ? "dark" : "light");
  }
});

// ---------------------------------------------------------------
// Slider live-value labels
// ---------------------------------------------------------------
const sliderIds = [
  "Avg_Daily_Usage_Hours",
  "Study_Hours",
  "Physical_Activity_Hours",
  "Sleep_Hours_Per_Night",
];

sliderIds.forEach((id) => {
  const input = document.getElementById(id);
  const label = document.getElementById(`${id}_val`);
  const update = () => {
    const v = parseFloat(input.value);
    label.textContent = `${v.toFixed(1)}h`;
  };
  input.addEventListener("input", update);
  update();
});

// ---------------------------------------------------------------
// Field definitions used for client-side validation
// (mirrors the Pydantic StudentData model exactly)
// ---------------------------------------------------------------
const FIELD_RULES = {
  Age: { type: "number", min: 10, max: 100 },
  Gender: { type: "enum", values: ["Male", "Female"] },
  Country: { type: "text" },
  Academic_Level: { type: "enum", values: ["Undergraduate", "Graduate", "High School"] },
  Most_Used_Platform: {
    type: "enum",
    values: ["Facebook", "LinkedIn", "Instagram", "Snapchat", "Twitter", "YouTube",
      "TikTok", "LINE", "KakaoTalk", "VKontakte", "WhatsApp", "WeChat"],
  },
  Purpose_Of_Use: { type: "enum", values: ["Networking", "Education", "Entertainment", "News"] },
  Avg_Daily_Usage_Hours: { type: "number", min: 0, max: 24 },
  Daily_Unlocks: { type: "number", min: 0, max: Infinity },
  Study_Hours: { type: "number", min: 0, max: 24 },
  Physical_Activity_Hours: { type: "number", min: 0, max: 24 },
  Sleep_Hours_Per_Night: { type: "number", min: 0, max: 24 },
  Stress_Level: { type: "enum", values: ["Medium", "Low", "Very High", "High"] },
};

function clearFieldErrors() {
  document.querySelectorAll(".field__error").forEach((el) => (el.textContent = ""));
  els.formError.textContent = "";
}

function validateForm(formData) {
  const errors = {};

  Object.entries(FIELD_RULES).forEach(([name, rule]) => {
    const raw = formData.get(name);

    if (raw === null || raw === "") {
      errors[name] = "Required";
      return;
    }

    if (rule.type === "number") {
      const num = Number(raw);
      if (Number.isNaN(num)) {
        errors[name] = "Must be a number";
      } else if (num < rule.min || num > rule.max) {
        errors[name] = `Must be between ${rule.min} and ${rule.max}`;
      }
    }

    if (rule.type === "enum" && !rule.values.includes(raw)) {
      errors[name] = "Choose a valid option";
    }

    if (rule.type === "text" && String(raw).trim().length === 0) {
      errors[name] = "Required";
    }
  });

  return errors;
}

function showFieldErrors(errors) {
  Object.entries(errors).forEach(([name, message]) => {
    const target = document.querySelector(`[data-error-for="${name}"]`);
    if (target) target.textContent = message;
  });
}

// ---------------------------------------------------------------
// Build the request payload matching StudentData exactly
// ---------------------------------------------------------------
function buildPayload(formData) {
  return {
    Age: parseInt(formData.get("Age"), 10),
    Gender: formData.get("Gender"),
    Country: formData.get("Country").trim(),
    Academic_Level: formData.get("Academic_Level"),
    Most_Used_Platform: formData.get("Most_Used_Platform"),
    Purpose_Of_Use: formData.get("Purpose_Of_Use"),
    Avg_Daily_Usage_Hours: parseFloat(formData.get("Avg_Daily_Usage_Hours")),
    Daily_Unlocks: parseInt(formData.get("Daily_Unlocks"), 10),
    Study_Hours: parseFloat(formData.get("Study_Hours")),
    Physical_Activity_Hours: parseFloat(formData.get("Physical_Activity_Hours")),
    Sleep_Hours_Per_Night: parseFloat(formData.get("Sleep_Hours_Per_Night")),
    Stress_Level: formData.get("Stress_Level"),
  };
}

// ---------------------------------------------------------------
// View state switching
// ---------------------------------------------------------------
function showCard(name) {
  ["formCard", "loadingCard", "resultCard", "errorCard"].forEach((key) => {
    els[key].classList.toggle("is-hidden", key !== name);
  });
}

// ---------------------------------------------------------------
// Liquid gauge rendering
// ---------------------------------------------------------------
function renderGauge(score) {
  const clamped = Math.max(GAUGE_MIN, Math.min(GAUGE_MAX, score));
  const percent = (clamped - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN);

  // Circle is centered at (100,100) r=82 -> spans y=18 to y=182
  const top = 18;
  const bottom = 182;
  const fillY = bottom - percent * (bottom - top);

  // Simple wavy-top liquid fill using a gentle sine curve across the width
  const width = 200;
  const amplitude = 4;
  const points = [];
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const x = (width / steps) * i;
    const y = fillY + Math.sin((i / steps) * Math.PI * 2) * amplitude;
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }

  const path = `M0,${bottom} L0,${fillY} L${points.join(" L")} L${width},${bottom} Z`;
  els.liquidFill.setAttribute("d", path);
}

function animateScore(target) {
  const duration = 900;
  const start = performance.now();

  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const current = target * eased;
    els.scoreValue.textContent = current.toFixed(2);
    renderGauge(current);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function describeScore(score) {
  const pct = score / GAUGE_MAX;
  if (pct >= 0.7) {
    return {
      label: "Strong wellbeing signal",
      text: "The model reads your inputs as leaning toward a healthier balance of habits.",
    };
  }
  if (pct >= 0.4) {
    return {
      label: "Moderate wellbeing signal",
      text: "A mixed picture — some habits may be pulling the score in different directions.",
    };
  }
  return {
    label: "Lower wellbeing signal",
    text: "The model flags this combination of habits as one to keep an eye on.",
  };
}

// ---------------------------------------------------------------
// Submit handler
// ---------------------------------------------------------------
els.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearFieldErrors();

  const formData = new FormData(els.form);
  const errors = validateForm(formData);

  if (Object.keys(errors).length > 0) {
    showFieldErrors(errors);
    els.formError.textContent = "Please fix the highlighted fields before predicting.";
    return;
  }

  const payload = buildPayload(formData);

  els.submitBtn.classList.add("is-loading");
  els.submitBtn.disabled = true;
  showCard("loadingCard");

  try {
    const response = await fetch(PREDICT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let detail = `Request failed with status ${response.status}.`;
      try {
        const body = await response.json();
        if (body?.detail) {
          detail = Array.isArray(body.detail)
            ? body.detail.map((d) => `${d.loc?.slice(-1)[0]}: ${d.msg}`).join(" · ")
            : String(body.detail);
        }
      } catch (_) {
        /* response had no JSON body */
      }
      throw new Error(detail);
    }

    const data = await response.json();
    const score = Number(data.predicted_mental_health_score);

    const { label, text } = describeScore(score);
    els.resultLabel.textContent = label;
    els.resultDescription.textContent = text;

    showCard("resultCard");
    animateScore(score);
  } catch (err) {
    let message = err.message || "Unexpected error while contacting the API.";
    if (err instanceof TypeError) {
      message = `Couldn't reach the API at ${API_BASE_URL}. Make sure the FastAPI server is running and reachable.`;
    }
    els.errorMessage.textContent = message;
    showCard("errorCard");
  } finally {
    els.submitBtn.classList.remove("is-loading");
    els.submitBtn.disabled = false;
  }
});

// ---------------------------------------------------------------
// Reset / retry
// ---------------------------------------------------------------
els.resetBtn.addEventListener("click", () => {
  showCard("formCard");
});

els.errorRetryBtn.addEventListener("click", () => {
  showCard("formCard");
});

// ---------------------------------------------------------------
// Lightweight API health check on load (root endpoint)
// ---------------------------------------------------------------
async function checkApiStatus() {
  try {
    const res = await fetch(`${API_BASE_URL}/`, { method: "GET" });
    if (res.ok) {
      els.apiStatusDot.classList.add("is-online");
      els.apiStatusDot.classList.remove("is-offline");
      els.apiStatusText.textContent = "API connected";
    } else {
      throw new Error("Non-OK response");
    }
  } catch (_) {
    els.apiStatusDot.classList.add("is-offline");
    els.apiStatusDot.classList.remove("is-online");
    els.apiStatusText.textContent = "API unreachable — start the FastAPI server";
  }
}

checkApiStatus();
