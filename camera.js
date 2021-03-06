class Camera
{
    constructor(){
      this.at = vec3(0,0,0);
      this.eye = vec3(0,0,20);
      this.toCam = subtract(this.eye, this.at);
      this.updateCoordinates();
    }

    updateCoordinates () {
      this.x = this.eye[0];
      this.y = this.eye[1];
      this.z = this.eye[2];
    }

    isPointInsideAABB(point, box) {
      return (point[0] >= box.minX && point[0] <= box.maxX) &&
           (point[1] >= box.minY && point[1] <= box.maxY) &&
           (point[2] >= box.minZ && point[2] <= box.maxZ);
    }

    isTargetHit(point, box) {
       return (point[0] >= box.minX && point[0] <= box.maxX) &&
            (point[1] >= box.minY && point[1] <= box.maxY);
    }


    shoot() {
      var hitSomething = false;
      for (var i=0; i<objectNames.length; i++) {
        if (this.isTargetHit([this.x, this.y], objects[objectNames[i]].BB)) {
          hitSomething = true;
          // push the shot object randomly while ensuring it doesnt collide with others
          do {
            objects[objectNames[i]].z += random(0, -5);
            objects[objectNames[i]].y += random(-2, 2);
            objects[objectNames[i]].x += random(-2, 2);
          } while (objects[objectNames[i]].collidesWithOtherBox(i));
          break;
        }
      }
      if (hitSomething) {
        console.log("You hit an object!");
        score +=1;
        if (health+10 > 100) {
          health =  100;
        } else {
          health += 10;
        }
      }
      else {
        console.log("You missed.");
        if (!godMode) {
          health -= parseInt(frameNumber * 0.02);
        }
      }
    }

    move (key){
      var temp_at = this.at;
      var temp_eye = this.eye;

      if(key == "w"){
        temp_at = add (temp_at, vec3(0,0,-0.1*elapsed));
        temp_eye = add (temp_eye, vec3(0,0,-0.1*elapsed));
      }
      else if(key == "s"){
        temp_at = add (temp_at, vec3(0,0,0.1*elapsed));
        temp_eye = add (temp_eye, vec3(0,0,0.1*elapsed));
      }
      else if(key == "arrowleft" || key == "a"){
         temp_at = add (temp_at, vec3(-0.01*elapsed, 0, 0));
         temp_eye = add (temp_eye, vec3(-0.01*elapsed, 0, 0));
      }
      else if(key == "arrowright" || key == "d"){
         temp_at = add (temp_at, vec3(0.01*elapsed, 0, 0));
         temp_eye = add (temp_eye, vec3(0.01*elapsed, 0, 0));
      }
      else if(key == "arrowup") {
        temp_at = add (temp_at, vec3(0, 0.01*elapsed, 0));
        temp_eye = add (temp_eye, vec3(0, 0.01*elapsed, 0));
      }
      else if(key == "arrowdown") {
        temp_at = add (temp_at, vec3(0, -0.01*elapsed, 0));
        temp_eye = add (temp_eye, vec3(0, -0.01*elapsed, 0));
      }

      var collided = false;
      for (var i=0; i<objectNames.length; i++) {
        if (this.isPointInsideAABB(temp_eye, objects[objectNames[i]].BB)) {
          collided = true;
          break;
        }
      }
      if (!collided) {
        this.at = temp_at;
        this.eye = temp_eye;
        this.updateCoordinates();
      }
      else {
        console.log("You collided with an object.");
      }
    }
}
