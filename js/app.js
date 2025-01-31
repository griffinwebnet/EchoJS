// Get the global instance
const echojs = window.EchoJS;

// Application Configuration
echojs.configure({
  debug: true
});

// Layout Configuration
// Defines the structural templates that views will be rendered within
echojs.layouts()
  .register('main', './routes/layouts/main.html').asDefault()
  .register('auth', './routes/layouts/auth.html')
.end();

// Route Configuration
// Maps URLs to views and controllers
echojs.routes()
  .path('/', {
    templateUrl: './routes/views/dash.html',
    controller: 'DashController'
  })
  .path('/login', {
    templateUrl: './routes/views/login.html',
    controller: 'LoginController',
    layout: 'auth'
  })
  .fallback({
    templateUrl: './routes/404.html'
  })
.end();

// Controller Definitions
// Controllers manage the data and behavior of views
echojs.controllers()
  .register('DashController', function () {
    this.title = 'Welcome to EchoJS';
  })
  .register('LoginController', function () {
    this.title = 'Sign in to your account';
  })
.end();

// Initialize the application
echojs.start();