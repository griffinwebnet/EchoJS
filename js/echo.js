// Core EchoJS Framework with optimized feature set
class EchoJS {
  constructor() {
    this._routes = new Map();
    this._templates = new Map();
    this._layoutTemplates = new Map();
    this.currentController = null;
    this.defaultLayout = null;
    this.notFoundConfig = null;
    
    // Simplified config - removed templateBasePath
    this.config = {
      debug: false,
      cacheTemplates: true
    };

    // For method chaining
    this._currentContext = this;

    // Performance optimization: Pre-bind methods
    this.handleRouteChange = this.handleRouteChange.bind(this);
  }

  // Configuration methods
  configure(options) {
    this.config = { ...this.config, ...options };
    return this;
  }

  // Layout methods
  layout(name, templateUrl) {
    this._layoutTemplates.set(name, { templateUrl });
    return this;
  }

  asDefault() {
    this.defaultLayout = Array.from(this._layoutTemplates.keys()).pop();
    return this;
  }

  // Route methods
  path(url, config) {
    this._routes.set(url, config);
    return this;
  }

  fallback(config) {
    this.notFoundConfig = config;
    return this;
  }

  // Controller methods
  controller(name, fn) {
    window[name] = fn;
    return this;
  }

  // Context methods for the longer format
  layouts() {
    const layoutContext = {
      register: (name, templateUrl) => {
        this._layoutTemplates.set(name, { templateUrl });
        return layoutContext;
      },
      asDefault: () => {
        this.defaultLayout = Array.from(this._layoutTemplates.keys()).pop();
        return layoutContext;
      },
      end: () => this
    };
    return layoutContext;
  }

  routes() {
    const routeContext = {
      path: (url, config) => {
        this._routes.set(url, config);
        return routeContext;
      },
      fallback: (config) => {
        this.notFoundConfig = config;
        return routeContext;
      },
      end: () => this
    };
    return routeContext;
  }

  controllers() {
    const controllerContext = {
      register: (name, fn) => {
        window[name] = fn;
        return controllerContext;
      },
      end: () => this
    };
    return controllerContext;
  }

  // Template loading
  async loadTemplate(templateUrl) {
    if (this.config.cacheTemplates && this._templates.has(templateUrl)) {
      return this._templates.get(templateUrl);
    }
    
    try {
      const response = await fetch(templateUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const html = await response.text();
      if (this.config.cacheTemplates) {
        this._templates.set(templateUrl, html);
      }
      
      return html;
    } catch (error) {
      console.error('Template loading error:', error);
      throw error;
    }
  }

  // Routing
  handleRouteChange() {
    const hash = location.hash.slice(1) || '/';
    const match = this._findMatchingRoute(hash);
    
    if (!match && this.notFoundConfig) {
      this._loadAndRenderTemplate(this.notFoundConfig);
      return;
    }

    if (!match) return;

    const { route, params } = match;
    const config = this._routes.get(route);
    this._loadAndRenderTemplate(config, params);
  }

  _findMatchingRoute(hash) {
    for (const [route] of this._routes) {
      if (route === hash) {
        return { route, params: {} };
      }
    }
    return null;
  }

  async _loadAndRenderTemplate(config, params = {}) {
    const frameElement = document.querySelector('echo-frame');
    const contentPromise = this.loadTemplate(config.templateUrl);
    
    let layoutPromise;
    if (config.layout || this.defaultLayout) {
      const layoutName = config.layout || this.defaultLayout;
      const layoutConfig = this._layoutTemplates.get(layoutName);
      if (layoutConfig) {
        layoutPromise = this.loadTemplate(layoutConfig.templateUrl);
      }
    }

    try {
      const [content, layout] = await Promise.all([
        contentPromise,
        layoutPromise
      ].filter(Boolean));

      if (layout) {
        frameElement.innerHTML = layout;
        document.querySelector('echo-content').innerHTML = content;
      } else {
        frameElement.innerHTML = content;
      }

      if (config.controller && typeof window[config.controller] === 'function') {
        this.currentController = new window[config.controller](params);
        this._processInterpolation();
      }
    } catch (error) {
      console.error('Rendering error:', error);
    }
  }

  _processInterpolation() {
    if (!this.currentController) return;
    
    document.querySelectorAll('*').forEach(element => {
      if (element.innerHTML.includes('{{')) {
        element.innerHTML = element.innerHTML.replace(
          /\{\{\s*([^}]+)\s*\}\}/g,
          (match, expression) => {
            try {
              const value = expression.split('.').reduce(
                (obj, prop) => obj?.[prop],
                this.currentController
              );
              return value !== undefined ? value : '';
            } catch (error) {
              console.error('Interpolation error:', error);
              return '';
            }
          }
        );
      }
    });
  }

  start() {
    window.addEventListener('hashchange', this.handleRouteChange);
    this.handleRouteChange();
    return this;
  }
}

// Instead of ES module export, expose to window
window.EchoJS = new EchoJS();
