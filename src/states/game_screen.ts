import { THREE, Box2D } from "../../lib/juicy";
import BaseGame, { CargoType, TruckType } from "./base_game";

const DEER_W = 5;
const DEER_H = 14;
const SPAWN_CD = 3;

export default class GameScreen extends BaseGame {
   spawnCd: number = SPAWN_CD;

   constructor(objects: { [key: string]: THREE.Object3D }) {
      super(objects, {
         truck: {
            style: TruckType.Normal,
            cargo: [CargoType.NormalLarge, CargoType.NormalLarge, CargoType.NormalLarge]
         },
         road: {
            lanes: 2,
         },
         length: 10000,
         speed: 150
      });

      for (let i = 0; i < this.totalDistance / 30; i++) {
         let tree = this.objects["tree1"].clone();
         tree.position.z = (-i + Math.random() / 2) * 30;
         tree.position.x = (80 + Math.random() * 40);
         this.worldBase.add(tree);

         tree = this.objects["tree1"].clone();
         tree.position.z = (-i + Math.random() / 2) * 30;
         tree.position.x = -1 * (130 + Math.random() * 40);
         this.worldBase.add(tree);
      }
   }

   makeDeer(angle: number) {
      const VELOCITY = 100;

      let currentPos = -this.worldBase.position.z;
      currentPos -= 150;

      angle = (Math.random() * Math.PI) / 4 + Math.PI;

      if (Math.random() < 0.5) {
         angle = Math.PI - angle;
      }

      let velocity = new Box2D.Common.Math.Vec2(
         VELOCITY * Math.cos(angle),
         -VELOCITY * Math.sin(angle)
      );

      let x = velocity.x * -2;
      let y = velocity.y * -2 - 250 + (Math.random() - 0.5) * 350;

      let deer = this.objects["o deer"].clone();
      deer.position.x = x;
      deer.position.z = currentPos + y;
      deer.rotateY(Math.PI / 2 + angle);
      deer.userData.life = 20;
      deer.userData.isObstacle = true;
      this.obstacles.add(deer);

      let bodyDef = new Box2D.Dynamics.BodyDef();
      let fixDef = new Box2D.Dynamics.FixtureDef();

      bodyDef.type = Box2D.Dynamics.Body.DYNAMIC_BODY;
      bodyDef.position.x = deer.position.x;
      bodyDef.position.y = deer.position.z;
      bodyDef.angle = deer.rotation.y;
      bodyDef.linearVelocity = velocity;
      let shape = new Box2D.Collision.Shapes.PolygonShape();
      shape.setAsBox(DEER_W / 2, DEER_H / 2);
      fixDef.shape = shape;
      fixDef.isSensor = true;

      bodyDef.userData = deer;
      deer.userData.body = this.world.createBody(bodyDef);
      deer.userData.body.createFixture(fixDef);
   }

   update(dt: number) {
      super.update(dt);

      this.spawnCd -= dt;
      if (this.spawnCd < 0) {
         this.spawnCd = SPAWN_CD;

         this.makeDeer(0);
      }
   }

   onWin() {
      this.game.setState(new GameScreen(this.objects));
   }
}
