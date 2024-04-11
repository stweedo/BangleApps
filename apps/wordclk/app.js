let customFont = Graphics.prototype.setFontIndieFlower = function() {
  // Actual height 42 (41 - 0)
  return this.setFontCustom(
    E.toString(require('heatshrink').decompress(atob('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'))),
    32,
    atob("EAYKIBgbEwQSDBETBRAJDRINFRIRGBIREA0EBRQWEQsiGB8WHxYWGBYHEhQPFhoaGhsYGhgYEh4WERgUEhIQHAcVFRMWFhAPEgcIEQUgExQWEQ8WDhUQHBMUExEGEhEV"),
    42|65536
  );
};

let w = g.getWidth();
let h = g.getHeight();

function numberToWords(number, isMinute) {
    const smallNumbers = ["o'", /*LANG*/"One", /*LANG*/"Two", /*LANG*/"Three", /*LANG*/"Four", /*LANG*/"Five", /*LANG*/"Six", /*LANG*/"Seven", /*LANG*/"Eight", /*LANG*/"Nine", /*LANG*/"Ten", 
                          /*LANG*/"Eleven", /*LANG*/"Twelve", /*LANG*/"Thirteen", /*LANG*/"Fourteen", /*LANG*/"Fifteen", /*LANG*/"Sixteen", /*LANG*/"Seventeen", /*LANG*/"Eighteen", 
                          /*LANG*/"Nineteen"];
    const tens = ["", "", /*LANG*/"Twenty", /*LANG*/"Thirty", /*LANG*/"Forty", /*LANG*/"Fifty"];

    if (isMinute) {
        if (number === 0) return smallNumbers[0]; // "O" for zero minutes
        if (number < 10) return smallNumbers[0] + " " + smallNumbers[number]; // "O" plus the number for single digit minutes
    }

    if (number < 20) return smallNumbers[number];
    if (number % 10 === 0) return tens[Math.floor(number / 10)];
    // Remove the hyphen between the tens and ones
    return tens[Math.floor(number / 10)] + " " + smallNumbers[number % 10];
}

function timeToWords(hours, minutes) {
    let words = numberToWords(hours % 12 === 0 ? 12 : hours % 12);

    if (minutes > 0) {
        words += " " + numberToWords(minutes, true);
    }

    return words;
}

function drawTime() {
    // Clear the screen
    g.clear();
    // Set the font
    g.setFontIndieFlower();

    // Get the current time
    let now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();

    // Convert the time to words
    let timeInWords = timeToWords(hours, minutes);

    // Calculate text height for each line
    const lineHeight = g.getFontHeight();

    // Function to calculate the height of the text block
    function calculateTextHeight(words) {
        let lines = 1;
        let line = "";

        for (let word of words) {
            let testLine = line + word + " ";
            if (g.stringWidth(testLine) > w && line) {
                lines++;
                line = word + " ";
            } else {
                line = testLine;
            }
        }

        return lines * lineHeight;
    }

    // Split the text into words for line breaking
    let words = timeInWords.split(" ");

    // Calculate total text height
    let totalTextHeight = calculateTextHeight(words);

    // Calculate starting y position for vertical centering
    let y = (h - totalTextHeight) / 2;

    // Function to draw a line of text and update the y coordinate
    function drawLine(line) {
        let textWidth = g.stringWidth(line);
        let startX = (w - textWidth) / 2;
        g.drawString(line, startX, y);
        y += lineHeight;
    }

    let line = "";

    for (let word of words) {
        let testLine = line + word + " ";
        if (g.stringWidth(testLine) > w && line) {
            drawLine(line.trim());
            line = word + " ";
        } else {
            line = testLine;
        }
    }

    // Draw the last line if it's not empty
    if (line.trim()) {
        drawLine(line.trim());
    }
    // Schedule the next update
    scheduleNextUpdate();
}

function scheduleNextUpdate() {
    let now = new Date();
    let millisTillNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    setTimeout(drawTime, millisTillNextMinute);
}

// Initial draw
drawTime();

// Schedule the first update
scheduleNextUpdate();