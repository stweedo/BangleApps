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

    const scale = 12, secondsScale = 6;
    const screenWidth = g.getWidth(), screenHeight = g.getHeight();
    const colorInterpolationLookup = {};
    let isDrawing = true, isColonDrawn = false;
    const appSettings = require('Storage').readJSON("tileclk.json", true) || { widgets: "show", seconds: "hide" };
    const widgetMode = appSettings.widgets, showSeconds = appSettings.seconds === "show";
    const enable12Hour = (require('Storage').readJSON("setting.json", true) || {})['12hour'] || false;

    // UI positions
    const yOffset = widgetMode === "hide" || widgetMode === "swipe" ? -12 : 0;
    const positions = {
        colonX: 0.47 * screenWidth,
        colonY: 0.35 * screenHeight + yOffset,
        digitXPositions: [0.02 * screenWidth, 0.245 * screenWidth, 0.555 * screenWidth, 0.78 * screenWidth],
        digitsY: 0.41 * screenHeight + yOffset,
        secondsX: 0.75 * screenWidth,
        secondsY: 0.8 * screenHeight + yOffset
    };

    Bangle.loadWidgets();
    if (widgetMode === "hide") require("widget_utils").hide();
    else if (widgetMode === "swipe") require("widget_utils").swipeOn();

    function drawDigit(x, y, s, num, prevNum, callback) {
        const digitPattern = digits[num];
        const prevDigitPattern = prevNum ? digits[prevNum] : Array(digitPattern.length).fill("000");
        const tilesToRedraw = [];

        digitPattern.forEach((row, rowIndex) => {
            row.split('').forEach((digit, colIndex) => {
                if (digit !== prevDigitPattern[rowIndex][colIndex]) {
                    tilesToRedraw.push({ x: x + colIndex * s, y: y + rowIndex * s, state: digit === '1' });
                }
            });
        });

        (function updateTiles() {
            if (!isDrawing) return;
            if (tilesToRedraw.length > 0) {
                let tile = tilesToRedraw.shift();
                if (tile.state) {
                    animateTransition(tile.x, tile.y, s, true);
                } else {
                    clearTile(tile.x, tile.y, s);
                }
                setTimeout(updateTiles, 25);
            } else if (callback) callback();
        })();
    }

    function interpolateColor(color1, color2, fraction) {
        var key = `${color1}_${color2}`;
        if (!colorInterpolationLookup[key]) {
            preComputeIntermediateColors(color1, color2);
        }
        var index = Math.round(fraction * 5);
        return colorInterpolationLookup[key][index];
    }

    function preComputeIntermediateColors(color1, color2) {
        var key = `${color1}_${color2}`;
        if (colorInterpolationLookup.hasOwnProperty(key)) return;

        var r1 = (color1 >> 16) & 0xFF, g1 = (color1 >> 8) & 0xFF, b1 = color1 & 0xFF;
        var r2 = (color2 >> 16) & 0xFF, g2 = (color2 >> 8) & 0xFF, b2 = color2 & 0xFF;
        var colorArray = [];

        for (var step = 0; step <= 5; step++) {
            let fraction = step / 5;
            let r = Math.round(r1 + (r2 - r1) * fraction);
            let g = Math.round(g1 + (g2 - g1) * fraction);
            let b = Math.round(b1 + (b2 - b1) * fraction);
            colorArray.push((r << 16) | (g << 8) | b);
        }
        colorInterpolationLookup[key] = colorArray;
    }

    function clearTile(x, y, s) {
        g.setColor(g.theme.bg);
        g.fillRect(x, y, x + s - 1, y + s - 1);
    }

    function animateTransition(x, y, s, turningOn, callback) {
        let progress = turningOn ? 0 : 1;

        (function transition() {
            if (!isDrawing) return;

            const color = interpolateColor(g.theme.bg, g.theme.fg, progress);
            g.setColor(color);
            g.fillRect(x, y, x + s - 1, y + s - 1);

            progress += turningOn ? 0.2 : -0.2;
            if (0 <= progress && progress <= 1) {
                setTimeout(transition, 25);
            } else if (callback) callback();
        })();
    }

    function drawColon(x, y, callback) {
        if (!isDrawing || isColonDrawn) return;

        animateTransition(x, y + scale * 2, scale, true, () => {
            animateTransition(x, y + scale * 4, scale, true, () => {
                isColonDrawn = true;
                if (callback) callback();
            });
        });
    }

    let lastTime = "";
    let drawTimeout;

    function queueDraw() {
        if (drawTimeout) clearTimeout(drawTimeout);

        let now = new Date();
        let millisecondsToNextSecond = 1000 - now.getMilliseconds();
        drawTimeout = setTimeout(() => {
            drawTimeout = undefined;
            updateAndAnimateTime();
        }, millisecondsToNextSecond);
    }

    function updateAndAnimateTime() {
        if (!isDrawing) return;

        var now = new Date();
        var hours = now.getHours();
        hours = (enable12Hour ? hours % 12 || 12 : hours).toString().padStart(2, '0');
        var minutes = now.getMinutes().toString().padStart(2, '0');
        var seconds = now.getSeconds().toString().padStart(2, '0');
        var currentTime = hours + minutes + (showSeconds ? seconds : "");

        function finishDrawing() {
            g.flip();
            lastTime = currentTime;
            queueDraw();
        }

        function drawTimeSegment(positions, y, scale, timeSegment, lastSegment, callback) {
            drawDigit(positions[0], y, scale, timeSegment[0], lastSegment[0], () => {
                drawDigit(positions[1], y, scale, timeSegment[1], lastSegment[1], callback);
            });
        }

        function continueDrawing() {
            drawTimeSegment(positions.digitXPositions.slice(2, 4), positions.digitsY, scale, minutes, lastTime.slice(2, 4), () => {
                if (showSeconds) {
                    drawTimeSegment([positions.secondsX, positions.secondsX + 4 * secondsScale], positions.secondsY, secondsScale, seconds, lastTime.slice(4, 6), finishDrawing);
                } else {
                    finishDrawing();
                }
            });
        }

        drawTimeSegment(positions.digitXPositions.slice(0, 2), positions.digitsY, scale, hours, lastTime.slice(0, 2), () => {
            if (!isColonDrawn) {
                drawColon(positions.colonX, positions.colonY, continueDrawing);
            } else {
                continueDrawing();
            }
        });
    }

    function drawTime() {
        g.clear(Bangle.appRect);
        if (widgetMode !== "hide") {
            Bangle.drawWidgets();
        }
        updateAndAnimateTime();
    }

    Bangle.setUI({
        mode: "clock",
        remove: function() {
            if (drawTimeout) clearTimeout(drawTimeout);
            isDrawing = false;
        }
    });

    drawTime();
})();
