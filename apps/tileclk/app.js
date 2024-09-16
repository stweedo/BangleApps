(function() {
  const SCALE = 12,
    SEC_SCALE = 6,
    FRAC_STEPS = 5,
    ANIM_DELAY = 25,
    COLOR_INTERP = 0.2,
    GAP = 3;
  const width = g.getWidth(),
    height = g.getHeight();
  const settings = require('Storage').readJSON("tileclk.json", true) || {
    widgets: "show",
    seconds: "hide"
  };
  const is12Hour = (require('Storage').readJSON("setting.json", true) || {})['12hour'] || false;
  let showSeconds = settings.seconds === "show" || (settings.seconds === "dynamic" && !Bangle.isLocked());

  const digits = {
    '0': ["111", "101", "101", "101", "111"],
    '1': ["010", "110", "010", "010", "111"],
    '2': ["111", "001", "111", "100", "111"],
    '3': ["111", "001", "111", "001", "111"],
    '4': ["101", "101", "111", "001", "001"],
    '5': ["111", "100", "111", "001", "111"],
    '6': ["111", "100", "111", "101", "111"],
    '7': ["111", "001", "001", "001", "001"],
    '8': ["111", "101", "111", "101", "111"],
    '9': ["111", "101", "111", "001", "111"]
  };

  const digitWidth = 3 * SCALE,
    colonWidth = SCALE,
    secDigitWidth = 3 * SEC_SCALE;
  const totalSecWidth = 2 * secDigitWidth + GAP,
    secStartX = (width / 2) - (totalSecWidth / 2);

  function calcPositions(isThreeDigit) {
    const totalWidth = isThreeDigit ? 3 * digitWidth + colonWidth + 3 * GAP : 4 * digitWidth + colonWidth + 4 * GAP;
    const startX = (width - totalWidth) / 2;

    return {
      colonX: Math.round(isThreeDigit ? startX + digitWidth + GAP : startX + 2 * (digitWidth + GAP)),
      colonY: Math.round(0.35 * height),
      digitX: isThreeDigit ? [
        Math.round(startX),
        Math.round(startX + digitWidth + GAP + colonWidth + GAP),
        Math.round(startX + 2 * (digitWidth + GAP) + colonWidth + GAP)
      ] : [
        Math.round(startX),
        Math.round(startX + digitWidth + GAP),
        Math.round(startX + 2 * (digitWidth + GAP) + colonWidth + GAP),
        Math.round(startX + 3 * (digitWidth + GAP) + colonWidth + GAP)
      ],
      digitsY: Math.round(0.41 * height)
    };
  }

  let positions = settings.positions || {};
  if (!positions.threeDigit || !positions.fourDigit) {
    if (!positions.threeDigit && is12Hour) {
      positions.threeDigit = calcPositions(true);
    }
    if (!positions.fourDigit) {
      positions.fourDigit = calcPositions(false);
    }
    settings.positions = positions;
    require('Storage').writeJSON("tileclk.json", settings);
  }

  if (!positions.secondsX || !positions.secondsY) {
    positions.secondsX = [Math.round(secStartX), Math.round(secStartX + secDigitWidth + GAP)];
    positions.secondsY = Math.round(0.8 * height);
    settings.positions = positions;
    require('Storage').writeJSON("tileclk.json", settings);
  }

  let colorLookup = settings.colorLookup || {};

  function interpColor(c1, c2, fraction) {
    const key = `${c1}_${c2}`;
    if (!colorLookup[key]) precomputeColors(c1, c2);
    return colorLookup[key][Math.round(fraction * FRAC_STEPS)];
  }

  function precomputeColors(c1, c2) {
    const key = `${c1}_${c2}`;
    if (colorLookup[key]) return;

    const r1 = (c1 >> 16) & 0xFF,
      g1 = (c1 >> 8) & 0xFF,
      b1 = c1 & 0xFF;
    const r2 = (c2 >> 16) & 0xFF,
      g2 = (c2 >> 8) & 0xFF,
      b2 = c2 & 0xFF;
    const colors = [];

    for (let i = 0; i <= FRAC_STEPS; i++) {
      const f = i / FRAC_STEPS;
      colors.push(((r1 + (r2 - r1) * f) << 16) | ((g1 + (g2 - g1) * f) << 8) | (b1 + (b2 - b1) * f));
    }
    colorLookup[key] = colors;
    settings.colorLookup = colorLookup;
    require('Storage').writeJSON("tileclk.json", settings);
  }

  let isDrawing = true;
  let isColonDrawn = false;

  function clearTile(x, y, s) {
    g.setColor(g.theme.bg);
    g.fillRect(x, y, x + s - 1, y + s - 1);
  }

  function animateTile(x, y, s, on, callback) {
    let progress = on ? 0 : 1;
    const step = on ? COLOR_INTERP : -COLOR_INTERP;

    function transition() {
      if (!isDrawing) return;
      g.setColor(interpColor(g.theme.bg, g.theme.fg, progress));
      g.fillRect(x, y, x + s - 1, y + s - 1);

      progress += step;
      if (progress >= 0 && progress <= 1) {
        setTimeout(transition, ANIM_DELAY);
      } else {
        if (callback) callback();
      }
    }

    transition();
  }

  function drawDigit(x, y, s, num, prevNum, callback) {
    const currentPattern = digits[num] || Array(5).fill("000");
    const prevPattern = prevNum ? digits[prevNum] : Array(5).fill("000");

    const tiles = [];
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 3; j++) {
        if (currentPattern[i][j] !== prevPattern[i][j]) {
          tiles.push({
            x: x + j * s,
            y: y + i * s,
            state: currentPattern[i][j] === '1'
          });
        }
      }
    }

    function updateTiles() {
      if (!isDrawing || !tiles.length) {
        if (callback) callback();
        return;
      }
      var tile = tiles.shift();
      if (tile.state) {
        animateTile(tile.x, tile.y, s, true);
      } else {
        clearTile(tile.x, tile.y, s);
      }
      setTimeout(updateTiles, ANIM_DELAY);
    }

    updateTiles();
  }

  function drawColon(x, y, callback) {
    if (!isDrawing || isColonDrawn) {
      if (callback) callback();
      return;
    }
    animateTile(x, y + SCALE * 2, SCALE, true, function() {
      animateTile(x, y + SCALE * 4, SCALE, true, function() {
        isColonDrawn = true;
        if (callback) callback();
      });
    });
  }

  let lastTime = "";
  let drawTimeout;
  let isFirstDraw = true;

  function queueDraw() {
    if (drawTimeout) clearTimeout(drawTimeout);
    const now = new Date();
    drawTimeout = setTimeout(updateAndAnimTime, 1000 - now.getMilliseconds());
  }

  function updateAndAnimTime() {
    if (!isDrawing) return;

    const now = new Date();
    const hours = (is12Hour ? now.getHours() % 12 || 12 : now.getHours()).toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    let seconds = now.getSeconds().toString().padStart(2, '0');

    if (isFirstDraw && showSeconds) {
      const nextSecond = (parseInt(seconds) + 1) % 60;
      seconds = nextSecond.toString().padStart(2, '0');
      isFirstDraw = false;
    }

    const currentTime = hours + minutes + seconds;

    function drawSegment(xPos, yPos, s, time, lastTime, callback) {
      drawDigit(xPos[0], yPos, s, time[0], lastTime[0], () => {
        drawDigit(xPos[1], yPos, s, time[1], lastTime[1], callback);
      });
    }

    function finishDrawing() {
      g.flip();
      lastTime = currentTime.slice(0, 4);
      if (showSeconds) updateSeconds(seconds);
      queueDraw();
    }

    function drawTime() {
      const isThreeDigit = is12Hour && hours[0] === '0';
      const pos = isThreeDigit ? positions.threeDigit : positions.fourDigit;
      if (!pos) {
        console.log("Error: positions not properly initialized");
        return;
      }
      const colonPosX = pos.colonX;
      const digitPosX = pos.digitX;
      const yOffset = settings.widgets === "hide" || settings.widgets === "swipe" ? -SCALE : 0;

      if (isThreeDigit) {
        drawDigit(digitPosX[0], pos.digitsY + yOffset, SCALE, hours[1], lastTime[1], () => {
          drawColon(colonPosX, pos.colonY + yOffset, () => {
            drawSegment(digitPosX.slice(1, 3), pos.digitsY + yOffset, SCALE, minutes, lastTime.slice(2, 4), finishDrawing);
          });
        });
      } else {
        drawSegment(digitPosX.slice(0, 2), pos.digitsY + yOffset, SCALE, hours, lastTime.slice(0, 2), () => {
          drawColon(colonPosX, pos.colonY + yOffset, () => {
            drawSegment(digitPosX.slice(2, 4), pos.digitsY + yOffset, SCALE, minutes, lastTime.slice(2, 4), finishDrawing);
          });
        });
      }
    }

    drawTime();
  }

  let lastSeconds = "";
  let isDrawingSeconds = false;

  function updateSeconds(seconds) {
    if (isDrawingSeconds) return;

    isDrawingSeconds = true;

    function updateDigit(index) {
      if (seconds[index] !== lastSeconds[index]) {
        drawSecondDigit(index, seconds[index], lastSeconds[index], () => {
          if (index === 0) {
            updateDigit(1);
          } else {
            lastSeconds = seconds;
            isDrawingSeconds = false;
            g.flip();
          }
        });
      } else if (index === 0) {
        updateDigit(1);
      } else {
        isDrawingSeconds = false;
      }
    }

    updateDigit(0);
  }

  function drawSecondDigit(index, digit, prevDigit, callback) {
    const yOffset = settings.widgets === "hide" || settings.widgets === "swipe" ? -SCALE : 0;
    drawDigit(positions.secondsX[index], positions.secondsY + yOffset, SEC_SCALE, digit, prevDigit, callback);
  }

  function clearSeconds(callback) {
    if (isDrawingSeconds) {
      setTimeout(function() {
        clearSeconds(callback);
      }, 50);
      return;
    }

    isDrawingSeconds = true;
    const yOffset = settings.widgets === "hide" || settings.widgets === "swipe" ? -SCALE : 0;
    drawDigit(positions.secondsX[0], positions.secondsY + yOffset, SEC_SCALE, " ", lastSeconds[0], function() {
      drawDigit(positions.secondsX[1], positions.secondsY + yOffset, SEC_SCALE, " ", lastSeconds[1], function() {
        lastSeconds = "";
        isDrawingSeconds = false;
        if (callback) callback();
      });
    });
  }

  function drawClock() {
    g.clear(Bangle.appRect);
    if (settings.widgets !== "hide") Bangle.drawWidgets();
    lastTime = "";
    isColonDrawn = false;
    isFirstDraw = true;
    updateAndAnimTime();
  }

  Bangle.setUI({
    mode: "clock",
    remove: () => {
      if (drawTimeout) clearTimeout(drawTimeout);
      isDrawing = false;
    }
  });

  Bangle.loadWidgets();
  if (settings.widgets === "hide") require("widget_utils").hide();
  else if (settings.widgets === "swipe") require("widget_utils").swipe();

  Bangle.on('lock', (isLocked) => {
    if (settings.seconds === "dynamic") {
      showSeconds = !isLocked;
      if (isLocked) {
        clearSeconds(() => {
          g.flip();
          updateAndAnimTime();
        });
      } else {
        lastTime = lastTime.slice(0, 4);
        isFirstDraw = true;
        updateAndAnimTime();
      }
    }
  });

  drawClock();
})();