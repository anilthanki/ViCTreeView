var ui;
var species;
var labels = {};
var space = 3
var svg;
var highlighted_parent = null;
var distance = true;
var label = "Protein_GI"

function readSpecies(file) {
    d3.csv(file, function (data) {
        species = data;

    })

}

function readLabels(file) {

    d3.csv(file, function (data) {
        for(i in data){
            labels[data[i].Protein_GI] = data[i]
        }
    })
}

function drawTree(file, div) {

    $(div).html("")



    var margin = {
            top: 20,
            right: 120,
            bottom:
             20,
            left: 120
        },
        width = 1260 - margin.right - margin.left,
        height = 800 - margin.top - margin.bottom;

    var i = 0,
        duration = 750,
        root;

    var tree = d3.layout.cluster()
        .size([height, width]);

    var projection = function(d) { return [d.y, d.x]; }
    var path = function(pathData) {
      return "M" + pathData[0] + ' ' + pathData[1] + " " + pathData[2];
    }

    function diagonal(diagonalPath, i) {
      var source = diagonalPath.source,
          target = diagonalPath.target,
          midpointX = (source.x + target.x) / 2,
          midpointY = (source.y + target.y) / 2,
          pathData = [source, {x: target.x, y: source.y}, target];
      pathData = pathData.map(projection);
      return path(pathData)
    }

    function projection(x) {
      if (!arguments.length) return projection;
      projection = x;
      return diagonal;
    }
    
     function path(x) {
      if (!arguments.length) return path;
      path = x;
      return diagonal;
    }


      function scaleBranchLengths(nodes, w) {

        // Visit all nodes and adjust y pos width distance metric
        var visitPreOrder = function(root, callback) {
          callback(root)
          if (root.children) {
            for (var i = root.children.length - 1; i >= 0; i--){

              visitPreOrder(root.children[i], callback)
            };
          }
        }

        visitPreOrder(nodes[0], function(node) {
          // node.rootDist = (node.parent ? node.parent.rootDist : 0) + (node.data.length || 0)
          node.depth = (node.parent ? node.parent.depth : 0) + (parseFloat(node.attribute) || 0)

        })
        var depths = nodes.map(function(n) { return n.depth; });

        var yscale = d3.scale.linear()
          .domain([0, d3.max(depths)])
          .range([0, w]);
        visitPreOrder(nodes[0], function(node) {
          node.y = yscale(node.depth)
        })
        return yscale
      }


    $("#sort_ascending").on("click", function (e) {
        change_distance(true);
    });


    $("#sort_descending").on("click", function (e) {
        change_distance(false);
    });

    $("#change_tree").on("click", function (e) {
        if(distance == true){
            distance = false;
        }else{
            distance = true;
        }
        update(root);
    });

    $('select[name="label_list"]').change(function() {
        label = $(this).val()
        update(root);

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


    svg = d3.select(div).append("svg")
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
        console.log("update "+label)

        // Compute the new tree layout.
        var nodes = tree.nodes(root),
            links = tree.links(nodes);

        nodes = addLabels(nodes)

console.log(nodes)
        if(distance){
                var yscale = scaleBranchLengths(nodes, width)
            }

        // Update the nodes…
        var node = svg.selectAll("g.node")
            .data(nodes, function (d) {
                return d.id || (d.id = ++i);
            });



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
                if (d.source.highlighted == true || d.source.filtered == true) {
                    return "red"
                } else {
                    return "#ccc";
                }
            })
            .style("stroke-width", "1.5px")
            .attr("d", diagonal)
            .transition()
            .style("stroke", function (d) {
                if (d.source.highlighted == true || d.source.filtered == true) {
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
                if (d.source.highlighted == true || d.source.filtered == true) {
                    return "red"
                } else {
                    return "#ccc";
                }
            })
            .style("stroke-width", "1.5px")

            .attr("d", diagonal)

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", diagonal)
            .remove();


        // Enter any new nodes at the parent's previous position.


        var nodeEnter = node.enter().append("g")
            .attr("class", function(n) {
              if (n.children) {
                if (n.depth == 0) {
                  return "root node"
                } else {
                  return "inner node"
                }
              } else {
                return "leaf node"
              }
            })
            .attr("transform", function (d) {
                return "translate(" + d.y + "," + d.x + ")";
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
            .style("font-size", function (d) {
                return d.children || d._children ? '8px' : '10px';
            })
            .attr("x", function (d) {
                return d.children || d._children ? -6 : 8;
            })
            .attr("dy", function (d) {
                return d.children || d._children ? -6 : 3;
            })
            .attr("text-anchor", function (d) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function (d) {
                return d.children || d._children ? d.annotation : d[label];
            })
            .attr('fill', function (d) {
                return d.children || d._children ? "#ccc" : "black";
            })
            .on('click', function (d, i) {
                return d.children || d._children ? "":pathtoparent(d, i);
            });

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
            .style("fill-opacity", 1)
            .text(function (d) {
                return d.children || d._children ? d.annotation : d[label];
            });

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + source.y + "," + source.x + ")";
            })
            .remove();

        nodeExit.select("circle")
            .attr("r", 1e-6)
            .remove();


        nodeExit.select("text")
            .style("fill-opacity", 1e-6)
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


    //highlight based on click
    function pathtoparent(d, i) {
        if(highlighted_parent != d){

            // Walk parent chain
            var ancestors = [];
            var n_ancestors = [];
            var parent = d;
            highlighted_parent = parent;
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

            animateParentChain(matchedLinks);
        }else{
            d3.selectAll("path")
                .filter(function (d, i) {
                    d.highlighted = false;
                    d.source.highlighted = false;
                    if (!d.filtered || d.filtered == false) {
                        return d;
                    }
                })
                .style("fill", "none")
                .style("stroke", "#ccc");


            d3.selectAll("path")
                .style("fill", "none")
                .style("stroke-width", "1.5px");
 
            highlighted_parent = null;

        }
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
                        // d.source.highlighted = true;
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

//highlight based on filter

    function pathtohighlight(identity) {
        svg.selectAll("circle")
            .style("fill", "none")
        var selected_nodes = d3.selectAll("circle")
            .filter(function (d) {
                if (d.distance <= identity) {
                    d.filtered = true
                    if (d.children) {
                        _.any(d.children, function (p) {
                            p.filtered = true
                        });
                    }
                    return d
                } else if(d.children){
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

    function addLabels(root){
        for(i in root){
            if(root[i].name != ""){
                for(key in labels[root[i].name]){
                    root[i][key] = labels[root[i].name][key]
                }
            } 
        }
        return root
    }