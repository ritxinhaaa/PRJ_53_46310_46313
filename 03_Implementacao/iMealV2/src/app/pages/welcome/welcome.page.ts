import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { AlertController, AnimationController } from '@ionic/angular';
import { NavController } from '@ionic/angular';

// App services
import { Session } from 'src/app/services/variables/variables.page';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
})

export class WelcomePage implements AfterViewInit {
  @ViewChild('title', { read: ElementRef, static: true}) title: ElementRef;

  constructor(
    public session: Session,
    private animationCtrl: AnimationController,
    public nav: NavController) {
    }

  ngAfterViewInit() {
    const animation = this.animationCtrl
      .create()
      .addElement(this.title.nativeElement)
      .duration(1500)
      .fromTo('opacity', 0.1, 1);

    animation.play();
  }

  async showAlert(title, msg, task) {
    const alert = await new AlertController().create({
      header: title,
      subHeader: msg
    });
    alert.present();
  }

  nextPage() { this.nav.navigateForward('/connect'); }
}
