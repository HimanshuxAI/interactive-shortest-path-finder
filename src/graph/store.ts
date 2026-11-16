import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  GraphData,
  AlgorithmState,
  EditorState,
  AppState,
  AppAction,
  Point,
} from '../types/graph';
import { computeDijkstraSteps } from '../algorithms/dijkstra';
import { applyStepToGraph, statusForStep } from './graphState';
import { createDefaultGraph } from './defaultGraph';
import { computeGraphBounds, serializeSvgForExport } from './svgExport';
import { nodeSize } from '../styles/tokens';

type StoreState = AppState & {
  dispatch: (action: AppAction) => void;
  addNodeAt: (position: Point, label?: string) => void;
  stepForward: () => void;
  stepBackward: () => void;
  togglePlayback: () => void;
  setPlaybackSpeed: (speed: number) => void;
  resetAlgorithm: () => void;
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
  draggingNode: null,
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

          case 'SET_DRAGGING_NODE': {
            set({ editor: { ...state.editor, draggingNode: action.id } });
            break;
          }

          case 'MOVE_NODE': {
            // Live drag updates skip the history stack; COMMIT_GRAPH records the result.
            set({
              graph: {
                nodes: state.graph.nodes.map(n => (n.id === action.id ? { ...n, position: action.position } : n)),
                edges: state.graph.edges,
              },
            });
            break;
          }

          case 'COMMIT_GRAPH': {
            set(pushHistory(state, state.graph));
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
            // Reloading the sample is the sensible "start over" here; wiping to
            // an empty canvas is easy to trigger and hard to recover from.
            set({
              ...pushHistory(state, createDefaultGraph()),
              algorithm: { ...defaultAlgorithm, playbackSpeed: state.algorithm.playbackSpeed },
            });
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
              graph: applyStepToGraph(state.graph, steps[0], action.source, action.target),
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

          case 'SET_ENDPOINTS': {
            const source = action.source !== undefined ? action.source : state.algorithm.sourceNode;
            const target = action.target !== undefined ? action.target : state.algorithm.targetNode;
            if (source && target && source !== target) {
              const steps = computeDijkstraSteps(state.graph.nodes, state.graph.edges, source, target);
              set({
                graph: applyStepToGraph(state.graph, steps[0], source, target),
                algorithm: {
                  ...state.algorithm,
                  status: 'running',
                  steps,
                  currentStepIndex: 0,
                  sourceNode: source,
                  targetNode: target,
                  isPlaying: true,
                },
              });
            } else {
              set({ algorithm: { ...state.algorithm, sourceNode: source, targetNode: target } });
            }
            break;
          }

          case 'SET_STEPS': {
            if (action.steps.length === 0) {
              set({ algorithm: { ...state.algorithm, steps: [], currentStepIndex: -1 } });
              break;
            }
            set({
              graph: applyStepToGraph(state.graph, action.steps[0], state.algorithm.sourceNode, state.algorithm.targetNode),
              algorithm: { ...state.algorithm, steps: action.steps, currentStepIndex: 0, status: 'running' },
            });
            break;
          }

          case 'NEXT_STEP': {
            const { steps, currentStepIndex, sourceNode, targetNode } = state.algorithm;
            if (steps.length === 0) break;
            if (currentStepIndex >= steps.length - 1) {
              set({ algorithm: { ...state.algorithm, isPlaying: false, status: statusForStep(steps[steps.length - 1]) } });
              break;
            }
            const nextIndex = currentStepIndex + 1;
            const nextStep = steps[nextIndex];
            set({
              graph: applyStepToGraph(state.graph, nextStep, sourceNode, targetNode),
              algorithm: {
                ...state.algorithm,
                currentStepIndex: nextIndex,
                status: statusForStep(nextStep),
                isPlaying: nextStep.type === 'complete' || nextStep.type === 'no-path' ? false : state.algorithm.isPlaying,
              },
            });
            break;
          }

          case 'PREV_STEP': {
            const { steps, currentStepIndex, sourceNode, targetNode } = state.algorithm;
            if (steps.length === 0 || currentStepIndex <= 0) break;
            const prevIndex = currentStepIndex - 1;
            const prevStep = steps[prevIndex];
            set({
              graph: applyStepToGraph(state.graph, prevStep, sourceNode, targetNode),
              algorithm: {
                ...state.algorithm,
                currentStepIndex: prevIndex,
                status: statusForStep(prevStep),
                isPlaying: false,
              },
            });
            break;
          }

          case 'GOTO_STEP': {
            const { steps, sourceNode, targetNode } = state.algorithm;
            if (steps.length === 0) break;
            const idx = Math.max(0, Math.min(action.index, steps.length - 1));
            const step = steps[idx];
            set({
              graph: applyStepToGraph(state.graph, step, sourceNode, targetNode),
              algorithm: {
                ...state.algorithm,
                currentStepIndex: idx,
                status: statusForStep(step),
                isPlaying: false,
              },
            });
            break;
          }

          case 'PLAY': {
            const { steps, currentStepIndex, sourceNode, targetNode } = state.algorithm;
            if (steps.length === 0) break;
            if (currentStepIndex >= steps.length - 1) {
              // Replay from the top.
              set({
                graph: applyStepToGraph(state.graph, steps[0], sourceNode, targetNode),
                algorithm: { ...state.algorithm, currentStepIndex: 0, status: 'running', isPlaying: true },
              });
              break;
            }
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
        const bounds = computeGraphBounds(get().graph.nodes, nodeSize.default);
        const source = serializeSvgForExport(svgElement, bounds);
        const blob = new Blob([source], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shortest-path-${Date.now()}.svg`;
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