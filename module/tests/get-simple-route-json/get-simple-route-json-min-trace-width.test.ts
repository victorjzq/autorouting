import { test, expect } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getSimpleRouteJson } from "solver-utils"

test("minTraceWidth defaults to 0.1 when not in circuit_json", () => {
  const simpleRouteJson = getSimpleRouteJson([] as AnyCircuitElement[])
  expect(simpleRouteJson.minTraceWidth).toBe(0.1)
})

test("minTraceWidth can be overridden via opts", () => {
  const simpleRouteJson = getSimpleRouteJson([] as AnyCircuitElement[], {
    minTraceWidth: 0.2,
  })
  expect(simpleRouteJson.minTraceWidth).toBe(0.2)
})

test("minTraceWidth is reduced by source_trace min_trace_thickness", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "source_trace",
      source_trace_id: "source_trace_1",
      connected_source_port_ids: [],
      connected_source_net_ids: [],
      min_trace_thickness: 0.05,
    } as any,
  ]
  const simpleRouteJson = getSimpleRouteJson(circuitJson)
  // 0.05 < 0.1 default, so minTraceWidth should be 0.05
  expect(simpleRouteJson.minTraceWidth).toBe(0.05)
})

test("minTraceWidth is not increased by source_trace min_trace_thickness larger than default", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "source_trace",
      source_trace_id: "source_trace_1",
      connected_source_port_ids: [],
      connected_source_net_ids: [],
      min_trace_thickness: 0.3,
    } as any,
  ]
  const simpleRouteJson = getSimpleRouteJson(circuitJson)
  // 0.3 > 0.1 default, so minTraceWidth stays at 0.1
  expect(simpleRouteJson.minTraceWidth).toBe(0.1)
})

test("minTraceWidth is reduced by source_net trace_width when smaller than default", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "source_net",
      source_net_id: "source_net_1",
      name: "GND",
      member_source_group_ids: [],
      trace_width: 0.05,
    } as any,
  ]
  const simpleRouteJson = getSimpleRouteJson(circuitJson)
  // 0.05 < 0.1 default, so minTraceWidth should be 0.05
  expect(simpleRouteJson.minTraceWidth).toBe(0.05)
})

test("minTraceWidth uses the minimum value when multiple source elements specify it", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "source_trace",
      source_trace_id: "source_trace_1",
      connected_source_port_ids: [],
      connected_source_net_ids: [],
      min_trace_thickness: 0.08,
    } as any,
    {
      type: "source_net",
      source_net_id: "source_net_1",
      name: "VCC",
      member_source_group_ids: [],
      trace_width: 0.06,
    } as any,
  ]
  const simpleRouteJson = getSimpleRouteJson(circuitJson)
  // min of default(0.1), 0.08, 0.06 = 0.06
  expect(simpleRouteJson.minTraceWidth).toBe(0.06)
})
