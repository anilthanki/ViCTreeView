var ui;

function drawTree(file, div) {

    $(div).html("")
    var margin = {top: 20, right: 120, bottom: 20, left: 120},
        width = 960 - margin.right - margin.left,
        height = 800 - margin.top - margin.bottom;

    var i = 0,
        duration = 750,
        root;

    var tree = d3.layout.cluster()
        .size([height, width]);

    var diagonal = d3.svg.line().interpolate('step-before')
        .x(function (d) { return d.x; })
        .y(function (d) { return d.y; });


    d3.select("#save").on("click", function () {
        jQuery("#canvas").html("")

        //           d3.selectAll('.link').each(function() {
        //   var element = this;
        //   var computedStyle = getComputedStyle(element, null);
        //   for (var i = 0; i < computedStyle.length; i++) {
        //     var property = computedStyle.item(i);
        //     var value = computedStyle.getPropertyValue(property);
        //     element.style[property] = value;
        //   }
        // });


        var html = d3.select("svg")
            .attr("version", 1.1)
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .node().parentNode.innerHTML;
        console.log(html)
        //console.log(html);
        var imgsrc = 'data:image/svg+xml;base64,' + btoa(html);
        var img = '<img src="' + imgsrc + '">';
        d3.select("#svgdataurl").html(img);


        var canvas = document.querySelector("canvas"),
            context = canvas.getContext("2d");


        var image = new Image;
        image.src = imgsrc;
        image.onload = function () {
            context.drawImage(image, 0, 0);

            var canvasdata = canvas.toDataURL("image/png");

            var pngimg = '<img src="' + canvasdata + '">';
            d3.select("#pngdataurl").html(pngimg);

            var a = document.createElement("a");
            a.download = "sample.png";
            a.href = canvasdata;
            a.click();
        };

    });


    function zoom() {
        svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }


    // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
    var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on("zoom", zoom);


    var svg = d3.select(div).append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .call(zoomListener)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    // Attach the hover and click handlers


    d3.json(file, function () {

        root = file.json;
        root.x0 = height / 2;
        root.y0 = 0;

        function collapse(d) {
            if (d.children) {
                d._children = d.children;
                d._children.forEach(collapse);
                d.children = null;
            }
        }


        //root.children.forEach(collapse);
        update(root);
    });


    d3.select(self.frameElement).style("height", "800px");

    function update(source) {

        // Compute the new tree layout.
        var nodes = tree.nodes(root).reverse(),
            links = tree.links(nodes);

        // Normalize for fixed-depth.
        //nodes.forEach(function (d) {
        //    d.y = d.depth * 180;
        //});

        // Update the nodes…
        var node = svg.selectAll("g.node")
            .data(nodes, function (d) {
                return d.id || (d.id = ++i);
            });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function (d) {
                return "translate(" + source.y0 + "," + source.x0 + ")";
            })
            .on("click", click);

        nodeEnter.append("circle")

            .attr("r", 1e-6)
            .style("fill", "steelblue")
            .style("stroke", "black")
            .style("stroke-width", "0.5px")
            .style("fill", function (d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

        nodeEnter.append("text")
            .style("font", "10px sans-serif")
            .attr("x", function (d) {
                return d.children || d._children ? -10 : 10;
            })
            .attr("dy", ".35em")
            .attr("text-anchor", function (d) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function (d) {
                return d.name;
            }).on('click', function (nd, i) {
                // Walk parent chain
                var ancestors = [];
                var parent = nd;
                while (!_.isUndefined(parent)) {
                    ancestors.push(parent);
                    parent = parent.parent;
                }

                // Get the matched links
                var matchedLinks = [];
                svg.selectAll('path')
                    .filter(function (d, i) {
                        return _.any(ancestors, function (p) {
                            return p === d.target;
                        });
                    })
                    .each(function (d) {
                        matchedLinks.push(d);
                    });

                animateParentChain(matchedLinks);
            });

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function (d) {
                console.log("transition node")
                return "translate(" + d.y + "," + d.x + ")";
            });

        nodeUpdate.select("circle")
            .attr("r", 4.5)
            .style("fill", function (d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + source.y + "," + source.x + ")";
            })
            .remove();

        nodeExit.select("circle")
            .attr("r", 1e-6);

        nodeExit.select("text")
            .style("fill-opacity", 1e-6);

        // Update the links…

// var link = svg.append("path")
//       .datum(links)
//       .attr("class", "line")
//       .attr("d", line);

        var link = svg.selectAll("path")
            .data(links, function (d) {
                // console.log(d)
                return d.target.id;
            });

        // Enter any new links at the parent's previous position.
        link.enter()
        .append("path", "g")
            // .attr("class", "link")
            // .style("fill", "none")
            // .style("stroke"," #ccc")
            // .style("stroke-width", "1.5px")
       .attr("d", function (d) {
                      return diagonal([{
                y: d.source.x,
                x: d.source.y
            }, {
                y: d.source.x,
                x: d.source.y
            }]);
        })
        .transition()
        .duration(2000)
        .ease("linear")
        .attr("stroke-dashoffset", 0)
        ;

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", function (d) {
                console.log("transition link")

            return diagonal([{
                y: d.source.x,
                x: d.source.y
            }, {
                y: d.target.x,
                x: d.target.y
            }]);
        })
            .style("fill", "none")
            .style("stroke", " #ccc")
            .style("stroke-width", "1.5px")
        // .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function (d) {
            return diagonal([{
                y: d.source.x,
                x: d.source.y
            }, {
                y: d.target.x,
                x: d.target.y
            }]);
        })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function (d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

// Toggle children on click.
    function click(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        update(d);
    }

    function animateParentChain(links) {
        var linkRenderer = d3.svg.diagonal()
            .projection(function (d) {
                return [d.y, d.x];
            });

        // Links
        svg.selectAll("path.selected")
            .data([])
            .exit().remove();

        svg
            .selectAll("path.selected")
            .data(links)
            .enter().append("svg:path")
            .attr("class", "selected")
            .attr("d", linkRenderer);

        // Animate the clipping path
        var overlayBox = svg.node().getBBox();

        svg.select("#clip-rect")
            .attr("x", overlayBox.x + overlayBox.width)
            .attr("y", overlayBox.y)
            .attr("width", 0)
            .attr("height", overlayBox.height)
            .transition().duration(500)
            .attr("x", overlayBox.x)
            .attr("width", overlayBox.width);
    }

    function setupMouseEvents() {
        ui.nodeGroup.on('mouseover', function (d, i) {
            d3.select(this).select("circle").classed("hover", true);
        })
            .on('mouseout', function (d, i) {
                d3.select(this).select("circle").classed("hover", false);
            })
            .on('click', function (nd, i) {
                // Walk parent chain
                var ancestors = [];
                var parent = nd;
                while (!_.isUndefined(parent)) {
                    ancestors.push(parent);
                    parent = parent.parent;
                }

                // Get the matched links
                var matchedLinks = [];
                ui.linkGroup.selectAll('path')
                    .filter(function (d, i) {
                        return _.any(ancestors, function (p) {
                            return p === d.target;
                        });
                    })
                    .each(function (d) {
                        matchedLinks.push(d);
                    });

                animateParentChain(matchedLinks);
            });
    }

// Define the zoom function for the zoomable tree


}