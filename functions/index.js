/* eslint-disable max-len */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({origin: true});
const webpush = require("web-push");
require("dotenv").config();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

const serviceAccount = require("./pwagram-fb-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://learn-pwa-dc1c0-default-rtdb.asia-southeast1.firebasedatabase.app/",
});

exports.storePostData = functions.https.onRequest(function(request, response) {
  cors(request, response, function() {
    admin.database().ref("posts").push({
      id: request.body.id,
      title: request.body.title,
      location: request.body.location,
      image: request.body.image,
    })
        .then(function() {
          webpush.setVapidDetails(
              "mailto:hauph93@gmail.com",
              process.env.WEB_PUSH_PUBLIC,
              process.env.WEB_PUSH_SECRET
          );
          return admin.database().ref("subscriptions").once("value");
        })
        .then(function(subscriptions) {
          subscriptions.forEach(function(sub) {
            // const pushConfig = {
            //   endpoint: sub.val().endpoint,
            //   keys: {
            //     auth: sub.val().keys.auth,
            //     p256dh: sub.val().keys.p256dh,
            //   },
            // };
            const pushConfig = sub.val();
            webpush.sendNotification(
                pushConfig,
                JSON.stringify({title: "New Post", content: "New Post added!", openUrl: "/pages/help"})
            )
                .catch(function(err) {
                  console.log(err);
                });
          });
          response.status(201)
              .json({message: "Data stored", id: request.body.id});
        })
        .catch(function(err) {
          response.status(500).json({error: err});
        });
  });
});
