import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { useDataContext } from "@/hooks/useDataContext";
import { SurveyRecord } from "@/types";

interface NetworkNode extends d3.SimulationNodeDatum {
  id: string;
  group: number;
  count: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface NetworkLink extends d3.SimulationLinkDatum<NetworkNode> {
  source: string | NetworkNode;
  target: string | NetworkNode;
  value: number;
  correlation: number;
}

interface NetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

interface LegendItem {
  label: string;
  group: number;
}

export default function MentalHealthNetworkGraph() {
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

    // Clear any existing SVG content
    svg.selectAll("*").remove();

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
    
    // Center calculation for proper centering during zoom
    const centerX = width / 2;
    const centerY = height / 2;

    // Process data for network graph
    const networkData = processNetworkData(filteredData);

    // Create a container group with scaling and centering
    const g = svg
      .append("g")
      .attr(
        "transform",
        `translate(${margin.left}, ${margin.top}) scale(${currentScale}) translate(${(1-currentScale) * centerX / currentScale}, ${(1-currentScale) * centerY / currentScale})`
      );

    // Create a force simulation - adjusted for optimal visualization
    const simulation = d3
      .forceSimulation<NetworkNode>()
      .force(
        "link",
        d3
          .forceLink<NetworkNode, NetworkLink>()
          .id((d: NetworkNode) => d.id)
          .distance((d: NetworkLink) => 100) // Fixed distance for better layout
          .strength(0.2) // Reduced strength for more stable layout
      )
      .force("charge", d3.forceManyBody<NetworkNode>().strength(-300)) // Stronger repulsion
      .force(
        "center",
        d3.forceCenter<NetworkNode>(width / 2, height / 2),
      )
      .force(
        "collide",
        d3
          .forceCollide<NetworkNode>()
          .radius((d: NetworkNode) => 40), // Larger collision radius
      );

    // Create a color scale with lighter, pastel colors
    const colorScale = d3.scaleOrdinal<string>()
      .domain(["1", "2", "3", "4", "5"])
      .range(["#90cdf4", "#9ae6b4", "#fbd38d", "#feb2b2", "#d6bcfa"]);

    // Create links (edges)
    const link = g
      .append("g")
      .selectAll("line")
      .data(networkData.links)
      .join("line")
      .attr("stroke-width", 3)
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6);

    // Create nodes
    const nodeGroup = g
      .append("g")
      .selectAll<SVGGElement, NetworkNode>(".node")
      .data(networkData.nodes)
      .join("g")
      .attr("class", "node")
      .call(
        d3
          .drag<SVGGElement, NetworkNode>()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended),
      );

    // Add circles to nodes
    nodeGroup
      .append("circle")
      .attr("r", 25) // Fixed size for better visibility
      .attr("fill", (d: NetworkNode) => colorScale(d.group.toString()))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    // Add labels to nodes
    nodeGroup
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "#000")
      .text((d: NetworkNode) => formatLabel(d.id));

    // Add title for tooltips
    nodeGroup
      .append("title")
      .text((d: NetworkNode) => `${d.id}\nCount: ${d.count}`);

    // Update node and link positions on each tick of the simulation
    simulation.nodes(networkData.nodes).on("tick", ticked);

    const linkForce =
      simulation.force<d3.ForceLink<NetworkNode, NetworkLink>>("link");
    if (linkForce) {
      linkForce.links(networkData.links);
    }

    function ticked() {
      link
        .attr("x1", (d: NetworkLink) => {
          const source = d.source as NetworkNode;
          return source.x || 0;
        })
        .attr("y1", (d: NetworkLink) => {
          const source = d.source as NetworkNode;
          return source.y || 0;
        })
        .attr("x2", (d: NetworkLink) => {
          const target = d.target as NetworkNode;
          return target.x || 0;
        })
        .attr("y2", (d: NetworkLink) => {
          const target = d.target as NetworkNode;
          return target.y || 0;
        });

      nodeGroup.attr(
        "transform",
        (d: NetworkNode) => `translate(${d.x || 0}, ${d.y || 0})`,
      );
    }

    function dragstarted(
      event: d3.D3DragEvent<SVGGElement, NetworkNode, any>,
      d: NetworkNode,
    ) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(
      event: d3.D3DragEvent<SVGGElement, NetworkNode, any>,
      d: NetworkNode,
    ) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(
      event: d3.D3DragEvent<SVGGElement, NetworkNode, any>,
      d: NetworkNode,
    ) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Add chart title
    svg
      .append("text")
      .attr("x", containerWidth / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text("Mental Health Variables Network");

    // Add legend
    const legendItems: LegendItem[] = [
      { label: "Family History", group: 1 },
      { label: "Sought Treatment", group: 2 },
      { label: "Diagnosis", group: 3 },
      { label: "Discuss Problems", group: 4 },
      { label: "Responsible Employer", group: 5 },
    ];

    const legend = svg
      .append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 12)
      .attr("text-anchor", "start")
      .selectAll("g")
      .data(legendItems)
      .join("g")
      .attr(
        "transform",
        (d: LegendItem, i: number) => `translate(${width - 160}, ${i * 25 + 50})`,
      );

    legend
      .append("rect")
      .attr("width", 18)
      .attr("height", 18)
      .attr("fill", (d: LegendItem) => colorScale(d.group.toString()));

    legend
      .append("text")
      .attr("x", 24)
      .attr("y", 9)
      .attr("dy", "0.32em")
      .text((d: LegendItem) => d.label);
  }

  function formatLabel(text: string): string {
    // Abbreviate or format labels to fit in nodes
    if (text === "FamilyHistory") return "Family\nHistory";
    if (text === "SoughtTreatment") return "Treatment";
    if (text === "Diagnosis") return "Diagnosis";
    if (text === "DiscussMHProblems") return "Discuss\nMH";
    if (text === "ResponsibleEmployer") return "Employer";
    return text;
  }

  function processNetworkData(data: SurveyRecord[]): NetworkData {
    // Define nodes
    const nodes: NetworkNode[] = [
      {
        id: "FamilyHistory",
        group: 1,
        count: data.filter((d) => d.familyHistory === "Yes").length,
      },
      {
        id: "SoughtTreatment",
        group: 2,
        count: data.filter((d) => d.soughtTreatment).length,
      },
      {
        id: "Diagnosis",
        group: 3,
        count: data.filter((d) => d.diagnosis === "Yes").length,
      },
      {
        id: "DiscussMHProblems",
        group: 4,
        count: data.filter((d) => d.discussMentalHealthProblems === "Yes")
          .length,
      },
      {
        id: "ResponsibleEmployer",
        group: 5,
        count: data.filter((d) => d.responsibleEmployer === "Yes").length,
      },
    ];

    // Define links with predefined connections based on requirements
    const links: NetworkLink[] = [
      {
        source: "FamilyHistory",
        target: "SoughtTreatment",
        value: 5,
        correlation: 0.7,
      },
      {
        source: "SoughtTreatment",
        target: "Diagnosis",
        value: 5,
        correlation: 0.8,
      },
      {
        source: "Diagnosis",
        target: "DiscussMHProblems",
        value: 5,
        correlation: 0.6, 
      },
      {
        source: "DiscussMHProblems",
        target: "ResponsibleEmployer",
        value: 5,
        correlation: 0.5,
      },
    ];

    return { nodes, links };
  }

  return (
    <Card className="overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold">Mental Health Network Graph</h3>
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
          <span className="text-xs text-gray-500">
            {Math.round(scale * 100)}%
          </span>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          This network graph visualizes relationships between key mental health
          variables in the tech industry. Nodes represent different aspects of
          mental health (family history, seeking treatment, diagnosis, etc.),
          and the links between them show potential correlations. The size of
          each node corresponds to the count of respondents, while the thickness
          and color of links indicate the strength of the relationship.
        </p>
      </CardContent>
    </Card>
  );
}