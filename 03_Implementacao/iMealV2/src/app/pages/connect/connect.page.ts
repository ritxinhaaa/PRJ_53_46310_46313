import { Component, OnInit } from '@angular/core';
import { Session } from 'src/app/services/variables/variables.page';

@Component({
  selector: 'app-connect',
  templateUrl: './connect.page.html',
  styleUrls: ['./connect.page.scss'],
})
export class ConnectPage implements OnInit {

  constructor(private session: Session) {
  }

  ngOnInit() {
  }

  // fill() { this.session.readJson(); }
}
