import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DragdropComponent } from './dragdrop/dragdrop.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet , DragdropComponent ],
  templateUrl: 'app.component.html',
  styleUrl: 'app.component.css'
})
export class AppComponent {

}
