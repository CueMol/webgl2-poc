const fs = require('fs');
const path = require('path');
const glmat = require('gl-matrix');
console.log("glmat:", glmat)

const VERTEX_SIZE = 3; // vec3
const COLOR_SIZE  = 4; // vec4
const VERTEX_NUMS = 6 * 1000 * 1000;
const STRIDE = (VERTEX_SIZE + COLOR_SIZE) * Float32Array.BYTES_PER_ELEMENT;
const POSITION_OFFSET = 0;
const COLOR_OFFSET = VERTEX_SIZE * Float32Array.BYTES_PER_ELEMENT;


const radius = 100;

// function createBuffer(type, typedDataArray) {
//     const buffer = gl.createBuffer();
//     gl.bindBuffer(type, buffer);
//     gl.bufferData(type, typedDataArray, gl.STATIC_DRAW);
//     gl.bindBuffer(type, null);
//     return buffer;
// }

function clamp(min, max, val) {
    return Math.min(Math.max(min, +val), max);
}

function randomUniform() {
    return Math.random() - 0.5;
}

const tri_size = 0.1;
const vertices_orig = [
    -tri_size, tri_size,  0.0,
    1.0, 0.0, 0.0, 1.0,
    -tri_size, -tri_size, 0.0,
    0.0, 1.0, 0.0, 1.0,
    tri_size,  tri_size,  0.0,
    0.0, 0.0, 1.0, 1.0,
    -tri_size, -tri_size, 0.0,
    0.0, 1.0, 0.0, 1.0,
    tri_size,  -tri_size, 0.0,
    0.0, 0.0, 0.0, 1.0,
    tri_size,  tri_size,  0.0,
    0.0, 0.0, 1.0, 1.0,
];

module.exports = class WebGLRender {
    constructor() {
        this._radian = 0;
        this._dist = 100;
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


    setupProjectionUniforms(gl, radian) {
        const model = glmat.mat4.create();
        glmat.mat4.identity(model);

        const fovY = 60 * Math.PI / 180;
        const aspect = 500 / 500;
        const near = 30;
        const far  = 300;
        const projection = glmat.mat4.create();
        glmat.mat4.perspective(projection, fovY, aspect, near, far);

        gl.uniformMatrix4fv(this._modelLocation, false, model);
        gl.uniformMatrix4fv(this._projectionLocation, false, projection);

        const cameraPosition = [Math.sin(radian)*radius, 100.0, Math.cos(radian)*radius];
        const lookAtPosition = [0, 0, 0];
        const upDirection    = [0.0, 1.0, 0.0];
        const view  = glmat.mat4.create();
        glmat.mat4.lookAt(view, cameraPosition, lookAtPosition, upDirection);
        gl.uniformMatrix4fv(this._viewLocation, false, view);
    }


    init(canvas) {
        const gl = canvas.getContext('webgl2');

        let program = this.loadShader(gl);
        gl.useProgram(program);
        this._program = program;

        gl.enable(gl.DEPTH_TEST);
        // gl.enable(gl.CULL_FACE);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);

        // Get attrib/unif loc from program object
        this._vertexAttribLocation = gl.getAttribLocation(program, 'vertexPosition');
        this._colorAttribLocation  = gl.getAttribLocation(program, 'color');
        this._modelLocation = gl.getUniformLocation(program, 'model');
        this._viewLocation = gl.getUniformLocation(program, 'view');
        this._projectionLocation = gl.getUniformLocation(program, 'projection');

        // Prepare vertex data
        this._vertices = new Float32Array(VERTEX_NUMS * (VERTEX_SIZE + COLOR_SIZE));
        for (let i=0; i<VERTEX_NUMS/6; ++i) {
            const bias = i * 6 * (VERTEX_SIZE + COLOR_SIZE); 
            for (let j=0; j<6*(VERTEX_SIZE + COLOR_SIZE); ++j) {
                this._vertices[bias + j] = vertices_orig[j];
            }
        }

        // Prepare VBO
        this._vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.enableVertexAttribArray(this._vertexAttribLocation);
        gl.enableVertexAttribArray(this._colorAttribLocation);
        gl.vertexAttribPointer(this._vertexAttribLocation, VERTEX_SIZE, gl.FLOAT, false, STRIDE, POSITION_OFFSET);
        gl.vertexAttribPointer(this._colorAttribLocation, COLOR_SIZE, gl.FLOAT, false, STRIDE, COLOR_OFFSET);

        // Transfer VBO to GPU
        gl.bufferData(gl.ARRAY_BUFFER, this._vertices, gl.STATIC_DRAW);

        // reset
        gl.useProgram(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        
        console.log("Initialized", VERTEX_NUMS * (VERTEX_SIZE + COLOR_SIZE));
    }

    changeData() {
        const scl = 0.1;
    
         for (let i=0; i<VERTEX_NUMS; ++i) {
        //for (let i=0; i<6 * 10; ++i) {
            const bias = (VERTEX_SIZE + COLOR_SIZE) * i;
            this._vertices[bias + 0] += randomUniform() * scl;
            this._vertices[bias + 1] += randomUniform() * scl;
            this._vertices[bias + 2] += randomUniform() * scl;

            this._vertices[bias + 3] = clamp(0, 1, randomUniform()*0.1 + this._vertices[bias + 3]);
            this._vertices[bias + 4] = clamp(0, 1, randomUniform()*0.1 + this._vertices[bias + 4]);
            this._vertices[bias + 5] = clamp(0, 1, randomUniform()*0.1 + this._vertices[bias + 5]);
        }

    }

    render(canvas) {
        const gl = canvas.getContext('webgl2');
        // let program = this.loadShader(gl);

        this._radian += 1.0 * Math.PI / 180;

        // gl.clearColor(0.0, 0.0, 0.0, 1.0);
        // gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(this._program);

        // this.setupProjectionUniforms(gl, this._radian);
        this.setUpModelMat(gl, this._radian);
        let cx = canvas.width;
        let cy = canvas.height;
        gl.viewport(0, 0, cx, cy);
        this.setUpProjMat(gl, cx, cy);

        this.changeData();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this._vertices);
        // gl.bufferData(gl.ARRAY_BUFFER, this._vertices, gl.STATIC_DRAW);

        // gl.enableVertexAttribArray(this._vertexAttribLocation);
        // gl.enableVertexAttribArray(this._colorAttribLocation);
        // gl.vertexAttribPointer(this._vertexAttribLocation, VERTEX_SIZE, gl.FLOAT, false, STRIDE, POSITION_OFFSET);
        // gl.vertexAttribPointer(this._colorAttribLocation, COLOR_SIZE, gl.FLOAT, false, STRIDE, COLOR_OFFSET);

        gl.drawArrays(gl.TRIANGLES, 0, VERTEX_NUMS);

        // reset
        gl.useProgram(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.flush();
        // console.log("render OK.", this._radian);
    }

    loadShader(gl) {
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
}
