class GameObject
{
  // dimensions: width, height, depth
  constructor(mesh, coordinates, dimensions, mesh_low){
    var program = initShaders(gl, 'vertex-shader-object', 'fragment-shader-object');
    program.model = gl.getUniformLocation(program, "model");
    program.viewprojection = gl.getUniformLocation(program, "view_projection");
    program.lightPos = gl.getUniformLocation(program, "lightPos");
    program.cameraPos = gl.getUniformLocation(program, "cameraPos");
    program.screenSize = gl.getUniformLocation(program, "screenSize");
    program.objectType = gl.getUniformLocation(program, "objectType");
    program.samplerUniform = gl.getUniformLocation(program, "uSampler");
    program.colorUniform = gl.getUniformLocation(program, "uColor");

    program.tpos_attr = gl.getAttribLocation(program, 'vTexture');
    gl.enableVertexAttribArray(program.tpos_attr);
    program.vpos_attr = gl.getAttribLocation(program, 'vPosition');
    gl.enableVertexAttribArray(program.vpos_attr);
    program.vnor_attr = gl.getAttribLocation(program, "vNormal");
    gl.enableVertexAttribArray(program.vnor_attr);

    this.program = program;
    this.mesh = mesh;
    this.model = mat4();
    this.setRandomColor();
    // this.isAlive = true;

    if (coordinates) {
      this.initialCoordinates = coordinates;
      this.x = coordinates[0];
      this.y = coordinates[1];
      this.z = coordinates[2];
    }

    if (dimensions) {
      this.dimensions = dimensions;
      this.width = dimensions[0];
      this.height = dimensions[1];
      this.depth = dimensions[2];
    }

    if (mesh_low) {
      this.mesh_low = mesh_low;
    }

    this.insideFrustum = true; // dummy
  }

  updateAABB() {
    // only for sphere yet
    this.upper_left = [
      this.x - this.width/2,
      this.y + this.height/2,
      this.z - this.depth/2
    ];

    this.BB = {};
    this.BB.maxX = this.upper_left[0] + this.width;
    this.BB.minX = this.upper_left[0];

    this.BB.maxY = this.upper_left[1];
    this.BB.minY = this.upper_left[1] - this.height;

    this.BB.maxZ = this.upper_left[2] + this.depth;
    this.BB.minZ = this.upper_left[2];
  }

  setRandomColor() {
    this.color = [randomDark(), randomDark(), randomDark()];
  }

  // checks whether two objects collide
  intersect(b) {
    this.updateAABB();
    b.updateAABB();

    var a = this.BB;
    b = b.BB;

    return (a.minX <= b.maxX && a.maxX >= b.minX) &&
           (a.minY <= b.maxY && a.maxY >= b.minY) &&
           (a.minZ <= b.maxZ && a.maxZ >= b.minZ);
  }

  // loops through all boxes and checks collision
  collidesWithOtherBox(i) {
    var collided = false;
    for (var j=0; j<objectNames.length; j++) {
      // don't check yourself
      if (i == j) {
        continue;
      }
      else if (this.intersect(objects[objectNames[j]])) {
        collided = true;
      }
    }
    return collided;
  }

  setLevel(camera, detailOption) {
    if (detailOption == "low") {
      return "low";
    }

    var detailLevel;
    var distance = Math.sqrt(
        (this.x-camera.x)*(this.x-camera.x)
        +(this.y-camera.y)*(this.y-camera.y)
        +(this.z-camera.z)*(this.z-camera.z)
      );
    if (distance > 200) {
      detailLevel = "low";
    }
    else {
      detailLevel = "high";
    }
    return detailLevel;
  }

  draw(viewProjection, lightPos, detailLevel) {
    var model = mat4();
    model = mult(this.model, model);

    if (this.x != null && this.y != null && this.z !=null) {
      this.updateAABB();
      model = mult(this.model, translate(this.x, this.y, this.z));
    }

    var mesh = this.mesh;

    if (detailLevel == "low" && mesh.type == "sphere") {
      mesh = this.mesh_low;
      model = mult(model, scalem(2,2,2));
    }

    viewProjection = viewProjection || mat4();
    gl.useProgram(this.program);

    if (mesh.type == "background") {
      gl.uniform1f(this.program.objectType, 1.0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, spaceTexture);
      gl.uniform1i(this.program.samplerUniform, 0);

      gl.enableVertexAttribArray(this.program.tpos_attr);
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.textureBuffer);
      gl.vertexAttribPointer(this.program.tpos_attr, mesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
    }
    else if (mesh.type == "gun") {
      gl.uniform1f(this.program.objectType, 1.0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, gunTexture);
      gl.uniform1i(this.program.samplerUniform, 0);

      gl.enableVertexAttribArray(this.program.tpos_attr);
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.textureBuffer);
      gl.vertexAttribPointer(this.program.tpos_attr, mesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

    }
    else {
      // Disable Texture
      gl.disableVertexAttribArray(this.program.tpos_attr);
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.uniform1f(this.program.objectType, 0.0);

      if (mesh.type == "sphere") {
       gl.uniform1f(this.program.objectType, 2.0);
       gl.uniform3f(this.program.colorUniform, this.color[0], this.color[1], this.color[2]);
     }
    }

    gl.uniformMatrix4fv(this.program.model, false, flatten( model));
    gl.uniformMatrix4fv(this.program.viewprojection, false, flatten(viewProjection));

    if (lightPos) {
      gl.uniform3f(this.program.lightPos, lightPos[0], lightPos[1], lightPos[2]);
    }

    gl.uniform3f(this.program.cameraPos, camera.x, camera.y, camera.z);

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
    gl.vertexAttribPointer(this.program.vpos_attr, mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
    gl.vertexAttribPointer(this.program.vnor_attr, mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
    gl.drawElements(gl.TRIANGLES, mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

  }
}
