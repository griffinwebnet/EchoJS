const echojs = window.EchoJS;
echojs.configure({
    debug: true
  })
  .layout('main', './routes/layouts/main.html').asDefault()
  .layout('auth', './routes/layouts/auth.html')
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
  .controller('DashController', function () {
    this.title = 'Welcome to EchoJS';
  })
  .controller('LoginController', function () {
    this.title = 'Sign in to your account';
  })
  .start(); 