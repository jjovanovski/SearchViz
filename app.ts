namespace SearchViz {

    let INF = 999999999;
    let SUBTREE_SPACING = 60;

    class Problem {

        nodes: Node[];
        startNode: Node;
        goalNode: Node;

        constructor(nodes: Node[], startNode: Node, goalNode: Node) {
            this.nodes = nodes;
            this.startNode = startNode;
            this.goalNode = goalNode;
        }

    }

    class Node {

        index: number;
        name: string;
        edges: Edge[];

        cost: number;
        heuristic: number;
        visited: boolean;

        constructor(index: number, name: string) {
            this.index = index;
            this.name = name;
            this.edges = [];

            this.cost = INF;
            this.heuristic = 0;
            this.visited = false;
        }

        addEdge(nodeTo: Node, cost: number) {
            this.edges.push(new Edge(this, nodeTo, cost));
        }

    }

    class Edge {

        nodeFrom: Node;
        nodeTo: Node;
        cost: number;

        constructor(nodeFrom: Node, nodeTo:Node, cost:number) {
            this.nodeFrom = nodeFrom;
            this.nodeTo = nodeTo;
            this.cost = cost;
        }

    }

    class Algorithm {

        name: string;
        problem: Problem;

        constructor(name: string) {
            this.name = name;
        }

        run() {
            // OVERRIDE
        }

        step() {
            // OVERRIDE
        }

        finish() {
            // OVERRIDE
        }

        reset() {
            // OVERRIDE
        }

    }

    class AlgorithmRenderer {

        canvas: HTMLCanvasElement;
        ctx: CanvasRenderingContext2D;

        canvasWidth: number;
        canvasHeight: number;

        constructor(public canvasId: string) {
            this.canvas = <HTMLCanvasElement> document.getElementById(this.canvasId);
            this.ctx = this.canvas.getContext("2d");
            this.canvasWidth = this.canvas.width;
            this.canvasHeight = this.canvas.height;
        }

        clear() {
            this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        }

    }

    /* ============ UTILITY CLASSES ============ */

    // very inefficient implementation
    class PriorityQueue<T> {

        items: T[];
        count: number;
        compareFunction: Function;

        constructor(compareFunction: Function) {
            this.items = [];
            this.count = 0;
            this.compareFunction = compareFunction;
        }

        enqueue(item: T) {
            this.items.push(item);
            this.items.sort((a: T, b: T) => {
                return -this.compareFunction.call(this, a, b);
            });

            this.count++;
        }

        dequeue(): T {
            if(this.count <= 0)
                return undefined;   // handle this better? 

            this.count--;
            return this.items.pop();
        }

        peek(): T {
            if(this.count <= 0)
                return undefined;   // handle this better?

            return this.items[this.items.length - 1];
        }

        size(): number {
            return this.count;
        }

        isEmpty(): boolean {
            return this.count == 0;
        }

        clear(): void {
            this.items = [];
            this.count = 0;
        }

    }

    /* ============ A* ALGORITHM ============ */

    enum AStarNodeState {
        Undiscovered,
        Discovered,
        Expanded,
        Goal
    }

    class AStarNode {

        index: number;
        state: AStarNodeState;
        adj: AStarNode[];

        cost: number;
        heuristic: number;
        f: number;

        label: string;
        x: number;
        y: number;
        width: number;
        height: number;
        padding: number;
        borderColor: string;
        backgroundColor: string;
        labelColor: string;

        subtreeWidth: number;

        constructor(index: number, label: string, heuristic: number) {
            this.index = index;
            this.state = AStarNodeState.Undiscovered;
            this.adj = [];

            this.cost = INF;
            this.heuristic = heuristic;
            this.f = INF;

            this.label = label;
            this.x = 0;
            this.y = 0;
            this.width = 18;
            this.height = 18;
            this.padding = 10;
            this.borderColor = "#444";
            this.labelColor = "#444";

            this.subtreeWidth = -1;
        }

        setCost(cost: number) {
            this.cost = cost;
            this.f = this.cost + this.heuristic;
        }

        setupStyle(ctx: CanvasRenderingContext2D) {
            if(this.state === AStarNodeState.Discovered) {
                this.backgroundColor = "#ffffff";
            } else if(this.state === AStarNodeState.Expanded) {
                this.backgroundColor = "#ffff00";
            } else if(this.state === AStarNodeState.Goal) {
                this.backgroundColor = "#00ff00";
            }

            ctx.font = "18px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            var textSize = ctx.measureText(this.label);
            this.width = textSize.width + this.padding;
            this.height = 18 + this.padding;
        }

        render(ctx: CanvasRenderingContext2D) {
            this.setupStyle(ctx);

            ctx.beginPath();
            ctx.rect(this.x - this.width/2.0, this.y - this.height/2.0, this.width, this.height);
            // draw border
            ctx.strokeStyle = this.borderColor;
            ctx.stroke();
            // draw background
            ctx.fillStyle = this.backgroundColor;
            ctx.fill();
            ctx.closePath();
            // draw label
            ctx.font = "18px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = this.labelColor;
            ctx.fillText(this.label, this.x, this.y);

            ctx.font = "12px Arial";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            // draw cost label
            let costStr = "g: " + (this.cost == INF ? "infinity" : this.cost);
            ctx.fillStyle = "#ff4838";
            ctx.fillText(costStr, this.x - this.width/2 - 5 - ctx.measureText(costStr).width, this.y - 8);
            // draw heuristic label
            let heurStr = "h: " + this.heuristic;
            ctx.fillStyle = "#17b9ef";
            ctx.fillText(heurStr, this.x - this.width/2 - 5 - ctx.measureText(heurStr).width, this.y + 8);
            // draw f label
            let fStr = "f: " + this.f;
            ctx.fillStyle = "#1ca81e";
            ctx.fillText(fStr, this.x + this.width/2 + 5, this.y);
        }

    }

    class AStar extends Algorithm {

        renderer: AStarRenderer;

        astarTreeNodes: AStarNode[];
        queue: PriorityQueue<Node>;

        constructor(canvasId: string) {
            super("AStar");

            this.renderer = new AStarRenderer(canvasId);
            this.queue = new PriorityQueue<Node>((a: Node, b: Node) => {
                let f_a = a.cost + a.heuristic;
                let f_b = b.cost + b.heuristic;
                if(f_a < f_b)
                    return -10;
                else if(f_a == f_b)
                    return 0;
                return 10;
            });
        }

        run() {
            // create astarnode for each node in the problem
            // (we can do this because we visit each node only once!)
            this.astarTreeNodes = [];
            for(let i = 0; i < this.problem.nodes.length; i++) {
                let node: Node = this.problem.nodes[i];
                
                let astarNode = new AStarNode(i, node.name, node.heuristic);
                astarNode.setCost(0);
                astarNode.state = AStarNodeState.Discovered;
                this.astarTreeNodes.push(astarNode);
            }

            // initialize a* queue
            this.problem.startNode.cost = 0;
            this.queue.enqueue(this.problem.startNode);

            this.renderer.render(this);
        }

        step() {
            if(this.queue.isEmpty() == false) {
                let u: Node = this.queue.dequeue();

                this.astarTreeNodes[u.index].state = AStarNodeState.Expanded;

                for(let i = 0; i < u.edges.length; i++) {
                    let edge: Edge = u.edges[i];
                    let v: Node = edge.nodeTo;

                    // exploring only unvisited nodes!
                    if(v.cost == INF) {
                        v.cost = u.cost + edge.cost;
                        this.queue.enqueue(v);

                        this.astarTreeNodes[v.index].state = AStarNodeState.Discovered;
                        this.astarTreeNodes[v.index].setCost(v.cost);
                        this.astarTreeNodes[u.index].adj.push(this.astarTreeNodes[v.index]);

                        // check for goal
                        if(v.index == this.problem.goalNode.index) {
                            this.astarTreeNodes[v.index].state = AStarNodeState.Goal;
                            
                            this.renderer.render(this);
                            return;
                        }
                    }
                }
            }

            this.renderer.render(this);
        }

    }
    
    class AStarRenderer extends AlgorithmRenderer {

        render(astar: AStar) {
            this.clear();

            let startNode = astar.astarTreeNodes[astar.problem.startNode.index];

            this.calcSubtreeWidth(startNode);
            this.renderSubtree(startNode, this.canvasWidth/2.0, 50);
        }

        renderSubtree(root: AStarNode, x: number, y: number) {
            let childX = x - root.subtreeWidth / 2.0;
            for(let i = 0; i < root.adj.length; i++) {
                let subtreeX = childX + root.adj[i].subtreeWidth/2.0;
                let subtreeY = y+50;

                // render edges
                this.ctx.beginPath();
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(subtreeX, subtreeY);
                this.ctx.stroke();
                this.ctx.closePath();

                let subtreeRoot = root.adj[i];
                this.renderSubtree(subtreeRoot, subtreeX, subtreeY);

                childX += root.adj[i].subtreeWidth + SUBTREE_SPACING;
            }

            root.x = x;
            root.y = y;
            root.render(this.ctx);
        }

        calcSubtreeWidth(root: AStarNode) {
            root.setupStyle(this.ctx);

            let subtreeWidth = 0;
            for(let i = 0; i < root.adj.length; i++) {
                let subtreeRoot = root.adj[i];
                this.calcSubtreeWidth(subtreeRoot);

                subtreeWidth += subtreeRoot.subtreeWidth;
                // add spacing
                if(i < root.adj.length-1) {
                    subtreeWidth += SUBTREE_SPACING;
                }
            }

            subtreeWidth = Math.max(subtreeWidth, root.width);
            root.subtreeWidth = subtreeWidth;
        }

    }

    /* ============ PROBLEM DEFINITION ============ */

    // create nodes
    let sk: Node = new Node(0, "Skopje");
    let te: Node = new Node(1, "Tetovo");
    let ve: Node = new Node(2, "Veles");
    let go: Node = new Node(3, "Gostivar");
    let ki: Node = new Node(4, "Kicevo");
    let sr: Node = new Node(5, "Struga");
    let bi: Node = new Node(6, "Bitola");
    let oh: Node = new Node(7, "Ohrid");

    // add edges
    sk.addEdge(te, 2);
    sk.addEdge(ve, 3);
    te.addEdge(go, 1);
    go.addEdge(ki, 3);
    go.addEdge(sr, 2);
    sr.addEdge(oh, 1);
    ki.addEdge(oh, 2);
    ve.addEdge(bi, 3);
    bi.addEdge(oh, 2);

    // add heuristics
    sk.heuristic = 10;
    te.heuristic = 9;
    go.heuristic = 8;
    ki.heuristic = 7;
    ve.heuristic = 6;
    sr.heuristic = 5;
    bi.heuristic = 9;
    oh.heuristic = 2;

    let nodes: Node[] = [sk, te, ve, go, ki, sr, bi, oh];
    let problem = new Problem(nodes, sk, oh);

    let astar: AStar = new AStar("searchviz");
    astar.problem = problem;
    astar.run();

    document.getElementById("stepBtn").onclick = () => {astar.step();};

}