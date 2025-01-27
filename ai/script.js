const notification = document.getElementById('notification');
            setTimeout(() => {
              notification.classList.add('show');
            }, 500);
        
            // Hide the notification after 5 seconds
            setTimeout(() => {
              notification.classList.remove('show');
            }, 5500);
