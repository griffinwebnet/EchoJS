// Core Framework
class EchoJS {
  constructor() {
    this._routes = new Map();
    this._templates = new Map();
    this._layoutTemplates = new Map();
    this._controllers = new Map();
    this.currentController = null;
    this.defaultLayout = null;
    this.notFoundConfig = null;
    
    this.config = {
      debug: false,
      cacheTemplates: true,
      templateExtensions: ['.html']
    };

    this._currentContext = this;
    this.handleRouteChange = this.handleRouteChange.bind(this);
  }

  // Configuration
  configure(options) {
    this.config = { ...this.config, ...options };
    return this;
  }

  // Route Provider and Router
  path(url, config) {
    this._routes.set(url, config);
    return this;
  }

  fallback(config) {
    this.notFoundConfig = config;
    return this;
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

  // Layout Provider
  layout(name, templateUrl) {
    this._layoutTemplates.set(name, { templateUrl });
    return this;
  }

  asDefault() {
    this.defaultLayout = Array.from(this._layoutTemplates.keys()).pop();
    return this;
  }

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

  // Controller Provider
  controller(name, fn) {
    this._controllers.set(name, fn);
    return this;
  }

  controllers() {
    const controllerContext = {
      register: (name, fn) => {
        this._controllers.set(name, fn);
        return controllerContext;
      },
      end: () => this
    };
    return controllerContext;
  }

  // Template Engine
  _isValidTemplateUrl(url) {
    try {
      // Get the script's path to determine base directory
      const scriptPath = document.currentScript?.src || 
        Array.from(document.getElementsByTagName('script'))
          .find(script => script.src.includes('echo.js'))?.src || 
        window.location.href;
      
      const scriptUrl = new URL(scriptPath);
      const baseDir = scriptUrl.pathname.substring(0, scriptUrl.pathname.lastIndexOf('/'));
      const templateUrl = new URL(url, scriptUrl.origin + baseDir);
      
      if (templateUrl.origin !== window.location.origin) {
        console.error('Template URL must be from same origin:', url);
        return false;
      }

      // Check if path starts with routes/ relative to script location
      const normalizedTemplatePath = templateUrl.pathname;
      const expectedBasePath = baseDir + '/routes/';
      const isAllowedPath = normalizedTemplatePath.includes('/routes/');
      
      if (this.config.debug) {
        console.log('Path validation:', {
          templatePath: normalizedTemplatePath,
          basePath: baseDir,
          expectedPath: expectedBasePath,
          isAllowed: isAllowedPath
        });
      }
      
      if (!isAllowedPath) {
        console.error('Template URL must be under /routes/ directory:', url);
        return false;
      }

      const hasValidExtension = templateUrl.pathname.toLowerCase().endsWith('.html');
      
      if (!hasValidExtension) {
        console.error('Template URL must have .html extension:', url);
        return false;
      }

      return true;
    } catch (e) {
      console.error('Invalid template URL:', url);
      console.error(e);
      return false;
    }
  }

  async loadTemplate(templateUrl) {
    if (!this._isValidTemplateUrl(templateUrl)) {
      throw new Error(`Invalid template URL: ${templateUrl}`);
    }

    if (this.config.cacheTemplates && this._templates.has(templateUrl)) {
      return this._templates.get(templateUrl);
    }
    
    try {
      const response = await fetch(templateUrl, {
        credentials: 'same-origin',
        headers: {
          'Accept': 'text/html'
        }
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const contentType = response.headers.get('Content-Type');
      if (!contentType || !contentType.includes('text/html')) {
        throw new Error('Invalid content type');
      }
      
      let html = await response.text();

      html = html.replace(/<iframe(.+?)>/gi, (match) => {
        if (!/sandbox=/i.test(match)) {
          match = match.replace('<iframe', '<iframe sandbox="allow-same-origin"');
        }
        
        match = match.replace(/sandbox=["']([^"']*)["']/i, (_, values) => {
          const safeValues = values.split(' ').filter(value => 
            ['allow-same-origin', 'allow-scripts'].includes(value.trim().toLowerCase())
          );
          return `sandbox="${safeValues.join(' ')}"`;
        });

        if (!/src=["'][^"']*:?\/\/[^"']*["']/i.test(match)) {
          return match;
        }
        
        const srcMatch = match.match(/src=["']([^"']*)["']/i);
        if (srcMatch) {
          try {
            const iframeSrc = new URL(srcMatch[1], window.location.href);
            if (iframeSrc.origin !== window.location.origin) {
              console.warn('Blocked cross-origin iframe:', iframeSrc.href);
              return '';
            }
          } catch (e) {
            return '';
          }
        }

        return match;
      });
      
      if (this.config.cacheTemplates) {
        this._templates.set(templateUrl, html);
      }
      
      return html;
    } catch (error) {
      console.error('Template loading error:', error);
      throw error;
    }
  }

  // View Engine and Interpolation
  async _loadAndRenderTemplate(config, params = {}) {
    const frameElement = document.querySelector('echo-frame');
    if (!frameElement) {
      console.error('No echo-frame element found');
      return;
    }

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
        const contentElement = document.querySelector('echo-content');
        if (contentElement) {
          contentElement.innerHTML = content;
        }
      } else {
        frameElement.innerHTML = content;
      }

      if (config.controller) {
        const ControllerClass = this._controllers.get(config.controller);
        if (typeof ControllerClass === 'function') {
          this.currentController = new ControllerClass(params);
          setTimeout(() => this._processInterpolation(), 0);
        }
      }
    } catch (error) {
      console.error('Rendering error:', error);
    }
  }

  _processInterpolation() {
    if (!this.currentController) return;
    
    const frameElement = document.querySelector('echo-frame');
    if (!frameElement) return;

    const walker = document.createTreeWalker(
      frameElement,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          return node.textContent.includes('{{') 
            ? NodeFilter.FILTER_ACCEPT 
            : NodeFilter.FILTER_SKIP;
        }
      }
    );

    let node;
    while (node = walker.nextNode()) {
      const content = node.textContent;
      node.textContent = content.replace(
        /\{\{\s*([^}]+)\s*\}\}/g,
        (match, expression) => {
          try {
            const value = expression.split('.').reduce(
              (obj, prop) => obj?.[prop],
              this.currentController
            );
            return value !== undefined ? String(value) : '';
          } catch (error) {
            console.error('Interpolation error:', error);
            return '';
          }
        }
      );
    }
  }

  start() {
    window.addEventListener('hashchange', this.handleRouteChange);
    this.handleRouteChange();
    return this;
  }
}

window.EchoJS = new EchoJS();
