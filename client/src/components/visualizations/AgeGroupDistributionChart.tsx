import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDataContext } from "@/hooks/useDataContext";
import { ChartType } from "@/types";
import * as d3 from "d3";
import { useD3 } from "@/hooks/useD3";

interface AgeGroupData {
  ageGroup: string;
  count: number;
  percentage: number;
}

export default function AgeGroupDistributionChart() {
  const { filteredData } = useDataContext();
  const [chartType, setChartType] = useState<ChartType>("pie");
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

    // Dimensions
    const width = 500;
    const height = 320;
    const radius = Math.min(width, height) / 2 - 40;

    // Prepare data
    const ageGroups: { [key: string]: number } = {};
    filteredData.forEach(d => {
      if (d.ageGroup) {
        ageGroups[d.ageGroup] = (ageGroups[d.ageGroup] || 0) + 1;
      }
    });

    const data: AgeGroupData[] = Object.entries(ageGroups).map(([ageGroup, count]) => ({
      ageGroup,
      count,
      percentage: (count / filteredData.length) * 100
    })).sort((a, b) => {
      // Sort by age groups in ascending order
      const ageOrder = ["0-20", "21-30", "31-40", "41-65", "66-100"];
      return ageOrder.indexOf(a.ageGroup) - ageOrder.indexOf(b.ageGroup);
    });

    // Color scale
    const color = d3.scaleOrdinal<string>()
      .domain(data.map(d => d.ageGroup))
      .range(["#4F46E5", "#10B981", "#F59E0B", "#DC2626", "#8B5CF6"]);

    // Chart title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text("Age Group Distribution");

    // Create group for the chart
    const g = svg.append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Create pie generator
    const pie = d3.pie<AgeGroupData>()
      .value(d => d.count)
      .sort(null);

    // Create arc generators
    const arc = d3.arc<d3.PieArcDatum<AgeGroupData>>()
      .innerRadius(chartType === "donut" ? radius * 0.5 : 0)
      .outerRadius(radius);

    const labelArc = d3.arc<d3.PieArcDatum<AgeGroupData>>()
      .innerRadius(radius * 0.7)
      .outerRadius(radius * 0.7);

    // Draw pie/donut chart
    const arcs = g.selectAll(".arc")
      .data(pie(data))
      .join("g")
      .attr("class", "arc");

    // Add path with tooltips
    arcs.append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.ageGroup))
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .style("opacity", 0.8)
      .on("mouseover", function(event: any, d) {
        // Highlight the segment
        d3.select(this)
          .style("opacity", 1)
          .attr("stroke-width", 3);
        
        // Calculate additional stats
        const mentalHealthIssuesCount = filteredData
          .filter(record => record.ageGroup === d.data.ageGroup)
          .filter(record => record.soughtTreatment || record.familyHistory === "Yes" || record.disorder).length;
        
        const ageGroupRecords = filteredData.filter(record => record.ageGroup === d.data.ageGroup);
        const mentalHealthPercentage = (mentalHealthIssuesCount / ageGroupRecords.length) * 100;
        
        // Show tooltip
        tooltip
          .style("opacity", 1)
          .html(`
            <div style="font-weight: bold; margin-bottom: 4px;">${d.data.ageGroup} Age Group</div>
            <div>Count: ${d.data.count} respondents</div>
            <div>Percentage: ${d.data.percentage.toFixed(1)}% of total</div>
            <div>Mental health issues: ${mentalHealthPercentage.toFixed(1)}%</div>
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
        // Reset the segment and hide tooltip
        d3.select(this)
          .style("opacity", 0.8)
          .attr("stroke-width", 2);
        tooltip.style("opacity", 0);
      });

    // Add labels
    arcs.append("text")
      .attr("transform", d => {
        const [x, y] = labelArc.centroid(d);
        const labelRadius = radius * 0.75;
        const angle = (d.startAngle + d.endAngle) / 2;
        const labelX = labelRadius * Math.sin(angle);
        const labelY = -labelRadius * Math.cos(angle);
        return `translate(${labelX}, ${labelY})`;
      })
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("fill", d => {
        // Use contrasting text color based on background
        return d.data.percentage > 10 ? "white" : "black";
      })
      .text(d => d.data.ageGroup);

    // Add central text for donut chart
    if (chartType === "donut") {
      g.append("text")
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .text(`${filteredData.length}`);
      
      g.append("text")
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("dy", "1.2em")
        .text("Total");
    }

    // Add legend with clickable interactivity
    const legend = svg.append("g")
      .attr("transform", `translate(20, 20)`)
      .selectAll(".legend")
      .data(data)
      .join("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => `translate(0, ${i * 20})`)
      .style("cursor", "pointer")
      .on("mouseover", function(event: any, d) {
        // Highlight corresponding pie segment
        arcs.selectAll("path")
          .filter((arcData: any) => arcData.data.ageGroup === d.ageGroup)
          .style("opacity", 1)
          .attr("stroke-width", 3);
          
        // Calculate additional stats
        const mentalHealthIssuesCount = filteredData
          .filter(record => record.ageGroup === d.ageGroup)
          .filter(record => record.soughtTreatment || record.familyHistory === "Yes" || record.disorder).length;
        
        const ageGroupRecords = filteredData.filter(record => record.ageGroup === d.ageGroup);
        const mentalHealthPercentage = (mentalHealthIssuesCount / ageGroupRecords.length) * 100;
        
        // Show tooltip
        tooltip
          .style("opacity", 1)
          .html(`
            <div style="font-weight: bold; margin-bottom: 4px;">${d.ageGroup} Age Group</div>
            <div>Count: ${d.count} respondents</div>
            <div>Percentage: ${d.percentage.toFixed(1)}% of total</div>
            <div>Mental health issues: ${mentalHealthPercentage.toFixed(1)}%</div>
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
      .on("mouseleave", function(event: any, d) {
        // Reset pie segment
        arcs.selectAll("path")
          .filter((arcData: any) => arcData.data.ageGroup === d.ageGroup)
          .style("opacity", 0.8)
          .attr("stroke-width", 2);
          
        // Hide tooltip
        tooltip.style("opacity", 0);
      });

    legend.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", d => color(d.ageGroup));

    legend.append("text")
      .attr("x", 20)
      .attr("y", 6)
      .attr("dy", ".35em")
      .attr("font-size", "12px")
      .text(d => `${d.ageGroup} (${Math.round(d.percentage)}%)`);
      
    // Clean up tooltip on refresh/unmount
    return () => {
      tooltip.remove();
    };
  }

  return (
    <Card className="overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-semibold">Age Group Distribution</h3>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant={chartType === "pie" ? "default" : "outline"}
            className={`text-xs px-2 py-1 h-8 ${chartType === "pie" ? "bg-primary" : "bg-gray-100 dark:bg-gray-700"}`}
            onClick={() => setChartType("pie")}
          >
            Pie
          </Button>
          <Button
            size="sm"
            variant={chartType === "donut" ? "default" : "outline"}
            className={`text-xs px-2 py-1 h-8 ${chartType === "donut" ? "bg-primary" : "bg-gray-100 dark:bg-gray-700"}`}
            onClick={() => setChartType("donut")}
          >
            Donut
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
            This chart shows the distribution of respondents across different age groups.
          </p>
          <ul className="list-disc list-inside pl-2 space-y-0.5">
            <li>Hover over pie segments to see detailed information</li>
            <li>Hover over legend items to highlight the corresponding segment</li>
            <li>Toggle between Pie and Donut views using the buttons above</li>
            <li>The legend shows each age group with its percentage of total respondents</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}