import {
	CanvasTexture,
	Loader,
	LoadingManager
} from '../three.js';

export class LottieLoader extends Loader {

	constructor(manager?: LoadingManager);

	load(url: string, onLoad: (texture: CanvasTexture) => void, onProgress?: (event: ProgressEvent) => void, onError?: (event: ErrorEvent) => void): void;

	setQuality(value: Number): void;

}
