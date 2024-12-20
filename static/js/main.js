 
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js', { scope: '/' })
  .then(function(reg) {
    //console.log('Service Worker Registered!', reg);
    checkSubscriptionState(reg);
    reg.pushManager.getSubscription().then(function(sub) {
      if (sub === null) {
      } else {
        sendSubscriptionToBackend(sub); 
      }
    });
  })
   .catch(function(err) {
    console.log('Service Worker registration failed: ', err);
  });
}

function checkSubscriptionState(reg){
  reg.pushManager.getSubscription().then(function(sub) {
    var subBtn = document.getElementById("subscribe");
    var unsubBtn = document.getElementById("unsubscribe");
    if (sub === null) {
      console.log("no Subscription");
      // toggle
      subBtn.style.display = "block";
      unsubBtn.style.display = "none";
    }else {
      subBtn.style.display = "none";
      unsubBtn.style.display = "block";
    }
  });
}

function unSubscribeUser() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(function(reg) {
      reg.pushManager.getSubscription().then(function(sub) {
        sub.unsubscribe().then(function(success) {
	  // usubscribed
        }).catch(function(e) {
	  // unsubscription failed
	}).finally(function() {
          checkSubscriptionState(reg);
	});
      })
    })
  }
}



function subscribeUser() {
  if ('serviceWorker' in navigator) {
    const publicKey = new Uint8Array([0x04,0x80,0xf3,0x15,0xa4,0xce,0x11,0x94,0x52,0x4e,0xcf,0x49,0xa1,0x24,0xf8,0x8d,0x09,0x1c,0x17,0x80,0xa2,0x7a,0x30,0x2b,0x32,0x87,0x05,0x1b,0x86,0xf8,0xee,0x3b,0x2e,0x31,0xb7,0xd4,0xcb,0xe0,0xfe,0x94,0xb3,0x98,0x94,0xee,0x67,0x3d,0x05,0x3a,0x4a,0xed,0x25,0xcb,0xb9,0xfa,0x70,0x94,0xeb,0xc3,0xe4,0x24,0x2b,0x88,0xe0,0x57,0xa8]);

    navigator.serviceWorker.ready.then(function(reg) {
      reg.pushManager.subscribe({
        userVisibleOnly: true,
	applicationServerKey: publicKey
      }).then(function(sub) {  
        checkSubscriptionState(reg);
        sendSubscriptionToBackend(sub);
        //console.log('Endpoint URL: ', sub.endpoint);
      }).catch(function(e) {
        if (Notification.permission === 'denied') {
          console.warn('Permission for notifications was denied');
        } else {
          console.error('Unable to subscribe to push', e);
        }
      });
    })
  }
}

function sendSubscriptionToBackend(subscription){
  var key = subscription.getKey ? subscription.getKey('p256dh') : '';
  var auth = subscription.getKey ? subscription.getKey('auth') : '';
  var xhttp = new XMLHttpRequest();
  xhttp.open("POST", "https://backend.ringodev.com:444/subscription/add", true);
  xhttp.setRequestHeader("Content-type", "application/json;charset=UTF-8");
  xhttp.send(JSON.stringify({
    endpoint: subscription.endpoint,
    key: key ? btoa(String.fromCharCode.apply(null, new Uint8Array(key))) : '',
    auth: auth ? btoa(String.fromCharCode.apply(null, new Uint8Array(auth))) : ''
  }));
}

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
        icon: 'img/logo_1024px.png',
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
