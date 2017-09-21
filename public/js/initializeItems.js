function itemsInit () {
  function iconInit () {
    APP.createIconRenderer()
    APP.createScene()
    APP.createIconMesh()
    APP.createLights()
    APP.randomizeColor()
    APP.generate()
  }

  function patternInit () {
    APP.createPatternRenderer()
    APP.createScene()
    APP.createPatternMesh()
    APP.addLights()
    APP.randomizeColor()
    APP.animate()
  }

  patternInit()
  iconInit()
};
