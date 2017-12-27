// game state
var time, lastTime, frameNumber, health, totalMinutes, totalMilliSeconds, lostHealthPerSecond, elapsed, rotationAngle, gameEnded;
// objects, models
var models = {}; var objects = {};
var sphere1, sphere2, sphere3, sphere4,  teddy, castle, gun, background, objectNames;
// design
var spaceTexture, lightPos, camera, ambientMusic;

function setInitialState() {
  lostHealthPerSecond = 1;
  frameNumber = 0;
  health = 100;
  totalMilliSeconds = 0;
  totalMinutes = 0;
  elapsed = 0;
  rotationAngle = 0;
  gameEnded = false;
  lightPos = vec3(0, 5, 15);
  camera = new Camera;
}

// Also starts the game after loading models
function modelLoad(meshes) {
  models.meshes = meshes;
  OBJ.initMeshBuffers(gl, models.meshes.sphere);
  OBJ.initMeshBuffers(gl, models.meshes.gun);
  OBJ.initMeshBuffers(gl, models.meshes.cube);

  models.meshes.sphere.type = "sphere";
  sphere1 = new GameObject(models.meshes.sphere, [-2,0,0], [2,2,2]);
  sphere2 = new GameObject(models.meshes.sphere, [2,0,0], [2,2,2]);
  sphere3 = new GameObject(models.meshes.sphere, [4,-5,-100], [2,2,2]);
  sphere4 = new GameObject(models.meshes.sphere, [-20,10,-100], [2,2,2]);

  models.meshes.gun.type = "gun";
  gun = new GameObject(models.meshes.gun);
  gun.model = mult(gun.model, translate(0,-1,0));
  gun.model = mult(gun.model, rotate(90, [0,1,0]));

  models.meshes.cube.type = "background";
  background = new GameObject(models.meshes.cube);
  background.model = mult(background.model, translate(0,0,1000));
  background.model = mult(background.model, scalem(2,2,0.01))

  // keep a hash table for objects (to be able to loop through)
  objects = {}
  objects.sphere1 = sphere1;
  objects.sphere2 = sphere2;
  objects.sphere3 = sphere3;
  objects.sphere4 = sphere4;

  gameLoop();
}

function handleLoadedTexture(texture) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  gl.generateMipmap(gl.TEXTURE_2D);

  gl.bindTexture(gl.TEXTURE_2D, null);
}

function initTexture() {
  spaceTexture = gl.createTexture();
  spaceTexture.image = new Image();
  spaceTexture.image.onload = function () {
      handleLoadedTexture(spaceTexture)
  };
  spaceTexture.image.src = "textures/space_1024.png";
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
      'gun': 'models/handgun.obj',
      'cube': 'models/cube.obj',
  }, modelLoad);

  initTexture();
  setInitialState();

  ambientMusic = new sound("audio/space.mp3");
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

  animateObjects();

  document.getElementById("hud").innerHTML =
  "<span id='time' class='fa fa-hourglass-o fa-2x'>" + pad(totalMinutes) + ':'
  + pad(Math.round(totalMilliSeconds/1000)) + "</span>"
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

  // Draw 2D Parts (Background + Gun)
  background.draw( mult(orthoProj,viewStable) );
  gun.draw ( mult(orthoProj,viewStable) );

  if (!gameEnded) {
    view = lookAt(add(camera.at, camera.toCam), camera.at, [0, 1, 0]);

    // Draw 3D Scene
    objectNames = Object.keys(objects)
    for (var i=0; i<objectNames.length; i++) {
        if (objects[objectNames[i]].insideFrustrum) {
          objects[objectNames[i]].draw(mult(persProj,view), lightPos);
        }
    }

    animate();

    document.onkeydown = handleKeyDown;

    document.getElementById("restart").onclick = restart;

    document.getElementById("harakiri").onclick = function() {
      gameEnded = true;
    }

    window.requestAnimationFrame(gameLoop);
  }
  else {
    window.cancelAnimationFrame(gameLoop);
    document.getElementById("hud").innerHTML += "<span id='game-over'>Game Over!</span>";
  }

}

function handleKeyDown() {
 if (event.key == "P") {
    ambientMusic.play();
 }
 else if (event.key == "S") {
   ambientMusic.stop();
 }
 else if (event.key == "ArrowUp" || event.key == "ArrowLeft" || event.key == "ArrowDown" || event.key == "ArrowRight") {
   camera.move(event.key, elapsed);
 }
 else if (event.key == " ") {
   camera.shoot();
 }
}

// The sleep is necessary, otherwise requestAnimationFrame calls get stacked
function restart() {
  gameEnded = true;
  sleep(50).then(() => {
    setInitialState();
    gameLoop();
  })
}
