const fs = require('fs');
const path = require('path');
const glmat = require('gl-matrix');
console.log("glmat:", glmat)

const VERTEX_SIZE = 3; // vec3
const COLOR_SIZE  = 4; // vec4
const VERTEX_NUMS = 6 * 1000; // * 1000;
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

const tri_size = 10.0;
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

const move_scl = 0.1;

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

class GLObject {
    constructor(offset_x, offset_y, offset_z, move_scl, col_scl) {
        this._offset_x = offset_x;
        this._offset_y = offset_y;
        this._offset_z = offset_z;
        this._move_scl = move_scl
        this._color_scl = col_scl
    }

    init(gl, val, cal) {
        let program = loadShader(gl);
        gl.useProgram(program);
        this._program = program;

        // Get attrib/unif loc from program object
        this._vertexAttribLocation = val
        this._colorAttribLocation  = cal

        // Prepare vertex data
        this._vertices = new Float32Array(VERTEX_NUMS * (VERTEX_SIZE + COLOR_SIZE));
        for (let i=0; i<VERTEX_NUMS/6; ++i) {
            const bias = i * 6 * (VERTEX_SIZE + COLOR_SIZE); 
            for (let j=0; j<6*(VERTEX_SIZE + COLOR_SIZE); ++j) {
                this._vertices[bias + j] = vertices_orig[j];
            }
        }
        for (let i=0; i<VERTEX_NUMS; ++i) {
            const bias = (VERTEX_SIZE + COLOR_SIZE) * i;
            this._vertices[bias + 0] += this._offset_x;
            this._vertices[bias + 1] += this._offset_y;
            this._vertices[bias + 2] += this._offset_z;
        }

        // Prepare VAO
        this._vao = gl.createVertexArray();
        gl.bindVertexArray(this._vao);

        gl.enableVertexAttribArray(this._vertexAttribLocation);
        gl.enableVertexAttribArray(this._colorAttribLocation);

        // Prepare VBO
        this._vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.vertexAttribPointer(this._vertexAttribLocation, VERTEX_SIZE, gl.FLOAT, false, STRIDE, POSITION_OFFSET);
        gl.vertexAttribPointer(this._colorAttribLocation, COLOR_SIZE, gl.FLOAT, false, STRIDE, COLOR_OFFSET);

        // Transfer VBO to GPU
        gl.bufferData(gl.ARRAY_BUFFER, this._vertices, gl.STATIC_DRAW);

        // reset
        gl.bindVertexArray(null);
        gl.useProgram(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        
        console.log("Initialized", VERTEX_NUMS * (VERTEX_SIZE + COLOR_SIZE));
    }

    changeData() {
         for (let i=0; i<VERTEX_NUMS; ++i) {
        //for (let i=0; i<6 * 10; ++i) {
            const bias = (VERTEX_SIZE + COLOR_SIZE) * i;
            this._vertices[bias + 0] += randomUniform() * this._move_scl;
            this._vertices[bias + 1] += randomUniform() * this._move_scl;
            this._vertices[bias + 2] += randomUniform() * this._move_scl;

            this._vertices[bias + 3] = clamp(0, 1, randomUniform()*this._color_scl + this._vertices[bias + 3]);
            this._vertices[bias + 4] = clamp(0, 1, randomUniform()*this._color_scl + this._vertices[bias + 4]);
            this._vertices[bias + 5] = clamp(0, 1, randomUniform()*this._color_scl + this._vertices[bias + 5]);
        }
    }

    draw(gl) {
        this.changeData();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this._vertices);
        // gl.bufferData(gl.ARRAY_BUFFER, this._vertices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.bindVertexArray(this._vao);
        gl.drawArrays(gl.TRIANGLES, 0, VERTEX_NUMS);

        // reset
        gl.bindVertexArray(null);
    }
}

module.exports = class WebGLRender {
    constructor() {
        this._radian = 0;
        this._dist = 100;

        this._data = [];
        this._data[0] = new GLObject(0, 0, 0,  0.1, 0.001);
        // this._data[1] = new GLObject(0, 0, 50, 1.0, 0.2);
        // this._data[2] = new GLObject(0, 50, 0, 0.2, 0.1);
        // this._data[3] = new GLObject(50, 0, 0, 0.5, 0.5);
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


    init_old(canvas) {
        const gl = canvas.getContext('webgl2');

        gl.enable(gl.DEPTH_TEST);
        // gl.enable(gl.CULL_FACE);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);

        let program = loadShader(gl);
        gl.useProgram(program);
        this._program = program;

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

        // Prepare VAO
        this._vao = gl.createVertexArray();
        gl.bindVertexArray(this._vao);

        gl.enableVertexAttribArray(this._vertexAttribLocation);
        gl.enableVertexAttribArray(this._colorAttribLocation);

        // Prepare VBO
        this._vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.vertexAttribPointer(this._vertexAttribLocation, VERTEX_SIZE, gl.FLOAT, false, STRIDE, POSITION_OFFSET);
        gl.vertexAttribPointer(this._colorAttribLocation, COLOR_SIZE, gl.FLOAT, false, STRIDE, COLOR_OFFSET);

        // Transfer VBO to GPU
        gl.bufferData(gl.ARRAY_BUFFER, this._vertices, gl.STATIC_DRAW);

        // reset
        gl.bindVertexArray(null);
        gl.useProgram(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        
        console.log("Initialized", VERTEX_NUMS * (VERTEX_SIZE + COLOR_SIZE));
    }

    init(canvas) {
        const gl = canvas.getContext('webgl2');

        gl.enable(gl.DEPTH_TEST);
        // gl.enable(gl.CULL_FACE);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);

        let program = loadShader(gl);
        gl.useProgram(program);
        this._program = program;

        // Get attrib/unif loc from program object
        this._vertexAttribLocation = gl.getAttribLocation(program, 'vertexPosition');
        this._colorAttribLocation  = gl.getAttribLocation(program, 'color');
        this._modelLocation = gl.getUniformLocation(program, 'model');
        this._viewLocation = gl.getUniformLocation(program, 'view');
        this._projectionLocation = gl.getUniformLocation(program, 'projection');

        this._data.forEach((value) => { value.init(gl, this._vertexAttribLocation, this._colorAttribLocation); });

        // reset
        gl.bindVertexArray(null);
        gl.useProgram(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    changeData() {
        const scl = 1.0;
    
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

        this._radian += 1.0 * Math.PI / 180;

        // gl.clearColor(0.0, 0.0, 0.0, 1.0);
        // gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(this._program);

        this.setUpModelMat(gl, this._radian);
        let cx = canvas.width;
        let cy = canvas.height;
        gl.viewport(0, 0, cx, cy);
        this.setUpProjMat(gl, cx, cy);

        this._data.forEach((value) => { value.draw(gl); });

        // reset
        gl.bindVertexArray(null);
        gl.useProgram(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.flush();
        // console.log("render OK.", this._radian);
    }

}
