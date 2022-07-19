/* eslint-disable @typescript-eslint/dot-notation */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatabaseServices } from 'src/app/services/database/database.page';
import { Session } from 'src/app/services/variables/variables.page';

@Component({
  selector: 'app-followers',
  templateUrl: './followers.page.html',
  styleUrls: ['./followers.page.scss'],
})
export class FollowersPage implements OnInit {

  userid;
  username;
  followers = [];
  followings = [];

  // handle segment
  section = '';

  isuserProfile = false;        // Verifica se este e o perfil do utilizador logado
  sessionStarted = false;       // Verifica se existe algum utilizador logado

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private dbServices: DatabaseServices,
    private session: Session) { }

  ngOnInit() {
    this.userid = this.route.snapshot.paramMap.get('id');
    const followingSection = this.route.snapshot.paramMap.get('section');

    this.section = (followingSection === 'true') ? 'following' : 'followers';

    this.dbServices.getuserInfo(this.userid).then((response) => {
      this.username = response['name'];
    });

    this.dbServices.getFollowers(this.userid).then((response) => {
      response.forEach(followerid => {
        this.dbServices.getuserInfo(followerid).then((userinfo) => {
          this.followers.push({
              id: followerid,
              name: userinfo["name"],
              imageurl: userinfo["profileurl"]
          });
        });
      });
    });

    this.dbServices.getFollowing(this.userid).then((response)=> {
      response.forEach(followingid => {
        this.dbServices.getuserInfo(followingid).then((userinfo) => {
          this.followings.push({
            id: followingid,
            name: userinfo["name"],
            imageurl: userinfo["profileurl"]
          });
        });
      });
    });

    console.log(this.followers);
    console.log(this.followings);
  }

  // Fired when the component routing to is about to animate into view
  ionViewWillEnter() {
    this.isuserProfile = (this.session.userid === this.userid);
  }

  // Remove following
  removeFollowing(followid) {
    this.dbServices.removeFollowing(this.userid, followid);
    this.navigateUserpage(this.session.userid);
  }

  // Remove follower
  removeFollower(followerid) {
    this.dbServices.removeFollower(this.userid, followerid);
    this.navigateUserpage(this.session.userid);
  }

  //
  ///// Navigation functions
  goBack() { this.router.navigate(['userpage', this.userid]);}
  navigateUserpage(userid) { this.router.navigate(['userpage', userid]); }
}
