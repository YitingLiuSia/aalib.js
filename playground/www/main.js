import "rxjs/add/operator/do";
import ImageReader from "../src/readers/ImageReader";
import VideoReader from "../src/readers/VideoReader";
import ImageDataReader from "../src/readers/ImageDataReader";
import inverse from "../src/filters/inverse";
import contrast from "../src/filters/contrast";
import brightness from "../src/filters/brightness";
import linear from "../src/filters/linear";
import { appendToID } from "./utils";
import { GenerateID } from "./utils";
import aa from "../src/aa";
import aalib from "../dist/aalib.js";
import html, { ASCII_CHARSET } from "../src/renderers/HTMLRenderer";
import videoCanvas from "../src/renderers/CanvasRenderer";
import { appendToBody } from "./utils";
import { json } from "body-parser";
const charset_ascii = ASCII_CHARSET;
const charset_sia = "SIA/";
const resource = filename => `../resources/${ filename }`;

// loading default presetInfo in resources location on start 
document.addEventListener('DOMContentLoaded', () => {
    fetch(resource("presetInfo.json"))
        .then(response => response.json())
        .then(data => {
            console.log("data is ",data);
            presetInfo = new PresetInfo(
                data.inverseEle, 
                // data.desaturate, 
                data.brightnessEle, 
                data.contrastEle, 
                // data.desaturation, 
                data.gradientInfo, 
                data.fontSize, 
                data.fontFamily, 
                data.lineHeight,
                data.charWidth,
                data.charset
            );

            loadPreset();
        })
        .catch(error => console.error('Error loading preset:', error));
});


const FONTS = {
    Sora: resource("sora-ttf/Sora-Regular.ttf"),
    Kode: resource("kode-mono/KodeMono-Regular.ttf"),
    OpenSans: resource("open-sans/OpenSans-Regular.ttf")
}

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
// media recorder and video exporter 

const imageDropdown = document.getElementById('image-dropdown');
let isCanvas = true; 

imageDropdown.onchange = function(){
    isCanvas = this.value === "canvas";
    console.log("iscanvas", isCanvas);
}

//let videoCanvasElement = document.getElementById('video-scene');
// let mediaRecorder;
// let recordedChunks = [];
// setupMediaRecorder(videoCanvasElement);
// document.getElementById('startRecording').addEventListener('click', startRecording);
// document.getElementById('stopAndDownload').addEventListener('click', stopRecording);
// video input 
// function setupMediaRecorder(canvas) {
//     const stream = canvas.captureStream(25); // Capture at 25 fps
//     mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });

//     mediaRecorder.ondataavailable = function (event) {
//         if (event.data.size > 0) {
//             recordedChunks.push(event.data);
//         }
//     };

//     mediaRecorder.onstop = function () {
//         const blob = new Blob(recordedChunks, {
//             type: 'video/mp4'
//         });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement('a');
//         a.style.display = 'none';
//         a.href = url;
//         a.download = 'downloaded_video.mp4';
//         document.body.appendChild(a);
//         a.click();
//         window.URL.revokeObjectURL(url);
//         document.body.removeChild(a);
//         recordedChunks = []; // Clear the recorded chunks
//     };
// } 

// function startRecording() {
//     mediaRecorder.start();
//     console.log("Recording started");
// }

// function stopRecording() {
//     mediaRecorder.stop();
//     console.log("Recording stopped");
// }

// function fromVideoFile(file) {
//     return new Promise((resolve, reject) => {
//         const video = document.createElement('video');
//         console.log("url ", URL.createObjectURL(file));
//         video.src = URL.createObjectURL(file);
//         video.controls = true;  // Add controls so users can play/pause
//         video.autoplay = true;  // Set autoplay to true to start playing automatically
//         video.muted = true;     // Mute the video to allow autoplay in most browsers
//         video.loop = true;      // Optional: Loop the video
//         video.onloadedmetadata = () => {
//             document.getElementById('video-container').appendChild(video);  // Append to a specific container
//             resolve(video);
//         };
//         video.onerror = () => {
//             reject(new Error("Failed to load video"));
//         };
//     });
// }

// // video input 
// document.getElementById('videoInput').addEventListener('change', function (event) {
//     const file = event.target.files[0];
//     if (file) {
//         fromVideoFile(file).then(video => {
//             console.log("video", video);
//             aalib.read.video.fromVideoElement(video)
//                 .map(aalib.aa({ width: 165, height: 68 }))
//                 .map(aalib.render.canvas({
//                     width: video.width,//696,
//                     height: video.height,//476,
//                     fontFamily: `"${presetInfo.fontFamily}", sans-serif`,
//                     el: document.querySelector("#video-scene")
//                 }))
//                 .subscribe();
//         }).catch(error => {
//             console.error("Error loading video:", error);
//         });
//     }
// });

// image input 
// image size is the same, but the ascii squished the size 
// the image is not resized proprtionally but it is closer 
function loadImageFromURL(img, isCanvas){
    const asciiDimensions = calculateAsciiDimensionsForImageSize(img.width, img.height, charWidth.value, charWidth.value);
    console.log('Required ASCII Dimensions:', asciiDimensions);
    console.log("image size is ", img.width, img.height);
    // const aspectRatio = img.width / img.height;
    // const aaHeight = 165; // Height for ASCII art
    // const aaWidth = Math.round(aaHeight * aspectRatio); // Maintain aspect ratio for ASCII art width
    const aaReq = { width: asciiDimensions.width, height: asciiDimensions.height, colored: false };

    const canvasOptions = {
        fontSize: fontSize.value,
        fontFamily: presetInfo.fontFamily,
        lineHeight: lineHeight.value,
        charWidth: charWidth.value,
        charset: presetInfo.charset,
        width: img.width,  // Use original image width for canvas
        height: img.height, // Use original image height for canvas
        background: "rgba(0,0,0,0)",
        color: gradient
    };

    let imageProcessingPipeline = aalib.read.image.fromURL(img.src)
            .map(aalib.aa(aaReq));
        if (inverseEle.checked) {
            imageProcessingPipeline = imageProcessingPipeline.map(aalib.filter.inverse());
        }
        // if (desaturate.checked) {
        //     imageProcessingPipeline = imageProcessingPipeline.map(aalib.filter.desaturate());
        // }
        if (brightnessValue.value !== undefined) {
            imageProcessingPipeline = imageProcessingPipeline.map(aalib.filter.brightness(brightnessValue.value));
        }
        if (contrastValue.value !== undefined) {
            imageProcessingPipeline = imageProcessingPipeline.map(aalib.filter.contrast(contrastValue.value));
        }
        // if (desaturationValue.value !== undefined) {
        //     imageProcessingPipeline = imageProcessingPipeline.map(aalib.filter.desaturate(desaturationValue.value));
        // }
        
        if (isCanvas) {
        imageProcessingPipeline.map(aalib.render.canvas(canvasOptions))
        .do(function (el) {
           replaceImageToDiv(el);
        })
        .subscribe(); 
        
    } else {
        imageProcessingPipeline.map(aalib.render.html(canvasOptions))
        .do(function (el) {
            replaceImageToDiv(el);
        })
        .subscribe(); 
    }
}

function replaceImageToDiv(el){
    el.id = 'processed-image';
    const existingElement = document.getElementById('processed-image');
    if (existingElement) {
        console.log("replaceImageToDiv - replace child image");
        existingElement.parentNode.replaceChild(el, existingElement);
    } else {
        console.log("replaceImageToDiv - append child image");
        el.id = 'processed-image'; // Ensure the image has an ID
        document.body.appendChild(el);
    }
}
function processImage(img) {
    loadImageFromURL(img, isCanvas);
}
function loadImageAndProcess(url) {
    const img = new Image();
    img.src = url; // Set the source of the image
    img.onload = function () {
        let existingElement = document.getElementById('imported-image');
        if (existingElement) {
            console.log("loadImageAndProcess - replace child image");
            existingElement.src = img.src; // Update the source instead of replacing the node
            currentImage = img;
        } else {
            console.log("loadImageAndProcess - append child image");
            img.id = 'imported-image'; // Ensure the image has an ID
            document.body.appendChild(img); // Append the new image element to the body
        }
        processImage(currentImage); // Call the function to process the image
    };
    img.onerror = function () {
        console.error('Error loading the image');
    };
}
// this should update when the url is the same but when the changes of preset is applied 
function handleImageInputChange(event) {
    const file = event.target.files[0];
   
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function (e) {
            // const uniqueSuffix = '#nocache=' + new Date().getTime();// this does not work 
            // console.log("uniqueSuffix ",uniqueSuffix);
           // const safeUrl = encodeURI(e.target.result);// + uniqueSuffix;
           loadImageAndProcess(e.target.result);

        };

        reader.onerror = function () {
            console.error('Error loading the image');
        };

        reader.readAsDataURL(file);
    } else {
        console.error('File is not an image');
    }
}

document.getElementById('imageInput').addEventListener('change', handleImageInputChange);
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

class PresetInfo {
    constructor(inverseEle, brightnessEle, contrastEle, gradientInfo, fontSize, fontFamily, lineHeight,charWidth, charset) {
        this.inverseEle = inverseEle;
        // this.desaturate = desaturate;
        this.brightnessEle = brightnessEle;
        this.contrastEle = contrastEle;
        // this.desaturation = desaturation;
        this.gradientInfo = gradientInfo;
        this.fontSize = fontSize;
        this.fontFamily = fontFamily;
        this.lineHeight = lineHeight;
        this.charWidth = charWidth;
        this.charset = charset;
    }
}

let currentImage; // To hold the current image element
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
let gradientInfo = new GradientInfo();
let presetInfo = new PresetInfo();
let fontFamily = "Sora";
color1.onchange = updateGradient;
color2.onchange = updateGradient;
color3.onchange = updateGradient;
colorPosition1.onchange = updateGradient;
colorPosition2.onchange = updateGradient;
colorPosition3.onchange = updateGradient;
let gradient;
let savePresetButton = document.getElementById("save-preset");
// let desaturate = document.getElementById("desaturate");
let inverseEle = document.getElementById("inverse");
// let desaturation = document.getElementById("desaturation");
let fontDropdown = document.getElementById("font-dropdown");
let fontSize = document.getElementById("fontSize");
let charWidth = document.getElementById("charWidth");
let lineHeight = document.getElementById("lineHeight");
let charsetSelector = document.getElementById("charset-selector");

let brightnessEle = document.getElementById("brightness");
let contrastEle = document.getElementById("contrast");
let brightnessValue = brightnessEle.nextElementSibling.querySelector(".sliderValue");
let contrastValue = contrastEle.nextElementSibling.querySelector(".sliderValue");

// let desaturationValue = desaturation.parentElement.querySelector(".sliderValue");

fontSize.oninput = (e) => {
    fontSize.value = e.target.value;
    updateImage("fontSize");
}

charWidth.oninput=(e)=>{
    charWidth.value = e.target.value;
    updateImage("charWidth");
}

lineHeight.oninput=(e)=>{
    lineHeight.value = e.target.value;
    updateImage("lineHeight");
}

brightnessEle.oninput = (e) => {
    brightnessValue.textContent =e.target.value;
    brightnessValue.value =e.target.value;
    updateImage("brightness");
}

contrastEle.oninput=(e)=>{
    contrastValue.textContent=e.target.value;
    contrastValue.value=e.target.value;
    console.log("contrast value ", contrastValue.value);
    updateImage("contrast");
}

// desaturation.oninput=(e)=>{
//    desaturationValue.value=e.target.value;
//     updateImage("desaturation");
// }

savePresetButton.onclick= savePresetToFile;
// desaturate.onchange=(e)=>{
//     presetInfo.desaturate = e.target.value;
//     updateImage("desaturate");
//     console.log("preset info is ", presetInfo.desaturate);
// }

function updateImage(funcName){
    if(currentImage){
        console.log(`${funcName} - update image`);
        processImage(currentImage);
    }
}
function updateGradient(){
    gradient = gradientCanvasCTX.createLinearGradient(0, 0, gcWidth, 0);
    gradient.addColorStop(colorPosition1.value/100, color1.value);
    gradient.addColorStop(colorPosition2.value/100, color2.value);
    gradient.addColorStop(colorPosition3.value/100, color3.value);
    gradientCanvasCTX.fillStyle = gradient;
    gradientCanvasCTX.fillRect(0, 0, gcWidth, gcHeight);
    updateImage("gradient");
}

function updatePreset(){
    // if(desaturate.value!=presetInfo.desaturate){
    //     desaturate.value = presetInfo.desaturate;
    // }
    if(brightnessEle.value!=presetInfo.brightnessEle){
        brightnessEle.value = presetInfo.brightnessEle;
    }
    if(contrastEle.value!=presetInfo.contrastEle){
        contrastEle.value = presetInfo.contrastEle;
    }
    // if(desaturation.value!=presetInfo.desaturation){
    //     desaturation.value = presetInfo.desaturation;
    // }
    if(inverseEle.value!=presetInfo.inverseEle){
        inverseEle.value = presetInfo.inverseEle;     
    }
    if(fontSize.value!=presetInfo.fontSize){
        fontSize.value = presetInfo.fontSize;
    }
    if(fontFamily!=presetInfo.fontFamily){
        fontFamily = presetInfo.fontFamily;
    }
    if(lineHeight.value!=presetInfo.lineHeight){
        lineHeight.value = presetInfo.lineHeight;
    }
    if(charWidth.value!=presetInfo.charWidth){
        charWidth.value = presetInfo.charWidth;
    }
    if(charsetSelector.value!=presetInfo.charset){
        charsetSelector.value = presetInfo.charset;
    }
    if(gradientInfo!=presetInfo.gradientInfo){
        gradientInfo = presetInfo.gradientInfo;
    }
    console.log("preset info is ", presetInfo);
}

function loadGradient(){
    console.log("load gradient");
    colorPosition1.value = gradientInfo.colorPosition1;
    colorPosition2.value = gradientInfo.colorPosition2;
    colorPosition3.value = gradientInfo.colorPosition3;
    color1.value = gradientInfo.color1;
    color2.value = gradientInfo.color2;
    color3.value = gradientInfo.color3;
}

function saveGradient() {
    gradientInfo.color1 = color1.value;
    gradientInfo.color2 = color2.value;
    gradientInfo.color3 = color3.value;
    gradientInfo.colorPosition1 = colorPosition1.value;
    gradientInfo.colorPosition2 = colorPosition2.value;
    gradientInfo.colorPosition3 = colorPosition3.value;
}

function loadPreset(){
    console.log("load preset");
    inverseEle.checked = presetInfo.inverseEle;
    // desaturate.checked = presetInfo.desaturate;
    brightnessEle.value = presetInfo.brightnessEle;
    contrastEle.value = presetInfo.contrastEle;
    // desaturation.value = presetInfo.desaturation;
    gradientInfo = presetInfo.gradientInfo;
    loadGradient();
    updateGradient();
    updatePreset();
    brightnessValue.innerHTML = presetInfo.brightnessEle;
    contrastValue.innerHTML = presetInfo.contrastEle;
    // desaturationValue.innerHTML = presetInfo.desaturation;
    fontSize.value = presetInfo.fontSize;
    fontFamily = presetInfo.fontFamily;
    lineHeight.value = presetInfo.lineHeight;
    charWidth.value = presetInfo.charWidth;
    charsetSelector.value = presetInfo.charset;
}

function savePreset(){
    console.log("save preset ", presetInfo);
    presetInfo.inverseEle = inverseEle.checked;
    // presetInfo.desaturate = desaturate.checked;
    presetInfo.brightnessEle = brightnessEle.value;
    presetInfo.contrastEle = contrastEle.value;
    // presetInfo.desaturation = desaturation.value;
    presetInfo.gradientInfo = gradientInfo;
    saveGradient();
    presetInfo.fontSize = fontSize.value;
    presetInfo.fontFamily = fontFamily;
    presetInfo.lineHeight = lineHeight.value;
    presetInfo.charWidth = charWidth.value;
    presetInfo.charset = charsetSelector.value;
}

function savePresetToFile(){
    savePreset();
    const presetData = JSON.stringify(presetInfo);
    const blob = new Blob([presetData], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'presetInfo.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log("Preset saved to file.");
}

// function saveGradientToFile() {
//     saveGradient();
//     const gradientData = JSON.stringify(gradientInfo);
//     const blob = new Blob([gradientData], { type: 'application/json'});
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.href = url;
//     link.download = 'gradientInfo.json';
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     console.log("Gradient saved to file.");
// }

// needs to update in the preset info values as well - UI 
function loadPresetFromFile(file){
    const reader = new FileReader();
    reader.onload = function(event){
        const data = JSON.parse(event.target.result);
        presetInfo.brightnessEle = data.brightnessEle;
        // presetInfo.desaturation = data.desaturation;
        presetInfo.contrastEle = data.contrastEle;
        // presetInfo.desaturate = data.desaturate;
        presetInfo.inverseEle = data.inverseEle;
        presetInfo.gradientInfo = data.gradientInfo;
        presetInfo.fontSize = data.fontSize;
        presetInfo.fontFamily = data.fontFamily;
        presetInfo.lineHeight = data.lineHeight;
        presetInfo.charWidth = data.charWidth;
        presetInfo.charset = data.charset;
        console.log("preset loaded from file: ",presetInfo);
        loadPreset();
    }
    reader.readAsText(file);
}

// function loadGradientFromFile(file) {
//     const reader = new FileReader();
//     reader.onload = function(event) {
//         const data = JSON.parse(event.target.result);
//         gradientInfo.color1 = data.color1;
//         gradientInfo.color2 = data.color2;
//         gradientInfo.color3 = data.color3;
//         gradientInfo.colorPosition1 = data.colorPosition1;
//         gradientInfo.colorPosition2 = data.colorPosition2;
//         gradientInfo.colorPosition3 = data.colorPosition3;
//         loadGradient();
//         updateGradient();
//         console.log("Gradient loaded from file.");
//     };
//     reader.readAsText(file);
// }

// const fileInput = document.getElementById('gradient-file-input');
// fileInput.type = 'file';
// fileInput.addEventListener('change', function() {
//     if (this.files && this.files[0]) {
//         console.log("file", this.files[0]);
//         loadGradientFromFile(this.files[0]);
//     }
// });

const presetFileInput = document.getElementById('load-preset');
presetFileInput.type = 'file';
presetFileInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        console.log("file", this.files[0]);
        loadPresetFromFile(this.files[0]);
    }
});

// Event listener for brightness changes
brightnessEle.addEventListener('input', (e) => {
    brightnessValue.innerHTML = e.target.value;
    updateImage("brightnessEle");

});
inverseEle.onchange = (e) => {
    presetInfo.inverseEle = e.target.checked;
    updateImage("inverseEle");
}
// desaturate.onchange=(e)=>{
//     presetInfo.desaturate = e.target.checked;
//     updateImage("desaturate");
// }

fontDropdown.onchange = (e) => {
    presetInfo.fontFamily =e.target.value;
    // apply font in the text for the image and video reader 
};

charsetSelector.onchange=(e)=>{
    if(e.target.value==="SIA/"){
        presetInfo.charset =charset_sia;
    }else{
        presetInfo.charset =charset_ascii;
    }
    updateImage("charset");
}

function calculateAsciiDimensionsForImageSize(pixelWidth, pixelHeight, charPixelWidth, charPixelHeight) {
    if(charPixelHeight!=0 && charPixelWidth!=0){
    const asciiWidth = Math.ceil(pixelWidth / charPixelWidth);
    const asciiHeight = Math.ceil(pixelHeight / charPixelHeight);
    return {
        width: asciiWidth,
        height: asciiHeight
    };}
}

