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

    let scale = 12;
    let secondsScale = 6;
    let screenWidth = g.getWidth();
    let screenHeight = g.getHeight();

    let colorInterpolationLookup = {};
    let isDrawing = true;
    let isColonDrawn = false;

    let appSettings = require('Storage').readJSON("tileclk.json", true) || {
        widgets: "show",
        seconds: "hide"
    };

    let widgetMode = appSettings.widgets;
    let showSeconds = appSettings.seconds === "show";

    let is12Hour = require('Storage').readJSON("setting.json", true) || {};
    let enable12Hour = is12Hour['12hour'] || false;

    // Configure widget display based on settings
    Bangle.loadWidgets();
    if (widgetMode === "hide") {
        require("widget_utils").hide();
    } else if (widgetMode === "swipe") {
        require("widget_utils").swipeOn();
    }

    let drawDigit = function(x, y, s, num, prevNum, callback) {
        let digitPattern = digits[num];
        let prevDigitPattern = prevNum != null ? digits[prevNum] : Array(digitPattern.length).fill("000");
        let tilesToRedraw = [];

        for (let row = 0; row < digitPattern.length; row++) {
            for (let col = 0; col < digitPattern[row].length; col++) {
                if (digitPattern[row][col] !== prevDigitPattern[row][col]) {
                    tilesToRedraw.push({ x: x + col * s, y: y + row * s, state: digitPattern[row][col] === '1' });
                }
            }
        }

        let updateTiles = function() {
            if (!isDrawing) return;

            if (tilesToRedraw.length > 0) {
                let tile = tilesToRedraw.shift();
                if (tile.state) {
                    animateTransition(tile.x, tile.y, s, true);
                } else {
                    clearTile(tile.x, tile.y, s);
                }
                setTimeout(updateTiles, 50);
            } else if (callback) {
                callback();
            }
        };

        updateTiles();
    };

    let preComputeIntermediateColors = function(color1, color2) {
        var key = color1 + "_" + color2;
        if (colorInterpolationLookup.hasOwnProperty(key)) {
            return;
        }

        var r1 = (color1 >> 16) & 0xFF;
        var g1 = (color1 >> 8) & 0xFF;
        var b1 = color1 & 0xFF;

        var r2 = (color2 >> 16) & 0xFF;
        var g2 = (color2 >> 8) & 0xFF;
        var b2 = color2 & 0xFF;

        var colorArray = [];
        for (var step = 0; step <= 10; step++) {
            var fraction = step / 10;
            var r = Math.round(r1 + (r2 - r1) * fraction);
            var g = Math.round(g1 + (g2 - g1) * fraction);
            var b = Math.round(b1 + (b2 - b1) * fraction);

            colorArray.push((r << 16) | (g << 8) | b);
        }

        colorInterpolationLookup[key] = colorArray;
    };

    let interpolateColor = function(color1, color2, fraction) {
        var key = color1 + "_" + color2;
        if (!colorInterpolationLookup[key]) {
            preComputeIntermediateColors(color1, color2);
        }

        var index = Math.min(Math.max(Math.round(fraction * 10), 0), 10);
        return colorInterpolationLookup[key][index];
    };

    let clearTile = function(x, y, s) {
        g.setColor(g.theme.bg);
        g.fillRect(x, y, x + s - 1, y + s - 1);
    };

    let animateTransition = function(x, y, s, turningOn) {
        let progress = 0;
        let transitionDirection = turningOn ? 1 : -1;

        let transition = function() {
            if (!isDrawing) return;

            let color = interpolateColor(g.theme.bg, g.theme.fg, progress);
            g.setColor(color);
            g.fillRect(x, y, x + s - 1, y + s - 1);

            progress += 0.2 * transitionDirection;
            if (0 <= progress && progress <= 1) {
                setTimeout(transition, 25);
            }
        };

        transition();
    };

    let drawColon = function(x, y, callback) {
        if (!isDrawing || isColonDrawn) return;

        g.fillRect(x, y + scale * 2, x + scale - 1, y + 3 * scale - 1);
        g.fillRect(x, y + scale * 4, x + scale - 1, y + 5 * scale - 1);
        isColonDrawn = true;

        if (callback) callback();
    };

    let sequenceTasks = function(tasks) {
        let result = Promise.resolve();
        tasks.forEach(function(task) {
            result = result.then(function() {
                return new Promise(task);
            });
        });
        return result;
    };

    let lastTime = "";
    let drawTimeout;

    let queueDraw = function() {
        if (drawTimeout) clearTimeout(drawTimeout);

        let now = new Date();
        // Calculate the milliseconds until the next second
        let millisecondsToNextSecond = 1000 - now.getMilliseconds();

        drawTimeout = setTimeout(function() {
            drawTimeout = undefined;
            updateAndAnimateTime();
        }, millisecondsToNextSecond);
    };

    let updateAndAnimateTime = function() {
        if (!isDrawing) return;

        let now = new Date();
        let hours = now.getHours();
        if (enable12Hour) {
            hours = hours % 12 || 12;
        }
        hours = ("0" + hours).substr(-2);
        let minutes = ("0" + now.getMinutes()).substr(-2);
        let seconds = ("0" + now.getSeconds()).substr(-2);

        let currentTime = hours + minutes + (showSeconds ? seconds : "");

        let yOffset = (widgetMode === "hide" || widgetMode === "swipe") ? -12 : 0;
        let colonX = 0.47 * screenWidth;
        let colonY = 0.35 * screenHeight + yOffset;
        let digit1X = 0.02 * screenWidth;
        let digit2X = 0.245 * screenWidth;
        let digit3X = 0.555 * screenWidth;
        let digit4X = 0.78 * screenWidth;
        let digitsY = 0.41 * screenHeight + yOffset;
        let secondsX = 0.75 * screenWidth;
        let secondsY = 0.8 * screenHeight + yOffset;

        function finishDrawing() {
            g.flip();
            lastTime = currentTime;
            queueDraw();
        }

        function continueDrawing() {
            drawDigit(digit3X, digitsY, scale, minutes[0], lastTime[2], function() {
                drawDigit(digit4X, digitsY, scale, minutes[1], lastTime[3], function() {
                    if (showSeconds) {
                        drawDigit(secondsX, secondsY, secondsScale, seconds[0], lastTime[4], function() {
                            drawDigit(secondsX + 4 * secondsScale, secondsY, secondsScale, seconds[1], lastTime[5], function() {
                                finishDrawing();
                            });
                        });
                    } else {
                        finishDrawing();
                    }
                });
            });
        }

        drawDigit(digit1X, digitsY, scale, hours[0], lastTime[0], function() {
            drawDigit(digit2X, digitsY, scale, hours[1], lastTime[1], function() {
                if (!isColonDrawn) {
                    drawColon(colonX, colonY, function() {
                        continueDrawing();
                    });
                } else {
                    continueDrawing();
                }
            });
        });
    };

    let drawTime = function() {
        g.clear(Bangle.appRect);
        // Update to draw widgets based on settings
        if (widgetMode !== "hide") {
            Bangle.drawWidgets();
        }
        updateAndAnimateTime();
    };

    Bangle.setUI({
        mode: "clock",
        remove: function() {
            if (drawTimeout) clearTimeout(drawTimeout);
            isDrawing = false;
        }
    });

    drawTime();
})();