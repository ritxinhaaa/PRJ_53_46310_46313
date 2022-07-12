import { Component, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { AnimationController } from '@ionic/angular';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-cover',
  templateUrl: './cover.page.html',
  styleUrls: ['./cover.page.scss'],
})

export class CoverPage implements AfterViewInit {
  @ViewChild('title', { read: ElementRef, static: true}) title: ElementRef;

  constructor(
    private router: Router,
    public nav: NavController,
    private animationCtrl: AnimationController,){}

  ngAfterViewInit() {
    const animation = this.animationCtrl
      .create()
      .addElement(this.title.nativeElement)
      .duration(1500)
      .fromTo('opacity', 1, 0.1);

    animation.play();

    setTimeout(() => {
      this.nav.navigateForward('/welcome', { animated: false });
    }, 1500);
  }
}