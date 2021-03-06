import tippy from 'tippy.js';
import Toastr from '../toastr/toastr';

const header = document.querySelector('header');
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
const modal = document.getElementById('myModal');
const modalImg = document.getElementById('modal-content');
const titleText = document.getElementById('modal-title');
const captionText = document.getElementById('modal-caption');
const modalCloseBtn = document.getElementById('modal-close');
const modalPrevBtn = document.getElementById('modal--btn-prev');
const modalNextBtn = document.getElementById('modal--btn-next');

export default class FeedView {
  constructor(controller) {
    const instance = this.constructor.instance;
    if (instance) {
      return instance;
    }
    this.controller = controller;
    this.model = controller.model;
    this.init();
  }

  init() {
    this.formSubmit();
    this.addEvents();
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
      header.style.display = 'none';
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
    header.style.display = 'block';
    imagePickerArea.style.display = 'none';
    imagePicker.value = '';
    videoPlayer.style.display = 'none';
    canvasElement.style.display = 'none';
    locationBtn.style.display = 'inline';
    captureButton.style.display = 'inline';
    locationLoader.style.display = 'none';
    titleInput.value = '';
    locationInput.value = '';
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
    cardWrapper.className =
      'shared-moment-card mdl-cell--3-col mdl-cell--4-col-tablet mdl-card mdl-shadow--2dp';
    const cardTitle = document.createElement('div');
    cardTitle.className = 'mdl-card__title';
    cardTitle.style.backgroundImage = `url(${data.image})`;
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
    const deleteButton = document.createElement('div');
    deleteButton.className = 'btn__delete';
    deleteButton.setAttribute('data-tippy-content', 'Delete this post');
    const deleteIcon = document.createElement('span');
    deleteIcon.className = 'material-icons';
    deleteIcon.textContent = 'delete_outline';
    deleteButton.appendChild(deleteIcon);
    deleteButton.onclick = () => {
      this.deleteFeed(data.fbId);
    };
    cardWrapper.appendChild(deleteButton);
    cardWrapper.appendChild(cardSupportingText);
    cardWrapper.setAttribute('data-image', data.image);
    cardWrapper.setAttribute('id', data.fbId);
    window.componentHandler.upgradeElement(cardWrapper);
    sharedMomentsArea.appendChild(cardWrapper);
    cardTitle.onclick = () => {
      this.toggleImgModal(data);
    };
  }

  toggleImgModal(data) {
    modal.style.display = 'block';
    modalImg.src = data.image;
    titleText.innerHTML = data.title;
    captionText.innerHTML = data.location;
    modal.setAttribute('data-current-post', data.fbId);
  }

  deleteFeed(fbId) {
    this.controller.deleteData(fbId);
  }

  async updateUI(data) {
    this.clearCards();
    for (let i = 0; i < data.length; i++) {
      // eslint-disable-next-line
      const shouldRender = await getSpecificData(
        'sync-deleted-posts',
        data[i].fbId,
      );
      if (!shouldRender) {
        this.createCard(data[i]);
      }
    }
    tippy('[data-tippy-content]');
  }

  formSubmit() {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      if (titleInput.value.trim() === '' || locationInput.value.trim() === '') {
        Toastr('error', 'Please enter valid data!', '');
        return;
      }

      if (!this.model.picture) {
        Toastr('error', 'No image selected/captured!', '');
        return;
      }

      this.controller.handleFormSubmit(titleInput.value, locationInput.value);
      this.closeCreatePostModal();
    });
  }

  addEvents() {
    // Share image button
    shareImageButton.addEventListener('click', () => {
      this.openCreatePostModal();
    });

    // Close create post modal button
    closeCreatePostModalButton.addEventListener(
      'click',
      this.closeCreatePostModal,
    );

    // Capture button
    captureButton.addEventListener('click', (event) => {
      canvasElement.style.display = 'block';
      canvasElement.setAttribute('width', videoPlayer.offsetWidth);
      canvasElement.setAttribute('height', videoPlayer.offsetHeight);
      const context = canvasElement.getContext('2d');
      context.drawImage(
        videoPlayer,
        0,
        0,
        videoPlayer.offsetWidth,
        videoPlayer.offsetHeight,
      );
      videoPlayer.style.display = 'none';
      captureButton.style.display = 'none';
      videoPlayer.srcObject.getVideoTracks().forEach((track) => {
        track.stop();
      });
      // eslint-disable-next-line
      this.model.updatePicture(dataURItoBlob(canvasElement.toDataURL()));
    });

    // Image picker
    imagePicker.addEventListener('change', (event) => {
      this.model.updatePicture(event.target.files[0]);
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
          this.model.updateLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`,
          )
            .then((res) => {
              return res.json();
            })
            .then((data) => {
              locationInput.value = data.address.road;
              document
                .querySelector('#manual-location')
                .classList.add('is-focused');
            })
            .catch((err) => {
              console.error('error fetching location >>>', err);
              if (!sawAlert) {
                Toastr(
                  'error',
                  "Couldn't fetch location, please enter manually!",
                  '',
                );
                sawAlert = true;
              }
              this.model.updateLocation({ lat: 0, lng: 0 });
            });
        },
        (err) => {
          console.error(err);
          locationBtn.style.display = 'inline';
          locationLoader.style.display = 'none';
          if (!sawAlert) {
            Toastr(
              'error',
              "Couldn't fetch location, please enter manually!",
              '',
            );
            sawAlert = true;
          }
          this.model.updateLocation({ lat: 0, lng: 0 });
        },
      );
    });

    // Button to close modal
    modalCloseBtn.onclick = function () {
      modal.style.display = 'none';
    };

    modal.onclick = function (e) {
      const target = e.target;
      if (target === modal) {
        modal.style.display = 'none';
      }
    };

    modalPrevBtn.addEventListener('click', () => {
      const currentData = modal.getAttribute('data-current-post');
      this.controller.handlePrevNext('prev', currentData);
    });

    modalNextBtn.addEventListener('click', () => {
      const currentData = modal.getAttribute('data-current-post');
      this.controller.handlePrevNext('next', currentData);
    });
  }
}
