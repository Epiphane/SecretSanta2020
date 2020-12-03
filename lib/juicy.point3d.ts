class Point3D {
    x: number;
    y: number;
    z: number;

    constructor(x?: number, y?: number, z?: number) {
        this.x = x = x || 0;
        this.y = y = y || x;
        this.z = z || y;
    }

    clone() {
        return new Point3D(this.x, this.y, this.z);
    }

    add(other: Point3D) {
        this.x += other.x;
        this.y += other.y;
        this.z += other.z;
        return this;
    }

    sub(other: Point3D) {
        this.x -= other.x;
        this.y -= other.y;
        this.z -= other.z;
        return this;
    }

    mult(other: Point3D | number) {
        if (other instanceof Point3D) {
            this.x *= other.x;
            this.y *= other.y;
            this.z *= other.z;
        }
        else {
            this.x *= other;
            this.y *= other;
            this.z *= other;
        }
        return this;
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
}

export default Point3D;
