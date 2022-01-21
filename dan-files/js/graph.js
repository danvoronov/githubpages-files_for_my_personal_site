var clickedOnce = false
var timer;
var rad = 720;

var graph = new Object;									
graph.links = new Array;
graph.nodes = new Array;

const colorMap = {
	'm':'000',
	'na':'fa8031',
	'n':'61c282',
	'a':'9158ad',
	'b':'5f58ad',
	'r':'cf02ba',
	'c':'657475'
}
						
graph.nodes.push(
	{id: 0, txt: 'Dan Vóronov / Дан Вóронов', group: 'm', radius: 340},
	{id: 2, txt: '⚙️ Startups & Projects', group: 'na', radius: 120, url: 'startups/'},
	{id: 1, txt: '🗣 Speaker & Tutor', group: 'na', radius: 110, url: 'educator/'},
	{id: 3, txt: '⏳ Now', group: 'n', radius: 45, url: 'now/'},
	{id: 4, txt: '🎭 ART', group: 'a', radius: 65, url: 'art/'},
	{id: 5, txt: '📝 Статьи [ru]', group: 'b', radius: 60, url: 'ru/'},
	{id: 10, txt: '📚 Прочитал [ru]', group: 'r', radius: 75, url: 'ru/prochital/'},
	{id: 21, txt: '🔗 YouTube', group: 'c', radius: 15, url: 'https://www.youtube.com/user/DanVoronov/videos'},
	{id: 22, txt: '🔗 Telegram', group: 'c', radius: 15, url: 'https://t.me/dv_prj'},
	// {id: 6, txt: 'old', group: 'b', radius: 35},
	// {id: 7, txt: 'new', group: 'b', radius: 35},
);									
graph.links.push( { source:  0, target: 1, value: 20 } );	
graph.links.push( { source:  0, target: 2, value: 20 } );	
graph.links.push( { source:  0, target: 3, value: 20 } );	
graph.links.push( { source:  0, target: 4, value: 20 } );	
graph.links.push( { source:  0, target: 5, value: 20 } );	
graph.links.push( { source:  0, target: 10, value: 20 } );	
graph.links.push( { source:  0, target: 21, value: 10 } );	
graph.links.push( { source:  0, target: 22, value: 10 } );	

let pol = $(window).height()-rad
let pol2 = $(window).width()-rad


$("#graph").css("width", rad+20).css("height", rad+20)
		.css("margin-top", pol/2).css("margin-left", pol2/2)
	var svg = d3.select("#graph").append("svg")
		.attr("width", rad).attr("height", rad)	
	var simulation = d3.forceSimulation()
	    .force("link", d3.forceLink().id(function(d) { return d.id; }))
	    .force("charge", d3.forceManyBody().distanceMax(400).theta(1).strength(-7000) )
	    .force("center", d3.forceCenter(rad / 2, rad / 2))										    																					
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
			.attr("x", 8)
			.attr("y", "2em")												  
			  .attr("text-anchor", "middle")
	      .call(d3.drag()
	          .on("start", dragstarted)
	          .on("drag", dragged)
	          .on("end", dragended))					      								
	      .text(function(d) { return d.txt; });											  
	          
	          								  
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
	        .attr("y", function(d) { return d.y; });										        
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
