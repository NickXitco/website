export default class Glircle {
    constructor(x, y, size, sprite) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.sprite = sprite;
        this.color = this.sprite.tint;
        this.vx = 0;
        this.vy = 0;
        this.neighbors = [];
    }

    dist(other) {
        return Math.hypot(this.x - other.x, this.y - other.y);
    }

    angle(other) {
        return Math.atan2(other.y - this.y, other.x - this.x);
    }

    tint(r, g, b) {
        this.sprite.tint = (0x10000) * Math.min(255, r) + (0x100) * Math.min(255, g) + Math.min(255, b);
    }

    getTint() {
        const r = (this.sprite.tint >> 16) & 255;
        const g = (this.sprite.tint >> 8) & 255;
        const b = this.sprite.tint & 255
        return [r, g, b];
    }
}