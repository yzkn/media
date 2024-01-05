// Copyright (c) 2023 YA-androidapp(https://github.com/yzkn) All rights reserved.


// Media
const getUnixTime = () => {
    const date = new Date();
    const unixTime = Math.floor(date.getTime() / 1000);
    return unixTime;
};

const getTag = (fileType) => {
    const typeShort = fileType.split('/')[0];

    let element;
    switch (typeShort) {
        case 'audio':
            element = document.createElement('audio');
            element.setAttribute('autoplay', 'autoplay');
            element.setAttribute('controls', 'controls');
            break;

        case 'image':
            element = document.createElement('img');
            break;

        case 'video':
            element = document.createElement('video');
            element.setAttribute('autoplay', 'autoplay');
            element.setAttribute('controls', 'controls');
            break;

        default:
            return null;
    }

    const unixTime = getUnixTime();
    element.setAttribute('id', typeShort + unixTime);
    element.setAttribute('name', typeShort + unixTime);
    element.classList.add('view-media');

    return element;
};


const loadFile = (file) => {
    const viewMedia = document.getElementById('viewMedia');

    console.log('file', file);

    if (file.type.match('audio.*') || file.type.match('image.*') || file.type.match('video.*')) {
        const reader = new FileReader();
        reader.onload = () => {
            const elem = getTag(file.type);
            elem.src = reader.result;
            viewMedia.prepend(elem);
        };
        reader.readAsDataURL(file);
    }
};


// Speech Synthesis
let defaultVoice = null;
const populateVoiceList = () => {
    const voices = speechSynthesis.getVoices();

    const speechSynthesisVoice = document.getElementById('speechSynthesisVoice');
    speechSynthesisVoice.innerHTML = '';

    let i = 0;
    voices.forEach(voice => {
        if (!voice.lang.match('ja')) {
            return;
        }

        if (voice.default) {
            defaultVoice = voice.name;
        }

        const option = document.createElement('option');
        option.value = voice.name;
        option.text = voice.name;
        option.setAttribute('index', i);
        option.setAttribute('data-lang', voice.lang);
        option.setAttribute('data-name', voice.name);

        if (voice.default) {
            option.setAttribute('selected', true);
        }

        speechSynthesisVoice.appendChild(option);

        i++; // ja の voice のみカウント
    });

    if (defaultVoice == null) {
        defaultVoice = i - 1;
    }
};


// Sound recorder
let analyserSoundRecorder = null;
let audioCtxSoundRecorder = null;
let biquadFilterSoundRecorder = null;
let convolverSoundRecorder = null;
let distortionSoundRecorder = null;
let gainNodeSoundRecorder = null;
let localStreamSoundRecorder = null;
let mediaRecorderSoundRecorder = null;
let recordedChunksSoundRecorder = [];
let recordedMimeTypeSoundRecorder = "";
let sourceSoundRecorder = null;

let intendedWidth;
let canvasSoundRecorder;
let canvasCtxSoundRecorder;

const visualizeSoundRecorder = _ => {
    let width = canvasSoundRecorder.width;
    let height = canvasSoundRecorder.height;

    analyserSoundRecorder.fftSize = 256;
    let bufferLength = analyserSoundRecorder.frequencyBinCount;
    let dataArray = new Float32Array(bufferLength);

    canvasCtxSoundRecorder.clearRect(0, 0, width, height);

    function drawSoundRecorder() {
        requestAnimationFrame(drawSoundRecorder);

        analyserSoundRecorder.getFloatFrequencyData(dataArray);

        canvasCtxSoundRecorder.fillStyle = 'rgb(0, 0, 0)';
        canvasCtxSoundRecorder.fillRect(0, 0, width, height);

        let barWidth = (width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] + 140) * 2;

            canvasCtxSoundRecorder.fillStyle = 'rgb(' + Math.floor(barHeight + 100) + ',50,50)';
            canvasCtxSoundRecorder.fillRect(x, height - barHeight / 2, barWidth, barHeight / 2);

            x += barWidth + 1;
        }
    };

    drawSoundRecorder();
};

const mimetype2extSoundRecorder = (audioType) => {
    let extension = "";
    const matches = audioType.match(/audio\/([^;]+)/);

    if (matches) {
        extension = matches[1];
    }

    return "." + extension;
};

const startRecordingSoundRecorder = _ => {
    if (navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function (stream) {
                localStreamSoundRecorder = stream;

                if (audioCtxSoundRecorder == null) {
                    audioCtxSoundRecorder = new (window.AudioContext || window.webkitAudioContext)();
                    sourceSoundRecorder = audioCtxSoundRecorder.createMediaStreamSource(stream);
                    analyserSoundRecorder = audioCtxSoundRecorder.createAnalyser();
                    analyserSoundRecorder.minDecibels = -90;
                    analyserSoundRecorder.maxDecibels = -10;
                    analyserSoundRecorder.smoothingTimeConstant = 0.85;
                    distortionSoundRecorder = audioCtxSoundRecorder.createWaveShaper();
                    gainNodeSoundRecorder = audioCtxSoundRecorder.createGain();
                    biquadFilterSoundRecorder = audioCtxSoundRecorder.createBiquadFilter();
                    convolverSoundRecorder = audioCtxSoundRecorder.createConvolver();
                    sourceSoundRecorder.connect(analyserSoundRecorder);
                    analyserSoundRecorder.connect(distortionSoundRecorder);
                    distortionSoundRecorder.connect(biquadFilterSoundRecorder);
                    biquadFilterSoundRecorder.connect(convolverSoundRecorder);
                    convolverSoundRecorder.connect(gainNodeSoundRecorder);
                    gainNodeSoundRecorder.connect(audioCtxSoundRecorder.destination);
                    visualizeSoundRecorder();
                }

                if (mediaRecorderSoundRecorder == null) {
                    let mimeTypeValue = "audio/" + document.getElementById("mimetype").value;
                    if (MediaRecorder.isTypeSupported(mimeTypeValue) == false) {
                        mimeTypeValue = "audio/webm";
                        document.getElementById("mimetype").value = "webm";
                        document.getElementById("mimetype-alert").style.display = "block";
                    }
                    mediaRecorderSoundRecorder = new MediaRecorder(stream, {
                        mimeType: mimeTypeValue
                    });
                    mediaRecorderSoundRecorder.start();
                } else {
                    if (mediaRecorderSoundRecorder.state == "paused") {
                        mediaRecorderSoundRecorder.resume();
                    } else if (mediaRecorderSoundRecorder.state == "inactive") {
                        mediaRecorderSoundRecorder.start();
                    }
                }

                // mediaRecorderが録音中に変わったら
                if (mediaRecorderSoundRecorder.state == "recording") {
                    document.getElementById("record").innerHTML = "<i class=\"bi-pause-circle\"></i>";
                    document.getElementById("stop").removeAttribute("disabled");
                }
            })
            .catch(function (e) {
                console.log(e);
            });
    }
};

const pauseRecordingSoundRecorder = _ => {
    if (mediaRecorderSoundRecorder) {
        if (mediaRecorderSoundRecorder.state == "recording") {
            mediaRecorderSoundRecorder.pause();
        }

        // mediaRecorderが一時停止に変わったら
        if (mediaRecorderSoundRecorder.state == "paused") {
            document.getElementById("record").innerHTML = "<i class=\"bi-record-circle\"></i>";
        }
    }
};

const stopRecordingSoundRecorder = _ => {
    if (mediaRecorderSoundRecorder) {
        if (mediaRecorderSoundRecorder.state == "paused" || mediaRecorderSoundRecorder.state == "recording") {
            mediaRecorderSoundRecorder.stop();
            mediaRecorderSoundRecorder.ondataavailable = function (e) {
                if (e.data.size > 0) {
                    recordedMimeTypeSoundRecorder = e.data.type;
                    recordedChunksSoundRecorder.push(e.data);

                    document.getElementById("player").src = URL.createObjectURL(e.data);
                    document.getElementById("player").style["pointer-events"] = "auto";
                    document.getElementById("record").innerHTML = "<i class=\"bi-record-circle\"></i>";
                    document.getElementById("save").removeAttribute("disabled");

                    const blob = new Blob(recordedChunksSoundRecorder, { type: recordedMimeTypeSoundRecorder });
                    let reader = new FileReader();
                    reader.readAsDataURL(blob);
                    reader.onload = () => {
                        console.log("Base64");
                        // console.log("Base64", reader.result);
                    };
                }
            }
        }
    }
};

const saveFileSoundRecorder = _ => {
    let blob = new Blob(recordedChunksSoundRecorder, {
        type: recordedMimeTypeSoundRecorder
    });
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = url;
    a.download = "record" + mimetype2extSoundRecorder(recordedMimeTypeSoundRecorder);
    a.click();
    window.URL.revokeObjectURL(url);
};

const initializeVisualizer = _ => {
    intendedWidth = document.getElementById('visualizer-wrapper').clientWidth;
    canvasSoundRecorder = document.getElementById('visualizer');
    canvasCtxSoundRecorder = canvasSoundRecorder.getContext("2d");
    canvasSoundRecorder.setAttribute('width', intendedWidth);
    canvasCtxSoundRecorder.fillStyle = 'rgb(0, 0, 0)';
    canvasCtxSoundRecorder.fillRect(0, 0, canvasSoundRecorder.width, canvasSoundRecorder.height);
};

const toggleVisualizerVisiblity = (show = true) => {
    document.getElementById('visualizer-wrapper').style.visibility = show ? 'block' : 'hidden';
};


window.addEventListener('DOMContentLoaded', _ => {
    // Media
    document.getElementById('openMedia').addEventListener('change', (event) => {
        if (event.target.files.length > 0) {
            Array.from(event.target.files).forEach(file => {
                loadFile(file);
            });
        }
    });


    // SVG
    document.getElementById('svgPreviewGenerate').addEventListener('click', (event) => {
        const tag = document.getElementById('svgPreviewSvgTag').value;
        const oParser = new DOMParser();
        const doc = oParser.parseFromString(tag, 'image/svg+xml');
        const failed = doc.querySelector("parsererror");

        if (failed) {
            console.log('Parser error: ', failed);
            // console.log('Parser error: ', failed.childNodes[0].data);
            // console.log('Parser error: ', failed.childNodes[1].textContent);

            document.getElementById('svgPreviewError').style.display = 'block';
            document.getElementById('svgPreviewError').innerHTML = failed.childNodes[0].data + '<br><br>' + failed.childNodes[1].textContent.replace(' ', '&nbsp;').replace('\n', '<br>');
        } else {
            document.getElementById('svgPreviewError').style.display = 'none';
            document.getElementById('svgPreviewError').innerText = '';
            document.getElementById('svgPreviewImage').src = 'data:image/svg+xml;charset=UTF-8,' + tag;
        }
    });


    // Webcam
    let mediaRecorder;
    let recordedBlobs;


    // Speech Synthesis
    populateVoiceList();
    speechSynthesis.onvoiceschanged = _ => populateVoiceList();

    document.getElementById('speechSynthesisSpeak').addEventListener('click', _ => {
        const utterance = new SpeechSynthesisUtterance(document.getElementById('speechSynthesisMessage').value);
        utterance.pitch = document.getElementById('speechSynthesisPitch').value;
        utterance.rate = document.getElementById('speechSynthesisRate').value;
        utterance.voice = speechSynthesis
            .getVoices()
            .filter(voice => voice.name === document.getElementById('speechSynthesisVoice').value)[0];
        utterance.volume = document.getElementById('speechSynthesisVolume').value;

        speechSynthesis.speak(utterance);
    });

    document.getElementById('speechSynthesisPause').addEventListener('click', _ => {
        speechSynthesis.pause();
    });

    document.getElementById('speechSynthesisResume').addEventListener('click', _ => {
        speechSynthesis.resume();
    });

    document.getElementById('speechSynthesisCancel').addEventListener('click', _ => {
        speechSynthesis.cancel();
    });

    document.getElementById('speechSynthesisReset').addEventListener('click', _ => {
        document.getElementById('speechSynthesisMessage').value = '';
        document.getElementById('speechSynthesisPitch').value = 1;
        document.getElementById('speechSynthesisRate').value = 1;
        document.getElementById('speechSynthesisVolume').value = 10;

        if (document.querySelector('option[selected=true]')) {
            document.querySelector('option[selected=true]').removeAttribute('selected');
        }
        document.querySelector('option[index="' + defaultVoice + '"]').setAttribute('selected', true);
    });


    // Speech Recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        SpeechRecognition = webkitSpeechRecognition || SpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = 'ja';
        recognition.interimResults = true;
        recognition.continuous = true;

        let fixed = '';

        recognition.onresult = (event) => {
            const result = document.getElementById('speechRecognitionResult');

            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                let transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    fixed += transcript;
                } else {
                    interim = transcript;
                }
            }
            result.innerHTML = fixed + '<i style="color: #ddd; ">' + interim + '</i>';
        };

        document.getElementById('speechRecognitionStart').addEventListener('click', _ => {
            recognition.start();
        });

        document.getElementById('speechRecognitionStop').addEventListener('click', _ => {
            recognition.stop();
        });
    } else {
        document.getElementById('speechRecognitionStart').setAttribute('disabled', 'disabled');
        document.getElementById('speechRecognitionStop').setAttribute('disabled', 'disabled');
    }


    // Webcam
    document.getElementById('webcamStart').addEventListener('click', () => {
        const constraints = {
            video: {
                width: { min: 640 },
                height: { min: 360 }
            }
        };

        navigator.mediaDevices
            .getUserMedia(constraints)
            .then((mediaStream) => {
                document.getElementById('webcamRecord').disabled = false;
                document.getElementById('webcamVideo').srcObject = mediaStream;
                window.stream = mediaStream;
            })
            .catch((error) => {
                console.error(error);
            });
    });

    document.getElementById('webcamRecord').addEventListener('click', () => {
        if (document.getElementById('webcamRecord').textContent === 'Record') {
            recordedBlobs = [];

            try {
                mediaRecorder = new MediaRecorder(window.stream);
            } catch (error) {
                console.error(error);
                return;
            }

            document.getElementById('webcamDownload').disabled = true;
            document.getElementById('webcamRecord').textContent = 'Stop';

            mediaRecorder.onstop = (event) => {
                console.log(event);
            };

            mediaRecorder.ondataavailable = (event) => {
                // console.log(event);

                if (event.data && event.data.size > 0) {
                    recordedBlobs.push(event.data);
                }
            };

            mediaRecorder.start(10);

        } else {
            mediaRecorder.stop();

            document.getElementById('webcamDownload').disabled = false;
            document.getElementById('webcamRecord').textContent = 'Record';
        }
    });

    document.getElementById('webcamDownload').addEventListener('click', () => {
        const blob = new Blob(recordedBlobs, { type: 'video/webm' });
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'rec.webm';
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    });


    // Sound recorder
    document.getElementById("record").addEventListener("click", function () {
        if (mediaRecorderSoundRecorder && mediaRecorderSoundRecorder.state == "recording") {
            toggleVisualizerVisiblity(false);
            pauseRecordingSoundRecorder();
        } else {
            toggleVisualizerVisiblity(true);
            initializeVisualizer();
            startRecordingSoundRecorder();
        }
    });

    document.getElementById("stop").addEventListener("click", function () {
        toggleVisualizerVisiblity(false);
        stopRecordingSoundRecorder();
    });

    document.getElementById("save").addEventListener("click", function () {
        saveFileSoundRecorder();
    });

    let alertList = document.querySelectorAll('.alert')
    alertList.forEach(function (alert) {
        new bootstrap.Alert(alert)
    });
});
