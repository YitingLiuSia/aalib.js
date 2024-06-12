import BaseRenderer from "./BaseRenderer";

export { ASCII_CHARSET, SIMPLE_CHARSET } from "./BaseRenderer";

export default function factory(options) {
    const renderer = new CanvasRenderer(options);
    return image => renderer.render(image);
}

export class CanvasRenderer extends BaseRenderer {

    constructor(options) {
        super(Object.assign({}, {
            fontSize: 7,
            lineHeight: 7,
            charWidth: 4.2,
            width: 400,
            height: 300,
            background: "#fff",
            color: "#000",
            gradient: null // Adding gradient option
        }, options));

        this.el = this.options.el || document.createElement("canvas");
        this.el.width = this.options.width;
        this.el.height = this.options.height;

        this.ctx = this.el.getContext("2d");
        this.ctx.textBaseline = "top";
        this.ctx.textAlign = "start";
        this.ctx.font = this.options.fontSize + "px " + this.options.fontFamily;

        if (this.options.gradient) {
            this.createGradientWithPosition();
            // this.createGradient(); but the color has no position but index

        } else {
            this.el.style.backgroundColor = this.options.background;
        }
    }

    createGradient() {
        const gradient = this.ctx.createLinearGradient(0, 0, this.el.width, this.el.height);
        this.options.gradient.forEach((color, index) => {
            gradient.addColorStop(index / (this.options.gradient.length - 1), color);
        });
        this.gradient = gradient;
    }

    createGradientWithPosition() {
        const gradient = this.ctx.createLinearGradient(0, 0, this.el.width, this.el.height);
        // Assuming this.options.gradient is an array of objects like [{color: '#fff', position: 0.5}, ...]
        this.options.gradient.forEach((stop) => {
            gradient.addColorStop(stop.position, stop.color);
        });
        console.log("this gradient is ",gradient);
        this.gradient = gradient;
    }

    render(image) {
        super.render(image);

        this.clearCanvas();

        const renderer = image.meta.colored
            ? colorRenderer(this.ctx, this.options)
            : monoRenderer(this.ctx, this.options);

        renderer(image);

        return this.el;
    }

    clearCanvas() {
        if (this.gradient) {
            this.ctx.fillStyle = this.gradient;
        } else {
            this.ctx.fillStyle = this.options.background;
        }
        this.ctx.fillRect(0, 0, this.el.width, this.el.height);
    }
}

function colorRenderer(ctx, options) {
    return ({ data, width }) => {
        const { charWidth, lineHeight } = options;
        let x;
        let y;
        let color;

        let i = data.length;
        while (i--) {
            x = i % width;
            y = ~~(i / width);
            color = data[i];

            ctx.fillStyle = `rgb(${ color.r }, ${ color.g }, ${ color.b })`;
            ctx.fillText(data[i].char, x * charWidth, y * lineHeight);
        }
    };
}

function monoRenderer(ctx, options) {
    return ({ data, width }) => {
        const lineHeight = options.lineHeight;
        let y;
        let line = "";

        ctx.fillStyle = options.color;

        for (let i = 0, length = data.length; i < length; i += width) {
            y = ~~(i / width);
            line = "";

            for (let j = i; j < i + width; j++) {
                line += data[j].char;
            }

            ctx.fillText(line, 0, y * lineHeight);
        }
    };
}
