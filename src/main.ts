import { Game } from '../lib/juicy';
import GameScreen from './states/game_screen';
import Keys from './helpers/keys';
import * as THREE from '../lib/three.js';

const GAME_WIDTH = 1600;
const GAME_HEIGHT = 900;

let renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(GAME_WIDTH, GAME_HEIGHT);
document.body.appendChild(renderer.domElement);

Game.init(renderer, GAME_WIDTH, GAME_HEIGHT, Keys);

// On window resize, fill it with the game again!
window.onresize = function () {
    Game.resize();
};

Game.setState(new GameScreen()).run();
