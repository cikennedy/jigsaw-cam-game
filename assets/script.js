// global variables in all caps 
let VIDEO = null;
let CANVAS = null;
let CONTEXT = null;

const main = () => {
    CANVAS = document.getElementById("myCanvas");
    CONTEXT = CANVAS.getContext("2d");
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;
    
    // a promise to get access to media devices. only interested in the video
    let promise = navigator.mediaDevices.getUserMedia({video:true});
    // once we have access to the camera, callback function
    promise.then(function(signal) {
        // create video element and initialize it to the signal coming from the camera, then play it
        VIDEO = document.createElement("video");
        VIDEO = srcObject=signal;
        VIDEO.play();

        // when video data is available, we can update it on the canvas
        VIDEO.onloadeddata=function() {
            updateCanvas();
        }
    // define errors if camera not allowed or if another error arises 
    }).catch(function(err) {
        alert("Camera error: " + err);
    });
}