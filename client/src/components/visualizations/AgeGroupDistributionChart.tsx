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

    // Clear previous chart
    svg.selectAll("*").remove();

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

    arcs.append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.ageGroup))
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .style("opacity", 0.8);

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

    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(20, 20)`)
      .selectAll(".legend")
      .data(data)
      .join("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => `translate(0, ${i * 20})`);

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
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          This chart shows the distribution of respondents across different age groups. The majority of respondents fall within the 21-30 and 31-40 age ranges.
        </p>
      </CardContent>
    </Card>
  );
}
