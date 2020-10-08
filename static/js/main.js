
function requestNotificationPermission(){
	console.log("requested Permission");
	if ('Notification' in window && navigator.serviceWorker) {
  // Display the UI to let the user toggle notifications
		console.log("Notification ability exists");
	}
	return;
}
