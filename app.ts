namespace SearchViz {

    let INF = 999999999;
    let SUBTREE_SPACING_HORIZONTAL = 60;
    let SUBTREE_SPACING_VERTICAL = 60;

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

        drawTree(ctx: CanvasRenderingContext2D, x: number, y: number) {
            this.setupStyle(ctx);
            this.calculateSubtreeWidth(ctx);
            this.drawSubtree(ctx, x, y);
        }

        drawSubtree(ctx: CanvasRenderingContext2D, x: number, y: number) {
            this.x = x;
            this.y = y;

            let subtreeX = x - this.subtreeWidth / 2.0;

            // draw children
            for(let i = 0; i < this.children.length; i++) {
                let child = this.children[i];
                let childRequiredWidth = Math.max(child.width, child.subtreeWidth);
                let childX = subtreeX + childRequiredWidth / 2.0;
                let childY = y + SUBTREE_SPACING_VERTICAL;

                // render edges
                this.drawEdge(ctx, x, y, childX, childY);

                child.drawSubtree(ctx, childX, childY);

                subtreeX = subtreeX + childRequiredWidth + SUBTREE_SPACING_HORIZONTAL;
            }

            // draw this node
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
            ctx.font = this.fontSize + "px " + this.font;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = this.fontColor;
            ctx.fillText(this.name, this.x, this.y);
        }

        drawEdge(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) {
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(fromX, (fromY + toY) / 2);

            ctx.moveTo(fromX, (fromY + toY) / 2);
            ctx.lineTo(toX, (fromY + toY) / 2);

            ctx.moveTo(toX, (fromY + toY) / 2);
            ctx.lineTo(toX, toY);
            
            ctx.stroke();
            ctx.closePath();
        }

        setupStyle(ctx: CanvasRenderingContext2D) {
            if(this.state === TREENODE_STATE_DISCOVERED) {
                this.backgroundColor = "#ffffff";
            } else if(this.state === TREENODE_STATE_OPENED) {
                this.backgroundColor = "#ff00ff";
            } else if(this.state === TREENODE_STATE_CLOSED) {
                this.backgroundColor = "#ffff00";
            } else if(this.state === TREENODE_STATE_GOAL) {
                this.backgroundColor = "#00ff00";
            }

            ctx.font = this.fontSize + "px " + this.font;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            
            var textSize = ctx.measureText(this.name);
            this.width = textSize.width + this.padding;
            this.height = 18 + this.padding;
        }

        calculateSubtreeWidth(ctx) {
            let width = 0;

            for(let i = 0; i < this.children.length; i++) {
                this.children[i].setupStyle(ctx);
                width += Math.max(this.children[i].width, this.children[i].calculateSubtreeWidth(ctx));
                if(i < this.children.length-1)
                    width += SUBTREE_SPACING_HORIZONTAL;
            }

            this.subtreeWidth = width;
            return this.subtreeWidth;
        }

    }
    
    /* ============ A* ALGORITHM ============ */

    class AStarNode extends TreeNode {

        problemNode: Node;
        cost: number;
        heuristic: number;
        f: number;

        drawSubtree(ctx: CanvasRenderingContext2D, x: number, y: number) {
            super.drawSubtree(ctx, x, y);

            ctx.font = "12px Arial";
            ctx.textAlign = "right";
            ctx.textBaseline = "middle";
            // draw cost label
            let costStr = "g: " + (this.cost == INF ? "inf" : this.cost);
            ctx.fillStyle = "#ff4838";
            ctx.fillText(costStr, this.x - this.width/2 - 5, this.y - 12);
            // draw heuristic label
            let heurStr = "h: " + this.heuristic;
            ctx.fillStyle = "#17b9ef";
            ctx.fillText(heurStr, this.x - this.width/2 - 5, this.y);
            // draw f label
            let f = this.cost;
            if(this.heuristic != INF)
                f += this.heuristic;
            let fStr = "f: " + (f == INF ? "inf" : f);
            ctx.fillStyle = "#1ca81e";
            ctx.fillText(fStr, this.x - this.width/2 - 5, this.y + 12);
        }

    }

    class AStar extends Algorithm {

        renderer: AStarRenderer;

        queue: PriorityQueue<AStarNode>;
        startNode: AStarNode;
        lastOpenedNode: AStarNode;

        constructor(canvasId: string) {
            super("AStar");

            this.renderer = new AStarRenderer(canvasId);

            this.queue = new PriorityQueue<AStarNode>((a: AStarNode, b: AStarNode) => {
                let f_a = a.problemNode.cost + a.problemNode.heuristic;
                let f_b = b.problemNode.cost + b.problemNode.heuristic;
                if(f_a < f_b)
                    return -10;
                else if(f_a == f_b)
                    return 0;
                return 10;
            });
        }

        run() {
            this.problem.startNode.cost = 0;

            this.startNode = this.createTreeNode(this.problem.startNode);
            this.startNode.cost = 0;
            this.queue.enqueue(this.startNode);

            this.step();
        }

        step() {
            if(!this.terminated && !this.queue.isEmpty()) {
                let u: AStarNode = this.queue.dequeue();

                // update states
                u.state = TREENODE_STATE_OPENED;
                if(this.lastOpenedNode)
                    this.lastOpenedNode.state = TREENODE_STATE_CLOSED;
                this.lastOpenedNode = u;

                // check for goal
                if(u.problemNode.index == this.problem.goalNode.index) {
                    u.state = TREENODE_STATE_GOAL;
                    this.finish();
                    return;
                }

                let edges: Edge[] = u.expand();
                for(let i = 0; i < edges.length; i++) {
                    let edge = edges[i];

                    if(edge.nodeTo.cost > u.problemNode.cost + edge.cost) {
                        edge.nodeTo.cost = u.problemNode.cost + edge.cost;
                        
                        let v = this.createTreeNode(edge.nodeTo);
                        v.state = TREENODE_STATE_DISCOVERED;
                        this.queue.enqueue(v);

                        // add v as children to u in the search tree
                        u.children.push(v);
                    }
                }
            }

            this.renderer.render(this);
        }

        finish() {
            this.terminated = true;
            this.renderer.render(this);
        }

        createTreeNode(node: Node) {
            let astarNode: AStarNode = new AStarNode(node.index, node.name);
            astarNode.problemNode = node;
            astarNode.cost = node.cost;
            astarNode.heuristic = node.heuristic;
            astarNode.f = node.cost + node.heuristic;

            astarNode.expand = function() {
                return astarNode.problemNode.edges;
            };

            return astarNode;
        }

    }

    class AStarRenderer extends AlgorithmRenderer {

        render(astar: AStar) {
            this.clear();
            astar.startNode.drawTree(this.ctx, 1400/2, 50);
        }

    }

    /* ============ PROBLEM DEFINITION ============ */

    // create nodes
    let exeter = new Node(0, "Exeter St. Davids");
    let bidston = new Node(1, "Bidston");
    let oxford = new Node(2, "Oxford");
    let bristol = new Node(3, "Bristol");
    let swindon = new Node(4, "Swindon");
    let birmingham = new Node(5, "Birmingham");
    let coventry = new Node(6, "Conventry");
    let wolverhampton = new Node(7, "Wolverhampton");
    let shrewsburry = new Node(8, "Shrewsbury");
    let newport = new Node(9, "Newport");
    let london = new Node(10, "London");
    let plymouth = new Node(13, "Plymouth");
    
    let birmingham2 = new Node(11, "Birmingham");
    let birmingham3 = new Node(12, "Birmingham");

    // create edges
    exeter.addEdge(oxford, 215);
    exeter.addEdge(bristol, 131);
    exeter.addEdge(swindon, 177);

    oxford.addEdge(birmingham, 73);
    oxford.addEdge(coventry, 48);
    oxford.addEdge(wolverhampton, 99);

    bristol.addEdge(birmingham2, 218);
    bristol.addEdge(shrewsburry, 187);
    bristol.addEdge(newport, 76);

    swindon.addEdge(london, 76);
    swindon.addEdge(plymouth, 58);
    swindon.addEdge(birmingham3, 142);

    birmingham.addEdge(bidston, 198);
    birmingham2.addEdge(bidston, 198);
    birmingham3.addEdge(bidston, 198);
    coventry.addEdge(bidston, 223);
    wolverhampton.addEdge(bidston, 172);
    shrewsburry.addEdge(bidston, 117);
    newport.addEdge(bidston, 288);
    london.addEdge(bidston, 233);
    //bristol.addEdge(bidston, 260);

    // add heuristics
    exeter.heuristic = 276;
    oxford.heuristic = 204;
    bristol.heuristic = 202;
    swindon.heuristic = 205;
    birmingham.heuristic = 120;
    birmingham2.heuristic = 120;
    birmingham3.heuristic = 120;
    coventry.heuristic = 141;
    wolverhampton.heuristic = 102;
    shrewsburry.heuristic = 73;
    newport.heuristic = 186;
    london.heuristic = 268;
    plymouth.heuristic = 301;
    bidston.heuristic = 0;

    let nodes: Node[] = [exeter, bidston, oxford, bristol, swindon, birmingham, coventry, wolverhampton, shrewsburry, newport, london, birmingham2, birmingham3];
    let problem = new Problem(nodes, exeter, bidston);

    let astar: AStar = new AStar("searchviz");
    astar.problem = problem;
    astar.run();

    document.getElementById("stepBtn").onclick = () => {astar.step();};

}