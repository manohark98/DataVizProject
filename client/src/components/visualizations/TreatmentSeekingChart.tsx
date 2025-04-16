import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDataContext } from "@/hooks/useDataContext";
import { ChartType } from "@/types";
import * as d3 from "d3";
import { useD3 } from "@/hooks/useD3";

interface TreatmentData {
  ageGroup: string;
  sought: number;
  notSought: number;
}

export default function TreatmentSeekingChart() {
  const { filteredData } = useDataContext();
  const [chartType, setChartType] = useState<ChartType>("stacked");
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

    // Prepare data
    const ageGroups = ["0-20", "21-30", "31-40", "41-65", "66-100"];
    
    const data: TreatmentData[] = ageGroups.map(ageGroup => {
      const group = filteredData.filter(d => d.ageGroup === ageGroup);
      const sought = group.filter(d => d.soughtTreatment).length;
      const notSought = group.filter(d => !d.soughtTreatment).length;
      
      return {
        ageGroup,
        sought,
        notSought
      };
    }).filter(d => d.sought + d.notSought > 0);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // X scale
    const x = d3.scaleBand()
      .domain(data.map(d => d.ageGroup))
      .range([0, innerWidth])
      .padding(0.2);

    // Y scale (for counts)
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => chartType === "stacked" ? d.sought + d.notSought : Math.max(d.sought, d.notSought)) || 0])
      .nice()
      .range([innerHeight, 0]);

    // X axis
    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("font-size", "12px")
      .attr("text-anchor", "middle");

    // Y axis
    g.append("g")
      .call(d3.axisLeft(y).ticks(5));

    // Y axis label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 10)
      .attr("x", -innerHeight / 2)
      .attr("text-anchor", "middle")
      .text("Number of Respondents");

    // Draw bars
    if (chartType === "stacked") {
      // Stacked bars
      // First the not sought treatment bars (bottom)
      g.selectAll(".bar-not-sought")
        .data(data)
        .join("rect")
        .attr("class", "bar-not-sought")
        .attr("x", d => x(d.ageGroup)!)
        .attr("y", d => y(d.notSought))
        .attr("height", d => innerHeight - y(d.notSought))
        .attr("width", x.bandwidth())
        .attr("fill", "#10B981");

      // Then the sought treatment bars (top)
      g.selectAll(".bar-sought")
        .data(data)
        .join("rect")
        .attr("class", "bar-sought")
        .attr("x", d => x(d.ageGroup)!)
        .attr("y", d => y(d.sought + d.notSought))
        .attr("height", d => y(d.notSought) - y(d.sought + d.notSought))
        .attr("width", x.bandwidth())
        .attr("fill", "#4F46E5");
    } else if (chartType === "grouped") {
      // Grouped bars
      const xSubgroup = d3.scaleBand()
        .domain(["sought", "notSought"])
        .range([0, x.bandwidth()])
        .padding(0.05);

      // Create groups
      const groups = g.selectAll(".group")
        .data(data)
        .join("g")
        .attr("class", "group")
        .attr("transform", d => `translate(${x(d.ageGroup)}, 0)`);

      // Sought treatment bars
      groups.append("rect")
        .attr("class", "bar-sought")
        .attr("x", xSubgroup("sought")!)
        .attr("y", d => y(d.sought))
        .attr("height", d => innerHeight - y(d.sought))
        .attr("width", xSubgroup.bandwidth())
        .attr("fill", "#4F46E5");

      // Not sought treatment bars
      groups.append("rect")
        .attr("class", "bar-not-sought")
        .attr("x", xSubgroup("notSought")!)
        .attr("y", d => y(d.notSought))
        .attr("height", d => innerHeight - y(d.notSought))
        .attr("width", xSubgroup.bandwidth())
        .attr("fill", "#10B981");
    }

    // Add a title
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", -margin.top / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .text("Treatment-Seeking Behavior by Age Group");

    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 160}, 20)`);

    // Sought treatment
    legend.append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", "#4F46E5");

    legend.append("text")
      .attr("x", 25)
      .attr("y", 7.5)
      .attr("dy", ".35em")
      .attr("font-size", "12px")
      .text("Sought Treatment");

    // Not sought treatment
    legend.append("rect")
      .attr("y", 20)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", "#10B981");

    legend.append("text")
      .attr("x", 25)
      .attr("y", 27.5)
      .attr("dy", ".35em")
      .attr("font-size", "12px")
      .text("Did Not Seek Treatment");
  }

  return (
    <Card className="overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-semibold">Treatment-Seeking Behavior</h3>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant={chartType === "stacked" ? "default" : "outline"}
            className={`text-xs px-2 py-1 h-8 ${chartType === "stacked" ? "bg-primary" : "bg-gray-100 dark:bg-gray-700"}`}
            onClick={() => setChartType("stacked")}
          >
            Stacked
          </Button>
          <Button
            size="sm"
            variant={chartType === "grouped" ? "default" : "outline"}
            className={`text-xs px-2 py-1 h-8 ${chartType === "grouped" ? "bg-primary" : "bg-gray-100 dark:bg-gray-700"}`}
            onClick={() => setChartType("grouped")}
          >
            Grouped
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
          This chart shows treatment-seeking behavior across different age groups. The data indicates that treatment-seeking behavior varies significantly by age.
        </p>
      </CardContent>
    </Card>
  );
}
