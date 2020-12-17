import { OBJLoader } from '../../lib/objloader';
import { MTLLoader } from '../../lib/mtlloader';
import { MtlObjBridge } from '../../lib/loaders/obj2/bridge/MtlObjBridge';
import {
    THREE,
    State,
} from '../../lib/juicy';
import GameScreen from './game_screen';

export default class LoadingScreen extends State {
    ambient = new THREE.AmbientLight(0xffffff, 0.5);
    directional = new THREE.DirectionalLight(0xffffff, 0.5);

    objects: { [key: string]: any } = {};

    constructor() {
        super();

        // Lights
        this.scene.add(this.ambient);
        this.scene.add(this.directional);

        this.load("road");
        this.load("truck1");
        this.load("car1");
        this.load("container1");
        this.load("o deer");
    }

    load(name: string) {
        this.objects[name] = null;
        new MTLLoader().load(`models/${name}.mtl`, mtl => {
            const objLoader = new OBJLoader();
            objLoader.addMaterials(MtlObjBridge.addMaterialsFromMtlLoader(mtl));
            objLoader.load(`models/${name}.obj`, obj => {
                this.objects[name] = obj;
                this.checkLoaded();
            });
        });
    }

    init() {
        this.checkLoaded();
    }

    checkLoaded() {
        for (let name in this.objects) {
            if (this.objects[name] === null) {
                return;
            }
        }

        // All done! Load the game.
        this.game.setState(new GameScreen(this.objects));
    }
};
