// game state
var score, bestScore, time, lastTime, frameNumber, health, totalMinutes, totalMilliSeconds, lostHealthPerSecond, elapsed, rotationAngle, gameEnded, objectDistance, detailOption;
// objects, models
var models = {}; var objects = {}; var textures = {};
var sphere1, sphere2, sphere3, sphere4, teddy, castle, gun, background, objectNames;
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
  detailOption = "high";
  lightPos = vec3(0, 5, 15);
  camera = new Camera;

}

// Also starts the game after loading models
function modelLoad(meshes) {
  models.meshes = meshes;
  OBJ.initMeshBuffers(gl, models.meshes.sphere);
  OBJ.initMeshBuffers(gl, models.meshes.low_sphere);
  OBJ.initMeshBuffers(gl, models.meshes.cubeBackground);
  // OBJ.initMeshBuffers(gl, models.meshes.cubeGun);

  models.meshes.cubeGun = Object.assign({}, models.meshes.cubeBackground);

  models.meshes.sphere.type = "sphere";
  models.meshes.low_sphere.type = "sphere";
  sphere1 = new GameObject(models.meshes.sphere, [-2,0,0], [2,2,2], models.meshes.low_sphere);
  sphere2 = new GameObject(models.meshes.sphere, [2,0,0], [2,2,2], models.meshes.low_sphere);
  sphere3 = new GameObject(models.meshes.sphere, [4,-5,-100], [2,2,2], models.meshes.low_sphere);
  sphere4 = new GameObject(models.meshes.sphere, [-20,10,-100], [2,2,2], models.meshes.low_sphere);

  models.meshes.cubeGun.type = "gun";
  gun = new GameObject(models.meshes.cubeGun);
  // gun.model = mult(gun.model, scalem(1,1,0.2))
  gun.model = mult(gun.model, translate(-0.25,-1.1,0));
  // gun.model = mult(gun.model, rotate(30, [0,1,0]));
  gun.model = mult(gun.model, rotate(45, [0,0,1]));

  models.meshes.cubeBackground.type = "background";
  background = new GameObject(models.meshes.cubeBackground);
  background.model = mult(background.model, translate(0,0,1000));
  background.model = mult(background.model, scalem(2,2,0.01))

  // keep a hash table for objects (to be able to loop through)
  objects = {}
  objects.sphere1 = sphere1;
  objects.sphere2 = sphere2;
  objects.sphere3 = sphere3;
  objects.sphere4 = sphere4;
  objectNames = Object.keys(objects)

  gameLoop();
}

function handleLoadedTexture(textures) {
  console.log(textures);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  gl.bindTexture(gl.TEXTURE_2D, textures[0]);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textures[0].image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  gl.generateMipmap(gl.TEXTURE_2D);

  gl.bindTexture(gl.TEXTURE_2D, textures[1]);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textures[1].image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  gl.generateMipmap(gl.TEXTURE_2D);

  gl.bindTexture(gl.TEXTURE_2D, null);
}

function initTexture() {
  spaceTexture = gl.createTexture();
  spaceTexture.image = new Image();
  spaceTexture.image.src = "textures/space_1024.png";
  textures.background = spaceTexture;

  gunTexture = gl.createTexture();
  gunTexture.image = new Image();
  gunTexture.image.src = "textures/gun_1024.jpg";
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
  gunfire = new sound("audio/gunfire.mp3");
  gunfire.sound.volume = 0.5;

  ambientMusic.sound.loop = true;
  ambientMusic.play();
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

  if (frameNumber % 100 > 98) {
    health -= lostHealthPerSecond;
    if (health <= 0) {
      gameEnded = true;
    }
  }

  elapsed = time - lastTime;
  totalMilliSeconds += elapsed;

  rotationAngle = ((rotationAngle + 1)) % 360

  // animateObjects();

  document.getElementById("hud").innerHTML =
  "<span id='time' class='fa fa-hourglass-o fa-2x'>" + pad(totalMinutes) + ':'
  + pad(Math.round(totalMilliSeconds/1000)) + "</span>"
  + "<span id='score' class='fa fa-trophy fa-2x' > " + score + "</span>"
  + "<span id='hp' class='fa fa-heart fa-2x' > " + health + "</span>";
  lastTime = time;
}

function animateObjects() {
  sphere1.x -= Math.cos(degToRad(rotationAngle)) * 0.001 * elapsed;

  // Example box-box collision
  if (sphere1.intersect(sphere2.BB) == true) {
    console.log("Objects are colliding!");
  }
  sphere2.z += Math.sin(degToRad(rotationAngle)) * 0.005 * elapsed;
  sphere3.y += Math.sin(degToRad(rotationAngle)) * 0.001 * elapsed;
  sphere3.x -= Math.cos(degToRad(rotationAngle)) * 0.001 * elapsed;
  sphere4.y -= Math.sin(degToRad(rotationAngle)) * 0.002 * elapsed;
  sphere4.x += 0.001 * elapsed;

  if (sphere4.x > 30) {
    sphere4.x = -30;
  }
}

function gameLoop() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  viewStable = lookAt([0,0,0],[0,0,15],[0,1,0]);
  orthoProj =  ortho(1, -1, -1, 1, 0.1, 1000);
  persProj = perspective(20, screenSize[0] / screenSize[1], 0.1, 1000);

  background.draw( mult(orthoProj,viewStable) );

  if (!gameEnded) {
    // Draw 2D Parts (Background + Gun)

    // Draw 3D Scene
    view = lookAt(add(camera.at, camera.toCam), camera.at, [0, 1, 0]);

    gun.draw ( mult(orthoProj,viewStable) );
    // For each object, check frustrum, set detail level, and draw.
    for (var i=0; i<objectNames.length; i++) {
        if (objects[objectNames[i]].insideFrustrum) {
          detailLevel = objects[objectNames[i]].setLevel(camera, detailOption);
          objects[objectNames[i]].draw(mult(persProj,view), lightPos, detailLevel);
        }
    }
    animate();

    document.onkeydown = handleKeyDown;
    document.getElementById("restart").onclick = restart;
    document.getElementById("harakiri").onclick = function() {
      gameEnded = true;
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
    document.getElementById("hud").innerHTML += "<span id='game-over'>Game Over!"
    + " You scored " + score + "</span>";
  }

}

function handleKeyDown() {
  var key = event.key.toLowerCase();
  if (key == "r") {
    restart();
  }
  if (key == "p") {
    if (ambientMusic.sound.paused) {
      ambientMusic.play();
    } else {
      ambientMusic.stop();
    }
  }
  else if (key == "arrowup" || key == "arrowleft" || key == "arrowdown"
  || key == "arrowright" || key == "w" || key == "s" || key == "a" || key == "d") {
   camera.move(key, elapsed);
  }
  else if (key == " ") {
   camera.shoot();
   gunfire.play();
  }
}

// The sleep is necessary, otherwise requestAnimationFrame calls get stacked
function restart() {
  gameEnded = true;
  sleep(500).then(() => {
    setInitialState();
    gameLoop();
  })
}
