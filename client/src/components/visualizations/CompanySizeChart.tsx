import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
        .attr("fill", "#4F46E5");
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
        .attr("fill", "#4F46E5");
    }

    // Data labels
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
          This visualization shows the prevalence of mental health issues across different company sizes. The data suggests that company size may correlate with mental health concerns.
        </p>
      </CardContent>
    </Card>
  );
}
