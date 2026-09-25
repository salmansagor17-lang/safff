let timerInterval = null;
let remainingTime = 30;
let timerDisabled = false;

function startTimer(seconds, onTimeout) {
  stopTimer();
  const normalized = Number(seconds);
  timerDisabled = !Number.isFinite(normalized) || normalized <= 0;
  remainingTime = timerDisabled ? 0 : Math.floor(normalized);
  updateTimerDisplay();

  if (timerDisabled) return;

  timerInterval = setInterval(() => {
    remainingTime--;
    updateTimerDisplay();

    if (remainingTime <= 0) {
      stopTimer();
      onTimeout();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  const element = document.getElementById("timerValue");
  if (!element) return;

  const wrapper = element.closest(".timer");
  element.textContent = timerDisabled ? "∞" : remainingTime;
  element.classList.toggle("timer-danger", !timerDisabled && remainingTime <= 5);
  wrapper?.classList.toggle("no-timer", timerDisabled);
  if (wrapper) wrapper.setAttribute("aria-label", timerDisabled ? "بدون وقت" : `${remainingTime} ثانية`);
}
