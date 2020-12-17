import {
	Texture,
	Loader,
	LoadingManager
} from '../three.js';

export class TGALoader extends Loader {

	constructor(manager?: LoadingManager);

	load(url: string, onLoad: (texture: Texture) => void, onProgress?: (event: ProgressEvent) => void, onError?: (event: ErrorEvent) => void): void;
	parse(data: ArrayBuffer): Texture;

}
