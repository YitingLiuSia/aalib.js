import aalib from "../dist/aalib.js";
import { ASCII_CHARSET } from "../src/renderers/HTMLRenderer";
const charset_ascii = ASCII_CHARSET;
const charset_sia = "SIA/-.><!^*()   ";
const resource = filename => `../resources/${ filename }`;
const imageDropdown = document.getElementById('image-dropdown');
let isCanvas = true; 
let currentImage, currentVideo;
let gradientCanvas = document.getElementById("gradient-canvas");
let gradientSliderCanvas = document.getElementById("gradient-slider-canvas");
let gradientSliderCanvasCTX = gradientSliderCanvas.getContext('2d');
let gradientCanvasCTX = gradientCanvas.getContext('2d');
let gscWidth = gradientSliderCanvas.width;
let gscHeight = gradientSliderCanvas.height;
let gcWidth = gradientCanvas.width;
let gcHeight = gradientCanvas.height;
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
let currentGradientAngle = 90; // Initialize with a default value, e.g., 90 degrees
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
let backgroundCanvasForWhite= document.getElementById("background-setup");
let backgroundCanvasForWhiteCTX=backgroundCanvasForWhite.getContext('2d');
let videoExportRatio = document.getElementById("videoExportRatio");

const charWidthOffsetRatio = 0.8;
const lineHeightOffsetRatio = 1.6;
const ratioValue = 2;
const inputs = document.querySelectorAll('input');
let debounceDelay = 500;
let throttleDelay = 200;
const videoFPS = 60; // Example: 30 FPS, adjust this based on your video's FPS
let currentvideoExportRatio = 1;

savePresetButton.onclick= savePresetToFile;
saveImageButton.onclick = downloadImageWithRatio;

// const throttledProcessVideo = throttle(processVideo, 200); // Adjust the 200ms to your needs


inputs.forEach(e => {
    e.disabled = true;
});
function enableInputs() {
inputs.forEach(e => {
    e.disabled = false;
});
}

// gradient
class GradientInfo {
    constructor(color1, color2, color3, colorPosition1, colorPosition2, colorPosition3) {
        this.color1 = color1;
        this.color2 = color2;
        this.color3 = color3;
        this.colorPosition1 = colorPosition1;
        this.colorPosition2 = colorPosition2;
        this.colorPosition3 = colorPosition3;
        // this.saturation = saturation;
        // this.angle = angle; 
    }
}

class PresetInfo {
    constructor(inverseEle, brightnessEle, contrastEle, gradientInfo, fontSize, charset) {
        this.inverseEle = inverseEle;
        this.brightnessEle = brightnessEle;
        this.contrastEle = contrastEle;
        // this.colorSelection = colorSelection;
        this.gradientInfo = gradientInfo;
        this.fontSize = fontSize;
        this.charset = charset;
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

// const domRefs = {
//     videoImportContainer: document.getElementById("video-container"),
//     imageImportContainer: document.getElementById("image-container"),
//     videoInput: document.getElementById('videoInput'),
//     imageInput: document.getElementById("imageInput"),
//     imageImport: document.getElementById("imported-image"),
//     videoImport: document.getElementById('video-import')
// };

// // Use event delegation for assetSelector changes
// document.addEventListener('change', (e) => {
//     clearCanvas();
//     if (e.target.id === 'asset-selector') {
//         const isVideo = e.target.value === "video";
//         domRefs.videoImportContainer.style.display = isVideo ? "block" : "none";
//         domRefs.imageImportContainer.style.display = isVideo ? "none" : "inline-block";
//         domRefs.videoInput.style.display = isVideo ? "block" : "none";
//         domRefs.imageInput.style.display = isVideo ? "none" : "block";
//         domRefs.imageImport.style.display =isVideo ? "block" : "none";
//         domRefs.videoImport.style.display =isVideo ? "none" : "block";

//         if(isVideo){
//             if (currentVideo) {
//                 currentVideo.pause();
//                 currentVideo = null;
//             } 
//         }else{
//             currentImage = null;
//         }
//     }
// });


document.addEventListener('DOMContentLoaded', () => fetchPresetFromJson("Presets/presetInfo.json"));
startRecordingButton.onclick = recordAndDownloadVideo;
imageInput.addEventListener('change', handleImageInputChange);

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
    const originalWidth = canvas.width;
    const originalHeight = canvas.height;
    const ctx = canvas.getContext("2d");
    // canvas.width= displayWidth;
    // canvas.height = displayHeight;

    const stream = canvas.captureStream(videoFPS);
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
    mediaRecorder.ondataavailable = function (event) {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = function () {
        // Reset canvas to original size for high resolution download
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
        type: 'video/webm'
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
        //     if(currentVideo!=video){
        //    currentVideo = video;}
           videoImport.appendChild(currentVideo);  // Append to a specific container
           console.log("current video is ",currentVideo);
           resolve(currentVideo);
        //    processVideo(currentVideo);
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
    console.log("processedAssetCanvas is ",processedAssetCanvas);
    let canvas = document.getElementById('processed-asset');
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
let videoProcessingPipeline;

function processVideo(video){
    clearCanvas();
    if (!video || typeof video.videoWidth === 'undefined' || typeof video.videoHeight === 'undefined') {
        console.error('Video is not loaded or undefined');
        return; // Exit the function to avoid further errors
    }

    videoStatus.textContent=videoProcessing;
    const videoWidth = video.videoWidth * currentvideoExportRatio;
    const videoHeight = video.videoHeight * currentvideoExportRatio;
    const charWidthValue = fontSize.value * charWidthOffsetRatio;
    const lineHeightValue = fontSize.value * lineHeightOffsetRatio;
    const asciiDimensions = calculateAsciiDimensionsForImageSize(videoWidth, videoHeight, Number(fontSize.value), Number(fontSize.value)/charWidthOffsetRatio*lineHeightOffsetRatio);
    const aaReq = { width:asciiDimensions.width, height: asciiDimensions.height };

    let backgroundColor = "rgba(255,255,255,1)";
    if(colorSelectionDropdown.value==="white"){
        backgroundColor = colorBlack;
    }

    const canvasOptions = {
        fontSize: fontSize.value,
        fontFamily: "Sora",
        lineHeight: lineHeightValue,
        charWidth: charWidthValue,
        charset: presetInfo.charset,
        width: asciiDimensions.width * charWidthValue,
        height: asciiDimensions.height * lineHeightValue,
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
    if (brightnessValue.value !== undefined) {
        videoProcessingPipeline = videoProcessingPipeline.map(aalib.filter.brightness(brightnessValue.value));
    }
    if (contrastValue.value !== undefined) {
        videoProcessingPipeline = videoProcessingPipeline.map(aalib.filter.contrast(contrastValue.value));
    }

    videoProcessingPipeline.map(aalib.render.canvas(canvasOptions))
    .do(function (el) {
        replaceAssetToDiv(el,'processed-asset');
    }).subscribe();
    
    restartVideo(video); // This will also play the video


}

// function processVideo(video){
//     clearCanvas();
//     if (!video || typeof video.videoWidth === 'undefined' || typeof video.videoHeight === 'undefined') {
//         console.error('Video is not loaded or undefined');
//         return; // Exit the function to avoid further errors
//     }

//     restartVideo(video);
//     videoStatus.textContent=videoProcessing;
//     const videoWidth = video.videoWidth;// * videoResolutionRatio;  
//     const videoHeight = video.videoHeight;//* videoResolutionRatio; 
//     const charWidthValue = fontSize.value*charWidthOffsetRatio;//*0.8;
//     const lineHeightValue = fontSize.value*lineHeightOffsetRatio;//0.8;
//     const asciiDimensions = calculateAsciiDimensionsForImageSize(videoWidth, videoHeight, Number(fontSize.value) , Number(fontSize.value)/charWidthOffsetRatio*lineHeightOffsetRatio);
//     const aaReq = { width:asciiDimensions.width  , height: asciiDimensions.height};

//     let backgroundColor = "rgba(255,255,255,1)"; 
//     if(colorSelectionDropdown.value==="white"){
//         backgroundColor =  colorBlack; 
//     }

//     console.log("video width and height is ",asciiDimensions.width * charWidthValue, asciiDimensions.height * lineHeightValue );
//     const canvasOptions = {
//         fontSize: fontSize.value,
//         fontFamily: "Sora",
//         lineHeight: lineHeightValue,
//         charWidth: charWidthValue,
//         charset: presetInfo.charset,
//         width: asciiDimensions.width * charWidthValue,  
//         height: asciiDimensions.height * lineHeightValue, 
//         background: backgroundColor,// make the background white 
//         color: gradient,
//         el: processedAssetCanvas
//     };

//     processedAssetCanvas.width = canvasOptions.width;
//     processedAssetCanvas.height = canvasOptions.height;
  
//     videoProcessingPipeline =aalib.read.video.fromVideoElement(video);
   
//     videoProcessingPipeline = videoProcessingPipeline.map(aalib.aa(aaReq));

//     if (inverseEle.checked) {
//         console.log("inverse elemenet is checked ", inverseEle.checked)
//         videoProcessingPipeline = videoProcessingPipeline.map(aalib.filter.inverse());
//     }
//     if (brightnessValue.value !== undefined) {
//         console.log("brightnessValue value ", brightnessValue.value);
//         videoProcessingPipeline = videoProcessingPipeline.map(aalib.filter.brightness(brightnessValue.value));
//     }
//     if (contrastValue.value !== undefined) {
//         console.log("contrastValue value ", contrastValue.value);
//         videoProcessingPipeline = videoProcessingPipeline.map(aalib.filter.contrast(contrastValue.value));
//     }
    
//     videoProcessingPipeline.map(aalib.render.canvas(canvasOptions))
//     .do(function (el) {
//         replaceAssetToDiv(el,'processed-asset');}).subscribe(); 
// }

function processImage(img){
    // clearCanvas();
    if (!img || typeof img.width === 'undefined' || typeof img.height === 'undefined') {
        console.error('Image is not loaded or undefined');
        return; // Exit the function to avoid further errors
    }

    const imageWidth = img.width;  
    const imageHeight = img.height;
    const charWidthValue = fontSize.value*charWidthOffsetRatio;//*0.8;
    const lineHeightValue = fontSize.value*lineHeightOffsetRatio;//0.8;
    let ratioX =(Number(fontSize.value) + charWidthValue)*ratioValue; //2* fontSize.value/5*13.5;// 
    let ratioY = (Number(fontSize.value) + lineHeightValue)*ratioValue;//2*fontSize.value/5*13.5 ;//
    console.log(`font size: ${fontSize.value}, charwidth value: ${charWidthValue}, line height value: ${lineHeightValue}`);
    console.log("RATIO dimension ", `${ratioX}x${ratioY}`);

    const asciiDimensions = calculateAsciiDimensionsForImageSize(imageWidth, imageHeight, Number(fontSize.value) , Number(fontSize.value)/charWidthOffsetRatio*lineHeightOffsetRatio);
    const aaReq = { width:asciiDimensions.width  , height: asciiDimensions.height, colored: false};
    console.log("image dimension ", `${imageWidth}x${imageHeight}`);
    console.log("asciiDimensions ", `${asciiDimensions.width}x${asciiDimensions.height}`);

    const canvasOptions = {
        fontSize: fontSize.value,
        fontFamily: "Sora",
        lineHeight: lineHeightValue,
        charWidth: charWidthValue,
        charset: presetInfo.charset,
        width: asciiDimensions.width * charWidthValue,  
        height: asciiDimensions.height * lineHeightValue, 
        background: "rgba(0,0,0,0)",
        color: gradient
    };

    // Adjust the canvas size to match the ASCII dimensions
    processedAssetCanvas.width = canvasOptions.width;
    processedAssetCanvas.height = canvasOptions.height;

    let imageProcessingPipeline = aalib.read.image.fromURL(img.src);
       
    if (inverseEle.checked) {
        imageProcessingPipeline = imageProcessingPipeline.map(aalib.filter.inverse());
    }
    if (brightnessValue.value !== undefined) {
        imageProcessingPipeline = imageProcessingPipeline.map(aalib.filter.brightness(brightnessValue.value));
    }
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

function getColorFromSaturation(saturation) {
    return saturationColors[saturation];
}

colorSelectionDropdown.onchange = (e) => {
    switch (e.target.value) {
        case 'Sia Gradient':
            displayForGradientOrColor(true);
            updateBackgroundForWhite('transparent');
            updateGradient(); 
            break;
        case 'black':
            updateColor(colorBlack);
            displayForGradientOrColor(false);
            updateBackgroundForWhite('transparent');
            break;
        case 'white':
            updateColor(colorWhite);
            updateBackgroundForWhite(colorGray);
            displayForGradientOrColor(false);
            break;
        case 'gray':
            updateColor(colorGray);
            updateBackgroundForWhite('transparent');
            displayForGradientOrColor(false);
            break;
    }
}

saturationForGradient.addEventListener('input',(e)=>{
    saturationForGradientValue.textContent = e.target.value;
    currentSaturationForGradient = e.target.value;
    updateGradient();
})

gradientAngle.addEventListener('input', (e) => { 
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

slider.noUiSlider.on('update', function(values) {
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

window.onload = function() {
    console.log("PHASE 2");
    enableInputs();
    currentimageExportRatio = imageExportRatio.value;
    charsetSelector.value = presetInfo.charset;
    presetInfo.fontFamily = "Sora"; // fontDropdown.value;
    videoStatus.textContent = videoInitialStatus;

    requestAnimationFrame(() => {
        updateGradient();
        updateAsset("charset");
    });
};

fontSize.oninput = (e) => {
    fontSize.value = e.target.value;
    updateAsset("fontSize");
}

brightnessEle.oninput = (e) => {
    brightnessValue.textContent =e.target.value;
    brightnessValue.value =e.target.value;
    updateAsset("brightness");
}

contrastEle.oninput=(e)=>{
    contrastValue.textContent=e.target.value;
    contrastValue.value=e.target.value;
    console.log("contrast value ", contrastValue.value);
    updateAsset("contrast");
}

inverseEle.onchange = (e) => {
    presetInfo.inverseEle = e.target.checked;
    updateAsset("inverseEle");
}

charsetSelector.onchange=(e)=>{
    if(e.target.value==="SIA/"){
        presetInfo.charset =charset_sia;
    }else{
        presetInfo.charset =charset_ascii;
    }
    updateAsset("charset");
}

function clearCanvas(){
    let ctx = processedAssetCanvas.getContext('2d');
    if (processedAssetCanvas) {
        console.log("meant to clear the ctx ",processedAssetCanvas.width, processedAssetCanvas.height);
        ctx.clearRect(0, 0, processedAssetCanvas.width, processedAssetCanvas.height);
    }
}

function updateAssetBeforeDebounce(funcName){
    console.log("in debounce");
    if(assetSelector.value==="image"){
        if(currentImage){
            console.log(`${funcName} - update IMAGE`);
            processImage(currentImage);
        }
    }else{
        if(currentVideo){
            console.log(`${funcName} - update VIDEO`);
            throttle(processVideo(currentVideo),throttleDelay);
        }
    }


}
function updateAsset(funcName){
    console.log("update asset before debounce");
    debounce(updateAssetBeforeDebounce(funcName),debounceDelay);
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
    let sliderAngle = 0;
    updateSaturation();
    updateGradientFromCanvas(gradientSliderCanvasCTX, sliderAngle, gscWidth);
    gradientSliderCanvasCTX.fillStyle = gradient;
    gradientSliderCanvasCTX.fillRect(0, 0, gscWidth, gscHeight);
    updateGradientFromCanvas(gradientCanvasCTX, currentGradientAngle, gcWidth);
    gradientCanvasCTX.fillStyle = gradient;
    gradientCanvasCTX.fillRect(0, 0, gcWidth, gcHeight);
    updateAsset("gradient");
}

function updateColor(color){
    gradient=color;
    gradientCanvasCTX.fillStyle = gradient;
    gradientCanvasCTX.fillRect(0, 0, gcWidth, gcHeight);
    updateAsset("color");
}
function updateBackgroundForWhite(color) {
    if(assetSelector.value==="image"){
        backgroundCanvasForWhite.width = processedAssetCanvas.width;
        backgroundCanvasForWhite.height = processedAssetCanvas.height;

        backgroundCanvasForWhite.style.top = processedAssetCanvas.offsetTop + 'px';
        backgroundCanvasForWhite.style.left = processedAssetCanvas.offsetLeft + 'px';

        backgroundCanvasForWhiteCTX.fillStyle = color;
        backgroundCanvasForWhiteCTX.fillRect(0, 0, backgroundCanvasForWhite.width, backgroundCanvasForWhite.height);
    }
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
function updateGradientFromCanvas(canvas, angle, width){
    let radian = angle * Math.PI / 180;
    let x2 = width * Math.cos(radian);
    let y2 = width * Math.sin(radian);
    gradient = canvas.createLinearGradient(0, 0, x2, y2);
    if(currentPos1 && currentPos2 && currentPos3){
        gradient.addColorStop(currentPos1 / 100.0, currentColor1);
        gradient.addColorStop(currentPos2 / 100.0, currentColor2);
        gradient.addColorStop(currentPos3 / 100.0, currentColor3);
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
    if (charsetSelector.value != presetInfo.charset) {
        if (presetInfo.charset.includes("SIA/")) {
            charsetSelector.value = "SIA/";
        } else {
            charsetSelector.value = "ASCII";
        }
    }
    if(gradientInfo!=presetInfo.gradientInfo){
        gradientInfo = presetInfo.gradientInfo;
    }
}

function loadGradient(){
    currentPos1 = gradientInfo.colorPosition1;
    currentPos2 = gradientInfo.colorPosition2;
    currentPos3 = gradientInfo.colorPosition3;
    currentColor1 = gradientInfo.color1;
    currentColor2 = gradientInfo.color2;
    currentColor3 = gradientInfo.color3;
    saturationForGradient =  gradientInfo.saturation;
    gradientAngle = gradientInfo.angle;
}

function saveGradient() {
    gradientInfo.colorPosition1 = currentPos1;
    gradientInfo.colorPosition2 = currentPos2;
    gradientInfo.colorPosition3 = currentPos3;
    gradientInfo.color1 = currentColor1;
    gradientInfo.color2= currentColor2;
    gradientInfo.color3 = currentColor3;
    gradientInfo.saturation = saturationForGradient;
    gradientInfo.angle = gradientAngle;
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
    charsetSelector.dispatchEvent(new Event('change'));
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
    console.log("gradient info is ",gradientInfo);
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
    //    presetInfo.colorSelection = data.colorSelection;
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
