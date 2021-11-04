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
let SIZE = { x: 0, y: 0, width: 0, height: 0, rows: 3, columns: 3 };
// array of pieces
let PIECES = [];
// initialize with null or if no piece is pressed
let SELECTED_PIECE = null;

const main = () => {
  CANVAS = document.getElementById("myCanvas");
  // 2d context provides drawing methods to build game, canvas will fill entire window
  CONTEXT = CANVAS.getContext("2d");

  addEventListeners();

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
        initializePieces(SIZE.rows, SIZE.columns);
        updateCanvas();
      };
      // define errors if camera not allowed or if another error arises
    })
    .catch(function (err) {
      alert("Camera error: " + err);
    });
};

// adding event listeners
const addEventListeners = () => {
    CANVAS.addEventListener("mousedown", onMouseDown);
    CANVAS.addEventListener("mousemove", onMouseMove);
    CANVAS.addEventListener("mouseup", onMouseUp);
}

const onMouseDown = (e) => {
    SELECTED_PIECE=getPressedPiece(e);
    // if a piece is selected, calculate the offset to the top left
    // use the offset while dragging so that the piece doesn't snap to the mouse location
    if (SELECTED_PIECE !=null) {
        SELECTED_PIECE.offset={
            x:e.x-SELECTED_PIECE.x,
            y:e.y-SELECTED_PIECE.y
        }
    }
}

// if a piece is selected, update the location to the new mouse location. also considering offset
const onMouseMove = (e) => {
    if (SELECTED_PIECE !=null) {
        SELECTED_PIECE.x=e.x-SELECTED_PIECE.offset.x;
        SELECTED_PIECE.y=e.y-SELECTED_PIECE.offset.y
    }
}

const onMouseUp = (e) => {
    // to do
}

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
  // clear the canvas
  CONTEXT.clearRect(0, 0, CANVAS.width, CANVAS.height);
  // 50% transparency
  CONTEXT.globalAlpha = 0.5;

  // use drawImage method to draw image onto canvas
  CONTEXT.drawImage(VIDEO, SIZE.x, SIZE.y, SIZE.width, SIZE.height);
  // reset transparency to 100% so only the video is semi-transparent, pieces drawn normally
  CONTEXT.globalAlpha = 1;

  // iterate through the pieces and call the draw method using the global context
  for (let i = 0; i < PIECES.length; i++) {
    PIECES[i].draw(CONTEXT);
  }
  // requestAnimationFrame method will call the function recursively many times per second to provide a live image
  window.requestAnimationFrame(updateCanvas);
};

const initializePieces = (rows, cols) => {
  SIZE.rows = rows;
  SIZE.columns = cols;

  PIECES = [];
  // iterate through the rows using i, rows using j
  for (let i = 0; i < SIZE.rows; i++) {
    for (let j = 0; j < SIZE.columns; j++) {
      // add a new piece using these two indeces
      PIECES.push(new Piece(i, j));
    }
  }
};

// randomize the location of the pieces
const randomizePieces = () => {
  // iterate through the pieces and generate random locations
  for (let i = 0; i < PIECES.length; i++) {
    let loc = {
      // scaled by the canvas width and height (subtracted by piece width/height)
      x: Math.random() * (CANVAS.width - PIECES[i].width),
      y: Math.random() * (CANVAS.height - PIECES[i].height),
    };
    PIECES[i].x = loc.x;
    PIECES[i].y = loc.y;
  }
};

// define piece class, specify a row and column index in constructor
class Piece {
  constructor(rowIndex, colIndex) {
    this.rowIndex = rowIndex;
    this.colIndex = colIndex;
    this.x = SIZE.x + (SIZE.width * this.colIndex) / SIZE.columns;
    this.y = SIZE.y + (SIZE.height * this.rowIndex) / SIZE.rows;
    this.width = SIZE.width / SIZE.columns;
    this.height = SIZE.height / SIZE.rows;
  }
  // to be able to draw the pieces, use draw method using context as a parameter
  draw(context) {
    context.beginPath();

    // call that crops a specific part of the video
    context.drawImage(
      VIDEO,
      (this.colIndex * VIDEO.videoWidth) / SIZE.columns,
      (this.rowIndex * VIDEO.videoHeight) / SIZE.rows,
      VIDEO.videoWidth / SIZE.columns,
      VIDEO.videoHeight / SIZE.rows,
      this.x,
      this.y,
      this.width,
      this.height
    );

    context.rect(this.x, this.y, this.width, this.height);
    context.stroke();
  }
}
