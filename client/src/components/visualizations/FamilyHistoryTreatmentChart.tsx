import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDataContext } from "@/hooks/useDataContext";
import { ChartType } from "@/types";
import * as d3 from "d3";
import { useD3 } from "@/hooks/useD3";

interface QuadrantData {
  label: string;
  familyHistory: string;
  soughtTreatment: boolean;
  count: number;
}

export default function FamilyHistoryTreatmentChart() {
  const { filteredData } = useDataContext();
  const [chartType, setChartType] = useState<ChartType>("scatter");
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

    // Prepare data structure for the four quadrants
    const quadrantData: QuadrantData[] = [
      { 
        label: "No Family History, No Treatment",
        familyHistory: "No", 
        soughtTreatment: false, 
        count: filteredData.filter(d => d.familyHistory === "No" && !d.soughtTreatment).length 
      },
      { 
        label: "No Family History, Sought Treatment",
        familyHistory: "No", 
        soughtTreatment: true, 
        count: filteredData.filter(d => d.familyHistory === "No" && d.soughtTreatment).length 
      },
      { 
        label: "Family History, No Treatment",
        familyHistory: "Yes", 
        soughtTreatment: false, 
        count: filteredData.filter(d => d.familyHistory === "Yes" && !d.soughtTreatment).length 
      },
      { 
        label: "Family History, Sought Treatment",
        familyHistory: "Yes", 
        soughtTreatment: true, 
        count: filteredData.filter(d => d.familyHistory === "Yes" && d.soughtTreatment).length 
      }
    ];

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Set up X and Y scales
    const x = d3.scaleBand()
      .domain(["No", "Yes"])
      .range([0, innerWidth])
      .padding(0.2);
    
    const y = d3.scaleBand()
      .domain([false, true].map(String))
      .range([innerHeight, 0])
      .padding(0.2);

    // X and Y axes
    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(x).tickFormat(d => `${d}`));
    
    g.append("g")
      .call(d3.axisLeft(y).tickFormat(d => d === "true" ? "Yes" : "No"));

    // X and Y axis labels
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + margin.bottom - 10)
      .attr("text-anchor", "middle")
      .text("Family History of Mental Illness");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 10)
      .attr("x", -innerHeight / 2)
      .attr("text-anchor", "middle")
      .text("Sought Treatment");

    if (chartType === "scatter") {
      // Size scale for bubbles
      const size = d3.scaleSqrt()
        .domain([0, d3.max(quadrantData, d => d.count) || 0])
        .range([5, 50]);

      // Add bubbles
      g.selectAll(".bubble")
        .data(quadrantData)
        .join("circle")
        .attr("class", "bubble")
        .attr("cx", d => (x(d.familyHistory)! + x.bandwidth() / 2))
        .attr("cy", d => (y(String(d.soughtTreatment))! + y.bandwidth() / 2))
        .attr("r", d => size(d.count))
        .attr("fill", "#F59E0B")
        .attr("opacity", 0.6)
        .attr("stroke", "#FFF")
        .attr("stroke-width", 1);

      // Add count labels
      g.selectAll(".count")
        .data(quadrantData)
        .join("text")
        .attr("class", "count")
        .attr("x", d => (x(d.familyHistory)! + x.bandwidth() / 2))
        .attr("y", d => (y(String(d.soughtTreatment))! + y.bandwidth() / 2))
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text(d => d.count);
    } else if (chartType === "heatmap") {
      // Color scale for heatmap
      const color = d3.scaleSequential(d3.interpolateOranges)
        .domain([0, d3.max(quadrantData, d => d.count) || 0]);

      // Add heatmap cells
      g.selectAll(".cell")
        .data(quadrantData)
        .join("rect")
        .attr("class", "cell")
        .attr("x", d => x(d.familyHistory)!)
        .attr("y", d => y(String(d.soughtTreatment))!)
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .attr("fill", d => color(d.count) as string);

      // Add text labels
      g.selectAll(".cell-text")
        .data(quadrantData)
        .join("text")
        .attr("class", "cell-text")
        .attr("x", d => (x(d.familyHistory)! + x.bandwidth() / 2))
        .attr("y", d => (y(String(d.soughtTreatment))! + y.bandwidth() / 2))
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .attr("fill", d => d.count > (d3.max(quadrantData, d => d.count) || 0) / 2 ? "#fff" : "#000")
        .text(d => d.count);
    }

    // Add a title
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", -margin.top / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .text("Relationship between Family History and Treatment");
  }

  return (
    <Card className="overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-semibold">Family History vs. Treatment</h3>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant={chartType === "scatter" ? "default" : "outline"}
            className={`text-xs px-2 py-1 h-8 ${chartType === "scatter" ? "bg-primary" : "bg-gray-100 dark:bg-gray-700"}`}
            onClick={() => setChartType("scatter")}
          >
            Scatter
          </Button>
          <Button
            size="sm"
            variant={chartType === "heatmap" ? "default" : "outline"}
            className={`text-xs px-2 py-1 h-8 ${chartType === "heatmap" ? "bg-primary" : "bg-gray-100 dark:bg-gray-700"}`}
            onClick={() => setChartType("heatmap")}
          >
            Heatmap
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
          This chart explores the relationship between family history of mental illness and whether individuals sought treatment. The size of each circle represents the number of respondents in each category.
        </p>
      </CardContent>
    </Card>
  );
}
