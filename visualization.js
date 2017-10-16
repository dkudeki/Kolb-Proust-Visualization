function setFocus(graph,id) {
	var output_graph = { 'nodes': [], 'links': [] };
	var degree_one = [];
	var degree_two = [];


	for (var index = 0; index < graph['nodes'].length; index++) {
		if (graph['nodes'][index]['id'] == id) {
			output_graph['nodes'].push(graph['nodes'][index]);
		}
	}

	for (var index = 0; index < graph['links'].length; index++) {
		if (graph['links'][index]['source'] == id || graph['links'][index]['target'] == id) {
			output_graph['links'].push(graph['links'][index]);

			if (graph['links'][index]['source'] == id) {
				degree_one.push(graph['links'][index]['target']);
			}
			else {
				degree_one.push(graph['links'][index]['source']);
			}
		}
	}

	for (var index = 0; index < graph['nodes'].length; index++) {
		if (degree_one.includes(graph['nodes'][index]['id'])) {
			output_graph['nodes'].push(graph['nodes'][index]);
		}
	}

	for (var index = 0; index < graph['links'].length; index++) {
		if (graph['links'][index]['source'] != id && graph['links'][index]['target'] != id && (degree_one.includes(graph['links'][index]['source']) || degree_one.includes(graph['links'][index]['target']))) {
			output_graph['links'].push(graph['links'][index]);

			if (!degree_one.includes(graph['links'][index]['source'])) {
				degree_two.push(graph['links'][index]['source']);
			}
			else if (!degree_one.includes(graph['links'][index]['target'])) {
				degree_two.push(graph['links'][index]['target']);
			}
		}
	}

	for (var index = 0; index < graph['nodes'].length; index++) {
		if (degree_two.includes(graph['nodes'][index]['id'])) {
			output_graph['nodes'].push(graph['nodes'][index]);
		}
	}

	for (var index = 0; index < graph['links'].length; index++) {
		if (degree_two.includes(graph['links'][index]['source']) && degree_two.includes(graph['links'][index]['target'])) {
			output_graph['links'].push(graph['links'][index]);
		}
	}

	return output_graph;
}

function removeID(graph,id) {
	nodes_to_remove = []
	links_to_remove = []

	for (var index = 0; index < graph['nodes'].length; index++) {
		if (graph['nodes'][index]['id'] == id) {
			nodes_to_remove.push(index);
		}
	}

	for (var i = nodes_to_remove.length-1; i >= 0; i--) {
		graph['nodes'].splice(nodes_to_remove[i],1);
	}

	for (var index = 0; index < graph['links'].length; index++) {
		if (graph['links'][index]['source'] == id || graph['links'][index]['target'] == id) {
			links_to_remove.push(index);
		}
	}

	for (var i = links_to_remove.length-1; i >= 0; i--) {
		graph['links'].splice(links_to_remove[i],1);
	}

	return graph
}

var svg = d3.select("svg"),
	width = +svg.attr("width"),
	height = +svg.attr("height");

var color = d3.scaleOrdinal(d3.schemeCategory20);

var simulation = d3.forceSimulation()
	.force("link", d3.forceLink().id(function(d) { return d.id; }))
//	.force("charge", d3.forceManyBody().strength(function(d) { return -500 * d.mention_count; }))
	.force("charge", d3.forceManyBody().strength(-700))
	.force("center", d3.forceCenter(width / 2, height / 2));

d3.json("coocurrences_family.json", function(error, graph) {
	if (error) throw error;

	graph = removeID(graph,'http://catalogdata.library.illinois.edu/lod/entities/Persons/kp/proust0');
	graph = setFocus(graph,'http://catalogdata.library.illinois.edu/lod/entities/Persons/kp/adam0');

	var center_family = 'http://catalogdata.library.illinois.edu/lod/entities/Persons/kp/adam0';

	var link = svg.append("g")
		.attr("class", "links")
		.selectAll("line")
		.data(graph.links)
		.enter().append("line")
//			.attr("stroke-width", function(d) { return d.value; })
			.attr("stroke-width", function(d) { return 1 + Math.log2(d.value); })
			.on("mouseover", function(d) { d3.select(this).style("stroke",'#900') })
			.on("mouseout", function(d) { d3.select(this).style("stroke",'#999') });

	link.append("title")
		.text(function(d) { return d.name; });

	var node = svg.append("g")
		.attr("class", "nodes")
		.selectAll("circle")
		.data(graph.nodes)
		.enter().append("circle")
//			.attr("r", function(d) { return 4 + d.mention_count/2; })
			.attr("r", function(d) { return 5 +  Math.log2(d.mention_count); })
			.attr("fill", function(d) { return color(d.group); })
			.call(d3.drag()
				.on("start", dragstarted)
				.on("drag", dragged)
				.on("end", dragended));

	node.append("title")
		.text(function(d) { return d.name + ' ' + d.mention_count; });

	d3.selectAll('g').select("nodes")
		.attr("cx", function(d) { return (d.id == center_family ? width/2 : d.x); })
		.attr("cy", function(d) { return (d.id == center_family ? height/2 : d.y); });

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
	}

	var zoomer = d3.zoom()
		.scaleExtent([0.1,10])
		.on("zoom", zoom);

	var xScale = d3.scaleLinear()
		.domain([0,width]).range([0,width]);
	var yScale = d3.scaleLinear()
		.domain([0,height]).range([0, height]);

	svg.call(zoomer)

	function zoom() {
		node.attr("transform",d3.event.transform);
		link.attr("transform",d3.event.transform);
		d3.event.transform.rescaleX(xScale);
		d3.event.transform.rescaleY(yScale);
	}
});

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