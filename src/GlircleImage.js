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
        this.ready = false;
        this.targetDots = [];
        this.targetDots = [{"x":817,"y":881},{"x":956,"y":1205},{"x":1084,"y":1130},{"x":1057,"y":1050},{"x":1086,"y":981},{"x":1011,"y":969},{"x":956,"y":904},{"x":904,"y":970},{"x":825,"y":984},{"x":854,"y":1067},{"x":957,"y":1024},{"x":931,"y":1036},{"x":926,"y":1057},{"x":932,"y":1079},{"x":956,"y":1087},{"x":977,"y":1082},{"x":985,"y":1064},{"x":985,"y":1039},{"x":957,"y":1059},{"x":726,"y":1054},{"x":825,"y":1132},{"x":850,"y":1262},{"x":1065,"y":1260},{"x":1189,"y":1055},{"x":1069,"y":851},{"x":862,"y":850},{"x":909,"y":870},{"x":763,"y":1008},{"x":764,"y":1108},{"x":819,"y":1179},{"x":819,"y":1225},{"x":915,"y":1244},{"x":901,"y":1142},{"x":1010,"y":1143},{"x":1152,"y":1103},{"x":1150,"y":1006},{"x":1032,"y":1107},{"x":958,"y":1147},{"x":877,"y":1101},{"x":876,"y":1018},{"x":841,"y":1101},{"x":795,"y":1120},{"x":740,"y":1091},{"x":735,"y":1027},{"x":794,"y":996},{"x":822,"y":1154},{"x":817,"y":1202},{"x":827,"y":1250},{"x":875,"y":1257},{"x":935,"y":1176},{"x":854,"y":1138},{"x":846,"y":1040},{"x":834,"y":1011},{"x":822,"y":948},{"x":818,"y":926},{"x":848,"y":973},{"x":870,"y":971},{"x":935,"y":968},{"x":963,"y":965},{"x":923,"y":941},{"x":981,"y":936},{"x":995,"y":877},{"x":1029,"y":857},{"x":1086,"y":870},{"x":1092,"y":894},{"x":1093,"y":920},{"x":1095,"y":946},{"x":1179,"y":1034},{"x":1182,"y":1076},{"x":1170,"y":1094},{"x":1135,"y":1113},{"x":1091,"y":1166},{"x":1095,"y":1189},{"x":1094,"y":1214},{"x":1091,"y":1237},{"x":1044,"y":1260},{"x":1020,"y":1254},{"x":997,"y":1240},{"x":982,"y":1228},{"x":980,"y":1177},{"x":1046,"y":1140},{"x":1079,"y":1097},{"x":1040,"y":1016},{"x":1068,"y":1017},{"x":1082,"y":1005},{"x":1026,"y":995},{"x":1038,"y":973},{"x":1063,"y":979},{"x":1012,"y":860},{"x":937,"y":1229},{"x":1083,"y":1254},{"x":1113,"y":1121},{"x":1046,"y":1081},{"x":1065,"y":1074},{"x":1107,"y":992},{"x":1129,"y":991},{"x":975,"y":885},{"x":1048,"y":851},{"x":997,"y":950},{"x":990,"y":970},{"x":937,"y":922},{"x":934,"y":884},{"x":828,"y":859},{"x":887,"y":857},{"x":929,"y":1146},{"x":984,"y":1145},{"x":918,"y":1165},{"x":882,"y":1146},{"x":891,"y":1120},{"x":885,"y":991},{"x":887,"y":972},{"x":962,"y":912},{"x":1018,"y":1122},{"x":990,"y":1159},{"x":1055,"y":1136},{"x":1090,"y":1132},{"x":1165,"y":1014}];

        getPixels(imageName, (err, pixels) => {
            if(err) {
                console.log("Bad image path")
                return;
            }

            this.pixels = pixels;
            this.w = pixels.shape[0];
            this.h = pixels.shape[1];
            this.channels = pixels.shape[2];
            this.ready = true;
        })

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