import aalib from "../dist/aalib.js";
import { ASCII_CHARSET } from "../src/renderers/HTMLRenderer";
const charset_ascii = ASCII_CHARSET;
const charset_sia = "SIA/-.><!*()   ";
const resource = filename => `../resources/${ filename }`;
const imageDropdown = document.getElementById('image-dropdown');
let isCanvas = true; 
let currentImage, currentVideo;
let gradientCanvas = document.getElementById("gradient-canvas");
let gradientSliderCanvas = document.getElementById("gradient-slider-canvas");
let gradientSliderCanvasCTX = gradientSliderCanvas.getContext('2d');
let gradientCanvasCTX = gradientCanvas.getContext('2d');
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
let currentimageExportRatio = 1;
let gradientAngleContainer = document.getElementById('gradient-angle');
let gradientAngle = gradientAngleContainer.getElementsByTagName('input')[0];
let gradientAngleValue = gradientAngle.nextElementSibling.querySelector('#gradient-angle .sliderValue');
let currentGradientAngle = 0; 
let saturationContainer = document.getElementById("saturation");
let saturationForGradient =saturationContainer.getElementsByTagName("input")[0]; 
let saturationForGradientValue = document.querySelector('#saturation .sliderValue'); 
let currentSaturationForGradient = 1; 
let currentColor1,currentColor2,currentColor3='#000000'; 
let colorSelectionDropdown = document.getElementById("color-selection");
let colorBlack = "#0A151E";
let colorWhite = "#ffffff"; 
let colorGray = "#8796A9";
let currentPos1,currentPos2,currentPos3=0;
let slider = document.getElementById('color-slider');
let assetSelector = document.getElementById("asset-selector");
let videoImport = document.getElementById("video-import");
let videoImportContainer = document.getElementById("video-container");
let videoInput = document.getElementById('videoInput');
let imageInput = document.getElementById("imageInput");
let imageImportContainer = document.getElementById("image-container");
let imageImport = document.getElementById('imported-image');
let canvasContainer = document.getElementById('canvas-container');
let processedAssetCanvas = document.getElementById('processed-asset');//document.getElementById('video-scene');
let processedAssetCanvasCTX = processedAssetCanvas.getContext("2d");//document.getElementById('video-scene');
let mediaRecorder;
let recordedChunks = [];
let startRecordingButton=document.getElementById('startRecording');
let videoTypeSelector = document.getElementById('video-type-selector');
let currentVideoType = "mp4";
let videoStatus = document.getElementById("video-status");

let videoInitialStatus = "Current status: click download video to start recording with current settings";
let videoProcessing = "Current status: processing video";
let videoDownloaded = "Current status: video saved";
let videoExportRatio = document.getElementById("videoExportRatio");

const charWidthOffsetRatio = 0.8;
const lineHeightOffsetRatio = 2.5;
const inputs = document.querySelectorAll('input');
let debounceDelay = 500;
let throttleDelay = 200;
const videoFPS = 60; // Example: 30 FPS, adjust this based on your video's FPS
let currentvideoExportRatio = 1;
let gscWidth = gradientSliderCanvas.width;
let gscHeight = gradientSliderCanvas.height;
let gcWidth = gradientCanvas.width;
let gcHeight = gradientCanvas.height;
let processedWidth,processedHeight;
let videoProcessingPipeline;
let imageWidthLimit = 15000;


let popupBackground = document.getElementById("popup-bg");
let closeButtonForPopup = document.getElementById('close-button');
closeButtonForPopup.onclick = ()=>{
    popupBackground.style.display = "none";
}

savePresetButton.onclick= savePresetToFile;
saveImageButton.onclick = downloadImageWithRatio;

const throttledProcessVideo =()=>({
    if(currentVideo){
        throttle(processVideo(currentVideo), throttleDelay);
    }
});

inputs.forEach(e => {
    e.disabled = true;
});

function enableInputs() {
    inputs.forEach(e => {
        e.disabled = false;
    });
}
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
    constructor(inverseEle, brightnessEle, contrastEle, gradientInfo, fontSize, charset,currentGradientAngle,currentSaturationForGradient,currentimageExportRatio) {
        this.inverseEle = inverseEle;
        this.brightnessEle = brightnessEle;
        this.contrastEle = contrastEle;
        this.gradientInfo = gradientInfo;
        this.fontSize = fontSize;
        this.charset = charset;
        this.currentGradientAngle = currentGradientAngle;
        this.currentSaturationForGradient = currentSaturationForGradient; 
        this.currentimageExportRatio = currentimageExportRatio;
    }
}

// Define your saturation-color mapping
const saturationColors = {
    1: ['#B0D4FC','#FFCCDB','#FFE2CC'],
    2: ['#99C9FF','#FFB2C8','#FFD4B2'],
    3: ['#80BBFF','#FF99B6','#FFC599'],
    4: ['#66ADFF','#FF80A4','#FFB780'],
    5: ['#4DA0FF','#FF6692','#FFA866']
};

let gradientInfo = new GradientInfo();
let presetInfo = new PresetInfo();

startRecordingButton.onclick = recordAndDownloadVideo;
imageInput.addEventListener('change', handleImageInputChange);

function fetchPresetFromJson(filePath){
   return fetch(resource(filePath))
    .then(response => response.json())
    .then(data => {
        presetInfo = new PresetInfo(
            data.inverseEle, 
            data.brightnessEle, 
            data.contrastEle, 
            data.gradientInfo, 
            data.fontSize, 
            data.charset,
            data.currentGradientAngle,
            data.currentSaturationForGradient,
            data.currentimageExportRatio
        );
        loadPreset();
    })
    .catch(error => console.error('Error loading preset:', error));
}

imageDropdown.onchange = function(){
    isCanvas = this.value === "canvas";
    updateAsset("canvasORHTML");
    console.log("iscanvas", isCanvas);
}

assetSelector.onchange = (e) => {
    if (e.target.value === "video") {
        clearCanvas();
        currentImage = null;
        console.log("selected VIDEO");
        videoInput.style.display = "block";
        imageInput.style.display = "none";
        videoImportContainer.style.display = "block";
        imageImportContainer.style.display = "none";
        imageImport.style.display = "none";
        videoImport.style.display = "block";
    } else {
        clearCanvas();
        if (currentVideo) {
            currentVideo.pause();
            currentVideo = null;
        }
        console.log("selected IMAGE");
        videoInput.style.display = "none";
        imageInput.style.display = "block";
        videoImportContainer.style.display = "none";
        imageImportContainer.style.display = "inline-block";
        videoImport.style.display = "none";
        imageImport.style.display = "block";
     }
};

videoTypeSelector.onchange=((e)=>{
    currentVideoType = e.target.value;
    console.log("current video type is ",currentVideoType);
});

videoExportRatio.oninput=((e)=>{
    videoExportRatio.value = e.target.value;
    currentvideoExportRatio = e.target.value;
    updateAsset("video ratio");

    console.log("current video export ratio is ", currentvideoExportRatio);
});

function restartVideo(video){
    if (video && !video.paused && !video.ended && video.readyState > 2) {
        console.log("pause video first");
        video.pause(); // Pause only if the video is currently playing
    }
    video.currentTime = 0; // Reset video playback to the beginning
    video.play(); // Play the video
}

function recordAndDownloadVideo(){
    console.log("record and download video");
    setupMediaRecorder(processedAssetCanvas); 
    restartVideo(currentVideo);
    startRecording();
    setTimeout(() => {
        stopRecording();
    }, currentVideo.duration * 1000);

}
function downloadVideo(){
    if (recordedChunks.length > 0) {
        downloadRecordedVideo(currentVideoType);
        console.log("downloading current video type of ",currentVideoType);
    } else {
        console.error("No recorded chunks available");
    }
}
function setupMediaRecorder(canvas, downloadScaleFactor = 3) {
    const ctx = canvas.getContext("2d");
    const stream = canvas.captureStream(videoFPS);
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
    mediaRecorder.ondataavailable = function (event) {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = function () {
        downloadVideo();
    };

    mediaRecorder.onerror = function (event) {
        console.error("MediaRecorder error:", event.error);
    };

    mediaRecorder.onstart = function () {
        ctx.scale(1,1);
        console.log("MediaRecorder started");
    };

    mediaRecorder.onpause = function () {
        console.log("MediaRecorder paused");
    };

    mediaRecorder.onresume = function () {
        console.log("MediaRecorder resumed");
    };

    mediaRecorder.onwarning = function (event) {
        console.warn("MediaRecorder warning:", event.warning);
    };
}

function startRecording() {
    videoStatus.textContent=videoProcessing;
    if (mediaRecorder && mediaRecorder.state === "inactive") {
        recordedChunks = []; // Clear previous chunks
        mediaRecorder.start();
        console.log("Recording started");
    } else {
        console.error("MediaRecorder is not ready or already recording");
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        console.log("Stopping recording");
        mediaRecorder.stop();
    } else {
        console.error("MediaRecorder is not recording");
    }
}

function downloadRecordedVideo(videoType) {
    const blob = new Blob(recordedChunks, {
        // type: 'video/webm'
        type: 'video/mp4'// to see if mac user can do so 
    });

    console.log("recorded chunks are ", recordedChunks.length);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'downloaded_video.'+videoType;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100); // Cleanup
    recordedChunks = []; // Clear the recorded chunks
    videoStatus.textContent=videoDownloaded;
}

let videoFileLimit = 500;
function checkVideoFileSize(video){
    console.log("current video file is ", video.size);
    if(video.size >= videoFileLimit){
       video = compressVideoFile(video);
    }
    return video; 

}

// async function compressVideoFile(video) {
//     const ffmpeg = FFmpeg.createFFmpeg({ log: true });

//     await ffmpeg.load();
//     ffmpeg.FS('writeFile', 'input.mp4', await FFmpeg.fetchFile(video));

//     await ffmpeg.run('-i', 'input.mp4', '-vcodec', 'libx264', '-crf', '28', 'output.mp4');

//     const data = ffmpeg.FS('readFile', 'output.mp4');
//     const compressedVideo = new Blob([data.buffer], { type: 'video/mp4' });
//     console.log("compressedVideo is ", compressedVideo);
//     console.log("compressedVideo is ", compressedVideo.size);

//     return compressedVideo;
// }
function fromVideoFile(file) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const videoURL = URL.createObjectURL(file); // Create URL once
            video.src = videoURL;
            video.controls = true;  // Add controls so users can play/pause
            video.autoplay = true;  // Set autoplay to true to start playing automatically
            video.muted = true;     // Mute the video to allow autoplay in most browsers
            video.loop = true;

            video.onloadedmetadata = () => {
                currentVideo = video;
                videoImport.appendChild(currentVideo);  // Append to a specific container
                console.log("current video is ", currentVideo);
                resolve(currentVideo);
            };

            video.onerror = () => {
                reject(new Error("Failed to load video"));
            };
        });
       
}
videoInput.addEventListener('change', function (event) {
    const file = event.target.files[0];
    while (videoImport.firstChild) {
        videoImport.removeChild(videoImport.firstChild);
    }
    if (file) {
        fromVideoFile(file).then(video => {  
            clearCanvas();
            processVideo(video);
        }).catch(error => {
            console.error("Error loading video:", error);
        });
    }
});

function downloadImageWithRatio(){
    let canvas = document.getElementById('processed-asset');
    let tempCanvas = document.createElement('canvas');
    let tempCtx = tempCanvas.getContext('2d');
    let newWidth = canvas.width * currentimageExportRatio;
    let newHeight = canvas.height * currentimageExportRatio;
    if(newWidth>=imageWidthLimit){
        popupBackground.style.display = "block";
        console.error("File size too big. Refuse to download");
    }else{
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

}

function processVideo(video){
    if (!video || typeof video.videoWidth === 'undefined' || typeof video.videoHeight === 'undefined') {
        console.error('Video is not loaded or undefined');
        return; 
    }    
    clearCanvas();
    videoStatus.textContent=videoProcessing;
    const videoWidth = video.videoWidth * currentvideoExportRatio;
    const videoHeight = video.videoHeight * currentvideoExportRatio;
    const charWidthValue = fontSize.value * charWidthOffsetRatio;
    const lineHeightValue = fontSize.value * lineHeightOffsetRatio;
    const asciiDimensions = calculateAsciiDimensionsForImageSize(videoWidth, videoHeight, Number(fontSize.value), Number(fontSize.value)/charWidthOffsetRatio*lineHeightOffsetRatio);
    const aaReq = { width:asciiDimensions.width, height: asciiDimensions.height };

    processedWidth = asciiDimensions.width * charWidthValue;
    processedHeight = asciiDimensions.height * lineHeightValue;

    processedAssetCanvas.width = processedWidth;
    processedAssetCanvas.height = processedHeight;

    let backgroundColor = "rgba(255,255,255,1)";
    if(colorSelectionDropdown.value==="white"){
        backgroundColor = colorGray;
    }

    updateGradientFromCanvas(processedAssetCanvasCTX, currentGradientAngle, processedWidth, processedHeight);
    console.log(`processedAssetCanvasCTX dimension: ${processedWidth}x${processedHeight}`);

    const canvasOptions = {
        fontSize: fontSize.value,
        fontFamily: "Sora",
        lineHeight: lineHeightValue,
        charWidth: charWidthValue,
        charset: charset_sia,
        width: processedWidth,
        height: processedHeight,
        background: backgroundColor,
        color: gradient,
        el: processedAssetCanvas
    };

    console.log(`video dimension is ${video.videoWidth}x${video.videoHeight}`);
    console.log(`canvas dimension is ${canvasOptions.width}x${canvasOptions.height}`);
    // Adjust the canvas size to match the ASCII dimensions
    processedAssetCanvas.width = canvasOptions.width;
    processedAssetCanvas.height = canvasOptions.height;

    videoProcessingPipeline = aalib.read.video.fromVideoElement(video);

    videoProcessingPipeline = videoProcessingPipeline.map(aalib.aa(aaReq));

    if (inverseEle.checked) {
        videoProcessingPipeline = videoProcessingPipeline.map(aalib.filter.inverse());
    }
    // if (brightnessValue.value !== undefined) {
    //     videoProcessingPipeline = videoProcessingPipeline.map(aalib.filter.brightness(brightnessValue.value));
    // }
    if (contrastValue.value !== undefined) {
        videoProcessingPipeline = videoProcessingPipeline.map(aalib.filter.contrast(contrastValue.value));
    }

    videoProcessingPipeline.map(aalib.render.canvas(canvasOptions))
    .do(function (el) {
        replaceAssetToDiv(el,'processed-asset');
    }).subscribe();
    
    restartVideo(video); // This will also play the video
}

function processImage(img){
    if (!img || typeof img.width === 'undefined' || typeof img.height === 'undefined') {
        console.error('Image is not loaded or undefined');
        return; // Exit the function to avoid further errors
    }

    console.log("Process image ");
    let imageWidth, imageHeight;
    imageWidth = img.width;
    imageHeight = img.height;
  
    const charWidthValue = fontSize.value*charWidthOffsetRatio;//*0.8;
    const lineHeightValue = fontSize.value*lineHeightOffsetRatio;//0.8;
    const asciiDimensions = calculateAsciiDimensionsForImageSize(imageWidth, imageHeight, Number(fontSize.value) , Number(fontSize.value)/charWidthOffsetRatio*lineHeightOffsetRatio);
    const aaReq = { width:asciiDimensions.width  , height: asciiDimensions.height, colored: false};

    // console.log(`IMAGE dimension is ${img.width}x${img.height}`);
    // console.log(`ascii dimension is ${aaReq.width}x${aaReq.height}`);
    // console.log(`AFTER CONVERSION IMAGE dimension is ${imageWidth}x${imageHeight}`);
    
    processedWidth = asciiDimensions.width * charWidthValue;
    processedHeight = asciiDimensions.height * lineHeightValue;

    processedAssetCanvas.width = processedWidth;
    processedAssetCanvas.height = processedHeight;

    // console.log(`processed Size ${processedWidth}x${processedHeight}`);
    // console.log(`processed Asset Canvas ${processedAssetCanvas.width}x${processedAssetCanvas.height}` );
    
    let backgroundColor = "rgba(0,0,0,0)"
    if(colorSelectionDropdown.value==="white"){
        backgroundColor = colorGray;
    }
    if(colorSelectionDropdown.value == "Sia Gradient")
    {
        updateGradientFromCanvas(processedAssetCanvasCTX, currentGradientAngle, processedWidth, processedHeight);
    }
    const canvasOptions = {
        fontSize: fontSize.value,
        fontFamily: "Sora",
        lineHeight: lineHeightValue,
        charWidth: charWidthValue,
        charset: charset_sia,
        width: processedWidth,  
        height: processedHeight, 
        background: backgroundColor,
        color: gradient
    };
 
    let imageProcessingPipeline = aalib.read.image.fromURL(img.src);
       
    if (inverseEle.checked) {
        imageProcessingPipeline = imageProcessingPipeline.map(aalib.filter.inverse());
    }
    // if (brightnessValue.value !== undefined) {
    //     imageProcessingPipeline = imageProcessingPipeline.map(aalib.filter.brightness(brightnessValue.value));
    // }
    if (contrastValue.value !== undefined) {
        imageProcessingPipeline = imageProcessingPipeline.map(aalib.filter.contrast(contrastValue.value));
    }
    imageProcessingPipeline = imageProcessingPipeline.map(aalib.aa(aaReq));

    imageProcessingPipeline.map(aalib.render.canvas(canvasOptions))
    .do(function (el) {
        console.log("el dimension is ", `${el.width}x${el.height}`);
        replaceAssetToDiv(el,'processed-asset');}).subscribe(); 
}

function replaceAssetToDiv(el, targetDivId ){
    el.id = targetDivId;
    const existingElement = document.getElementById(targetDivId);
    if (existingElement) {
        existingElement.parentNode.replaceChild(el, existingElement);
    } else {
        el.id = targetDivId; 
         document.body.appendChild(el);
    }
}

function updateImageSizeWithWidth(img, newWidth) {
  // Getting the width and height of the current image 
  const oldWidth =  Number.parseFloat(getComputedStyle(img).width || img.getAttribute("width"));
  const oldHeight = Number.parseFloat(getComputedStyle(img).height || img.getAttribute("height"));
  // Getting proportional height with new width
  const newHeight = (newWidth * oldHeight)/oldWidth;
  // Setting dimensions in the image
  img.style.width = `${newWidth}px`;
  img.style.height = `${newHeight}px`;
  console.log("in the updateImageSizeWithWidth to ", newWidth);

}
function loadImageAndProcess(url) {
    const img = new Image();
    img.src = url;        
    img.onload = function () {
        // updateImageSizeWithWidth(img,1000);
        // let existingElement = document.getElementById('imported-image');
        if (imageImport) {
            console.log("loadImageAndProcess - replace child image");
            imageImport.src = img.src; 
            currentImage = img;
        } else {
            console.log("loadImageAndProcess - append child image");
            img.id = 'imported-image'; 
            document.body.appendChild(img); 
        }
        
        updateAsset("idle");

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

function getColorFromSaturation(saturation) {
    return saturationColors[saturation];
}

colorSelectionDropdown.onchange = (e) => {
    switch (e.target.value) {
        case 'Sia Gradient':
            displayForGradientOrColor(true);
            updateGradient(); 
            break;
        case 'black':
            updateColor(colorBlack);
            displayForGradientOrColor(false);
            break;
        case 'white':
            updateColor(colorWhite);
            displayForGradientOrColor(false);
            break;
        case 'gray':
            updateColor(colorGray);
            displayForGradientOrColor(false);
            break;
    }
}

saturationForGradient.addEventListener('change',(e)=>{
    saturationForGradientValue.textContent = e.target.value;
    currentSaturationForGradient = e.target.value;
    updateGradient();
})

gradientAngle.addEventListener('change', (e) => { 
    gradientAngleValue.textContent = e.target.value+`°`;
    currentGradientAngle = parseInt(e.target.value, 10);
    updateGradient(); 
});

noUiSlider.create(slider, {
    start: [1, 50, 100],
    tooltips: true,
    format: {
        from: function(value) {
                return parseInt(value);
            },
        to: function(value) {
                return parseInt(value);
            }
        },
    range: {
        'min': 1,
        'max': 100
    }
});

slider.noUiSlider.on('set', function(values) {
    currentPos1 = values[0];
    currentPos2= values[1];
    currentPos3= values[2];
    updateGradient();

});

imageExportRatio.oninput=(e)=>{
    imageExportRatio.value = e.target.value;
    currentimageExportRatio = imageExportRatio.value;
    console.log("current image ratio is ", currentimageExportRatio);
    updateAsset("imageExportRatio");
}

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded and parsed");
    fetchPresetFromJson("Presets/presetInfo.json"); 
});

window.onload = function() {
    console.log("PHASE 2");
    popupBackground.style.display = "none";
    enableInputs();
    currentimageExportRatio = imageExportRatio.value;
    charsetSelector.value = "SIA/";
    presetInfo.fontFamily = "Sora"; 
    videoStatus.textContent = videoInitialStatus;
    currentPos1 = 1;
    currentPos2 = 50;
    currentPos3 = 100;
    updateAsset("onload");

};

fontSize.oninput = (e) => {
    fontSize.value = e.target.value;
    updateAsset("fontSize");
}

// this does not change that fast 
brightnessEle.oninput = (e) => {
    brightnessValue.textContent =e.target.value;
    brightnessValue.value =e.target.value;
    updateAsset("brightness");
}

contrastEle.onchange=(e)=>{
    contrastValue.textContent=e.target.value;
    contrastValue.value=e.target.value;
    console.log("contrast value ", contrastValue.value);
    updateAsset("contrast");
}

inverseEle.onchange = (e) => {
    presetInfo.inverseEle = e.target.checked;
    updateAsset("inverseEle");
}

// charsetSelector.onchange=(e)=>{
//     if(e.target.value==="SIA/"){
//         presetInfo.charset =charset_sia;
//     }else{
//         presetInfo.charset =charset_ascii;
//     }
//     updateAsset("charset");
// }

function clearCanvas(){
    let ctx = processedAssetCanvas.getContext('2d');
    if (processedAssetCanvas) {
        ctx.clearRect(0, 0, processedAssetCanvas.width, processedAssetCanvas.height);
    }
}

function updateAssetBeforeDebounce(funcName){
    if(assetSelector.value==="image"){
        if(currentImage){
            console.log(`${funcName} - update IMAGE`);
            processImage(currentImage);
        }
    }else{
        if(currentVideo){
            console.log(`${funcName} - update VIDEO`);
            throttledProcessVideo();       
         }
    }
}
function updateAsset(funcName){
    updateAssetBeforeDebounce(funcName);// no delay for image for testing - still has trouble updating teh impacts upon first import

    // debounce(updateAssetBeforeDebounce(funcName),debounceDelay);
}

function updateSaturation(){
    currentColor1 = gradientInfo.color1; 
    currentColor2 = gradientInfo.color2;
    currentColor3 = gradientInfo.color3;
    currentColor1 = getColorFromSaturation( currentSaturationForGradient)[0];
    currentColor2 = getColorFromSaturation( currentSaturationForGradient)[1];
    currentColor3 = getColorFromSaturation( currentSaturationForGradient)[2];
}

function updateGradient(){
    let sliderAngle = 90;
    updateSaturation();
    updateGradientFromCanvas(gradientSliderCanvasCTX, sliderAngle, gscWidth, gscHeight);
    
    gradientSliderCanvasCTX.clearRect(0, 0, gscWidth, gscHeight);
    gradientSliderCanvasCTX.fillStyle = gradient;
    gradientSliderCanvasCTX.fillRect(0, 0, gscWidth, gscHeight);
    
    updateGradientFromCanvas(gradientCanvasCTX, currentGradientAngle, gcWidth, gcHeight);
    
    gradientCanvasCTX.clearRect(0, 0, gcWidth, gcHeight);
    gradientCanvasCTX.fillStyle = gradient;
    gradientCanvasCTX.fillRect(0, 0, gcWidth, gcHeight);
    
    updateAsset("gradient");

}

function updateGradientFromCanvas(ctx, angle, width, height) {
    let radians = (angle - 90) * (Math.PI / 180); // Convert angle to radians and adjust by -90 degrees
    let x1 = width / 2;
    let y1 = height / 2;
    let x2, y2;

    let diagonalLength = Math.sqrt(width * width + height * height) / 2;

    x2 = x1 + Math.cos(radians) * diagonalLength;
    y2 = y1 + Math.sin(radians) * diagonalLength;

    x1 = x1 - Math.cos(radians) * diagonalLength;
    y1 = y1 - Math.sin(radians) * diagonalLength;

    gradient = ctx.createLinearGradient(x1,y1,x2,y2);
    let pos1 = currentPos1 / 100.0;
    let pos2 = currentPos2 / 100.0;
    let pos3 = currentPos3 / 100.0;

    if (pos1 > pos2) [pos1, pos2] = [pos2, pos1];
    if (pos2 > pos3) [pos2, pos3] = [pos3, pos2];
    if (pos1 > pos2) [pos1, pos2] = [pos2, pos1];

    gradient.addColorStop(pos1, currentColor1);
    gradient.addColorStop(pos2, currentColor2);
    gradient.addColorStop(pos3, currentColor3);

  

}
function updateColor(color){
    let gcWidth = gradientCanvas.width;
    let gcHeight = gradientCanvas.height;
    console.log("in the update color ", gcWidth);
    gradient=color;
    gradientCanvasCTX.fillStyle = gradient;
    gradientCanvasCTX.fillRect(0, 0, gcWidth, gcHeight);
    updateAsset("color");
}


function displayForGradientOrColor(displayGradient){
    if(displayGradient){
        saturationContainer.style.display="flex";
        gradientAngleContainer.style.display="flex";
        slider.style.display="flex";
        gradientSliderCanvas.style.display = "flex";
    }else{
        saturationContainer.style.display="none";
        gradientAngleContainer.style.display="none";
        slider.style.display="none";
        gradientSliderCanvas.style.display = "none";
    }

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
    
    // if (charsetSelector.value != presetInfo.charset) {
    //     if (presetInfo.charset.includes("SIA/")) {
    //         charsetSelector.value = "SIA/";
    //     } else {
    //         charsetSelector.value = "ASCII";
    //     }
    // }
    if(gradientInfo!=presetInfo.gradientInfo){
        gradientInfo = presetInfo.gradientInfo;
    }

    gradientAngleValue.textContent = currentGradientAngle; 
    gradientAngle.value = currentGradientAngle; 
    saturationForGradient.value = currentSaturationForGradient; 
    saturationForGradientValue.textContent = currentSaturationForGradient; 
    imageExportRatio.value =currentimageExportRatio; 

}

function loadGradient(){
    currentPos1 = gradientInfo.colorPosition1;
    currentPos2 = gradientInfo.colorPosition2;
    currentPos3 = gradientInfo.colorPosition3;
    currentColor1 = gradientInfo.color1;
    currentColor2 = gradientInfo.color2;
    currentColor3 = gradientInfo.color3;
}

function saveGradient() {
    gradientInfo.colorPosition1 = currentPos1;
    gradientInfo.colorPosition2 = currentPos2;
    gradientInfo.colorPosition3 = currentPos3;
    gradientInfo.color1 = currentColor1;
    gradientInfo.color2= currentColor2;
    gradientInfo.color3 = currentColor3;
}

function loadPreset(){
    console.log("load preset");
    inverseEle.checked = presetInfo.inverseEle;
    brightnessEle.value = presetInfo.brightnessEle;
    contrastEle.value = presetInfo.contrastEle;
    gradientInfo = presetInfo.gradientInfo;
    brightnessValue.innerHTML = presetInfo.brightnessEle;
    contrastValue.innerHTML = presetInfo.contrastEle;
    fontSize.value = presetInfo.fontSize;
    charsetSelector.value = presetInfo.charset;
    currentGradientAngle = presetInfo.currentGradientAngle; 
    currentSaturationForGradient = presetInfo.currentSaturationForGradient;
    currentimageExportRatio = presetInfo.currentimageExportRatio;
    // charsetSelector.dispatchEvent(new Event('change'));
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
    presetInfo.fontSize = fontSize.value;
    presetInfo.fontFamily = "Sora";  
    presetInfo.charset = charsetSelector.value;
    // Add additional properties to be saved
    presetInfo.currentGradientAngle = currentGradientAngle;
    presetInfo.currentSaturationForGradient = currentSaturationForGradient;
    presetInfo.currentimageExportRatio = currentimageExportRatio;
    // Save the gradient positions and colors
    saveGradient();
    console.log("gradient info is ",gradientInfo);
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
        // Load additional properties
        currentGradientAngle = data.currentGradientAngle || currentGradientAngle; // Use existing value as fallback
        currentSaturationForGradient = data.currentSaturationForGradient || currentSaturationForGradient; // Use existing value as fallback
        currentimageExportRatio = data.currentimageExportRatio || currentimageExportRatio; // Use existing value as fallback
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

//Use throttling when you want to ensure that your function is called at regular intervals. For example, updating a UI element in response to a scroll event.
function throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function() {
        const context = this;
        const args = arguments;
        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(function() {
                if ((Date.now() - lastRan) >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    }
}

//Use debouncing when you want to ensure that your function is called after the event stops firing for a specified period.
function debounce(func, delay) {
    let inDebounce;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(inDebounce);
        inDebounce = setTimeout(() => func.apply(context, args), delay);
    }
}
