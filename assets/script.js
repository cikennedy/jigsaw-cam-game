// global variables in all caps
// initialize a video object
let VIDEO = null;
// initialize canvas object
let CANVAS = null;
// add reference to canvas context object
let CONTEXT = null;
// specify how much of the screen space will be used by the image
let SCALER = 0.8;
// keep track of other related information in the size variable
let SIZE = {x:0, y:0, width:0, height:0};

const main = () => {
    CANVAS = document.getElementById("myCanvas");
    // 2d context provides drawing methods to build game, canvas will fill entire window
    CONTEXT = CANVAS.getContext("2d");
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;
    
    // a promise to get access to media devices. only interested in the video
    let promise = navigator.mediaDevices.getUserMedia({video:true});
    // once we have access to the camera, callback function
    promise.then(function(signal) {
        // create video element and initialize it to the signal coming from the camera, then play it
        VIDEO = document.createElement("video");
        VIDEO.srcObject = signal;
        VIDEO.play();

        // when video data is available, we can update it on the canvas
        VIDEO.onloadeddata=function() {
            // update scaler/size values here when metadata is available 
            let resizer = SCALER*
            // helper variable to find out the minimum ratio between the screen size and video size
                Math.min(
                    window.innerWidth/VIDEO.videoWidth,
                    window.innerHeight/VIDEO.videoHeight,
                );
                // aspect ratio preserved so that nothing gets stretched 
                SIZE.width=resizer*VIDEO.videoWidth;
                SIZE.height=resizer*VIDEO.videoHeight;
                // start in the middle of the screen by using half the width from left, half height from top
                SIZE.x=window.innerWidth/2-SIZE.height/2;
                SIZE.y=window.innerHeight/2-SIZE.height/2;
            updateCanvas();
        }
    // define errors if camera not allowed or if another error arises 
    }).catch(function(err) {
        alert("Camera error: " + err);
    });
}

// function to draw video onto canvas
const updateCanvas = () => {
    // use drawImage method to draw image onto canvas
    CONTEXT.drawImage(VIDEO,
        SIZE.x, SIZE.y,
        SIZE.width, SIZE.height);
    // requestAnimationFrame method will call the function recursively many times per second to provide a live image
    window.requestAnimationFrame(updateCanvas);

}