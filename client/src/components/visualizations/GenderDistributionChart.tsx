import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDataContext } from "@/hooks/useDataContext";
import { ChartType } from "@/types";
import * as d3 from "d3";
import { useD3 } from "@/hooks/useD3";

interface GenderFactorData {
  factor: string;
  male: number;
  female: number;
  undecided: number;
}

export default function GenderDistributionChart() {
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
    const margin = { top: 40, right: 30, bottom: 60, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Process data by gender
    const male = filteredData.filter(d => d.gender === "Male");
    const female = filteredData.filter(d => d.gender === "Female");
    const undecided = filteredData.filter(d => d.gender === "Undecided");

    const data: GenderFactorData[] = [
      {
        factor: "Sought Treatment",
        male: male.filter(d => d.soughtTreatment).length / (male.length || 1) * 100,
        female: female.filter(d => d.soughtTreatment).length / (female.length || 1) * 100,
        undecided: undecided.filter(d => d.soughtTreatment).length / (undecided.length || 1) * 100
      },
      {
        factor: "Family History",
        male: male.filter(d => d.familyHistory === "Yes").length / (male.length || 1) * 100,
        female: female.filter(d => d.familyHistory === "Yes").length / (female.length || 1) * 100,
        undecided: undecided.filter(d => d.familyHistory === "Yes").length / (undecided.length || 1) * 100
      },
      {
        factor: "Prefer Anonymity",
        male: male.filter(d => d.preferAnonymity).length / (male.length || 1) * 100,
        female: female.filter(d => d.preferAnonymity).length / (female.length || 1) * 100,
        undecided: undecided.filter(d => d.preferAnonymity).length / (undecided.length || 1) * 100
      },
    ];

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // X scale
    const x0 = d3.scaleBand()
      .domain(data.map(d => d.factor))
      .rangeRound([0, innerWidth])
      .paddingInner(0.1);

    // Only used for grouped bars
    const x1 = d3.scaleBand()
      .domain(['male', 'female', 'undecided'])
      .rangeRound([0, x0.bandwidth()])
      .padding(0.05);

    // Y scale
    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([innerHeight, 0]);

    // Color scale
    const color = d3.scaleOrdinal()
      .domain(['male', 'female', 'undecided'])
      .range(['#10B981', '#4F46E5', '#F59E0B']);

    // X axis
    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(x0))
      .selectAll("text")
      .style("text-anchor", "middle");

    // Y axis
    g.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`));

    // Y axis label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 10)
      .attr("x", -innerHeight / 2)
      .attr("text-anchor", "middle")
      .text("Percentage");

    if (chartType === "bar") {
      // Grouped bar chart
      g.append("g")
        .selectAll("g")
        .data(data)
        .join("g")
        .attr("transform", d => `translate(${x0(d.factor)}, 0)`)
        .selectAll("rect")
        .data(d => [
          { key: 'male', value: d.male },
          { key: 'female', value: d.female },
          { key: 'undecided', value: d.undecided }
        ])
        .join("rect")
        .attr("x", d => x1(d.key)!)
        .attr("y", d => y(d.value))
        .attr("width", x1.bandwidth())
        .attr("height", d => innerHeight - y(d.value))
        .attr("fill", d => color(d.key) as string);
    } else if (chartType === "stacked") {
      // Stacked bar chart
      const stackedData = d3.stack<GenderFactorData>()
        .keys(['male', 'female', 'undecided'])
        .value((d, key) => d[key as keyof GenderFactorData] as number)
        (data);

      g.append("g")
        .selectAll("g")
        .data(stackedData)
        .join("g")
        .attr("fill", d => color(d.key) as string)
        .selectAll("rect")
        .data(d => d)
        .join("rect")
        .attr("x", d => x0(d.data.factor)!)
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x0.bandwidth());
    }

    // Legend
    const legend = svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "end")
      .selectAll("g")
      .data(['male', 'female', 'undecided'])
      .join("g")
      .attr("transform", (d, i) => `translate(${width - 20}, ${i * 20 + 20})`);

    legend.append("rect")
      .attr("x", -17)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", d => color(d) as string);

    legend.append("text")
      .attr("x", -24)
      .attr("y", 9.5)
      .attr("dy", "0.32em")
      .text(d => d.charAt(0).toUpperCase() + d.slice(1));
  }

  return (
    <Card className="overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-semibold">Mental Health Factors by Gender</h3>
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
            variant={chartType === "stacked" ? "default" : "outline"}
            className={`text-xs px-2 py-1 h-8 ${chartType === "stacked" ? "bg-primary" : "bg-gray-100 dark:bg-gray-700"}`}
            onClick={() => setChartType("stacked")}
          >
            Stacked
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
          This chart shows the distribution of mental health factors across different genders. The data suggests varying treatment-seeking behaviors between males and females in tech.
        </p>
      </CardContent>
    </Card>
  );
}
