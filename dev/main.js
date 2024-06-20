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
const charset_sia = "SIA/- ";
const resource = filename => `../resources/${ filename }`;

const presetSelection = document.getElementById("preset-selection");
const presetFolderName = "Presets/";
presetSelection.addEventListener('change',function(){
    var selectedPreset = this.value;
    switch(selectedPreset){
        case 'preset-1':
            fetchPresetFromJson(presetFolderName+"presetsInfo.json");
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
    .then(response => {
        if (!response.ok) {
            throw new Error("HTTP error " + response.status);
        }
        return response.json();
    })
    .then(data => {
        console.log(`data from ${filePath} is ${data}`);
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

// Rest of the code remains the same...
