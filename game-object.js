class GameObject
{
    constructor(mesh, coordinates, dimensions){
        var program = initShaders(gl, 'vertex-shader-object', 'fragment-shader-object');
        program.model = gl.getUniformLocation(program, "model");
        program.viewprojection = gl.getUniformLocation(program, "view_projection");
        program.lightPos = gl.getUniformLocation(program, "lightPos");
        program.cameraPos = gl.getUniformLocation(program, "cameraPos");
        program.screenSize = gl.getUniformLocation(program, "screenSize");
        program.isBackground = gl.getUniformLocation(program, "isBackground");
        program.samplerUniform = gl.getUniformLocation(program, "uSampler");

        program.tpos_attr = gl.getAttribLocation(program, 'vTexture');
        gl.enableVertexAttribArray(program.tpos_attr);

        program.vpos_attr = gl.getAttribLocation(program, 'vPosition');
        gl.enableVertexAttribArray(program.vpos_attr);

        program.vnor_attr = gl.getAttribLocation(program, "vNormal");
        gl.enableVertexAttribArray(program.vnor_attr);

        this.name = mesh.toString()
        this.program = program;
        this.mesh = mesh;
        this.model = mat4();

        if (coordinates) {
          this.x = coordinates[0];
          this.y = coordinates[1];
          this.z = coordinates[2];
        }

        if (dimensions) {
          this.width = dimensions[0];
          this.height = dimensions[1];
          this.depth = dimensions[2];
        }

    }

    createAABB() {
      // only for sphere yet
      // need to be refreshed if object moves
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

    draw(lightPos, viewProjection, model){
        this.createAABB();

        model = model || mat4();
        model = mult(this.model, model);

        // if coordinates exist
        if (this.x != null && this.y != null && this.z !=null) {
          model = mult(model, translate(this.x, this.y, this.z));
        }

        viewProjection = viewProjection || mat4();
        gl.useProgram(this.program);

        if (this.type == "background") {
          gl.uniform1f(this.program.isBackground, 1.0);
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, spaceTexture);
          gl.uniform1i(this.program.samplerUniform, 0);

          gl.enableVertexAttribArray(this.program.tpos_attr);
          gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.textureBuffer);
          gl.vertexAttribPointer(this.program.tpos_attr, this.mesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
        }
        else {
          gl.disableVertexAttribArray(this.program.tpos_attr);
          gl.bindTexture(gl.TEXTURE_2D, null);
          gl.uniform1f(this.program.background, 0.0);
        }

        gl.uniformMatrix4fv(this.program.model, false, flatten( model));
        gl.uniformMatrix4fv(this.program.viewprojection, false, flatten(viewProjection));
        gl.uniform3f(this.program.lightPos, lightPos[0], lightPos[1], lightPos[2]);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
        gl.vertexAttribPointer(this.program.vpos_attr, this.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.normalBuffer);
        gl.vertexAttribPointer(this.program.vnor_attr, this.mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    }
}
