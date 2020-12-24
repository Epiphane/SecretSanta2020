import {
    THREE,
    Box2D,
    State,
} from "../../lib/juicy";

const SCALE = 1;
const TICKS = 15;

const TRUCK_W = 20;
const TRUCK_H = 20;
const TRUCK_HEALTH = 3;
const CONTAINER_W = 20;
const CONTAINER_H = 40;
const UI_SCALE = 10;

export enum TruckType {
    Normal = "truck1",
}

export enum CargoType {
    NormalLarge = "container1",
}

export interface TruckInfo {
    // Unused
    style?: TruckType;
    cargo?: CargoType[];
}

export interface RoadInfo {
    lanes?: number;
}

export interface GameInfo {
    truck?: TruckInfo;
    road?: RoadInfo;
    length?: number;
    speed?: number;
}

export default class BaseGame extends State {
    ambient = new THREE.AmbientLight(0xffffff, 0.5);
    directional = new THREE.DirectionalLight(0xffffff, 0.5);

    protected objects: { [key: string]: THREE.Object3D };

    roadObj = new THREE.Group();
    worldBase = new THREE.Group();

    obstacles = new THREE.Group();
    truck: Box2D.Dynamics.Body;

    #playerSpeed: number;
    progress: number = 0;
    totalDistance: number;

    #minY = -300;
    #maxY = 0;

    uiRenderer?: THREE.Renderer;
    uiAmbient?: THREE.Light;
    uiCamera?: THREE.Camera;
    uiScene = new THREE.Scene();
    uiTexture = new THREE.Texture();
    uiProgress: THREE.Object3D;
    uiHealths = new THREE.Group();

    constructor(objects: { [key: string]: THREE.Object3D }, params: GameInfo) {
        super();

        this.#playerSpeed = params.speed || 150;
        this.totalDistance = params.length || 10000;

        // Lights
        this.scene.add(this.ambient);
        this.scene.add(this.directional);
        this.scene.scale.multiplyScalar(SCALE);

        this.objects = objects;
        this.uiProgress = this.objects["progress_truck"].clone();

        this.worldBase.add(this.roadObj);
        this.worldBase.add(this.obstacles);
        this.scene.add(this.worldBase);

        const lanes = params.road?.lanes || 2;
        for (let i = -50; i < 50; i++) {
            let block = this.objects["road"].clone();
            block.position.z = -i * 50;
            this.roadObj.add(block);
        }

        let healthCursor = 0;
        let jointDef = new Box2D.Dynamics.Joints.DistanceJointDef();
        {
            const type = params.truck?.style || TruckType.Normal;
            let truck = new THREE.Group();
            truck.userData.isPlayer = true;
            truck.userData.health = 3;
            for (let i = 0; i <= truck.userData.health; i++) {
                let obj = this.objects[type + `_health${i}`].clone();
                obj.rotateY(Math.PI / 2);
                obj.visible = (i === truck.userData.health);
                truck.add(obj);
            }
            truck.position.z = -100;
            this.worldBase.add(truck);

            const bodyDef = new Box2D.Dynamics.BodyDef();
            bodyDef.type = Box2D.Dynamics.Body.KINEMATIC_BODY;
            bodyDef.position.x = truck.position.x;
            bodyDef.position.y = truck.position.z;
            bodyDef.linearDamping = 5;
            bodyDef.userData = truck;
            this.truck = this.world.createBody(bodyDef);

            const shape = new Box2D.Collision.Shapes.PolygonShape();
            shape.setAsBox(TRUCK_W / 2, TRUCK_H / 2);
            const fixDef = new Box2D.Dynamics.FixtureDef();
            fixDef.shape = shape;
            this.truck.createFixture(fixDef);

            truck.userData.body = this.truck;

            jointDef.bodyA = truck.userData.body;
            jointDef.localAnchorA = new Box2D.Common.Math.Vec2(0, 10);

            let health = new THREE.Group();
            health.position.x = healthCursor;
            healthCursor -= 35;

            truck.userData.healthObj = health;
            for (let i = 0; i <= truck.userData.health; i++) {
                let obj = this.objects[type + `_health${i}`].clone();
                obj.visible = (i === truck.userData.health);
                health.add(obj);
            }

            this.uiHealths.add(health);
        }

        let carCursor = -100;
        params.truck?.cargo?.forEach((type, i) => {
            this.#maxY -= 30;

            const container = new THREE.Group();
            container.userData.isPlayer = true;
            container.userData.health = 4;
            for (let i = 0; i <= container.userData.health; i++) {
                let obj = this.objects[type + `_health${i}`].clone();
                obj.rotateY(Math.PI / 2);
                obj.visible = (i === container.userData.health);
                container.add(obj);
            }

            carCursor += CONTAINER_H;
            container.position.z = carCursor;
            this.worldBase.add(container);

            const bodyDef = new Box2D.Dynamics.BodyDef();
            bodyDef.type = Box2D.Dynamics.Body.DYNAMIC_BODY;
            bodyDef.position.y = container.position.z;
            bodyDef.userData = container;
            const body = this.world.createBody(bodyDef);

            const shape = new Box2D.Collision.Shapes.PolygonShape();
            shape.setAsBox(CONTAINER_W / 2, CONTAINER_H / 2);
            const fixDef = new Box2D.Dynamics.FixtureDef();
            fixDef.shape = shape;
            body.createFixture(fixDef);

            container.userData.body = body;

            jointDef.bodyB = body;
            jointDef.localAnchorB = new Box2D.Common.Math.Vec2(0, -20);
            jointDef.length = 2;
            jointDef.collideConnected = true;
            this.world.createJoint(jointDef);

            jointDef = new Box2D.Dynamics.Joints.DistanceJointDef();
            jointDef.bodyA = container.userData.body;
            jointDef.localAnchorA = new Box2D.Common.Math.Vec2(0, 20);

            // Create UI health element
            let health = new THREE.Group();
            health.position.x = healthCursor;
            healthCursor -= 40;
            health.userData.container = container;

            container.userData.healthObj = health;
            for (let i = 0; i <= container.userData.health; i++) {
                let obj = this.objects[type + `_health${i}`].clone();
                obj.visible = (i === container.userData.health);
                health.add(obj);
            }
            this.uiHealths.add(health);
        });
    }

    init() {
        super.init();

        this.perspective(60);
        this.lookAt(
            new THREE.Vector3(100, 200, -150).multiplyScalar(SCALE),
            new THREE.Vector3(0, 0, -150).multiplyScalar(SCALE)
        );

        this.createUI();
    }

    createUI() {
        this.uiRenderer = new THREE.WebGLRenderer({ antialias: true });
        this.uiRenderer.setSize(this.game.width, this.game.height);
        this.uiAmbient = new THREE.AmbientLight(0xffffff, 1);
        this.uiCamera = new THREE.OrthographicCamera(
            -this.game.width / UI_SCALE,
            this.game.width / UI_SCALE,
            this.game.height / UI_SCALE,
            -this.game.height / UI_SCALE,
            -10,
            1000
        );

        this.uiScene.add(this.uiAmbient);

        let progressBar = new THREE.Group();
        progressBar.position.x = 60;
        progressBar.position.y = 58;
        this.uiScene.add(progressBar);

        this.uiHealths.scale.set(0.5, 0.5, 0.5);
        this.uiHealths.position.x = -30;
        this.uiHealths.position.y = 56;
        this.uiScene.add(this.uiHealths);

        let container = this.objects["progress_container"].clone();
        container.position.z--;
        progressBar.add(container);
        progressBar.add(this.uiProgress);

        {
            // Create in-game display
            let geometry = new THREE.BoxGeometry(1280 / 5, 720 / 5, 1);
            this.uiTexture = new THREE.CanvasTexture(this.uiRenderer.domElement);
            let material = new THREE.MeshBasicMaterial({ map: this.uiTexture, color: 0xffffff });
            let gameElement = new THREE.Mesh(geometry, material);
            gameElement.position.z -= 10;
            this.uiScene.add(gameElement);
        }

        this.setProgress(0);
    }

    takeDamage(object: THREE.Object3D) {
        const userData = object.userData as { health: number, healthObj: THREE.Group };
        userData.health = Math.max(userData.health - 1, 0);
        object.children.forEach((child, i) =>
            child.visible = (i === userData.health));
        userData.healthObj.children.forEach((child, i) =>
            child.visible = (i === userData.health));
    }

    setProgress(percentComplete: number) {
        this.uiProgress.position.x = 124 * (percentComplete - 0.5);
    }

    getSpeedDamping() {
        const healthPercent = this.truck.getUserData().userData.health / TRUCK_HEALTH;
        return (4 * healthPercent + 1) / 5;
    }

    getSpeed() {
        return this.#playerSpeed * this.getSpeedDamping();
    }

    update(dt: number) {
        const LEFT = 'UP';
        const RIGHT = 'DOWN';
        const UP = 'RIGHT';
        const DOWN = 'LEFT';

        const speed = this.#playerSpeed;
        const damping = this.getSpeedDamping();

        this.truck.setLinearVelocity(new Box2D.Common.Math.Vec2(0, -this.#playerSpeed));
        if (this.game.keyDown(LEFT)) {
            this.truck.getLinearVelocity().add(new Box2D.Common.Math.Vec2(-130 * damping, 0));
        }

        if (this.game.keyDown(RIGHT)) {
            this.truck.getLinearVelocity().add(new Box2D.Common.Math.Vec2(130 * damping, 0));
        }

        if (this.game.keyDown(UP) && this.truck.getPosition().y > this.#minY) {
            this.truck.getLinearVelocity().add(new Box2D.Common.Math.Vec2(0, -120 * damping));
        }

        if (this.game.keyDown(DOWN) && this.truck.getPosition().y < this.#maxY) {
            this.truck.getLinearVelocity().add(new Box2D.Common.Math.Vec2(0, 200 * damping));
        }

        for (let i = 0; i < TICKS; i++) {
            this.world.step(dt / TICKS, 5, 5);
        }

        this.progress += speed * dt;
        this.setProgress(this.progress / this.totalDistance);

        if (this.progress >= this.totalDistance) {
            this.onWin();
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

        let boundsMovement = speed * dt

        this.#minY -= boundsMovement;
        this.#maxY -= boundsMovement;
        this.worldBase.position.z += boundsMovement;
        let worldPosition = this.roadObj.getWorldPosition(new THREE.Vector3());
        while (worldPosition.z > 500) {
            this.roadObj.position.z -= 550;
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

        return super.update(dt);
    }

    onWin() {
        console.log('win');
        this.progress = 0;
    }

    render(renderer: THREE.Renderer) {
        this.uiRenderer?.render(this.scene, this.camera);
        this.uiTexture.needsUpdate = true;

        if (this.uiCamera) {
            renderer.render(this.uiScene, this.uiCamera);
        }
    }

    beginContact(contact: Box2D.Dynamics.Contacts.Contact) {
        let bodyA = contact.getFixtureA().getBody();
        let bodyB = contact.getFixtureB().getBody();

        if (bodyB.getUserData().userData.isObstacle) {
            let temp = bodyB;
            bodyB = bodyA;
            bodyA = temp;
        }

        if (
            bodyA.getUserData().userData.isObstacle &&
            bodyB.getUserData().userData.isPlayer
        ) {
            bodyA.getUserData().userData.isObstacle = false;
            this.obstacles.remove(bodyA.getUserData());
            this.world.destroyBody(bodyA);
            this.takeDamage(bodyB.getUserData());
        }
    }
}
