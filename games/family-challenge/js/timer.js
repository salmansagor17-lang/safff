let timerInterval = null;
let remainingTime = 30;

function startTimer(seconds, onTimeout) {
  stopTimer();
  remainingTime = seconds;
  updateTimerDisplay();

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

  element.textContent = remainingTime;
  element.classList.toggle("timer-danger", remainingTime <= 5);
}
