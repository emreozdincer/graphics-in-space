var time, lastTime, frameNumber, health, totalMinutes, totalMilliSeconds, lostHealthPerSecond, elapsed, gameEnded; // game state
var sphere1,sphere2, sphere3, teddy, castle, gun, backgroundSpace; // models
var models = {};
var spaceTexture; // textures
var lightPos, camera; // light, camera
var ambientMusic;

function setInitialState() {
  lostHealthPerSecond = 5;
  frameNumber = 0;
  health = 100;
  totalMilliSeconds = 0;
  totalMinutes = 0;
  elapsed = 0;
  gameEnded = false;
  lightPos = vec3(0, 1, 2);
  camera = new Camera;
}

function modelLoad(meshes) {
  models.meshes = meshes;
  OBJ.initMeshBuffers(gl, models.meshes.sphere);
  OBJ.initMeshBuffers(gl, models.meshes.teddy);
  OBJ.initMeshBuffers(gl, models.meshes.castle);
  OBJ.initMeshBuffers(gl, models.meshes.gun);
  OBJ.initMeshBuffers(gl, models.meshes.cube);

  // radius of spheres is 1.
  sphere1 = new GameObject(models.meshes.sphere, [-1.5,0,0], [2,2,2]);
  sphere2 = new GameObject(models.meshes.sphere, [1.5,0,0], [2,2,2]);
  sphere3 = new GameObject(models.meshes.sphere, [4,10,-100], [2,2,2]);
  sphere4 = new GameObject(models.meshes.sphere, [-1,-5,-100], [2,2,2]);

  teddy = new GameObject(models.meshes.teddy);
  teddy.model = mult(teddy.model, translate(0,0.2,5));
  teddy.model = mult(teddy.model, scalem(0.02,0.02,0.02));

  castle = new GameObject(models.meshes.castle);
  castle.model = mult(castle.model, translate(0,-1,5));
  castle.model = mult(castle.model, scalem(1,1,2));

  gun = new GameObject(models.meshes.gun);
  gun.model = mult(gun.model, translate(0,-1,0));
  gun.model = mult(gun.model, rotate(90, [0,1,0]));

  backgroundSpace = new GameObject(models.meshes.cube);
  backgroundSpace.model = mult(backgroundSpace.model, translate(0,0,1000));
  backgroundSpace.model = mult(backgroundSpace.model, scalem(2,2,0.01));
  backgroundSpace.type = "background"

  totalTime = 0;
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
      'teddy': 'models/teddy.obj',
      'castle': 'models/Castle OBJ.obj',
      'gun': 'models/handgun.obj',
      'cube': 'models/cube.obj',
  }, modelLoad);

  initTexture();
  setInitialState();

  ambientMusic = new sound("audio/space.mp3");
  ambientMusic.sound.loop = true;
  ambientMusic.play();

  // restart after game end
  document.getElementById("restart").onclick = function() {
    setInitialState();
    gameLoop();
  }
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

  document.getElementById("hud").innerHTML =
  "<span id='time' class='fa fa-hourglass-o fa-2x'>" + pad(totalMinutes) + ':'
  + pad(Math.round(totalMilliSeconds/1000)) + "</span>"
  + "<span id='hp' class='fa fa-heart fa-2x' > " + health + "</span>";
  lastTime = time;
}

function gameLoop() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  viewStable = lookAt([0,0,0],[0,0,15],[0,1,0]);
  orthoProj =  ortho(1, -1, -1, 1, 0.1, 1000);
  persProj = perspective(20, screenSize[0] / screenSize[1], 0.1, 1000);

  // Draw 2D Parts (Background + Gun)
  backgroundSpace.draw("background", mult(orthoProj,viewStable));
  gun.draw(lightPos, mult(orthoProj,viewStable));

  if (!gameEnded) {
    view = lookAt(add(camera.at, camera.toCam), camera.at, [0, 1, 0]);

    // Draw 3D Scene
    sphere1.draw(lightPos, mult(persProj,view));
    sphere2.draw(lightPos, mult(persProj,view));
    sphere3.draw(lightPos, mult(persProj,view));
    sphere4.draw(lightPos, mult(persProj,view));

    // teddy.draw(lightPos, mult(persProj,view));
    // castle.draw(lightPos, mult(persProj,view));

    animate();

    document.onkeydown = function(e) {
        camera.move(e.keyCode, elapsed);
    }

    document.getElementById("restart").onclick = restart; // function call

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

// The sleep is necessary, otherwise requestAnimationFrame calls get stacked
function restart() {
  gameEnded = true;
  sleep(100).then(() => {
    setInitialState();
    gameLoop();
  })
}
