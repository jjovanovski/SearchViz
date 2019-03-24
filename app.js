var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var SearchViz;
(function (SearchViz) {
    var INF = 999999999;
    var SUBTREE_SPACING = 60;
    var Problem = /** @class */ (function () {
        function Problem(nodes, startNode, goalNode) {
            this.nodes = nodes;
            this.startNode = startNode;
            this.goalNode = goalNode;
        }
        return Problem;
    }());
    var Node = /** @class */ (function () {
        function Node(index, name) {
            this.index = index;
            this.name = name;
            this.edges = [];
            this.cost = INF;
            this.heuristic = 0;
            this.visited = false;
        }
        Node.prototype.addEdge = function (nodeTo, cost) {
            this.edges.push(new Edge(this, nodeTo, cost));
        };
        return Node;
    }());
    var Edge = /** @class */ (function () {
        function Edge(nodeFrom, nodeTo, cost) {
            this.nodeFrom = nodeFrom;
            this.nodeTo = nodeTo;
            this.cost = cost;
        }
        return Edge;
    }());
    var Algorithm = /** @class */ (function () {
        function Algorithm(name) {
            this.name = name;
        }
        Algorithm.prototype.run = function () {
            // OVERRIDE
        };
        Algorithm.prototype.step = function () {
            // OVERRIDE
        };
        Algorithm.prototype.finish = function () {
            // OVERRIDE
        };
        Algorithm.prototype.reset = function () {
            // OVERRIDE
        };
        return Algorithm;
    }());
    var AlgorithmRenderer = /** @class */ (function () {
        function AlgorithmRenderer(canvasId) {
            this.canvasId = canvasId;
            this.canvas = document.getElementById(this.canvasId);
            this.ctx = this.canvas.getContext("2d");
            this.canvasWidth = this.canvas.width;
            this.canvasHeight = this.canvas.height;
        }
        AlgorithmRenderer.prototype.clear = function () {
            this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        };
        return AlgorithmRenderer;
    }());
    /* ============ UTILITY CLASSES ============ */
    // very inefficient implementation
    var PriorityQueue = /** @class */ (function () {
        function PriorityQueue(compareFunction) {
            this.items = [];
            this.count = 0;
            this.compareFunction = compareFunction;
        }
        PriorityQueue.prototype.enqueue = function (item) {
            var _this = this;
            this.items.push(item);
            this.items.sort(function (a, b) {
                return -_this.compareFunction.call(_this, a, b);
            });
            this.count++;
        };
        PriorityQueue.prototype.dequeue = function () {
            if (this.count <= 0)
                return undefined; // handle this better? 
            this.count--;
            return this.items.pop();
        };
        PriorityQueue.prototype.peek = function () {
            if (this.count <= 0)
                return undefined; // handle this better?
            return this.items[this.items.length - 1];
        };
        PriorityQueue.prototype.size = function () {
            return this.count;
        };
        PriorityQueue.prototype.isEmpty = function () {
            return this.count == 0;
        };
        PriorityQueue.prototype.clear = function () {
            this.items = [];
            this.count = 0;
        };
        return PriorityQueue;
    }());
    /* ============ A* ALGORITHM ============ */
    var AStarNodeState;
    (function (AStarNodeState) {
        AStarNodeState[AStarNodeState["Undiscovered"] = 0] = "Undiscovered";
        AStarNodeState[AStarNodeState["Discovered"] = 1] = "Discovered";
        AStarNodeState[AStarNodeState["Expanded"] = 2] = "Expanded";
        AStarNodeState[AStarNodeState["Goal"] = 3] = "Goal";
    })(AStarNodeState || (AStarNodeState = {}));
    var AStarNode = /** @class */ (function () {
        function AStarNode(index, label, heuristic) {
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
        AStarNode.prototype.setCost = function (cost) {
            this.cost = cost;
            this.f = this.cost + this.heuristic;
        };
        AStarNode.prototype.setupStyle = function (ctx) {
            if (this.state === AStarNodeState.Discovered) {
                this.backgroundColor = "#ffffff";
            }
            else if (this.state === AStarNodeState.Expanded) {
                this.backgroundColor = "#ffff00";
            }
            else if (this.state === AStarNodeState.Goal) {
                this.backgroundColor = "#00ff00";
            }
            ctx.font = "18px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            var textSize = ctx.measureText(this.label);
            this.width = textSize.width + this.padding;
            this.height = 18 + this.padding;
        };
        AStarNode.prototype.render = function (ctx) {
            this.setupStyle(ctx);
            ctx.beginPath();
            ctx.rect(this.x - this.width / 2.0, this.y - this.height / 2.0, this.width, this.height);
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
            var costStr = "g: " + (this.cost == INF ? "infinity" : this.cost);
            ctx.fillStyle = "#ff4838";
            ctx.fillText(costStr, this.x - this.width / 2 - 5 - ctx.measureText(costStr).width, this.y - 8);
            // draw heuristic label
            var heurStr = "h: " + this.heuristic;
            ctx.fillStyle = "#17b9ef";
            ctx.fillText(heurStr, this.x - this.width / 2 - 5 - ctx.measureText(heurStr).width, this.y + 8);
            // draw f label
            var fStr = "f: " + this.f;
            ctx.fillStyle = "#1ca81e";
            ctx.fillText(fStr, this.x + this.width / 2 + 5, this.y);
        };
        return AStarNode;
    }());
    var AStar = /** @class */ (function (_super) {
        __extends(AStar, _super);
        function AStar(canvasId) {
            var _this = _super.call(this, "AStar") || this;
            _this.renderer = new AStarRenderer(canvasId);
            _this.queue = new PriorityQueue(function (a, b) {
                var f_a = a.cost + a.heuristic;
                var f_b = b.cost + b.heuristic;
                if (f_a < f_b)
                    return -10;
                else if (f_a == f_b)
                    return 0;
                return 10;
            });
            return _this;
        }
        AStar.prototype.run = function () {
            // create astarnode for each node in the problem
            // (we can do this because we visit each node only once!)
            this.astarTreeNodes = [];
            for (var i = 0; i < this.problem.nodes.length; i++) {
                var node = this.problem.nodes[i];
                var astarNode = new AStarNode(i, node.name, node.heuristic);
                astarNode.setCost(0);
                astarNode.state = AStarNodeState.Discovered;
                this.astarTreeNodes.push(astarNode);
            }
            // initialize a* queue
            this.problem.startNode.cost = 0;
            this.queue.enqueue(this.problem.startNode);
            this.renderer.render(this);
        };
        AStar.prototype.step = function () {
            if (this.queue.isEmpty() == false) {
                var u = this.queue.dequeue();
                this.astarTreeNodes[u.index].state = AStarNodeState.Expanded;
                for (var i = 0; i < u.edges.length; i++) {
                    var edge = u.edges[i];
                    var v = edge.nodeTo;
                    // exploring only unvisited nodes!
                    if (v.cost == INF) {
                        v.cost = u.cost + edge.cost;
                        this.queue.enqueue(v);
                        this.astarTreeNodes[v.index].state = AStarNodeState.Discovered;
                        this.astarTreeNodes[v.index].setCost(v.cost);
                        this.astarTreeNodes[u.index].adj.push(this.astarTreeNodes[v.index]);
                        // check for goal
                        if (v.index == this.problem.goalNode.index) {
                            this.astarTreeNodes[v.index].state = AStarNodeState.Goal;
                            this.renderer.render(this);
                            return;
                        }
                    }
                }
            }
            this.renderer.render(this);
        };
        return AStar;
    }(Algorithm));
    var AStarRenderer = /** @class */ (function (_super) {
        __extends(AStarRenderer, _super);
        function AStarRenderer() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        AStarRenderer.prototype.render = function (astar) {
            this.clear();
            var startNode = astar.astarTreeNodes[astar.problem.startNode.index];
            this.calcSubtreeWidth(startNode);
            this.renderSubtree(startNode, this.canvasWidth / 2.0, 50);
        };
        AStarRenderer.prototype.renderSubtree = function (root, x, y) {
            var childX = x - root.subtreeWidth / 2.0;
            for (var i = 0; i < root.adj.length; i++) {
                var subtreeX = childX + root.adj[i].subtreeWidth / 2.0;
                var subtreeY = y + 50;
                // render edges
                this.ctx.beginPath();
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(subtreeX, subtreeY);
                this.ctx.stroke();
                this.ctx.closePath();
                var subtreeRoot = root.adj[i];
                this.renderSubtree(subtreeRoot, subtreeX, subtreeY);
                childX += root.adj[i].subtreeWidth + SUBTREE_SPACING;
            }
            root.x = x;
            root.y = y;
            root.render(this.ctx);
        };
        AStarRenderer.prototype.calcSubtreeWidth = function (root) {
            root.setupStyle(this.ctx);
            var subtreeWidth = 0;
            for (var i = 0; i < root.adj.length; i++) {
                var subtreeRoot = root.adj[i];
                this.calcSubtreeWidth(subtreeRoot);
                subtreeWidth += subtreeRoot.subtreeWidth;
                // add spacing
                if (i < root.adj.length - 1) {
                    subtreeWidth += SUBTREE_SPACING;
                }
            }
            subtreeWidth = Math.max(subtreeWidth, root.width);
            root.subtreeWidth = subtreeWidth;
        };
        return AStarRenderer;
    }(AlgorithmRenderer));
    /* ============ PROBLEM DEFINITION ============ */
    // create nodes
    var sk = new Node(0, "Skopje");
    var te = new Node(1, "Tetovo");
    var ve = new Node(2, "Veles");
    var go = new Node(3, "Gostivar");
    var ki = new Node(4, "Kicevo");
    var sr = new Node(5, "Struga");
    var bi = new Node(6, "Bitola");
    var oh = new Node(7, "Ohrid");
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
    var nodes = [sk, te, ve, go, ki, sr, bi, oh];
    var problem = new Problem(nodes, sk, oh);
    var astar = new AStar("searchviz");
    astar.problem = problem;
    astar.run();
    document.getElementById("stepBtn").onclick = function () { astar.step(); };
})(SearchViz || (SearchViz = {}));
