/* -------------------- Animation frames ----------------- */
window.requestAnimationFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        (window as any).mozRequestAnimationFrame ||
        (window as any).oRequestAnimationFrame ||
        (window as any).msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

/* Exports in use */
import Point from './juicy.point';

/* Passthrough exports */
export * from './juicy.sound';
export * from './juicy.point';

interface KeyNameToCodeMap {
    [key: string]: number
};

class Game {
    #running: boolean = false;
    #state: State = new State();
    #lastTime: number = 0;

    #canvas: HTMLCanvasElement | undefined;
    #context: CanvasRenderingContext2D | undefined;

    width: number = 0;
    height: number = 0;
    #scale: Point = new Point(1);

    #KEYS: KeyNameToCodeMap = {};
    #CODES: { [key: number]: string } = {};

    #keyState: { [key: number]: boolean } = {};
    #listener: { [key: string]: EventListener } = {};

    init(canvas: HTMLCanvasElement, width: number, height: number, keys: KeyNameToCodeMap) {
        this.width = width;
        this.height = height;

        this.setCanvas(canvas);

        // Input stuff
        this.#KEYS = keys || {};
        this.#CODES = {};
        for (let key in keys) {
            this.#CODES[keys[key]] = key;
        }

        // document hooks
        document.onkeydown = (evt) => {
            this.#keyState[evt.keyCode] = true;
        };
        document.onkeyup = (evt) => {
            this.#keyState[evt.keyCode] = false;

            let method = 'key_' + this.#CODES[evt.keyCode];
            let state = this.#state as any;
            if (state && state[method]) {
                state[method](this.#CODES[evt.keyCode]);
            }
        };

        return this; // Enable chaining
    }

    clear() {
        for (let action in this.#listener) {
            document.removeEventListener(action, this.#listener[action]);
        }
        this.#listener = {};
    }

    setCanvas(canvas: HTMLCanvasElement) {
        this.#canvas = canvas;
        let context = canvas.getContext('2d');
        if (!context) {
            throw Error('Could not get 2D rendering context for Canvas');
        }
        this.#context = context;

        let startDrag: MouseEvent | undefined;
        canvas.onmousedown = (evt) => {
            startDrag = evt;
            this.trigger('dragstart', evt);
        };
        canvas.onmouseup = (evt) => {
            if (!startDrag) {
                return;
            }

            let startPos = this.getCanvasCoords(startDrag);
            let endPos = this.getCanvasCoords(evt);

            if (startPos.sub(endPos).length() <= 2) {
                this.trigger('click', evt);
            }
            else {
                this.trigger('dragend', evt);
            }

            startDrag = undefined;
        };
        canvas.onmousemove = (evt) => {
            if (startDrag) {
                this.trigger('drag', evt);
            }
        }

        this.resize();
        return this; // Enable chaining
    }

    resize() {
        if (!this.#canvas) {
            throw Error('Game was not properly initialized - canvas is unavailable');
        }

        let parent = this.#canvas.parentElement;
        let width = parent ? parent.clientWidth : this.#canvas.clientWidth;
        let height = parent ? parent.clientHeight : this.#canvas.clientHeight;

        this.#canvas.width = width;
        this.#canvas.height = width * this.height / this.width;
        if (this.#canvas.height > height) {
            this.#canvas.height = height;
            this.#canvas.width = height * this.width / this.height;
        }
        this.#scale = new Point(this.#canvas.width / this.width, this.#canvas.height / this.height);

        // Make sure we re-render
        if (this.#state) {
            this.#state.hasRendered = false;
        }

        return this; // Enable chaining
    }

    keyDown(key: string | string[]) {
        if (typeof (key) === 'string') {
            return this.#keyState[this.#KEYS[key]];
        }
        else {
            for (let k = 0; k < key.length; k++) {
                if (this.keyDown(key[k]))
                    return true;
            }

            return false;
        }
    }

    trigger(evt: string, pos: MouseEvent) {
        let state = this.#state as any;
        if (state && state[evt]) {
            state[evt](this.getCanvasCoords(pos));
        }
    }

    on(action: string, keys: string | string[], callback?: EventListener) {
        if (action === 'key') {
            if (typeof (keys) !== 'object') {
                keys = [keys];
            }

            for (let i = 0; i < keys.length; i++) {
                let key = keys[i];

                (this.#state as any)['key_' + key] = callback;
            }
        }
        else {
            callback = keys as any as EventListener;
            if (this.#listener[action]) {
                document.removeEventListener(action, this.#listener[action]);
            }

            this.#listener[action] = callback;
            document.addEventListener(action, this.#listener[action]);
        }

        return this; // Enable chaining
    };

    getCanvasCoords(evt: MouseEvent) {
        if (!this.#canvas) {
            throw Error('Game was not properly initialized - canvas is unavailable');
        }

        let canvasRect = this.#canvas.getBoundingClientRect();
        let mx = evt.clientX - canvasRect.left;
        let my = evt.clientY - canvasRect.top;

        return new Point(Math.floor(mx * this.width / this.#canvas.width), Math.floor(my * this.height / this.#canvas.height));
    }

    setState(state: State) {
        this.clear();

        this.#state = state;
        this.#state.game = this;
        this.#state.init();
        this.#state.hasRendered = false;

        return this; // Enable chaining
    }

    update() {
        if (!this.#running) {
            return;
        }

        requestAnimationFrame(() => this.update());
        let nextTime = new Date().getTime();
        let dt = (nextTime - this.#lastTime) / 1000;
        if (dt > 0.2) {
            this.#lastTime = nextTime;
            return;
        }

        try {
            let updated = !this.#state.update(dt) || this.#state.updated;
            this.#state.updated = false;

            this.#lastTime = nextTime;

            if (updated || !this.#state.hasRendered) {
                this.render();
                this.#state.hasRendered = true;
            }
        }
        catch (e) {
            console.error(e);
            this.pause();
        }
    }

    render() {
        if (!this.#context) {
            throw Error('Game was not properly initialized - context is unavailable');
        }

        this.#context.save();

        this.#context.scale(this.#scale.x, this.#scale.y);
        if (!this.#state.stopClear) {
            this.#context.clearRect(0, 0, this.width, this.height);
        }

        this.#state.render(this.#context);

        this.#context.restore();

        return this; // Enable chaining
    }

    run() {
        this.#running = true;
        this.#lastTime = new Date().getTime();

        this.update();

        return this; // Enable chaining
    };

    pause() {
        this.#running = false;
    }
}

let game: Game;

/* -------------------- Game State_ ----------------------- */
/*
 * new State_() - Construct new state
 *  [Constructor]
 *    init   ()          - Run every time the state is swapped to.
 *  [Useful]
 *    click  (evt)       - When the user clicks the state
 *    update (dt, input) - Run before rendering. Use for logic.
 *                         IMPORTANT: return true if you don't want to re-render
 *    render (context)   - Run after  update.    Use for graphics
 */
export class State {
    /** @internal */
    hasRendered: boolean = false;
    updated: boolean = false;
    stopClear: boolean = false;

    game: Game = game;
    entities: Entity[] = [];

    init() {

    }

    update(dt: number) {
        this.entities.forEach(e => {
            e.update(dt);
        });

        return false;
    }

    render(context: CanvasRenderingContext2D) {
        this.entities.forEach(e => {
            e.render(context);
        });
    }

    add(e: Entity) {
        this.entities.push(e);
    }
};

/* -------------------- Game Entity ----------------------- */
/*
 * new Entity(components) - Construct new entity
 *  [Static Properties]
 *    components       - Array of component constructors
 *  [Constructor]
 *    addComponent (c[, name]) - Add a component to the entity
 *  [Useful]
 *    getComponent (c) - Get an (updated) component.
 *    update (dt, c)   - Calls update on all components, or just c
 *    render (context) - Calls render on all components
 */
export type RenderArgs = [CanvasRenderingContext2D, number, number, number, number];

export class Entity {
    state: State;

    props: { [key: string]: any };
    position: Point;
    scale: Point;
    width: number = 0;
    height: number = 0;
    children: Entity[];
    parent: Entity | undefined;

    components: Component[] = [];
    updated: boolean[] = [];

    constructor(state: State, components?: (new () => Component)[]) {
        this.props = {};
        this.position = new Point();
        this.scale = new Point(1);
        this.children = [];

        components = (components || []).concat(this.initialComponents());
        components.forEach(c => this.addComponent(c));

        this.state = state;

        this.init();
    }

    init() {

    }

    initialComponents(): (new () => Component)[] {
        return [];
    }

    addComponent(c: Component | (new () => Component)) {
        if (typeof (c) === 'function') {
            c = new c();
            c.entity = this;
            c.init(this);
        }

        this.components.push(c);
        this.updated.push(false);
    }

    getComponent<C extends Component>(constructor: (new () => C)): C | undefined {
        for (let i = 0; i < this.components.length; i++) {
            if ((this.components[i] as any).__proto__.constructor.name === constructor.name) {
                return this.components[i] as C;
            }
        }
    }

    addChild(child: Entity) {
        child.parent = this;
        this.children.push(child);
    }

    update<C extends Component>(dt: number, constructor?: (new () => C)) {
        if (constructor) {
            for (let i = 0; i < this.components.length; i++) {
                if ((this.components[i] as any).__proto__.name === constructor.name) {
                    if (!this.updated[i]) {
                        this.components[i].update(dt, this.state.game);
                        this.updated[i] = true;
                    }
                    break;
                }
            }
        }
        else {
            this.updated.fill(false);
            for (let i = 0; i < this.components.length; i++) {
                if (!this.updated[i]) {
                    this.components[i].update(dt, this.state.game);
                    this.updated[i] = true;
                }
            }
        }
    }

    render(context: CanvasRenderingContext2D) {
        context.save();
        let pos = this.position;
        context.translate(pos.x, pos.y);
        context.scale(this.scale.x, this.scale.y);

        let args = Array.prototype.slice.call(arguments) as RenderArgs;
        if ((args as any[]).length === 1) {
            args = [args[0], 0, 0, this.width, this.height];
        }

        for (let key in this.components) {
            this.components[key].render.apply(this.components[key], args);
        }

        if (this.children.length > 0) {
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].render(context);
            }

        }
        context.restore();
    }

    globalPosition(): Point {
        let position = this.position;
        let parent = this.parent;
        if (parent) {
            return parent.globalPosition().add(this.position.clone().mult(parent.globalScale()));
        }
        else {
            return position;
        }
    }

    globalScale(): Point {
        let scale = this.scale;
        if (this.parent) {
            return this.scale.mult(this.parent.globalScale());
        }
        else {
            return scale;
        }
    }

    contains(point: Point) {
        point = point.clone().sub(this.position);
        return point.x >= 0 && point.y >= 0 &&
            point.x <= this.width && point.y <= this.height;
    }

    distance(other: Entity | Point) {
        let point = (other instanceof Entity) ? other.position : other;
        return this.position.clone().sub(point).length();
    }

    testCollision(other: Entity) {
        let otherBottomRight = other.position.add(new Point(other.width, other.height));
        let bottomRight = this.position.add(new Point(this.width, this.height));

        return otherBottomRight.x >= this.position.x &&
            otherBottomRight.y >= this.position.y &&
            other.position.x <= bottomRight.x &&
            other.position.y <= bottomRight.y;
    }
}

/* -------------------- Game Component -------------------- */
/*
 * new Component(entity) - Construct new component on an entity
 *  [Static Properties]
 *    name             - Name of the component
 *  [Useful]
 *    update (dt)      - Update component (if applicable)
 *    render (context) - Render component (if applicable)
 *
 * Component.create(name, prototype, static[, force])
 *    - Extend and register by name. Force to override another component
 */
export class Component {
    entity!: Entity;

    init(e: Entity) { }
    update(dt: number, game: Game) { }
    render(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) { }
}

/* -------------------- Typical Components --------------- */
export class ImageComponent extends Component {
    #tint: string | CanvasGradient | CanvasPattern | undefined;
    opacity: number = 1;
    image: HTMLImageElement = new Image();

    width: number | undefined;
    height: number | undefined;

    onload: ((img: ImageComponent) => void) | undefined;
    #canvas: HTMLCanvasElement | undefined;

    init(entity: Entity) {
        this.opacity = 1;

        this.image.onload = () => {
            if (!entity.width && !entity.height) {
                entity.width = this.image.width;
                entity.height = this.image.height;
            }

            if (this.#tint) {
                this.setTint(this.#tint);
            }

            if (this.onload) {
                this.onload(this);
            }

            entity.state.updated = true;
        }
        this.image.onerror = () => {
            this.image = new Image();
        }
    }

    setTint(tint: string | CanvasGradient | CanvasPattern) {
        // TODO glean alpha of tint
        this.#tint = tint;

        if (this.image.complete) {
            // Apply tint
            this.#canvas = this.#canvas || document.createElement('canvas');
            this.#canvas.width = this.image.width;
            this.#canvas.height = this.image.height;

            let context = this.#canvas.getContext('2d');
            if (!context) {
                throw Error('Failed getting image context');
            }

            context.fillStyle = this.#tint;
            context.fillRect(0, 0, this.#canvas.width, this.#canvas.height);

            // destination atop makes a result with an alpha channel identical to fg,
            // but with all pixels retaining their original color *as far as I can tell*
            context.globalCompositeOperation = "destination-atop";
            context.globalAlpha = 0.75;
            context.drawImage(this.image, 0, 0);
            context.globalAlpha = 1;
        }

        return this; // Enable chaining
    }

    setImage(url: string) {
        this.image.src = url;

        return this; // Enable chaining
    }

    render(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
        let originalAlpha = context.globalAlpha;

        context.globalAlpha = this.opacity;
        context.drawImage(this.image, x, y, w, h);

        if (this.#tint && this.#canvas) {
            context.drawImage(this.#canvas, x, y, w, h);
        }

        // Restore original global alpha
        context.globalAlpha = originalAlpha;
    }
}

export class BoxComponent extends Component {
    fillStyle: string | CanvasGradient | CanvasPattern = 'white';

    render(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
        context.fillStyle = this.fillStyle;
        context.fillRect(x, y, w, h);
    }
}

export interface TextInfo {
    font: string;
    text: string;
    fillStyle: string | CanvasGradient | CanvasPattern;
}

export class TextComponent extends Component {
    #canvas: HTMLCanvasElement;
    #context: CanvasRenderingContext2D;

    textInfo: TextInfo = {
        font: '32px Arial',
        text: '',
        fillStyle: 'white',
    };
    opacity: number = 1;

    constructor() {
        super();

        this.#canvas = document.createElement('canvas');
        this.#context = this.#canvas.getContext('2d') as CanvasRenderingContext2D;
    }

    set(config: Partial<TextInfo>) {
        let entity = this.entity;
        let context = this.#context;
        let canvas = this.#canvas;

        // Set attributes
        Object.assign(this.textInfo, config);

        // Measure the text size
        context.font = this.textInfo.font;
        context.fillStyle = this.textInfo.fillStyle;
        let size = context.measureText(this.textInfo.text);

        // Resize canvas
        entity.width = canvas.width = Math.ceil(size.width);
        entity.height = canvas.height = Math.ceil(parseInt(this.textInfo.font) * 5 / 3);

        // Draw text
        context.textBaseline = 'top';
        context.font = this.textInfo.font;
        context.fillStyle = this.textInfo.fillStyle;
        context.fillText(this.textInfo.text, 0, 0);
    }

    render(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
        // Save original alpha
        let originalAlpha = context.globalAlpha;
        context.globalAlpha = this.opacity;

        arguments[0] = this.#canvas;
        context.drawImage(this.#canvas, x, y, w, h);

        context.globalAlpha = originalAlpha;
    }
};

export type Behavior = (dt: number, game: Game) => void;
export class BehaviorComponent extends Component {
    callback: Behavior;

    constructor(callback: Behavior) {
        super();

        this.callback = callback;
    }

    update(dt: number, game: Game) {
        this.callback(dt, game);
    }
}

/* -------------------- Helper functions ----------------- */
/*
 * Juicy.rand([min, ] max) - Return a random int between [min, max)
 */
export function rand(min: number, max: number) {
    if (max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
    else {
        return Math.floor(Math.random() * min);
    }
};

game = new Game();
export { game as Game };
