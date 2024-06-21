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
const charset_sia = "SIA/-.><?!^*()   ";
const resource = filename => `../resources/${ filename }`;

const presetSelection = document.getElementById("preset-selection");
const presetFolderName = "Presets/";
presetSelection.addEventListener('change',function(){
    var selectedPreset = this.value;
    switch(selectedPreset){
        case 'preset-1':
            fetchPresetFromJson(presetFolderName+"presetInfo.json");
        break;
        case 'preset-2':
            fetchPresetFromJson(presetFolderName+"preset-2.json");
        break;
        case 'preset-3':
            fetchPresetFromJson(presetFolderName+"preset-3.json");
        break;
    }
});

document.addEventListener('DOMContentLoaded', () => fetchPresetFromJson("Presets/presetInfo.json"));

function fetchPresetFromJson(filePath){
    fetch(resource(filePath))
    .then(response => response.json())
    .then(data => {
        presetInfo = new PresetInfo(
            data.inverseEle, 
            data.brightnessEle, 
            data.contrastEle, 
            data.gradientInfo, 
            data.fontSize, 
            data.charset
        );

        loadPreset();
    })
    .catch(error => console.error('Error loading preset:', error));

}
// media recorder and video exporter 
const imageDropdown = document.getElementById('image-dropdown');
let isCanvas = true; 

imageDropdown.onchange = function(){
    isCanvas = this.value === "canvas";
    updateImage("canvasORHTML");
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


function downloadImageWithRatio(){
    console.log("downloadImageWithRatio is ", currentimageExportRatio);
    let canvas = document.getElementById('processed-image');
    let tempCanvas = document.createElement('canvas');
    let tempCtx = tempCanvas.getContext('2d');

    let newWidth = canvas.width * currentimageExportRatio;
    let newHeight = canvas.height * currentimageExportRatio;

    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;
    tempCtx.drawImage(canvas, 0, 0, newWidth, newHeight);
    let dataUrl = tempCanvas.toDataURL('image/png');

    let link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'image.png';
    link.click();
    tempCanvas.remove();
}
const charWidthOffsetRatio = 0.8;
const lineHeightOffsetRatio = 1.8;
const ratioValue = 2;

function loadImageFromURL(img, isCanvas){
    const imageWidth = img.width;  
    const imageHeight = img.height;
    const charWidthValue = fontSize.value*charWidthOffsetRatio;//*0.8;
    const lineHeightValue = fontSize.value*lineHeightOffsetRatio;//0.8;
    const ratioX =imageWidth/(fontSize.value+charWidthValue)*ratioValue; //2* fontSize.value/5*13.5;// 
    const ratioY = imageHeight/(fontSize.value+lineHeightValue)*ratioValue;//2*fontSize.value/5*13.5 ;//
    const asciiDimensions = calculateAsciiDimensionsForImageSize(imageWidth, imageHeight, fontSize.value , fontSize.value/charWidthOffsetRatio*lineHeightOffsetRatio);
    const aaReq = { width:asciiDimensions.width  , height: asciiDimensions.height, colored: false};
    // console.log("image size is ", imageWidth, imageHeight);
    // console.log("ratio is ", ratioX, ratioY);
    // console.log('Required ASCII Dimensions:', asciiDimensions);

    let angle = currentGradientAngle * Math.PI / 180;
    let x2 = imageWidth * Math.cos(angle);  
    let y2 = imageWidth * Math.sin(angle);  
    updateGradientFromCanvas(gradientCanvasCTX,x2,y2);
    const canvasOptions = {
        fontSize: fontSize.value,
        fontFamily: "Sora",
        lineHeight: lineHeightValue,
        charWidth: charWidthValue,
        charset: presetInfo.charset,
        width:  imageWidth ,  
        height: imageHeight , 
        background: "rgba(0,0,0,0)",
        color: gradient
    };

    let imageProcessingPipeline = aalib.read.image.fromURL(img.src);
       
    if (inverseEle.checked) {
            console.log("inverse elemenet is checked ", inverseEle.checked)
            imageProcessingPipeline = imageProcessingPipeline.map(aalib.filter.inverse());
        }
        if (brightnessValue.value !== undefined) {
            console.log("brightnessValue value ", brightnessValue.value);
            imageProcessingPipeline = imageProcessingPipeline.map(aalib.filter.brightness(brightnessValue.value));
        }
        if (contrastValue.value !== undefined) {
            console.log("contrastValue value ", contrastValue.value);
            imageProcessingPipeline = imageProcessingPipeline.map(aalib.filter.contrast(contrastValue.value));
        }
        imageProcessingPipeline = imageProcessingPipeline.map(aalib.aa(aaReq));

        if (isCanvas) {
            imageProcessingPipeline.map(aalib.render.canvas(canvasOptions))
    .do(function (el) {
       
        replaceImageToDiv(el);
       
    })
    .subscribe(); } 
    else {
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
        el.id = 'processed-image'; 
        document.body.appendChild(el);
    }
}
function processImage(img) {
    loadImageFromURL(img, isCanvas);
}
function loadImageAndProcess(url) {
    const img = new Image();
    img.src = url; 
    img.onload = function () {
        let existingElement = document.getElementById('imported-image');
        if (existingElement) {
            console.log("loadImageAndProcess - replace child image");
            existingElement.src = img.src; 
            currentImage = img;
        } else {
            console.log("loadImageAndProcess - append child image");
            img.id = 'imported-image'; 
            document.body.appendChild(img); 
        }
        processImage(currentImage); 
    };
    img.onerror = function () {
        console.error('Error loading the image');
    };
}
function handleImageInputChange(event) {
    const file = event.target.files[0];
   
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function (e) {
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
    constructor(inverseEle, brightnessEle, contrastEle, gradientInfo, fontSize,  charset) {
        this.inverseEle = inverseEle;
        this.brightnessEle = brightnessEle;
        this.contrastEle = contrastEle;
        this.gradientInfo = gradientInfo;
        this.fontSize = fontSize;
        this.charset = charset;
    }
}
let currentImage; 
let gradientCanvas = document.getElementById("gradient-canvas");
let gradientCanvasCTX = gradientCanvas.getContext('2d');
let gcWidth = gradientCanvas.width;
let gcHeight = gradientCanvas.height;
let colorPosition1 = document.getElementById('percentage1');
let colorPosition2 = document.getElementById('percentage2');
let colorPosition3 = document.getElementById('percentage3');
let gradientInfo = new GradientInfo();
let presetInfo = new PresetInfo();
let gradient;
let savePresetButton = document.getElementById("save-preset");
let inverseEle = document.getElementById("inverse");
let fontSize = document.getElementById("fontSize");
let charsetSelector = document.getElementById("charset-selector");

let brightnessEle = document.getElementById("brightness");
let contrastEle = document.getElementById("contrast");
let brightnessValue = brightnessEle.nextElementSibling.querySelector(".sliderValue");
let contrastValue = contrastEle.nextElementSibling.querySelector(".sliderValue");
let imageExportRatio = document.getElementById("imageExportRatio");
let saveImageButton = document.getElementById("save-image");
saveImageButton.onclick = downloadImageWithRatio;

let currentimageExportRatio = 1;
let percentage1 = document.getElementById('percentage1');
let percentage2 = document.getElementById('percentage2');
let percentage3 = document.getElementById('percentage3');

let gradientAngle = document.getElementById('gradient-angle');
let gradientAngleValue = gradientAngle.nextElementSibling.querySelector('.sliderValue');
let currentGradientAngle = 90; // Initialize with a default value, e.g., 90 degrees

let saturationForGradient = document.getElementById("saturation");
let saturationForGradientValue = saturationForGradient.nextElementSibling.querySelector('.sliderValue');
let currentSaturationForGradient=1; 
let currentColor1,currentColor2,currentColor3='#000000'; 

saturationForGradient.addEventListener('input',(e)=>{
    saturationForGradientValue.textContent = e.target.value;
    currentSaturationForGradient = e.target.value;
    // console.log("current saturation for gradient is ", currentSaturationForGradient);
    updateGradient();
})

gradientAngle.addEventListener('input', (e) => { // Changed from 'change' to 'input'
    gradientAngleValue.textContent = e.target.value;
    currentGradientAngle = parseInt(e.target.value, 10);
    updateGradient(); 
});

percentage1.addEventListener('change', function() {
    slider.noUiSlider.set([this.textContent, null, null]);
});

percentage2.addEventListener('change', function() {
    slider.noUiSlider.set([null, this.textContent, null]);
});

percentage3.addEventListener('change', function() {
    slider.noUiSlider.set([null, null, this.textContent]);
});

var slider = document.getElementById('color-slider');

noUiSlider.create(slider, {
    start: [0, 50, 100],
    connect: true,
    range: {
        'min': 0,
        'max': 100
    }
});

slider.noUiSlider.on('update', function(values, handle) {
    var percentage = document.getElementById('percentage' + (handle + 1));
    percentage.textContent = Math.floor(values[handle]);
       colorPosition1.textContent = values[0];
       colorPosition2.textContent = values[1];
       colorPosition3.textContent = values[2];
       updateGradient();
});

imageExportRatio.oninput=(e)=>{
    imageExportRatio.value = e.target.value;
    currentimageExportRatio = imageExportRatio.value;
    console.log("current image ratio is ", currentimageExportRatio);
    updateImage("imageExportRatio");
}

window.onload = function() {
    console.log("PHASE 2");

    console.log("imageExportRatio ",imageExportRatio.value);
    currentimageExportRatio = imageExportRatio.value;
    charsetSelector.value = presetInfo.charset;
    presetInfo.fontFamily = "Sora";//fontDropdown.value;     
    updateImage("chartset");
}

fontSize.oninput = (e) => {
    fontSize.value = e.target.value;
    updateImage("fontSize");
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

inverseEle.onchange = (e) => {
    presetInfo.inverseEle = e.target.checked;
    updateImage("inverseEle");
}

charsetSelector.onchange=(e)=>{
    if(e.target.value==="SIA/"){
        presetInfo.charset =charset_sia;
    }else{
        presetInfo.charset =charset_ascii;
    }
    updateImage("charset");
}

savePresetButton.onclick= savePresetToFile;

function updateImage(funcName){
    if(currentImage){
        console.log(`${funcName} - update image`);
        processImage(currentImage);
    }
}

function updateSaturation(){
    currentColor1 = gradientInfo.color1; 
    currentColor2 = gradientInfo.color2;
    currentColor3 = gradientInfo.color3;
    currentColor1 = updateColorSaturation(currentColor1, currentSaturationForGradient);
    currentColor2 = updateColorSaturation(currentColor2, currentSaturationForGradient);
    currentColor3 = updateColorSaturation(currentColor3, currentSaturationForGradient);
    console.log("update saturation ", currentColor1);

}

function updateGradient(){
    let angle = currentGradientAngle * Math.PI / 180;
    let x2 = gcWidth * Math.cos(angle);
    let y2 = gcWidth * Math.sin(angle); 
    updateSaturation();
    updateGradientFromCanvas(gradientCanvasCTX,x2,y2);
    gradientCanvasCTX.fillStyle = gradient;
    gradientCanvasCTX.fillRect(0, 0, gcWidth, gcHeight);
    updateImage("gradient");
}

function updateGradientFromCanvas(canvas,x2,y2){
    gradient = canvas.createLinearGradient(0, 0, x2,y2);
    gradient.addColorStop(colorPosition1.textContent/100, currentColor1);
    gradient.addColorStop(colorPosition2.textContent/100, currentColor2);
    gradient.addColorStop(colorPosition3.textContent/100, currentColor3);
}

function updatePreset(){
    if(brightnessEle.value!=presetInfo.brightnessEle){
        brightnessEle.value = presetInfo.brightnessEle;
    }
    if(contrastEle.value!=presetInfo.contrastEle){
        contrastEle.value = presetInfo.contrastEle;
    }
    if(inverseEle.value!=presetInfo.inverseEle){
        inverseEle.value = presetInfo.inverseEle;     
    }
    if(fontSize.value!=presetInfo.fontSize){
        fontSize.value = presetInfo.fontSize;
    }
    if(charsetSelector.value!=presetInfo.charset){
        if(presetInfo.charset.contains("SIA/")){
            charsetSelector.target.value = "SIA/";
        }else{
            charsetSelector.target.value = "ASCII";
        }
    }
    if(gradientInfo!=presetInfo.gradientInfo){
        gradientInfo = presetInfo.gradientInfo;
        console.log("gradient info is ", gradientInfo);
    }
    console.log("preset info is ", presetInfo);
}

function loadGradient(){
    colorPosition1.textContent = gradientInfo.colorPosition1;
    colorPosition2.textContent = gradientInfo.colorPosition2;
    colorPosition3.textContent = gradientInfo.colorPosition3;
    currentColor1 = gradient.color1;
    currentColor2 = gradient.color2;
    currentColor3 = gradient.color3;
    console.log("currentColor1",currentColor1);
}

function saveGradient() {
    gradientInfo.colorPosition1 = colorPosition1.textContent;
    gradientInfo.colorPosition2 = colorPosition2.textContent;
    gradientInfo.colorPosition3 = colorPosition3.textContent;

    gradientInfo.color1 = currentColor1;
    gradientInfo.color2= currentColor2;
    gradientInfo.color3 = currentColor3;
}

function loadPreset(){
    inverseEle.checked = presetInfo.inverseEle;
    brightnessEle.value = presetInfo.brightnessEle;
    contrastEle.value = presetInfo.contrastEle;
    gradientInfo = presetInfo.gradientInfo;
    brightnessValue.innerHTML = presetInfo.brightnessEle;
    contrastValue.innerHTML = presetInfo.contrastEle;
    fontSize.value = presetInfo.fontSize;
    charsetSelector.value = presetInfo.charset;
    loadGradient();
    updateGradient();
    updatePreset();
}

function savePreset(){
    console.log("save preset ", presetInfo);
    presetInfo.inverseEle = inverseEle.checked;
    presetInfo.brightnessEle = brightnessEle.value;
    presetInfo.contrastEle = contrastEle.value;
    presetInfo.gradientInfo = gradientInfo;
    saveGradient();
    presetInfo.fontSize = fontSize.value;
    presetInfo.fontFamily = "Sora";  
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

// needs to update in the preset info values as well - UI 
function loadPresetFromFile(file){
    const reader = new FileReader();
    reader.onload = function(event){
        const data = JSON.parse(event.target.result);
        presetInfo.brightnessEle = data.brightnessEle;
        presetInfo.contrastEle = data.contrastEle;
        presetInfo.inverseEle = data.inverseEle;
        presetInfo.gradientInfo = data.gradientInfo;
        presetInfo.fontSize = data.fontSize;
        presetInfo.charset = data.charset;
        console.log("preset loaded from file: ",presetInfo);
        loadPreset();
    }
    reader.readAsText(file);
}
const presetFileInput = document.getElementById('load-preset');
presetFileInput.type = 'file';

presetFileInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        console.log("file", this.files[0]);
        loadPresetFromFile(this.files[0]);
    }
});

function calculateAsciiDimensionsForImageSize(pixelWidth, pixelHeight, charPixelWidth, charPixelHeight) {
    ///1260 width and 800 height
    if(charPixelHeight!=0 && charPixelWidth!=0){
    const asciiWidth = Math.ceil(pixelWidth / charPixelWidth);
    const asciiHeight = Math.ceil(pixelHeight / charPixelHeight);
    return {
        width: asciiWidth,
        height: asciiHeight
    };}
}

// Function to convert HSV back to RGB
function hsvToRgb(h, s, v) {
    let r, g, b, i, f, p, q, t;
    s /= 100;
    v /= 100;
    h /= 60;
    i = Math.floor(h);
    f = h - i;
    p = v * (1 - s);
    q = v * (1 - s * f);
    t = v * (1 - s * (1 - f));
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

// Function to convert RGB back to Hex
function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}


// Define your saturation-color mapping
const saturationColors = {
    1: ['#B0D4FC','#FFCCDB','#FFE2CC'],
    2: ['#99C9FF','#FFB2C8','#FFD4B2'],
    3: ['#80BBFF','#FF99B6','#FFC599'],
    4: ['#66ADFF','#FF80A4','#FFB780'],
    5: ['#4DA0FF','#FF6692','#FFA866']
};

function getColorFromSaturation(saturation) {
    return saturationColors[saturation];
}
// Update saturation and convert back to hex
function updateColorSaturation(hexColor, saturationMultiplier) {
    let hsv = hexToHsv(hexColor);
    hsv.s *= saturationMultiplier; // Update the saturation
    hsv.s = Math.min(hsv.s, 100); // Ensure saturation does not exceed 100
    let rgb = hsvToRgb(hsv.h, hsv.s, hsv.v); // Convert updated HSV back to RGB
    return rgbToHex(rgb.r, rgb.g, rgb.b); // Convert RGB back to Hex
}

function hexToHsv(hex) {
    let rgb = hexToRgb(hex);
    if (!rgb) return null; // Invalid hex code
    return rgb2hsv(rgb.r, rgb.g, rgb.b);
}

function hexToRgb(hex) {
    let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgb2hsv (r, g, b) {
    let rabs, gabs, babs, rr, gg, bb, h, s, v, diff, diffc, percentRoundFn;
    rabs = r / 255;
    gabs = g / 255;
    babs = b / 255;
    v = Math.max(rabs, gabs, babs),
    diff = v - Math.min(rabs, gabs, babs);
    diffc = c => (v - c) / 6 / diff + 1 / 2;
    percentRoundFn = num => Math.round(num * 100) / 100;
    if (diff == 0) {
        h = s = 0;
    } else {
        s = diff / v;
        rr = diffc(rabs);
        gg = diffc(gabs);
        bb = diffc(babs);

        if (rabs === v) {
            h = bb - gg;
        } else if (gabs === v) {
            h = (1 / 3) + rr - bb;
        } else if (babs === v) {
            h = (2 / 3) + gg - rr;
        }
        if (h < 0) {
            h += 1;
        }else if (h > 1) {
            h -= 1;
        }
    }
    return {
        h: Math.round(h * 360),
        s: percentRoundFn(s * 100),
        v: percentRoundFn(v * 100)
    };
}