
const applicationServerPublicKey = 'BG7lJ6h6ROacjc2T9o3GsrzoG9ysjSFTNT6c-YaGZ9v7ch3nQ8uMHMoVWmgc-qCn7PG6DkYXkVudAJOw88shppI'

const pushButton = document.querySelector('.js-push-btn')

let isSubscribed = false
let swRegistration = null

// register service worker
if ('serviceWorker' in navigator && 'PushManager' in window) {
  console.log('Service Worker and Push is supported')
  // navigator.serviceWorker.register('/sw-test/sw.js', { scope: '/sw-test/' })
  navigator.serviceWorker.register('sw.js')
  .then(function(reg) {
    if(reg.installing) {
      console.log('Service worker installing');
    } else if(reg.waiting) {
      console.log('Service worker installed');
    } else if(reg.active) {
      console.log('Service worker active');
    }
    swRegistration = reg
    initializeUI()
  }).catch(function(error) {
    // registration failed
    console.log('Registration failed with ' + error);
  });
} else {
  console.warn('Service worker or push not supported')
}

function updateButton() {
  if(isSubscribed) {
    pushButton.textContent = 'Disable Push Messaging'
  } else {
    pushButton.textContent = 'Enable Push Messaging'
  }

  pushButton.disabled = false
}

function urlB64ToUint8Array(base64String) { 
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/\_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function subscribeUser() {
  const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey)
  swRegistration.pushManager.subscribe({
    userVisibilityOnly: true,
    applicationServerKey: applicationServerKey
  })
  .then(function(subscription) {
    console.log('User is subscribed')

    updateSubscriptionOnServer(subscription)

    isSubscribed = true

    updateButton()
  })
  .catch(function(err) {
    console.log('failed to subscribe the user: ', err)
    updateButton()
  })
}

function initializeUI() {

  pushButton.addEventListener('click', function ()  {
    pushButton.disabled = true
    if (isSubscribed) {
      // TODO: Unsubscribe User
    } else {
      subscribeUser()
    }
  })

// set initial subscription value
  swRegistration.pushManager.getSubscription() 
  .then(subscription => {
    isSubscribed = !(subscription === null)

    if (isSubscribed) {
      console.log('User IS subscribed')
    } else {
      console.log('User is NOT subscribed')
    }

    updateButton()
  })

}

// function for loading each image via XHR

function imgLoad(imgJSON) {
  // return a promise for an image loading
  return new Promise(function(resolve, reject) {
    var request = new XMLHttpRequest();
    request.open('GET', imgJSON.url);
    request.responseType = 'blob';

    request.onload = function() {
      if (request.status == 200) {
        var arrayResponse = [];
        arrayResponse[0] = request.response;
        arrayResponse[1] = imgJSON;
        resolve(arrayResponse);
      } else {
        reject(Error('Image didn\'t load successfully; error code:' + request.statusText));
      }
    };

    request.onerror = function() {
      reject(Error('There was a network error.'));
    };

    // Send the request
    request.send();
  });
}

var imgSection = document.querySelector('section');

window.onload = function() {

  // load each set of image, alt text, name and caption
  for(var i = 0; i<=Gallery.images.length-1; i++) {
    imgLoad(Gallery.images[i]).then(function(arrayResponse) {

      var myImage = document.createElement('img');
      var myFigure = document.createElement('figure');
      var myCaption = document.createElement('caption');
      var imageURL = window.URL.createObjectURL(arrayResponse[0]);

      myImage.src = imageURL;
      myImage.setAttribute('alt', arrayResponse[1].alt);
      myCaption.innerHTML = '<strong>' + arrayResponse[1].name + '</strong>: Taken by ' + arrayResponse[1].credit;

      imgSection.appendChild(myFigure);
      myFigure.appendChild(myImage);
      myFigure.appendChild(myCaption);

    }, function(Error) {
      console.log(Error);
    });
  }
};
