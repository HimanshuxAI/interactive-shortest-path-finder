import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  GraphData,
  GraphNode,
  GraphEdge,
  DijkstraStep,
  AlgorithmState,
  EditorState,
  AppState,
  AppAction,
  Point,
} from '../types/graph';
import { computeDijkstraSteps } from '../algorithms/dijkstra';

type StoreState = AppState & {
  dispatch: (action: AppAction) => void;
  addNodeAt: (position: Point, label?: string) => void;
  startEdgeFrom: (nodeId: string) => void;
  completeEdgeTo: (targetId: string, weight: number) => void;
  runAlgorithm: (source: string, target: string) => void;
  stepForward: () => void;
  stepBackward: () => void;
  togglePlayback: () => void;
  setPlaybackSpeed: (speed: number) => void;
  resetAlgorithm: () => void;
  applyCurrentStep: () => void;
  saveGraph: () => void;
  loadGraph: () => void;
  exportGraph: () => void;
  exportImage: (svgElement: SVGSVGElement | null) => void;
};

const STORAGE_KEY = 'shortest-path-finder-graph';
const MAX_HISTORY = 50;

function generateNodeId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function generateEdgeId(): string {
  return `edge_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

const defaultGraph: GraphData = { nodes: [], edges: [] };

const defaultAlgorithm: AlgorithmState = {
  status: 'idle',
  steps: [],
  currentStepIndex: -1,
  sourceNode: null,
  targetNode: null,
  playbackSpeed: 1,
  isPlaying: false,
};

const defaultEditor: EditorState = {
  mode: 'select',
  pendingEdgeSource: null,
  hoveredNode: null,
  hoveredEdge: null,
  editingWeightEdge: null,
};

const defaultViewport = { x: 0, y: 0, scale: 1 };

const initialState: AppState = {
  graph: defaultGraph,
  algorithm: defaultAlgorithm,
  editor: defaultEditor,
  history: [defaultGraph],
  historyIndex: 0,
  viewport: defaultViewport,
};

function pushHistory(state: AppState, newGraph: GraphData): AppState {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(newGraph);
  if (newHistory.length > MAX_HISTORY) newHistory.shift();
  return { ...state, graph: newGraph, history: newHistory, historyIndex: newHistory.length - 1 };
}

function applyStepToGraph(graph: GraphData, step: DijkstraStep, sourceNode: string | null, targetNode: string | null): GraphData {
  const { nodes, edges } = graph;
  const pathSet = new Set(step.path ?? []);
  const isPathNode = (id: string) => pathSet.has(id);
  const isPathEdge = (edge: GraphEdge) => step.path && step.path.includes(edge.source) && step.path.includes(edge.target);

  return {
    nodes: nodes.map(n => {
      let nodeState: GraphNode['state'] = 'unvisited';
      if (isPathNode(n.id)) nodeState = 'path';
      else if (n.id === step.node && step.type === 'visit') nodeState = 'current';
      else if (n.id === step.node && step.type === 'relax') nodeState = 'current';
      else if (step.settled.includes(n.id)) nodeState = 'settled';
      else if (step.visited.includes(n.id) && !step.settled.includes(n.id)) nodeState = 'frontier';
      if (n.id === sourceNode) nodeState = 'source';
      if (n.id === targetNode) nodeState = 'target';
      return { ...n, state: nodeState, distance: step.distances[n.id] ?? null };
    }),
    edges: edges.map(e => {
      let edgeState: GraphEdge['state'] = 'default';
      let flowProgress = 0;
      if (step.type === 'relax' && e.id === step.edge) {
        edgeState = 'relaxed';
        flowProgress = 1;
      } else if (step.type === 'visit' && e.source === step.node) {
        edgeState = 'current';
      } else if (isPathEdge(e)) {
        edgeState = 'path';
        flowProgress = 1;
      }
      return { ...e, state: edgeState, flowProgress };
    }),
  };
}

export const useGraphStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...initialState,

      dispatch: (action: AppAction) => {
        const state = get();

        switch (action.type) {
          case 'SET_MODE': {
            set({ editor: { ...state.editor, mode: action.mode } });
            break;
          }

          case 'ADD_NODE': {
            const newGraph: GraphData = {
              nodes: [...state.graph.nodes, action.node],
              edges: state.graph.edges,
            };
            set(pushHistory(state, newGraph));
            break;
          }

          case 'UPDATE_NODE': {
            const newGraph: GraphData = {
              nodes: state.graph.nodes.map(n => (n.id === action.id ? { ...n, ...action.updates } : n)),
              edges: state.graph.edges,
            };
            set(pushHistory(state, newGraph));
            break;
          }

          case 'REMOVE_NODE': {
            const newGraph: GraphData = {
              nodes: state.graph.nodes.filter(n => n.id !== action.id),
              edges: state.graph.edges.filter(e => e.source !== action.id && e.target !== action.id),
            };
            set(pushHistory(state, newGraph));
            break;
          }

          case 'ADD_EDGE': {
            const newGraph: GraphData = {
              nodes: state.graph.nodes,
              edges: [...state.graph.edges, action.edge],
            };
            set(pushHistory(state, newGraph));
            break;
          }

          case 'UPDATE_EDGE': {
            const newGraph: GraphData = {
              nodes: state.graph.nodes,
              edges: state.graph.edges.map(e => (e.id === action.id ? { ...e, ...action.updates } : e)),
            };
            set(pushHistory(state, newGraph));
            break;
          }

          case 'REMOVE_EDGE': {
            const newGraph: GraphData = {
              nodes: state.graph.nodes,
              edges: state.graph.edges.filter(e => e.id !== action.id),
            };
            set(pushHistory(state, newGraph));
            break;
          }

          case 'SET_PENDING_EDGE_SOURCE': {
            set({ editor: { ...state.editor, pendingEdgeSource: action.id } });
            break;
          }

          case 'SET_HOVERED_NODE': {
            set({ editor: { ...state.editor, hoveredNode: action.id } });
            break;
          }

          case 'SET_HOVERED_EDGE': {
            set({ editor: { ...state.editor, hoveredEdge: action.id } });
            break;
          }

          case 'SET_EDITING_WEIGHT': {
            set({ editor: { ...state.editor, editingWeightEdge: action.id } });
            break;
          }

          case 'UPDATE_WEIGHT': {
            const newGraph: GraphData = {
              nodes: state.graph.nodes,
              edges: state.graph.edges.map(e => (e.id === action.edgeId ? { ...e, weight: action.weight } : e)),
            };
            set(pushHistory(state, newGraph));
            break;
          }

          case 'RESET_GRAPH': {
            set(pushHistory(state, defaultGraph));
            break;
          }

          case 'UNDO': {
            if (state.historyIndex <= 0) break;
            set({ graph: state.history[state.historyIndex - 1], historyIndex: state.historyIndex - 1 });
            break;
          }

          case 'REDO': {
            if (state.historyIndex >= state.history.length - 1) break;
            set({ graph: state.history[state.historyIndex + 1], historyIndex: state.historyIndex + 1 });
            break;
          }

          case 'LOAD_GRAPH': {
            const newHistory = [action.graph];
            set({ graph: action.graph, history: newHistory, historyIndex: 0, algorithm: defaultAlgorithm });
            break;
          }

          case 'SET_VIEWPORT': {
            set({ viewport: action.viewport });
            break;
          }

          case 'START': {
            if (!action.source || !action.target) break;
            const steps = computeDijkstraSteps(state.graph.nodes, state.graph.edges, action.source, action.target);
            set({
              algorithm: {
                ...state.algorithm,
                status: 'running',
                steps,
                currentStepIndex: 0,
                sourceNode: action.source,
                targetNode: action.target,
                isPlaying: true,
              },
            });
            break;
          }

          case 'SET_STEPS': {
            set({ algorithm: { ...state.algorithm, steps: action.steps, currentStepIndex: 0 } });
            break;
          }

          case 'NEXT_STEP': {
            if (state.algorithm.currentStepIndex >= state.algorithm.steps.length - 1) break;
            set({ algorithm: { ...state.algorithm, currentStepIndex: state.algorithm.currentStepIndex + 1 } });
            break;
          }

          case 'PREV_STEP': {
            if (state.algorithm.currentStepIndex <= 0) break;
            set({ algorithm: { ...state.algorithm, currentStepIndex: state.algorithm.currentStepIndex - 1 } });
            break;
          }

          case 'GOTO_STEP': {
            const idx = Math.max(0, Math.min(action.index, state.algorithm.steps.length - 1));
            set({ algorithm: { ...state.algorithm, currentStepIndex: idx } });
            break;
          }

          case 'PLAY': {
            set({ algorithm: { ...state.algorithm, isPlaying: true, status: 'running' } });
            break;
          }

          case 'PAUSE': {
            set({ algorithm: { ...state.algorithm, isPlaying: false } });
            break;
          }

          case 'SET_SPEED': {
            set({ algorithm: { ...state.algorithm, playbackSpeed: action.speed } });
            break;
          }

          case 'RESET': {
            set({
              algorithm: { ...defaultAlgorithm, playbackSpeed: state.algorithm.playbackSpeed },
              graph: {
                nodes: state.graph.nodes.map(n => ({ ...n, state: 'unvisited' as const, distance: null })),
                edges: state.graph.edges.map(e => ({ ...e, state: 'default' as const, flowProgress: 0 })),
              },
            });
            break;
          }

          case 'APPLY_STEP': {
            const step = action.step;
            const newGraph = applyStepToGraph(state.graph, step, state.algorithm.sourceNode, state.algorithm.targetNode);
            const newStatus = step.type === 'complete' ? 'complete' : step.type === 'no-path' ? 'no-path' : 'running';
            set({
              graph: newGraph,
              algorithm: { ...state.algorithm, status: newStatus, currentStepIndex: state.algorithm.steps.indexOf(step) },
            });
            break;
          }
        }
      },

      addNodeAt: (position: Point, label?: string) => {
        const state = get();
        const nodeCount = state.graph.nodes.length;
        const defaultLabel = label || String.fromCharCode(65 + (nodeCount % 26)) + (nodeCount >= 26 ? Math.floor(nodeCount / 26) : '');
        get().dispatch({
          type: 'ADD_NODE',
          node: { id: generateNodeId(), label: defaultLabel, position, state: 'unvisited', distance: null },
        });
      },

      startEdgeFrom: (nodeId: string) => {
        get().dispatch({ type: 'SET_MODE', mode: 'addEdge' });
        get().dispatch({ type: 'SET_PENDING_EDGE_SOURCE', id: nodeId });
      },

      completeEdgeTo: (targetId: string, weight: number) => {
        const state = get();
        const { pendingEdgeSource } = state.editor;
        if (!pendingEdgeSource || pendingEdgeSource === targetId) {
          get().dispatch({ type: 'SET_MODE', mode: 'select' });
          get().dispatch({ type: 'SET_PENDING_EDGE_SOURCE', id: null });
          return;
        }
        const exists = state.graph.edges.some(e => e.source === pendingEdgeSource && e.target === targetId);
        if (!exists) {
          get().dispatch({
            type: 'ADD_EDGE',
            edge: { id: generateEdgeId(), source: pendingEdgeSource, target: targetId, weight, state: 'default', flowProgress: 0 },
          });
        }
        get().dispatch({ type: 'SET_MODE', mode: 'select' });
        get().dispatch({ type: 'SET_PENDING_EDGE_SOURCE', id: null });
      },

      runAlgorithm: (source: string, target: string) => {
        get().dispatch({ type: 'START', source, target });
      },

      stepForward: () => get().dispatch({ type: 'NEXT_STEP' }),
      stepBackward: () => get().dispatch({ type: 'PREV_STEP' }),

      togglePlayback: () => {
        const { isPlaying } = get().algorithm;
        if (isPlaying) {
          get().dispatch({ type: 'PAUSE' });
        } else {
          get().dispatch({ type: 'PLAY' });
        }
      },

      setPlaybackSpeed: (speed: number) => get().dispatch({ type: 'SET_SPEED', speed }),

      resetAlgorithm: () => get().dispatch({ type: 'RESET' }),

      applyCurrentStep: () => {
        const { steps, currentStepIndex } = get().algorithm;
        if (currentStepIndex >= 0 && currentStepIndex < steps.length) {
          get().dispatch({ type: 'APPLY_STEP', step: steps[currentStepIndex] });
        }
      },

      saveGraph: () => {
        const data = JSON.stringify(get().graph, null, 2);
        localStorage.setItem(STORAGE_KEY, data);
      },

      loadGraph: () => {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
          try {
            const graph = JSON.parse(data);
            get().dispatch({ type: 'LOAD_GRAPH', graph });
          } catch (e) {
            console.error('Failed to load graph:', e);
          }
        }
      },

      exportGraph: () => {
        const data = JSON.stringify(get().graph, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `graph-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },

      exportImage: (svgElement: SVGSVGElement | null) => {
        if (!svgElement) return;
        const serializer = new XMLSerializer();
        const source = serializer.serializeToString(svgElement);
        const blob = new Blob([source], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `graph-${Date.now()}.svg`;
        a.click();
        URL.revokeObjectURL(url);
      },
    }),
    {
      name: 'shortest-path-finder-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ graph: state.graph }),
    }
  )
);