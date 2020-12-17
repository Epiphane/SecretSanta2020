import { Game } from '../lib/juicy';
import GameScreen from './states/game_screen';
import Keys from './helpers/keys';
import * as THREE from '../lib/three.js';
import LoadingScreen from './states/load_screen';

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

let renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(GAME_WIDTH, GAME_HEIGHT);
document.body.appendChild(renderer.domElement);

Game.init(renderer, GAME_WIDTH, GAME_HEIGHT, Keys);

// On window resize, fill it with the game again!
window.onresize = function () {
    Game.resize();
};

Game.setState(new LoadingScreen()).run();

Game.setDebug(document.getElementById("fps")!);
