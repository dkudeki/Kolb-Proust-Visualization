buildVisualization();

function buildVisualization() {
	//Build the frame for the network
	var svg = d3.select("#network")
		width = +svg.attr("width"),
		height = +svg.attr("height");

	var color = d3.scaleThreshold()
		.domain(d3.range(1,4))
		.range(['#01416e','#428baf','#96c9f3']);

	//Create links between nodes, sets how much nodes repulse one another, centers the graph
	var simulation = d3.forceSimulation()
		.force("link", d3.forceLink().id(function(d) { return d.id; }))
		.force("charge", d3.forceManyBody().strength(-700))
		.force("center", d3.forceCenter(width / 2, height / 2));

	//Read in model data, build visualization from that
	d3.json("coocurrences_family.json", function(error, graph) {
		if (error) throw error;

		//Remove proust, then initialize graph with ceter family and date range
		work_graph = removeID(graph,'http://catalogdata.library.illinois.edu/lod/entities/Persons/kp/proust0');
		var center_family = 'http://catalogdata.library.illinois.edu/lod/entities/Persons/kp/adam0';
		var start_year = 1880;
		var end_year = 1930;

		setupSlider(start_year,end_year,displayNetwork,svg,simulation,color,width,height,center_family);

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
			selectValue = d3.select('select').property('value');
			center_family = selectValue;
			displayNetwork(setFocus(work_graph,selectValue,start_year,end_year),svg,simulation,color,width,height);
		}

		displayNetwork(setFocus(work_graph,center_family,start_year,end_year),svg,simulation,color,width,height);
//		d3.annotation().annotations(annotations);
	});
}

function displayNetwork(display_graph,svg,simulation,color,width,height) {
	var links = svg.selectAll(".links")
		.data(display_graph);

	links.attr("class","update");

	var link = svg.append("g")
		.attr("class", "links")
		.selectAll("line")
		.data(display_graph.links)
		.enter().append("line")
//			.attr("stroke-width", function(d) { return d.value; })
			.attr("stroke-width", function(d) { return 1 + Math.log2(d.value); })
			.attr("id", function(d) { return d.source.substring(d.source.lastIndexOf("/")+1) + d.target.substring(d.target.lastIndexOf("/")+1); })
			.on("mouseover", function(d) { d3.select(this).style("stroke",'#900') })
			.on("mouseout", function(d) { d3.select(this).style("stroke",'#999') });

	link.append("title")
		.text(function(d) { return d.name + ' ' + d.value; });

	var nodes = svg.selectAll(".nodes")
		.data(display_graph);

	var node = svg.append("g")
		.attr("class", "nodes")
		.selectAll("circle")
		.data(display_graph.nodes)
		.enter().append("circle")
//			.attr("r", function(d) { return 4 + d.mention_count/2; })
			.attr("r", function(d) { return 5 +  Math.log2(d.mention_count); })
			.attr("fill", function(d) { return color(d.group); })
			.attr("id", function(d) { return d.id.substring(d.id.lastIndexOf("/")+1); })
			.call(d3.drag()
				.on("start", dragstarted)
				.on("drag", dragged)
				.on("end", dragended));

	node.append("title")
		.text(function(d) { return d.name + ' ' + d.mention_count; });

	d3.selectAll('g').select("nodes")
		.attr("cx", function(d) { return d.x; })
		.attr("cy", function(d) { return d.y; });

	simulation
		.nodes(display_graph.nodes)
		.on("tick", ticked);

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

	links.exit().remove();

	nodes.exit().remove();

	const type = d3.annotationLabel;

/*	const annotations = [{
		note: {
			label: "Test Label",
			title: "Test Title"
		},
		x: 150,
		y: 150,
		dy: 100,
		dx: 100
	}]

	const makeAnnotations = d3.annotation()
		.type(d3.annotationLabel)
		.annotations(annotations);

	svg.attr("class","annotation-group")
		.append("g")
		.call(makeAnnotations);*/

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

function setupSlider(handle1,handle2,displayNetwork,network_svg,simulation,color,network_width,network_height,center_family) {
	var slider_vals = [handle1, handle2];

	var svg = d3.select("#timeline"),
		width = +svg.attr("width"),
		height = +svg.attr("height");

	var x = d3.scaleLinear()
		.domain([1880, 1930])
		.range([0, width-50])
		.clamp(true);

	var slider = svg.append("g")
		.attr("class", "slider")
		.attr("transform", "translate(25,20)");

	slider.append("line")
		.attr("class", "track")
		.attr("x1", x.range()[0])
		.attr("x2", x.range()[1]);

	var selRange = slider.append("line")
		.attr("class","sel-range")
		.attr("x1",x(slider_vals[0]))
		.attr("x2",x(slider_vals[1]));

	slider.insert("g", ".track-overlay")
		.attr("class", "ticks")
		.attr("transform", "translate(0,18)")
		.selectAll("text")
		.data(x.ticks(10))
		.enter().append("text")
			.attr("x", x)
			.attr("text-anchor", "middle")
			.text(function(d) { return d; });

	var tooltip = d3.select("body")
		.append("div")
		.style("position","absolute")
		.style("z-index","10")
		.style("visibility","hidden")
		.text("Hello World")
		.attr("class","tooltip");

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
					.on("end", function() { setYear(d3.select(this),x.invert(d3.event.x),network_svg,simulation,color,network_width,network_height,center_family); }));

	function setYear(target,new_year,network_svg,simulation,color,network_width,network_height,center_family) {
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
		displayNetwork(setFocus(work_graph,center_family,start_year,end_year),network_svg,simulation,color,network_width,network_height);
	}

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

		d3.select(this).attr("cx",x1);

		var x2 = x(slider_vals[d==0?1:0])
		selRange
			.attr("cx",x1)
			.attr("cx",x2)

		tooltip.style("left",(x1+14) + "px")
			.text(Math.floor(x.invert(x1)));
	}
}