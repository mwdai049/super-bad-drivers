<script>
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import { feature } from "topojson-client";

  onMount(async () => {
    const svg = d3
      .select("#viz")
      .append("svg")
      .attr("width", 1000)
      .attr("height", 800);

    const us = await d3.json("https://d3js.org/us-10m.v2.json");
    const data = feature(us, us.objects.states).features;
    const path = d3.geoPath();
    // const projection = d3
    //   .geoAlbersUsa()
    //   .translate([width / 2, height / 2]) // translate to center of screen
    //   .scale([1000]);

    // US map
    svg
      .append("g")
      .selectAll("path")
      .data(data)
      .enter()
      .append("path")
      .attr("fill", "#ccc")
      .attr("d", path);

    // Car
    const car = svg
      .append("rect")
      .attr("width", 50)
      .attr("height", 20)
      .attr("x", 10)
      .attr("y", 100)
      .attr("fill", "blue");

    // Person
    const person = svg
      .append("circle")
      .attr("cx", 300)
      .attr("cy", 100)
      .attr("r", 10)
      .attr("fill", "red");

    car
      .transition()
      .duration(2000)
      .attr("x", 290)
      .on("start", function () {
        d3.timeout(() => {
          person
            .transition()
            .ease(d3.easeExpIn)
            .duration(500)
            .attr("cx", 600)
            .attr("cy", 50);
        }, 1080);
      });
  });
</script>

<div id="viz"></div>

<style>
  path {
    fill: #fff;
    stroke: #000;
  }
</style>
