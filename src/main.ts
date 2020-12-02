import { Game } from '../lib/juicy';
import GameScreen from './states/game_screen';
import Keys from './helpers/keys';

Game.init(document.getElementById('game-canvas') as HTMLCanvasElement, 1024, 768, Keys);

// On window resize, fill it with the game again!
window.onresize = function () {
    Game.resize();
};

Game.setState(new GameScreen()).run();
