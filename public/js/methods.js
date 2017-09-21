(function (exports) {
  function getRandomColor () {
    var randomColor = '#' + (Math.random().toString(16) + '000000').slice(2, 8)
    return randomColor
  }

  // ------------------------------
  // Global Properties
  // ------------------------------
  var now, start = Date.now()
  var center = FSS.Vector3.create()
  var attractor = FSS.Vector3.create()
  var iconContainer = document.getElementById('iconContainer')
  var iconOutput = document.getElementById('iconOutput')
  var patternContainer = document.getElementById('patternContainer')
  var patternOutput = document.getElementById('patternOutput')
  var diffuseLight = getRandomColor()
  var ambientLight = getRandomColor()
  var renderer, scene, mesh, geometry, material
  var SVG = 'svg'

  // ------------------------------
  // Mesh Properties
  // ------------------------------
  var MESH = {
    width: 0.6,
    height: 0.6,
    xRange: 0.8,
    ambient: '#555555',
    diffuse: '#FFFFFF',
    speed: 0.002,
    depth: 0,
    maxdepth: 200
  }

  // ------------------------------
  // Light Properties
  // ------------------------------
  var LIGHT = {
    count: 2,
    xyScalar: 1,
    zOffset: 100,
    ambient: '#880066',
    diffuse: '#FF8800',
    speed: 0.0002,
    gravity: 500,
    dampening: 0.95,
    minDistance: 20,
    maxDistance: 400,
    autopilot: true,
    draw: false,
    bounds: FSS.Vector3.create(),
    step: FSS.Vector3.create(
      Math.randomInRange(0.2, 1.0),
      Math.randomInRange(0.2, 1.0),
      Math.randomInRange(0.2, 1.0)
    ),
    randomize: function () {
      var x, y, z
      var decider = Math.floor(Math.random() * 3) + 1

      if (decider == 1) MESH.depth = 0
      if (decider == 2) MESH.depth = Math.randomInRange(0, 150)
      if (decider == 3) MESH.depth = Math.randomInRange(150, 200)

      for (l = scene.lights.length - 1; l >= 0; l--) {
        x = Math.randomInRange(-mesh.geometry.width / 2, mesh.geometry.width / 2)
        y = Math.randomInRange(-mesh.geometry.height / 2, mesh.geometry.height / 2)
        if (scene.lights.length > 2) z = Math.randomInRange(10, 80)
        else z = Math.randomInRange(10, 100)

        light = scene.lights[l]
        FSS.Vector3.set(light.position, x, y, z)

        var diffuse = diffuseLight
        var ambient = ambientLight

        light.diffuse.set(diffuse)
        light.diffuseHex = light.diffuse.format()

        light.ambient.set(ambient)
        light.ambientHex = light.ambient.format()

        LIGHT.xPos = x
        LIGHT.yPos = y
        LIGHT.zOffset = z
        LIGHT.diffuse = diffuse
        LIGHT.ambient = ambient
      }
    }
  }

  function createIconRenderer () {
    svgRenderer = new FSS.SVGRenderer()
    setIconRenderer(SVG)
  }

  function createPatternRenderer () {
    svgRenderer = new FSS.SVGRenderer()
    setPatternRenderer(SVG)
  }

  function setIconRenderer (index) {
    switch (index) {
      case SVG:
        renderer = svgRenderer
        break
    }
    renderer.setSize(iconContainer.offsetWidth, iconContainer.offsetHeight)
    iconOutput.appendChild(renderer.element)
  }

  function setPatternRenderer (index) {
    switch (index) {
      case SVG:
        renderer = svgRenderer
        break
    }
    renderer.setSize(patternContainer.offsetWidth, patternContainer.offsetHeight)
    patternOutput.appendChild(renderer.element)
  }

  function createIconMesh () {
    scene.remove(mesh)
    renderer.clear()
    geometry = new FSS.iconPlane(MESH.width * renderer.width, MESH.height * renderer.height, MESH.slices)
    material = new FSS.Material(MESH.ambient, MESH.diffuse)
    mesh = new FSS.Mesh(geometry, material)
    scene.add(mesh)

    // Augment vertices for animation
    var v, vertex
    for (v = geometry.vertices.length - 1; v >= 0; v--) {
      vertex = geometry.vertices[v]
      vertex.anchor = FSS.Vector3.clone(vertex.position)
      vertex.step = FSS.Vector3.clone(vertex.position)
      vertex.time = Math.randomInRange(0, Math.PIM2)
    }
  }

  function createPatternMesh () {
    scene.remove(mesh)
    renderer.clear()
    geometry = new FSS.Plane(1000, 768, 80)
    material = new FSS.Material(MESH.ambient, MESH.diffuse)
    mesh = new FSS.Mesh(geometry, material)
    scene.add(mesh)

    var v, vertex
    for (v = geometry.vertices.length - 1; v >= 0; v--) {
      vertex = geometry.vertices[v]
      vertex.anchor = FSS.Vector3.clone(vertex.position)
      vertex.step = FSS.Vector3.clone(vertex.position)
      vertex.time = Math.randomInRange(0, Math.PIM2)
    }
  }

  // Add a single light
  function addLight (ambient, diffuse, x, y, z) {
    ambient = typeof ambient !== 'undefined' ? ambient : ambientLight
    diffuse = typeof diffuse !== 'undefined' ? diffuse : diffuseLight
    x = typeof x !== 'undefined' ? x : LIGHT.xPos
    y = typeof y !== 'undefined' ? y : LIGHT.yPos
    z = typeof z !== 'undefined' ? z : LIGHT.zOffset

    renderer.clear()
    light = new FSS.Light(ambient, diffuse)
    light.ambientHex = light.ambient.format()
    light.diffuseHex = light.diffuse.format()
    light.setPosition(x, y, z)
    scene.add(light)
    LIGHT.diffuse = diffuse
    LIGHT.proxy = light
    LIGHT.pickedup = true
    LIGHT.currIndex++
  }

  function addLights () {
    var num = Math.floor(Math.random() * 4) + 1

    for (var i = num - 1; i >= 0; i--) {
      addLight()
      LIGHT.count++
    };
  }

  function createLights () {
    var l, light
    for (l = scene.lights.length - 1; l >= 0; l--) {
      light = scene.lights[l]
      scene.remove(light)
    }
    renderer.clear()
    for (l = 0; l < 2; l++) {
      light = new FSS.Light(ambientLight, diffuseLight)
      light.ambientHex = light.ambient.format()
      light.diffuseHex = light.diffuse.format()
      scene.add(light)

      // Augment light for animation
      light.mass = Math.randomInRange(0.5, 1)
      light.velocity = FSS.Vector3.create()
      light.acceleration = FSS.Vector3.create()
      light.force = FSS.Vector3.create()
    }
  }

  // Add a single light
  function addLight (ambient, diffuse, x, y, z) {
    ambient = typeof ambient !== 'undefined' ? ambient : ambientLight
    diffuse = typeof diffuse !== 'undefined' ? diffuse : diffuseLight
    x = typeof x !== 'undefined' ? x : LIGHT.xPos
    y = typeof y !== 'undefined' ? y : LIGHT.yPos
    z = typeof z !== 'undefined' ? z : LIGHT.zOffset

    renderer.clear()
    light = new FSS.Light(ambient, diffuse)
    light.ambientHex = light.ambient.format()
    light.diffuseHex = light.diffuse.format()
    light.setPosition(x, y, z)
    scene.add(light)
    LIGHT.diffuse = diffuse
    LIGHT.proxy = light
    LIGHT.pickedup = true
    LIGHT.currIndex++
  }

  function addLights () {
    var num = Math.floor(Math.random() * 4) + 1

    for (var i = num - 1; i >= 0; i--) {
      addLight()
      LIGHT.count++
    };
  }

  // randomize light position
  function randomizeColor () {
    var x, y, z
    var decider = Math.floor(Math.random() * 2) + 1

    if (decider == 1) MESH.depth = 0
    if (decider == 2) MESH.depth = Math.randomInRange(0, 150)
    if (decider == 3) MESH.depth = Math.randomInRange(150, 200)

    for (l = scene.lights.length - 1; l >= 0; l--) {
      x = Math.randomInRange(-mesh.geometry.width / 2, mesh.geometry.width / 2)
      y = Math.randomInRange(-mesh.geometry.height / 2, mesh.geometry.height / 2)
      if (scene.lights.length > 2) z = Math.randomInRange(10, 80)
      else z = Math.randomInRange(10, 100)

      light = scene.lights[l]
      FSS.Vector3.set(light.position, x, y, z)

      var diffuse = diffuseLight
      var ambient = ambientLight

      light.diffuse.set(LIGHT.diffuse)
      light.diffuseHex = light.diffuse.format()

      light.ambient.set(ambientLight)
      light.ambientHex = light.ambient.format()

      LIGHT.xPos = x
      LIGHT.yPos = y
      LIGHT.zOffset = z
      LIGHT.diffuse = diffuse
      LIGHT.ambient = ambient
    }
  }

  function resize (width, height) {
    renderer.setSize(width, height)
    FSS.Vector3.set(center, renderer.halfWidth, renderer.halfHeight)
    createPatternMesh()
    createIconMesh()
  }

  function createScene () {
    scene = new FSS.Scene()
  }

  function generate () {
    now = Date.now() - start
    updateIcon()
    render()
  }

  function updateIcon () {
    var ox, oy, oz, l, light, v, vertex, offset = MESH.depth / 2

    // Update Bounds
    FSS.Vector3.copy(LIGHT.bounds, center)
    FSS.Vector3.multiplyScalar(LIGHT.bounds, LIGHT.xyScalar)

    // Update Attractor
    FSS.Vector3.setZ(attractor, LIGHT.zOffset)

    // Overwrite the Attractor position
    if (LIGHT.autopilot) {
      ox = Math.sin(LIGHT.step[0] * now * LIGHT.speed)
      FSS.Vector3.set(attractor,
                      LIGHT.bounds[0] * ox,
                      LIGHT.zOffset)
    }

    // Animate Lights
    for (l = scene.lights.length - 1; l >= 0; l--) {
      light = scene.lights[l]

      // Reset the z position of the light
      FSS.Vector3.setZ(light.position, LIGHT.zOffset)

      // Calculate the force Luke!
      var D = Math.clamp(FSS.Vector3.distanceSquared(light.position, attractor), LIGHT.minDistance, LIGHT.maxDistance)
      var F = LIGHT.gravity * light.mass / D
      FSS.Vector3.subtractVectors(light.force, attractor, light.position)
      FSS.Vector3.normalise(light.force)
      FSS.Vector3.multiplyScalar(light.force, F)

      // Update the light position
      FSS.Vector3.set(light.acceleration)
      FSS.Vector3.add(light.acceleration, light.force)
      FSS.Vector3.add(light.velocity, light.acceleration)
      FSS.Vector3.multiplyScalar(light.velocity, LIGHT.dampening)
      FSS.Vector3.limit(light.velocity, LIGHT.minLimit, LIGHT.maxLimit)
      FSS.Vector3.add(light.position, light.velocity)
    }

    // Animate Vertices
    for (v = geometry.vertices.length - 1; v >= 0; v--) {
      vertex = geometry.vertices[v]
      ox = Math.sin(vertex.time + vertex.step[0] * now * MESH.speed)
      oy = Math.cos(vertex.time + vertex.step[1] * now * MESH.speed)
      oz = Math.sin(vertex.time + vertex.step[2] * now * MESH.speed)
      FSS.Vector3.set(vertex.position,
                      MESH.xRange * geometry.segmentWidth * ox,
                      MESH.yRange * geometry.sliceHeight * oy,
                      MESH.zRange * offset * oz - offset)
      FSS.Vector3.add(vertex.position, vertex.anchor)
    }

    // Set the Geometry to dirty
    geometry.dirty = true
  }

  function animate () {
    updatePattern()
    render()
  }

  function updatePattern () {
    var v, vertex, offset = MESH.depth / 100
  }

  function render () {
    renderer.render(scene)
  }

  function addEventListeners () {
    window.addEventListener('resize', onIconResize)
  }

  function addPatternListeners () {
    window.addEventListener('resize', onPatternResize)
  }

  // ------------------------------
  // Callbacks
  // ------------------------------

  function onIconResize (event) {
    resize(iconContainer.offsetWidth, iconContainer.offsetHeight)
    render()
  }

  Object.assign(exports, {
    getRandomColor,
    createIconRenderer,
    createPatternRenderer,
    createIconMesh,
    createPatternMesh,
    createLights,
    resize,
    createScene,
    generate,
    render,
    animate,
    updatePattern,
    addEventListeners,
    addPatternListeners,
    addLights,
    randomizeColor,
    onIconResize
  })
}(window.APP))
