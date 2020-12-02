import { Entity, BoxComponent as Box } from '../../lib/juicy';

// AND the last piece is Entities! You can easily
// just assign a type of entity to a variable,
// to avoid keeping track of what components to add.
export default class Dude extends Entity {
   initialComponents() {
      return [Box];
   }

   init() {
      this.width = 60;
      this.height = 60;

      let box = this.getComponent(Box);
      if (box) {
         box.fillStyle = 'red';
      }
   }
};

export { BoxComponent } from '../../lib/juicy';
