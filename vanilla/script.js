// The svg
let svg = d3.select("svg");
let width = +svg.attr("width");
let height = +svg.attr("height");

// Map and projection
let path = d3.geoPath();
let projection = d3.geoAlbersUsa()
  .scale(1000)
  .translate([width / 2, height / 2]);

// Data and color scale
let data = d3.map();
let colorScale = d3.scaleThreshold()
  .domain([10, 20, 50, 100, 200, 500])
  .range(d3.schemeBlues[7]);

d3.queue()
    .defer(d3.json, "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json")
    .defer(d3.csv, "https://raw.githubusercontent.com/fivethirtyeight/data/master/bad-drivers/bad-drivers.csv", function(d) {
      data.set(d.State, +d["Number of drivers involved in fatal collisions per billion miles"]);
    })
    .await(ready);
  
  function ready(error, topo) {
    if (error) throw error;
  
    // Draw the map
    svg.append("g")
      .selectAll("path")
      .data(topo.features)
      .enter()
      .append("path")
      // draw each state
      .attr("d", d3.geoPath().projection(projection))
      // set the color of each state
      .attr("fill", function(d) {
        d.total = data.get(d.properties.name) || 0;
        return colorScale(d.total);
      });
  }