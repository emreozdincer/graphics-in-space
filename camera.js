class Camera
{
    constructor(){
      this.at = vec3(0,0,0);
      this.eye = vec3(0,0,15);
      this.toCam = subtract(this.eye, this.at);

      // mouse
      this.lastX = 430;
      this.lastY = 320;
    }

    isPointInsideAABB(point, box) {
      return (point[0] >= box.minX && point[0] <= box.maxX) &&
           (point[1] >= box.minY && point[1] <= box.maxY) &&
           (point[2] >= box.minY && point[2] <= box.maxZ);
       }

    move (button, elapsed){
      var temp_at = this.at;
      var temp_eye = this.eye;

      if(button == 38){
        // up arrow
        temp_at = add (temp_at, vec3(0,0,-0.1*elapsed));
        temp_eye = add (temp_eye, vec3(0,0,-0.1*elapsed));
      }
      else if(button == 40){
        // down arrow
        temp_at = add (temp_at, vec3(0,0,0.1*elapsed));
        temp_eye = add (temp_eye, vec3(0,0,0.1*elapsed));
      }
      else if(button == 37){
         // left arrow
         temp_at = add (temp_at, vec3(-0.01*elapsed, 0, 0));
         temp_eye = add (temp_eye, vec3(-0.01*elapsed, 0, 0));
      }
      else if(button == 39){
         // right arrow
         temp_at = add (temp_at, vec3(0.01*elapsed, 0, 0));
         temp_eye = add (temp_eye, vec3(0.01*elapsed, 0, 0));
      }

      if (!this.isPointInsideAABB(temp_eye, sphere1.BB) && !this.isPointInsideAABB(temp_eye, sphere2.BB) ) {
        this.at = temp_at;
        this.eye = temp_eye;
      }
      else {
        console.log("There is a collision.");
      }
    }
}
