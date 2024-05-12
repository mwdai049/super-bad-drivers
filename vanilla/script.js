// The svg
let svg = d3.select("svg");
let width = +svg.attr("width");
let height = +svg.attr("height");

let barChartSvg = d3.select("svg#bar_chart");
let barChartWidth = +barChartSvg.attr("width");
let barChartHeight = +barChartSvg.attr("height");

// Margins for the bar chart
let margin = { top: 30, right: 30, bottom: 70, left: 60 },
    chartWidth = barChartWidth - margin.left - margin.right,
    chartHeight = barChartHeight - margin.top - margin.bottom;

let barChart = barChartSvg.append("g")
.attr("transform", "translate(" + margin.left + "," + margin.top + ")");


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

let tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0)
  .style("position", "absolute");

d3.queue()
    .defer(d3.json, "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json")
    .defer(d3.csv, "https://raw.githubusercontent.com/fivethirtyeight/data/master/bad-drivers/bad-drivers.csv", function(d) {
      data.set(d.State, {
        rate: +d["Number of drivers involved in fatal collisions per billion miles"],
        speeding: +d["Percentage Of Drivers Involved In Fatal Collisions Who Were Speeding"],
        alcohol: +d["Percentage Of Drivers Involved In Fatal Collisions Who Were Alcohol-Impaired"],
        distracted: +d["Percentage Of Drivers Involved In Fatal Collisions Who Were Not Distracted"],
        previous: +d["Percentage Of Drivers Involved In Fatal Collisions Who Had Not Been Involved In Any Previous Accidents"]
      });
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
      d.total = data.get(d.properties.name)?.rate || 0;
      return colorScale(d.total);
    })

    .on("mouseover", function(d) {
      d3.select(this).style("fill", "gray");
      tooltip.transition()
              .duration(200)
              .style("opacity", .9);
          tooltip.html(d.properties.name)  // tooltip displayed info
              .style("left", (d3.event.pageX + 10) + "px")
              .style("top", (d3.event.pageY - 28) + "px");
    })
    
    .on("mouseout", function(d) {
      d3.select(this).style("fill", colorScale(d.total));
      tooltip.transition()
              .duration(200)
              .style("opacity", 0);
    })
    .on("click", function(d) {
      let stateData = data.get(d.properties.name);
      if (stateData) {
        updateBarChart(stateData);
        console.log(stateData)
      }
    });

    // Initialize the bar chart
    let x = d3.scaleBand().range([0, chartWidth]).padding(0.2);
    let y = d3.scaleLinear().range([chartHeight, 0]);
  
    barChart.append("g")
      .attr("class", "x-axis")
      .attr("transform", "translate(0," + chartHeight + ")");
  
    barChart.append("g")
      .attr("class", "y-axis");
  
    function updateBarChart(stateData) {
      let causes = [
        { cause: "Speeding", value: stateData.speeding },
        { cause: "Alcohol-Impaired", value: stateData.alcohol },
        { cause: "Not Distracted", value: stateData.distracted },
        { cause: "No Previous Accidents", value: stateData.previous }
      ];
      
      x.domain(causes.map(d => d.cause));
      y.domain([0, d3.max(causes, d => d.value)]);
  
      // X-axis
      barChart.select(".x-axis")
        .call(d3.axisBottom(x))
        .selectAll("text")
          .attr("transform", "translate(-10,0)rotate(-45)")
          .style("text-anchor", "end");
  
      // Y-axis
      barChart.select(".y-axis")
        .call(d3.axisLeft(y));
  
      let bars = barChart.selectAll(".bar")
        .data(causes);
  
      // Bars
      bars.enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.cause))
        .attr("y", d => y(d.value))
        .attr("width", x.bandwidth())
        .attr("height", d => chartHeight - y(d.value))
        .attr("fill", "#69b3a2");
  
      bars.transition()
        .duration(500)
        .attr("x", d => x(d.cause))
        .attr("y", d => y(d.value))
        .attr("width", x.bandwidth())
        .attr("height", d => chartHeight - y(d.value));
  
      bars.exit().remove();
}
  }