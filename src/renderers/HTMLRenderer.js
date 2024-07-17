import BaseRenderer from "./BaseRenderer";

export { ASCII_CHARSET, SIMPLE_CHARSET } from "./BaseRenderer";

export default function factory(options) {
    const renderer = new HTMLRenderer(options);

    return data => renderer.render(data);
}

export class HTMLRenderer extends BaseRenderer {

    constructor(options) {
        super(Object.assign({}, {
            tagName: "pre",
            fontSize: 7,
            background: "#fff",
            color: "#000"
                }, options));

        this.el = this.options.el || document.createElement(this.options.tagName);
        this.el.style.fontSize = this.options.fontSize + "px";
        this.el.style.fontFamily = this.options.fontFamily;
        this.el.style.backgroundColor = this.options.background;
        this.el.style.color = this.options.color;

        // if (this.options.gradient) {
        //     this.createGradient();
        // } else {
        //     this.el.style.backgroundColor = this.options.background;
        // }
    }
    render(image) {
        super.render(image);
        // this.el.style.color = this.gradient;

        // if (!image.meta.colored) {
        //     this.el.style.color = this.options.color;
        // }
        const renderer = monoRenderer(this.el);

        // const renderer =  image.meta.colored
        //     ? colorRenderer(this.el)
        //     : monoRenderer(this.el);
            // when it is not colored, it is mono 
        return renderer(image);
    }

    createGradient(){
        const gradient = this.options.gradient.map((color, index) => {
            return `${color} ${(index / (this.options.gradient.length - 1)) * 100}%`;
        }).join(', ');
    
        this.gradient = gradient;

        // this.el.style.color = `linear-gradient(0deg, ${gradientStops})`;
        console.log("color in create gradient is ",gradient);
    
        // const gradient = this.ctx.createLinearGradient(0, 0, this.el.width, this.el.height);
        // this.options.gradient.forEach((color, index) => {
        //     gradient.addColorStop(index / (this.options.gradient.length - 1), color);
        // });
        // this.gradient = gradient;
        // console.log("create gradient in HTML RENDERER ",gradient);

    }
}

function colorRenderer(el) {
    const wrapInColor = ({ char, r, g, b , a }) => (
        `<span style="color: rgba(${ r }, ${ g }, ${ b }, ${ a })">${ char }</span>`
    );

    const toString = stringRenderer(wrapInColor);

    return image => {
        el.innerHTML = toString(image);
        return el;
    };
}

function monoRenderer(el) {
    const toString = stringRenderer(({ char }) => char);

    return image => {
        el.textContent = toString(image);
        return el;
    };
}

function stringRenderer(renderPixel) {
    return ({ width, data }) => {
        let str = "";
        let w = width;

        for (let i = 0, length = data.length; i < length; i++, w--) {
            if (w === 0) {
                str += "\n";
                w = width;
            }

            str += renderPixel(data[i]);
        }

        return str;
    };
}