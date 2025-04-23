import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useDataContext } from "@/hooks/useDataContext";
import { ChartType } from "@/types";
import * as d3 from "d3";
import { useD3 } from "@/hooks/useD3";

interface CompanySizeData {
  size: string;
  mentalHealthIssues: number;
  totalCount: number;
}

export default function CompanySizeChart() {
  const { filteredData } = useDataContext();
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [showCounts, setShowCounts] = useState<boolean>(false);
  const svgRef = useD3(renderChart, [filteredData, chartType, showCounts]);

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

    // Dimensions
    const width = 500;
    const height = 320;
    const margin = { top: 40, right: 30, bottom: 70, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Group data by company size
    const companySizes = ["1-5", "6-25", "26-100", "100-500", "500-1000", "More than 1000"];
    
    const dataBySize = companySizes.map(size => {
      const records = filteredData.filter(d => d.companySize === size);
      const mentalHealthIssues = records.filter(d => d.soughtTreatment || d.familyHistory === "Yes" || d.disorder).length;
      
      return {
        size,
        mentalHealthIssues: records.length > 0 ? (mentalHealthIssues / records.length) * 100 : 0,
        totalCount: records.length
      };
    }).filter(d => d.totalCount > 0);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // X scale
    const x = d3.scaleBand()
      .domain(dataBySize.map(d => d.size))
      .range([0, innerWidth])
      .padding(0.3);

    // Y scale
    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([innerHeight, 0]);

    // X axis
    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-25)")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em");

    // Y axis
    g.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`));

    // Y axis label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 10)
      .attr("x", -innerHeight / 2)
      .attr("text-anchor", "middle")
      .text("Percentage with Mental Health Issues");

    if (chartType === "bar") {
      // Bar chart
      g.selectAll(".bar")
        .data(dataBySize)
        .join("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.size)!)
        .attr("y", d => y(d.mentalHealthIssues))
        .attr("width", x.bandwidth())
        .attr("height", d => innerHeight - y(d.mentalHealthIssues))
        .attr("fill", "#4F46E5")
        .style("opacity", 0.8)
        .on("mouseover", function(event: any, d) {
          // Highlight the bar
          d3.select(this).style("opacity", 1);
          
          // Calculate exact count
          const mentalHealthCount = Math.round(d.mentalHealthIssues * d.totalCount / 100);
          
          // Show tooltip
          tooltip
            .style("opacity", 1)
            .html(`
              <div style="font-weight: bold; margin-bottom: 4px;">${d.size} Companies</div>
              <div>Percentage: ${d.mentalHealthIssues.toFixed(1)}%</div>
              <div>Count: ${mentalHealthCount} of ${d.totalCount}</div>
              <div style="font-size: 0.8em; color: #777; margin-top: 4px;">Employees reporting mental health issues</div>
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
    } else if (chartType === "line") {
      // Line chart
      const line = d3.line<CompanySizeData>()
        .x(d => (x(d.size)! + x.bandwidth() / 2))
        .y(d => y(d.mentalHealthIssues))
        .curve(d3.curveMonotoneX);

      g.append("path")
        .datum(dataBySize)
        .attr("fill", "none")
        .attr("stroke", "#4F46E5")
        .attr("stroke-width", 3)
        .attr("d", line);

      g.selectAll(".dot")
        .data(dataBySize)
        .join("circle")
        .attr("class", "dot")
        .attr("cx", d => (x(d.size)! + x.bandwidth() / 2))
        .attr("cy", d => y(d.mentalHealthIssues))
        .attr("r", 5)
        .attr("fill", "#4F46E5")
        .style("opacity", 0.8)
        .on("mouseover", function(event: any, d) {
          // Highlight the dot
          d3.select(this)
            .style("opacity", 1)
            .attr("r", 7);
          
          // Calculate exact count
          const mentalHealthCount = Math.round(d.mentalHealthIssues * d.totalCount / 100);
          
          // Show tooltip
          tooltip
            .style("opacity", 1)
            .html(`
              <div style="font-weight: bold; margin-bottom: 4px;">${d.size} Companies</div>
              <div>Percentage: ${d.mentalHealthIssues.toFixed(1)}%</div>
              <div>Count: ${mentalHealthCount} of ${d.totalCount}</div>
              <div style="font-size: 0.8em; color: #777; margin-top: 4px;">Employees reporting mental health issues</div>
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
          // Reset the dot and hide tooltip
          d3.select(this)
            .style("opacity", 0.8)
            .attr("r", 5);
          tooltip.style("opacity", 0);
        });
    }
    
    // Data labels (only show if option is enabled)
    if (showCounts) {
      g.selectAll(".label")
        .data(dataBySize)
        .join("text")
        .attr("class", "label")
        .attr("x", d => (x(d.size)! + x.bandwidth() / 2))
        .attr("y", d => y(d.mentalHealthIssues) - 10)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .text(d => {
          const count = Math.round(d.mentalHealthIssues * d.totalCount / 100);
          return `${Math.round(d.mentalHealthIssues)}% (${count})`;
        });
    } else {
      g.selectAll(".label")
        .data(dataBySize)
        .join("text")
        .attr("class", "label")
        .attr("x", d => (x(d.size)! + x.bandwidth() / 2))
        .attr("y", d => y(d.mentalHealthIssues) - 10)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .text(d => `${Math.round(d.mentalHealthIssues)}%`);
    }
    
    // Chart Title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text("Mental Health Issues by Company Size");
      
    // Clean up tooltip on refresh/unmount
    return () => {
      tooltip.remove();
    };
  }

  return (
    <Card className="overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-semibold">Mental Health Issues by Company Size</h3>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant={chartType === "bar" ? "default" : "outline"}
            className={`text-xs px-2 py-1 h-8 ${chartType === "bar" ? "bg-primary" : "bg-gray-100 dark:bg-gray-700"}`}
            onClick={() => setChartType("bar")}
          >
            Bar
          </Button>
          <Button
            size="sm"
            variant={chartType === "line" ? "default" : "outline"}
            className={`text-xs px-2 py-1 h-8 ${chartType === "line" ? "bg-primary" : "bg-gray-100 dark:bg-gray-700"}`}
            onClick={() => setChartType("line")}
          >
            Line
          </Button>
        </div>
      </div>
      <CardContent className="p-4 relative">
        {/* Display options */}
        <div className="flex items-center justify-end mb-2 space-x-2">
          <Label htmlFor="show-counts" className="text-xs">Show counts</Label>
          <Switch
            id="show-counts"
            checked={showCounts}
            onCheckedChange={setShowCounts}
            className="scale-75 origin-right"
          />
        </div>
        
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
            This visualization shows the prevalence of mental health issues across different company sizes. 
            The data suggests that company size may correlate with mental health concerns.
          </p>
          <ul className="list-disc list-inside pl-2 space-y-0.5">
            <li>Percentages are displayed directly on the chart</li>
            <li>Hover over bars or points to see detailed information</li>
            <li>Toggle between bar and line views using the buttons above</li>
            <li>Enable "Show counts" to display exact numbers on the chart</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}