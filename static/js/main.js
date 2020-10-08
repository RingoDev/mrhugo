
function requestNotificationPermission(){
  console.log("requested Permission");
  if ('Notification' in window && navigator.serviceWorker) {
  // Display the UI to let the user toggle notifications
    console.log("Notification ability exists");
    Notification.requestPermission(function(status) {
      console.log('Notification permission status:', status);
    });
  }
  return;
}

function displayNotification() {
  console.log("trying to display Notification")
  if (Notification.permission === 'granted') {
    navigator.serviceWorker.getRegistration().then(function(reg) {
      var options = {
        body: 'Here is a notification body!',
        icon: 'img/logo.png',
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: 1
        }
      };
      reg.showNotification('Hello world!', options);
    });
  } else if (Notification.permission === "blocked") {
 /* the user has previously denied push. Can't reprompt. */
    return;
  } else {
  /* show a prompt to the user */
    requestNotificationPermission();
  }
}
