(function() {
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
  
    const SCALE = 12;
    const SECONDS_SCALE = 6;
    const FRACTION_STEPS = 5;
    const ANIMATION_DELAY = 25;
    const COLOR_INTERPOLATION_FACTOR = 0.2;
    const GAP = 3;
  
    const screenWidth = g.getWidth();
    const screenHeight = g.getHeight();
    const colorLookup = {};
    let isDrawing = true, isColonDrawn = false;
    const settings = require('Storage').readJSON("tileclk.json", true) || { widgets: "show", seconds: "hide" };
    const showSeconds = settings.seconds === "show";
    const is12Hour = (require('Storage').readJSON("setting.json", true) || {})['12hour'] || false;
  
    const yOffset = settings.widgets === "hide" || settings.widgets === "swipe" ? -SCALE : 0;
  
    const digitWidth = 3 * SCALE;
    const digitHeight = 5 * SCALE;
    const colonWidth = SCALE;
  
    const secondsDigitWidth = 3 * SECONDS_SCALE;
    const totalSecondsWidth = 2 * secondsDigitWidth + GAP;
    const secondsStartX = (screenWidth / 2) - (totalSecondsWidth / 2);
  
    function calculatePositions() {
      const isThreeDigit = is12Hour && (new Date().getHours() % 12 || 12).toString().padStart(2, '0')[0] === '0';
      const totalWidth = isThreeDigit ? 3 * digitWidth + colonWidth + 3 * GAP : 4 * digitWidth + colonWidth + 4 * GAP;
      const startX = (screenWidth - totalWidth) / 2;
  
      return {
        colonX: isThreeDigit ? startX + digitWidth + GAP : startX + 2 * (digitWidth + GAP),
        colonY: 0.35 * screenHeight + yOffset,
        digitX: isThreeDigit ? [
          startX,
          startX + digitWidth + GAP + colonWidth + GAP,
          startX + 2 * (digitWidth + GAP) + colonWidth + GAP
        ] : [
          startX,
          startX + digitWidth + GAP,
          startX + 2 * (digitWidth + GAP) + colonWidth + GAP,
          startX + 3 * (digitWidth + GAP) + colonWidth + GAP
        ],
        digitsY: 0.41 * screenHeight + yOffset,
        secondsX: [secondsStartX, secondsStartX + secondsDigitWidth + GAP],
        secondsY: 0.8 * screenHeight + yOffset
      };
    }
  
    const positions = calculatePositions();
  
    
  
    Bangle.loadWidgets();
    if (settings.widgets === "hide") require("widget_utils").hide();
    else if (settings.widgets === "swipe") require("widget_utils").swipeOn();
  
    function drawDigit(x, y, s, num, prevNum, callback) {
      const currentPattern = digits[num];
      const prevPattern = prevNum ? digits[prevNum] : Array(5).fill("000");
  
      const tiles = [];
      currentPattern.forEach((row, i) => {
        row.split('').forEach((val, j) => {
          if (val !== prevPattern[i][j]) {
            tiles.push({ x: x + j * s, y: y + i * s, state: val === '1' });
          }
        });
      });
  
      (function updateTiles() {
        if (!isDrawing || !tiles.length) return callback && callback();
        const tile = tiles.shift();
        tile.state ? animateTile(tile.x, tile.y, s, true) : clearTile(tile.x, tile.y, s);
        setTimeout(updateTiles, ANIMATION_DELAY);
      })();
    }
  
    function interpolateColor(c1, c2, fraction) {
      const key = `${c1}_${c2}`;
      if (!colorLookup[key]) precomputeColors(c1, c2);
      return colorLookup[key][Math.round(fraction * FRACTION_STEPS)];
    }
  
    function precomputeColors(c1, c2) {
      const key = `${c1}_${c2}`;
      if (colorLookup[key]) return;
  
      const r1 = (c1 >> 16) & 0xFF, g1 = (c1 >> 8) & 0xFF, b1 = c1 & 0xFF;
      const r2 = (c2 >> 16) & 0xFF, g2 = (c2 >> 8) & 0xFF, b2 = c2 & 0xFF;
      const colors = [];
  
      for (let i = 0; i <= FRACTION_STEPS; i++) {
        const fraction = i / FRACTION_STEPS;
        colors.push(((r1 + (r2 - r1) * fraction) << 16) | ((g1 + (g2 - g1) * fraction) << 8) | (b1 + (b2 - b1) * fraction));
      }
      colorLookup[key] = colors;
    }
  
    function clearTile(x, y, s) {
      g.setColor(g.theme.bg);
      g.fillRect(x, y, x + s - 1, y + s - 1);
    }
  
    function animateTile(x, y, s, on, callback) {
      let progress = on ? 0 : 1;
  
      (function transition() {
        if (!isDrawing) return;
        g.setColor(interpolateColor(g.theme.bg, g.theme.fg, progress));
        g.fillRect(x, y, x + s - 1, y + s - 1);
  
        progress += on ? COLOR_INTERPOLATION_FACTOR : -COLOR_INTERPOLATION_FACTOR;
        if (progress >= 0 && progress <= 1) {
          setTimeout(transition, ANIMATION_DELAY);
        } else {
          callback && callback();
        }
      })();
    }
  
    function drawColon(x, y, callback) {
      if (!isDrawing || isColonDrawn) return;
      animateTile(x, y + SCALE * 2, SCALE, true, () => {
        animateTile(x, y + SCALE * 4, SCALE, true, () => {
          isColonDrawn = true;
          callback && callback();
        });
      });
    }
  
    let lastTime = "", drawTimeout;
    function queueDraw() {
      if (drawTimeout) clearTimeout(drawTimeout);
  
      const now = new Date();
      drawTimeout = setTimeout(updateAndAnimateTime, 1000 - now.getMilliseconds());
    }
  
    function updateAndAnimateTime() {
      if (!isDrawing) return;
  
      const now = new Date();
      const hours = (is12Hour ? now.getHours() % 12 || 12 : now.getHours()).toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const currentTime = hours + minutes + (showSeconds ? seconds : "");
  
      function drawSegment(xPos, yPos, s, time, lastTime, callback) {
        drawDigit(xPos[0], yPos, s, time[0], lastTime[0], () => {
          drawDigit(xPos[1], yPos, s, time[1], lastTime[1], callback);
        });
      }
  
      function finishDrawing() {
        g.flip();
        lastTime = currentTime;
        queueDraw();
      }
  
      function drawTime() {
        const positions = calculatePositions();
        const isThreeDigit = is12Hour && hours[0] === '0';
        const colonPosX = positions.colonX;
        const digitPosX = positions.digitX;
  
        if (isThreeDigit) {
          drawDigit(digitPosX[0], positions.digitsY, SCALE, hours[1], lastTime[1], () => {
            if (!isColonDrawn) {
              drawColon(colonPosX, positions.colonY, () => {
                drawSegment(digitPosX.slice(1, 3), positions.digitsY, SCALE, minutes, lastTime.slice(2, 4), () => {
                  if (showSeconds) {
                    drawSegment(positions.secondsX, positions.secondsY, SECONDS_SCALE, seconds, lastTime.slice(4, 6), finishDrawing);
                  } else {
                    finishDrawing();
                  }
                });
              });
            } else {
              drawSegment(digitPosX.slice(1, 3), positions.digitsY, SCALE, minutes, lastTime.slice(2, 4), () => {
                if (showSeconds) {
                  drawSegment(positions.secondsX, positions.secondsY, SECONDS_SCALE, seconds, lastTime.slice(4, 6), finishDrawing);
                } else {
                  finishDrawing();
                }
              });
            }
          });
        } else {
          drawSegment(digitPosX.slice(0, 2), positions.digitsY, SCALE, hours, lastTime.slice(0, 2), () => {
            if (!isColonDrawn) {
              drawColon(positions.colonX, positions.colonY, () => {
                drawSegment(digitPosX.slice(2, 4), positions.digitsY, SCALE, minutes, lastTime.slice(2, 4), () => {
                  if (showSeconds) {
                    drawSegment(positions.secondsX, positions.secondsY, SECONDS_SCALE, seconds, lastTime.slice(4, 6), finishDrawing);
                  } else {
                    finishDrawing();
                  }
                });
              });
            } else {
              drawSegment(digitPosX.slice(2, 4), positions.digitsY, SCALE, minutes, lastTime.slice(2, 4), () => {
                if (showSeconds) {
                  drawSegment(positions.secondsX, positions.secondsY, SECONDS_SCALE, seconds, lastTime.slice(4, 6), finishDrawing);
                } else {
                  finishDrawing();
                }
              });
            }
          });
        }
      }
  
      drawTime();
    }
  
    function drawClock() {
      g.clear(Bangle.appRect);
      if (settings.widgets !== "hide") Bangle.drawWidgets();
      updateAndAnimateTime();
    }
  
    Bangle.setUI({
      mode: "clock",
      remove: () => {
        if (drawTimeout) clearTimeout(drawTimeout);
        isDrawing = false;
      }
    });
  
    drawClock();
  })();
  