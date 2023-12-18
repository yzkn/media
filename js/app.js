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


window.addEventListener('DOMContentLoaded', _ => {
    // Media
    document.getElementById('openMedia').addEventListener('change', (event) => {
        if (event.target.files.length > 0) {
            Array.from(event.target.files).forEach(file => {
                loadFile(file);
            });
        }
    });

    document.getElementById('openMedia').addEventListener('change', (event) => {
        if (event.target.files.length > 0) {
            Array.from(event.target.files).forEach(file => {
                loadFile(file);
            });
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
});
