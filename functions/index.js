/* eslint-disable max-len */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({origin: true});
const webpush = require("web-push");
const fs = require("fs");
const UUID = require("uuid-v4");
const os = require("os");
const Busboy = require("busboy");
const path = require("path");
const {Storage} = require("@google-cloud/storage");

require("dotenv").config();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
const PROJECT_ID = "learn-pwa-dc1c0";

const serviceAccount = require("./pwagram-fb-key.json");

const gcconfig = {
  projectId: PROJECT_ID,
  keyFilename: "pwagram-fb-key.json",
};

const gcs = new Storage(gcconfig);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://learn-pwa-dc1c0-default-rtdb.asia-southeast1.firebasedatabase.app/",
});

exports.storePostData = functions.https.onRequest(function(request, response) {
  cors(request, response, function() {
    // eslint-disable-next-line
    const uuid = UUID();

    const busboy = new Busboy({headers: request.headers});
    // These objects will store the values (file + fields) extracted from busboy
    let upload;
    const fields = {};

    // This callback will be invoked for each file uploaded
    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
      console.log(
          `File [${fieldname}] filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`
      );
      const filepath = path.join(os.tmpdir(), filename);
      upload = {file: filepath, type: mimetype};
      file.pipe(fs.createWriteStream(filepath));
    });

    // This will invoked on every field detected
    busboy.on(
        "field",
        function(
            fieldname,
            val,
            fieldnameTruncated,
            valTruncated,
            encoding,
            mimetype
        ) {
          fields[fieldname] = val;
        }
    );

    // This callback will be invoked after all uploaded files are saved.
    busboy.on("finish", () => {
      const bucket = gcs.bucket(PROJECT_ID + ".appspot.com");
      bucket.upload(
          upload.file,
          {
            uploadType: "media",
            metadata: {
              metadata: {
                contentType: upload.type,
                firebaseStorageDownloadTokens: uuid,
              },
            },
          },
          function(err, uploadedFile) {
            if (!err) {
              admin
                  .database()
                  .ref("posts")
                  .push({
                    id: fields.id,
                    title: fields.title,
                    location: fields.location,
                    rawLocation: {
                      lat: fields.rawLocationLat,
                      lng: fields.rawLocationLng,
                    },
                    image:
                  "https://firebasestorage.googleapis.com/v0/b/" +
                  bucket.name +
                  "/o/" +
                  encodeURIComponent(uploadedFile.name) +
                  "?alt=media&token=" +
                  uuid,
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

                      webpush
                          .sendNotification(
                              pushConfig,
                              JSON.stringify({
                                title: "New Post",
                                content: "New Post added!",
                                openUrl: "/pages/help",
                              })
                          )
                          .catch(function(err) {
                            console.log(err);
                          });
                    });
                    response
                        .status(201)
                        .json({message: "Data stored", id: fields.id});
                  })
                  .catch(function(err) {
                    response.status(500).json({error: err});
                  });
            } else {
              console.log(err);
            }
          }
      );
    });

    // The raw bytes of the upload will be in request.rawBody.  Send it to busboy, and get
    // a callback when it's finished.
    busboy.end(request.rawBody);
  });
});

exports.deletePostData = functions.https.onRequest(function(
    request,
    response
) {
  cors(request, response, function() {});
});
