var clickedOnce = false
var timer;
var rad = 720;
var centerX = rad / 2;
var centerY = rad / 2;

var graph = new Object;									
graph.links = new Array;				
graph.nodes = (Array.isArray(window.mainMenu) ? window.mainMenu.map(function(n){ return Object.assign({}, n); }) : [] )									
graph.links.push( { source:  0, target: 8, value: 16 } );	
graph.links.push( { source:  0, target: 9, value: 14 } );	
graph.links.push( { source:  0, target: 10, value: 10 } );	
graph.links.push( { source:  8, target: 1, value: 16 } );	
graph.links.push( { source:  8, target: 2, value: 16 } );	
graph.links.push( { source:  0, target: 3, value: 20 } );	
graph.links.push( { source:  0, target: 4, value: 20 } );	
graph.links.push( { source:  9, target: 5, value: 14 } );	
graph.links.push( { source:  9, target: 6, value: 14 } );	
graph.links.push( { source:  9, target: 7, value: 14 } );	
graph.links.push( { source:  10, target: 21, value: 10 } );	
graph.links.push( { source:  10, target: 22, value: 10 } );	
graph.links.push( { source:  21, target: 22, value: 1 } );	

var anchorMap = {
	0:  { x: centerX,     y: centerY },
	8:  { x: centerX-102, y: centerY-46 },
	1:  { x: centerX-176, y: centerY-90 },
	2:  { x: centerX-162, y: centerY+20 },
	3:  { x: centerX-138, y: centerY+84 },
	4:  { x: centerX+3,   y: centerY-138 },
	9:  { x: centerX+104, y: centerY-2 },
	5:  { x: centerX+156, y: centerY-76 },
	7:  { x: centerX+182, y: centerY-1 },
	6:  { x: centerX+136, y: centerY+74 },
	10: { x: centerX-5,   y: centerY+116 },
	21: { x: centerX-60,  y: centerY+162 },
	22: { x: centerX+38,  y: centerY+162 }
};

function getAnchor(id) {
	return anchorMap[id] || { x: centerX, y: centerY };
}

graph.nodes.forEach(function(node) {
	var anchor = getAnchor(node.id);
	node.x = anchor.x;
	node.y = anchor.y;
});

let pol = $(window).height()-rad-20
let pol2 = $(window).width()-rad-60


$("#graph").css("width", rad+80).css("height", rad+40)
		.css("margin-top", pol/2).css("margin-left", pol2/2)
	var svg = d3.select("#graph").append("svg")
		.attr("width", rad+60).attr("height", rad+20)	
	var simulation = d3.forceSimulation()
	    .force("link", d3.forceLink()
	    	.id(function(d) { return d.id; })
	    	.distance(function(d) {
	    		if (d.value >= 50) return 88;
	    		if (d.value >= 20) return 72;
	    		return 58;
	    	})
	    	.strength(function(d) {
	    		return d.value >= 16 ? 0.88 : 0.8;
	    	})
	    )
	    .force("charge", d3.forceManyBody().distanceMax(260).theta(1).strength(function(d) {
	    	return d.id === 0 ? -180 : -170;
	    }))
	    .force("collide", d3.forceCollide().radius(function(d) {
	    	if (d.id === 0) return 120;
	    	return (d.radius || 0) + 7;
	    }).iterations(2))
	    .force("x", d3.forceX(function(d) { return getAnchor(d.id).x; }).strength(function(d) { return d.id === 0 ? 0.32 : 0.24; }))
	    .force("y", d3.forceY(function(d) { return getAnchor(d.id).y; }).strength(function(d) { return d.id === 0 ? 0.32 : 0.24; }))
	    .force("center", d3.forceCenter(rad / 2, rad / 2))										    																					

	graph.nodes.forEach(function(node) {
		if (node.id === 0) {
			node.fx = centerX;
			node.fy = centerY;
		}
	});

	  var link = svg.append("g")
	      .attr("class", "links")
	    .selectAll("line")
	    .data(graph.links)
	    .enter().append("line")
	      .attr("stroke-width", function(d) { return Math.sqrt(d.value); });
	
	  var node = svg.append("g")
	      .attr("class", "nodes")
	    .selectAll("circle")
	    .data(graph.nodes)
	    .enter().append("circle")
	      .attr("r", function(d) { return d.radius; })
	      .attr("fill", d=>'#'+colorMap[d.group] )
	      .attr("id", d=>'el'+d.id )
	      .on("click", function(d) { 
	      	if(!d.url) return;
	      	if(d.id > 20) window.open(d.url); 
	      	else if(d.id) location.href=d.url; 
	      })
	      .call(d3.drag()
	          .on("start", dragstarted)
	          .on("drag", dragged)
	          .on("end", dragended))										
	
	var text = svg.append("g")
	      .attr("class", "texts")										      
	    .selectAll("text")
	    .data(graph.nodes)										    
	    .enter().append("text")
			.attr("x", 0)
			.attr("y", 0)
			.attr("text-anchor", "middle")
			.attr("text-decoration", function(d) {
				return (d.id === 21 || d.id === 22) ? "underline" : null;
			})
	      .call(d3.drag()
	          .on("start", dragstarted)
	          .on("drag", dragged)
	          .on("end", dragended));

	text.each(function(d) {
		var lines = String(d.txt || "").split("\n");
		var textNode = d3.select(this);
		var lineHeightEm = 1.05;
		var startDy = lines.length > 1 ? -((lines.length - 1) * lineHeightEm) / 2 : 0;

		lines.forEach(function(line, index) {
			textNode.append("tspan")
				.attr("x", d.x || getAnchor(d.id).x)
				.attr("dy", (index === 0 ? startDy : lineHeightEm) + "em")
				.text(line);
		});
	});											  
	          
	          								  
	  simulation
	      .nodes(graph.nodes)
	      .on("tick", ticked);
	
	  simulation.force("link")
	      .links(graph.links);
											  
	  function ticked() {
	    link
	        .attr("x1", function(d) { return d.source.x; })
	        .attr("y1", function(d) { return d.source.y; })
	        .attr("x2", function(d) { return d.target.x; })
	        .attr("y2", function(d) { return d.target.y; });
	
	    node
	        .attr("cx", function(d) { return d.x; })
	        .attr("cy", function(d) { return d.y; });
	    text
	        .attr("x", function(d) { return d.x; })
	        .attr("y", function(d) { return d.y; })
	        .each(function(d) {
	        	d3.select(this).selectAll("tspan").attr("x", d.x);
	        });										        
	  }

	
	function dragstarted(d) {
	  if (!d3.event.active) simulation.alphaTarget(0.1).restart();
	  d.fx = d.x;
	  d.fy = d.y;
	}
	
	function dragged(d) {
	  d.fx = d3.event.x;
	  d.fy = d3.event.y;
	}
	
	function dragended(d) {
	  if (!d3.event.active) simulation.alphaTarget(0);
	  d.fx = null;
	  d.fy = null;
	}	
	

	function run_on_simple_click() {
	    clickedOnce = false;
	}							
