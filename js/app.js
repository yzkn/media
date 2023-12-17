// Copyright (c) 2023 YA-androidapp(https://github.com/yzkn) All rights reserved.


window.addEventListener('DOMContentLoaded', _ => {
    document.getElementById('openAudio').addEventListener('change', (event) => {
        if (event.target.files.length > 0) {
            const file = event.target.files[0];
            if (file.type.match('audio.*')) {
                const reader = new FileReader();
                reader.onload = () => {
                    const audio = document.getElementById('audio');
                    audio.src = reader.result;
                    audio.style.display = 'inline';
                };
                reader.readAsDataURL(file);
            }
        }
    });

    document.getElementById('openImage').addEventListener('change', (event) => {
        if (event.target.files.length > 0) {
            const file = event.target.files[0];
            if (file.type.match('image.*')) {
                const reader = new FileReader();
                reader.onload = () => {
                    console.log('reader', reader);
                    const image = document.getElementById('image');
                    image.src = reader.result;
                };
                reader.readAsDataURL(file);
            }
        }
    });

    document.getElementById('openVideo').addEventListener('change', (event) => {
        if (event.target.files.length > 0) {
            const file = event.target.files[0];
            if (file.type.match('video.*')) {
                const reader = new FileReader();
                reader.onload = () => {
                    const video = document.getElementById('video');
                    video.src = reader.result;
                };
                reader.readAsDataURL(file);
            }
        }
    });
});
