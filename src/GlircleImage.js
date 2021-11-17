import getPixels from 'get-pixels';

class GlircleImage {
    constructor(x, y, imageName, r, g, b) {
        this.x = x;
        this.y = y;
        this.w = 0;
        this.h = 0;
        this.pixels = [];
        this.channels = 4;
        this.r = r;
        this.g = g;
        this.b = b;
        this.ready = false


        getPixels(imageName, (err, pixels) => {
            if(err) {
                console.log("Bad image path")
                return;
            }

            this.pixels = pixels;
            this.w = pixels.shape[0];
            this.h = pixels.shape[1];
            this.channels = pixels.shape[2];
            this.createVectorField();
            this.ready = true;
        })

    }

    createVectorField() {
        //Create an empty 2d array with dimensions w x h. We'll be filling this with various vectors
        this.vectorField = Array.from(Array(this.w), () => new Array(this.h));

        for (let x = 0; x < this.w; x++) {
            for (let y = 0; y < this.h; y++) {
                const pixel = this.getPixel(x, y);
                const xVec = (pixel[0] - 128) / 128;
                const yVec = (pixel[1] - 128) / 128;
                this.vectorField[x][y] = {x: xVec, y: yVec};
            }
        }
    }

    getPixel(x, y) {
        const pixel = [];
        for (let i = 0; i < this.channels; i++) {
            pixel.push(this.pixels.data[this.pixels.offset + this.pixels.stride[0] * x + this.pixels.stride[1] * y + i]);
        }

        return pixel;
    }

    getVector(x, y) {
        const col = this.vectorField[x];
        if (col) {
            const pixel = col[y];
            if (pixel) {
                return pixel;
            }
            return {x: 0, y: 0};
        } else {
            return {x: 0, y: 0};
        }
    }

    inImage(x, y) {
        const translatedX = x - this.x;
        const translatedY = y - this.y;
        return translatedX >= 0 && translatedX < this.w && translatedY >= 0 && translatedY < this.h
    }

    sample(x, y) {
        const sample = {
            a: 0,
            inImage: false,
            fx: 0,
            fy: 0
        }

        if (!this.inImage(x, y)) return sample;
        sample.inImage = true;

        const _x = Math.floor(x - this.x);
        const _y = Math.floor(y - this.y);
        const a = (x - this.x) - _x;
        const b = (y - this.y) - _y;

        const nw = this.getVector(_x, _y);
        const ne = this.getVector(_x + 1, _y);
        const sw = this.getVector(_x, _y + 1);
        const se = this.getVector(_x + 1, _y + 1);

        if (!nw || !ne ||!sw || !se) {
            console.log(nw);
        }

        sample.fX = (1 - a) * (1- b) * nw.x + a * (1 - b) * ne.x + (1 - a) * b * sw.x + a * b * se.x;
        sample.fY = (1 - a) * (1- b) * nw.y + a * (1 - b) * ne.y + (1 - a) * b * sw.y + a * b * se.y;

        const mag = Math.hypot(sample.fX, sample.fY);
        sample.a = 1 - Math.min(1, mag);
        return sample;
    }
}

export default GlircleImage;