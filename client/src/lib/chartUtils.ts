import * as d3 from "d3";
import { SurveyRecord } from "@/types";

/**
 * Generate color scales for charts
 */
export function generateColorScale(type: string, domain: any[]): d3.ScaleOrdinal<string, string> {
  const colorPalettes: { [key: string]: string[] } = {
    gender: ["#4F46E5", "#10B981", "#F59E0B"],
    ageGroup: ["#4F46E5", "#10B981", "#F59E0B", "#DC2626", "#8B5CF6"],
    treatment: ["#4F46E5", "#10B981"],
    location: d3.schemeBlues[9],
    default: d3.schemeCategory10
  };

  return d3.scaleOrdinal<string>()
    .domain(domain)
    .range(colorPalettes[type] || colorPalettes.default);
}

/**
 * Create a tooltip for charts
 */
export function createTooltip(): d3.Selection<HTMLDivElement, unknown, null, undefined> {
  // First remove any existing tooltips
  d3.select("body").selectAll(".d3-tooltip").remove();
  
  return d3.select("body")
    .append("div")
    .attr("class", "d3-tooltip")
    .style("position", "absolute")
    .style("padding", "8px")
    .style("background", "rgba(0, 0, 0, 0.7)")
    .style("color", "white")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("z-index", 1000);
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Create data for age group distribution
 */
export function prepareAgeGroupData(data: SurveyRecord[]): { ageGroup: string; count: number; percentage: number }[] {
  const ageGroups: { [key: string]: number } = {};
  
  data.forEach(d => {
    if (d.ageGroup) {
      ageGroups[d.ageGroup] = (ageGroups[d.ageGroup] || 0) + 1;
    }
  });
  
  return Object.entries(ageGroups).map(([ageGroup, count]) => ({
    ageGroup,
    count,
    percentage: (count / data.length) * 100
  }));
}

/**
 * Add transition to chart elements
 */
export function addTransition(selection: d3.Selection<any, any, any, any>): d3.Transition<any, any, any, any> {
  return selection
    .transition()
    .duration(750)
    .ease(d3.easeQuadOut);
}

/**
 * Create responsive SVG container
 */
export function createResponsiveSvg(container: HTMLElement, width: number, height: number): d3.Selection<SVGSVGElement, unknown, null, undefined> {
  return d3.select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "100%");
}
