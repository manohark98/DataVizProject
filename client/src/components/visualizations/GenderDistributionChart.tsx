import { useState } from "react";
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
  const [activeGenders, setActiveGenders] = useState<string[]>(["male", "female", "undecided"]);
  
  const svgRef = useD3(renderChart, [filteredData, chartType, activeGenders]);

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
    const margin = { top: 40, right: 30, bottom: 60, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Process data by gender
    const male = filteredData.filter(d => d.gender === "Male");
    const female = filteredData.filter(d => d.gender === "Female");
    const undecided = filteredData.filter(d => d.gender === "Undecided");

    // Get actual counts for tooltips
    const maleCounts = {
      soughtTreatment: male.filter(d => d.soughtTreatment).length,
      familyHistory: male.filter(d => d.familyHistory === "Yes").length,
      preferAnonymity: male.filter(d => d.preferAnonymity).length
    };
    
    const femaleCounts = {
      soughtTreatment: female.filter(d => d.soughtTreatment).length,
      familyHistory: female.filter(d => d.familyHistory === "Yes").length,
      preferAnonymity: female.filter(d => d.preferAnonymity).length
    };
    
    const undecidedCounts = {
      soughtTreatment: undecided.filter(d => d.soughtTreatment).length,
      familyHistory: undecided.filter(d => d.familyHistory === "Yes").length,
      preferAnonymity: undecided.filter(d => d.preferAnonymity).length
    };

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
      .domain(activeGenders)
      .rangeRound([0, x0.bandwidth()])
      .padding(0.05);

    // Y scale
    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([innerHeight, 0]);

    // Color scale
    const color = d3.scaleOrdinal<string>()
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
      const barGroups = g.append("g")
        .selectAll("g")
        .data(data)
        .join("g")
        .attr("transform", d => `translate(${x0(d.factor)}, 0)`);
        
      // Add bars
      barGroups.selectAll("rect")
        .data(d => activeGenders.map(key => ({
          key,
          value: d[key as keyof GenderFactorData] as number,
          factor: d.factor
        })))
        .join("rect")
        .attr("x", d => x1(d.key)!)
        .attr("y", d => y(d.value))
        .attr("width", x1.bandwidth())
        .attr("height", d => innerHeight - y(d.value))
        .attr("fill", d => color(d.key))
        .style("opacity", 0.8)
        .on("mouseover", function(event: any, d) {
          // Highlight the bar
          d3.select(this).style("opacity", 1);
          
          // Get actual counts 
          let count = 0;
          let totalByGender = 0;
          
          if (d.key === 'male') {
            count = d.factor === 'Sought Treatment' ? maleCounts.soughtTreatment : 
                    d.factor === 'Family History' ? maleCounts.familyHistory : 
                    maleCounts.preferAnonymity;
            totalByGender = male.length;
          } else if (d.key === 'female') {
            count = d.factor === 'Sought Treatment' ? femaleCounts.soughtTreatment : 
                    d.factor === 'Family History' ? femaleCounts.familyHistory : 
                    femaleCounts.preferAnonymity;
            totalByGender = female.length;
          } else {
            count = d.factor === 'Sought Treatment' ? undecidedCounts.soughtTreatment : 
                    d.factor === 'Family History' ? undecidedCounts.familyHistory : 
                    undecidedCounts.preferAnonymity;
            totalByGender = undecided.length;
          }
          
          // Show tooltip
          const gender = d.key.charAt(0).toUpperCase() + d.key.slice(1);
          tooltip
            .style("opacity", 1)
            .html(`
              <div style="font-weight: bold; margin-bottom: 4px;">${gender} - ${d.factor}</div>
              <div>Count: ${count} of ${totalByGender}</div>
              <div>Percentage: ${d.value.toFixed(1)}%</div>
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
        
      // Add percentage labels directly on bars
      barGroups.selectAll("text")
        .data(d => activeGenders.map(key => ({
          key,
          value: d[key as keyof GenderFactorData] as number,
          factor: d.factor
        })))
        .join("text")
        .attr("x", d => x1(d.key)! + x1.bandwidth()/2)
        .attr("y", d => y(d.value) - 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "8px")
        .attr("font-weight", "bold")
        .attr("fill", "currentColor")
        .text(d => `${Math.round(d.value)}%`);
    } else if (chartType === "stacked") {
      // Filter the data based on active genders
      const filteredKeys = activeGenders;
      
      // Stacked bar chart
      const stackedData = d3.stack<GenderFactorData>()
        .keys(filteredKeys)
        .value((d, key) => d[key as keyof GenderFactorData] as number)
        (data);

      // Create groups for each stacked series
      const stackGroups = g.append("g")
        .selectAll("g")
        .data(stackedData)
        .join("g")
        .attr("fill", d => color(d.key));
        
      // Add the stacked rectangles
      stackGroups.selectAll("rect")
        .data(d => d.map(item => ({
          key: d.key,
          factor: item.data.factor,
          value: item.data[d.key as keyof GenderFactorData] as number,
          y0: item[0],
          y1: item[1]
        })))
        .join("rect")
        .attr("x", d => x0(d.factor)!)
        .attr("y", d => y(d.y1))
        .attr("height", d => y(d.y0) - y(d.y1))
        .attr("width", x0.bandwidth())
        .style("opacity", 0.8)
        .on("mouseover", function(event: any, d) {
          // Highlight the segment
          d3.select(this).style("opacity", 1);
          
          // Get actual counts 
          let count = 0;
          let totalByGender = 0;
          
          if (d.key === 'male') {
            count = d.factor === 'Sought Treatment' ? maleCounts.soughtTreatment : 
                    d.factor === 'Family History' ? maleCounts.familyHistory : 
                    maleCounts.preferAnonymity;
            totalByGender = male.length;
          } else if (d.key === 'female') {
            count = d.factor === 'Sought Treatment' ? femaleCounts.soughtTreatment : 
                    d.factor === 'Family History' ? femaleCounts.familyHistory : 
                    femaleCounts.preferAnonymity;
            totalByGender = female.length;
          } else {
            count = d.factor === 'Sought Treatment' ? undecidedCounts.soughtTreatment : 
                    d.factor === 'Family History' ? undecidedCounts.familyHistory : 
                    undecidedCounts.preferAnonymity;
            totalByGender = undecided.length;
          }
          
          // Show tooltip
          const gender = d.key.charAt(0).toUpperCase() + d.key.slice(1);
          tooltip
            .style("opacity", 1)
            .html(`
              <div style="font-weight: bold; margin-bottom: 4px;">${gender} - ${d.factor}</div>
              <div>Count: ${count} of ${totalByGender}</div>
              <div>Percentage: ${d.value.toFixed(1)}%</div>
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
          d3.select(this).style("opacity", 0.8);
          tooltip.style("opacity", 0);
        });
        
      // Add text labels for each segment that's big enough to show text
      stackGroups.selectAll("text")
        .data(d => d.map(item => ({
          key: d.key,
          factor: item.data.factor,
          value: item.data[d.key as keyof GenderFactorData] as number,
          y0: item[0],
          y1: item[1]
        })))
        .join("text")
        .attr("x", d => x0(d.factor)! + x0.bandwidth()/2)
        .attr("y", d => y((d.y0 + d.y1)/2))
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "9px")
        .attr("font-weight", "bold")
        .attr("fill", "white")
        .style("pointer-events", "none")
        .text(d => {
          // Only show percentage if the segment is large enough
          return y(d.y0) - y(d.y1) > 15 ? `${Math.round(d.value)}%` : '';
        });
    }

    // Chart Title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text("Gender Distribution by Mental Health Factors");

    // Add interactive legend
    const legend = svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 12)
      .attr("text-anchor", "end")
      .selectAll("g")
      .data(['male', 'female', 'undecided'])
      .join("g")
      .attr("transform", (d, i) => `translate(${width - 20}, ${i * 25 + 25})`)
      .style("cursor", "pointer")
      .on("click", function(event, d) {
        // Toggle this gender in the active list
        if (activeGenders.includes(d)) {
          if (activeGenders.length > 1) { // Don't remove if it's the last one
            setActiveGenders(activeGenders.filter(g => g !== d));
          }
        } else {
          setActiveGenders([...activeGenders, d]);
        }
      })
      .on("dblclick", function() {
        // Reset to show all genders on double click
        setActiveGenders(['male', 'female', 'undecided']);
      });

    // Legend colored rects
    legend.append("rect")
      .attr("x", -19)
      .attr("width", 19)
      .attr("height", 19)
      .attr("fill", d => color(d))
      .style("opacity", d => activeGenders.includes(d) ? 1 : 0.3);

    // Legend text
    legend.append("text")
      .attr("x", -24)
      .attr("y", 9.5)
      .attr("dy", "0.32em")
      .text(d => d.charAt(0).toUpperCase() + d.slice(1))
      .style("opacity", d => activeGenders.includes(d) ? 1 : 0.5);

    // Legend instructions
    svg.append("text")
      .attr("x", width - 20)
      .attr("y", 100)
      .attr("text-anchor", "end")
      .attr("font-size", "9px")
      .attr("fill", "#888")
      .text("Click legend to filter");

    svg.append("text")
      .attr("x", width - 20)
      .attr("y", 112)
      .attr("text-anchor", "end")
      .attr("font-size", "9px")
      .attr("fill", "#888")
      .text("Double-click to reset");
      
    // Clean up tooltip on refresh/unmount
    return () => {
      tooltip.remove();
    };
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
      <CardContent className="p-4 relative">
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
            This interactive chart shows the distribution of mental health factors across different genders.
          </p>
          <ul className="list-disc list-inside pl-2 space-y-0.5">
            <li>Percentages are displayed directly on the chart</li>
            <li>Hover over bars to see detailed counts and percentages in a tooltip</li>
            <li>Click gender in the legend to filter by that gender</li>
            <li>Double-click legend to reset the view</li>
            <li>Toggle between grouped and stacked bar views using the buttons above</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}