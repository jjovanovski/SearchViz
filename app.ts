namespace SearchViz {

    let INF = 999999999;
    let SUBTREE_SPACING = 90;

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

        terminated: boolean;

        constructor(name: string) {
            this.name = name;
            this.terminated = false;
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

    /* ============ TREE DRAWING ============ */

    let TREENODE_STATE_UNDISCOVERED: number = 0;
    let TREENODE_STATE_DISCOVERED: number = 1;
    let TREENODE_STATE_OPENED: number = 2;
    let TREENODE_STATE_CLOSED: number = 3;
    let TREENODE_STATE_GOAL: number = 4;

    class TreeNode {

        index: number;
        name: string;
        state: number;

        children: TreeNode[];
        expand: Function;

        x: number = 0;
        y: number = 0;
        width: number = 0;
        height: number = 0;
        padding: number = 10;
        subtreeWidth: number = 0;

        font: string = "Arial";
        fontSize: number = 16;
        fontColor: string = "#333";

        backgroundColor: string = "#ffff00";
        borderColor: string = "#333";

        constructor(index: number, name: string) {
            this.index = index;
            this.name = name;
            this.state = TREENODE_STATE_UNDISCOVERED;
            this.children = [];
        }

        drawTree(ctx: CanvasRenderingContext2D) {
            this.setupStyle(ctx);
        }

        drawSubtree(ctx: CanvasRenderingContext2D) {

        }

        setupStyle(ctx: CanvasRenderingContext2D) {
            ctx.font = this.fontSize + "px " + this.font;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            
            var textSize = ctx.measureText(this.name);
            this.width = textSize.width + this.padding;
            this.height = 18 + this.padding;
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
            if(this.terminated) return;

            if(this.queue.isEmpty() == false) {
                let u: Node = this.queue.dequeue();

                // check for goal
                if(u.name == this.problem.goalNode.name) {
                    this.astarTreeNodes[u.index].state = AStarNodeState.Goal;
                    
                    this.renderer.render(this);
                    
                    this.terminated = true;
                    return;
                }

                this.astarTreeNodes[u.index].state = AStarNodeState.Expanded;

                for(let i = 0; i < u.edges.length; i++) {
                    let edge: Edge = u.edges[i];
                    let v: Node = edge.nodeTo;

                    // exploring only unvisited nodes!
                    //if(v.cost == INF) {
                        v.cost = u.cost + edge.cost;
                        this.queue.enqueue(v);

                        this.astarTreeNodes[v.index].state = AStarNodeState.Discovered;
                        this.astarTreeNodes[v.index].setCost(v.cost);
                        this.astarTreeNodes[u.index].adj.push(this.astarTreeNodes[v.index]);
                    //}
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
            this.renderSubtree(startNode, startNode.subtreeWidth/2.0 + 120, 50);
        }

        renderSubtree(root: AStarNode, x: number, y: number) {
            let childX = x - root.subtreeWidth / 2.0;
            for(let i = 0; i < root.adj.length; i++) {
                let subtreeRoot = root.adj[i];
                let requiredSpace = Math.max(subtreeRoot.width, subtreeRoot.subtreeWidth);
                let subtreeX = childX + requiredSpace/2.0;
                let subtreeY = y+50;

                // render edges
                this.ctx.beginPath();
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(subtreeX, subtreeY);
                this.ctx.stroke();
                this.ctx.closePath();

                this.renderSubtree(subtreeRoot, subtreeX, subtreeY);

                childX += requiredSpace + SUBTREE_SPACING;
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

                subtreeWidth += Math.max(subtreeRoot.width, subtreeRoot.subtreeWidth);
                // add spacing
                if(i < root.adj.length-1) {
                    subtreeWidth += SUBTREE_SPACING;
                }
            }

            //subtreeWidth = Math.max(subtreeWidth, root.width);
            root.subtreeWidth = subtreeWidth;
        }

    }

    /* ============ PROBLEM DEFINITION ============ */

    // create nodes
    let exeter = new Node(0, "Exter St. Davids");
    let bidston = new Node(1, "Bidston");
    let bidston1 = new Node(11, "Bidston");
    let bidston2 = new Node(12, "Bidston");
    let bidston3 = new Node(13, "Bidston");
    let bidston4 = new Node(14, "Bidston");
    let bidston5 = new Node(15, "Bidston");
    let bidston6 = new Node(16, "Bidston");
    let bidston7 = new Node(17, "Bidston");
    let oxford = new Node(2, "Oxford");
    let bristol = new Node(3, "Bristol");
    let swindon = new Node(4, "Swindon");
    let birmingham = new Node(5, "Birmingham");
    let conventry = new Node(6, "Conventry");
    let wolverhampton = new Node(7, "Wolverhampton");
    let shrewsburry = new Node(8, "Shrewsbury");
    let newport = new Node(9, "Newport");
    let london = new Node(10, "London");

    // create edges
    exeter.addEdge(oxford, 185);
    exeter.addEdge(bristol, 100);
    exeter.addEdge(swindon, 146);

    oxford.addEdge(birmingham, 71);
    oxford.addEdge(conventry, 166);
    oxford.addEdge(wolverhampton, 93);

    bristol.addEdge(birmingham, 199);
    bristol.addEdge(shrewsburry, 168);
    bristol.addEdge(newport, 40);

    swindon.addEdge(london, 298);
    swindon.addEdge(bristol, 36);
    swindon.addEdge(birmingham, 235);

    birmingham.addEdge(bidston1, 165);
    conventry.addEdge(bidston2, 176);
    wolverhampton.addEdge(bidston3, 172);
    shrewsburry.addEdge(bidston4, 108);
    newport.addEdge(bidston5, 279);
    london.addEdge(bidston6, 210);
    bristol.addEdge(bidston7, 387);

    // add heuristics
    exeter.heuristic = 211;
    oxford.heuristic = 156;
    bristol.heuristic = 154;
    swindon.heuristic = 157;
    birmingham.heuristic = 91;
    conventry.heuristic = 98;
    wolverhampton.heuristic = 78;
    shrewsburry.heuristic = 68;
    newport.heuristic = 142;
    london.heuristic = 205;
    bidston.heuristic = 0;

    let nodes: Node[] = [exeter, bidston, oxford, bristol, swindon, birmingham, conventry, wolverhampton, shrewsburry, newport, london, bidston1, bidston2, bidston3, bidston4, bidston5, bidston7, bidston7];
    let problem = new Problem(nodes, exeter, bidston);

    let astar: AStar = new AStar("searchviz");
    astar.problem = problem;
    astar.run();

    document.getElementById("stepBtn").onclick = () => {astar.step();};

}