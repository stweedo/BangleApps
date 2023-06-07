// Run this code after a 1ms delay to ensure it's executed after the boot code
setTimeout(() => {
  // Check if the current file is "hypnobeat.app.js"
  const APP = global.__FILE__ === "hypnobeat.app.js";

  // Override the global GB function
  global.GB = ((_GB) => (event) => {
    // Depending on the event type, handle it appropriately
    switch (event.t) {
      case "musicinfo":
      case "musicstate":
        // Pass the event to the app's handler function if running as an app
        return APP ? global.handleGadgetbridgeMessage(event) : undefined;
      default:
        // For other event types, call the original GB function if it exists
        if (_GB) setTimeout(_GB, 0, event);
    }
  })(global.GB);
}, 1);
