/**
 * # Momentum v0.1
 *
 * ## A generalised module to handle moving elements with momentum.
 *
 * The following code abstracts out momentum handling, it has been specifically
 * designed and tested with interactions locked to the x-axis, however y-axis
 * should also be functional.
 *
 * Before the Slidebook system was relying on some rough cobbling-together of
 * jQuery animations, which were clunky, not very accurate and slow on low powered
 * devices. This code now replaces that system using pure js and a few easing 
 * calculations.
 *
 * It exposes a simple API to allow the .start() and .move() of an interaction
 * which once completed should trigger a .stop(). This API also exposes a simple
 * events system that allows external code to listen out for 'start', 'complete'
 * and 'tick' events, using jQuery-like .on(), .off() and .trigger().
 *
 * Each instance of Momentum is designed to operate on one element, and slidebook
 * will only instantiate one for it's main image viewer. However, the code could 
 * easily be extended to become a manager for multiple elements.
 */

var Momentum = {

  /**
   * @instance properties
   */
  config: null,
  events: null,
  contact: null,

  /**
   * @static
   *
   * Faster than jQuery.closest.
   */
  ancestorHasAttribute: function( element, attr, value ){
    var n = element, a;
    while ( n && (n=n.parentNode) && n.getAttribute ) {
      if ( (a=n.getAttribute(attr)) ) {
        /// if the value quacks like a RegExp
        if ( value && value.test && value.test(a) ) {
          return true;
        }
        /// if the value quacks like a Function
        else if ( value && value.call && value.call(null, a, attr, element ) ) {
          return true;
        }
        /// otherwise strict comparison
        else if ( a === value ) {
          return true;
        }
      }
    }
    return false;
  },

  /**
   * @static
   *
   * No cross vendor js developer should leave home without this...
   */
  calcVendorPrefix: function(){
    if ( !document.body ) {
      console && console.enabled && console.log('prefix() requires the DOM to be ready.');
      return null;
    }
    if ( !this.calcVendorPrefix.value ) {
      if ( document.body ) {
        for ( var a = ['Webkit','Moz','O','ms'], i=0, l = a.length; i<l; i++ ) {
          if ( document.body.style[a[i]+'AnimationName'] !== undefined ) {
            return { js: a[i], css: '-' + a[i].toLowerCase() + '-' };
          }
        }
      }
      return (this.calcVendorPrefix.value = { css:'', js:'' });
    }
    else {
      return this.calcVendorPrefix.value;
    }
  },

  /**
   * @static
   *
   * Calculate the difference between two contact points, (taking into account offset).
   */
  calcContactDifference: function( a, b, o ){
    var ax, ay, obj = {
      x: Math.round(b.x - a.x) + o.x,
      y: Math.round(b.y - a.y) + o.y
    };
    return obj;
  },

  /**
   * @static
   *
   * Take a current value, and a "speed", increate the value by speed
   * as you decrease the speed by the dec multiplier. When reaching
   * zero speed return the value. Allows for predicting where a
   * particular easing out velocity will land.
   */
  calcContinuedMomentum: function( v, vspeed, dec ){
    dec = Math.max(Math.min(dec||0.9, 0.95),0);
    while ( Math.abs(vspeed) > 1 ) { vspeed *= dec; v += vspeed; };
    return v;
  },

  /**
   * @static
   * 
   * A simple cubic easing function, slows in and out.
   *
   * t = time
   * b = start value
   * c = total change
   * d = duration
   */
  easeInOutCubic: function (t, b, c, d) {
    t /= d/2;
    if (t < 1) return c/2*t*t*t + b;
    t -= 2;
    return c/2*(t*t*t + 2) + b;
  },

  /**
   * @static
   */
  create: function( config ){
    return Object.create(this).prep(config);
  },

  /**
   * @instance
   * Prep this instance with it's unique properties.
   */
  prep: function( config ){
    this.config = config;
    this.events = {};
    this.config.yAxis === undefined
      && (this.config.yAxis = true)
    ;
    this.config.xAxis === undefined
      && (this.config.xAxis = true)
    ;
    !this.config.momentumThreshold 
      && (this.config.momentumThreshold = 5)
    ;
    !this.config.momentumMultiplier 
      && (this.config.momentumMultiplier = 2)
    ;
    !this.config.snapInterval 
      && (this.config.snapInterval = 10)
    ;
    !this.config.snapEaseIncrement 
      && (this.config.snapEaseIncrement = 0.02)
    ;
    this.config.snapEaseIncrement 
      = Math.max(this.config.snapEaseIncrement, 0.01)
    ;
    return this;
  },

  /**
   * @instance
   * Attach specific event listeners
   */
  on: function(name, listener){
    !this.events[name] && (this.events[name]=[]);
    this.events[name].push(listener);
    return this;
  },

  /**
   * @instance
   * Detach specific event listeners
   */
  off: function(name, listener){
    if ( this.events[name] ) {
      for ( var i=0, a=this.events[name], l=a.length; i<l; i++ ) {
        if ( a[i] === listener ) {
          a.splice(i, 1);
        }
      }
    }
    return this;
  },
  
  /**
   * @instance
   * Simple event triggering function.
   */
  trigger: function(name, data, context){
    if ( this.events[name] ) {
      for ( var i=0, a=this.events[name], l=a.length; i<l; i++ ) {
        if ( a[i] && a[i].call ) {
          a[i].call( context || this, data );
        }
      }
    }
  },

  /**
   * @instance
   * Key function that handles the reaction to particular interactions.
   */
  react: function( progress, dif, ignoreTransform ){
    var v,i,t,a,l;
    var self = this;
    var contact = this.contact;
    var config = this.config;
    console && console.enabled && console.log('interaction progress', progress);
    if ( !contact ) return;
    /// here we handle the start of the reaction
    if ( progress < 0.9 ) {
      if ( progress == 0 ) {
        /// in order to keep things remembering where we were
        contact.origin = this.translate();
        isNaN(contact.origin.x) && (contact.origin.x=0);
        isNaN(contact.origin.y) && (contact.origin.y=0);
        this.tickers && (
          this.tickers.x && this.tickers.x.stop() && (this.tickers.x=null),
          this.tickers.y && this.tickers.y.stop() && (this.tickers.y=null)
        );
        this.trigger('start', this);
      }
      /// calculate the differences from now and last time
      contact.timeNow && (contact.timeLast = contact.timeNow);
      contact.dif && (contact.lastdif = contact.dif);
      contact.timeNow = (new Date().getTime());
      contact.timeSince = contact.timeLast
        ? Math.max(contact.timeNow - contact.timeLast, 1)
        : 1
      ;
      /// calculate the difference between the start touch and current touch
      contact.dif = dif || this.calcContactDifference( contact.start, contact.drag, contact.origin );
      /// make sure that no movement occurs on any disabled axis
      !config.xAxis && (contact.dif.x=0);
      !config.yAxis && (contact.dif.y=0);
      /// if there was a last time, we can calculate the momentum
      if ( contact.lastdif ) {
        contact.momentum.history.push({
          x: config.xAxis ? (contact.lastdif.x - contact.dif.x) / contact.timeSince : 0,
          y: config.yAxis ? (contact.lastdif.y - contact.dif.y) / contact.timeSince : 0
        });
        (contact.momentum.history.length > 5)
          && contact.momentum.history.shift()
        ;
      }
      contact.x = contact.dif.x;
      contact.y = contact.dif.y;
      /// transform on the x, use translate3D to gain hardward accl if possible.
      this.translate( contact.x, contact.y );
      /// tell the outside world that something happened
      this.trigger('tick', this);
    }
    /// this point is the handover between interaction and computed intertia.
    else if ( progress == 0.9 ) {
      this.tickers && (
        this.tickers.x && this.tickers.x.stop() && (this.tickers.x=null),
        this.tickers.y && this.tickers.y.stop() && (this.tickers.y=null)
      );
      contact.dif = null;
      /// recalc ineria from the momentum history
      contact.momentum.x = 0;
      contact.momentum.y = 0;
      contact.momentum.cx = 0;
      contact.momentum.cy = 0;
      contact.momentum.dx = 0;
      contact.momentum.dy = 0;
      for ( i=0, a=contact.momentum.history, l=a.length; i<l; i++ ) {
        config.xAxis && (contact.momentum.x += a[i].x);
        config.yAxis && (contact.momentum.y += a[i].y);
      }
      /// divide the sum of the last n momentum calculations by n to get an average.
      config.xAxis && contact.momentum.x && (contact.momentum.x /= l);
      config.yAxis && contact.momentum.y && (contact.momentum.y /= l);
      contact.momentum.history.length = 0;
      /// if we have some momentum to calculate on the x axis
      if ( contact.momentum.x > this.config.momentumThreshold || contact.momentum.x < -this.config.momentumThreshold ) {
         /// multiply for feel
        contact.momentum.x *= this.config.momentumMultiplier;
        /// calculate where, after momentum, our coordinate will land
        contact.momentum.cx = this.calcContinuedMomentum( contact.x, -contact.momentum.x, 0.9 );
        /// calculate the difference in our position from now and until after momentum.
        contact.momentum.dx = contact.x - contact.momentum.cx;
      }
      /// if we have some momentum to calculate on the y axis
      if ( contact.momentum.y > this.config.momentumThreshold || contact.momentum.y < -this.config.momentumThreshold ) {
        /// multiply for feel
       contact.momentum.y *= this.config.momentumMultiplier;
       /// calculate where, after momentum, our coordinate will land
       contact.momentum.cy = this.calcContinuedMomentum( contact.y, contact.momentum.y, 0.9 );
       /// calculate the difference in our position from now and until after momentum.
       contact.momentum.dy = contact.y - contact.momentum.cy;
      }
      /// if we have any momentum calculated allow this to affect the snap location
      contact.snap = config.snapTo
        ? config.snapTo.call(this, {
            'x': contact.momentum.dx ? contact.momentum.cx : contact.x, 
            'y': contact.momentum.dy ? contact.momentum.cy : contact.y
          }, contact) || {}
        : null
      ;
      this.isNone(contact.snap.x) && (contact.snap.x = contact.momentum.dx ? contact.momentum.cx : contact.x);
      this.isNone(contact.snap.y) && (contact.snap.y = contact.momentum.dy ? contact.momentum.cy : contact.y);
      /// recaculate our momentum, if we have any, to hit our snap location.
      contact.momentum.dx && (contact.momentum.x -= (contact.snap.x - contact.momentum.cx) * (contact.momentum.x / contact.momentum.dx));
      contact.momentum.dy && (contact.momentum.y -= (contact.snap.y - contact.momentum.cy) * (contact.momentum.y / contact.momentum.dy));
      /// create two sub programs, one for x and one for y
      this.tickers = {
        x: config.xAxis
          ? contact.momentum.dx
            ? this.ticker('x', this).tick('slow', [this, contact])
            : this.ticker('x', this).tick('ease', [this, contact, contact.x, (contact.snap.x - contact.x), contact.target ])
          : null,
        y: config.yAxis
          ? contact.momentum.dy
            ? this.ticker('y', this).tick('slow', [this, contact])
            : this.ticker('y', this).tick('ease', [this, contact, contact.y, (contact.snap.y - contact.y), contact.target ])
          : null
      };
      /// for each tick of the x sub program, update our UI
      this.tickers.x && this.tickers.x
        .on('tick', function(name){
          this.descriptor.context.translate( contact.x, contact.y );
          self.trigger('tick', self);
        })
        .on('done', function(){
          delete self.tickers.x;
          if ( !self.tickers.x && !self.tickers.y ) {
            this.descriptor.context.react(1);
          }
        })
      ;
      /// for each tick of the y sub program, update our UI
      this.tickers.y && this.tickers.y
        .on('tick', function(){ this.descriptor.context.translate( contact.x, contact.y ); })
        .on('done', function(){
          delete self.tickers.y;
          if ( !self.tickers.x && !self.tickers.y ) {
            this.descriptor.context.react(1);
          }
        })
      ;
      /// tell the outside world that something happened
      this.trigger('tick', this);
    }
    /// once we are full complete, treat this as react(1)
    else {
      this.tickers && (
        this.tickers.x && this.tickers.x.stop() && (this.tickers.x=null),
        this.tickers.y && this.tickers.y.stop() && (this.tickers.y=null)
      );
      /// tell the outside world that something happened
      this.trigger('tick', this);
      /// tell the outside world we are complete
      this.trigger('complete', this);
      /// wipe them out, all of them.
      this.contact = null;
    }
  },
  
  /**
   * @static @instance
   * check whether a variable is undefined or null
   */
  isNone: function( v ){
    return v === undefined || v === null;
  },
  
  /**
   * @static @instance
   * create a ticker subprogram that will handle either easing or slowing down 
   * the UI after the user has finished an interaction.
   *
   * [X] TODO: currently makes use of setInterval, should be switched for requestAnimationFrame
   * [ ] TODO: could be optimised to re-use functions, rather than re-create.
   */
  ticker: function( coordinate ){
    var context = this, co = coordinate;
    return context.subprogram({
      context: context,
      time: 0.01,
      // slow will be called on each tick to decrease x momentum.
      slow: function( context, contact ){
        contact.momentum[co] *= 0.9;
        contact[co] -= contact.momentum[co];
        if ( contact.momentum[co] > -1 && contact.momentum[co] < 1 ) {
          if ( Math.abs(contact[co] - contact.snap[co]) > 1 ) {
            this.descriptor.time = 0.01;
            this.tick('ease', [context, contact, contact[co], (contact.snap[co] - contact[co]), contact.target]);
          }
          else {
            this.tick('done', [context]);
          }
        }
        return true;
      },
      /// ease will be called when there isnt any x momentum, but there is still distance to travel.
      ease: function( context, contact, v, c, target ){
        if ( this.descriptor.time < 1 ) {
          contact[co] = context.easeInOutCubic( this.descriptor.time, v, c, 1);
          this.descriptor.time += context.config.snapEaseIncrement;
        }
        else {
          this.tick('done', [context]);
        }
        return true;
      },
      done: function( context ){
        return false;
      }
    });
  },
  
  /**
   * @static @instace
   * A simple looping subprogram handler, allows the creation of
   * logic bundles that tick their way through a problem to solve.
   * Mainly of use for UI animations.
   *
   * [ ] TODO: Investigate why cancelAnimationFrame seems to fail in FF.
   */
  subprogram: (function(){
    var subprogram = {
      requestAnimationFrame: 
        window.requestAnimationFrame || 
        window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame || 
        window.msRequestAnimationFrame
      ,
      cancelAnimationFrame: 
        window.cancelAnimationFrame || 
        window.mozCancelAnimationFrame ||
        window.webkitCancelAnimationFrame || 
        window.msCancelAnimationFrame
      ,
      create: function( descriptor, config ){
        return Object.create(this).prep(descriptor, config);
      },
      prep: function( descriptor, config ){
        this.descriptor = descriptor;
        this.config = config || {};
        this.events = {};
        !this.config && (this.config.interval=10);
        return this;
      },
      on: function( name, listener ){
        !this.events[name] && (this.events[name]=[]);
        this.events[name].push(listener);
        return this;
      },
      off: function( name, listener ){
        if ( this.events[name] ) {
          for ( var i=0, a=this.events[name], l=a.length; i<l; i++ ) {
            if ( a[i] === listener ) {
              a.splice(i, 1);
            }
          }
        }
        return this;
      },
      trigger: function(name, data, context){
        if ( this.events[name] ) {
          for ( var i=0, a=this.events[name], l=a.length; i<l; i++ ) {
            if ( a[i] && a[i].call ) {
              a[i].call( context || this, data );
            }
          }
        }
        return this;
      },
      tick: function( name, args ){
        var m, s = this.stop(), f, r;
        if ( (m=this.descriptor[name]) && m.call ) {
          this.trigger(name); /// broadcast that this tick method has started
          if ( this.requestAnimationFrame ) {
            (this.raf = f = function(){
              (s.raf === f) /// make sure this hasn't been cancelled
                && s.trigger('tick', name)  /// trigger a tick event
                && m.apply(s, args) /// execute our requested method
                && (s.raf === f) /// make sure this hasn't been cancelled
                && (f.rid=s.requestAnimationFrame.call(window, f)) /// loop
            })();
          }
          else {
            this.iid = setInterval(function(r){
              m.apply(s, args) || s.stop();
              s.trigger('tick', name);
            }, this.config.interval);
          }
        }
        return this;
      },
      stop: function(){
        if ( this.iid ) {
          clearInterval(this.iid);
          this.trigger('stop');
        }
        else if ( this.raf ) {
          this.raf.rid && this.cancelAnimationFrame.call( window, this.raf.rid );
          this.raf.rid = null;
          this.raf = null;
          this.trigger('stop');
        }
        return this;
      }
    };
    return function( descriptor ){
      return subprogram.create(descriptor, {
        interval: this.config.snapInterval
      });
    };
  })(),
  
  /**
   * @instance @getter @setter
   */
  started: function(){
    if ( arguments.length ) {
      this.config.started = !!arguments[0];
    }
    else {
      return this.config.started;
    }
  },

  /**
   * @instance @chainable
   * A shortcut function that attempts to prevent every default it can
   */    
  preventDefault: function(e){
    if ( !e ) return this;
    e.preventDefault ? e.preventDefault() : (e.returnValue = false);
    e.gesture && e.gesture.preventDefault && e.gesture.preventDefault();
    return this;
  },
  
  /**
   * @instance @chainable
   * Initialise the momentum object, should be called before start.
   */
  init: function(){
    this.config.started = false;
    return this;
  },

  /**
   * @instance @chainable
   * Creates a new contact
   */
  start: function(x,y){
    this.contact = {
      alreadyStarted: !!this.contact,
      drag: {x:x, y:y},
      start: {x:x, y:y},
      target: this.config.target,
      moved: false,
      snap: this.contact 
              && this.contact.snap 
                && clearInterval(this.contact.snap.interval)
      ,
      momentum: {
        history: [],
        x: 0,
        y: 0
      }
    };
    this.config.started = true;
    if ( this.contact.alreadyStarted ) {
      this.react(0);
    }
    return this;
  },

  /**
   * @instance @chainable
   * Can be used to preliminarily define a move co-ordinate
   * but without actually triggering a move interaction.
   */
  prelim: function(x,y){
    if ( this.config.started && this.contact ) {
      if ( !this.contact.moved ) {
        this.contact.moved = true;
        this.react(0);
      }
      this.contact.drag.x = x;
      this.contact.drag.y = y;
    }
    return this;
  },

  /**
   * @instance @chainable
   * Triggers a touch/move reaction
   */
  move: function(x,y){
    if ( this.config.started && this.contact ) {
      if ( !this.contact.moved ) {
        this.contact.moved = true;
        this.react(0);
      }
      if ( arguments.length ) {
        this.contact.drag.x = x;
        this.contact.drag.y = y;
      }
      this.react(0.5);
    }
    return this;
  },
  
  /**
   * @instance
   * Shift the target using Translate3D, should auto handle vendor prefix.
   */
  translate: function(){
    prop = this.calcVendorPrefix().js ? this.calcVendorPrefix().js + 'Transform' : 'transform';
    translate = /^translate3D\(\s*([0-9\.-]+)(px)?,\s*([0-9\.-]+)(px)?,\s*([0-9\.-]+)(px)?\s*\)$/i
    this.translate = function( x, y ){
      var element = this.config.target;
      if ( !element || !element.nodeName ) {
        console.warn('Illegal element passed to translate', element);
        return {
          x: 0,
          y: 0
        };
      }
      if ( arguments.length ) {
        x = x||0;
        y = y||0;
        !isNaN(x) && !isNaN(y) && (element.style[prop] = 'translate3D(' + x + 'px, ' + y + 'px, 0)');
      }
      else if ( (x = element.style[prop]) ) {
        if ( (x = translate.exec(x)) ) {
          return {
            x: parseFloat(x[1]),
            y: parseFloat(x[3])
          };
        }
        else {
          console.warn('Failed to match translate3D pattern', element.style[prop]);
          return {
            x: 0,
            y: 0
          };
        }
      }
      else {
        return {
          x: 0,
          y: 0
        };
      }
    };
    return this.translate.apply(this, arguments);
  },
  
  /**
   * @instance @chainable
   * Triggers a finalisation of the touch interaction
   */
  stop: function(){
    /// we can only stop a drag operation that exists and has been moved.
    if ( this.config.started && this.contact ) {
      this.react(0.9);
    }
    else {
      this.contact = null;
    }
    this.config.started = false;
    return this;
  },

  /**
   * @instance @chainable
   * Stop and drop everything!
   * TODO: this obviously doesn't do anything yet...
   */
  cancel: function(){
    return this;
  },
  
  /**
   * @instance
   * Tell if the recent move or prelim was more horizontal than vertical
   */
  moveWasHorizontal: function(){
    return this.contact && this.contact.moved && ( 
      Math.abs(this.contact.drag.x - this.contact.start.x) 
        > Math.abs(this.contact.drag.y - this.contact.start.y)
    );
  },
  
  /**
   * @instance
   * Tell if the recent move or prelim was more horizontal than vertical
   */
  moveWasVertical: function(){
    return this.contact && this.contact.moved && ( 
      Math.abs(this.contact.drag.x - this.contact.start.x) 
        < Math.abs(this.contact.drag.y - this.contact.start.y)
    );
  }

};

/// Simple polyfill for Object.create
if ( !Object.create && jQuery ) {
  Object.create = function( obj ){
    return $.extend({}, obj);
  }
}