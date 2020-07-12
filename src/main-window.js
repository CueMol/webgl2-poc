const {ipcRenderer} = require('electron');
console.log("Initializing...");

// const WebGLRender = require('./webgl_native_render');
const WebGLRender = require('./webgl_render');


// console.log(myExtension.hello());

let webgl = new WebGLRender();

const drawCanvas = () => {
    let placeholder = document.getElementById('placeholder');
    let rect = placeholder.getBoundingClientRect();
    let w = rect.width;
    let h = rect.height
    // console.log("PLH width", w, "height", h);
    // console.log("canvas rect", rect);

    let canvas = document.getElementById('canvas_area');
    canvas.width = w;
    canvas.height = h;
    
    webgl.render(canvas);
}

const resizeObserver = new ResizeObserver(entries => {
    drawCanvas();
    for (const entry of entries) {
        const rect = entry.contentRect;
        // console.log("resize called", rect);
    }
});

let fpsElem, canvas;

window.addEventListener("load", () => {
    console.log("onLoad() called!!");

    canvas = document.getElementById('canvas_area');
    // let id = mgr.registerCanvas(canvas);
    // console.log("register canvas id:", canvas.getAttribute("mgr_idx"));

    elem = document.getElementById("mybutton");
    elem.addEventListener("click", (event) => {
	    console.log("XXX.click() called!!");
        drawCanvas();
    });

    resizeObserver.observe(document.getElementById("placeholder"));

    webgl.init(canvas);
    drawCanvas();

    fpsElem = document.getElementById('fps');
});

let then = 0;

fn_ = (timestamp) => {
    timestamp *= 0.001;
    const deltaTime = timestamp - then;
    then = timestamp;
    const fps = 1 / deltaTime;
    fpsElem.textContent = fps.toFixed(1);

    // let canvas = document.getElementById('canvas_area');
    webgl.render(canvas);
    window.requestAnimationFrame(fn_);
}

window.requestAnimationFrame(fn_);
