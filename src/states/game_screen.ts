import { OBJLoader } from '../../lib/objloader';
import { MTLLoader } from '../../lib/mtlloader';
import { MtlObjBridge } from '../../lib/loaders/obj2/bridge/MtlObjBridge';
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
import { SetBoxUVs, UVSide } from '../helpers/uvHelper';


export default class GameScreen extends State {
   allySpawnZone: Entity = new Entity(this, [Box]);

   #board = new THREE.Object3D();
   #boardIndicators = new THREE.Object3D();
   #boardTiles = new THREE.Object3D();

   constructor() {
      super();

      let boardTexture = new THREE.TextureLoader().load('img/board.png');
      boardTexture.magFilter = THREE.NearestFilter;
      boardTexture.minFilter = THREE.LinearMipMapLinearFilter;
      let boardMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, map: boardTexture, transparent: true });

      let unitTexture = new THREE.TextureLoader().load('img/units.png');
      unitTexture.magFilter = THREE.NearestFilter;
      unitTexture.minFilter = THREE.LinearMipMapLinearFilter;
      let unitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, map: unitTexture, transparent: true });

      this.#boardTiles.position.setY(-1);
      this.#board.add(this.#boardTiles);
      this.#boardIndicators.position.setY(-0.5);
      this.#board.add(this.#boardIndicators);
      this.#board.position.setX(-6.61);
      this.#board.position.setZ(-3.5);
      this.scene.add(this.#board);

      const geometryWhite = new THREE.BoxGeometry();
      SetBoxUVs(geometryWhite, UVSide.TOP, 450, 450, 0, 0, 90, 90);

      const geometryBlack = new THREE.BoxGeometry();
      SetBoxUVs(geometryBlack, UVSide.TOP, 450, 450, 90, 0, 90, 90);

      const indicatorGeometry = new THREE.BoxGeometry(1, 0.25, 1);
      const indicatorMaterial = new THREE.MeshBasicMaterial({
         color: 0xff0000,
         opacity: 0.5,
         transparent: true,
      })

      for (let i = 0; i < 8; i++) {
         for (let j = 0; j < 8; j++) {
            const cube = new THREE.Mesh((i + j) % 2 === 0 ? geometryWhite : geometryBlack, boardMaterial);
            cube.position.setX(i);
            cube.position.setZ(j);
            this.#boardTiles.add(cube);

            const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
            indicator.position.setX(i);
            indicator.position.setZ(j);
            indicator.userData['x'] = i;
            indicator.userData['y'] = 8 - j;
            this.#boardIndicators.add(indicator);
         }
      }

      const radius = 0.4;
      let tokenGeometry = new THREE.CylinderGeometry(radius, radius, 0.25, 32);
      for (var z = 0; z < tokenGeometry.faces.length; z++) {
         if (tokenGeometry.faces[z] instanceof THREE.Face3) {
            tokenGeometry.faceVertexUvs[0][z][0].x = (tokenGeometry.vertices[tokenGeometry.faces[z].a].x + radius) / (radius * 2) * 72 / 512;
            tokenGeometry.faceVertexUvs[0][z][0].y = (radius - tokenGeometry.vertices[tokenGeometry.faces[z].a].z) / (radius * 2) * 72 / 512;
            tokenGeometry.faceVertexUvs[0][z][1].x = (tokenGeometry.vertices[tokenGeometry.faces[z].b].x + radius) / (radius * 2) * 72 / 512;
            tokenGeometry.faceVertexUvs[0][z][1].y = (radius - tokenGeometry.vertices[tokenGeometry.faces[z].b].z) / (radius * 2) * 72 / 512;
            tokenGeometry.faceVertexUvs[0][z][2].x = (tokenGeometry.vertices[tokenGeometry.faces[z].c].x + radius) / (radius * 2) * 72 / 512;
            tokenGeometry.faceVertexUvs[0][z][2].y = (radius - tokenGeometry.vertices[tokenGeometry.faces[z].c].z) / (radius * 2) * 72 / 512;

            tokenGeometry.faces[z].materialIndex = 1;
         } else {
            tokenGeometry.faces[z].materialIndex = 0;
         }
      }
      tokenGeometry.uvsNeedUpdate = true;
      let tokenMaterial = unitMaterial.clone();
      const token = new THREE.Mesh(tokenGeometry, tokenMaterial);
      this.#board.add(token);

      var ambient = new THREE.AmbientLight(0xf0f0f0, 0.5);
      this.scene.add(ambient);

      var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight.position.set(3, 2, 10).normalize();
      this.scene.add(directionalLight);

      new MTLLoader().load("models/truck1.mtl", mtl => {
         const materials = MtlObjBridge.addMaterialsFromMtlLoader(mtl);
         const objLoader = new OBJLoader();
         objLoader.addMaterials(materials);

         objLoader.load("models/truck1.obj", obj => {
            this.scene.add(obj)
         });
      });
   }

   init() {
      super.init();
      // this.orthographic(180);
      this.lookAt(new THREE.Vector3(0, 10, 0), new THREE.Vector3(0, 0, 0));
      this.lookAt(new THREE.Vector3(0, 50, 0), new THREE.Vector3(10, 5, 0));
      // this.lookAt(new THREE.Vector3(8, 4, 8).add(this.#board.position), new THREE.Vector3(4, 0, 4).add(this.#board.position));
   }

   key_UP() {
      this.camera.position.x++;
   }

   key_DOWN() {
      this.camera.position.x--;
   }

   highlight(minX: number, minY: number, maxX: number, maxY: number, leaveOthers?: boolean) {
      this.#boardIndicators.children.forEach(obj => {
         let contained = (
            obj.position.x >= minX && obj.position.x < maxX &&
            obj.position.y >= minY && obj.position.y < maxY
         );
         if (contained) {
            obj.visible = true;
         }
         else if (!leaveOthers) {
            obj.visible = false;
         }
      });
   }

   click(pos: THREE.Vector2) {
      const raycaster = new THREE.Raycaster(); // create once
      raycaster.setFromCamera(pos, this.camera);

      const intersects = raycaster.intersectObjects(this.#boardIndicators.children, false);

      if (intersects.length > 0) {
         console.log(intersects[0].object.userData);
         intersects[0].object.visible = false;
      }
      // console.log(intersects);
   }

   update(dt: number) {
      return super.update(dt);
   }
};
