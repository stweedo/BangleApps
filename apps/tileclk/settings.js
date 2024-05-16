(function (back) {
  // Load and set default settings
  let appSettings = Object.assign({
    widgets: 'show',
    seconds: 'hide'
  }, require('Storage').readJSON("tileclk.json", true) || {});

  // Save settings to storage
  function writeSettings() {
    require('Storage').writeJSON("tileclk.json", appSettings);
  }

  function showMenu() {
    E.showMenu({
      "": {
        "title": "Tile Clock"
      },
      "< Back": () => back(),
      'Widgets:': {
        value: appSettings.widgets === 'show' ? 0 : appSettings.widgets === 'hide' ? 1 : 2,
        min: 0,
        max: 2,
        onchange: v => {
          appSettings.widgets = ['show', 'hide', 'swipe'][v];
          writeSettings();
        },
        format: v => ['Show', 'Hide', 'Swipe'][v]
      },
      'Seconds:': {
        value: appSettings.seconds === 'show' ? 0 : appSettings.seconds === 'hide' ? 1 : 2,
        min: 0,
        max: 2,
        onchange: v => {
          appSettings.seconds = ['show', 'hide', 'dynamic'][v];
          writeSettings();
        },
        format: v => ['Show', 'Hide', 'Dynamic'][v]
      }
    });
  }

  // Initially show the menu
  showMenu();
});
