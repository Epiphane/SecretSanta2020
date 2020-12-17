import {
	Scene,
	Loader,
	LoadingManager
} from '../three.js';

export class VRMLLoader extends Loader {

	constructor(manager?: LoadingManager);

	load(url: string, onLoad: (scene: Scene) => void, onProgress?: (event: ProgressEvent) => void, onError?: (event: ErrorEvent) => void): void;
	parse(data: string, path: string): Scene;

}
