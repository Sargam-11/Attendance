const video = document.getElementById("video");

Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
]).then(startWebcam);

function startWebcam() {
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: false,
    })
    .then((stream) => {
      video.srcObject = stream;
    })
    .catch((error) => {
      console.error(error);
    });
}
startWebcam()

function getLabeledFaceDescriptions() {
  const labels = ["Sargam", "Satvik"];
  return Promise.all(
    labels.map(async (label) => {
      const descriptions = [];
      for (let i = 1; i <= 2; i++) {
        const img = await faceapi.fetchImage(`./labels/${label}/${i}.png`);
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        descriptions.push(detections.descriptor);
      }
      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
}
// // function to save the detected face data into a json file
// function saveFaceDataToFile(data) {
//   const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
//   const url = URL.createObjectURL(blob);
//   const link = document.createElement('a');
//   link.href = url;
//   link.download = 'face_data.json';
//   link.click();
//   URL.revokeObjectURL(url);
//  }
 
//  // function to download the json file when the button is clicked
//  async function downloadFaceData() {
//   const faceDescriptions = await getLabeledFaceDescriptions();
//   saveFaceDataToFile(faceDescriptions);
//  }
 
//  // attach the downloadFaceData function to the button click event
//  document.getElementById('downloadButton').addEventListener('click', downloadFaceData);
async function saveData() {
  const data = await getLabeledFaceDescriptions();
  const dataToSave = data.map(d => ({ label: d.label, descriptions: d.descriptors.map(descriptor => descriptor.toString()) }));
  const blob = new Blob([JSON.stringify(dataToSave)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.download = 'face_data.json';
  a.href = url;
  a.textContent = 'Download json';
  a.click();
  URL.revokeObjectURL(url);
 }
 
 document.getElementById('downloadJson').addEventListener('click', saveData);

video.addEventListener("play", async () => {
  const labeledFaceDescriptors = await getLabeledFaceDescriptions();
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);

  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video)
      .withFaceLandmarks()
      .withFaceDescriptors();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    const results = resizedDetections.map((d) => {
      return faceMatcher.findBestMatch(d.descriptor);
    });
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: result,
      });
      drawBox.draw(canvas);
    });
  }, 100);
});