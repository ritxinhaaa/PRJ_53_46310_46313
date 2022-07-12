import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'cover',
    pathMatch: 'full'
  },
  {
    path: 'cover',
    loadChildren: () => import('./pages/cover/cover.module').then( m => m.CoverPageModule)
  },
  {
    path: 'welcome',
    loadChildren: () => import('./pages/welcome/welcome.module').then( m => m.WelcomePageModule)
  },
  {
    path: 'connect',
    loadChildren: () => import('./pages/connect/connect.module').then( m => m.ConnectPageModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./pages/register/register.module').then( m => m.RegisterPageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'homepage',
    loadChildren: () => import('./pages/homepage/homepage.module').then( m => m.HomepagePageModule)
  },
  {
    path: 'forgotpassword',
    loadChildren: () => import('./pages/forgotpassword/forgotpassword.module').then( m => m.ForgotpasswordPageModule)
  },
  {
    path: 'addrecipe',
    loadChildren: () => import('./pages/addrecipe/addrecipe.module').then( m => m.AddrecipePageModule)
  },
  
  {
    path: 'recipepage/:id',
    loadChildren: () => import('./pages/recipepage/recipepage.module').then( m => m.RecipepagePageModule)
  },
  {
    path: 'userpage/:id',
    loadChildren: () => import('./pages/userpage/userpage.module').then( m => m.UserpagePageModule)
  },
  {
    path: 'favorites',
    loadChildren: () => import('./pages/favorites/favorites.module').then( m => m.FavoritesPageModule)
  },
  {
    path: 'followers/:id/:section',
    loadChildren: () => import('./pages/followers/followers.module').then( m => m.FollowersPageModule)
  },
  {
    path: 'editrecipe',
    loadChildren: () => import('./pages/editrecipe/editrecipe.module').then( m => m.EditrecipePageModule)
  },
  {
    path: 'shoppinglist',
    loadChildren: () => import('./pages/shoppinglist/shoppinglist.module').then( m => m.ShoppinglistPageModule)
  },
  {
    path: 'fcm',
    loadChildren: () => import('./pages/fcm/fcm.module').then( m => m.FcmPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
