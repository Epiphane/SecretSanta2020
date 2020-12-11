import { THREE } from '../../lib/juicy';

// Texture UVs
export enum UVSide {
    FRONT = 0,
    BACK = 2,
    TOP = 4,
    BOTTOM = 6,
    LEFT = 8,
    RIGHT = 10
};

export function AddUVs(geometry: THREE.Geometry, side: UVSide, texWidth: number, texHeight: number, minX: number, minY: number, maxX: number, maxY: number) {
    minX++;
    minY++;
    maxX--;
    maxY--;

    minX /= texWidth;
    maxX /= texWidth;
    minY /= texHeight;
    maxY /= texHeight;

    geometry.faceVertexUvs[0][side] = [new THREE.Vector2(minX, maxY), new THREE.Vector2(minX, minY), new THREE.Vector2(maxX, maxY)];
    geometry.faceVertexUvs[0][side + 1] = [new THREE.Vector2(minX, minY), new THREE.Vector2(maxX, minY), new THREE.Vector2(maxX, maxY)];
}
