/*** to define the style */
var template = {
    width: 1000,
    height:1000,
    margin:20,
    json: 'world_country.json',
    csv: 'All_Starbucks_Locations_in_the_World_-_Heat_Map.csv',
};

const debug = true;
// const debug = false;

(function (data) {
    var $graph = d3
        .select('#chart')
        .append('svg')
        .attr('width', data.width)
        .attr('height', data.height)
        .append('g');
    var projection = d3.geoMercator()
        .scale(150)
        .translate([data.width / 2, data.height / Math.PI]);
    var path ;
    // = d3.geoPath().projection(projection);

    function toZoom() {
         var mapZoom = d3.zoom()
             .on("zoom", zoomed);

         var zoomSettings = d3.zoomIdentity
             .translate(data.width / 2, data.height / Math.PI)
             .scale(150);

         $graph.call(mapZoom).call(mapZoom.transform, zoomSettings);
         console.log('...');
      }
    function zoomed() {
        var e = d3.event;
        projection.translate([e.transform.x,e.transform.y])
            .scale(e.transform.k);
       updateGraph();
    }
    function loadJson(file) {
        return new Promise((resolve, reject) => {
            d3.json(file, function (error, data) {
                if (error) {
                    reject(error);
                } else {
                    resolve(data);
                }
            });
        });
    }

    function loadData(file) {
        return new Promise((resolve, reject) => {
            d3.csv(file, function (error, data) {
                if (error) {
                    reject(error);
                } else {
                    resolve(data);
                }
            });
        });
    }

    function renderPath(map_) {
        $graph.selectAll('path')
            // .data(map_.features)
            .data(topojson.feature(map_, map_.objects.countries).features)
            .enter()
            .append('path')
            .attr("d",path)
            .attr('fill', 'rgb(15, 26, 88)')
            .style("stroke", "#000");
    }

    function renderPoints(points) {
        $graph.selectAll("circle")
            .data(points)
            .enter()
            .append("circle")
            .attr("cx",(d) => projection([d.Longitude, d.Latitude])[0])
            .attr("cy", (d) => projection([d.Longitude, d.Latitude])[1])
            .attr("r",.75)
            .style("fill",'rgb(250,250,250)')
            .style("stroke", "rgb(255,255,255)")
            .style("stroke-width", 0.25)
                //  .style("opacity", 0.75)
    }

    function dragging() {
        var offset = projection.translate();

        offset[0] += d3.event.dx;
        offset[1] += d3.event.dy;

        projection.translate(offset);

        updateGraph();

    }

    function  updateGraph() {
         $graph.selectAll("path").attr("d", path);
         $graph.selectAll("circle")
             .attr("cx", (d) => projection([d.Longitude, d.Latitude])[0])
             .attr("cy", (d) => projection([d.Longitude, d.Latitude])[1])
    }

    loadJson(data.json)
        .then(map_data => {
            path = d3.geoPath()
                .projection(projection
                    // .fitExtent([[20, 20], [1000, 1000]], map_data)
                );
            renderPath(map_data);
            loadData(data.csv)
                .then(parsed_data => {
                    renderPoints(parsed_data)
                    // console.log(parsed_data);

                    // zoom
                      var mapZoom = d3.zoom()
                          .on("zoom", zoomed);

                      var zoomSettings = d3.zoomIdentity
                          .translate(data.width / 2, data.height / Math.PI)
                          .scale(150);

                      $graph.call(mapZoom).call(mapZoom.transform, zoomSettings);

                    //drag
                    var drag = d3.drag()
                        .on("drag",dragging);
                    $graph.select("g").call(drag);
                })
                .catch(error=>{
                    console.log(error);
                })
            // console.log(map_data);
        })
        .catch(error => {
            console.log(error);
        });
})(template);
