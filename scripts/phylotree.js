var ui;
var species
var space = 3

function readSpecies(file) {
    d3.csv(file, function (data) {
        species = data;
    })
}

function drawTree(file, div) {

    $(div).html("")

    var margin = {
            top: 20,
            right: 120,
            bottom: 20,
            left: 120
        },
        width = 960 - margin.right - margin.left,
        height = 800 - margin.top - margin.bottom;

    var i = 0,
        duration = 750,
        root;

    var tree = d3.layout.cluster()
        .size([height, width]);

    var diagonal = d3.svg.line().interpolate('step-before')
        .x(function (d) {
            return d.x;
        })
        .y(function (d) {
            return d.y;
        });

    d3.select("#filterButton").on("click", function () {
        filter(jQuery("#points").val())
    })

    $("#sort_ascending").on("click", function (e) {
        change_distance(true);
    });


    $("#slider").mouseup(function () {
        var left = $("#percentage").val()

        pathtohighlight(left)
    })
    $("#sort_descending").on("click", function (e) {
        change_distance(false);
    });


    d3.select("#save").on("click", function () {
        jQuery("#canvas").html("")
        var canvas = document.getElementById('canvas');
        var context = canvas.getContext('2d');

        // do some drawing
        context.clearRect(0, 0, canvas.width, canvas.height);

        var html = d3.select("svg")
            .attr("version", 1.1)
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .node().parentNode.innerHTML;

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


    var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on("zoom", zoom);


    var svg = d3.select(div).append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .call(zoomListener)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("svg:clipPath").attr("id", "clipper")
        .append("svg:rect")
        .attr('id', 'clip-rect');


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

        update(root);
    });


    d3.select(self.frameElement).style("height", "800px");

    function update(source) {

        // Compute the new tree layout.
        var nodes = tree.nodes(root).reverse(),
            links = tree.links(nodes);

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
            .attr("distance", function (d) {

                if (d.species) {

                }
                else if (d.children) {
                    var distance = findDistance(d)
                    d.distance = distance

                    return distance
                }

            });

        nodeEnter.append("circle")
            .attr("r", 1e-6)
            .style("stroke", "black")
            .style("stroke-width", "0.5px")
            .style("z-index", "999")
            .style("fill", function (d) {
                if (d.highlighted == true || d.filtered == true) {
                    return "red"
                } else {
                    return d._children ? "lightsteelblue" : "white";
                }
            })
            .attr("id", function (d) {
                return d.id
            })
            .on("click", click);


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
            }).on('click', pathtoparent);

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + d.y + "," + d.x + ")";
            })
            .attr("distance", function (d) {
                if (d.species) {

                }
                else if (d.children) {
                    return findDistance(d)
                }
            });

        nodeUpdate.select("circle")
            .attr("r", 4.5)
            .attr("species", function (d) {
                return d.species
            })
            .attr("id", function (d) {
                return d.id
            })
            .style("fill", function (d) {
                if (d.highlighted == true || d.filtered == true) {
                    return "red"
                } else {
                    return d._children ? "lightsteelblue" : "white";
                }
            })


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
        var link = svg.selectAll("path")
            .data(links, function (d) {
                return d.target.id;
            });

        // Enter any new links at the parent's previous position.
        link.enter()
            .append("path", "g")
            .style("fill", "none")
            .style("stroke", function (d) {
                if (d.source.highlighted == true || d.filtered == true) {
                    return "red"
                } else {
                    return "#ccc";
                }
            })
            .style("stroke-width", "1.5px")
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
            .style("stroke", function (d) {
                if (d.highlighted == true || d.filtered == true) {
                    return "red"
                } else {
                    return "#ccc";
                }
            })
            .style("stroke-width", "1.5px")
            .duration(2000)
            .ease("linear")
            .attr("stroke-dashoffset", 0);

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .style("stroke", function (d) {
                if (d.source.highlighted == true || d.filtered == true) {
                    return "red"
                } else {
                    return "#ccc";
                }
            })
            .style("stroke-width", "1.5px")

            .attr("d", function (d) {
                return diagonal([{
                    y: d.source.x,
                    x: d.source.y
                }, {
                    y: d.target.x,
                    x: d.target.y
                }]);
            })

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
        console.log("clicked")
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        update(d);
    }


    //highlight based on click
    function pathtoparent(d, i) {
        console.log("pathtoparent")
        // Walk parent chain
        var ancestors = [];
        var n_ancestors = [];
        var parent = d;
        while (!_.isUndefined(parent)) {
            ancestors.push(parent);
            n_ancestors.unshift(parent.name);
            parent = parent.parent;
        }
        var breadcrumb = '';
        _.each(n_ancestors, function (key, val) {
            if (val < n_ancestors.length - 1) breadcrumb += key + ' / ';
            else breadcrumb += key;
        });
        $("#infobox").text(breadcrumb);

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

        console.log(matchedLinks)

        animateParentChain(matchedLinks);
    }

    function animateParentChain(links) {
        d3.selectAll("path")
            .filter(function (d, i) {
                if (!d.filtered || d.filtered == false) {
                    return d;
                }
            })
            .style("fill", "none")
            .style("stroke", "#ccc")

        d3.selectAll("path")
            .style("fill", "none")
            .style("stroke-width", "1.5px")

        d3.selectAll("path")
            .filter(function (d, i) {
                return _.any(links, function (p) {
                    if (d.target.id == p.target.id) {
                        d.highlighted = true

                        return d;
                    }
                });
            })
            .attr("class", "selected")
            .style("fill", "none")
            .style("stroke", "red")
            .style("stroke-width", "5px")
    }

    //highlight based on filter

    function pathtohighlight(identity) {
        console.log("pathtohighlight " + identity)

        svg.selectAll("circle")
            .style("fill", "none")
        var selected_nodes = d3.selectAll("circle")
            .filter(function (d) {
                if (d.distance <= identity) {
                    d.filtered = true
                    if (d.children && d.children[0].species) {
                        _.any(d.children, function (p) {
                            p.filtered = true
                        });
                    }
                    return d
                } else {
                    console.log(d.distance)
                    d.filtered = false
                }

            });

        d3.selectAll("circle")
            .filter(function (d) {
                if (d.filtered == true) {
                    return d
                }
            })
            .transition()
            .style("fill", "red");

        svg.selectAll('path')
            .filter(function (d) {
                if (!d.highlighted || d.highlighted == false) {
                    return d
                }
            })
            .transition()
            .style("stroke", "#ccc")
            .style("stroke-width", "1.5px")


        var selected_links = svg.selectAll('path')
            .filter(function (d, i) {
                return _.any(selected_nodes[0], function (p) {
                    if (d.source.id == p.id) {
                        d.filtered = true
                        return d;
                    } else {
                        d.filtered = false
                    }
                });
            })

        selected_links
            .transition()
            .style("stroke", "red")
    }


    function change_distance(increase) {
        if (increase == true) {
            space += 10;
            height += 50
        } else {
            space -= 10;
            space = space < 1 ? 1 : space;
            height -= 50

        }
        tree.size([height, width]);
        tree.separation(function (a, b) {
            return ((a.parent == root) && (b.parent == root)) ? space : 1;
        })
        update(root);
    }
}

function findDistance(node) {
    var distance = 0;
    var list = []
    for (var i = 0; i < node.children.length; i++) {
        if (node.children[i].species) {
            list.push(node.children[i].species)
        } else if (node.children[i].children != null) {
            recursiveFinder(node.children[i])
        }
    }

    function recursiveFinder(child_node) {
        for (var j = 0; j < child_node.children.length; j++) {
            if (child_node.children[j].species) {
                list.push(child_node.children[j].species)
            } else if (child_node.children[j].children != null) {
                recursiveFinder(child_node.children[j])
            }
        }
    }

    for (var i = 0; i < list.length; i++) {
        for (var j = i; j < list.length; j++) {
            var temp_distance = findElement(species, "species", list[i])[list[j]] * 100

            if (distance < temp_distance) {
                distance = temp_distance
            }
        }
        return distance;
    }
}

function findElement(arr, propName, propValue) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i][propName] == propValue) {
            return arr[i];
        }
    }
}