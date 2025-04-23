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
        .attr("fill", "#10B981")
        .style("opacity", 0.8)
        .on("mouseover", function(event: any, d) {
          // Highlight the bar
          d3.select(this).style("opacity", 1);
          
          // Calculate percentages
          const total = d.sought + d.notSought;
          const percentage = (d.notSought / total) * 100;
          
          // Show tooltip
          tooltip
            .style("opacity", 1)
            .html(`
              <div style="font-weight: bold; margin-bottom: 4px;">${d.ageGroup} Age Group</div>
              <div>Did Not Seek Treatment: ${d.notSought} respondents</div>
              <div>Percentage: ${percentage.toFixed(1)}% of age group</div>
              <div>Total in age group: ${total} respondents</div>
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

      // Then the sought treatment bars (top)
      g.selectAll(".bar-sought")
        .data(data)
        .join("rect")
        .attr("class", "bar-sought")
        .attr("x", d => x(d.ageGroup)!)
        .attr("y", d => y(d.sought + d.notSought))
        .attr("height", d => y(d.notSought) - y(d.sought + d.notSought))
        .attr("width", x.bandwidth())
        .attr("fill", "#4F46E5")
        .style("opacity", 0.8)
        .on("mouseover", function(event: any, d) {
          // Highlight the bar
          d3.select(this).style("opacity", 1);
          
          // Calculate percentages
          const total = d.sought + d.notSought;
          const percentage = (d.sought / total) * 100;
          
          // Show tooltip
          tooltip
            .style("opacity", 1)
            .html(`
              <div style="font-weight: bold; margin-bottom: 4px;">${d.ageGroup} Age Group</div>
              <div>Sought Treatment: ${d.sought} respondents</div>
              <div>Percentage: ${percentage.toFixed(1)}% of age group</div>
              <div>Total in age group: ${total} respondents</div>
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
        
      // Add percentages for "not sought" segment (if large enough)
      g.selectAll(".text-not-sought")
        .data(data)
        .join("text")
        .attr("class", "text-not-sought")
        .attr("x", d => x(d.ageGroup)! + x.bandwidth() / 2)
        .attr("y", d => y(d.notSought / 2))
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .attr("fill", "white")
        .text(d => {
          // Only show if segment is large enough
          if (innerHeight - y(d.notSought) > 25) {
            const percent = Math.round(d.notSought / (d.sought + d.notSought) * 100);
            return `${percent}%`;
          }
          return "";
        });
        
      // Add percentages for "sought" segment (if large enough)
      g.selectAll(".text-sought")
        .data(data)
        .join("text")
        .attr("class", "text-sought")
        .attr("x", d => x(d.ageGroup)! + x.bandwidth() / 2)
        .attr("y", d => y(d.sought + d.notSought) + (y(d.notSought) - y(d.sought + d.notSought)) / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .attr("fill", "white")
        .text(d => {
          // Only show if segment is large enough
          if (y(d.notSought) - y(d.sought + d.notSought) > 25) {
            const percent = Math.round(d.sought / (d.sought + d.notSought) * 100);
            return `${percent}%`;
          }
          return "";
        });
        
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
        .attr("fill", "#4F46E5")
        .style("opacity", 0.8)
        .on("mouseover", function(event: any, d) {
          // Highlight the bar
          d3.select(this).style("opacity", 1);
          
          // Calculate percentages
          const total = d.sought + d.notSought;
          const percentage = (d.sought / total) * 100;
          
          // Show tooltip
          tooltip
            .style("opacity", 1)
            .html(`
              <div style="font-weight: bold; margin-bottom: 4px;">${d.ageGroup} Age Group</div>
              <div>Sought Treatment: ${d.sought} respondents</div>
              <div>Percentage: ${percentage.toFixed(1)}% of age group</div>
              <div>Total in age group: ${total} respondents</div>
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
        
      // Add text labels to Sought Treatment bars
      groups.append("text")
        .attr("x", xSubgroup("sought")! + xSubgroup.bandwidth() / 2)
        .attr("y", d => y(d.sought) - 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "9px")
        .attr("font-weight", "bold")
        .attr("fill", "currentColor")
        .text(d => {
          const total = d.sought + d.notSought;
          const percent = Math.round(d.sought / total * 100);
          return `${percent}%`;
        });

      // Not sought treatment bars
      groups.append("rect")
        .attr("class", "bar-not-sought")
        .attr("x", xSubgroup("notSought")!)
        .attr("y", d => y(d.notSought))
        .attr("height", d => innerHeight - y(d.notSought))
        .attr("width", xSubgroup.bandwidth())
        .attr("fill", "#10B981")
        .style("opacity", 0.8)
        .on("mouseover", function(event: any, d) {
          // Highlight the bar
          d3.select(this).style("opacity", 1);
          
          // Calculate percentages
          const total = d.sought + d.notSought;
          const percentage = (d.notSought / total) * 100;
          
          // Show tooltip
          tooltip
            .style("opacity", 1)
            .html(`
              <div style="font-weight: bold; margin-bottom: 4px;">${d.ageGroup} Age Group</div>
              <div>Did Not Seek Treatment: ${d.notSought} respondents</div>
              <div>Percentage: ${percentage.toFixed(1)}% of age group</div>
              <div>Total in age group: ${total} respondents</div>
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
        
      // Add text labels to Not Sought Treatment bars
      groups.append("text")
        .attr("x", xSubgroup("notSought")! + xSubgroup.bandwidth() / 2)
        .attr("y", d => y(d.notSought) - 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "9px")
        .attr("font-weight", "bold")
        .attr("fill", "currentColor")
        .text(d => {
          const total = d.sought + d.notSought;
          const percent = Math.round(d.notSought / total * 100);
          return `${percent}%`;
        });
    }

    // Add a title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text("Treatment-Seeking Behavior by Age Group");

    // Add legend with enhanced interactivity
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 160}, 20)`);

    // Sought treatment
    legend.append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", "#4F46E5")
      .style("cursor", "pointer")
      .on("mouseover", function() {
        // Highlight all "sought treatment" bars
        svg.selectAll(".bar-sought")
          .style("opacity", 1);
          
        // Show tooltip with summary stats
        const totalSought = data.reduce((sum, d) => sum + d.sought, 0);
        const totalRespondents = data.reduce((sum, d) => sum + d.sought + d.notSought, 0);
        const percentage = (totalSought / totalRespondents) * 100;
        
        tooltip
          .style("opacity", 1)
          .html(`
            <div style="font-weight: bold; margin-bottom: 4px;">Sought Treatment</div>
            <div>Count: ${totalSought} respondents</div>
            <div>Percentage: ${percentage.toFixed(1)}% of total</div>
            <div>Across all age groups</div>
          `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mousemove", function(event: any) {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseleave", function() {
        // Reset opacity of bars
        svg.selectAll(".bar-sought")
          .style("opacity", 0.8);
          
        tooltip.style("opacity", 0);
      });

    legend.append("text")
      .attr("x", 25)
      .attr("y", 7.5)
      .attr("dy", ".35em")
      .attr("font-size", "12px")
      .text("Sought Treatment")
      .style("cursor", "pointer")
      .on("mouseover", function() {
        // Trigger the same events as the rectangle
        legend.select("rect").dispatch("mouseover");
      })
      .on("mousemove", function(event: any) {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseleave", function() {
        legend.select("rect").dispatch("mouseleave");
      });

    // Not sought treatment
    legend.append("rect")
      .attr("y", 20)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", "#10B981")
      .style("cursor", "pointer")
      .on("mouseover", function() {
        // Highlight all "not sought treatment" bars
        svg.selectAll(".bar-not-sought")
          .style("opacity", 1);
          
        // Show tooltip with summary stats
        const totalNotSought = data.reduce((sum, d) => sum + d.notSought, 0);
        const totalRespondents = data.reduce((sum, d) => sum + d.sought + d.notSought, 0);
        const percentage = (totalNotSought / totalRespondents) * 100;
        
        tooltip
          .style("opacity", 1)
          .html(`
            <div style="font-weight: bold; margin-bottom: 4px;">Did Not Seek Treatment</div>
            <div>Count: ${totalNotSought} respondents</div>
            <div>Percentage: ${percentage.toFixed(1)}% of total</div>
            <div>Across all age groups</div>
          `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mousemove", function(event: any) {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseleave", function() {
        // Reset opacity of bars
        svg.selectAll(".bar-not-sought")
          .style("opacity", 0.8);
          
        tooltip.style("opacity", 0);
      });

    legend.append("text")
      .attr("x", 25)
      .attr("y", 27.5)
      .attr("dy", ".35em")
      .attr("font-size", "12px")
      .text("Did Not Seek Treatment")
      .style("cursor", "pointer")
      .on("mouseover", function() {
        // Trigger the same events as the rectangle
        legend.select("rect:nth-child(3)").dispatch("mouseover");
      })
      .on("mousemove", function(event: any) {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseleave", function() {
        legend.select("rect:nth-child(3)").dispatch("mouseleave");
      });
      
    // Clean up tooltip on refresh/unmount
    return () => {
      tooltip.remove();
    };
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
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>
            This chart shows treatment-seeking behavior across different age groups. 
            The data indicates that treatment-seeking behavior varies significantly by age.
          </p>
          <ul className="list-disc list-inside pl-2 space-y-0.5">
            <li>Hover over bars to see detailed information for each age group</li>
            <li>Hover over legend items to highlight all bars of that category</li> 
            <li>Toggle between stacked and grouped bar views using the buttons above</li>
            <li>Percentages are displayed directly on the chart for segments large enough to accommodate text</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}