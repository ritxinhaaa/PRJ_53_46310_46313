import { Component, OnInit } from '@angular/core';

import { PushNotifications } from "@capacitor/push-notifications";
import { AngularFireMessaging } from '@angular/fire/compat/messaging';

@Component({
  selector: 'app-fcm',
  templateUrl: './fcm.page.html',
  styleUrls: ['./fcm.page.scss'],
})
export class FcmPage implements OnInit {

  token: string = "";

  constructor() {
  }

  ngOnInit() {

    PushNotifications.addListener("registration", (token) => {
      this.token = token.value;
    })

    PushNotifications.addListener("pushNotificationReceived", (notification) => {
      alert(JSON.stringify(notification));
    })

    // Register the app to receive push notifications
    PushNotifications.register();

    PushNotifications.requestPermissions().then((answer) => {
      if(answer.receive) {
        PushNotifications.createChannel({
            id: 'relay',
            name: 'relay',
            description: 'This is a notification',
            sound: '',
            importance: 1,
            visibility: 1,
            lights: true,
            vibration: true,
        })
      }
    })
  }

  sendNotification() {
  }

}
