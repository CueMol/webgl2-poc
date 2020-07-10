module.exports = class Manager {
    constructor() {
        this._idgen = 0;
        this._data = {};

        this._idgen_buf = 0;
        this._buffer = {};
    }
    
    getX() {
        console.log("getX Called: ", this._idgen);
        return this._idgen;
    }

    registerCanvas(elem) {
        this._data[this._idgen] = elem;
        elem.setAttribute("mgr_idx", this._idgen);
        this._idgen ++;
        return this._idgen;
    }

    allocBuffer(id, width, height) {
        console.log("allocbuffer called:", id, width, height);
        if (!id in this._data) {
            return -1;
        }
        let canvas = this._data[id];
        let context = canvas.getContext('2d');
        let imageData = context.createImageData(width, height);

        let newbufid = this._idgen_buf;
        this._buffer[newbufid] = imageData;
        this._idgen_buf++;

        return newbufid;
    }

    getBufferPtr(id) {
        console.log("getBufferPtr called:", id);
        if (!id in this._buffer) {
            return 0;
        }
        return this._buffer[id].data;
    }

    drawBuffer(id_wgt, id_buf) {
        console.log("drawBuffer called:", id_wgt, id_buf);
        if (!id_wgt in this._data) {
            return false;
        }
        if (!id_buf in this._buffer) {
            return false;
        }
        
        let canvas = this._data[id_wgt];
        let context = canvas.getContext('2d');

        let buf = this._buffer[id_buf];
        context.putImageData(buf, 0, 0);
        return true;
    }
    
    freeBuffer(id) {
        if (!id in this._buffer) {
            return false;
        }
        delete this._buffer[id];
        return true;
    }
}
