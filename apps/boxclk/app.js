{
  /**
  * ---------------------------------------------------------------
  * 1. Module dependencies and initial configurations
  * ---------------------------------------------------------------
  */

  let storage = require("Storage");
  let locale = require("locale");
  let widgets = require("widget_utils");
  let date = new Date();
  let bgBuffer; // The offscreen buffer for the background
  let hasBgBuffer = false; // Flag to check if the offscreen buffer has been created
  let configNumber = (storage.readJSON("boxclk.json", 1) || {}).selectedConfig || 0;
  let fileName = 'boxclk' + (configNumber > 0 ? `-${configNumber}` : '') + '.json';
  // Add a condition to check if the file exists, if it does not, default to 'boxclk.json'
  if (!storage.read(fileName)) {
    fileName = 'boxclk.json';
  }
  let boxesConfig = storage.readJSON(fileName, 1) || {};
  let boxes = {};
  let boxPos = {};
  let isDragging = {};
  let wasDragging = {};
  let doubleTapTimer = null;
  let g_setColor;

  let saveIcon = require("heatshrink").decompress(atob("mEwwkEogA/AHdP/4AK+gWVDBQWNAAIuVGBAIB+UQdhMfGBAHBCxUAgIXHIwPyCxQwEJAgXB+MAl/zBwQGBn8ggQjBGAQXG+EA/4XI/8gBIQXTGAMPC6n/C6HzkREBC6YACC6QAFC57aHCYIXOOgLsEn4XPABIX/C6vykQAEl6/WgCQBC5imFAAT2BC5gCBI4oUCC5x0IC/4X/C4K8Bl4XJ+TCCC4wKBABkvC4tEEoMQCxcBB4IWEC4XyDBUBFwIXGJAIAOIwowDABoWGGB4uHDBwWJAH4AzA"));

  /**
  * ---------------------------------------------------------------
  * 2. Graphical and visual configurations
  * ---------------------------------------------------------------
  */

  let w = g.getWidth();
  let h = g.getHeight();
  let totalWidth, totalHeight;
  let drawTimeout;

  const createBgBuffer = () => {
    let bgImage;
    // Check if the 'bg' key exists in boxesConfig and it has a valid 'img' property
    if (boxesConfig.bg && boxesConfig.bg.img) {
      // Load the image using the require("Storage").read function
      bgImage = require("Storage").read(boxesConfig.bg.img);
    }
  
    // Create the buffer with the dimensions of the screen
    bgBuffer = Graphics.createArrayBuffer(g.getWidth(), g.getHeight(), 8);
  
    if (bgImage) {
      // Draw the image to the buffer if it exists
      bgBuffer.drawImage(bgImage, 0, 0);
    } else {
      // Clear the buffer to ensure it is blank if the background image is not found or there is no configuration
      bgBuffer.clear();
    }
  
    hasBgBuffer = true;
  };    

  /**
  * ---------------------------------------------------------------
  * 3. Touchscreen Handlers
  * ---------------------------------------------------------------
  */

  let touchHandler;
  let dragHandler;

  /**
  * ---------------------------------------------------------------
  * 4. Font loading function
  * ---------------------------------------------------------------
  */

  let loadCustomFont = function() {
    Graphics.prototype.setFontBrunoAce = function() {
      // Actual height 23 (22 - 0)
      return this.setFontCustom(
        E.toString(require('heatshrink').decompress(atob('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'))),
        32,
        atob("CQYIEQwTEwUHBw0OBhAGDBUHERETERIRExIGBgwQDBIQFhYUFhQTFBUGFBUSGRYWFRYWFBMVFBgTFhUIDAgMDwUSERAREQ8REgYGEAcWEhIREQ4QDhIRFhESEQkGCQ8M"),
        23|65536
      );
    };
  };

  /**
  * ---------------------------------------------------------------
  * 5. Initial settings of boxes and their positions
  * ---------------------------------------------------------------
  */

  for (let key in boxesConfig) {
    if (key !== 'selectedConfig' && key !== 'bg') {
      boxes[key] = Object.assign({}, boxesConfig[key]);
    }
  }

  let boxKeys = Object.keys(boxes);

  boxKeys.forEach((key) => {
    let boxConfig = boxes[key];
    boxPos[key] = {
      x: w * boxConfig.boxPos.x,
      y: h * boxConfig.boxPos.y
    };
    isDragging[key] = false;
    wasDragging[key] = false;
  });

  /**
  * ---------------------------------------------------------------
  * 6. Text and drawing functions
  * ---------------------------------------------------------------
  */

  // Overwrite the setColor function to allow the
  // use of (x) in g.theme.x as a string
  // in your JSON config ("fg", "bg", "fg2", "bg2", "fgH", "bgH")
  let modSetColor = function() {
    // Save the original setColor function
    g_setColor = g.setColor;
    // Overwrite setColor with the new function
    g.setColor = function(color) {
      if (typeof color === "string" && color in g.theme) {
        g_setColor.call(g, g.theme[color]);
      } else {
        g_setColor.call(g, color);
      }
    };
  };

  let restoreSetColor = function() {
    // Restore the original setColor function
    if (g_setColor) {
      g.setColor = g_setColor;
    }
  };

  // Overwrite the drawString function
  let g_drawString = g.drawString;
  g.drawString = function(box, str, x, y) {
    outlineText(box, str, x, y);
    g.setColor(box.color);
    g_drawString.call(g, str, x, y);
  };

  let outlineText = function(box, str, x, y) {
    let px = box.outline;
    let dx = [-px, 0, px, -px, px, -px, 0, px];
    let dy = [-px, -px, -px, 0, 0, px, px, px];
    g.setColor(box.outlineColor);
    for (let i = 0; i < dx.length; i++) {
      g_drawString.call(g, str, x + dx[i], y + dy[i]);
    }
  };

  let calcBoxSize = function(boxItem) {
    g.reset();
    g.setFontAlign(0,0);
    g.setFont(boxItem.font, boxItem.fontSize);
    let strWidth = g.stringWidth(boxItem.string) + 2 * boxItem.outline;
    let fontHeight = g.getFontHeight() + 2 * boxItem.outline;
    totalWidth = strWidth + 2 * boxItem.xPadding;
    totalHeight = fontHeight + 2 * boxItem.yPadding;
  };

  let calcBoxPos = function(boxKey) {
    return {
      x1: boxPos[boxKey].x - totalWidth / 2,
      y1: boxPos[boxKey].y - totalHeight / 2,
      x2: boxPos[boxKey].x + totalWidth / 2,
      y2: boxPos[boxKey].y + totalHeight / 2
    };
  };

  let displaySaveIcon = function() {
    draw(boxes);
    g.drawImage(saveIcon, w / 2 - 24, h / 2 - 24);
    // Display save icon for 2 seconds
    setTimeout(() => {
      g.clearRect(w / 2 - 24, h / 2 - 24, w / 2 + 24, h / 2 + 24);
      draw(boxes);
    }, 2000);
  };

  /**
  * ---------------------------------------------------------------
  * 7. String forming helper functions
  * ---------------------------------------------------------------
  */

  let isBool = function(val, defaultVal) {
    return typeof val !== 'undefined' ? Boolean(val) : defaultVal;
  };

  let getDate = function(short, shortMonth, disableSuffix) {
    const date = new Date();
    const dayOfMonth = date.getDate();
    const month = shortMonth ? locale.month(date, 1) : locale.month(date, 0);
    const year = date.getFullYear();
    let suffix;
    if ([1, 21, 31].includes(dayOfMonth)) {
      suffix = "st";
    } else if ([2, 22].includes(dayOfMonth)) {
      suffix = "nd";
    } else if ([3, 23].includes(dayOfMonth)) {
      suffix = "rd";
    } else {
      suffix = "th";
    }
    let dateString = disableSuffix ? dayOfMonth : dayOfMonth + suffix;
    return month + " " + dateString + (short ? '' : (", " + year)); // not including year for short version
  };

  let getDayOfWeek = function(date, short) {
    return locale.dow(date, short ? 1 : 0);
  };

  locale.meridian = function(date, short) {
    let hours = date.getHours();
    let meridian = hours >= 12 ? 'PM' : 'AM';
    return short ? meridian[0] : meridian;
  };

  let modString = function(boxItem, data) {
    let prefix = boxItem.prefix || '';
    let suffix = boxItem.suffix || '';
    return prefix + data + suffix;
  };

  /**
  * ---------------------------------------------------------------
  * 8. Main draw function
  * ---------------------------------------------------------------
  */

  let draw = (function() {
    let updatePerMinute = true; // variable to track the state of time display

    return function(boxes) {
      date = new Date();
      g.clear();
      if (hasBgBuffer) {
        g.drawImage({width: bgBuffer.getWidth(), height: bgBuffer.getHeight(), bpp: bgBuffer.getBPP(), buffer: bgBuffer.buffer}, 0, 0);
      } else if (bgImage) {
        g.drawImage(E.toArrayBuffer(bgImage), 0, 0);
      }
      if (boxes.time) {
        boxes.time.string = modString(boxes.time, locale.time(date, isBool(boxes.time.short, true) ? 1 : 0));
        updatePerMinute = isBool(boxes.time.short, true);
      }
      if (boxes.meridian) {
        boxes.meridian.string = modString(boxes.meridian, locale.meridian(date, isBool(boxes.meridian.short, true)));
      }
      if (boxes.date) {
        boxes.date.string = (
          modString(boxes.date,
          getDate(isBool(boxes.date.short, true),
          isBool(boxes.date.shortMonth, true),
          isBool(boxes.date.disableSuffix, false)
        )));
      }
      if (boxes.dow) {
        boxes.dow.string = modString(boxes.dow, getDayOfWeek(date, isBool(boxes.dow.short, true)));
      }
      if (boxes.batt) {
        boxes.batt.string = modString(boxes.batt, E.getBattery());
      }
      if (boxes.step) {
        boxes.step.string = modString(boxes.step, Bangle.getHealthStatus("day").steps);
      }
      boxKeys.forEach((boxKey) => {
        let boxItem = boxes[boxKey];
        calcBoxSize(boxItem);
        const pos = calcBoxPos(boxKey);
        if (isDragging[boxKey]) {
          g.setColor(boxItem.border);
          g.drawRect(pos.x1, pos.y1, pos.x2, pos.y2);
        }
        g.drawString(
          boxItem,
          boxItem.string,
          boxPos[boxKey].x +  boxItem.xOffset,
          boxPos[boxKey].y +  boxItem.yOffset
        );
      });
      if (!Object.values(isDragging).some(Boolean)) {
        if (drawTimeout) clearTimeout(drawTimeout);
        let interval = updatePerMinute ? 60000 - (Date.now() % 60000) : 1000;
        drawTimeout = setTimeout(() => draw(boxes), interval);
      }
    };
  })();

  /**
  * ---------------------------------------------------------------
  * 9. Helper function for touch event
  * ---------------------------------------------------------------
  */

  let touchInBox = function(e, boxItem, boxKey) {
    calcBoxSize(boxItem);
    const pos = calcBoxPos(boxKey);
    return e.x >= pos.x1 &&
          e.x <= pos.x2 &&
          e.y >= pos.y1 &&
          e.y <= pos.y2;
  };

  let deselectAllBoxes = function() {
    Object.keys(isDragging).forEach((boxKey) => {
      isDragging[boxKey] = false;
    });
    restoreSetColor();
    widgets.show();
    widgets.swipeOn();
    modSetColor();
  };

  /**
  * ---------------------------------------------------------------
  * 10. Setup function to configure event handlers
  * ---------------------------------------------------------------
  */

  let setup = function() {
    // ------------------------------------
    // Define the touchHandler function
    // ------------------------------------
    touchHandler = function(zone, e) {
      wasDragging = Object.assign({}, isDragging);
      let boxTouched = false;
      boxKeys.forEach((boxKey) => {
        if (touchInBox(e, boxes[boxKey], boxKey)) {
          isDragging[boxKey] = true;
          wasDragging[boxKey] = true;
          boxTouched = true;
        }
      });
      if (!boxTouched) {
        if (!Object.values(isDragging).some(Boolean)) { // check if no boxes are being dragged
          deselectAllBoxes();
          if (doubleTapTimer) {
            clearTimeout(doubleTapTimer);
            doubleTapTimer = null;
            // Save boxesConfig on double tap outside of any box and when no boxes are being dragged
            Object.keys(boxPos).forEach((boxKey) => {
              boxesConfig[boxKey].boxPos.x = (boxPos[boxKey].x / w).toFixed(3);
              boxesConfig[boxKey].boxPos.y = (boxPos[boxKey].y / h).toFixed(3);
            });
            storage.write(fileName, JSON.stringify(boxesConfig));
            displaySaveIcon();
            return;
          }
        } else {
          // if any box is being dragged, just deselect all without saving
          deselectAllBoxes();
        }
      }
      if (Object.values(wasDragging).some(Boolean) || !boxTouched) {
        draw(boxes);
      }
      doubleTapTimer = setTimeout(() => {
        doubleTapTimer = null;
      }, 250); // Increase or decrease this value based on the desired double tap timing
    };

    // ------------------------------------
    // Define the dragHandler function
    // ------------------------------------
    dragHandler = function(e) {
      // Check if any box is being dragged
      if (!Object.values(isDragging).some(Boolean)) return;
      boxKeys.forEach((boxKey) => {
        if (isDragging[boxKey]) {
          widgets.hide();
          let boxItem = boxes[boxKey];
          calcBoxSize(boxItem);
          let newX = boxPos[boxKey].x + e.dx;
          let newY = boxPos[boxKey].y + e.dy;
          if (newX - totalWidth / 2 >= 0 &&
              newX + totalWidth / 2 <= w &&
              newY - totalHeight / 2 >= 0 &&
              newY + totalHeight / 2 <= h ) {
            boxPos[boxKey].x = newX;
            boxPos[boxKey].y = newY;
          }
          const pos = calcBoxPos(boxKey);
          g.clearRect(pos.x1, pos.y1, pos.x2, pos.y2);
        }
      });
      draw(boxes);
    };

    Bangle.on('touch', touchHandler);
    Bangle.on('drag', dragHandler);

    Bangle.setUI({
      mode : "clock",
      remove : function() {
        // Remove event handlers, stop draw timer, remove custom font if used
        Bangle.removeListener('touch', touchHandler);
        Bangle.removeListener('drag', dragHandler);
        if (drawTimeout) clearTimeout(drawTimeout);
        drawTimeout = undefined;
        delete Graphics.prototype.setFontBrunoAce;
        // Restore original drawString function (no outlines)
        g.drawString = g_drawString;
        restoreSetColor();
        widgets.show();
      }
    });
    loadCustomFont();
    draw(boxes);
  };

  /**
  * ---------------------------------------------------------------
  * 11. Main execution part
  * ---------------------------------------------------------------
  */

  Bangle.loadWidgets();
  widgets.swipeOn();
  modSetColor();
  createBgBuffer(); // Create the background buffer
  setup();
}