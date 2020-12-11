import {
   THREE,
   State,
   Entity,
   Component,
   Sound,
   BoxComponent as Box,
   ImageComponent as Image,
   TextComponent as Text,
   BehaviorComponent as Behavior,
} from '../../lib/juicy';
import { AddUVs, UVSide } from '../helpers/uvHelper';


export default class GameScreen extends State {
   allySpawnZone: Entity = new Entity(this, [Box]);

   #board = new THREE.Object3D();

   constructor() {
      super();

      let texture = new THREE.TextureLoader().load('img/units.png');
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.LinearMipMapLinearFilter;

      let material = new THREE.MeshBasicMaterial({ color: 0xffffff, map: texture, transparent: true });

      this.#board.position.setX(-6.61);
      this.#board.position.setZ(-3.5);
      this.scene.add(this.#board);

      const geometryWhite = new THREE.BoxGeometry();
      AddUVs(geometryWhite, UVSide.TOP, 512, 512, 0, 0, 64, 64);

      const geometryBlack = new THREE.BoxGeometry();
      AddUVs(geometryBlack, UVSide.TOP, 512, 512, 0, 64, 64, 128);

      const black = 0x272B25;
      const white = 0x66725D;
      for (let i = 0; i < 8; i++) {
         for (let j = 0; j < 8; j++) {
            // const material = new THREE.MeshPhongMaterial({ color: (i + j) % 2 === 0 ? black : white });
            const cube = new THREE.Mesh((i + j) % 2 === 0 ? geometryWhite : geometryBlack, material);
            cube.position.setX(i);
            cube.position.setZ(j);
            cube.name = "Hi there";
            this.#board.add(cube);
         }
      }

      var ambient = new THREE.AmbientLight(0xf0f0f0, 0.5);
      this.scene.add(ambient);

      var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight.position.set(0, 0, 10).normalize();
      this.scene.add(directionalLight);
   }

   init() {
      super.init();
      this.orthographic(225);
      this.lookAt(new THREE.Vector3(0, 10, 0), new THREE.Vector3(0, 0, 0));
   }

   key_UP() {
   }

   click(pos: THREE.Vector2) {
      const raycaster = new THREE.Raycaster(); // create once
      raycaster.setFromCamera(pos, this.camera);

      const intersects = raycaster.intersectObjects(this.#board.children, false);

      // this.scene.remove(...intersects.map(i => i.object))
      // console.log(intersects);
   }

   update(dt: number) {
      return super.update(dt);
   }
};
