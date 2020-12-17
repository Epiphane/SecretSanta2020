import { OBJLoader2 } from './loaders/OBJLoader2';

export class OBJLoader {
    loader: any;

    constructor(manager?: THREE.LoadingManager) {
        this.loader = new (OBJLoader2 as any)(manager);
    }

    setLogging(enabled: boolean, debug: boolean) {
        this.loader.setLogging(enabled, debug);
        return this;
    }

    setMaterialPerSmoothingGroup(materialPerSmoothingGroup: boolean) {
        this.loader.setMaterialPerSmoothingGroup(materialPerSmoothingGroup);
        return this;
    }

    setUseOAsMesh(useOAsMesh: boolean) {
        this.loader.setUseOAsMesh(useOAsMesh);
        return this;
    }
    setUseIndices(useIndices: boolean) {
        this.loader.setUseIndices(useIndices);
        return this;
    }
    setDisregardNormals(disregardNormals: boolean) {
        this.loader.setDisregardNormals(disregardNormals);
        return this;
    }

    setModelName(modelName: string) {
        this.loader.setModelName(modelName);
        return this;
    }
    setPath(path: string) {
        this.loader.setPath(path);
        return this;
    }
    setResourcePath(path: string) {
        this.loader.setResourcePath(path);
        return this;
    }
    setBaseObject3d(baseObject3d: THREE.Object3D) {
        this.loader.setBaseObject3d(baseObject3d);
        return this;
    }
    addMaterials(materials: object, overrideExisting?: boolean) {
        this.loader.addMaterials(materials, overrideExisting);
        return this;
    }

    setCallbackOnAssetAvailable(onAssetAvailable: Function) {
        this.loader.setCallbackOnAssetAvailable(onAssetAvailable);
        return this;
    }
    setCallbackOnProgress(onProgress: Function) {
        this.loader.setCallbackOnProgress(onProgress);
        return this;
    }
    setCallbackOnError(onError: Function) {
        this.loader.setCallbackOnError(onError);
        return this;
    }
    setCallbackOnLoad(onLoad: Function) {
        this.loader.setCallbackOnLoad(onLoad);
        return this;
    }
    setCallbackOnMeshAlter(onMeshAlter: Function) {
        this.loader.setCallbackOnMeshAlter(onMeshAlter);
        return this;
    }
    setCallbackOnLoadMaterials(onLoadMaterials: Function) {
        this.loader.setCallbackOnLoadMaterials(onLoadMaterials);
        return this;
    }

    load(url: string, onLoad: (object3d: THREE.Object3D) => void, onProgress?: (event: ProgressEvent) => void, onError?: (event: ErrorEvent) => void, onMeshAlter?: (meshData: object) => void) {
        this.loader.load(url, onLoad, onProgress, onError, onMeshAlter);
    }
    parse(content: ArrayBuffer | string) {
        return this.loader.parse(content);
    }
}
