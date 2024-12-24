// countdown.js

function updateCountdown(targetDate, elementId) {
    const updateInterval = 1000;
  
    function formatTimeUnit(unit) {
      return unit < 10 ? `0${unit}` : unit;
    }
  
    function formatDate(date) {
      const day = formatTimeUnit(date.getDate());
      const month = formatTimeUnit(date.getMonth() + 1);
      const year = date.getFullYear();
      const hours = formatTimeUnit(date.getHours());
      const minutes = formatTimeUnit(date.getMinutes());
      const seconds = formatTimeUnit(date.getSeconds());
      return `${day}.${month}.${year} ${hours}:${minutes}`;
    }
  
    function updateDisplay() {
      const currentDate = new Date();
      const timeDifference = targetDate - currentDate;
  
      if (timeDifference > 0) {
        const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);
  
        let countdownText;
  
        if (days > 0) {
          countdownText = `${formatDate(targetDate)} (za ${days} dni)`;
        } else if (hours > 0) {
          countdownText = `${formatDate(targetDate)} (za ${hours}h ${minutes}m)`;
        } else if (minutes > 0) {
          countdownText = `${formatDate(targetDate)} (za ${minutes}m ${seconds}s)`;
        } else {
          countdownText = `${formatDate(targetDate)} (za ${seconds}s)`;
        }
  
        document.getElementById(elementId).innerHTML = countdownText;
      } else {
        document.getElementById(elementId).innerHTML = "Odśwież stronę.";
      }
    }
  
    updateDisplay();
  
    setInterval(updateDisplay, updateInterval);
  }
  
updateCountdown(new Date(2024, 11, 29, 17, 0, 0), 'countdownOP');
  updateCountdown(new Date(2024, 11, 19, 17, 30, 0), 'updatecountdown');
