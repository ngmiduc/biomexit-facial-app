let BUSY = false
let forwardTimes = []
let withBoxes = true

function onChangeHideBoundingBoxes(e) {
  withBoxes = !$(e.target).prop("checked")
}

function updateTimeStats(timeInMs) {
  forwardTimes = [timeInMs].concat(forwardTimes).slice(0, 30)
  const avgTimeInMs =
    forwardTimes.reduce((total, t) => total + t) / forwardTimes.length
  $("#time").val(`${Math.round(avgTimeInMs)} ms`)
  $("#fps").val(`${faceapi.round(1000 / avgTimeInMs)}`)
}

var counter = 0
var fail = 0

async function onPlay() {
  const videoEl = $("#inputVideo").get(0)

  if (videoEl.paused || videoEl.ended || !isFaceDetectionModelLoaded())
    return setTimeout(() => onPlay())

  const options = getFaceDetectorOptions()

  const ts = Date.now()

  const result = await faceapi
    .detectSingleFace(videoEl, options)
    .withFaceLandmarks()

  updateTimeStats(Date.now() - ts)

  if (result) {
    counter++

    const canvas = $("#overlay").get(0)
    const dims = faceapi.matchDimensions(canvas, videoEl, true)
    const resizedResult = faceapi.resizeResults(result, dims)

    if (withBoxes) {
      faceapi.draw.drawDetections(canvas, resizedResult)
    }
    faceapi.draw.drawFaceLandmarks(canvas, resizedResult)

    if (counter % 100 == 0) {
      if (!BUSY) {
        BUSY = true

        function capture(video, scaleFactor) {
          if (scaleFactor == null) {
            scaleFactor = 1
          }
          var w = video.videoWidth * scaleFactor
          var h = video.videoHeight * scaleFactor
          var canvas = document.createElement("canvas")
          canvas.width = w
          canvas.height = h
          var ctx = canvas.getContext("2d")
          ctx.drawImage(video, 0, 0, w, h)
          return canvas
        }

        function shoot() {
          var video = document.getElementById("inputVideo")
          var body = document.getElementById("body")
          var canvas = capture(video, 1)
          canvas.onclick = function() {
            window.open(this.toDataURL())
          }

          return canvas
        }

        var can = shoot()

        if (withBoxes) {
          faceapi.draw.drawDetections(can, resizedResult)
        }
        faceapi.draw.drawFaceLandmarks(can, resizedResult)

        console.log("TRACKING IMAGE / UPLOAD TO DATABASE")

        can.toBlob(function(blob) {
          var image = new Image()
          image.src = blob
          const stamp = new Date().getUTCMilliseconds()
          const t = new Date().getUTCMilliseconds()
          const ID =
            t +
            Math.random()
              .toString(36)
              .substr(2, 9)

          var uploadTask = storageRef
            .child("faces/" + ID + ".jpg")
            .put(blob)
            .then(snapshot => {
              snapshot.ref.getDownloadURL().then(function(downloadURL) {
                console.log("File available at", downloadURL)
                console.log("STAMP ID is ", ID)

                let ana = [
                  "REAT LEVEL LOW",
                  "THREAT LEVEL MEDIUM",
                  "CODE ORANGE",
                  "UNKNOWN",
                  "REPORT IMMEDIATELY",
                  "AROUSED",
                  "PEACEFUL",
                  "ATTRACTIVE",
                  "INTELLIGENT",
                  "APPREHENSIVE",
                  "ABNORMAL",
                  "ABOVE AVERAGE",
                  "HIGH EARNER",
                  "DOMINANT",
                  "INEBRIATED",
                  "DISINTERESTED",
                  "DOG",
                  "POLICE",
                  "NAIL BITING",
                  "VEGETERIAN",
                  "SUSPICIOUS BEHAVIOR",
                  "JOY",
                  "NO THANK YOU",
                  "CONSTIPATED",
                  "NEUTRAL",
                  "THINKING",
                  "DISGUSTED",
                  "SHOCKED",
                  "HAPPY",
                  "TRESPASS",
                  "HUMAN",
                  "LAUGHING",
                  "SMILING",
                  "CONFUSED",
                  "CONTENT",
                  "BANANA",
                  "STREET CLOSED",
                  "$100",
                  "SUCCESSFUL",
                  "NETWORKING",
                  "VIKING",
                  "WOODY HARRELSON",
                  "POTENTIAL TERRORIST",
                  "BORED",
                  "PASSIVE AGGRESSIVE",
                  "THREAT LEVEL LOW",
                  "THREAT LEVEL MEDIUM",
                  "CODE ORANGE ",
                  "UNKNOWN",
                  "REPORT IMMEDIATELY",
                  "AROUSED ",
                  "PEACEFUL ",
                  "ATTRACTIVE",
                  "INTELLIGENT",
                  "APPREHENSIVE ",
                  "ABNORMAL ",
                  "ABOVE AVERAGE",
                  "HIGH EARNER ",
                  "DOMINANT",
                  "INEBRIATED",
                  "DISINTERESTED",
                  "DOG",
                  "POLICE",
                  "NAIL BITING",
                  "VEGETERIAN",
                  "SUSPICIOUS BEHAVIOR",
                  "JOY",
                  "NO THANK YOU",
                  "CONSTIPATED",
                  "NEUTRAL",
                  "THINKING",
                  "DISGUSTED",
                  "SHOCKED",
                  "HAPPY",
                  "TRESPASS",
                  "HUMAN",
                  "LAUGHING",
                  "SMILING",
                  "CONFUSED",
                  "CONTENT"
                ]

                db.collection("faces")
                  .add({
                    url: downloadURL,
                    date: new Date(),
                    analysis: ana[Math.floor(Math.random() * ana.length)]
                  })
                  .then(function(docRef) {
                    console.log("Document written with ID: ", docRef.id)
                  })
                  .catch(function(error) {
                    console.error("Error adding document: ", error)
                  })
              })
            })
        })

        BUSY = false
      } else console.log("BUSY APP ... skip")
    }
  } else {
    // console.log("not found");
    fail++
    if (fail > 100) {
      fail = 0
      // console.log("reset");
      var c = document.getElementById("overlay")
      var ctx = c.getContext("2d")
      ctx.fillStyle = "red"
      ctx.fillRect(0, 0, 1980, 1020)
      ctx.clearRect(0, 0, 1980, 1020)
    }
  }

  setTimeout(() => onPlay())
}

async function run() {
  // load face detection and face landmark models
  await changeFaceDetector(TINY_FACE_DETECTOR)
  await faceapi.loadFaceLandmarkModel("/")
  changeInputSize(608)

  // try to access users webcam and stream the images
  // to the video element
  const stream = await navigator.mediaDevices.getUserMedia({ video: {} })
  const videoEl = $("#inputVideo").get(0)
  videoEl.srcObject = stream
}

function updateResults() {}

$(document).ready(function() {
  renderNavBar("#navbar", "webcam_face_landmark_detection")
  initFaceDetectionControls()
  run()
})
