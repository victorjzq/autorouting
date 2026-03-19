import { getSimpleRouteJson } from "solver-utils"
import { test, expect } from "bun:test"
import { Circuit } from "@tscircuit/core"
import { getDebugSvg } from "../../infinite-grid-ijump-astar/tests/fixtures/get-debug-svg"
import { MultilayerIjump } from "../MultilayerIjump"

const OneByOnePad = (props: {
  name: string
  pcbX?: number
  pcbY?: number
  layer: string
}) => (
  <chip name={props.name} pcbX={props.pcbX} pcbY={props.pcbY}>
    <footprint>
      <smtpad
        pcbX={0}
        pcbY={0}
        shape="rect"
        width="1mm"
        height="1mm"
        layer={props.layer as any}
        portHints={["pin1"]}
      />
    </footprint>
  </chip>
)

test("multi-layer-ijump does not produce wild trace jumps when detouring around obstacle", () => {
  const circuit = new Circuit()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <OneByOnePad name="U1" pcbX={-5} pcbY={3} layer="top" />
      <OneByOnePad name="U2" pcbX={5} pcbY={-3} layer="bottom" />
      <OneByOnePad name="U_obstacle" pcbX={-1} pcbY={3} layer="top" />
      <trace from=".U1 > .pin1" to=".U2 > .pin1" />
    </board>,
  )

  const inputCircuitJson = circuit.getCircuitJson()

  const input = getSimpleRouteJson(inputCircuitJson, { layerCount: 2 })

  const autorouter = new MultilayerIjump({
    input,
    VIA_COST: 1,
    debug: true,
  })

  const solution = autorouter.solveAndMapToTraces()

  expect(
    getDebugSvg({ inputCircuitJson, autorouter, solution }),
  ).toMatchSvgSnapshot(import.meta.path)

  expect(solution).toHaveLength(1)

  const traces = solution[0].route
  for (const point of traces) {
    if (point.route_type === "wire") {
      expect(point.y).toBeLessThanOrEqual(5)
      expect(point.y).toBeGreaterThanOrEqual(-5)
    }
  }
})
