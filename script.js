document.documentElement.classList.add("js");

const stage = document.querySelector("[data-stage]");
const frames = [...document.querySelectorAll("[data-frame]")];
const indexLinks = [...document.querySelectorAll("[data-index-link]")];
const progressLabel = document.querySelector("[data-progress-label]");
const feedItems = [...document.querySelectorAll("[data-feed-item]")];
const signalCanvas = document.querySelector("[data-signal-field]");
const contactModal = document.querySelector("[data-contact-modal]");
const openContactButtons = [...document.querySelectorAll("[data-open-contact]")];
const closeContactButtons = [...document.querySelectorAll("[data-close-contact]")];
const contactForm = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const frameCount = frames.length;
let scrollRatio = 0;
let activeFrame = 0;
let lastContactTrigger = null;

const setActiveFrame = (index) => {
  activeFrame = clamp(index, 0, frameCount - 1);
  stage.dataset.active = String(activeFrame);

  frames.forEach((frame, frameIndex) => {
    frame.classList.toggle("is-active", frameIndex === activeFrame);
  });

  indexLinks.forEach((link, linkIndex) => {
    link.toggleAttribute("aria-current", linkIndex === activeFrame);
  });

  feedItems.forEach((item, itemIndex) => {
    item.classList.toggle("is-lit", itemIndex === activeFrame - 2 || itemIndex === activeFrame - 3);
  });

  if (progressLabel) {
    progressLabel.textContent = `${String(activeFrame + 1).padStart(2, "0")} / ${String(frameCount).padStart(2, "0")}`;
  }
};

const updateFromScroll = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  scrollRatio = scrollable <= 0 ? 0 : clamp(window.scrollY / scrollable, 0, 1);
  document.documentElement.style.setProperty("--progress", scrollRatio.toFixed(4));

  const nextFrame = Math.round(scrollRatio * (frameCount - 1));
  if (nextFrame !== activeFrame) {
    setActiveFrame(nextFrame);
  }
};

const updatePointer = (event) => {
  document.documentElement.style.setProperty("--mx", `${event.clientX}px`);
  document.documentElement.style.setProperty("--my", `${event.clientY}px`);
};

indexLinks.forEach((link, linkIndex) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({
      top: (scrollable / Math.max(frameCount - 1, 1)) * linkIndex,
      behavior: "smooth",
    });
  });
});

const openContactModal = (event) => {
  if (!contactModal) {
    return;
  }

  lastContactTrigger = event?.currentTarget || null;
  contactModal.hidden = false;
  document.body.classList.add("modal-open");
  contactModal.querySelector("input[name='email']")?.focus();
};

const closeContactModal = () => {
  if (!contactModal) {
    return;
  }

  contactModal.hidden = true;
  document.body.classList.remove("modal-open");
  lastContactTrigger?.focus();
};

openContactButtons.forEach((button) => {
  button.addEventListener("click", openContactModal);
});

closeContactButtons.forEach((button) => {
  button.addEventListener("click", closeContactModal);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && contactModal && !contactModal.hidden) {
    closeContactModal();
  }
});

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = contactForm.querySelector("button[type='submit']");
    const originalLabel = submitButton?.textContent;
    formStatus?.classList.remove("is-success", "is-error");

    if (formStatus) {
      formStatus.textContent = "Sending...";
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }

    try {
      const response = await fetch(contactForm.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(contactForm),
      });

      if (!response.ok) {
        throw new Error("The message could not be sent.");
      }

      contactForm.reset();
      formStatus?.classList.add("is-success");
      if (formStatus) {
        formStatus.textContent = "JazakAllah khair. Sent. I’ll reply from bilal@swiftbuild.agency.";
      }
    } catch (error) {
      formStatus?.classList.add("is-error");
      if (formStatus) {
        formStatus.textContent = "Could not send here. Email me directly at bilal@swiftbuild.agency.";
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel || "Send to Bilal";
      }
    }
  });
}

if (signalCanvas) {
  const ctx = signalCanvas.getContext("2d");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let width = 0;
  let height = 0;
  let dpr = 1;

  const resizeSignal = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    signalCanvas.width = Math.floor(width * dpr);
    signalCanvas.height = Math.floor(height * dpr);
    signalCanvas.style.width = `${width}px`;
    signalCanvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const drawSignal = (time = 0) => {
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "lighter";

    const t = time * 0.00032;
    const horizon = height * (0.34 + scrollRatio * 0.18);
    const amp = Math.max(28, height * 0.052);

    for (let line = 0; line < 6; line += 1) {
      ctx.beginPath();
      const offset = (line - 2) * 32;

      for (let x = -80; x <= width + 80; x += 16) {
        const y =
          horizon +
          offset +
          Math.sin(x * 0.007 + t * (1.5 + line * 0.1)) * amp +
          Math.cos(x * 0.003 + t + line) * amp * 0.42;

        if (x === -80) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle =
        line % 2 === 0 ? "rgba(66, 223, 255, 0.2)" : "rgba(231, 189, 81, 0.13)";
      ctx.lineWidth = line === activeFrame % 6 ? 1.8 : 0.9;
      ctx.shadowBlur = 20;
      ctx.shadowColor = line % 2 === 0 ? "rgba(66, 223, 255, 0.32)" : "rgba(231, 189, 81, 0.22)";
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "source-over";

    for (let dot = 0; dot < 42; dot += 1) {
      const x = ((dot * 137 + scrollRatio * width * 0.8 + t * 120) % (width + 160)) - 80;
      const y =
        height * 0.18 +
        ((dot * 83) % Math.max(height * 0.66, 1)) +
        Math.sin(t * 1.8 + dot) * 10;
      const radius = dot % 7 === activeFrame % 7 ? 1.9 : 1;

      ctx.fillStyle = dot % 3 === 0 ? "rgba(66, 223, 255, 0.38)" : "rgba(248, 251, 255, 0.2)";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!prefersReducedMotion) {
      requestAnimationFrame(drawSignal);
    }
  };

  resizeSignal();
  drawSignal();
  window.addEventListener("resize", resizeSignal);
}

setActiveFrame(0);
updateFromScroll();
window.addEventListener("scroll", updateFromScroll, { passive: true });
window.addEventListener("resize", updateFromScroll);
window.addEventListener("pointermove", updatePointer, { passive: true });
