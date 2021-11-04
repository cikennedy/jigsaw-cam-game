// global variables in all caps
// initialize a video object
let VIDEO = null;
// initialize canvas object
let CANVAS = null;
// add reference to canvas context object
let CONTEXT = null;
// specify how much of the screen space will be used by the image. adjusting this will change the margin of the cam image
let SCALER = 0.8;
// keep track of other related information in the size variable
let SIZE = { x: 0, y: 0, width: 0, height: 0, rows: 3, columns: 3};
// array of pieces 
let PIECES = [];

const main = () => {
  CANVAS = document.getElementById("myCanvas");
  // 2d context provides drawing methods to build game, canvas will fill entire window
  CONTEXT = CANVAS.getContext("2d");

  // a promise to get access to media devices. only interested in the video
  let promise = navigator.mediaDevices.getUserMedia({ video: true });
  // once we have access to the camera, callback function
  promise
    .then(function (signal) {
      // create video element and initialize it to the signal coming from the camera, then play it
      VIDEO = document.createElement("video");
      VIDEO.srcObject = signal;
      VIDEO.play();

      // when video data is available, we can update it on the canvas
      VIDEO.onloadeddata = function () {
        handleResize();
        // window.addEventListener("resize", handleResize);
        updateCanvas();
      };
      // define errors if camera not allowed or if another error arises
    })
    .catch(function (err) {
      alert("Camera error: " + err);
    });
};

const handleResize = () => {
  // canvas will resize, not just the camera stream
  CANVAS.width = window.innerWidth;
  CANVAS.height = window.innerHeight;
  // update scaler/size values here when metadata is available
  let resizer =
    SCALER *
    // helper variable to find out the minimum ratio between the screen size and video size
    Math.min(
      window.innerWidth / VIDEO.videoWidth,
      window.innerHeight / VIDEO.videoHeight
    );
  // aspect ratio preserved so that nothing gets stretched
  SIZE.width = resizer * VIDEO.videoWidth;
  SIZE.height = resizer * VIDEO.videoHeight;
  // start in the middle of the screen by using half the width from left, half height from top
  SIZE.x = window.innerWidth / 2 - SIZE.height / 2;
  SIZE.y = window.innerHeight / 2 - SIZE.height / 2;
};

// function to draw video onto canvas
const updateCanvas = () => {
  // use drawImage method to draw image onto canvas
  CONTEXT.drawImage(VIDEO, SIZE.x, SIZE.y, SIZE.width, SIZE.height);
  // requestAnimationFrame method will call the function recursively many times per second to provide a live image
  window.requestAnimationFrame(updateCanvas);
};

const initializePieces = () => {
    PIECES = [];
    // iterate through the rows using i, rows using j
    for (let i=0; i<SIZE.rows; i++) {
        for (let j=0; j<SIZE.columns; j++) {
            // add a new piece using these two indeces 
            PIECES.push(new Piece(i,j));
        }
    }
}

// define piece class, specify a row and column index in constructor
class Piece{
    constructor(rowIndex, colIndex) {
        this.rowIndex=rowIndex;
        this.colIndex=colIndex;
    }
    // to be able to draw the pieces, use draw method using context as a parameter
    draw(context) {
        context.beginPath();
        context.rect()
    }
}