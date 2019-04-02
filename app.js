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
    var SUBTREE_SPACING_HORIZONTAL = 60;
    var SUBTREE_SPACING_VERTICAL = 60;
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
            this.terminated = false;
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
    /* ============ TREE DRAWING ============ */
    var TREENODE_STATE_UNDISCOVERED = 0;
    var TREENODE_STATE_DISCOVERED = 1;
    var TREENODE_STATE_OPENED = 2;
    var TREENODE_STATE_CLOSED = 3;
    var TREENODE_STATE_GOAL = 4;
    var TreeNode = /** @class */ (function () {
        function TreeNode(index, name) {
            this.x = 0;
            this.y = 0;
            this.width = 0;
            this.height = 0;
            this.padding = 10;
            this.subtreeWidth = 0;
            this.font = "Arial";
            this.fontSize = 16;
            this.fontColor = "#333";
            this.backgroundColor = "#ffff00";
            this.borderColor = "#333";
            this.index = index;
            this.name = name;
            this.state = TREENODE_STATE_UNDISCOVERED;
            this.children = [];
        }
        TreeNode.prototype.drawTree = function (ctx, x, y) {
            this.setupStyle(ctx);
            this.calculateSubtreeWidth(ctx);
            this.drawSubtree(ctx, x, y);
        };
        TreeNode.prototype.drawSubtree = function (ctx, x, y) {
            this.x = x;
            this.y = y;
            var subtreeX = x - this.subtreeWidth / 2.0;
            // draw children
            for (var i = 0; i < this.children.length; i++) {
                var child = this.children[i];
                var childRequiredWidth = Math.max(child.width, child.subtreeWidth);
                var childX = subtreeX + childRequiredWidth / 2.0;
                var childY = y + SUBTREE_SPACING_VERTICAL;
                // render edges
                this.drawEdge(ctx, x, y, childX, childY);
                child.drawSubtree(ctx, childX, childY);
                subtreeX = subtreeX + childRequiredWidth + SUBTREE_SPACING_HORIZONTAL;
            }
            // draw this node
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
            ctx.font = this.fontSize + "px " + this.font;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = this.fontColor;
            ctx.fillText(this.name, this.x, this.y);
        };
        TreeNode.prototype.drawEdge = function (ctx, fromX, fromY, toX, toY) {
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(fromX, (fromY + toY) / 2);
            ctx.moveTo(fromX, (fromY + toY) / 2);
            ctx.lineTo(toX, (fromY + toY) / 2);
            ctx.moveTo(toX, (fromY + toY) / 2);
            ctx.lineTo(toX, toY);
            ctx.stroke();
            ctx.closePath();
        };
        TreeNode.prototype.setupStyle = function (ctx) {
            if (this.state === TREENODE_STATE_DISCOVERED) {
                this.backgroundColor = "#ffffff";
            }
            else if (this.state === TREENODE_STATE_OPENED) {
                this.backgroundColor = "#ff00ff";
            }
            else if (this.state === TREENODE_STATE_CLOSED) {
                this.backgroundColor = "#ffff00";
            }
            else if (this.state === TREENODE_STATE_GOAL) {
                this.backgroundColor = "#00ff00";
            }
            ctx.font = this.fontSize + "px " + this.font;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            var textSize = ctx.measureText(this.name);
            this.width = textSize.width + this.padding;
            this.height = 18 + this.padding;
        };
        TreeNode.prototype.calculateSubtreeWidth = function (ctx) {
            var width = 0;
            for (var i = 0; i < this.children.length; i++) {
                this.children[i].setupStyle(ctx);
                width += Math.max(this.children[i].width, this.children[i].calculateSubtreeWidth(ctx));
                if (i < this.children.length - 1)
                    width += SUBTREE_SPACING_HORIZONTAL;
            }
            this.subtreeWidth = width;
            return this.subtreeWidth;
        };
        return TreeNode;
    }());
    /* ============ A* ALGORITHM ============ */
    var AStarNode = /** @class */ (function (_super) {
        __extends(AStarNode, _super);
        function AStarNode() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        AStarNode.prototype.drawSubtree = function (ctx, x, y) {
            _super.prototype.drawSubtree.call(this, ctx, x, y);
            ctx.font = "12px Arial";
            ctx.textAlign = "right";
            ctx.textBaseline = "middle";
            // draw cost label
            var costStr = "g: " + (this.cost == INF ? "inf" : this.cost);
            ctx.fillStyle = "#ff4838";
            ctx.fillText(costStr, this.x - this.width / 2 - 5, this.y - 12);
            // draw heuristic label
            var heurStr = "h: " + this.heuristic;
            ctx.fillStyle = "#17b9ef";
            ctx.fillText(heurStr, this.x - this.width / 2 - 5, this.y);
            // draw f label
            var f = this.cost;
            if (this.heuristic != INF)
                f += this.heuristic;
            var fStr = "f: " + (f == INF ? "inf" : f);
            ctx.fillStyle = "#1ca81e";
            ctx.fillText(fStr, this.x - this.width / 2 - 5, this.y + 12);
        };
        return AStarNode;
    }(TreeNode));
    var AStar = /** @class */ (function (_super) {
        __extends(AStar, _super);
        function AStar(canvasId) {
            var _this = _super.call(this, "AStar") || this;
            _this.renderer = new AStarRenderer(canvasId);
            _this.queue = new PriorityQueue(function (a, b) {
                var f_a = a.problemNode.cost + a.problemNode.heuristic;
                var f_b = b.problemNode.cost + b.problemNode.heuristic;
                if (f_a < f_b)
                    return -10;
                else if (f_a == f_b)
                    return 0;
                return 10;
            });
            return _this;
        }
        AStar.prototype.run = function () {
            this.problem.startNode.cost = 0;
            this.startNode = this.createTreeNode(this.problem.startNode);
            this.startNode.cost = 0;
            this.queue.enqueue(this.startNode);
            this.step();
        };
        AStar.prototype.step = function () {
            if (!this.terminated && !this.queue.isEmpty()) {
                var u = this.queue.dequeue();
                // update states
                u.state = TREENODE_STATE_OPENED;
                if (this.lastOpenedNode)
                    this.lastOpenedNode.state = TREENODE_STATE_CLOSED;
                this.lastOpenedNode = u;
                // check for goal
                if (u.problemNode.index == this.problem.goalNode.index) {
                    u.state = TREENODE_STATE_GOAL;
                    this.finish();
                    return;
                }
                var edges = u.expand();
                for (var i = 0; i < edges.length; i++) {
                    var edge = edges[i];
                    if (edge.nodeTo.cost > u.problemNode.cost + edge.cost) {
                        edge.nodeTo.cost = u.problemNode.cost + edge.cost;
                        var v = this.createTreeNode(edge.nodeTo);
                        v.state = TREENODE_STATE_DISCOVERED;
                        this.queue.enqueue(v);
                        // add v as children to u in the search tree
                        u.children.push(v);
                    }
                }
            }
            this.renderer.render(this);
        };
        AStar.prototype.finish = function () {
            this.terminated = true;
            this.renderer.render(this);
        };
        AStar.prototype.createTreeNode = function (node) {
            var astarNode = new AStarNode(node.index, node.name);
            astarNode.problemNode = node;
            astarNode.cost = node.cost;
            astarNode.heuristic = node.heuristic;
            astarNode.f = node.cost + node.heuristic;
            astarNode.expand = function () {
                return astarNode.problemNode.edges;
            };
            return astarNode;
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
            astar.startNode.drawTree(this.ctx, 1400 / 2, 50);
        };
        return AStarRenderer;
    }(AlgorithmRenderer));
    /* ============ PROBLEM DEFINITION ============ */
    // create nodes
    var exeter = new Node(0, "Exeter St. Davids");
    var bidston = new Node(1, "Bidston");
    var oxford = new Node(2, "Oxford");
    var bristol = new Node(3, "Bristol");
    var swindon = new Node(4, "Swindon");
    var birmingham = new Node(5, "Birmingham");
    var coventry = new Node(6, "Conventry");
    var wolverhampton = new Node(7, "Wolverhampton");
    var shrewsburry = new Node(8, "Shrewsbury");
    var newport = new Node(9, "Newport");
    var london = new Node(10, "London");
    var plymouth = new Node(13, "Plymouth");
    var birmingham2 = new Node(11, "Birmingham");
    var birmingham3 = new Node(12, "Birmingham");
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
    var nodes = [exeter, bidston, oxford, bristol, swindon, birmingham, coventry, wolverhampton, shrewsburry, newport, london, birmingham2, birmingham3];
    var problem = new Problem(nodes, exeter, bidston);
    var astar = new AStar("searchviz");
    astar.problem = problem;
    astar.run();
    document.getElementById("stepBtn").onclick = function () { astar.step(); };
})(SearchViz || (SearchViz = {}));
