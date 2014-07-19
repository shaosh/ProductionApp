// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'angular.css.injector'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider){
  $stateProvider

    .state('splash', {
      url: "/",
      templateUrl: "templates/splash.html",
      abstract: true
    })

    .state('login', {
      url: '/login',
      templateUrl: "templates/login.html", 
      controller: 'LoginCtrl'
    })

    // .state('user', {
    //   url: "/:username",
    //   templateUrl: "templates/navview.html",
    //   abstract: true
    // })

    .state('overview', {
      url: '/:username/jobs',
      templateUrl: "templates/overview.html", 
      controller: 'OverviewCtrl'
    })

    // .state('job', {
    //   url: "/job",
    //   templateUrl: "templates/navview.html",
    //   abstract: true
    // })

    .state('jobview', {
      url: '/:username/jobs/:jobId',
      templateUrl: "templates/jobview.html", 
      controller: 'JobviewCtrl'
    });

    // .state('managerJobview', {
    //   url: '/manager/:userId/:jobId',
    //   templateUrl: "templates/jobview.html", 
    //   controller: 'JobviewCtrl'
    // });
  
  $urlRouterProvider.otherwise('/login');


    // $urlRouterProvider.otherwise(
      // function(){
      //   if(
      //     $cookieStore.get("username") != undefined &&
      //     $cookieStore.get("password") != undefined &&
      //     $cookieStore.get("roleid") != undefined &&
      //     $cookieStore.get("authenticated") == "true"
      //   ){
      //     return ('/' + $cookieStore.get("username") + '/jobs');
      //   }
      //   else{
      //     return "/login";
      //   }
      // }
    // );
  // if($cookieStore.get(username))
  //   $location.path('/user/' + user.id);

});

