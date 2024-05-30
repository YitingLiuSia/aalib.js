import "rxjs/add/operator/do";

import ImageReader from "../src/readers/ImageReader";
import VideoReader from "../src/readers/VideoReader";
import ImageDataReader from "../src/readers/ImageDataReader";

import inverse from "../src/filters/inverse";
import contrast from "../src/filters/contrast";
import brightness from "../src/filters/brightness";
import linear from "../src/filters/linear";

import aa from "../src/aa";

import html, { ASCII_CHARSET } from "../src/renderers/HTMLRenderer";
import videoCanvas from "../src/renderers/CanvasRenderer";

import { appendToBody } from "./utils";

const charset = ASCII_CHARSET;
const resource = filename => `../resources/${ filename }`;

const RES = {
    MONA: resource("mona.png"),
    LENNA: resource("lenna.png"),
    MARYLIN: resource("marylin.jpg"),
    BBB: resource("bbb_720x480_30mb.mp4")
};

function pipeline(...args) {
    const src = args.shift();

    args
        .reduce((acc, it) => acc.map(it), src)
        .subscribe();
}

function mona() {
    pipeline(
        ImageReader.fromURL(RES.MONA),
        aa({ width: 200, height: 160, colored: false }),
        html({ charset }),
        appendToBody
    );
}


function idata() {
    const drawingCanvas = document.createElement("canvas");
    drawingCanvas.width = "320";
    drawingCanvas.height = "240";
    appendToBody(drawingCanvas);

    const ctx = drawingCanvas.getContext("2d");
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, 160, 240);
    ctx.fillStyle = "#eee";
    ctx.fillRect(160, 0, 160, 240);
    ctx.fillStyle = "#999";
    ctx.fillRect(160-40, 120-40, 80, 80);

    ImageDataReader.fromCanvas(drawingCanvas)
        .map(aa({ width: 80, height: 25, colored: false }))
        .map(html({ charset }))
        .do(appendToBody)
        .subscribe();
}

function localImage() {
    const filePicker = document.createElement("input");
    filePicker.type = "file";
    filePicker.addEventListener("change", createFileHandler(createAA));

    appendToBody(filePicker);

    function createFileHandler(createAA) {
        return (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                createAA(e.target.result);
            };

            reader.readAsDataURL(file);
        };
    }

    function createAA(imageUrl) {
        ImageReader.fromURL(imageUrl)
            .map(aa({ width: 210, height: 105, colored: false }))
            .map(html({ charset }))
            .do((el) => {
                filePicker.parentNode.insertBefore(el, filePicker.nextSibling);
            })
            .subscribe();
    }
}

function bbb() {
    const scene = document.createElement("canvas");
    const video = document.createElement("video");
    video.src = "../resources/bbb_720x480_30mb.mp4";
    video.controls = true;

    appendToBody(video);
    appendToBody(scene);

    VideoReader.fromVideoElement(video, { autoplay: false })
        .map(aa({ width: 165, height: 68, colored: true }))
        .map(videoCanvas({
            charset,
            width: 696,
            height: 476,
            el: scene
        }))
        .subscribe();
}

let videoCanvasElement = document.getElementById('video-scene');
let mediaRecorder;
let recordedChunks = [];
setupMediaRecorder(videoCanvasElement);
document.getElementById('startRecording').addEventListener('click', startRecording);
document.getElementById('stopAndDownload').addEventListener('click', stopRecording);

function setupMediaRecorder(canvas) {
    const stream = canvas.captureStream(25); // Capture at 25 fps
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });

    mediaRecorder.ondataavailable = function (event) {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = function () {
        const blob = new Blob(recordedChunks, {
            type: 'video/mp4'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'downloaded_video.mp4';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        recordedChunks = []; // Clear the recorded chunks
    };
} 

function startRecording() {
    mediaRecorder.start();
    console.log("Recording started");
}

function stopRecording() {
    mediaRecorder.stop();
    console.log("Recording stopped");
}

function fromVideoFile(file) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        console.log("url ", URL.createObjectURL(file));
        video.src = URL.createObjectURL(file);
        video.controls = true;  // Add controls so users can play/pause
        video.autoplay = true;  // Set autoplay to true to start playing automatically
        video.muted = true;     // Mute the video to allow autoplay in most browsers
        video.loop = true;      // Optional: Loop the video

        video.onloadedmetadata = () => {
            document.getElementById('video-container').appendChild(video);  // Append to a specific container
            resolve(video);
        };

        video.onerror = () => {
            reject(new Error("Failed to load video"));
        };
    });
}

document.getElementById('videoInput').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        fromVideoFile(file).then(video => {
            console.log("video", video);
            aalib.read.video.fromVideoElement(video)
                .map(aalib.aa({ width: 165, height: 68 }))
                .map(aalib.render.canvas({
                    width: 696,
                    height: 476,
                    fontFamily: "Sora",
                    el: document.querySelector("#video-scene")
                }))
                .subscribe();
        }).catch(error => {
            console.error("Error loading video:", error);
        });
    }
});

document.getElementById('imageInput').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const img = new Image();

            img.src = e.target.result;
            img.alt = 'Uploaded Image';
            img.onload = function () {
                // Image is loaded and can be manipulated or displayed
                aalib.read.image.fromURL(img.src)
                    .map(aalib.aa({ width: 200, height: 59, colored: false }))
                    .map(aalib.render.html({ background: "new rgba(0,0,0,)", color: 'red', fontFamily: "Sora" }))
                    .do(function (el) {
                        document.body.appendChild(el);
                    })
                    .subscribe(); // Optionally, you can now process the image further

            };
        };

        reader.onerror = function () {
            console.error('Error loading the image');
        };

        reader.readAsDataURL(file);
    } else {
        console.error('File is not an image');
    }
});

// gradient

class GradientInfo {
    constructor(color1, color2, color3, colorPosition1, colorPosition2, colorPosition3) {
        this.color1 = color1;
        this.color2 = color2;
        this.color3 = color3;
        this.colorPosition1 = colorPosition1;
        this.colorPosition2 = colorPosition2;
        this.colorPosition3 = colorPosition3;
    }
}
let gradientCanvas = document.getElementById("gradient-canvas");
let gradientCanvasCTX = gradientCanvas.getContext('2d');

let gcWidth = gradientCanvas.width;
let gcHeight = gradientCanvas.height;
let color1 = document.getElementById('color1');
let color2 = document.getElementById('color2');
let color3 = document.getElementById('color3');
let colorPosition1 = document.getElementById('position1');
let colorPosition2 = document.getElementById('position2');
let colorPosition3 = document.getElementById('position3');

let saveGradientButton = document.getElementById("save-gradient");
let savedGradient;
let gradientInfo = new GradientInfo();
color1.onchange = updateGradient;
color2.onchange = updateGradient;
color3.onchange = updateGradient;
colorPosition1.onchange = updateGradient;
colorPosition2.onchange = updateGradient;
colorPosition3.onchange = updateGradient;
saveGradientButton.onclick =saveGradientToFile;
let gradient;

function updateGradient(){
    console.log("update gradient");
    gradient = gradientCanvasCTX.createLinearGradient(0, 0, gcWidth, 0);
    gradient.addColorStop(colorPosition1.value/100, color1.value);
    gradient.addColorStop(colorPosition2.value/100, color2.value);
    gradient.addColorStop(colorPosition3.value/100, color3.value);
    gradientCanvasCTX.fillStyle = gradient;
    gradientCanvasCTX.fillRect(0, 0, gcWidth, gcHeight);
}



function saveGradient() {
    savedGradient = gradientCanvasCTX.fillStyle;
    gradientInfo.color1 = color1.value;
    gradientInfo.color2 = color2.value;
    gradientInfo.color3 = color3.value;

    gradientInfo.colorPosition1 = colorPosition1.value;
    gradientInfo.colorPosition2 = colorPosition2.value;
    gradientInfo.colorPosition3 = colorPosition3.value;


    console.log("gradientInfo", gradientInfo);
    console.log("gradientInfo.color1", gradientInfo.color1);

}


function loadPresavedGradient() {
    if(gradientInfo){

        color1.value = gradientInfo.color1;
        color2.value = gradientInfo.color2;
        color3.value = gradientInfo.color3;

        colorPosition1.value = gradientInfo.colorPosition1;
        colorPosition2.value = gradientInfo.colorPosition2;
        colorPosition3.value = gradientInfo.colorPosition3;

        updateGradient();
    }
    // if (savedGradient) {
    //     let presavedColorElement = document.getElementById("presave-gradient-color");
    //     presavedColorElement.value = savedGradient;
    //     updateGradient(); // Update the canvas with the loaded gradient
    // }
}

function saveGradientToFile() {
    saveGradient();
    const gradientData = JSON.stringify(gradientInfo);
    const blob = new Blob([gradientData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gradientInfo.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log("Gradient saved to file.");
}

function loadGradientFromFile(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const data = JSON.parse(event.target.result);
        gradientInfo.color1 = data.color1.value;
        gradientInfo.color2 = data.color2.value;
        gradientInfo.color3 = data.color3.value;

        gradientInfo.colorPosition1 = data.colorPosition1.value;
        gradientInfo.colorPosition2 = data.colorPosition2.value;
        gradientInfo.colorPosition3 = data.colorPosition3.value;
        updateGradient();

        console.log("Gradient loaded from file.");

    };
    reader.readAsText(file);

}

const fileInput = document.getElementById('gradient-file-input');
fileInput.type = 'file';
fileInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        console.log("file", this.files[0]);
        loadGradientFromFile(this.files[0]);
    }

});
document.body.appendChild(fileInput);





// mona();
// bbb();
// idata();
// localImage();
