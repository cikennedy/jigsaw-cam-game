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
// Keep track of start and end time
let START_TIME = null;
let END_TIME = null;
// add file and change file name below
let POP_SOUND = new Audio("./assets/pop.m4a");
// this will play whenever a piece is correctly placed
POP_SOUND.volume = 0.1;
// synthesize sounds in javascript
let AUDIO_CONTEXT = new (AudioContext ||
  webkitAudioContext ||
  window.webkitAudioContext)();
// keys playing three melodies, below are their frequencies
let keys = {
  DO: 261.6,
  RE: 293.7,
  MI: 329.6,
};

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
        updateGame();
      };
      // define errors if camera not allowed or if another error arises
    })
    .catch(function (err) {
      alert("Camera error: " + err);
    });
};

const setDifficulty = () => {
  let diff = document.getElementById("difficulty").value;
  switch (diff) {
    case "easy":
      initializePieces(3, 3);
      break;
    case "medium":
      initializePieces(6, 6);
      break;
    case "hard":
      initializePieces(12, 12);
      break;
    case "impossible":
      initializePieces(35, 30);
      break;
  }
};

// restart function will set the start time variable to the current timestamp
const restart = () => {
  START_TIME = new Date().getTime();
  // end time is set to null because we just started playing. also randomize pieces
  END_TIME = null;
  randomizePieces();
  document.getElementById("menuItems").style.display = "none";
};

//
const updateTime = () => {
  // first gets the current time for the system
  let now = new Date().getTime();
  // take the div we defined earlier to hold this value and sets the innerHTML to the difference between now and the start time
  if (START_TIME != null) {
    // if an end time is available, then that is shown, not the difference to the current time
    if (END_TIME != null) {
      document.getElementById("time").innerHTML = formatTime(
        END_TIME - START_TIME
      );
    } else {
      document.getElementById("time").innerHTML = formatTime(now - START_TIME);
    }
  }
};

const isComplete = () => {
  // for loop for all pieces
  for (let i = 0; i < PIECES.length; i++) {
    // if even one piece is false, return false
    if (PIECES[i].correct == false) {
      return false;
    }
  }
  return true;
};

const formatTime = (milliseconds) => {
  let seconds = Math.floor(milliseconds / 1000);
  // counting seconds, minutes, hours
  let s = Math.floor(seconds % 60);
  let m = Math.floor((seconds % (60 * 60)) / 60);
  let h = Math.floor((seconds % (60 * 60 * 24)) / (60 * 60));

  let formattedTime = h.toString().padStart(2, "0");
  formattedTime += ":";
  formattedTime += m.toString().padStart(2, "0");
  formattedTime += ":";
  formattedTime += s.toString().padStart(2, "0");

  return formattedTime;
};

// adding event listeners
const addEventListeners = () => {
  CANVAS.addEventListener("mousedown", onMouseDown);
  CANVAS.addEventListener("mousemove", onMouseMove);
  CANVAS.addEventListener("mouseup", onMouseUp);
  CANVAS.addEventListener("touchstart", onTouchStart);
  CANVAS.addEventListener("touchmove", onTouchMove);
  CANVAS.addEventListener("touchend", onTouchEnd);
};

const onMouseDown = (e) => {
  // get the image data from event.x, event.y as an array with four elements
  // red, green, blue, transparency
  const imgData = CONTEXT.getImageData(evt.x, evt.y, 1, 1);
  if(imgData[3]==0) {
    return;
  }
  const clickedColor="rgb("+imgData.data[0]+","+
    imgData.data[1]+","+
    imgData.data[2]+")";

  SELECTED_PIECE = getPressedPiece(e);
  // if a piece is selected, calculate the offset to the top left
  // use the offset while dragging so that the piece doesn't snap to the mouse location
  if (SELECTED_PIECE != null) {
    // find out the index of the selected piece
    const index = PIECES.indexOf(SELECTED_PIECE);
    if (index > -1) {
      // remove the piece using the splice method, add it using push so that the selected piece is always visible on top
      PIECES.splice(index, 1);
      PIECES.push(SELECTED_PIECE);
    }
    SELECTED_PIECE.offset = {
      x: e.x - SELECTED_PIECE.x,
      y: e.y - SELECTED_PIECE.y,
    };
    SELECTED_PIECE.correct = false;
  }
};

// if a piece is selected, update the location to the new mouse location. also considering offset
const onMouseMove = (e) => {
  if (SELECTED_PIECE != null) {
    SELECTED_PIECE.x = e.x - SELECTED_PIECE.offset.x;
    SELECTED_PIECE.y = e.y - SELECTED_PIECE.offset.y;
  }
};

const onMouseUp = () => {
  // snap the piece if it is near the correct location to give the player proper feedback
  if (SELECTED_PIECE && SELECTED_PIECE.isClose()) {
    // snaps as player cannot be expected to drop on the exact pixels
    SELECTED_PIECE.snap();
    // game can only be completed when the mouse is released
    // we want to also check that the end time is null because the player would still be able
    // to move pieces around after the game is over
    if (isComplete() && END_TIME == null) {
      // set the end time to the current time
      let now = new Date().getTime();
      END_TIME = now;
      // add delay for the playMelody function so that the popping sound does not overlap with the game complete noise
      setTimeout(playMelody, 500);
      showEndScreen();
    }
  }
  SELECTED_PIECE = null;
};

// use mouse functions as callbacks for touch functions
const onTouchStart = (e) => {
  let loc = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  onMouseDown(loc);
};

const onTouchMove = (e) => {
  let loc = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  onMouseMove(loc);
};

const onTouchEnd = () => {
  onMouseUp(loc);
};

// iterate through the pieces to check to see if the click location is within the bounds of any piece
const getPressedPiece = (loc) => {
  // iterate the pieces array in reverse order, the topmost piece is then selected if there are multiple pieces in one area
  for (let i = PIECES.length - 1; i >= 0; i--) {
    if (
      loc.x > PIECES[i].x &&
      loc.x < PIECES[i].x + PIECES[i].width &&
      loc.y > PIECES[i].y &&
      loc.y < PIECES[i].y + PIECES[i].height
    ) {
      // return the piece if conditions are met
      return PIECES[i];
    }
  }
  // if nothing matches the conditions, return null. meaning nothing was pressed
  return null;
};


const getPressedPieceByColor = (loc, color) => {
  for (let i = PIECES.length - 1; i >= 0; i--) {
    if (PIECES[i].color==color) {
      return PIECES[i];
    }
  }
  return null;
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
const updateGame = () => {
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
    PIECES[i].draw(CONTEXT,false);
  }
  // call the updateTime function as this is called on every frame
  updateTime();
  // requestAnimationFrame method will call the function recursively many times per second to provide a live image
  window.requestAnimationFrame(updateGame);
};

const getRandomColor = () => {
  const red = Math.floor(Math.random() * 255);
  const green = Math.floor(Math.random() * 255);
  const blue = Math.floor(Math.random() * 255);
  return "rgb(" + red + "," + green + "," + blue + ")";
};

const initializePieces = (rows, cols) => {
  SIZE.rows = rows;
  SIZE.columns = cols;

  PIECES = [];
  const uniqueRandomColors = [];
  // iterate through the rows using i, rows using j
  for (let i = 0; i < SIZE.rows; i++) {
    for (let j = 0; j < SIZE.columns; j++) {
      let color = getRandomColor();
      while (uniqueRandomColors.includes(color)) {
        color = getRandomColor();
      }
      // add a new piece using these two indeces
      PIECES.push(new Piece(i, j, color));
    }
  }

  let cnt = 0;
  for (let i = 0; i < SIZE.rows; i++) {
    for (let j = 0; j < SIZE.columns; j++) {
      const piece = PIECES[cnt];
      if (i == SIZE.rows - 1) {
        piece.bottom = null;
      } else {
        // sign will be either + or - 1 to signify the tabs
        const sgn = Math.random() - 0.5 < 0 ? -1 : 1;
        // allow the piece to be between 0.3 and 0.7
        piece.bottom = sgn * (Math.random() * 0.4 + 0.3);
      }

      if (j == SIZE.columns - 1) {
        piece.right = null;
      } else {
        const sgn = Math.random() - 0.5 < 0 ? -1 : 1;
        piece.right = sgn * (Math.random() * 0.4 + 0.3);
      }

      if (j == 0) {
        piece.left = null;
      } else {
        piece.left = -PIECES[cnt - 1].right;
      }

      if (i == 0) {
        piece.top = null;
      } else {
        piece.top = -PIECES[cnt - SIZE.columns].bottom;
      }
      cnt++;
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
    // comment this out to randomize
    PIECES[i].correct = false;
  }
};

// define piece class, specify a row and column index in constructor
class Piece {
  constructor(rowIndex, colIndex, color) {
    this.rowIndex = rowIndex;
    this.colIndex = colIndex;
    this.x = SIZE.x + (SIZE.width * this.colIndex) / SIZE.columns;
    this.y = SIZE.y + (SIZE.height * this.rowIndex) / SIZE.rows;
    this.width = SIZE.width / SIZE.columns;
    this.height = SIZE.height / SIZE.rows;
    this.xCorrect = this.x;
    this.yCorrect = this.y;
    this.correct = true;
    this.color = color;
  }
  // to be able to draw the pieces, use draw method using context as a parameter
  draw(context, useCam = true) {
    context.beginPath();

    const sz = Math.min(this.width, this.height);
    const neck = 0.125 * sz;
    const tabWidth = 0.3 * sz;
    const tabHeight = 0.3 * sz;

    // context.rect(this.x, this.y, this.width, this.height);
    // from top left
    context.moveTo(this.x, this.y);

    // to top right
    if (this.top) {
      context.lineTo(this.x + this.width * Math.abs(this.top) - neck, this.y);
      context.bezierCurveTo(
        this.x + this.width * Math.abs(this.top) - neck,
        this.y - tabHeight * Math.sign(this.top) * 0.2,

        this.x + this.width * Math.abs(this.top) - tabWidth,
        this.y - tabHeight * Math.sign(this.top),

        this.x + this.width * Math.abs(this.top),
        this.y - tabHeight * Math.sign(this.top)
      );

      context.bezierCurveTo(
        this.x + this.width * Math.abs(this.top) + tabWidth,
        this.y - tabHeight * Math.sign(this.top),

        this.x + this.width * Math.abs(this.top) + neck,
        this.y - tabHeight * Math.sign(this.top) * 0.2,

        this.x + this.width * Math.abs(this.top) + neck,
        this.y
      );
    }
    context.lineTo(this.x + this.width, this.y);

    // to bottom right
    if (this.right) {
      context.lineTo(
        this.x + this.width,
        this.y + this.height * Math.abs(this.right) - neck
      );

      context.bezierCurveTo(
        this.x + this.width - tabHeight * Math.sign(this.right) * 0.2,
        this.y + this.height * Math.abs(this.right) - neck,

        this.x + this.width - tabHeight * Math.sign(this.right),
        this.y + this.height * Math.abs(this.right) - tabWidth,

        this.x + this.width - tabHeight * Math.sign(this.right),
        this.y + this.height * Math.abs(this.right)
      );

      context.bezierCurveTo(
        this.x + this.width - tabHeight * Math.sign(this.right),
        this.y + this.height * Math.abs(this.right) + tabWidth,

        this.x + this.width - tabHeight * Math.sign(this.right) * 0.2,
        this.y + this.height * Math.abs(this.right) + neck,

        this.x + this.width,
        this.y + this.height * Math.abs(this.right) + neck
      );
    }
    context.lineTo(this.x + this.width, this.y + this.height);

    // to bottom left
    if (this.bottom) {
      context.lineTo(
        this.x + this.width * Math.abs(this.bottom) + neck,
        this.y + this.height
      );

      context.bezierCurveTo(
        this.x + this.width * Math.abs(this.bottom) + neck,
        this.y + this.height + tabHeight * Math.sign(this.bottom) * 0.2,

        this.x + this.width * Math.abs(this.bottom) + tabWidth,
        this.y + this.height + tabHeight * Math.sign(this.bottom),

        this.x + this.width * Math.abs(this.bottom),
        this.y + this.height + tabHeight * Math.sign(this.bottom)
      );

      context.bezierCurveTo(
        this.x + this.width * Math.abs(this.bottom) - tabWidth,
        this.y + this.height + tabHeight * Math.sign(this.bottom),

        this.x + this.width * Math.abs(this.bottom) - neck,
        this.y + this.height + tabHeight * Math.sign(this.bottom) * 0.2,

        this.x + this.width * Math.abs(this.bottom) - neck,
        this.y + this.height
      );
    }
    context.lineTo(this.x, this.y + this.height);

    // to top left
    if (this.left) {
      context.lineTo(this.x, this.y + this.height * Math.abs(this.left) + neck);

      context.bezierCurveTo(
        this.x + tabHeight * Math.sign(this.left) * 0.2,
        this.y + this.height * Math.abs(this.left) + neck,

        this.x + tabHeight * Math.sign(this.left),
        this.y + this.height * Math.abs(this.left) + tabWidth,

        this.x + tabHeight * Math.sign(this.left),
        this.y + this.height * Math.abs(this.left)
      );

      context.bezierCurveTo(
        this.x + tabHeight * Math.sign(this.left),
        this.y + this.height * Math.abs(this.left) - tabWidth,

        this.x + tabHeight * Math.sign(this.left) * 0.2,
        this.y + this.height * Math.abs(this.left) - neck,

        this.x,
        this.y + this.height * Math.abs(this.left) - neck
      );
    }
    context.lineTo(this.x, this.y);

    context.save();
    context.clip();

    const scaledTabHeight =
      Math.min(VIDEO.videoWidth/SIZE.columns,
        VIDEO.videoHeight/SIZE.rows)*tabHeight/sz;

    if(useCam){
    // call that crops a specific part of the video
      context.drawImage(
        VIDEO,
        (this.colIndex * VIDEO.videoWidth) / SIZE.columns-scaledTabHeight,
        (this.rowIndex * VIDEO.videoHeight) / SIZE.rows-scaledTabHeight,
        VIDEO.videoWidth / SIZE.columns+scaledTabHeight*2,
        VIDEO.videoHeight / SIZE.rows+scaledTabHeight*2,
        this.x-tabHeight,
        this.y-tabHeight,
        this.width+tabHeight*2,
        this.height+tabHeight*2);
    }else{
      context.fillStyle=this.color;
      context.fillRect(this.x-tabHeight,this.y-tabHeight,
        this.width+tabHeight*2,this.height*tabHeight*2);
    }
    
    context.restore();
    context.stroke();
  }
  // add method for seeing if the piece is close to the correct location
  isClose() {
    // calculate the distance to correct location and see if it is under a 33% threshhold
    if (
      distance(
        { x: this.x, y: this.y },
        { x: this.xCorrect, y: this.yCorrect }
      ) <
      this.width / 3
    ) {
      return true;
    }
    return false;
  }
  // add method for snapping pieces into place
  snap() {
    this.x = this.xCorrect;
    this.y = this.yCorrect;
    this.correct = true;
    POP_SOUND.play();
  }
}

// measure distance using a consequence of Pythagorean Theorem
const distance = (p1, p2) => {
  return Math.sqrt(
    (p1.x - p2.x) * (p1.x - p2.x) + (p1.x - p2.x) * (p1.y - p2.y)
  );
};

// function to play a single note
const playNote = (key, duration) => {
  // define oscillator which is responsible for generating the sound with the given frequency
  let osc = AUDIO_CONTEXT.createOscillator();
  // set the frequency as to the value coming as a parameter
  osc.frequency.value = key;
  // start the oscillator at the current time
  osc.start(AUDIO_CONTEXT.currentTime);
  // tell it to stop after the specified duration
  // setTimeout expects it in milliseconds and the stop method expects it in seconds, so divide by 1000
  osc.stop(AUDIO_CONTEXT.currentTime + duration / 1000);

  // sound more like a piano using an envelope to control the game (think of it as audio in a sense)
  let envelope = AUDIO_CONTEXT.createGain();
  // connect to default speakers via envelope
  osc.connect(envelope);
  // change wave type to triangle (from the default sin)
  osc.type = "triangle";
  // connect the envelope to the destination
  envelope.connect(AUDIO_CONTEXT.destination);
  // the piano sound has a powerful attack which means that it needs to go to 0 to maximum gain quickly
  envelope.gain.setValueAtTime(0, AUDIO_CONTEXT.currentTime);
  // max is 0.5 instead of 1 so it is not too loud, doing this in 0.1 seconds
  envelope.gain.linearRampToValueAtTime(0.5, AUDIO_CONTEXT.currentTime + 0.1);
  envelope.gain.linearRampToValueAtTime(
    0,
    AUDIO_CONTEXT.currentTime + duration / 1000
  );

  // good to disconnect the oscillator at the same time otherwise there may be background noise on the browser
  setTimeout(function () {
    osc.disconnect();
  }, duration);
};

// start with simple note playing for 300 ms, followed by notes playing for a specified time + the time from the start time
const playMelody = () => {
  playNote(keys.MI, 300);
  setTimeout(function () {
    playNote(keys.DO, 300);
  }, 300);
  setTimeout(function () {
    playNote(keys.MI, 150);
  }, 450);
  setTimeout(function () {
    playNote(keys.MI, 600);
  }, 600);
};

const showEndScreen = () => {
  const time = Math.floor((END_TIME - START_TIME) / 1000);
  document.getElementById("scoreValue").innerHTML = "Score: " + time;
  document.getElementById("endScreen").style.display = "block";
  document.getElementById("saveBtn").innerHTML = "Save";
  document.getElementById("saveBtn").disabled = false;
};

const showMenu = () => {
  document.getElementById("endScreen").style.display = "none";
  document.getElementById("menuItems").style.display = "block";
};

const showScores = () => {
  document.getElementById("endScreen").style.display = "none";
  document.getElementById("scoresScreen").style.display = "block";
  document.getElementById("scoresContainer").innerHTML = "Loading...";
  getScores();
};

const closeScores = () => {
  document.getElementById("endScreen").style.display = "block";
  document.getElementById("scoresScreen").style.display = "none";
};

const getScores = () => {
  fetch("server.php").then(function (response) {
    response.json().then(function (data) {
      document.getElementById("scoresContainer").innerHTML = formatScores(data);
    });
  });
};

const saveScore = () => {
  const time = END_TIME - START_TIME;
  const name = document.getElementById("name").value;
  if (name == "") {
    alert("Please enter your name");
    return;
  }
  const difficulty = document.getElementById("difficulty").value;

  fetch(
    'server.php?info={"name":"' +
      name +
      '",' +
      '"time":' +
      time +
      "," +
      '"difficulty":"' +
      difficulty +
      '"}'
  ).then(function (response) {
    document.getElementById("saveBtn").innerHTML = "Okay!";
  });

  document.getElementById("saveBtn").disabled = true;
};

const formatScores = (data) => {
  let html = "<table style='width:100%;text-align:center;'>";

  html += formatScoreTable(data["easy"], "Easy");
  html += formatScoreTable(data["medium"], "Medium");
  html += formatScoreTable(data["hard"], "Hard");
  html += formatScoreTable(data["impossible"], "Impossible");

  return html;
};

const formatScoreTable = (data, header) => {
  html += "<tr style='background:rgb(123,146,196);color:white'>";
  html += "<td></td><td><b>" + header + "</b></td><td><b>Time</b></td></tr>";

  for (let i = 0; i < data.length; i++) {
    html += "<tr>";
    html +=
      "<td>" +
      (i + 1) +
      ".</td><td title='" +
      data["easy"][i]["Name"] +
      "'>" +
      data[i]["Name"] +
      "</td><td>" +
      Math.floor(data[i]["Time"] / 1000) +
      "</td></tr>";
  }
};
