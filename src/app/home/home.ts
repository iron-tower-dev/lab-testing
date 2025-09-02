import { Component } from '@angular/core';
import { SharedModule } from '../shared-module';

@Component({
  selector: 'app-home',
  imports: [SharedModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {

}
