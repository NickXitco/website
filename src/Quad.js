class Quad {
    a;
    b;
    c;
    d;

    r;
    x;
    y;

    node;

    constructor(x, y, r) {
        this.a = null;
        this.b = null;
        this.c = null;
        this.d = null;

        this.r = r;
        this.x = x;
        this.y = y;

        this.node = null;

        this.centerOfMass = {x: 0, y: 0, s: 0};
    }

    insert(node) {
        if (!this.inBounds(node)) {
            return false;
        }

        if (!this.node && !this.a) {
            this.node = node;
            return true;
        }

        if (!this.a) {
            this.split();
        }

        if (this.a.insert(node)) return true;
        if (this.b.insert(node)) return true;
        if (this.c.insert(node)) return true;
        if (this.d.insert(node)) return true;        // noinspection RedundantIfStatementJS

        return false;
    }


    split() {
        const half = this.r / 2;
        this.a = new Quad(this.x - half, this.y - half, half);
        this.b = new Quad(this.x + half, this.y - half, half);
        this.c = new Quad(this.x - half, this.y + half, half);
        this.d = new Quad(this.x + half, this.y + half, half);

        this.a.insert(this.node);
        this.b.insert(this.node);
        this.c.insert(this.node);
        this.d.insert(this.node);

        this.node = null;
    }

    getNodesInRange(l1, r1) {
        let points = [];
        if (!this.boundaryIntersect(l1, r1)) {
            return points;
        }

        if (this.node) {
            points.push(this.node);
        }

        if (!this.a) {
            return points;
        }

        points = points.concat(this.a.getNodesInRange(l1, r1));
        points = points.concat(this.b.getNodesInRange(l1, r1));
        points = points.concat(this.c.getNodesInRange(l1, r1));
        points = points.concat(this.d.getNodesInRange(l1, r1));

        return points;
    }

    inBounds(node) {
        return node.x < this.x + this.r && node.y < this.y + this.r && node.x >= this.x - this.r && node.y >= this.y - this.r;
    }

    boundaryIntersect(l1, r1) {
        const l2 = {x: this.x - this.r, y: this.y - this.r};
        const r2 = {x: this.x + this.r, y: this.y + this.r};

        return !((l1.x >= r2.x || l2.x >= r1.x) || (l1.y > r2.y || l2.y > r1.y));
    }

    draw() {
        let rects = [{x: this.x - this.r, y: this.y - this.r, r: this.r}];
        if (this.a) {
            rects = rects.concat(this.a.draw());
            rects = rects.concat(this.b.draw());
            rects = rects.concat(this.c.draw());
            rects = rects.concat(this.d.draw());
        }
        return rects;
    }

    getInRadius(x, y, r) {
        const nodes = this.getNodesInRange({x: x - r, y: y - r}, {x: x + r, y: y + r});
        const nodesInCircle = [];
        for (const node of nodes) {
            if (Math.hypot(x - node.x, y - node.y) <= r) {
                nodesInCircle.push(node);
            }
        }
        return nodesInCircle;
    }
}

export default Quad;