// The svg
let svg = d3.select("svg");
let width = +svg.attr("width");
let height = +svg.attr("height");

let barChartSvg = d3.select("svg#bar_chart");
let barChartWidth = +barChartSvg.attr("width");
let barChartHeight = +barChartSvg.attr("height");

// Margins for the bar chart
let margin = { top: 80, right: 30, bottom: 110, left: 60 },
    chartWidth = barChartWidth - margin.left - margin.right,
    chartHeight = barChartHeight - margin.top - margin.bottom;

let barChart = barChartSvg.append("g")
.attr("transform", "translate(" + margin.left + "," + margin.top + ")");


// Map and projection
let path = d3.geoPath();
let projection = d3.geoAlbersUsa()
  .scale(1150)
  .translate([width / 2, height / 2 - 70]);

// Data and color scale
let data = d3.map();
let colorScale = d3.scaleLinear()
  .domain([0, 25])
  .range(["#EEF7FF", "#4D869C"]);

// Tooltip
let tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0)
  .style("position", "absolute");

// Fetch data
d3.queue()
    .defer(d3.json, "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json")
    .defer(d3.csv, "https://raw.githubusercontent.com/fivethirtyeight/data/master/bad-drivers/bad-drivers.csv", function(d) {
      data.set(d.State, {
        rate: +d["Number of drivers involved in fatal collisions per billion miles"],
        speeding: +d["Percentage Of Drivers Involved In Fatal Collisions Who Were Speeding"],
        alcohol: +d["Percentage Of Drivers Involved In Fatal Collisions Who Were Alcohol-Impaired"],
        distracted: 100 - +d["Percentage Of Drivers Involved In Fatal Collisions Who Were Not Distracted"],
        previous: 100 - +d["Percentage Of Drivers Involved In Fatal Collisions Who Had Not Been Involved In Any Previous Accidents"]
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
    .style("stroke", "white") // white border color
    .style("stroke-width", 0.5) // border width
    .style("stroke-opacity", 0.7) // border opacity

  // Mouseover event
  .on("mouseover", function(d) {
    let stateData = data.get(d.properties.name);
    d3.select(this).style("fill", "LightSlateGray");
    tooltip.transition()
            .duration(200)
            .style("opacity", .9);
        tooltip.html(d.properties.name + "<br>" + stateData.rate + " drivers involved in fatal collisions per billion miles")
            .style("left", (d3.event.pageX + 10) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
  })
  
  // Mouseout event
  .on("mouseout", function(d) {
    d3.select(this).style("fill", colorScale(d.total));
    tooltip.transition()
            .duration(200)
            .style("opacity", 0);
  })

  // Mouseclick event
  .on("click", function(d) {
    let stateData = data.get(d.properties.name);
    if (stateData) {
      showPopupNote();
      updateBarChart(stateData, d.properties.name);
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

  // X-axis label
  barChart.append("text")
  .attr("class", "x-axis-label")
  .attr("text-anchor", "middle")
  .attr("x", chartWidth / 2)
  .attr("y", chartHeight + margin.bottom - 2)
  .text("Causes of Fatal Collisions");

  // Y-axis label
  let yAxisLabel = barChart.append("text")
    .attr("class", "y-axis-label")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -chartHeight / 2)
    .attr("y", -margin.left + 15)
    .text("Percentage of Drivers in Fatal Collisions");

  // Bar chart title
  let barChartTitle = barChartSvg.append("text")
    .attr("class", "bar-chart-title")
    .attr("text-anchor", "middle")
    .attr("x", margin.left + chartWidth / 2)
    .attr("y", margin.top / 3)
    .attr("font-size", "16px")
    .attr("font-weight", "bold");

  function updateBarChart(stateData, stateName) {
    let causes = [
      { cause: "Speeding", value: stateData.speeding },
      { cause: "Alcohol-Impaired", value: stateData.alcohol },
      { cause: "Distracted", value: stateData.distracted },
      { cause: "Had Previous Accidents", value: stateData.previous }
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
    
    barChartTitle.text("Causes of Fatal Collisions in " + stateName);

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

    // Append value numbers on top of each bar
    let labels = barChart.selectAll(".label")
          .data(causes);

    labels.enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => x(d.cause) + x.bandwidth() / 2)
        .attr("y", d => y(d.value) - 5)
        .attr("text-anchor", "middle")
        .text(d => d.value);

    labels.transition()
        .duration(500)
        .attr("x", d => x(d.cause) + x.bandwidth() / 2)
        .attr("y", d => y(d.value) - 5)
        .attr("text-anchor", "middle")
        .text(d => d.value);

    labels.exit().remove();
  }
}

function showPopupNote() {
  d3.select("#popup-note").classed("hidden", false);

  // Hide popup note when clicking outside of it
  d3.select("body").on("click", function(event) {
      if (!d3.select(event.target).closest("#popup-note").node() &&
          !d3.select(event.target).closest("path").node()) {
          d3.select("#popup-note").classed("hidden", true);
      }
  });
}

//Append a defs (for definition) element to your SVG
var defs = svg.append("defs");

//Append a linearGradient element to the defs and give it a unique id
var linearGradient = defs.append("linearGradient")
    .attr("id", "linear-gradient");

linearGradient
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "0%");

//Set the color for the start (0%)
linearGradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#EEF7FF"); //light blue

//Set the color for the end (100%)
linearGradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#4D869C"); //dark blue

//Draw the rectangle and fill with gradient
svg.append("rect")
    .attr("width", 600)
    .attr("height", 20)
    .style("fill", "url(#linear-gradient)")
    .attr("transform", "translate(200, 575)");

// Append text labels
svg.append("text")
    .attr("x", 200) 
    .attr("y", 565)
    .attr("text-anchor", "left") 
    .text("Number of drivers involved in fatal collisions per billion miles"); 

svg.append("text")
    .attr("x", 200) 
    .attr("y", 615)
    .attr("text-anchor", "middle")
    .text("0"); 

svg.append("text")
    .attr("x", 800)
    .attr("y", 615)
    .attr("text-anchor", "middle")
    .text("25"); 