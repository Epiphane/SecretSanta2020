import {
   State,
   Entity,
   Component,
   Sound,
   BoxComponent as Box,
   ImageComponent as Image,
   TextComponent as Text,
   BehaviorComponent as Behavior,
} from '../../lib/juicy';
import Dude, { BoxComponent } from '../entities/dude_entity';
import Custom from '../components/custom_component';
import Point from '../../lib/juicy.point';

class MyComponent extends Component {
   init() {
      console.log('I got initialized later!');
   }
}

export default class GameScreen extends State {
   dudeWithComponent: Entity;
   title: Entity;
   lastButton: string = '';

   constructor() {
      super();

      // Create a new Entity with the Image Component
      // Image is a basic component of Juicy Engine.
      // It basically fills up the entire bounding box of this entity
      // with a specific image you set
      let pic = new Entity(this, [Image]);
      pic.position.x = 300;
      pic.getComponent(Image)?.setImage('img/doge.jpeg');
      this.add(pic);

      // This is virtually the same, as an example of a custom entity
      let dude = new Dude(this);
      dude.position.x = 10;
      dude.position.y = 10;
      dude.getComponent(Box)!.fillStyle = 'green';
      this.add(dude);

      // Another feature is Juicy.Text. You can initialize it with
      // any amount of parameters, in the order [text, font, color, alignment]
      // If you want to change these later, use text.set(...);
      let title = new Entity(this, [Text]);
      title.getComponent(Text)?.set({
         text: 'Hello!',
         font: '40pt Arial',
         fillStyle: 'white'
      });
      this.title = title;
      title.position.x = (this.game.width - this.title.width) / 2;
      title.position.y = 100;

      let sub = new Entity(this, [Text]);
      sub.getComponent(Text)?.set({
         text: 'Welcome to JuicyJS!'
      });
      sub.position = new Point(200, 100);

      // Another basic entity. This one uses our Custom component
      // defined in src/components.custom.js
      this.dudeWithComponent = new Entity(this, [Custom, Text]);
      this.dudeWithComponent.position.x = 100;
      this.dudeWithComponent.position.y = 300;
   }

   init() {
      this.dudeWithComponent.addComponent(MyComponent);

      this.lastButton = '';
      this.game.on('key', ['W', 'A', 'S', 'D'], (key) => {
         // Text is buffered on a separate slate, so this actually renders it
         // in the background.
         this.title.getComponent(Text)?.set({
            text: 'Hello! You pressed ' + key
         });

         // this.updated is interesting. it tells the engine whether anything
         // has changed since the last frame. If it's false, then nothing is
         // re-rendered. It's good for keeping the game less heavy on simple stuff
         // like the title screen, which doesn't change often.
         this.updated = true;
      });

      // Load jump sound
      Sound.load('jump', 'fx_jump.mp3');
   }

   key_UP() {
      console.log('up!');

      Sound.play('jump');
   }

   // click is called whenever the scene gets clicked on
   // x and y are always scaled, so they will be from [0, GAME_WIDTH] and [0, GAME_HEIGHT]
   click(x: number, y: number) {
      console.log(x, y);
   }

   update(dt: number) {
      if (this.game.keyDown('UP')) {
         this.lastButton = '^';
         this.updated = true;

         // Get the Custom component on dudeWithComponent and call a function
         this.dudeWithComponent.getComponent(Custom)?.increment();
      }

      return super.update(dt);
   }
};
