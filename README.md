# EchoJS
Lightweight No-Fluff JS Framework providing MVC/templating and Databinding SPAs with NO build tooling required.


## Setup

Your index.html needs an `echo-frame` element where the application will be mounted:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <title>EchoJS App</title>
</head>
<body>
    <echo-frame></echo-frame>
    <script src="./js/echo.js"></script>
    <script src="./js/app.js"></script>
</body>
</html>
```


## Core Features

### Template Variables
Variables from your controllers can be displayed in templates using double curly braces:
```html
<h1>{{title}}</h1>
<p>Welcome back, {{user.name}}</p>
```

### Hash-Based Routing
EchoJS uses hash-based routing for simplicity and compatibility:
```javascript
// In your configuration
.path('/', {
  templateUrl: './routes/views/dash.html',
  controller: 'DashController'
})

// In your HTML
<a href="#/login">Login</a>
<a href="#/dashboard">Dashboard</a>
```

This allows for clean URLs and browser navigation support without server configuration.


## Coming Soon
- `echo-repeat`: Loop through arrays and objects in templates
- `echo-if`: Conditional rendering in templates
- Route Parameters: Support for dynamic routes like `/user/:userId` with access via `{{rtparams.userId}}`
- Data Factories: Simple data management and API integration
- Worker Support: Background processing capabilities
- SQL Parser: Built-in query building and data manipulation


## Two Ways to Write EchoJS Apps

EchoJS supports two coding styles to match your project's needs:

### 1. Chain Syntax
Perfect for prototypes and small applications. Everything chains together in a clean, readable format.

```javascript
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
```

### 2. Enterprise Syntax
Better for larger applications. Organizes code into logical sections with clear boundaries.

```javascript
const echojs = window.EchoJS;
// Application Configuration
echojs.configure({
  debug: true
});
// Layout Configuration
echojs.layouts()
  .register('main', './routes/layouts/main.html').asDefault()
  .register('auth', './routes/layouts/auth.html')
.end();
// Route Configuration
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
```
Both approaches deliver the samp app, a basic MVC with a Dashboard and a login page, each using layouts, views and unique controllers.

This Hybrid approach makes it simple to build simple tiny apps very quickly or very complex apps without overly complex code.

Choose the style that's right for you.


## Project Structure
While EchoJS is flexible in terms of file structure, it is recommended to follow a standard structure for clarity and maintainability.

Preferred structure is:

```
your-project/
│
├── index.html
├── css/
│   └── style.css
│
├── js/
│   ├── echo.js
│   ├── app.js
│   └── app.short.js
│
└── routes/
    ├── layouts/
    │   ├── main.html
    │   └── auth.html
    │
    ├── views/
    │   ├── dash.html
    │   └── login.html
    │
    └── 404.html
```


## Best Practices

1. **Choose the Right Style**:
   - Use Quick Start for small apps and prototypes
   - Use Enterprise Style for larger applications

2. **Logical Ordering**:
   - Configure first
   - Define layouts
   - Set up routes
   - Register controllers
   - Start the application

3. **File Organization**:
   - Keep layouts in `routes/layouts`
   - Keep views in `routes/views`
   - Maintain clear separation between layouts and views


## Features
- No build tools required
- Multiple layout support
- Simple routing
- Controller system
- Flexible coding styles
- Chainable App Structure
- Logical structuring


## License
GPL-3.0