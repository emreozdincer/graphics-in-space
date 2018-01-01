// game state
var score, bestScore, time, lastTime, frameNumber, health, totalMinutes, totalMilliSeconds, lostHealthPerSecond, godMode, elapsed, rotationAngle, gameEnded, objectDistance, detailOption;
// objects, models
var models = {}; var objects = {}; var textures = {};
var spheres, teddy, castle, gun, background, objectNames;
// design
var spaceTexture, lightPos, camera, ambientMusic;

function setInitialState() {
  score = 0;
  lostHealthPerSecond = 10;
  frameNumber = 0;
  health = 100;
  totalMilliSeconds = 0;
  totalMinutes = 0;
  elapsed = 0;
  rotationAngle = 0;
  if (gameEnded) {
    for (var i=0; i<objectNames.length; i++) {
      objects[objectNames[i]].x = objects[objectNames[i]].initialCoordinates[0];
      objects[objectNames[i]].y = objects[objectNames[i]].initialCoordinates[1];
      objects[objectNames[i]].z = objects[objectNames[i]].initialCoordinates[2];
    }
    if (score > bestScore) {
      bestScore = score;
    }
  }
  gameEnded = false;
  lightPos = vec3(0, 0, 1);
  camera = new Camera;

}

// Loads the models and starts the game
function modelLoad(meshes) {
  models.meshes = meshes;
  OBJ.initMeshBuffers(gl, models.meshes.sphere);
  OBJ.initMeshBuffers(gl, models.meshes.low_sphere);
  OBJ.initMeshBuffers(gl, models.meshes.cubeBackground);

  models.meshes.cubeGun = Object.assign({}, models.meshes.cubeBackground);

  spheres = []
  models.meshes.sphere.type = "sphere";
  models.meshes.low_sphere.type = "sphere";
  spheres[0] = new GameObject(models.meshes.sphere, [-2,0,0], [2,2,2], models.meshes.low_sphere);
  spheres[1] = new GameObject(models.meshes.sphere, [2,0,-5], [2,2,2], models.meshes.low_sphere);
  spheres[2] = new GameObject(models.meshes.sphere, [4,-5,-100], [2,2,2], models.meshes.low_sphere);
  spheres[3] = new GameObject(models.meshes.sphere, [-20,10,-100], [2,2,2], models.meshes.low_sphere);

  models.meshes.cubeGun.type = "gun";
  gun = new GameObject(models.meshes.cubeGun);
  gun.model = mult(gun.model, translate(-0.45, -1.1, 0.0));
  gun.model = mult(gun.model, rotate(45, [0,0,1]));

  models.meshes.cubeBackground.type = "background";
  background = new GameObject(models.meshes.cubeBackground);
  background.model = mult(background.model, translate(0,0,1000));
  background.model = mult(background.model, scalem(2,2,0.01))

  // Hash table for all objects
  // Should make it more object oriented later :)
  objects = {}
  objects.sphere1 = spheres[0];
  objects.sphere2 = spheres[1];
  objects.sphere3 = spheres[2];
  objects.sphere4 = spheres[3];
  objectNames = Object.keys(objects)

  gameLoop();
}

function handleLoadedTexture(textures) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  for (var i=0; i<textures.length; i++) {
    gl.bindTexture(gl.TEXTURE_2D, textures[i]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textures[i].image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Don't assume to the power of 2
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    // gl.generateMipmap(gl.TEXTURE_2D);
  }


  gl.bindTexture(gl.TEXTURE_2D, null);
}

function initTexture() {
  spaceTexture = gl.createTexture();
  spaceTexture.image = new Image();
  spaceTexture.image.crossOrigin = ''
  spaceTexture.image.src = "textures/space_1024.png";
  textures.background = spaceTexture;

  gunTexture = gl.createTexture();
  gunTexture.image = new Image();
  gunTexture.crossOrigin = ''
  gunTexture.image.src = "textures/lasergun.png";
  textures.gun = gunTexture;

  textures = [spaceTexture, gunTexture];
  gunTexture.image.onload = function () {
      handleLoadedTexture(textures)
  };
}

window.onload = function () {
  let canvas = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
      alert("yo");
  }

  screenSize = [canvas.width, canvas.height];

  gl.viewport(0, 0, screenSize[0], screenSize[1]);
  gl.clearColor(0.1, 0.1, 0.4, 1);

  OBJ.downloadMeshes({
    'sphere': 'models/sphere.obj',
    'low_sphere': 'models/low-poly-sphere.obj',
    'cubeBackground': 'models/cube.obj'
  }, modelLoad);

  initTexture();
  setInitialState();

  ambientMusic = new sound("audio/space.mp3");
  gunfire = new sound("audio/laserblast.mp3");
  gunfire.sound.volume = 0.5;

  ambientMusic.sound.loop = true;
  ambientMusic.play();

  if (document.getElementById('detailOption').value == "high") {
    detailOption = "high";
  }
  else if (document.getElementById('detailOption').value == "low") {
    detailOption = "low";
  }

  godMode = false;

}

function animate() {
  time = new Date();
  frameNumber += 1;

  if (frameNumber == 1) {
    lastTime = time;
  }
  else if (totalMilliSeconds > 60000) {
    totalMilliSeconds -= 60000;
    totalMinutes += 1;
  }

  if (!godMode) {
    if (frameNumber % 100 > 98) {
      health -= parseInt(lostHealthPerSecond * 0.005 * frameNumber);
      if (health <= 0) {
        gameEnded = true;
      }
    }
  }

  elapsed = time - lastTime;
  totalMilliSeconds += elapsed;

  rotationAngle = ((rotationAngle + 1)) % 360

  animateObjects();

  document.getElementById("hud").innerHTML =
  "<span id='time' class='fa fa-hourglass-o fa-2x'>" + pad(totalMinutes) + ':'
  + pad(Math.round(totalMilliSeconds/1000)) + "</span>"
  + "<span id='score' class='fa fa-trophy fa-2x' > " + score + "</span>"
  + "<span id='hp' class='fa fa-heart fa-2x' > " + health + "</span>";
  lastTime = time;
}

function animateObjects() {
  spheres[0].x -= Math.cos(degToRad(rotationAngle)) * 0.001 * elapsed;

  spheres[1].y += Math.cos(degToRad(rotationAngle)) * 0.001 * elapsed;
  spheres[1].z += Math.sin(degToRad(rotationAngle)) * 0.005 * elapsed;

  spheres[2].y += Math.sin(degToRad(rotationAngle)) * 0.001 * elapsed;
  spheres[2].x -= Math.cos(degToRad(rotationAngle)) * 0.001 * elapsed;

  spheres[3].y -= Math.sin(degToRad(rotationAngle)) * 0.002 * elapsed;
  spheres[3].x += 0.001 * elapsed;

  if (spheres[3].x > 30) {
    spheres[3].x = -30;
  }
}

function gameLoop() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  viewStable = lookAt([0,0,0],[0,0,15],[0,1,0]);
  orthoProj =  ortho(1, -1, -1, 1, 0.1, 1000);
  persProj = perspective(20, screenSize[0] / screenSize[1], 0.1, 1000);

  // Draw 2D Parts (Background + Gun)
  background.draw( mult(orthoProj,viewStable) );

  if (!gameEnded) {
    gun.draw ( mult(orthoProj,viewStable) );

    // Draw 3D Scene
    view = lookAt(add(camera.at, camera.toCam), camera.at, [0, 1, 0]);

    // For each object, check frustum, set detail level, and draw.
    for (var i=0; i<objectNames.length; i++) {
        if (objects[objectNames[i]].insideFrustum) {
          detailLevel = objects[objectNames[i]].setLevel(camera, detailOption);
          objects[objectNames[i]].draw(mult(persProj,view), lightPos, detailLevel);
        }
    }

    animate();

    document.onkeydown = handleKeyDown;
    document.getElementById("restart").onclick = function() {
      // if eventType == mousedown
      if (!(event.screenX == 0 && event.screenY == 0)) {
        restart();
      }
    }
    document.getElementById("harakiri").onclick = function() {
      // if eventType == mousedown
      if (!(event.screenX == 0 && event.screenY == 0)) {
        gameEnded = true;
      }
    }
    document.getElementById('detailOption').onchange = function () {
        if (event.target.value == "low") {
          detailOption = "low";
        }
        else if (event.target.value == "high") {
          detailOption = "high";
        }
      }

    window.requestAnimationFrame(gameLoop);
  }
  else {
    window.cancelAnimationFrame(gameLoop);
    document.getElementById("game-over").innerHTML = "Game Over!"
    + " You scored " + score + ".<br/>   Press R to restart";
  }

}

function handleKeyDown() {
  var key = event.key.toLowerCase();
  if (key == "r") {
    restart();
  }
  else if (key == "p") {
    if (ambientMusic.sound.paused) {
      ambientMusic.play();
    } else {
      ambientMusic.stop();
    }
  }
  else if (key == "g") {
    if (godMode == true) {
      godMode = false;
    }
    else {
        godMode = true;
    }
  }
  else if (key == "arrowup" || key == "arrowleft" || key == "arrowdown"
  || key == "arrowright" || key == "w" || key == "s" || key == "a" || key == "d") {
   camera.move(key, elapsed);
  }
  else if (key == " ") {
    gunfire.sound.currentTime = 0;
    gunfire.play();
    camera.shoot();
  }
}

// The sleep is necessary, otherwise requestAnimationFrame calls get stacked
function restart() {
  gameEnded = true;
  sleep(500).then(() => {
    document.getElementById("game-over").innerHTML =''
    setInitialState();
    gameLoop();
  })
}
