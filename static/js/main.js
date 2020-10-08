
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
  if (Notification.permission == 'granted') {
    navigator.serviceWorker.getRegistration().then(function(reg) {
      reg.showNotification('Hello world!');
    });
  }
}
