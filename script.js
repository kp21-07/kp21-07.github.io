document.addEventListener("DOMContentLoaded", () => {
  /* ==========================================================================
     DRAWER DISPLAY MANAGEMENT
     ========================================================================== */
  const drawers = document.querySelectorAll(".glass-section");
  const closeBtns = document.querySelectorAll(".drawer-close-btn");

  function openDrawer(targetId) {
    // Close all other drawers first
    closeAllDrawers();

    const targetDrawer = document.querySelector(targetId);
    if (targetDrawer) {
      targetDrawer.classList.add("drawer-open");
      
      // If we opened the experience timeline, trigger redrawing of the Git timeline connections
      if (targetId === "#experience") {
        setTimeout(drawGitTimeline, 300);
      }
    }
  }

  function closeAllDrawers() {
    drawers.forEach((drawer) => {
      drawer.classList.remove("drawer-open");
    });
  }

  // Bind close buttons click handlers
  closeBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeAllDrawers();
    });
  });

  // Bind Escape key to close drawers
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllDrawers();
    }
  });

  /* ==========================================================================
     MOBILE NAVIGATION DRAWER
     ========================================================================== */
  const menuToggle = document.querySelector(".menu-toggle");
  const mainNav = document.getElementById("main-nav");
  const navLinks = document.querySelectorAll(".nav-link");

  function toggleNav() {
    mainNav.classList.toggle("nav-open");
    if (mainNav.classList.contains("nav-open")) {
      document.body.style.overflow = "hidden";
      menuToggle.innerHTML = '<i class="fas fa-times"></i>';
    } else {
      document.body.style.overflow = "";
      menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    }
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", toggleNav);
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      event.preventDefault();
      
      openDrawer(targetId);

      if (mainNav.classList.contains("nav-open")) {
        toggleNav();
      }
    });
  });

  /* ==========================================================================
     SKILL NETWORK INTERACTIVITY
     ========================================================================== */
  const skillNodes = document.querySelectorAll(".skill-node");

  skillNodes.forEach((node) => {
    node.addEventListener("mouseenter", () => {
      const relatedStr = node.getAttribute("data-related") || "";
      const relations = relatedStr.split(",");
      
      skillNodes.forEach((otherNode) => {
        if (otherNode === node) return;
        const otherRelatedStr = otherNode.getAttribute("data-related") || "";
        const otherRelations = otherRelatedStr.split(",");
        
        // Highlight if they share any common tags
        const hasIntersection = relations.some(r => otherRelations.includes(r));
        if (hasIntersection && relations.length > 0 && otherRelations.length > 0) {
          otherNode.classList.add("highlight-relation");
        }
      });
    });

    node.addEventListener("mouseleave", () => {
      skillNodes.forEach((otherNode) => {
        otherNode.classList.remove("highlight-relation");
      });
    });
  });

  /* ==========================================================================
     GIT COMMIT TIMELINE BRANCH CANVAS DRAWER
     ========================================================================== */
  const gitCanvas = document.getElementById("git-line-canvas");
  const gitContainer = document.querySelector(".git-timeline");

  function drawGitTimeline() {
    if (!gitCanvas || !gitContainer) return;
    
    // Check if timeline canvas is hidden on mobile/responsive CSS
    if (window.getComputedStyle(gitCanvas).display === "none") return;

    const rect = gitContainer.getBoundingClientRect();
    gitCanvas.width = 90;
    gitCanvas.height = rect.height;

    const ctx = gitCanvas.getContext("2d");
    ctx.clearRect(0, 0, gitCanvas.width, gitCanvas.height);

    const nodes = document.querySelectorAll(".git-node");
    const commitPositions = [];

    // Lane horizontal definitions
    const lanes = {
      main: 25,
      governance: 45,
      clubs: 65,
      fest: 85
    };

    const colors = {
      main: "#00f2fe",
      governance: "#ff6b00",
      clubs: "#9d4edd",
      fest: "#00ff87"
    };

    // Calculate Y coordinates relative to gitContainer
    nodes.forEach((node) => {
      const branchName = node.getAttribute("data-branch") || "main";
      const card = node.querySelector(".git-card");
      const badge = node.querySelector(".git-badge");
      
      if (!card || !badge) return;

      const badgeRect = badge.getBoundingClientRect();
      const nodeCenterY = (badgeRect.top + badgeRect.bottom) / 2 - rect.top;

      commitPositions.push({
        y: nodeCenterY,
        branch: branchName,
        x: lanes[branchName] || lanes.main,
        color: colors[branchName] || colors.main
      });
    });

    // Draw branch lines
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    // 1. Draw Main Line
    ctx.beginPath();
    ctx.strokeStyle = colors.main;
    ctx.moveTo(lanes.main, 0);
    commitPositions.forEach((pos) => {
      if (pos.branch === "main") {
        ctx.lineTo(lanes.main, pos.y);
      }
    });
    ctx.lineTo(lanes.main, gitCanvas.height);
    ctx.stroke();

    // 2. Draw Branch Lines (Bezier curves branching off main)
    const branches = ["governance", "clubs", "fest"];
    branches.forEach((bName) => {
      const bCommits = commitPositions.filter(p => p.branch === bName);
      if (bCommits.length === 0) return;

      ctx.beginPath();
      ctx.strokeStyle = colors[bName];

      // Find first commit in branch, trace parent branch start from main lane
      const firstCommitY = bCommits[0].y;
      const startY = firstCommitY - 40; // Split starting Y height

      ctx.moveTo(lanes.main, startY);
      
      // Bezier curve to branch lane
      ctx.bezierCurveTo(
        lanes.main, startY + 15,
        lanes[bName], startY + 15,
        lanes[bName], startY + 30
      );

      // Line connecting branch commits
      bCommits.forEach((pos) => {
        ctx.lineTo(lanes[bName], pos.y);
      });

      // Merge back to main at the end of the branch
      const lastCommitY = bCommits[bCommits.length - 1].y;
      const endY = lastCommitY + 40;
      
      ctx.lineTo(lanes[bName], endY - 30);
      ctx.bezierCurveTo(
        lanes[bName], endY - 15,
        lanes.main, endY - 15,
        lanes.main, endY
      );

      ctx.stroke();
    });

    // Draw commit dots on top of the paths
    commitPositions.forEach((pos) => {
      // Outer glow
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(8, 11, 17, 0.9)";
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = pos.color;
      ctx.stroke();

      // Inner glowing core
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = pos.color;
      ctx.fill();
    });
  }

  // Draw git graph and attach resize handler
  drawGitTimeline();
  window.addEventListener("resize", drawGitTimeline);
  window.addEventListener("load", drawGitTimeline);

  /* ==========================================================================
     INTERACTIVE 2D PHYSICS NETWORK CANVAS
     ========================================================================== */
  const canvas = document.getElementById("graph-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let width = (canvas.width = canvas.parentElement.clientWidth);
  let height = (canvas.height = canvas.parentElement.clientHeight);

  // High-DPI support
  function setupCanvasDPI() {
    const dpr = window.devicePixelRatio || 1;
    width = canvas.parentElement.clientWidth;
    height = canvas.parentElement.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.scale(dpr, dpr);
  }
  setupCanvasDPI();

  // Graph topology definition
  const nodes = [];
  const links = [];

  // Interaction State
  let panX = 0;
  let panY = 0;
  let zoom = 1.0;
  let isDraggingCanvas = false;
  let didDragBackground = false;
  let startDragX = 0;
  let startDragY = 0;
  let hoveredNode = null;
  let draggedNode = null;
  let runPhysics = true;

  // Node class definition
  class Node {
    constructor(id, label, x, y, radius, color, type, url = null) {
      this.id = id;
      this.label = label;
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
      this.radius = radius;
      this.color = color;
      this.type = type; // 'center', 'category', 'item'
      this.url = url;
      this.fx = null; // Fixed X
      this.fy = null; // Fixed Y
    }

    update() {
      if (this.fx !== null && this.fy !== null) {
        this.x = this.fx;
        this.y = this.fy;
        this.vx = 0;
        this.vy = 0;
        return;
      }

      // Apply drag friction
      this.vx *= 0.88;
      this.vy *= 0.88;

      // Update positions
      this.x += this.vx;
      this.y += this.vy;
    }

    draw(ctx) {
      ctx.save();
      
      // Node Glowing Shadow
      ctx.shadowBlur = hoveredNode === this ? 20 : 8;
      ctx.shadowColor = this.color;

      // Draw node circle
      const grad = ctx.createRadialGradient(this.x, this.y, 2, this.x, this.y, this.radius);
      grad.addColorStop(0, "rgba(8, 11, 17, 0.9)");
      grad.addColorStop(1, this.color + "22");
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = hoveredNode === this ? 3 : 1.5;
      ctx.strokeStyle = this.color;
      ctx.stroke();
      ctx.restore();

      // Node Label Text
      ctx.fillStyle = hoveredNode === this ? "#ffffff" : "rgba(241, 245, 249, 0.85)";
      ctx.font = this.type === "center" 
        ? "bold 13px 'Share Tech Mono', monospace" 
        : "11px 'Share Tech Mono', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      const textY = this.y + this.radius + 14;
      ctx.fillText(this.label, this.x, textY);
      
      // Decorators for central/category nodes
      if (this.type === "center" || this.type === "category") {
        ctx.strokeStyle = this.color + "44";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // Link class definition
  class Link {
    constructor(source, target, length = 120) {
      this.source = source;
      this.target = target;
      this.length = length;
    }

    draw(ctx) {
      ctx.beginPath();
      ctx.moveTo(this.source.x, this.source.y);
      ctx.lineTo(this.target.x, this.target.y);
      
      const isHighlighted = (hoveredNode === this.source || hoveredNode === this.target);
      ctx.lineWidth = isHighlighted ? 1.8 : 0.6;
      ctx.strokeStyle = isHighlighted 
        ? `rgba(0, 242, 254, 0.5)` 
        : `rgba(148, 163, 184, 0.12)`;
      
      ctx.stroke();
    }
  }

  // Populate graph nodes & links using clean, normal names
  function createGraph() {
    nodes.length = 0;
    links.length = 0;

    const cX = width / 2;
    const cY = height / 2;

    // 1. Central Hub Node
    const center = new Node("center", "PARJANYA K", cX, cY, 32, "#00f2fe", "center", "#about");
    nodes.push(center);

    // 2. Category Nodes
    const about = new Node("about", "About Me", cX - 180, cY - 80, 20, "#00f2fe", "category", "#about");
    const experience = new Node("experience", "Experience", cX + 180, cY - 80, 20, "#ff6b00", "category", "#experience");
    const skills = new Node("skills", "Skills", cX - 180, cY + 120, 20, "#9d4edd", "category", "#skills");
    const projects = new Node("projects", "Projects", cX + 180, cY + 120, 20, "#00ff87", "category", "#projects");

    nodes.push(about, experience, skills, projects);
    links.push(
      new Link(center, about, 160),
      new Link(center, experience, 160),
      new Link(center, skills, 160),
      new Link(center, projects, 160)
    );

    // 3. Project Subnodes (Linked to Projects Category)
    const proj1 = new Node("p1", "Image Editor", cX + 280, cY + 60, 12, "#00ff87", "item", "#projects");
    const proj2 = new Node("p2", "Toaster", cX + 310, cY + 140, 12, "#00ff87", "item", "#projects");
    const proj3 = new Node("p3", "DAGer", cX + 280, cY + 220, 12, "#00ff87", "item", "#projects");
    const proj4 = new Node("p4", "Déjà Mew", cX + 180, cY + 240, 12, "#00ff87", "item", "#projects");

    nodes.push(proj1, proj2, proj3, proj4);
    links.push(
      new Link(projects, proj1, 80),
      new Link(projects, proj2, 85),
      new Link(projects, proj3, 80),
      new Link(projects, proj4, 85)
    );

    // 4. Skills Subnodes (Linked to Skills Category)
    const sk1 = new Node("s1", "Languages", cX - 280, cY + 60, 12, "#9d4edd", "item", "#skills");
    const sk2 = new Node("s2", "Web & App Dev", cX - 240, cY + 220, 12, "#9d4edd", "item", "#skills");

    nodes.push(sk1, sk2);
    links.push(
      new Link(skills, sk1, 80),
      new Link(skills, sk2, 85)
    );

    // 5. Experience Subnodes (Linked to Experience Category)
    const jo1 = new Node("j1", "IIT PKD BTech", cX + 260, cY - 140, 12, "#ff6b00", "item", "#experience");
    const jo2 = new Node("j2", "Student Council", cX + 180, cY - 180, 12, "#ff6b00", "item", "#experience");
    const jo3 = new Node("j3", "YACC Associate", cX + 100, cY - 150, 12, "#ff6b00", "item", "#experience");
    const jo4 = new Node("j4", "Petrichor Web", cX + 80, cY - 80, 12, "#ff6b00", "item", "#experience");

    nodes.push(jo1, jo2, jo3, jo4);
    links.push(
      new Link(experience, jo1, 80),
      new Link(experience, jo2, 85),
      new Link(experience, jo3, 80),
      new Link(experience, jo4, 85)
    );
  }

  createGraph();

  // Physics Simulation Loop
  function solvePhysics() {
    if (!runPhysics) return;

    const cX = width / 2;
    const cY = height / 2;

    // 1. Hooke's Law Spring Force (Attraction along links)
    links.forEach((link) => {
      const dx = link.target.x - link.source.x;
      const dy = link.target.y - link.source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
      
      const force = (dist - link.length) * 0.012;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (link.source.fx === null) {
        link.source.vx += fx;
        link.source.vy += fy;
      }
      if (link.target.fx === null) {
        link.target.vx -= fx;
        link.target.vy -= fy;
      }
    });

    // 2. Coulomb's Law Repulsion Force (Nodes pushing away from each other)
    for (let i = 0; i < nodes.length; i++) {
      const nodeA = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeB = nodes[j];
        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
        
        const minDist = nodeA.radius + nodeB.radius + 30;
        if (dist < minDist) {
          const force = (minDist - dist) * 0.15;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          nodeA.vx -= fx;
          nodeA.vy -= fy;
          nodeB.vx += fx;
          nodeB.vy += fy;
        }

        const repForce = 2200 / (dist * dist);
        const rfx = (dx / dist) * repForce;
        const rfy = (dy / dist) * repForce;

        nodeA.vx -= rfx;
        nodeA.vy -= rfy;
        nodeB.vx += rfx;
        nodeB.vy += rfy;
      }
    }

    // 3. Central Gravity (Nodes stay pulled near center viewport)
    nodes.forEach((node) => {
      const dx = cX - node.x;
      const dy = cY - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;

      node.vx += (dx / dist) * 0.15;
      node.vy += (dy / dist) * 0.15;
    });

    // 4. Update coordinates & apply damping
    nodes.forEach((node) => node.update());
  }

  // Animation Loop
  function animate() {
    solvePhysics();

    ctx.fillStyle = "#080b11";
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2 + panX, height / 2 + panY);
    ctx.scale(zoom, zoom);
    ctx.translate(-width / 2, -height / 2);

    drawCanvasCoordinateGrid();

    // Draw links
    links.forEach((link) => link.draw(ctx));

    // Draw nodes
    nodes.forEach((node) => node.draw(ctx));

    ctx.restore();
    requestAnimationFrame(animate);
  }

  function drawCanvasCoordinateGrid() {
    ctx.strokeStyle = "rgba(148, 163, 184, 0.015)";
    ctx.lineWidth = 0.5;

    const step = 40;
    const startX = -1000;
    const endX = width + 1000;
    const startY = -1000;
    const endY = height + 1000;

    ctx.beginPath();
    for (let x = startX; x < endX; x += step) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y < endY; y += step) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();
  }

  animate();

  /* ==========================================================================
     CANVAS USER INTERACTIONS (DRAGGING, ZOOMING, CLICKING)
     ========================================================================== */
  function getGraphCoordinates(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const graphX = (x - width / 2 - panX) / zoom + width / 2;
    const graphY = (y - height / 2 - panY) / zoom + height / 2;

    return { x: graphX, y: graphY };
  }

  canvas.addEventListener("mousemove", (e) => {
    const coords = getGraphCoordinates(e.clientX, e.clientY);
    
    if (draggedNode) {
      draggedNode.fx = coords.x;
      draggedNode.fy = coords.y;
      return;
    }

    if (isDraggingCanvas) {
      panX += e.clientX - startDragX;
      panY += e.clientY - startDragY;
      startDragX = e.clientX;
      startDragY = e.clientY;
      didDragBackground = true;
      return;
    }

    let found = null;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const dx = node.x - coords.x;
      const dy = node.y - coords.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= node.radius + 15) {
        found = node;
        break;
      }
    }

    hoveredNode = found;
    canvas.style.cursor = found ? "pointer" : isDraggingCanvas ? "grabbing" : "grab";
  });

  canvas.addEventListener("mousedown", (e) => {
    const coords = getGraphCoordinates(e.clientX, e.clientY);

    let found = null;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const dx = node.x - coords.x;
      const dy = node.y - coords.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= node.radius + 15) {
        found = node;
        break;
      }
    }

    if (found) {
      draggedNode = found;
      draggedNode.fx = coords.x;
      draggedNode.fy = coords.y;
    } else {
      isDraggingCanvas = true;
      didDragBackground = false;
      startDragX = e.clientX;
      startDragY = e.clientY;
      canvas.style.cursor = "grabbing";
    }
  });

  window.addEventListener("mouseup", () => {
    if (draggedNode) {
      draggedNode.fx = null;
      draggedNode.fy = null;
      draggedNode = null;
    }
    isDraggingCanvas = false;
    canvas.style.cursor = "grab";
  });

  // Handle opening slide-out drawer on node clicks
  canvas.addEventListener("click", (e) => {
    // If the mouse was dragged around to pan, do not count as click
    if (didDragBackground) return;

    const coords = getGraphCoordinates(e.clientX, e.clientY);

    let clicked = null;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const dx = node.x - coords.x;
      const dy = node.y - coords.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= node.radius + 15) {
        clicked = node;
        break;
      }
    }

    if (clicked && clicked.url) {
      openDrawer(clicked.url);
    } else if (!clicked) {
      // Clicked on background, close any active drawers
      closeAllDrawers();
    }
  });

  // Scroll to Zoom
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const zoomFactor = 1.06;
    
    if (e.deltaY < 0) {
      if (zoom < 3.0) zoom *= zoomFactor;
    } else {
      if (zoom > 0.4) zoom /= zoomFactor;
    }
  }, { passive: false });

  // Control Buttons
  const btnReset = document.getElementById("btn-reset-graph");
  const btnTogglePhysics = document.getElementById("btn-toggle-physics");

  if (btnReset) {
    btnReset.addEventListener("click", () => {
      panX = 0;
      panY = 0;
      zoom = 1.0;
      createGraph();
    });
  }

  if (btnTogglePhysics) {
    btnTogglePhysics.addEventListener("click", () => {
      runPhysics = !runPhysics;
      btnTogglePhysics.innerHTML = runPhysics 
        ? '<i class="fa-solid fa-pause"></i> Freeze' 
        : '<i class="fa-solid fa-play"></i> Unfreeze';
      
      if (!runPhysics) {
        nodes.forEach(n => {
          n.vx = 0;
          n.vy = 0;
        });
      }
    });
  }

  window.addEventListener("resize", () => {
    setupCanvasDPI();
  });
});
