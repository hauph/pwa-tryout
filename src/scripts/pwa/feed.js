const shareImageButton = document.querySelector('#share-image-button');
const createPostArea = document.querySelector('#create-post');
const closeCreatePostModalButton = document.querySelector(
  '#close-create-post-modal-btn',
);
const sharedMomentsArea = document.querySelector('#shared-moments');
const form = document.querySelector('form');
const titleInput = document.querySelector('#title');
const locationInput = document.querySelector('#location');

// Currently not in use, allows to save assets in cache on demand otherwise
function onSaveButtonClicked(event) {
  console.log('clicked');
  if ('caches' in window) {
    caches.open('user-requested').then((cache) => {
      cache.add('https://httpbin.org/get');
      cache.add('/images/sf-boat.jpg');
    });
  }
}

function clearCards() {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(data) {
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

  // const cardSaveButton = document.createElement('button');
  // cardSaveButton.textContent = 'Save';
  // cardSaveButton.addEventListener('click', onSaveButtonClicked);
  // cardSupportingText.appendChild(cardSaveButton);

  cardWrapper.appendChild(cardSupportingText);
  window.componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data) {
  clearCards();
  for (let i = 0; i < data.length; i++) {
    createCard(data[i]);
  }
}

function openCreatePostModal() {
  createPostArea.style.transform = 'translateY(0)';

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

function closeCreatePostModal() {
  createPostArea.style.transform = 'translateY(100vh)';
}

function sendData() {
  fetch(
    'https://us-central1-learn-pwa-dc1c0.cloudfunctions.net/storePostData',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        id: new Date().toISOString(),
        title: titleInput.value,
        location: locationInput.value,
        image:
          'https://firebasestorage.googleapis.com/v0/b/learn-pwa-dc1c0.appspot.com/o/IMG_2538.JPG?alt=media&token=6814fc09-5cf9-4f83-9a89-1736d463e191',
      }),
    },
  ).then((res) => {
    console.log('Sent data', res);
    updateUI();
  });
}

export function feedInit() {
  let networkDataReceived = false;

  fetch(
    'https://learn-pwa-dc1c0-default-rtdb.asia-southeast1.firebasedatabase.app/posts.json',
  )
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      networkDataReceived = true;
      console.log('From web', data);
      const dataArray = [];
      // eslint-disable-next-line
      for (const key in data) {
        dataArray.push(data[key]);
      }
      updateUI(dataArray);
    });

  // // Cache then Network
  // if ('caches' in window) {
  //   caches
  //     .match(url)
  //     // eslint-disable-next-line
  //     .then((response) => {
  //       if (response) {
  //         return response.json();
  //       }
  //     })
  //     .then((data) => {
  //       console.log('From cache', data);
  //       if (!networkDataReceived) {
  //         const dataArray = [];
  //         // eslint-disable-next-line
  //         for (const key in data) {
  //           dataArray.push(data[key]);
  //         }
  //         updateUI(dataArray);
  //       }
  //     });
  // }

  // // IndexedDB then Network
  if ('indexedDB' in window) {
    // eslint-disable-next-line
    readAllData('posts').then((data) => {
      if (!networkDataReceived) {
        console.log('From cache', data);
        updateUI(data);
      }
    });
  }

  shareImageButton.addEventListener('click', openCreatePostModal);

  closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (titleInput.value.trim() === '' || locationInput.value.trim() === '') {
      alert('Please enter valid data!');
      return;
    }

    closeCreatePostModal();

    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then((sw) => {
        const post = {
          id: new Date().toISOString(),
          title: titleInput.value,
          location: locationInput.value,
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
      sendData();
    }
  });
}
