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
const SPACING = 35;
const SIZE = 36.25;

class PixiLayer extends React.Component {
    constructor(props) {
        super(props);

        this.setup = this.setup.bind(this);
        this.draw = this.draw.bind(this);
        this.resizeHandler = this.resizeHandler.bind(this);
        this.mousePressed = this.mousePressed.bind(this);
    }

    draw() {
        this.graphics.clear();

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        const mp = this.app.renderer.plugins.interaction.mouse.global;

        for (const a of this.glircleObjects) {
            minX = Math.min(a.x, minX);
            minY = Math.min(a.y, minY);
            maxX = Math.max(a.x, maxX);
            maxY = Math.max(a.y, maxY);
        }

        for (const a of this.image.targetDots) {
            minX = Math.min(a.x, minX);
            minY = Math.min(a.y, minY);
            maxX = Math.max(a.x, maxX);
            maxY = Math.max(a.y, maxY);
        }

        minX = Math.min(mp.x, minX);
        minY = Math.min(mp.y, minY);
        maxX = Math.max(mp.x, maxX);
        maxY = Math.max(mp.y, maxY);

        const radius = Math.max(maxX - minX, maxY - minY) / 2;
        const root = new Quad((maxX + minX) / 2, (maxY + minY) / 2, radius);

        for (const a of this.glircleObjects) {
            root.insert(a);
        }

        this.graphics.lineStyle(2, 0x77EBEE, 1);
        for (const dot of this.image.targetDots) {
            //this.graphics.drawCircle(dot.x, dot.y, SIZE / 4);
            //root.insert(dot)
        }

        this.graphics.lineStyle(2, 0x88AA22, 1);
        this.graphics.drawCircle(mp.x, mp.y, SIZE / 4);
        root.insert(mp);

        this.graphics.lineStyle(2, 0xFEEB77, 1);
        this.graphics.drawRect(root.x - root.r, root.y - root.r, root.r * 2, root.r * 2);
        this.graphics.lineStyle(2, 0xAEEB77, 1);
        this.graphics.drawRect(this.image.x, this.image.y, this.image.w, this.image.h);

        for (const a of this.glircleObjects) {
            //find closest unoccupied dot
            let closest = null;
            let closestDist = Infinity;
            for (const v of this.image.targetDots) {
                const dist = a.dist(v);
                if (dist < closestDist) {
                    closestDist = dist;
                    closest = v;
                }
            }

            if (closest) {
                a.vx += Math.cos(a.angle(closest)) * closestDist * 0.01;
                a.vy += Math.sin(a.angle(closest)) * closestDist * 0.01;
            } else {
                //go to center of image
                if (this.image.ready) {
                    const img = {x:this.image.x + this.image.w * 0.5, y: this.image.y + this.image.h * 0.5}
                    a.vx += Math.cos(a.angle(img)) * 0.01;
                    a.vy += Math.sin(a.angle(img)) * 0.01;
                }
            }
        }


        //Spring electric
        const K = SPACING * 1.5;
        const C = 0.2;

        //repulsion
        for (const a of this.glircleObjects) {
            const nodes = root.getInRadius(a.x, a.y, SIZE / 4);
            for (const b of nodes) {
                if (a === b) continue;
                const f = (-1 * C * K * K) / a.dist(b);
                a.vx += Math.cos(a.angle(b)) * f * 0.025;
                a.vy += Math.sin(a.angle(b)) * f * 0.025;
            }
        }


        if (this.image.ready) {
            for (const a of this.glircleObjects) {
                a.sprite.tint = this.image.r * 0x010000 + this.image.g * 0x000100 + this.image.b * 1;
            }
        }

        for (const a of this.glircleObjects) {
            a.vx = Math.max(Math.min(a.vx, 15), -15);
            a.vy = Math.max(Math.min(a.vy, 15), -15);
            a.x += a.vx;
            a.y += a.vy;
            a.vx /= 1.1;
            a.vy /= 1.1;
            a.sprite.x = a.x;
            a.sprite.y = a.y;
        }
    }

    mousePressed(e) {
        const mp = this.app.renderer.plugins.interaction.mouse.global;
        this.image.targetDots.push({x: mp.x, y: mp.y});
        console.log(JSON.stringify(this.image.targetDots));
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
        const vfY = 800
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

        this.graphics = new PIXI.Graphics();

        this.mainStage = new PIXI.Container();
        this.mainStage.addChild(this.vf);
        this.mainStage.addChild(this.graphics);
        this.mainStage.addChild(this.glircles);
        this.app.stage.addChild(this.mainStage);

        this.image = new GlircleImage(vfX, vfY,
            "logo512.png",
            97, 218, 251);
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
                onMouseDown={this.mousePressed}
            >
            </div>
        )
    }
}

export default PixiLayer;