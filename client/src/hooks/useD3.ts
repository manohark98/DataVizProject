import { useRef, useEffect } from "react";
import * as d3 from "d3";

export function useD3(renderChartFn: (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => void, dependencies: any[] = []) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (ref.current) {
      const svg = d3.select(ref.current);
      renderChartFn(svg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return ref;
}
