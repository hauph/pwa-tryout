const shareImageButton = document.querySelector('#share-image-button');
const createPostArea = document.querySelector('#create-post');
const closeCreatePostModalButton = document.querySelector(
  '#close-create-post-modal-btn',
);
const sharedMomentsArea = document.querySelector('#shared-moments');
const form = document.querySelector('form');
const titleInput = document.querySelector('#title');
const locationInput = document.querySelector('#location');
const videoPlayer = document.querySelector('#player');
const canvasElement = document.querySelector('#canvas');
const captureButton = document.querySelector('#capture-btn');
const imagePicker = document.querySelector('#image-picker');
const imagePickerArea = document.querySelector('#pick-image');
const locationBtn = document.querySelector('#location-btn');
const locationLoader = document.querySelector('#location-loader');

class Feed {
  picture;

  constructor() {
    this.fetchedLocation = { lat: 0, lng: 0 };
    this.networkDataReceived = false;

    this.init();
  }

  init() {
    this.fetchData();
    this.formSubmit();
    this.addEvents();

    // IndexedDB then Network
    if ('indexedDB' in window) {
      // eslint-disable-next-line
      readAllData('posts').then((data) => {
        if (!this.networkDataReceived) {
          console.log('From cache', data);
          this.updateUI(data);
        }
      });
    }
  }

  initializeLocation() {
    if (!('geolocation' in navigator)) {
      locationBtn.style.display = 'none';
    }
  }

  initializeMedia() {
    if (!('mediaDevices' in navigator)) {
      navigator.mediaDevices = {};
    }

    if (!('getUserMedia' in navigator.mediaDevices)) {
      navigator.mediaDevices.getUserMedia = function (constraints) {
        const getUserMedia =
          navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

        if (!getUserMedia) {
          return Promise.reject(new Error('getUserMedia is not implemented!'));
        }

        return new Promise((resolve, reject) => {
          getUserMedia.call(navigator, constraints, resolve, reject);
        });
      };
    }

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoPlayer.srcObject = stream;
        videoPlayer.style.display = 'block';
      })
      .catch((err) => {
        imagePickerArea.style.display = 'block';
      });
  }

  openCreatePostModal() {
    setTimeout(() => {
      createPostArea.style.transform = 'translateY(0)';
    }, 1);
    this.initializeMedia();
    this.initializeLocation();

    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();

      window.deferredPrompt.userChoice.then((choiceResult) => {
        console.log(choiceResult.outcome);

        if (choiceResult.outcome === 'dismissed') {
          console.log('User cancelled installation');
        } else {
          console.log('User added to home screen');
        }
      });

      window.deferredPrompt = null;
    }
  }

  closeCreatePostModal() {
    imagePickerArea.style.display = 'none';
    videoPlayer.style.display = 'none';
    canvasElement.style.display = 'none';
    locationBtn.style.display = 'inline';
    captureButton.style.display = 'inline';
    locationLoader.style.display = 'none';
    if (videoPlayer.srcObject) {
      videoPlayer.srcObject.getVideoTracks().forEach((track) => {
        track.stop();
      });
    }
    setTimeout(() => {
      createPostArea.style.transform = 'translateY(100vh)';
    }, 1);
  }

  clearCards() {
    while (sharedMomentsArea.hasChildNodes()) {
      sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
    }
  }

  createCard(data) {
    const cardWrapper = document.createElement('div');
    cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
    const cardTitle = document.createElement('div');
    cardTitle.className = 'mdl-card__title';
    cardTitle.style.backgroundImage = `url(${data.image})`;
    cardTitle.style.backgroundSize = 'cover';
    cardTitle.style.height = '180px';
    cardWrapper.appendChild(cardTitle);
    const cardTitleTextElement = document.createElement('h2');
    cardTitleTextElement.style.color = 'white';
    cardTitleTextElement.className = 'mdl-card__title-text';
    cardTitleTextElement.textContent = data.title;
    cardTitle.appendChild(cardTitleTextElement);
    const cardSupportingText = document.createElement('div');
    cardSupportingText.className = 'mdl-card__supporting-text';
    cardSupportingText.textContent = data.location;
    cardSupportingText.style.textAlign = 'center';
    cardWrapper.appendChild(cardSupportingText);
    window.componentHandler.upgradeElement(cardWrapper);
    sharedMomentsArea.appendChild(cardWrapper);
  }

  updateUI(data) {
    this.clearCards();
    for (let i = 0; i < data.length; i++) {
      this.createCard(data[i]);
    }
  }

  fetchData() {
    fetch(
      'https://learn-pwa-dc1c0-default-rtdb.asia-southeast1.firebasedatabase.app/posts.json',
    )
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        this.networkDataReceived = true;
        console.log('From web', data);
        const dataArray = [];
        // eslint-disable-next-line
        for (const key in data) {
          dataArray.push(data[key]);
        }
        this.updateUI(dataArray);
      });
  }

  sendData() {
    const id = new Date().toISOString();
    const postData = new FormData();
    postData.append('id', id);
    postData.append('title', titleInput.value);
    postData.append('location', locationInput.value);
    postData.append('rawLocationLat', this.fetchedLocation.lat);
    postData.append('rawLocationLng', this.fetchedLocation.lng);
    postData.append('file', this.picture, `${id}.png`);

    fetch(
      'https://us-central1-learn-pwa-dc1c0.cloudfunctions.net/storePostData',
      {
        method: 'POST',
        body: postData,
      },
    ).then((res) => {
      console.log('Sent data', res);
      this.updateUI();
    });
  }

  formSubmit() {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      if (titleInput.value.trim() === '' || locationInput.value.trim() === '') {
        alert('Please enter valid data!');
        return;
      }

      if (!this.picture) {
        alert('No image selected/captured!');
      }

      this.closeCreatePostModal();

      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then((sw) => {
          const post = {
            id: new Date().toISOString(),
            title: titleInput.value,
            location: locationInput.value,
            picture: this.picture,
            rawLocation: this.fetchedLocation,
          };
          // eslint-disable-next-line
          writeData('sync-posts', post)
            .then(() => {
              return sw.sync.register('sync-new-posts');
            })
            .then(() => {
              const snackbarContainer = document.querySelector(
                '#confirmation-toast',
              );
              const data = { message: 'Your Post was saved for syncing!' };
              snackbarContainer.MaterialSnackbar.showSnackbar(data);
            })
            .catch((err) => {
              console.log(err);
            });
        });
      } else {
        this.sendData();
      }
    });
  }

  addEvents() {
    // Share image button
    shareImageButton.addEventListener('click', this.openCreatePostModal);

    // Close create post modal button
    closeCreatePostModalButton.addEventListener(
      'click',
      this.closeCreatePostModal,
    );

    // Capture button
    captureButton.addEventListener('click', (event) => {
      canvasElement.style.display = 'block';
      videoPlayer.style.display = 'none';
      captureButton.style.display = 'none';
      const context = canvasElement.getContext('2d');
      context.drawImage(
        videoPlayer,
        0,
        0,
        canvasElement.width,
        videoPlayer.videoHeight /
          (videoPlayer.videoWidth / canvasElement.width),
      );
      videoPlayer.srcObject.getVideoTracks().forEach((track) => {
        track.stop();
      });
      // eslint-disable-next-line
      this.picture = dataURItoBlob(canvasElement.toDataURL());
    });

    // Image picker
    imagePicker.addEventListener('change', (event) => {
      this.picture = event.target.files[0];
    });

    // Location button
    locationBtn.addEventListener('click', (event) => {
      if (!('geolocation' in navigator)) {
        return;
      }
      let sawAlert = false;

      locationBtn.style.display = 'none';
      locationLoader.style.display = 'block';

      navigator.geolocation.getCurrentPosition(
        (position) => {
          locationBtn.style.display = 'inline';
          locationLoader.style.display = 'none';
          this.fetchedLocation = { lat: position.coords.latitude, lng: 0 };
          locationInput.value = 'In Munich';
          document
            .querySelector('#manual-location')
            .classList.add('is-focused');
        },
        (err) => {
          console.log(err);
          locationBtn.style.display = 'inline';
          locationLoader.style.display = 'none';
          if (!sawAlert) {
            alert("Couldn't fetch location, please enter manually!");
            sawAlert = true;
          }
          this.fetchedLocation = { lat: 0, lng: 0 };
        },
        { timeout: 7000 },
      );
    });
  }
}

export default function feedInstance() {
  return new Feed();
}
