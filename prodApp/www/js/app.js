// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'angular.css.injector', 'matchmedia-ng', 'ngCordova'])

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

    .state('overview', {
      url: '/:username/jobs',
      templateUrl: "templates/overview.html", 
      controller: 'OverviewCtrl'
    })

    .state('jobview', {
      url: '/:username/jobs/:jobId',
      templateUrl: "templates/jobview.html", 
      controller: 'JobviewCtrl'
    });

  $urlRouterProvider.otherwise('/login');
});

