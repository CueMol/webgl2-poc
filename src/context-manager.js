const fs = require('fs');
const path = require('path');
const glmat = require('gl-matrix');
const Buffer = require('buffer').Buffer;

const VERTEX_SIZE = 3; // vec3
const COLOR_SIZE  = 4; // vec4
// const VERTEX_NUMS = 6 * 1000 * 100;
const STRIDE = (VERTEX_SIZE + COLOR_SIZE) * Float32Array.BYTES_PER_ELEMENT;
const POSITION_OFFSET = 0;
const COLOR_OFFSET = VERTEX_SIZE * Float32Array.BYTES_PER_ELEMENT;

const radius = 100;

function loadShader(gl) {
    let vertexShaderSource = fs.readFileSync(path.resolve(__dirname, 'vertex_shader.glsl'));

    // console.log("rawdata", vertexShaderSource);
    
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    
    const vShaderCompileStatus = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
    if(!vShaderCompileStatus) {
        const info = gl.getShaderInfoLog(vertexShader);
        console.log(info);
    }

    let fragmentShaderSource = fs.readFileSync(path.resolve(__dirname, 'fragment_shader.glsl'));
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    const fShaderCompileStatus = gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);
    if(!fShaderCompileStatus) {
        const info = gl.getShaderInfoLog(fragmentShader);
        console.log(info);
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const linkStatus = gl.getProgramParameter(program, gl.LINK_STATUS);
    if(!linkStatus) {
        const info = gl.getProgramInfoLog(program);
        console.log(info);
    }

    return program;
}


class DrawEntry {
    constructor(gl, val, cal, nsize, nelems) {
        this._vertexAttribLocation = val;
        this._colorAttribLocation = cal;

        this._nsize = nsize;
        this._nelems = nelems;

        this._buf = new Float32Array(nsize);
        console.log("alloc Float32Array nsize=", nsize);

        // Prepare VBO
        this._vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.enableVertexAttribArray(this._vertexAttribLocation);
        gl.enableVertexAttribArray(this._colorAttribLocation);
        gl.vertexAttribPointer(this._vertexAttribLocation, VERTEX_SIZE, gl.FLOAT, false, STRIDE, POSITION_OFFSET);
        gl.vertexAttribPointer(this._colorAttribLocation, COLOR_SIZE, gl.FLOAT, false, STRIDE, COLOR_OFFSET);
        gl.bufferData(gl.ARRAY_BUFFER, this._buf, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    draw(gl) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        // gl.enableVertexAttribArray(this._vertexAttribLocation);
        // gl.enableVertexAttribArray(this._colorAttribLocation);
        gl.vertexAttribPointer(this._vertexAttribLocation, VERTEX_SIZE, gl.FLOAT, false, STRIDE, POSITION_OFFSET);
        gl.vertexAttribPointer(this._colorAttribLocation, COLOR_SIZE, gl.FLOAT, false, STRIDE, COLOR_OFFSET);
        gl.drawArrays(gl.TRIANGLES, 0, this._nelems);
    }
}

module.exports = class Manager {
    constructor() {
        this._radian = 0;
        this._dist = 100;
        this._new_draw_id = 0;
        this._draw_data = [];
    }
    
    // Bind this manager to specific canvas
    // Called from JS side
    init(canvas) {
        this._canvas = canvas;
        this._context = canvas.getContext('webgl2');

        const gl = this._context;
        this._program = loadShader(gl);

        // Get attrib/unif loc from program object
        const program = this._program;
        this._vertexAttribLocation = gl.getAttribLocation(program, 'vertexPosition');
        this._colorAttribLocation  = gl.getAttribLocation(program, 'color');
        this._modelLocation = gl.getUniformLocation(program, 'model');
        this._viewLocation = gl.getUniformLocation(program, 'view');
        this._projectionLocation = gl.getUniformLocation(program, 'projection');
    }

    // Create new WebGL buffer
    // Called from native side
    createBufferOld(nsize, num_elems) {
        const gl = this._context;
        
        this._buf = new Float32Array(nsize);
        console.log("alloc Float32Array nsize=", nsize);

        // Prepare VBO
        this._vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.enableVertexAttribArray(this._vertexAttribLocation);
        gl.enableVertexAttribArray(this._colorAttribLocation);
        gl.vertexAttribPointer(this._vertexAttribLocation, VERTEX_SIZE, gl.FLOAT, false, STRIDE, POSITION_OFFSET);
        gl.vertexAttribPointer(this._colorAttribLocation, COLOR_SIZE, gl.FLOAT, false, STRIDE, COLOR_OFFSET);
        gl.bufferData(gl.ARRAY_BUFFER, this._buf, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        // num of drawing elements in the buffer
        this._num_elems = num_elems;
        console.log("num_elems=", num_elems);
        return this._buf;
    }

    // Create new WebGL buffer
    // Called from native side
    createBuffer(nsize, num_elems) {
        const gl = this._context;
        
        let obj = new DrawEntry(gl, this._vertexAttribLocation, this._colorAttribLocation, nsize, num_elems);
        const new_id = this._new_draw_id
        this._draw_data[new_id] = obj;
        this._new_draw_id ++;

        return new_id;
    }

    getBuffer(id) {
        return this._draw_data[id]._buf;
    }

    // Send WebGL buffer to GPU
    // Called from native side
    sendBuffer(id) {
        const gl = this._context;

        const obj = this._draw_data[id];

        // Transfer VBO to GPU
        gl.bindBuffer(gl.ARRAY_BUFFER, obj._vertexBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, obj._buf);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    freeBuffer(id) {
        if (id >= this._draw_data.length)
            return false;
        const obj = this._draw_data[id];
        if (obj === null)
            return false;
        const gl = this._context;
        this._draw_data[id] = null;
        gl.deleteBuffer(obj._vertexBuffer);
        return true;
    }

    // Draw the scene
    // called from JS side
    displayAll() {
        const canvas = this._canvas;
        const gl = this._context;

        this._radian += 1.0 * Math.PI / 180;

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(this._program);

        this.setUpModelMat(gl, this._radian);
        let cx = canvas.width;
        let cy = canvas.height;
        gl.viewport(0, 0, cx, cy);
        this.setUpProjMat(gl, cx, cy);

        // gl.enableVertexAttribArray(this._vertexAttribLocation);
        // gl.enableVertexAttribArray(this._colorAttribLocation);
        // gl.vertexAttribPointer(this._vertexAttribLocation, VERTEX_SIZE, gl.FLOAT, false, STRIDE, POSITION_OFFSET);
        // gl.vertexAttribPointer(this._colorAttribLocation, COLOR_SIZE, gl.FLOAT, false, STRIDE, COLOR_OFFSET);
        // gl.drawArrays(gl.TRIANGLES, 0, this._num_elems);

        this._draw_data.forEach((value) => {
            if (value !==null) {
                value.draw(gl);
            }
        });

        // reset
        gl.useProgram(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.flush();
    }
    

    setUpModelMat(gl, radian) {
        const model = glmat.mat4.create();
        glmat.mat4.identity(model);
        glmat.mat4.translate(model, model, [0, 0, -this._dist]);
        glmat.mat4.rotateY(model, model, radian);

        // glmat.mat4.translate(model, model, [0, 0, 0]);

        gl.uniformMatrix4fv(this._modelLocation, false, model);
    }

    setUpProjMat(gl, cx, cy) {
        const projection = glmat.mat4.create();
        const slabdepth = 100.0;
        const slabnear = this._dist-slabdepth/2.0;
        const slabfar  = this._dist+slabdepth;
        const fasp = cx / cy;
        const vw = 100.0;
        // gl.viewport(0, 0, cx, cy);
        glmat.mat4.ortho(projection, -vw*fasp, vw*fasp,
                         -vw, vw, slabnear, slabfar);        
        gl.uniformMatrix4fv(this._projectionLocation, false, projection);
    }

}

