import {
   THREE,
   Box2D,
   State,
   Entity,
   Component,
   Sound,
   BoxComponent as Box,
   ImageComponent as Image,
   TextComponent as Text,
   BehaviorComponent as Behavior,
} from "../../lib/juicy";
import { SetBoxUVs, UVSide } from "../helpers/uvHelper";

function clamp(num: number, min: number, max: number) {
   return Math.min(Math.max(num, min), max);
}

const SCALE = 1;
const TICKS = 15;

const TRUCK_W = 20;
const TRUCK_H = 35;
const CONTAINER_W = 20;
const CONTAINER_H = 40;
const DEER_W = 5;
const DEER_H = 14;

class Listener extends Box2D.Dynamics.ContactListener {
   screen: GameScreen;

   constructor(screen: GameScreen) {
      super();
      this.screen = screen;
   }

   beginContact(contact: Box2D.Dynamics.Contacts.Contact) {
      this.screen.beginContact(contact);
   }

   endContact(contact: Box2D.Dynamics.Contacts.Contact) {
      this.screen.endContact(contact);
   }

   preSolve(
      contact: Box2D.Dynamics.Contacts.Contact,
      oldManifold: Box2D.Collision.Manifold
   ) {
      this.screen.preSolve(contact, oldManifold);
   }

   postSolve(
      contact: Box2D.Dynamics.Contacts.Contact,
      impulse: Box2D.Dynamics.ContactImpulse
   ) {
      this.screen.postSolve(contact, impulse);
   }
}

export default class GameScreen extends State {
   allySpawnZone: Entity = new Entity(this, [Box]);

   ambient = new THREE.AmbientLight(0xffffff, 0.5);
   directional = new THREE.DirectionalLight(0xffffff, 0.5);

   road: THREE.Object3D;
   truck1: THREE.Object3D;
   cars: THREE.Object3D[] = [];
   containers: THREE.Object3D[] = [];
   objects: { [key: string]: THREE.Object3D };

   roadObj = new THREE.Group();
   worldBase = new THREE.Group();

   playerSpeed = 350;

   obstacles = new THREE.Group();

   truck: Box2D.Dynamics.Body;

   spawnCd: number = 1;
   progress: number = 0;

   constructor(objects: { [key: string]: THREE.Object3D }) {
      super();

      this.world.setContactListener(new Listener(this));

      // Lights
      this.scene.add(this.ambient);
      this.scene.add(this.directional);

      this.scene.scale.multiplyScalar(SCALE);

      this.objects = objects;
      this.road = objects.road.clone();
      this.truck1 = objects.truck1.clone();
      this.cars.push(objects.car1.clone());
      this.containers.push(objects.container1.clone());

      this.worldBase.add(this.roadObj);
      this.worldBase.add(this.obstacles);
      this.scene.add(this.worldBase);

      for (let i = -50; i < 50; i++) {
         let block = this.road.clone();
         block.position.z = -i * 50;
         this.roadObj.add(block);

         block = block.clone();
         block.position.x -= 52;
         this.roadObj.add(block);

         block = block.clone();
         block.position.x += 104;
         this.roadObj.add(block);
      }

      let jointDef = new Box2D.Dynamics.Joints.DistanceJointDef();
      {
         let truck = this.objects["truck1"].clone();
         truck.rotateY(Math.PI);
         truck.position.z = -100;
         this.worldBase.add(truck);

         let bodyDef = new Box2D.Dynamics.BodyDef();
         let fixDef = new Box2D.Dynamics.FixtureDef();

         bodyDef.type = Box2D.Dynamics.Body.DYNAMIC_BODY;
         bodyDef.position.x = truck.position.x;
         bodyDef.position.y = truck.position.z;
         bodyDef.linearVelocity.y = -this.playerSpeed;
         bodyDef.fixedRotation = true;
         bodyDef.linearDamping = 5;
         let shape = new Box2D.Collision.Shapes.PolygonShape();
         shape.setAsBox(TRUCK_W / 2, TRUCK_H / 2);
         fixDef.shape = shape;

         bodyDef.userData = truck;
         this.truck = this.world.createBody(bodyDef);
         truck.userData.body = this.truck;
         truck.userData.body.createFixture(fixDef);

         jointDef.bodyA = truck.userData.body;
         jointDef.localAnchorA = new Box2D.Common.Math.Vec2(0, 12);
      }

      for (let i = 0; i < 2; i++) {
         let container = this.objects["container1"].clone();
         container.rotateY(Math.PI);
         container.position.z = -50 + 40 * i;
         this.worldBase.add(container);

         let bodyDef = new Box2D.Dynamics.BodyDef();
         let fixDef = new Box2D.Dynamics.FixtureDef();

         bodyDef.type = Box2D.Dynamics.Body.DYNAMIC_BODY;
         bodyDef.position.x = container.position.x;
         bodyDef.position.y = container.position.z;
         bodyDef.linearDamping = 2;
         let shape = new Box2D.Collision.Shapes.PolygonShape();
         shape.setAsBox(CONTAINER_W / 2, CONTAINER_H / 2);
         fixDef.shape = shape;

         bodyDef.userData = container;
         container.userData.body = this.world.createBody(bodyDef);
         container.userData.body.createFixture(fixDef);

         jointDef.bodyB = container.userData.body;

         jointDef.length = 2;
         jointDef.localAnchorB = new Box2D.Common.Math.Vec2(0, -25);
         jointDef.collideConnected = true;
         this.world.createJoint(jointDef);

         jointDef = new Box2D.Dynamics.Joints.DistanceJointDef();
         jointDef.bodyA = container.userData.body;
         jointDef.localAnchorA = new Box2D.Common.Math.Vec2(0, 15);
      }
   }

   makeDeer(angle: number) {
      const VELOCITY = 100;

      let currentPos = -this.worldBase.position.z;
      currentPos -= 100;

      angle = (Math.random() * Math.PI) / 4 + Math.PI;

      if (Math.random() < 0.5) {
         angle = Math.PI - angle;
      }

      let velocity = new Box2D.Common.Math.Vec2(
         VELOCITY * Math.cos(angle),
         -VELOCITY * Math.sin(angle)
      );

      let x = velocity.x * -1.5;
      let y = velocity.y * -1.5 - 250;

      let deer = this.objects["o deer"].clone();
      deer.position.x = x;
      deer.position.z = currentPos + y;
      deer.rotateY(Math.PI / 2 + angle);
      deer.userData.life = 10;
      deer.userData.isDeer = true;
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

   init() {
      super.init();
      // this.orthographic(180);
      this.perspective(60);
      this.lookAt(
         new THREE.Vector3(100, 200, -150).multiplyScalar(SCALE),
         new THREE.Vector3(0, 0, -150).multiplyScalar(SCALE)
      );
   }

   click(pos: THREE.Vector2) {
      const raycaster = new THREE.Raycaster(); // create once
      raycaster.setFromCamera(pos, this.camera);

      const intersects = raycaster.intersectObjects(this.scene.children, false);

      if (intersects.length > 0) {
         intersects[0].object.visible = false;
      }
   }

   update(dt: number) {
      const LEFT = 'UP';
      const RIGHT = 'DOWN';
      const UP = 'RIGHT';
      const DOWN = 'LEFT';

      this.truck.setLinearVelocity(new Box2D.Common.Math.Vec2(0, -this.playerSpeed));
      if (this.game.keyDown(LEFT)) {
         this.truck.getLinearVelocity().add(new Box2D.Common.Math.Vec2(-130, 0));
         // this.truck.setAngle(clamp(oangle - dt, -Math.PI / 6, Math.PI / 6));
      }

      if (this.game.keyDown(RIGHT)) {
         this.truck.getLinearVelocity().add(new Box2D.Common.Math.Vec2(130, 0));
         // this.truck.setAngle(clamp(oangle + dt, -Math.PI / 6, Math.PI / 6));
      }

      if (this.game.keyDown(UP)) {
         this.truck.getLinearVelocity().add(new Box2D.Common.Math.Vec2(0, -120));
      }

      if (this.game.keyDown(DOWN)) {
         this.truck.getLinearVelocity().add(new Box2D.Common.Math.Vec2(0, 120));
      }

      this.progress += dt;

      for (let i = 0; i < TICKS; i++) {
         this.world.step(dt / TICKS, 5, 5);
      }

      this.spawnCd -= dt;
      if (this.spawnCd < 0) {
         this.spawnCd = 1;

         this.makeDeer(0);
      }

      if (this.game.keyDown("D")) {
         this.camera.position.z += dt * 20;
      }
      if (this.game.keyDown("A")) {
         this.camera.position.z -= dt * 20;
      }

      let object = this.world.getBodyList();
      while (object) {
         let mesh = object.getUserData();

         if (mesh) {
            // Nice and simple, we only need to work with 2 dimensions
            let position = object.getPosition();
            mesh.position.x = position.x;
            mesh.position.z = position.y;

            // GetAngle() function returns the rotation in radians
            mesh.rotation.y = object.getAngle();
         }

         object = object.getNext(); // Get the next object in the scene
      }


      this.worldBase.position.z += this.playerSpeed * 0.948 * dt;
      let worldPosition = this.roadObj.getWorldPosition(new THREE.Vector3());
      while (worldPosition.z > 0) {
         this.roadObj.position.z -= 50;
         worldPosition = this.roadObj.getWorldPosition(new THREE.Vector3());
      }

      this.obstacles.children = this.obstacles.children.filter((obstacle) => {
         if (obstacle.userData.life) {
            obstacle.userData.life -= dt;

            if (obstacle.userData.life <= 0) {
               this.world.destroyBody(obstacle.userData.body);
               return false;
            }
         }

         return true;
      });

      this.world.drawDebugData();

      return super.update(dt);
   }

   beginContact(contact: Box2D.Dynamics.Contacts.Contact) {
      const bodyA = contact.getFixtureA().getBody();
      if (bodyA.getUserData().userData.isDeer) {
         this.obstacles.remove(bodyA.getUserData());
         this.world.destroyBody(bodyA);
      }

      const bodyB = contact.getFixtureB().getBody();
      if (bodyB.getUserData().userData.isDeer) {
         this.obstacles.remove(bodyB.getUserData());
         this.world.destroyBody(bodyB);
      }
   }

   endContact(contact: Box2D.Dynamics.Contacts.Contact) { }
   preSolve(
      contact: Box2D.Dynamics.Contacts.Contact,
      oldManifold: Box2D.Collision.Manifold
   ) { }
   postSolve(
      contact: Box2D.Dynamics.Contacts.Contact,
      impulse: Box2D.Dynamics.ContactImpulse
   ) { }
}
