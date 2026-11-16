export interface Point {
  x: number;
  y: number;
}

export interface GraphNode {
  id: string;
  label: string;
  position: Point;
  selected?: boolean;
  state: 'unvisited' | 'frontier' | 'current' | 'settled' | 'path' | 'source' | 'target';
  distance: number | null;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  state: 'default' | 'current' | 'relaxed' | 'path';
  flowProgress: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface DijkstraStep {
  type: 'init' | 'visit' | 'relax' | 'complete' | 'no-path';
  node?: string;
  edge?: string;
  distances: Record<string, number | null>;
  previous: Record<string, string | null>;
  queue: Array<{ node: string; distance: number }>;
  visited: string[];
  settled: string[];
  path?: string[];
  totalCost?: number;
  narration: string;
}

export interface AlgorithmState {
  status: 'idle' | 'running' | 'paused' | 'complete' | 'no-path';
  steps: DijkstraStep[];
  currentStepIndex: number;
  sourceNode: string | null;
  targetNode: string | null;
  playbackSpeed: number;
  isPlaying: boolean;
}

export interface EditorState {
  mode: 'select' | 'addNode' | 'addEdge';
  pendingEdgeSource: string | null;
  hoveredNode: string | null;
  hoveredEdge: string | null;
  editingWeightEdge: string | null;
}

export interface AppState {
  graph: GraphData;
  algorithm: AlgorithmState;
  editor: EditorState;
  history: GraphData[];
  historyIndex: number;
  viewport: { x: number; y: number; scale: number };
}

export type EditorAction =
  | { type: 'SET_MODE'; mode: EditorState['mode'] }
  | { type: 'ADD_NODE'; node: GraphNode }
  | { type: 'UPDATE_NODE'; id: string; updates: Partial<GraphNode> }
  | { type: 'REMOVE_NODE'; id: string }
  | { type: 'ADD_EDGE'; edge: GraphEdge }
  | { type: 'UPDATE_EDGE'; id: string; updates: Partial<GraphEdge> }
  | { type: 'REMOVE_EDGE'; id: string }
  | { type: 'SET_PENDING_EDGE_SOURCE'; id: string | null }
  | { type: 'SET_HOVERED_NODE'; id: string | null }
  | { type: 'SET_HOVERED_EDGE'; id: string | null }
  | { type: 'SET_EDITING_WEIGHT'; id: string | null }
  | { type: 'UPDATE_WEIGHT'; edgeId: string; weight: number }
  | { type: 'RESET_GRAPH' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'LOAD_GRAPH'; graph: GraphData }
  | { type: 'SET_VIEWPORT'; viewport: AppState['viewport'] };

export type AlgorithmAction =
  | { type: 'START'; source: string; target: string }
  | { type: 'SET_STEPS'; steps: DijkstraStep[] }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GOTO_STEP'; index: number }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'SET_SPEED'; speed: number }
  | { type: 'RESET' }
  | { type: 'APPLY_STEP'; step: DijkstraStep };

export type ViewportAction =
  | { type: 'SET_VIEWPORT'; viewport: AppState['viewport'] };

export type AppAction = EditorAction | AlgorithmAction | ViewportAction;