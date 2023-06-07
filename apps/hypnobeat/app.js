// --------- CONSTANTS ---------
const OSCILLATION_DURATION = 40;
const ARTIST_FONT = "6x8:3";
const TRACK_FONT = "6x8:4";
const ALBUM_FONT = "6x8:2";
const ARTIST_Y_POS = g.getHeight() * 0.16;
const TRACK_Y_POS = g.getHeight() * 0.42;
const ALBUM_Y_POS = g.getHeight() * 0.73;
const CENTER_X = g.getWidth() / 2;
const CENTER_Y = g.getHeight() / 2;

// --------- VARIABLES ---------
let isPlaying;
let artist = "Artist";
let track = "Track";
let previousTrack;
let album = "Album";
let totalDuration = 0;
let currentPosition = 0;
let startTime;
let buttonTimeoutRef = 0;
let trackTimeoutRef = null;
let touchEventTriggered = false;
let clearCenterSize = 60;
let oscillationIntervalId = null;
let lastOscillationTime = 0;

// --------- DRAWING FUNCTIONS ---------
function drawText() {
  if (artist === album) album = '';
  g.clearRect(0, ARTIST_Y_POS, g.getWidth(), ARTIST_Y_POS + 23);
  drawStringOscillate('artist', artist || '', ARTIST_FONT, ARTIST_Y_POS);
  g.clearRect(0, ALBUM_Y_POS, g.getWidth(), ALBUM_Y_POS + 15);
  drawStringOscillate('album', album || '', ALBUM_FONT, ALBUM_Y_POS);
}

function drawTrack() {
  g.clearRect(0, TRACK_Y_POS, g.getWidth(), TRACK_Y_POS + 31);
  drawStringOscillate('track', track || '', TRACK_FONT, TRACK_Y_POS);
}

function updateMusicInfo() {
  if (oscillationIntervalId !== null) {
    clearInterval(oscillationIntervalId);
  }
  if (
    isPlaying &&
    ((track && getStringWidth(track, TRACK_FONT) > g.getWidth()) ||
      (artist && getStringWidth(artist, ARTIST_FONT) > g.getWidth()) ||
      (album && getStringWidth(album, ALBUM_FONT) > g.getWidth()))
  ) {
    oscillationIntervalId = setInterval(function () {
      drawText();
      if (!touchEventTriggered) {
        drawTrack();
      }
    }, 10 / 3);
  }
  drawText();
}

function getStringWidth(text, font) {
  g.setFont(font);
  return text ? g.stringWidth(text) : 0;
}

function drawStringOscillate(id, text, font, y) {
  g.setFont(font);
  let bufferAmount = 20;
  let textWidth = getStringWidth(text, font);
  if (textWidth < g.getWidth()) {
    g.drawString(
      text || '',
      g.getWidth() / 2 - textWidth / 2,
      y
    );
  } else {
    let t = (lastOscillationTime % OSCILLATION_DURATION) / OSCILLATION_DURATION;
    let overflow = textWidth - g.getWidth() + 2 * bufferAmount;
    let offset = Math.sin(t * 2 * Math.PI) * (overflow / 2);
    g.drawString(
      text || '',
      bufferAmount - overflow / 2 + offset,
      y
    );
    lastOscillationTime += 60 / 1000;
  }
}

function clearCenter() {
  let topLeft = [0, CENTER_Y - clearCenterSize / 2];
  let bottomRight = [g.getWidth(), CENTER_Y + clearCenterSize / 2];
  g.clearRect(topLeft[0], topLeft[1], bottomRight[0], bottomRight[1]);
}

function clearCorner() {
  let y = g.getHeight();
  g.clearRect(0, y - 30, 30, y);
}

function setClearCenterTimeout() {
  clearTimeout(buttonTimeoutRef);
  buttonTimeoutRef = setTimeout(function () {
    clearCenter();
    drawTrack();
    touchEventTriggered = false;
  }, 1000);
  updateMusicInfo();
}

function drawPlayButton(size) {
  size = typeof size !== "undefined" ? size : "large";
  let triangleHeight = size === "large" ? 50 : 20;
  let triangleWidth = size === "large" ? 40 : 20 * 0.8;
  let x = size === "large" ? g.getWidth() / 2 - triangleWidth / 2 : 4;
  let y = size === "large" ? g.getHeight() / 2 - triangleHeight / 2 : g.getHeight() - triangleHeight - 4;
  let poly = [
    x,
    y,
    x + triangleWidth,
    y + triangleHeight / 2,
    x,
    y + triangleHeight,
  ];
  g.fillPoly(poly);
}

function drawPauseButton(size) {
  size = typeof size !== "undefined" ? size : "large";
  let buttonHeight = size === "large" ? 50 : 20;
  let buttonWidth = size === "large" ? 20 : 20 * 0.4;
  let buttonSpacing = size === "large" ? 10 : 20 * 0.2;
  let x = size === "large" ? g.getWidth() / 2 - buttonWidth * 1.25 : 4;
  let y = size === "large" ? g.getHeight() / 2 - buttonHeight / 2 : g.getHeight() - buttonHeight - 4;
  g.fillRect(x, y, x + buttonWidth, y + buttonHeight);
  g.fillRect(x + buttonWidth + buttonSpacing, y, x + 2 * buttonWidth + buttonSpacing, y + buttonHeight);
}

function drawSkipButton(direction) {
  g.clear();
  startTime = getTime();
  let triangleHeight = 50;
  let triangleWidth = 40;
  let shift = direction === "next" ? 15 : -15;
  let x = (g.getWidth() / 2 - triangleWidth / 2) + shift;
  let y = g.getHeight() / 2 - triangleHeight / 2;
  let poly, rect;
  if (direction === "next") {
    poly = [
      x,
      y,
      x + triangleWidth,
      y + triangleHeight / 2,
      x,
      y + triangleHeight,
    ];
    rect = [x - 20, y, x - 10, y + 50];
  } else {
    poly = [
      x + triangleWidth,
      y,
      x,
      y + triangleHeight / 2,
      x + triangleWidth,
      y + triangleHeight,
    ];
    rect = [x + 50, y, x + 60, y + 50];
  }
  g.fillRect(rect[0], rect[1], rect[2], rect[3]);
  g.fillPoly(poly);
  setClearCenterTimeout();
}

function drawVolumeIndicator(direction) {
  clearCenter();
  let thickness = 20;
  let length = 60;
  if (direction === "up") {
    g.fillRect(CENTER_X - length / 2, CENTER_Y - thickness / 2, CENTER_X + length / 2, CENTER_Y + thickness / 2);
    g.fillRect(CENTER_X - thickness / 2, CENTER_Y - length / 2, CENTER_X + thickness / 2, CENTER_Y + length / 2);
  } else {
    g.fillRect(CENTER_X - length / 2, CENTER_Y - thickness / 2, CENTER_X + length / 2, CENTER_Y + thickness / 2);
  }
  setClearCenterTimeout();
}

// --------- MUSIC CONTROL FUNCTIONS ---------

function musicControl(controlType) {
  touchEventTriggered = false; // Reset trigger flag when a new command comes in
  touchEventTriggered = true;
  Bangle.musicControl(controlType);
  switch (controlType) {
    case "next":
      drawSkipButton("next");
      break;
    case "previous":
      drawSkipButton("prev");
      break;
    case "volumeup":
      drawVolumeIndicator("up");
      break;
    case "volumedown":
      drawVolumeIndicator("down");
      break;
  }
}

function displayPlayingState() {
  clearCenter();
  clearCorner();
  touchEventTriggered = true;
  if (isPlaying) {
    drawPlayButton();
    drawPlayButton("small");
  } else {
    drawPauseButton();
    drawPauseButton("small");
    clearInterval(oscillationIntervalId);
  }
}

function togglePlayPauseUserInput() {
  Bangle.buzz(40);
  let localIsPlaying = isPlaying; // create a local copy of isPlaying
  localIsPlaying = !localIsPlaying; // toggle the local copy, not affecting the global isPlaying
  if (localIsPlaying) {
    Bangle.musicControl("play");
  } else {
    Bangle.musicControl("pause");
  }
}

// --------- TOUCH HANDLING FUNCTIONS ---------

function onTouchStroke(e) {
  Bangle.beep(400);
  if (e.stroke === "left") {
    musicControl("previous");
  } else if (e.stroke === "right") {
    musicControl("next");
  } else if (e.stroke === "up") {
    musicControl("volumeup");
  } else if (e.stroke === "down") {
    musicControl("volumedown");
  }
}

Bangle.strokes = {
  left: Unistroke.new(new Uint8Array([130, 60, 100, 60, 70, 60, 40, 60, 10, 60])),
  right: Unistroke.new(new Uint8Array([10, 60, 40, 60, 70, 60, 100, 60, 130, 60])),
  up: Unistroke.new(new Uint8Array([70, 130, 70, 100, 70, 70, 70, 40, 70, 10])),
  down: Unistroke.new(new Uint8Array([70, 10, 70, 40, 70, 70, 70, 100, 70, 130])),
};

// --------- TIMER MANAGEMENT FUNCTIONS ---------
function updateCurrentTrackPosition() {
  g.clearRect(36, g.getHeight() - 30, g.getWidth(), g.getHeight());
  g.setFont("6x8", 2);
  g.setFontAlign(-1, 1, 0);
  let currentPosStr = Math.floor(currentPosition / 60) + ":" + (currentPosition % 60).toString().padStart(2, "0");
  let totalDurStr = Math.floor(totalDuration / 60) + ":" + (totalDuration % 60).toString().padStart(2, "0");
  let x = g.getWidth();
  let y = g.getHeight();
  g.drawString(currentPosStr + "/" + totalDurStr, x / 3, y - 4);
  g.reset();
}

function manageTimer(shouldStart) {
  clearInterval(trackTimeoutRef);
  if (shouldStart) {
    trackTimeoutRef = setInterval(function () {
      if (isPlaying && track === previousTrack) {
        let elapsedTime = getTime() - startTime;
        currentPosition = Math.floor(elapsedTime);
        updateCurrentTrackPosition();
      } else {
        currentPosition = 0;
        clearInterval(trackTimeoutRef);
      }
    }, 1000);
  }
}

// --------- GADGETBRIDGE MESSAGE HANDLING ---------
function handleGadgetbridgeMessage(msg) {
    if (msg.t === 'musicstate') {
        isPlaying = msg.state === "play";
        currentPosition = msg.position;
        startTime = getTime() - currentPosition;  // Adjust startTime based on currentPosition
        displayPlayingState(isPlaying);
    }
    if (msg.t === 'musicinfo') {
        totalDuration = msg.dur;
        artist = msg.artist;
        album = msg.album;
        track = msg.track;
        if (track !== previousTrack) {
          previousTrack = track;
          currentPosition = 0;
          startTime = getTime();
        }
    }
    manageTimer(isPlaying);
    setClearCenterTimeout();
    updateCurrentTrackPosition();
}

// --------- MAIN ---------
function initApp() {
  let buttonTimer;
  let buttonPressed = false;
  setWatch(function () {
    if (!buttonPressed) {
      buttonPressed = true;
      buttonTimer = setTimeout(function () {
        Bangle.showClock();
        buttonPressed = false;
      }, 500);
    }
  }, BTN1, {
    edge: "rising",
    debounce: 50,
    repeat: true,
  });
  setWatch(function () {
    if (buttonPressed) {
      clearTimeout(buttonTimer);
      togglePlayPauseUserInput();
    }
    buttonPressed = false;
  }, BTN1, {
    edge: "falling",
    debounce: 50,
    repeat: true,
  });
  Bangle.on("touch", function (zone, e) {
    togglePlayPauseUserInput();
  });
  Bangle.on("stroke", function (e) {
    onTouchStroke(e);
  });
  Bangle.on("GB", (event) => {
    const msg = event;
    handleGadgetbridgeMessage(msg);
  });
}

g.clear();
Bangle.musicControl("pause");
Bangle.musicControl("play");
updateCurrentTrackPosition();
setClearCenterTimeout();
initApp();