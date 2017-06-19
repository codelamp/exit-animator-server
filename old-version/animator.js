window.onload = function(){
  
  var width = document.body.offsetWidth;
  var height = document.body.offsetHeight - 20;
  
  var id = function(o){
    !id.lookup && (id.lookup = {}) && (id.seed = 0);
    if ( o.split ) {
      return id.lookup[o].id;
    }
    else if ( o.name ) {
      id.lookup[o.name] = o;
      o.id = id.seed++;
    }
    else if ( o.source ) {
      o.id = id.seed++;
    }
    return o;
  };
  
  var json = { 
    "nodes": [
      id({"name": "root", x: width/2, y: height/2}),
      id({"name": "head"}),
      id({"name": "neck"}),
      id({"name": "shoulder-r"}),
      id({"name": "shoulder-l"}),
      id({"name": "elbow-r"}),
      id({"name": "elbow-l"}),
      id({"name": "hand-r"}),
      id({"name": "hand-l"}),
      id({"name": "spine"}),
      id({"name": "hip-r"}),
      id({"name": "hip-l"}),
      id({"name": "knee-r"}),
      id({"name": "knee-l"}),
      id({"name": "foot-r"}),
      id({"name": "foot-l"})
    ],
    "links": [
      id({"source": id("neck"),       "target": id("head"),       "length": 50, "class": "neck"}),
      id({"source": id("neck"),       "target": id("shoulder-r"), "length": 20, "class": "right"}),
      id({"source": id("neck"),       "target": id("shoulder-l"), "length": 20, "class": "left"}),
      id({"source": id("shoulder-r"), "target": id("elbow-r"),    "length": 60, "class": "right"}),
      id({"source": id("shoulder-l"), "target": id("elbow-l"),    "length": 60, "class": "left"}),
      id({"source": id("elbow-r"),    "target": id("hand-r"),     "length": 70, "class": "right"}),
      id({"source": id("elbow-l"),    "target": id("hand-l"),     "length": 70, "class": "left"}),
      id({"source": id("neck"),       "target": id("spine"),      "length": 70, "class": "spine"}),
      //id({"source": id("spine"),      "target": id("shoulder-r"), "length": 70, "class": "right"}),
      //id({"source": id("spine"),      "target": id("shoulder-l"), "length": 70, "class": "left"}),
      id({"source": id("spine"),      "target": id("hip-r"),      "length": 40, "class": "right"}),
      id({"source": id("spine"),      "target": id("hip-l"),      "length": 40, "class": "left"}),
      id({"source": id("hip-r"),      "target": id("knee-r"),     "length": 80, "class": "right"}),
      id({"source": id("hip-l"),      "target": id("knee-l"),     "length": 80, "class": "left"}),
      id({"source": id("hip-r"),      "target": id("hip-l"),      "length": 20, "class": "hip"}),
      id({"source": id("knee-r"),     "target": id("foot-r"),     "length": 90, "class": "right"}),
      id({"source": id("knee-l"),     "target": id("foot-l"),     "length": 90, "class": "left"})
    ]
  };
  
  try {
    if ( localStorage.example ) {
      var temp = JSON.parse(localStorage.example);
      json.nodes = temp.nodes;
      for ( var i=0, a=json.nodes, l=a.length; i<l; i++ ) {
        a[i].x += temp.root.x;
        a[i].y += temp.root.y;
      }
    }
  } catch (ee) {
    console.warn('unable to load local storage.');
  }
  
  /**
   * Prep the SVG Object
   */
  var svg = d3.select("#viewport").append("svg")
    .attr("width", width)
    .attr("height", height)
    .on( "mousedown", function() {
      if ( d3.event && d3.event.currentTarget === d3.event.target ) {
        var p = d3.mouse(this);
        !d3.event.ctrlKey && d3.selectAll( 'g.selected').classed( "selected", false);
        svg.append( "rect")
          .attr({
            "rx"      : 6,
            "ry"      : 6,
            "class"   : "selection",
            "x"       : p[0],
            "y"       : p[1],
            "width"   : 0,
            "height"  : 0,
            "comp-op" : "xor"
          })
        ;
      }
    })
    .on( "mousemove", function() {
      var s = svg.select( "rect.selection");
      if( !s.empty()) {
        var 
          p = d3.mouse( this),
          rect = {
            x:      parseInt( s.attr( "x"), 10),
            y:      parseInt( s.attr( "y"), 10),
            width:  parseInt( s.attr( "width"), 10),
            height: parseInt( s.attr( "height"), 10)
          },
          move = {
            x : p[0] - rect.x,
            y : p[1] - rect.y
          }
        ;
        if( move.x < 1 || (move.x*2<rect.width)) {
          rect.x = p[0];
          rect.width -= move.x;
        }
        else {
          rect.width = move.x;
        }
        if( move.y < 1 || (move.y*2<rect.height)) {
          rect.y = p[1];
          rect.height -= move.y;
        }
        else {
          rect.height = move.y;
        }
        s.attr(rect);
        node.each(function(d, i, elm){
          var 
            x1 = (d.x - d.radius), 
            y1 = (d.y - d.radius),
            x2 = (d.x + d.radius), 
            y2 = (d.y + d.radius),
            aa = (x1 >= rect.x && x1 <= (rect.x + rect.width))  || (x2 >= rect.x && x2 <= (rect.x + rect.width)),
            bb = (y1 >= rect.y && y1 <= (rect.y + rect.height)) || (y2 >= rect.y && y2 <= (rect.y + rect.height))
          ;
          d3.select(this).classed('selecting', aa && bb);
        });
      }
    })
    .on("mouseup", function() {
      svg.selectAll( "rect.selection").remove();
      d3.selectAll(".selecting")
        .classed('selected', true)
        .classed('selecting', false)
        .classed('fixed', true)
        .each(function(d, i){
          d.fixed = true;
        })
      ;
    })
    .on("mouseout", function() {
      if( d3.event && d3.event.relatedTarget && d3.event.relatedTarget.tagName=='HTML') {
        svg.selectAll( "rect.selection").remove();
        d3.selectAll(".selecting")
          .classed('selected', true)
          .classed('selecting', false)
          .classed('fixed', true)
          .each(function(d, i){
            d.fixed = true;
          })
        ;
      }
    })
  ;
  
  jQuery('#viewport svg').radialMenu();
  
  var tick = function (e) {
    link//.selectAll("line")
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; })
    ;
    
    if ( callFor.target ) {
      callFor.tick(e);
    }
    
    /*
    var k = 6 * e.alpha;
    nodes.forEach(function(o, i) {
      o.y += k;
      o.x += k;
    });
    */
    
    node.attr("transform", function(d) {return "translate(" + d.x + "," + d.y + ")"; });
  }
  
  var force = d3.layout.force()
      .nodes(json.nodes)
      .links(json.links)
      .size([width, height])
      .linkStrength(10)
      .gravity(0)
      .friction(0)
      .charge(0)
      //.size(1)
      //.chargeDistance(20)
      .linkDistance(function (d) { return d.length; })
      .on("tick", tick)
  ;

  var unlockAll = function(){
    console.log('unlock all requested');
    nodes.forEach(function(d, i){ d.fixed = false; });
    node.classed('fixed', false);
    force.resume();
  };
  
  var pose = function(){
    console.log('pose requested');
    var root = nodes.filter(function(d, i){ return d.name === 'root'; })[0];
    var json = { nodes: [], root: root };
    nodes.forEach(function(d, i){
      json.nodes.push({
        id: d.id,
        name: d.name,
        fixed: d.fixed,
        x: d.x - root.x,
        y: d.y - root.y
      });
    });
    localStorage.example = JSON.stringify(json);
  };
  
  var dblclick = function(d){
    d3.select(this).classed("fixed", d.fixed = false);
  };
  
  var dragstart = function(d){
    callFor( null, null );
    d3.select(this).classed("fixed", d.fixed = true);
    d3.event && d3.event.stopPropagation && d3.event.stopPropagation();
  };
  
  var clicked = function(){
    d3.event && d3.event.stopPropagation && d3.event.stopPropagation();
  };
  
  var nullify = function(){
    d3.event && d3.event.stopPropagation && d3.event.stopPropagation();
  };
  
  var callFor = function( bodyPart, coords ){
    if ( bodyPart ) {
      console.log('called for', bodyPart);
      callFor.bodyPart = bodyPart;
      callFor.coords = coords;
      callFor.target = d3.select('.' + bodyPart);
      force.resume();
    }
    else {
      callFor.bodyPart = null;
      callFor.coords = null;
      callFor.target = null;
    }
  };
  
  callFor.tick = function(e){
    callFor.target.attr("transform", function( d, i ) {
      var dx = Math.abs(d.x - callFor.coords.x), 
          dy = Math.abs(d.y - callFor.coords.y),
          aa = e.alpha * 2,
          hyp = Math.sqrt( Math.pow(dx, 2) + Math.pow(dy, 2) )
      ;
      if ( d.x < callFor.coords.x ) {
        d.x += dx * aa;
      }
      else {
        d.x -= dx * aa;
      }
      if ( d.y < callFor.coords.y ) {
        d.y += dy * aa;
      }
      else {
        d.y -= dy * aa;
      }
      return "translate(" + [ d.x, d.y ] + ")"
    });
  };
  
  var drag = force.drag()
      .on("dragstart", dragstart);
  
  var links = force.links(),
      nodes = force.nodes(),
      link = svg.selectAll(".link"),
      node = svg.selectAll(".node");
  
  var makeExitGuy = function () {
    // Update link data
    link = link.data(links, function (d) { return d.id; });
    // Create new links
    link.enter().insert("line", ".node")
      .each(function(d) {
        d3.select(this)
          .on('mousedown', nullify)
          .classed('link', true)
          .classed(d.class, true)
          .style("stroke-width", '24px')
        ;
      })
    ; 
    // Delete removed links
    link.exit().remove(); 
    // Update node data
    node = node.data(nodes, function (d) {return d.id; });
    node.enter().append("g")
      .each(function(d) {
        var group = d3.select(this);
        if ( d.name === 'root' ) {
          d.radius = 10;
          group
            .on("dblclick", nullify)
            .on("click", nullify)
            .on("mousedown", nullify)
            .classed('node', true)
            .call(force.drag)
            .append("circle")
              .style('fill', 'rgba(0,0,0,0)')
              .attr('r', d.radius)
          ;
          group
            .append("line")
              .style("stroke", '#aaa')
              .style("stroke-width", '3px')
              .attr('x1', -d.radius)
              .attr('y1', 0)
              .attr('x2', d.radius)
              .attr('y2', 0)
          ;
          group
            .append("line")
              .style("stroke", '#aaa')
              .style("stroke-width", '3px')
              .attr('x1', 0)
              .attr('y1', -d.radius)
              .attr('x2', 0)
              .attr('y2', d.radius)
          ;
        }
        else {
          d.radius = (d.name === 'head') ? 32 : 10;
          group
            .classed('node', true)
            .classed(d.name, true)
            .on("dblclick", dblclick)
            .on("click", clicked)
            .on("mousedown", nullify)
            .call(force.drag)
            .append("circle")
              .attr('r', d.radius)
              .classed('point', true)
          ;
          if ( d.fixed ) {
            group.classed('fixed', true);
          }
        }
      })
    ;
    
    // Delete removed nodes
    node.exit().remove();

    force.start();
    
  };
  
  makeExitGuy();
  
  var shiftFixed = function(dx, dy){
    node.attr("transform", function( d, i ) {
      d.x += dx;
      d.y += dy;
      return "translate(" + [ d.x, d.y ] + ")";
    });
    force.resume();
  };

  KeyboardJS.on('left', function(){ shiftFixed(-1, 0); });
  KeyboardJS.on('shift + left', function(){ shiftFixed(-10, 0); });
  KeyboardJS.on('right', function(){ shiftFixed(1, 0); });
  KeyboardJS.on('shift + right', function(){ shiftFixed(10, 0); });
  KeyboardJS.on('down', function(){ shiftFixed(0, 1); });
  KeyboardJS.on('shift + down', function(){ shiftFixed(0, 10); });
  KeyboardJS.on('up', function(){ shiftFixed(0, -1); });
  KeyboardJS.on('shift + up', function(){ shiftFixed(0, -10); });
  
};