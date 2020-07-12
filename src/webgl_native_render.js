const Manager = require('./context-manager');
const myExtension = require('../build/Release/my_extension');

const VERTEX_SIZE = 3; // vec3
const COLOR_SIZE  = 4; // vec4
const VERTEX_NUMS = 6 * 1000 * 100;
const STRIDE = (VERTEX_SIZE + COLOR_SIZE) * Float32Array.BYTES_PER_ELEMENT;
const POSITION_OFFSET = 0;
const COLOR_OFFSET = VERTEX_SIZE * Float32Array.BYTES_PER_ELEMENT;


const radius = 100;

module.exports = class WebGLRender {
    constructor() {
    }

    init(canvas) {
        this._mgr = new Manager();
        this._mgr.init(canvas);

        // This should be called from native side??
        // this._mgr.createBuffer();
        
        this._proxy = new myExtension.GLProxyManager();
        this._proxy.setManager(this._mgr);
        this._proxy.create();
    }

    render(canvas) {
        this._proxy.render(this._mgr._buf);
        this._mgr.sendBuffer();
        this._mgr.displayAll();
    }
}
