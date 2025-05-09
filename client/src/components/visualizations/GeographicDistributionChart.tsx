import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDataContext } from "@/hooks/useDataContext";
import { ChartType } from "@/types";
import * as d3 from "d3";
import { useD3 } from "@/hooks/useD3";

interface LocationCount {
  location: string;
  count: number;
}

export default function GeographicDistributionChart() {
  const { filteredData } = useDataContext();
  const [chartType, setChartType] = useState<ChartType>("map");
  const svgRef = useD3(renderChart, [filteredData, chartType]);

  function renderChart(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) {
    if (!filteredData || filteredData.length === 0) {
      svg.selectAll("*").remove();
      svg.append("text")
        .attr("x", "50%")
        .attr("y", "50%")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .text("No data available");
      return;
    }

    // Clear previous chart and create tooltip
    svg.selectAll("*").remove();
    
    // Create tooltip
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "chart-tooltip")
      .style("position", "absolute")
      .style("background", "white")
      .style("border", "1px solid #ddd")
      .style("border-radius", "4px")
      .style("padding", "10px")
      .style("box-shadow", "2px 2px 6px rgba(0, 0, 0, 0.28)")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", 1000);

    // Count records by location
    const locationCounts: { [key: string]: number } = {};
    filteredData.forEach(d => {
      if (d.location) {
        locationCounts[d.location] = (locationCounts[d.location] || 0) + 1;
      }
    });

    // Convert to array and sort
    const data = Object.entries(locationCounts)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count);

    // Dimensions
    const width = 500;
    const height = 320;
    const margin = { top: 40, right: 30, bottom: 70, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    if (chartType === "bar") {
      // Display top 10 locations as a bar chart
      const top10 = data.slice(0, 10);

      // X scale (for bar heights)
      const x = d3.scaleLinear()
        .domain([0, d3.max(top10, d => d.count) || 0])
        .range([0, innerWidth]);

      // Y scale (for country names)
      const y = d3.scaleBand()
        .domain(top10.map(d => d.location))
        .range([0, innerHeight])
        .padding(0.1);

      // Y axis (country names)
      g.append("g")
        .call(d3.axisLeft(y));

      // X axis (counts)
      g.append("g")
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(d3.axisBottom(x).ticks(5));

      // X axis label
      g.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .text("Number of Respondents");
        
      // Chart title
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .text("Top 10 Locations of Respondents");

      // Bars with tooltips
      g.selectAll(".bar")
        .data(top10)
        .join("rect")
        .attr("class", "bar")
        .attr("y", d => y(d.location)!)
        .attr("x", 0)
        .attr("height", y.bandwidth())
        .attr("width", d => x(d.count))
        .attr("fill", "#4F46E5")
        .style("opacity", 0.8)
        .on("mouseover", function(event: any, d) {
          // Highlight the bar
          d3.select(this).style("opacity", 1);
          
          // Calculate percentage
          const totalResponses = filteredData.length;
          const percentage = (d.count / totalResponses) * 100;
          
          // Show tooltip
          tooltip
            .style("opacity", 1)
            .html(`
              <div style="font-weight: bold; margin-bottom: 4px;">${d.location}</div>
              <div>Respondents: ${d.count}</div>
              <div>Percentage: ${percentage.toFixed(1)}% of total</div>
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mousemove", function(event: any) {
          // Update tooltip position when moving
          tooltip
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseleave", function() {
          // Reset the bar and hide tooltip
          d3.select(this).style("opacity", 0.8);
          tooltip.style("opacity", 0);
        });

      // Data labels
      g.selectAll(".label")
        .data(top10)
        .join("text")
        .attr("class", "label")
        .attr("x", d => x(d.count) + 5)
        .attr("y", d => (y(d.location)! + y.bandwidth() / 2))
        .attr("dy", ".35em")
        .attr("font-size", "10px")
        .text(d => d.count);
    } else if (chartType === "map") {
      // Simplified world map visualization
      // Since we can't load TopoJSON data directly, we'll create a bubble map
      // with a simplified representation

      // Title
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .text("Geographic Distribution of Respondents");

      // Create a color scale
      const color = d3.scaleSequential(d3.interpolateBlues)
        .domain([0, d3.max(data, d => d.count) || 0]);

      // Create a size scale for bubbles
      const size = d3.scaleSqrt()
        .domain([0, d3.max(data, d => d.count) || 0])
        .range([5, 30]);

      // Assign fixed coordinates for top countries
      // In a real application, you'd use a proper geographic projection
      const commonLocations: { [key: string]: [number, number] } = {
        "USA": [innerWidth / 3, innerHeight / 2],
        "Canada": [innerWidth / 3, innerHeight / 3],
        "United Kingdom": [innerWidth / 2, innerHeight / 3],
        "Germany": [innerWidth / 2, innerHeight / 2],
        "Australia": [innerWidth * 2/3, innerHeight * 2/3],
        "India": [innerWidth * 2/3, innerHeight / 2],
        "Brazil": [innerWidth / 3, innerHeight * 2/3],
        "France": [innerWidth / 2, innerHeight / 2.5],
        "Russia": [innerWidth * 2/3, innerHeight / 3],
        "Japan": [innerWidth * 3/4, innerHeight / 2],
      };

      // For countries not in our fixed list, distribute them randomly
      const randomPositions = new Map<string, [number, number]>();
      data.forEach(d => {
        if (!commonLocations[d.location]) {
          randomPositions.set(d.location, [
            Math.random() * innerWidth,
            Math.random() * innerHeight
          ]);
        }
      });

      // Draw bubbles with tooltips
      g.selectAll(".bubble")
        .data(data)
        .join("circle")
        .attr("class", "bubble")
        .attr("cx", d => commonLocations[d.location]?.[0] || randomPositions.get(d.location)![0])
        .attr("cy", d => commonLocations[d.location]?.[1] || randomPositions.get(d.location)![1])
        .attr("r", d => size(d.count))
        .attr("fill", d => color(d.count) as string)
        .attr("stroke", "#FFF")
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.7)
        .on("mouseover", function(event: any, d) {
          // Highlight the bubble
          d3.select(this)
            .style("opacity", 1)
            .attr("stroke-width", 2);
          
          // Calculate percentage
          const totalResponses = filteredData.length;
          const percentage = (d.count / totalResponses) * 100;
          
          // Show tooltip
          tooltip
            .style("opacity", 1)
            .html(`
              <div style="font-weight: bold; margin-bottom: 4px;">${d.location}</div>
              <div>Respondents: ${d.count}</div>
              <div>Percentage: ${percentage.toFixed(1)}% of total</div>
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mousemove", function(event: any) {
          // Update tooltip position when moving
          tooltip
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseleave", function() {
          // Reset the bubble and hide tooltip
          d3.select(this)
            .style("opacity", 0.7)
            .attr("stroke-width", 0.5);
          tooltip.style("opacity", 0);
        });

      // Add country labels for top countries
      g.selectAll(".country-label")
        .data(data.filter(d => d.count > (d3.max(data, d => d.count) || 0) / 10))
        .join("text")
        .attr("class", "country-label")
        .attr("x", d => (commonLocations[d.location]?.[0] || randomPositions.get(d.location)![0]))
        .attr("y", d => (commonLocations[d.location]?.[1] || randomPositions.get(d.location)![1]) - size(d.count) - 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "9px")
        .text(d => d.location);

      // Add legend
      const legendData = [
        d3.max(data, d => d.count) || 0,
        (d3.max(data, d => d.count) || 0) / 2,
        (d3.max(data, d => d.count) || 0) / 5
      ];

      const legend = g.append("g")
        .attr("transform", `translate(${innerWidth - 100}, ${innerHeight - 80})`);

      legend.selectAll(".legend-bubble")
        .data(legendData)
        .join("circle")
        .attr("class", "legend-bubble")
        .attr("cx", 0)
        .attr("cy", (d, i) => i * 25)
        .attr("r", d => size(d))
        .attr("fill", d => color(d) as string)
        .attr("stroke", "#FFF")
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.7);

      legend.selectAll(".legend-label")
        .data(legendData)
        .join("text")
        .attr("class", "legend-label")
        .attr("x", 40)
        .attr("y", (d, i) => i * 25 + 5)
        .attr("font-size", "10px")
        .text(d => `${Math.round(d)} respondents`);
    }
    
    // Clean up tooltip on refresh/unmount
    return () => {
      tooltip.remove();
    };
  }

  return (
    <Card className="overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-semibold">Geographic Distribution</h3>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant={chartType === "map" ? "default" : "outline"}
            className={`text-xs px-2 py-1 h-8 ${chartType === "map" ? "bg-primary" : "bg-gray-100 dark:bg-gray-700"}`}
            onClick={() => setChartType("map")}
          >
            Map
          </Button>
          <Button
            size="sm"
            variant={chartType === "bar" ? "default" : "outline"}
            className={`text-xs px-2 py-1 h-8 ${chartType === "bar" ? "bg-primary" : "bg-gray-100 dark:bg-gray-700"}`}
            onClick={() => setChartType("bar")}
          >
            Top 10
          </Button>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="h-80">
          <svg
            ref={svgRef}
            style={{ width: "100%", height: "100%" }}
            viewBox="0 0 500 320"
            preserveAspectRatio="xMidYMid meet"
          />
        </div>
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>
            This visualization shows the geographic distribution of survey respondents.
          </p>
          <ul className="list-disc list-inside pl-2 space-y-0.5">
            <li>The bubble size represents the number of respondents from each location</li>
            <li>Hover over bubbles or bars to see detailed information</li>
            <li>Toggle between Map and Top 10 views using the buttons above</li>
            <li>In Map view, larger and darker bubbles indicate more responses</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}