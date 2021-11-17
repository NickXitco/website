import './App.css';
import React from "react";
import * as PIXI from "pixi.js";
import glircle from './glircle.png';
import vf from './logo512.png';
import Glircle from "./Glircle";
import Quad from "./Quad";
import GlircleImage from "./GlircleImage";

const ROWS = 22;
const COLS = 28;
const X_OFFSET = 768.75;
const Y_OFFSET = 46.5;
const SPACING = 25;
const SIZE = 26.25;

class PixiLayer extends React.Component {
    constructor(props) {
        super(props);

        this.setup = this.setup.bind(this);
        this.draw = this.draw.bind(this);
        this.resizeHandler = this.resizeHandler.bind(this);
    }

    draw() {
        this.graphics.clear();

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        for (const a of this.glircleObjects) {
            minX = Math.min(a.x, minX);
            minY = Math.min(a.y, minY);
            maxX = Math.max(a.x, maxX);
            maxY = Math.max(a.y, maxY);
        }

        const radius = Math.max(maxX - minX, maxY - minY) / 2;
        const root = new Quad((maxX + minX) / 2, (maxY + minY) / 2, radius);

        for (const a of this.glircleObjects) {
            root.insert(a);
        }

        this.graphics.lineStyle(2, 0xFEEB77, 1);
        this.graphics.drawRect(root.x - root.r, root.y - root.r, root.r * 2, root.r * 2);
        this.graphics.drawRect(this.image.x, this.image.y, this.image.x + this.image.w, this.image.y + this.image.h);

        //TODO show an error at the mouse pointer of the current force acting on it

        const mp = this.app.renderer.plugins.interaction.mouse.global;
        let mpX = 0;
        let mpY = 0;

        if (this.image.inImage(mp.x, mp.y)) {
            const sample = this.image.sample(mp.x, mp.y);

            if (!sample.inImage) {
                this.graphics.drawRect(0, 0, 150, 150);
            }

            mpX += sample.fX / 10;
            mpY += sample.fY / 10;
        } else {
            this.graphics.drawRect(0, 0, 50, 50);
        }

        // const a = mp;
        // const destPoint = {x: this.image.x + this.image.w / 2, y: this.image.y + this.image.h / 2};
        // const mag = Math.hypot(destPoint.x - a.x, destPoint.y - a.y) / 100000;
        //
        // mpX += mag * (destPoint.x - a.x);
        // mpY += mag * (destPoint.y - a.y);

        this.graphics.moveTo(mp.x, mp.y);
        this.graphics.lineTo(mp.x + mpX * 500, mp.y + mpY * 500);

        for (const a of root.getInRadius(mp.x, mp.y, 50)) {
            const mag = 10 / (Math.hypot(mp.x - a.x, mp.y - a.y) ** 2);
            a.vx += mag * (a.x - mp.x);
            a.vy += mag * (a.y - mp.y);
        }

        for (const a of this.glircleObjects) {
            for (const b of a.neighbors) {
                this.graphics.moveTo(a.x, a.y);
                this.graphics.lineTo(b.x, b.y);
            }
        }

        //Spring electric
        const K = 25;
        const C = 0.2;

        //repulsion
        for (const a of this.glircleObjects) {
            const nodes = root.getInRadius(a.x, a.y, 50);
            for (const b of nodes) {
                if (a === b) continue;
                const f = (-1 * C * K * K) / a.dist(b);
                a.vx += Math.cos(a.angle(b)) * f * 0.01;
                a.vy += Math.sin(a.angle(b)) * f * 0.01;
            }
        }

        //attraction
        for (const a of this.glircleObjects) {
            for (const b of a.neighbors) {
                let f = (a.dist(b) ** 2) / K;
                a.vx += Math.cos(a.angle(b)) * f * 0.05;
                a.vy += Math.sin(a.angle(b)) * f * 0.05;
            }
        }

        let averagePoint = {x: 0, y: 0};
        for (const a of this.glircleObjects) {
            averagePoint.x += a.x;
            averagePoint.y += a.y;
        }

        averagePoint.x /= this.glircleObjects.length;
        averagePoint.y /= this.glircleObjects.length;

        //Attract the edges of the net to the edges of the image
        function attract(a, b) {
            let f = (Math.hypot(a.x - b.x, a.y - b.y) ** 2) / K;
            a.vx += Math.cos(a.angle(b)) * f * 0.05;
            a.vy += Math.sin(a.angle(b)) * f * 0.05;
        }

        //Top edge
        for (let i = 0; i < COLS; i++) {
            const v = this.glircleObjects[i];
            const imageSpot = {x: this.image.x + (i / (COLS - 1)) * this.image.w, y: this.image.y};
            attract(v, imageSpot);
        }

        //Left edge
        for (let i = 0; i < ROWS; i++) {
            const v = this.glircleObjects[i * COLS];
            const imageSpot = {x: this.image.x, y: this.image.y + (i / (ROWS - 1)) * this.image.h};
            attract(v, imageSpot);
        }

        //Bottom edge
        for (let i = 0; i < COLS; i++) {
            const v = this.glircleObjects[i + (COLS * (ROWS - 1))];
            const imageSpot = {x: this.image.x + (i / (COLS - 1)) * this.image.w, y: this.image.y + this.image.h};
            attract(v, imageSpot);
        }

        //Right edge
        for (let i = 0; i < ROWS; i++) {
            const v = this.glircleObjects[i * COLS + (COLS - 1)];
            const imageSpot = {x: this.image.x + this.image.w, y: this.image.y + (i / (ROWS - 1)) * this.image.h};
            attract(v, imageSpot);
        }


        if (this.image.ready) {
            //Attractor for the center of the grid to the center of the image
            const imageCenter = {x: this.image.x + 0.5 * this.image.w, y: this.image.y + 0.5 * this.image.h};
            let f = Math.hypot(averagePoint.x - imageCenter.x, averagePoint.y - imageCenter.y);

            for (const a of this.glircleObjects) {
                a.vx += Math.cos(a.angle(imageCenter)) * f * 0.01;
                a.vy += Math.sin(a.angle(imageCenter)) * f * 0.01;

                if (this.image.inImage(a.x, a.y)) {
                    const sample = this.image.sample(a.x, a.y);

                    a.sprite.alpha = sample.a ** 4;
                    a.sprite.tint = this.image.r * 0x010000 + this.image.g * 0x000100 + this.image.b * 1;
                    a.vx += sample.fX * 5;
                    a.vy += sample.fY * 5;

                    if (sample.fX === 0 && sample.fY === 0) {
                        a.vx /= 1.2;
                        a.vy /= 1.2;
                    }

                } else {
                    a.sprite.alpha = 0;
                }
            }
        }

        for (const a of this.glircleObjects) {
            a.vx = Math.max(Math.min(a.vx, 15), -15);
            a.vy = Math.max(Math.min(a.vy, 15), -15);
            a.x += a.vx;
            a.y += a.vy;
            a.vx /= 1.05;
            a.vy /= 1.05;
            a.sprite.x = a.x;
            a.sprite.y = a.y;
        }
    }

    setup() {
        this.app = new PIXI.Application({
            resizeTo: window,
            transparent: true,
            antialias: true,
            resolution: 1
        });

        PIXI.settings.MIPMAP_TEXTURES = PIXI.MIPMAP_MODES.ON;

        this.canvas.appendChild(this.app.view);
        this.app.start();
        this.app.ticker.add(this.draw);

        this.glircles = new PIXI.Container();
        this.vf = new PIXI.Container();
        const texture = PIXI.Texture.from(glircle);
        const vfTexture = PIXI.Texture.from(vf);
        this.glircleObjects = [];

        const vfX = 700
        const vfY = 200
        const vfSprite = new PIXI.Sprite(vfTexture);
        vfSprite.x = vfX;
        vfSprite.y = vfY;
        vfSprite.alpha = 0.25;
        this.vf.addChild(vfSprite);


        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const glircle = new PIXI.Sprite(texture);
                glircle.anchor.set(0.5);
                glircle.x = X_OFFSET + col * SPACING;
                glircle.y = Y_OFFSET + row * SPACING;
                glircle.height = SIZE;
                glircle.width = SIZE;
                glircle.tint = 0xFFFFFF;
                this.glircles.addChild(glircle);
                this.glircleObjects.push(new Glircle(glircle.x, glircle.y, SIZE, glircle));
            }
        }

        //Add glircle neighbors in cardinal directions
        for (let i = 0; i < this.glircleObjects.length; i++) {
            const center = this.glircleObjects[i];
            const up = this.glircleObjects[i - COLS];
            const down = this.glircleObjects[i + COLS];
            const left = i % COLS > 0 ? this.glircleObjects[i - 1] : undefined;
            const right = i % COLS < COLS - 1 ? this.glircleObjects[i + 1] : undefined;

            if (up) {
                center.neighbors.push(up);
            }

            if (down) {
                center.neighbors.push(down);
            }

            if (left) {
                center.neighbors.push(left);
            }

            if (right) {
                center.neighbors.push(right);
            }
        }

        this.graphics = new PIXI.Graphics();

        this.mainStage = new PIXI.Container();
        this.mainStage.addChild(this.vf);
        this.mainStage.addChild(this.graphics);
        this.mainStage.addChild(this.glircles);
        this.app.stage.addChild(this.mainStage);

        this.image = new GlircleImage(vfX, vfY,
            "logo512.png",
            0, 127, 255);
    }

    componentDidMount() {
        this.setup();
        window.addEventListener('resize', this.resizeHandler);
    }

    componentWillUnmount() {
        this.app.stop();
    }

    resizeHandler() {
        console.log("hello!")
    }

    render() {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                }}
                ref={r => {this.canvas = r}}
                className={'pixi'}
            >
            </div>
        )
    }
}

export default PixiLayer;