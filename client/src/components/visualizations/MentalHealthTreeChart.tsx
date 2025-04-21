import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { useDataContext } from "@/hooks/useDataContext";
import { SurveyRecord } from "@/types";

interface TreeNode {
  name: string;
  value?: number;
  percentage?: number;
  children?: TreeNode[];
}

export default function MentalHealthTreeChart() {
  const { filteredData } = useDataContext();
  const svgRef = useRef<SVGSVGElement>(null);
  const [scale, setScale] = useState(1);
  const [centerX, setCenterX] = useState(0);
  const [centerY, setCenterY] = useState(0);

  const increaseSize = () => {
    setScale((prevScale) => Math.min(prevScale + 0.2, 2.0));
  };

  const decreaseSize = () => {
    setScale((prevScale) => Math.max(prevScale - 0.2, 0.5));
  };

  useEffect(() => {
    if (filteredData && svgRef.current) {
      renderChart(d3.select(svgRef.current), scale);
    }
  }, [filteredData, scale]);

  function renderChart(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    currentScale: number
  ) {
    if (!filteredData || filteredData.length === 0) {
      svg.selectAll("*").remove();
      svg
        .append("text")
        .attr("x", "50%")
        .attr("y", "50%")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .text("No data available");
      return;
    }

    // Clear previous chart
    svg.selectAll("*").remove();

    // Process data for tree diagram
    const treeData = processTreeData(filteredData);

    // Set up dimensions based on the container
    const containerWidth = svg.node()?.getBoundingClientRect().width || 600;
    const containerHeight = svg.node()?.getBoundingClientRect().height || 400;
    
    // Ensure SVG viewBox matches container
    svg.attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
       .attr("preserveAspectRatio", "xMidYMid meet");
    
    // Margins
    const margin = { top: 30, right: 20, bottom: 20, left: 20 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    // Create hierarchy
    const root = d3.hierarchy(treeData);
    
    // Center calculation based on tree layout and scale
    const centerOffsetX = width / 2;
    const centerOffsetY = height / 2;
    setCenterX(centerOffsetX);
    setCenterY(centerOffsetY);
    
    // Create a container group with scaling and centering
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top}) scale(${currentScale}) translate(${(1-currentScale) * centerOffsetX / currentScale}, 0)`);

    // Create tree layout - horizontal orientation
    const treeLayout = d3
      .tree<TreeNode>()
      .size([width, height - 50]);

    const tree = treeLayout(root);

    // Create links
    g.selectAll(".link")
      .data(tree.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 1.5)
      .attr("d", d3.linkHorizontal<d3.HierarchyLink<TreeNode>, any>()
        .x(d => d.y) // Swap x and y for horizontal layout
        .y(d => d.x));

    // Create nodes
    const node = g
      .selectAll(".node")
      .data(tree.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.y},${d.x})`);

    // Add circles to nodes - size proportional to value
    node
      .append("circle")
      .attr("r", d => (d.data.value ? Math.sqrt(d.data.value) * 0.3 + 5 : 5))
      .attr("fill", d => getNodeColor(d))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    // Add labels to nodes
    node
      .append("text")
      .attr("dy", 3)
      .attr("x", d => d.children ? -15 : 15)
      .attr("text-anchor", d => d.children ? "end" : "start")
      .attr("font-size", d => d.depth === 0 ? "14px" : "12px")
      .attr("font-weight", d => d.depth <= 1 ? "bold" : "normal")
      .text(d => d.data.name);

    // Add percentage labels for leaf nodes
    node
      .filter(d => !d.children)
      .append("text")
      .attr("dy", -15)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "#666")
      .text(d => 
        d.data.percentage ? `${Math.round(d.data.percentage)}%` : ""
      );

    // Add title for tooltips
    node.append("title").text(
      d =>
        `${d.data.name} ${
          d.data.percentage ? `(${Math.round(d.data.percentage)}%)` : ""
        }`
    );

    // Add chart title
    svg
      .append("text")
      .attr("x", containerWidth / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text("Mental Health Hierarchy");
  }

  function getNodeColor(d: d3.HierarchyNode<TreeNode>): string {
    const depth = d.depth;
    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(["0", "1", "2", "3"])
      .range(["#4338CA", "#10B981", "#F59E0B", "#EF4444"]);

    return colorScale(depth.toString());
  }

  function processTreeData(data: SurveyRecord[]): TreeNode {
    const total = data.length;
    
    // Calculate diagnosis stats
    const diagnosisYes = data.filter(d => d.diagnosis === "Yes");
    const diagnosisNo = data.filter(d => d.diagnosis === "No");
    const diagnosisYesCount = diagnosisYes.length;
    const diagnosisNoCount = diagnosisNo.length;
    
    // Calculate treatment stats
    const treatmentYes = data.filter(d => d.soughtTreatment);
    const treatmentNo = data.filter(d => !d.soughtTreatment);
    const treatmentYesCount = treatmentYes.length;
    const treatmentNoCount = treatmentNo.length;
    
    // Calculate employer responsibility stats
    const employerYes = data.filter(d => d.responsibleEmployer === "Yes");
    const employerNo = data.filter(d => d.responsibleEmployer === "No");
    const employerYesCount = employerYes.length;
    const employerNoCount = employerNo.length;
    
    // Create tree structure
    return {
      name: "Mental Health",
      value: total,
      children: [
        {
          name: "Diagnosis",
          value: total,
          children: [
            {
              name: "Diagnosed",
              value: diagnosisYesCount,
              percentage: (diagnosisYesCount / total) * 100,
            },
            {
              name: "Not Diagnosed",
              value: diagnosisNoCount,
              percentage: (diagnosisNoCount / total) * 100,
            },
          ],
        },
        {
          name: "Treatment",
          value: total,
          children: [
            {
              name: "Sought Treatment",
              value: treatmentYesCount,
              percentage: (treatmentYesCount / total) * 100,
            },
            {
              name: "No Treatment",
              value: treatmentNoCount,
              percentage: (treatmentNoCount / total) * 100,
            },
          ],
        },
        {
          name: "Workplace",
          value: total,
          children: [
            {
              name: "Supportive Employer",
              value: employerYesCount,
              percentage: (employerYesCount / total) * 100,
            },
            {
              name: "Non-Supportive Employer",
              value: employerNoCount,
              percentage: (employerNoCount / total) * 100,
            },
          ],
        },
      ],
    };
  }

  return (
    <Card className="overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold">Mental Health Tree Diagram</h3>
      </div>
      <CardContent className="p-4">
        <div className="h-[400px]">
          <svg
            ref={svgRef}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
        
        <div className="flex items-center justify-end space-x-2 mt-4 mb-2">
          <span className="text-xs text-gray-500">Zoom:</span>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-6 w-6" 
            onClick={decreaseSize}
            disabled={scale <= 0.5}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-6 w-6" 
            onClick={increaseSize}
            disabled={scale >= 2.0}
          >
            <Plus className="h-3 w-3" />
          </Button>
          <span className="text-xs text-gray-500">{Math.round(scale * 100)}%</span>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          This tree diagram displays the hierarchical structure of mental health
          aspects in the tech industry, showing the relationships between
          diagnosis, treatment-seeking behavior, and workplace support. The size
          of the nodes corresponds to the percentage of respondents in each
          category.
        </p>
      </CardContent>
    </Card>
  );
}