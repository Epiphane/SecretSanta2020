import {
   Point,
   State,
   Entity,
   Component,
   Sound,
   BoxComponent as Box,
   ImageComponent as Image,
   TextComponent as Text,
   BehaviorComponent as Behavior,
} from '../../lib/juicy';

export default class GameScreen extends State {
   allySpawnZone: Entity = new Entity(this, [Box]);

   constructor() {
      super();

      const black = '#272B25';
      const white = '#66725D';
      const TILE_SIZE = 135; //1080 / 8;

      for (let i = 0; i < 8; i++) {
         for (let j = 0; j < 8; j++) {
            let pic = new Entity(this, [Box]);
            pic.position.x = i * TILE_SIZE;
            pic.position.y = j * TILE_SIZE;
            pic.width = TILE_SIZE;
            pic.height = TILE_SIZE;
            pic.getComponent(Box)?.setFillStyle((i + j) % 2 === 0 ? black : white);
         }
      }

      this.allySpawnZone.width = TILE_SIZE * 8;
      this.allySpawnZone.height = TILE_SIZE * 3;
      this.allySpawnZone.position.y = TILE_SIZE * 5;
      this.allySpawnZone.getComponent(Box)?.setFillStyle('red');
   }

   init() {
   }

   key_UP() {
   }

   click(x: number, y: number) {
   }

   update(dt: number) {
      return super.update(dt);
   }
};
