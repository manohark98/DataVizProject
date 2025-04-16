import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { useDataContext } from "@/hooks/useDataContext";
import * as d3 from "d3";
import { useD3 } from "@/hooks/useD3";
import { SurveyRecord } from "@/types";

interface TreeNode {
  name: string;
  value?: number;
  percentage?: number;
  children?: TreeNode[];
}

export default function MentalHealthTreeChart() {
  const { filteredData } = useDataContext();
  const [scale, setScale] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);

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
    currentScale: number,
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

    // Dimensions - reduced to 1/4 of original size to prevent overflow
    const width = 100;
    const height = 75;
    const margin = { top: 3, right: 3, bottom: 3, left: 3 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Process data for tree diagram
    const treeData = processTreeData(filteredData);

    // Create hierarchical data structure
    const root = d3.hierarchy(treeData);

    // Create tree layout with reduced size
    const treeLayout = d3.tree<TreeNode>().size([innerWidth, innerHeight - 10]);

    // Assign the data to the tree layout
    treeLayout(root);

    // Create an SVG group for the tree with scaling
    const g = svg
      .append("g")
      .attr(
        "transform",
        `translate(${margin.left}, ${margin.top}) scale(${currentScale})`,
      );

    // Add links (edges) between nodes
    g.selectAll(".link")
      .data(root.links())
      .join("path")
      .attr("class", "link")
      .attr(
        "d",
        d3
          .linkHorizontal<
            d3.HierarchyPointLink<TreeNode>,
            d3.HierarchyPointNode<TreeNode>
          >()
          .x((d: d3.HierarchyPointLink<TreeNode>) => d.y) // Note: x and y are swapped for horizontal tree
          .y((d: d3.HierarchyPointLink<TreeNode>) => d.x),
      )
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 1.5);

    // Add nodes
    const node = g
      .selectAll(".node")
      .data(root.descendants())
      .join("g")
      .attr("class", "node")
      .attr(
        "transform",
        (d: d3.HierarchyPointNode<TreeNode>) => `translate(${d.y}, ${d.x})`,
      );

    // Add circles to nodes
    node
      .append("circle")
      .attr("r", (d: d3.HierarchyPointNode<TreeNode>) =>
        d.data.percentage ? 3 + d.data.percentage / 30 : 3,
      )
      .attr("fill", (d: d3.HierarchyPointNode<TreeNode>) => getNodeColor(d))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1);

    // Add labels to nodes
    node
      .append("text")
      .attr("dy", (d: d3.HierarchyPointNode<TreeNode>) => (d.children ? -8 : 3))
      .attr("x", (d: d3.HierarchyPointNode<TreeNode>) => (d.children ? -5 : 8))
      .attr("text-anchor", (d: d3.HierarchyPointNode<TreeNode>) =>
        d.children ? "end" : "start",
      )
      .attr("font-size", "6px")
      .text((d: d3.HierarchyPointNode<TreeNode>) => {
        const label = d.data.name;
        // Only show percentage on leaf nodes to save space
        if (d.data.percentage && !d.children) {
          return `${label} (${d.data.percentage.toFixed(0)}%)`;
        }
        return label;
      });

    // Add title at the top with a smaller font size
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 10)
      .attr("text-anchor", "middle")
      .attr("font-size", "8px")
      .attr("font-weight", "bold");
  }

  function processTreeData(data: SurveyRecord[]): TreeNode {
    // Create root node
    const rootNode: TreeNode = {
      name: "Mental Health",
      children: [],
    };

    // Process diagnosis data
    const diagnosisNode: TreeNode = {
      name: "Diagnosis",
      children: [],
    };

    // We don't have clear "yes/no" for diagnosis in our data, so we'll categorize
    // into those with some form of diagnosis vs. unspecified
    const withDiagnosis = data.filter((d) => d.diagnosis === "Yes").length;
    const withoutDiagnosis = data.filter((d) => d.diagnosis === "No").length;
    const maybeDiagnosis = data.filter((d) => d.diagnosis === "Maybe").length;

    const diagnosisTotal =
      withDiagnosis + withoutDiagnosis + maybeDiagnosis || 1;

    diagnosisNode.children = [
      {
        name: "With Diagnosis",
        value: withDiagnosis,
        percentage: (withDiagnosis / diagnosisTotal) * 100,
      },
      {
        name: "Without Diagnosis",
        value: withoutDiagnosis,
        percentage: (withoutDiagnosis / diagnosisTotal) * 100,
      },
      {
        name: "Unsure",
        value: maybeDiagnosis,
        percentage: (maybeDiagnosis / diagnosisTotal) * 100,
      },
    ];

    // Process treatment data
    const treatmentNode: TreeNode = {
      name: "Treatment",
      children: [],
    };

    const soughtTreatment = data.filter((d) => d.soughtTreatment).length;
    const didNotSeekTreatment = data.filter((d) => !d.soughtTreatment).length;
    const treatmentTotal = soughtTreatment + didNotSeekTreatment || 1;

    treatmentNode.children = [
      {
        name: "Sought Treatment",
        value: soughtTreatment,
        percentage: (soughtTreatment / treatmentTotal) * 100,
      },
      {
        name: "Did Not Seek Treatment",
        value: didNotSeekTreatment,
        percentage: (didNotSeekTreatment / treatmentTotal) * 100,
      },
    ];

    // Process workplace data
    const workplaceNode: TreeNode = {
      name: "Workplace",
      children: [],
    };

    const supportiveEmployer = data.filter(
      (d) => d.responsibleEmployer === "Yes",
    ).length;
    const unsupportiveEmployer = data.filter(
      (d) => d.responsibleEmployer === "No",
    ).length;
    const maybeResponsible = data.filter(
      (d) => d.responsibleEmployer === "Maybe",
    ).length;
    const employerTotal =
      supportiveEmployer + unsupportiveEmployer + maybeResponsible || 1;

    workplaceNode.children = [
      {
        name: "Supportive Employer",
        value: supportiveEmployer,
        percentage: (supportiveEmployer / employerTotal) * 100,
      },
      {
        name: "Unsupportive Employer",
        value: unsupportiveEmployer,
        percentage: (unsupportiveEmployer / employerTotal) * 100,
      },
      {
        name: "Somewhat Supportive",
        value: maybeResponsible,
        percentage: (maybeResponsible / employerTotal) * 100,
      },
    ];

    // Add all nodes to the root
    rootNode.children = [diagnosisNode, treatmentNode, workplaceNode];

    return rootNode;
  }

  function getNodeColor(d: d3.HierarchyPointNode<TreeNode>): string {
    const depth = d.depth;
    const colorScale = d3
      .scaleOrdinal()
      .domain([0, 1, 2, 3])
      .range(["#4338CA", "#10B981", "#F59E0B", "#EF4444"]);

    return colorScale(depth) as string;
  }

  return (
    <Card className="overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold">Mental Health Tree Diagram</h3>
      </div>
      <CardContent className="p-4">
        <div className="h-[250px]">
          <svg
            ref={svgRef}
            style={{ width: "100%", height: "100%" }}
            viewBox="0 0 100 75"
            preserveAspectRatio="xMidYMid meet"
          />
        </div>

        <div className="flex items-center justify-end space-x-2 mt-2 mb-2">
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
          <span className="text-xs text-gray-500">
            {Math.round(scale * 100)}%
          </span>
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
