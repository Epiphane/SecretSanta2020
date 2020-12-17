import {
    Material,
    LoadingManager,
    Mapping,
    Loader,
    BufferGeometry,
    Side,
    Texture,
    Vector2,
    Wrapping,
    FrontSide,
    RepeatWrapping,
    DefaultLoadingManager,
    TextureLoader,
    MeshPhongMaterial,
    Color,
} from './three.js';

import { MTLLoader as LoaderProxy } from './loaders/MTLLoader';

export interface MaterialCreatorOptions {
    /**
   * side: Which side to apply the material
   * THREE.FrontSide (default), THREE.BackSide, THREE.DoubleSide
   */
    side?: Side;
    /*
   * wrap: What type of wrapping to apply for textures
   * THREE.RepeatWrapping (default), THREE.ClampToEdgeWrapping, THREE.MirroredRepeatWrapping
   */
    wrap?: Wrapping;
    /*
   * normalizeRGB: RGBs need to be normalized to 0-1 from 0-255
   * Default: false, assumed to be already normalized
   */
    normalizeRGB?: boolean;
    /*
   * ignoreZeroRGBs: Ignore values of RGBs (Ka,Kd,Ks) that are all 0's
   * Default: false
   */
    ignoreZeroRGBs?: boolean;
    /*
   * invertTrProperty: Use values 1 of Tr field for fully opaque. This option is useful for obj
   * exported from 3ds MAX, vcglib or meshlab.
   * Default: false
   */
    invertTrProperty?: boolean;
}

export class MTLLoader extends Loader {

    proxy: any;

    constructor(manager?: LoadingManager) {
        super(manager);

        this.proxy = new (LoaderProxy as any)(manager);
    }

    load(url: string, onLoad: (materialCreator: MaterialCreator) => void, onProgress?: (event: ProgressEvent) => void, onError?: (event: ErrorEvent) => void) {
        this.proxy.load(url, onLoad, onProgress, onError);
    }
    parse(text: string, path: string) {
        return this.proxy.parse(text, path);
    }
    setMaterialOptions(value: MaterialCreatorOptions) {
        this.proxy.setMaterialOptions(value);
    }

}

export interface MaterialInfo {
    ks?: number[];
    kd?: number[];
    ke?: number[];
    map_kd?: string;
    map_ks?: string;
    map_ke?: string;
    norm?: string;
    map_bump?: string;
    bump?: string;
    map_d?: string;
    ns?: number;
    d?: number;
    tr?: number;
}

export interface TexParams {
    scale: Vector2;
    offset: Vector2;
    url: string;
}

export class MaterialCreator {
    baseUrl: string;
    options: MaterialCreatorOptions | undefined;
    materialsInfo: { [key: string]: MaterialInfo };
    materials: { [key: string]: Material };
    private materialsArray: Material[];
    nameLookup: { [key: string]: number };
    side: Side;
    wrap: Wrapping;
    crossOrigin: string = 'anonymous';
    manager: LoadingManager | undefined;

    constructor(baseUrl?: string, options?: MaterialCreatorOptions) {
        this.baseUrl = baseUrl || '';
        this.options = options!;
        this.materialsInfo = {};
        this.materials = {};
        this.materialsArray = [];
        this.nameLookup = {};

        this.side = (this.options && this.options.side) ? this.options.side : FrontSide;
        this.wrap = (this.options && this.options.wrap) ? this.options.wrap : RepeatWrapping;
    };

    setCrossOrigin(value: string) {

        this.crossOrigin = value;
        return this;

    };

    setManager(value: LoadingManager) {

        this.manager = value;

    };

    setMaterials(materialsInfo: { [key: string]: MaterialInfo }) {

        this.materialsInfo = this.convert(materialsInfo);
        this.materials = {};
        this.materialsArray = [];
        this.nameLookup = {};

    };

    convert(materialsInfo: { [key: string]: MaterialInfo }) {

        if (!this.options) return materialsInfo;

        var converted = {} as any;

        for (var mn in materialsInfo) {

            // Convert materials info into normalized form based on options

            var mat = materialsInfo[mn] as any;

            var covmat = {} as any;

            converted[mn] = covmat;

            for (var prop in mat) {

                var save = true;
                var value = mat[prop];
                var lprop = prop.toLowerCase();

                switch (lprop) {

                    case 'kd':
                    case 'ka':
                    case 'ks':

                        // Diffuse color (color under white light) using RGB values

                        if (this.options && this.options.normalizeRGB) {

                            value = [value[0] / 255, value[1] / 255, value[2] / 255];

                        }

                        if (this.options && this.options.ignoreZeroRGBs) {

                            if (value[0] === 0 && value[1] === 0 && value[2] === 0) {

                                // ignore

                                save = false;

                            }

                        }

                        break;

                    default:

                        break;

                }

                if (save) {

                    covmat[lprop] = value;

                }

            }

        }

        return converted;

    };

    preload() {

        for (var mn in this.materialsInfo) {

            this.create(mn);

        }

    };

    getIndex(materialName: string) {

        return this.nameLookup[materialName];

    };

    getAsArray() {

        var index = 0;

        for (var mn in this.materialsInfo) {

            this.materialsArray[index] = this.create(mn);
            this.nameLookup[mn] = index;
            index++;

        }

        return this.materialsArray;

    };

    create(materialName: string) {

        if (this.materials[materialName] === undefined) {

            this.createMaterial_(materialName);

        }

        return this.materials[materialName];

    };

    createMaterial_(materialName: string) {

        // Create material

        var scope = this;
        var mat = this.materialsInfo[materialName] as any;
        var params = {

            name: materialName,
            side: this.side

        } as any;

        function resolveURL(baseUrl: string, url: string) {

            if (typeof url !== 'string' || url === '')
                return '';

            // Absolute URL
            if (/^https?:\/\//i.test(url)) return url;

            return baseUrl + url;

        }

        function setMapForType(mapType: string, value: any) {

            if (params[mapType]) return; // Keep the first encountered texture

            var texParams = scope.getTextureParams(value, params);
            var map = scope.loadTexture(resolveURL(scope.baseUrl, texParams.url));

            map.repeat.copy(texParams.scale);
            map.offset.copy(texParams.offset);

            map.wrapS = scope.wrap;
            map.wrapT = scope.wrap;

            params[mapType] = map;

        }

        for (var prop in mat) {

            var value = mat[prop];
            var n;

            if (value === '') continue;

            switch (prop.toLowerCase()) {

                // Ns is material specular exponent

                case 'kd':

                    // Diffuse color (color under white light) using RGB values

                    params.color = new Color().fromArray(value);

                    break;

                case 'ks':

                    // Specular color (color when light is reflected from shiny surface) using RGB values
                    params.specular = new Color().fromArray(value);

                    break;

                case 'ke':

                    // Emissive using RGB values
                    params.emissive = new Color().fromArray(value);

                    break;

                case 'map_kd':

                    // Diffuse texture map

                    setMapForType("map", value);

                    break;

                case 'map_ks':

                    // Specular map

                    setMapForType("specularMap", value);

                    break;

                case 'map_ke':

                    // Emissive map

                    setMapForType("emissiveMap", value);

                    break;

                case 'norm':

                    setMapForType("normalMap", value);

                    break;

                case 'map_bump':
                case 'bump':

                    // Bump texture map

                    setMapForType("bumpMap", value);

                    break;

                case 'map_d':

                    // Alpha map

                    setMapForType("alphaMap", value);
                    params.transparent = true;

                    break;

                case 'ns':

                    // The specular exponent (defines the focus of the specular highlight)
                    // A high exponent results in a tight, concentrated highlight. Ns values normally range from 0 to 1000.

                    params.shininess = parseFloat(value);

                    break;

                case 'd':
                    n = parseFloat(value);

                    if (n < 1) {

                        params.opacity = n;
                        params.transparent = true;

                    }

                    break;

                case 'tr':
                    n = parseFloat(value);

                    if (this.options && this.options.invertTrProperty) n = 1 - n;

                    if (n > 0) {

                        params.opacity = 1 - n;
                        params.transparent = true;

                    }

                    break;

                default:
                    break;

            }

        }

        this.materials[materialName] = new MeshPhongMaterial(params);
        return this.materials[materialName];

    };

    getTextureParams(value: string, matParams: any) {

        var texParams = {

            scale: new Vector2(1, 1),
            offset: new Vector2(0, 0)

        } as any;

        var items = value.split(/\s+/);
        var pos;

        pos = items.indexOf('-bm');

        if (pos >= 0) {

            matParams.bumpScale = parseFloat(items[pos + 1]);
            items.splice(pos, 2);

        }

        pos = items.indexOf('-s');

        if (pos >= 0) {

            texParams.scale.set(parseFloat(items[pos + 1]), parseFloat(items[pos + 2]));
            items.splice(pos, 4); // we expect 3 parameters here!

        }

        pos = items.indexOf('-o');

        if (pos >= 0) {

            texParams.offset.set(parseFloat(items[pos + 1]), parseFloat(items[pos + 2]));
            items.splice(pos, 4); // we expect 3 parameters here!

        }

        texParams.url = items.join(' ').trim();
        return texParams;

    };

    loadTexture(url: string, mapping?: any, onLoad?: any, onProgress?: any, onError?: any) {

        var texture;
        var manager = (this.manager !== undefined) ? this.manager : DefaultLoadingManager;
        var loader = manager.getHandler(url);

        if (loader === null) {

            loader = new TextureLoader(manager);

        }

        if (loader.setCrossOrigin) loader.setCrossOrigin(this.crossOrigin);
        texture = (loader as any).load(url, onLoad, onProgress, onError);

        if (mapping !== undefined) texture.mapping = mapping;

        return texture;

    }

};
