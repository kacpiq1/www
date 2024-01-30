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
        document.getElementById(elementId).innerHTML = "Kurs jest już dostępny";
      }
    }
  
    updateDisplay();
  
    setInterval(updateDisplay, updateInterval);
  }
  
  updateCountdown(new Date(2024, 1, 16, 14, 0, 0), 'countdown1');
  updateCountdown(new Date(2024, 1, 20, 17, 30, 0), 'countdown2');
  updateCountdown(new Date(2024, 1, 23, 14, 0, 0), 'countdown3');
  updateCountdown(new Date(2024, 1, 25, 17, 30, 0), 'countdownP1');
  updateCountdown(new Date(2024, 1, 27, 14, 0, 0), 'countdownP2');
  updateCountdown(new Date(2024, 1, 29, 17, 30, 0), 'countdownP3');
  