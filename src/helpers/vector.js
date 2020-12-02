function Vector(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

Vector.prototype.add = function (other) {
    this.x += other.x;
    this.y += other.y;
    return this;
};

Vector.prototype.sub = function (other) {
    this.x -= other.x;
    this.y -= other.y;
    return this;
};

Vector.prototype.scale = function (scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
};

Vector.prototype.length = function () {
    return Math.sqrt(this.x * this.x + this.y * this.y);
};

Vector.prototype.normalize = function (len) {
    len = len || 1;
    return this.scale(len / this.length());
};
