import { Component } from '../../lib/juicy';

export default class CustomComponent extends Component {
   val: number = 10;

   increment() {
      this.val += 10;

      this.entity.position.x++;
   }
};
