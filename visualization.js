buildVisualization();

function buildVisualization() {
	//Build the frame for the network
	svg = d3.select("#network")
		width = +svg.attr("width"),
		height = +svg.attr("height");

	color = d3.scaleThreshold()
		.domain(d3.range(1,4))
		.range(['#01416e','#428baf','#96c9f3']);

	//Create links between nodes, sets how much nodes repulse one another, centers the graph
	simulation = d3.forceSimulation()
		.force("link", d3.forceLink().id(function(d) { return d.id; }))
		.force("charge", d3.forceManyBody().strength(-700))
		.force("center", d3.forceCenter(width / 2, height / 2));

	//Read in model data, build visualization from that
	d3.json("coocurrences_family.json", function(error, graph) {
		if (error) throw error;

		//Remove proust, then initialize graph with ceter family and date range
		work_graph = removeID(graph,'http://catalogdata.library.illinois.edu/lod/entities/Persons/kp/proust0');

		//Set center node of graph
		var current_url = new URL(window.location.href);
		var target_family = current_url.searchParams.get("center");
		if (target_family && work_graph['nodes'].map(a => a.id).indexOf('http://catalogdata.library.illinois.edu/lod/entities/Persons/kp/' + target_family) > -1) {
			var center_family = 'http://catalogdata.library.illinois.edu/lod/entities/Persons/kp/' + target_family;
		}
		else {
			var center_family = 'http://catalogdata.library.illinois.edu/lod/entities/Persons/kp/adam0';
		}

		//Default year bounds
		var start_year = 1880;
		var end_year = 1930;

		displayNetwork(setFocus(work_graph,center_family,start_year,end_year),svg,simulation,color,width,height,center_family);

		setupSlider(start_year,end_year,work_graph,svg,simulation,color,width,height,center_family);

		//Build selection dropdown
		var select = d3.select('body')
			.append('select')
				.attr('class','select')
				.on('change',onchange);

		var options = select
			.selectAll('option')
			.data(work_graph['nodes']).enter()
			.append('option')
				.text(function(d) { return d.name })
				.attr('value', function(d) { return d.id });

		function onchange() {
			center_family = d3.select('select').property('value');

			var new_url = current_url.href;
			if (current_url.href.indexOf('?') == -1) {
				new_url += '?center=' + center_family.substring(center_family.lastIndexOf('/')+1);
			}
			else {
				new_url = new_url.substring(0,new_url.indexOf('?')) + "?center=" + center_family.substring(center_family.lastIndexOf('/')+1);
			}

			location.href = new_url;
//			setYear(d3.select("#handle0"),1880,svg,simulation,color,width,height,center_family);
//			setYear(d3.select("#handle1"),1930,svg,simulation,color,width,height,center_family);
//			changeSliderFocus(work_graph,svg,simulation,color,width,height,center_family)
//			displayNetwork(setFocus(work_graph,center_family,start_year,end_year),svg,simulation,color,width,height,center_family);

//			window.history.replaceState(null,null,new_url);
		}

		d3.select('select').property('value',center_family);
	});
}

function makeNameReadable(name) {
	var comma_index = name.indexOf(',')
	var revised_name = name.substring(comma_index+1).trim() + ' ' + name.substring(0,comma_index) + ':';
	return revised_name.charAt(0).toUpperCase() + revised_name.slice(1);
}

function displayNetwork(display_graph,svg,simulation,color,width,height,center_family) {
	//Select links for updating
	var links = svg.selectAll(".links")
		.data(display_graph);

	links.attr("class","update");

	//Build links from data
	var link = svg.append("g")
		.attr("class", "links")
		.selectAll("line")
		.data(display_graph.links)
		.enter().append("line")
//			.attr("stroke-width", function(d) { return d.value; })
			.attr("stroke-width", function(d) { return 1 + Math.log2(d.value); })
			.attr("id", function(d) { return d.source.substring(d.source.lastIndexOf("/")+1) + d.target.substring(d.target.lastIndexOf("/")+1); })
			.on("mouseover", function(d) { 
				d3.select(this).style("stroke",'#900');
				//Annotation code
				let type = d3.annotationCallout;

				let annotations = [{
					note: {
						title: d.name + ' ' + d.value,
//						label: ()
						wrap: 400
					},
					x: (d.source.x + d.target.x)/2,
					y: (d.source.y + d.target.y)/2,
					dx: 25,
					dy: 25,
					color: "black"
				}]

				let makeAnnotations = d3.annotation()
					.type(type)
					.annotations(annotations);

				svg.attr("class","annotation-group")
					.append("g")
					.attr("class","link-annotation")
					.attr("transform",d3.select(this).attr("transform"))
//					.style('font-size',"16pt")
					.call(makeAnnotations);
			})
			.on("mouseout", function(d) { 
				d3.select(this).style("stroke",'#999');
				d3.select(".link-annotation").remove();
			});
//			.on("contextmenu", function(d) { d3.event.preventDefault(); });

/*	link.append("title")
		.text(function(d) { return d.name + ' ' + d.value; });*/

	//Select nodes for updating
	var nodes = svg.selectAll(".nodes")
		.data(display_graph);

	nodes.attr("class","update");

	//Build nodes from data
	var node = svg.append("g")
		.attr("class", "nodes")
		.selectAll("circle")
		.data(display_graph.nodes)
		.enter().append("circle")
//			.attr("r", function(d) { return 4 + d.mention_count/2; })
			.attr("r", function(d) { return 5 + Math.log2(d.mention_count); })
			.attr("fill", function(d) { return color(d.group); })
			.attr("id", function(d) { return d.id.substring(d.id.lastIndexOf("/")+1); })
			.attr("class", function(d) { return "group" + d.group; })
			.on("mouseover", function(d) { 
				d3.select(this).attr("fill","#900");
				//Annotation code
				let type = d3.annotationCallout;

				let annotations = [{
					note: {
						title: makeNameReadable(d.name) + ' ' + d.mention_count,
						wrap: 400
					},
					x: d.x + ((5 + Math.log2(d.mention_count))/Math.sqrt(2)),
					y: d.y + ((5 + Math.log2(d.mention_count))/Math.sqrt(2)),
					dx: 25,
					dy: 25,
					color: "black"
				}]

				let makeAnnotations = d3.annotation()
					.type(type)
					.annotations(annotations);

				svg.attr("class","annotation-group")
					.append("g")
					.attr("class","node-annotation")
					.attr("transform",d3.select(this).attr("transform"))
//					.style('font-size',"16pt")
					.call(makeAnnotations);
			})
			.on("mouseout", function(d) { 
				d3.select(this).attr("fill", color(d.group))
				d3.select(".node-annotation").remove();
			})
			.on("contextmenu", function(d) { d3.select(this).attr("class",d3.select(this).attr("class") + " context-menu")})
			.call(d3.drag()
				.on("start", dragstarted)
				.on("drag", dragged)
				.on("end", dragended));

/*	node.append("title")
		.text(function(d) { return d.name + ' ' + d.mention_count; });*/

	d3.selectAll('g').select("nodes")
		.attr("cx", function(d) { return d.x; })
		.attr("cy", function(d) { return d.y; });

	//Remove links and nodes that no longer exist within these bounds
	links.exit().remove();
	nodes.exit().remove();

	//Make our node objects recognized by the simulation as nodes, apply forces to them
	simulation
		.nodes(display_graph.nodes)
		.on("tick", ticked);

	//Make our link objects recognized by the simulation as links
	simulation.force("link")
		.links(display_graph.links);

	var zoomer = d3.zoom()
		.scaleExtent([0.1,10])
		.on("zoom", zoom);

	var xScale = d3.scaleLinear()
		.domain([0,width]).range([0,width]);
	var yScale = d3.scaleLinear()
		.domain([0,height]).range([0, height]);

	svg.call(zoomer);

	function ticked() {
		link
			.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });

		node
			.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) { return d.y; });
	}

	function zoom() {
		node.attr("transform",d3.event.transform);
		link.attr("transform",d3.event.transform);
		d3.select(".node-annotation").attr("transform",d3.event.transform);
		d3.select(".link-annotation").attr("transform",d3.event.transform);
		d3.event.transform.rescaleX(xScale);
		d3.event.transform.rescaleY(yScale);
	}

	function dragstarted(d) {
		if (!d3.event.active) simulation.alphaTarget(0.3).restart();
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
}

function setupSlider(handle1,handle2,work_graph,network_svg,simulation,color,network_width,network_height,center_family) {
	var slider_vals = [handle1, handle2];

	//Define bounds of frame
	var svg = d3.select("#timeline"),
		width = +svg.attr("width"),
		height = +svg.attr("height");

	//Function for converting year to location on timeline
	var x = d3.scaleLinear()
		.domain([1880, 1930])
		.range([0, width-50])
		.clamp(true);

	//Build and position slider
	var slider = svg.append("g")
		.attr("class", "slider")
		.attr("transform", "translate(25,20)");

	//Create bounds of track
	slider.append("line")
		.attr("class", "track")
		.attr("x1", x.range()[0])
		.attr("x2", x.range()[1]);

	var selRange = slider.append("line")
		.attr("class","sel-range")
		.attr("x1",x(slider_vals[0]))
		.attr("x2",x(slider_vals[1]));

	//Build labels on bottom of track
	slider.insert("g", ".track-overlay")
		.attr("class", "ticks")
		.attr("transform", "translate(0,18)")
		.selectAll("text")
		.data(x.ticks(10))
		.enter().append("text")
			.attr("x", x)
			.attr("text-anchor", "middle")
			.text(function(d) { return d; });

	//Initialize tooltip object, which is used to show the year the handle is on. When it is hovered over, the year is written and the object is made visible. When the mouse moves off, it is made invisible
	var tooltip = d3.select("body")
		.append("div")
		.style("position","absolute")
		.style("z-index","10")
		.style("visibility","hidden")
		.attr("class","tooltip");

	//Build two handles on either end of the timeline
	var handle = slider.selectAll("handle")
		.data([0,1])
		.enter().append("circle", ".track-overlay")
			.attr("class", "handle")
			.attr("r", 9)
			.attr("cx", function(d) { return x(slider_vals[d]); })
			.attr("id", function(d) { return "handle" + d; })
			.on("mouseover", function() { return tooltip.style("visibility","visible").text(Math.floor(x.invert(d3.select(this).attr("cx")))); })
			.on("mousemove", function() { return tooltip.style("top",595 + "px").style("left",(Number(d3.select(this).attr("cx"))+14) + "px"); })
			.on("mouseout", function() { return tooltip.style("visibility","hidden"); })
			.call(
				d3.drag()
					.on("start", startDrag)
					.on("drag", drag)
					.on("end", function() { setYear(d3.select(this),x.invert(d3.event.x),work_graph,network_svg,simulation,color,network_width,network_height,center_family); }));

	function startDrag() {
		d3.select(this).raise().classed("active",true);
	}

	function drag(d) {
		var x1 = d3.event.x;
		var xMin = x(1880);
		var xMax = x(1930);
		if (x1 > xMax) {
			x1 = xMax;
		}
		else if (x1 < xMin) {
			x1 = xMin;
		}

		//Set position of selected handle to be the x position of the cursor
		d3.select(this).attr("cx",x1);

		var x2 = x(slider_vals[d==0?1:0])
		selRange
			.attr("cx",x1)
			.attr("cx",x2)

		tooltip.style("left",(x1+14) + "px")
			.text(Math.floor(x.invert(x1)));

		setYear(d3.select(this),x.invert(d3.event.x),work_graph,network_svg,simulation,color,network_width,network_height,center_family);
	}
}

function changeSliderFocus(work_graph,svg,simulation,color,width,height,center_family) {
	d3.selectAll("handle")
		.call(
			d3.drag()
				.on("end", function() { setYear(d3.select(this),x.invert(d3.event.x),work_graph,network_svg,simulation,color,network_width,network_height); }))
	setYear(d3.select("#handle0"),1880,work_graph,svg,simulation,color,width,height,center_family);
	setYear(d3.select("#handle1"),1930,work_graph,svg,simulation,color,width,height,center_family);
}

function setYear(target,new_year,work_graph,network_svg,simulation,color,network_width,network_height,center_family) {
	var slider = d3.select(".slider");
	var x = d3.scaleLinear()
		.domain([1880, 1930])
		.range([0, d3.select("#timeline").attr("width")-50])
		.clamp(true);

	year = Math.floor(new_year);
	target.attr("cx", x(year));

	var handle0_year = x.invert(slider.select("#handle0").attr("cx"));
	var handle1_year = x.invert(slider.select("#handle1").attr("cx"));

	var start_year;
	var end_year;
	if (handle0_year < handle1_year) {
		start_year = handle0_year;
		end_year = handle1_year;
	}
	else {
		start_year = handle1_year;
		end_year = handle0_year;
	}

//		alert(start_year + "-" + end_year);
	displayNetwork(setFocus(work_graph,center_family,start_year,end_year),network_svg,simulation,color,network_width,network_height,center_family);
}

$(function() {
	$.contextMenu({
		selector: '.context-menu',
		items: {
			"center": {name: "Center Graph on Node"},
			"degree": {name: "Toggle Degree of Separation"},
			"annotate": {name: "Add Annotation"}
		},
		callback: function(key, options) {
			if (key == 'center') {
				location.href = "http://xtf.grainger.illinois.edu/kpnetwork/?center=" + this[0]['id'];
			}
			else if (key == 'degree') {
				//work_graph is global
				var center_family = 'http://catalogdata.library.illinois.edu/lod/entities/Persons/kp/' + $(".group0").attr("id");

				var x = d3.scaleLinear()
					.domain([1880, 1930])
					.range([0, d3.select("#timeline").attr("width")-50])
					.clamp(true);

				var handle0_year = x.invert($("#handle0").attr("cx"));
				var handle1_year = x.invert($("#handle1").attr("cx"));

				if (handle0_year <= handle1_year) {
					var start_year = handle0_year;
					var end_year = handle1_year;
				}
				else {
					var start_year = handle1_year;
					var end_year = handle0_year;
				}

				var toggle_choice = true;
				if ($(".group2").length == 0) {
					toggle_choice = false;
				}
				displayNetwork(setFocus(work_graph,center_family,start_year,end_year,toggle_choice),svg,simulation,color,width,height,center_family);
			}
			else {
				var m = "clicked: " + key;
				alert(m);
			}

			this[0]['classList'].remove("context-menu");
		}
	});
});