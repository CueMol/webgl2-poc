const {ipcRenderer} = require('electron');
console.log("Initializing...");
// import Manager from './context-manager.js'
const Manager = require('./context-manager');


const myExtension = require('../build/Release/my_extension');
// console.log(myExtension.hello());

var myobject = new myExtension.MyObject(10);


let mgr = new Manager();
myobject.setManager(mgr);

console.log(myobject.getValue());

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

    let wgt_id = parseInt(canvas.getAttribute("mgr_idx"));
    console.log("typeof wgt_id", typeof wgt_id);
    myobject.render(wgt_id, w, h);

    // let context = canvas.getContext('2d');
    // let imageData = context.createImageData(w, h);
    // myExtension.hello(imageData.data)
    // context.putImageData(imageData, 0, 0);
}

const resizeObserver = new ResizeObserver(entries => {
    drawCanvas();
    for (const entry of entries) {
        const rect = entry.contentRect;
        // console.log("resize called", rect);
    }
});

window.addEventListener("load", () => {
    console.log("onLoad() called!!");

    let canvas = document.getElementById('canvas_area');
    let id = mgr.registerCanvas(canvas);
    console.log("register canvas id:", canvas.getAttribute("mgr_idx"));

    elem = document.getElementById("mybutton");
    elem.addEventListener("click", (event) => {
	    console.log("XXX.click() called!!");
        drawCanvas();
    });

    resizeObserver.observe(document.getElementById("placeholder"));

    drawCanvas();
});