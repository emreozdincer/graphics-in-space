class Camera
{
    constructor(){
      this.at = vec3(0,0,0);
      this.eye = vec3(0,0,15);
      this.toCam = subtract(this.eye, this.at);
      this.updateCoordinates();
      // mouse
      this.lastX = 430;
      this.lastY = 320;
    }

    updateCoordinates () {
      this.x = this.eye[0];
      this.y = this.eye[1];
      this.z = this.eye[2];
    }

    isPointInsideAABB(point, box) {
      return (point[0] >= box.minX && point[0] <= box.maxX) &&
           (point[1] >= box.minY && point[1] <= box.maxY) &&
           (point[2] >= box.minY && point[2] <= box.maxZ);
     }

    isTargetHit(point, box) {
       return (point[0] >= box.minX && point[0] <= box.maxX) &&
            (point[1] >= box.minY && point[1] <= box.maxY)
      }


    shoot () {
      for (var i=0; i<objectNames.length; i++) {
        if (this.isTargetHit([this.x, this.y], objects[objectNames[i]].BB)) {
          // objects[objectNames[i]].color = [1,1,1];
          objects[objectNames[i]].z += -15;
          if (health + 15 >= 100){
            health = 100;
          }
          else {
            health + 15
          }
        }
        else {
          health -= 2;
        }
      }
    }
    move (button){
      var temp_at = this.at;
      var temp_eye = this.eye;

      if(button == "ArrowUp"){
        temp_at = add (temp_at, vec3(0,0,-0.1*elapsed));
        temp_eye = add (temp_eye, vec3(0,0,-0.1*elapsed));
      }
      else if(button == "ArrowDown"){
        temp_at = add (temp_at, vec3(0,0,0.1*elapsed));
        temp_eye = add (temp_eye, vec3(0,0,0.1*elapsed));
      }
      else if(button == "ArrowLeft"){
         temp_at = add (temp_at, vec3(-0.01*elapsed, 0, 0));
         temp_eye = add (temp_eye, vec3(-0.01*elapsed, 0, 0));
      }
      else if(button == "ArrowRight"){
         temp_at = add (temp_at, vec3(0.01*elapsed, 0, 0));
         temp_eye = add (temp_eye, vec3(0.01*elapsed, 0, 0));
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
