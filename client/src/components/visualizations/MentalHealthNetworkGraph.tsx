import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { useDataContext } from "@/hooks/useDataContext";
import * as d3 from "d3";
import { SurveyRecord } from "@/types";

interface NetworkNode {
  id: string;
  group: number;
  count: number;
  x?: number;
  y?: number;
}

interface NetworkLink {
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
    setScale((prevScale) => Math.max(prevScale - 0.2, 0.1));
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

    // Dimensions
    const width = 100;
    const height = 75;
    const margin = { top: 3, right: 3, bottom: 3, left: 3 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Build network data
    const networkData = processNetworkData(filteredData);

    // Convert any string source/target into references to the actual node objects
    networkData.links.forEach((link) => {
      if (typeof link.source === "string") {
        link.source = networkData.nodes.find((n) => n.id === link.source)!;
      }
      if (typeof link.target === "string") {
        link.target = networkData.nodes.find((n) => n.id === link.target)!;
      }
    });

    // --------------------------------------
    // 1) Define a scale for node radii so big counts don't overlap too much
    //    Adjust [3, 15] to whichever min/max circle size suits your data best
    // --------------------------------------
    const maxCount = d3.max(networkData.nodes, (d) => d.count) || 1;
    const radiusScale = d3
      .scaleSqrt<number, number>()
      .domain([0, maxCount])
      .range([3, 15]);

    // --------------------------------------
    // 2) Place the nodes in a circular layout
    //    so they won't overlap as heavily.
    //
    //    We base the circle radius on the largest node size,
    //    plus some extra spacing (30 + maxNodeRadius).
    //    Feel free to tweak these constants.
    // --------------------------------------
    const maxNodeRadius =
      d3.max(networkData.nodes, (d) => radiusScale(d.count)) || 0;
    const layoutRadius = 30 + maxNodeRadius; // How far out from the center to place nodes

    const centerX = innerWidth / 2;
    const centerY = innerHeight / 2;

    networkData.nodes.forEach((node, i) => {
      const angle = (i / networkData.nodes.length) * 2 * Math.PI;
      node.x = centerX + layoutRadius * Math.cos(angle);
      node.y = centerY + layoutRadius * Math.sin(angle);
    });

    // Create main <g> container with scaling/zoom
    const g = svg
      .append("g")
      .attr(
        "transform",
        `translate(${margin.left}, ${margin.top}) scale(${currentScale})`,
      );

    // Color palette for groups
    const colorScale = d3.scaleOrdinal<string>(d3.schemeCategory10);

    // --------------------------------------
    // Draw links
    // --------------------------------------
    const link = g
      .append("g")
      .selectAll("line")
      .data(networkData.links)
      .join("line")
      .attr("stroke-width", (d) => Math.sqrt(d.value) * 2)
      .attr("stroke", (d) => d3.interpolateViridis(d.correlation))
      .attr("stroke-opacity", 0.8)
      .attr("x1", (d) => (d.source as NetworkNode).x ?? 0)
      .attr("y1", (d) => (d.source as NetworkNode).y ?? 0)
      .attr("x2", (d) => (d.target as NetworkNode).x ?? 0)
      .attr("y2", (d) => (d.target as NetworkNode).y ?? 0);

    // --------------------------------------
    // Draw nodes
    // --------------------------------------
    const nodeGroup = g
      .append("g")
      .selectAll<SVGGElement, NetworkNode>(".node")
      .data(networkData.nodes)
      .join("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
      .call(
        d3
          .drag<SVGGElement, NetworkNode>()
          .on("start", dragstarted)
          .on("drag", (event, d) => dragged(event, d, link))
          .on("end", dragended),
      );

    // Circle for each node
    nodeGroup
      .append("circle")
      .attr("r", (d) => radiusScale(d.count))
      .attr("fill", (d) => colorScale(d.group.toString()))
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5);

    // Label (tiny text)
    nodeGroup
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("font-size", "4px")
      .attr("font-weight", "bold")
      .text((d) => formatLabel(d.id));

    // Tooltip
    nodeGroup.append("title").text((d) => `${d.id}\nCount: ${d.count}`);

    // Drag event helpers
    function dragstarted(
      event: d3.D3DragEvent<SVGGElement, NetworkNode, unknown>,
      d: NetworkNode,
    ) {
      d3.select(event.sourceEvent.currentTarget).raise();
    }

    // On drag, move node + update connected links
    function dragged(
      event: d3.D3DragEvent<SVGGElement, NetworkNode, unknown>,
      d: NetworkNode,
      linkSelection: d3.Selection<
        SVGLineElement,
        NetworkLink,
        SVGGElement,
        unknown
      >,
    ) {
      d.x = event.x;
      d.y = event.y;
      d3.select(event.sourceEvent.currentTarget).attr(
        "transform",
        `translate(${d.x}, ${d.y})`,
      );

      // Update the lines
      linkSelection
        .attr("x1", (l) => (l.source as NetworkNode).x ?? 0)
        .attr("y1", (l) => (l.source as NetworkNode).y ?? 0)
        .attr("x2", (l) => (l.target as NetworkNode).x ?? 0)
        .attr("y2", (l) => (l.target as NetworkNode).y ?? 0);
    }

    function dragended(
      event: d3.D3DragEvent<SVGGElement, NetworkNode, unknown>,
      d: NetworkNode,
    ) {
      // No action needed
    }

    // (Optional) Title text
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 8)
      .attr("text-anchor", "middle")
      .attr("font-size", "6px")
      .attr("font-weight", "bold");

    // --------------------------------------
    // Legend
    // --------------------------------------
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
      .attr("font-size", 3)
      .attr("text-anchor", "start")
      .selectAll("g")
      .data(legendItems)
      .join("g")
      .attr("transform", (_d, i) => `translate(${width - 40}, ${i * 6 + 15})`);

    legend
      .append("rect")
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", (d) => colorScale(d.group.toString()));

    legend
      .append("text")
      .attr("x", 24)
      .attr("y", 9.5)
      .attr("dy", "0.32em")
      .text((d) => d.label);
  }

  function formatLabel(text: string): string {
    // Abbreviate or rename as desired
    if (text === "FamilyHistory") return "Family History";
    if (text === "SoughtTreatment") return "Treatment";
    if (text === "Diagnosis") return "Diagnosis";
    if (text === "DiscussMHProblems") return "Discuss Mental Health";
    if (text === "ResponsibleEmployer") return "Employer";
    return text;
  }

  function processNetworkData(data: SurveyRecord[]): NetworkData {
    // Create 5 nodes
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

    // Example: connect them in a loop
    const links: NetworkLink[] = [
      {
        source: "ResponsibleEmployer",
        target: "SoughtTreatment",
        value: 1,
        correlation: 0.8,
      },
      {
        source: "SoughtTreatment",
        target: "FamilyHistory",
        value: 1,
        correlation: 0.8,
      },
      {
        source: "FamilyHistory",
        target: "Diagnosis",
        value: 1,
        correlation: 0.8,
      },
      {
        source: "Diagnosis",
        target: "DiscussMHProblems",
        value: 1,
        correlation: 0.8,
      },
      {
        source: "DiscussMHProblems",
        target: "ResponsibleEmployer",
        value: 1,
        correlation: 0.8,
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
            disabled={scale <= 0.1}
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
          variables in the tech industry. Nodes are placed in a circle to reduce
          overlap, with each node sized according to how many respondents said
          “Yes” to that item. You can drag nodes around to rearrange them as
          needed.
        </p>
      </CardContent>
    </Card>
  );
}
