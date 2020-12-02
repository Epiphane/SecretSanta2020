class Point {
    x: number;
    y: number;

    constructor(x?: number, y?: number) {
        this.x = x = x || 0;
        this.y = y || x;
    }

    clone() {
        return new Point(this.x, this.y);
    }

    add(other: Point) {
        this.x += other.x;
        this.y += other.y;
        return this;
    }

    sub(other: Point) {
        this.x -= other.x;
        this.y -= other.y;
        return this;
    }

    mult(other: Point | number) {
        if (other instanceof Point) {
            this.x *= other.x;
            this.y *= other.y;
        }
        else {
            this.x *= other;
            this.y *= other;
        }
        return this;
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
}

export default Point;
