/* ============================================================
   G4Gate — static data (syllabus, plans, leaders, resources)
   ============================================================ */

window.G4_DATA = {
  site: {
    name: "G4Gate",
    tagline: "The tracking and preparation ecosystem for GATE and DSA aspirants. Stay consistent, track your progress, and get where you're going.",
    creator: { name: "Uma Mahesh", thanks: "G4Gate" },
    year: 2026,
    gateYear: 2027,
    // GATE 2027 examination window (CS typically first weekend of Feb)
    examDate: "2027-02-07T09:00:00+05:30",
  },

  nav: [
    { label: "Dashboard", href: "/" },
    { label: "Syllabus", href: "/syllabus" },
    { label: "Timer", href: "/timer" },
    { label: "Tests", href: "/tests" },
    { label: "Calendar", href: "/calendar" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "Plans", href: "/plans" },
  ],

  tools: [
    { id: "timer", label: "Pomodoro Timer", href: "/timer", icon: "⏱️", desc: "Focus sessions with subject tracking" },
    { id: "syllabus", label: "Syllabus Tracker", href: "/syllabus", icon: "📚", desc: "Topic-wise GATE CSE progress" },
    { id: "tests", label: "Test Series", href: "/tests", icon: "📝", desc: "Log tests & analytics" },
    { id: "calendar", label: "Calendar", href: "/calendar", icon: "📅", desc: "Daily study heatmap" },
    { id: "leaderboard", label: "Leaderboard", href: "/leaderboard", icon: "🏆", desc: "Compete with aspirants" },
    { id: "notes", label: "Notes", href: "/notes", icon: "🗒️", desc: "All notes, one place" },
    { id: "todos", label: "To-do List", href: "/todos", icon: "✅", desc: "Advanced task planner" },
    { id: "doubts", label: "Concepts & Doubts", href: "/doubts", icon: "❓", desc: "Log and clear doubts" },
    { id: "pyq", label: "PYQ Find", href: "/pyq", icon: "🔎", desc: "Previous year questions" },
    { id: "practice", label: "Practice Arena", href: "/practice", icon: "⚔️", desc: "Quick practice sets" },
    { id: "teachers", label: "Konsa Teacher", href: "/teachers", icon: "👨‍🏫", desc: "Pick resources per subject" },
    { id: "prepare", label: "How to Prepare", href: "/prepare-for-gate", icon: "🧭", desc: "GATE prep roadmap" },
  ],

  syllabus: [
    {
      id: "maths", name: "Engineering Mathematics", icon: "🧮", marks: 13, color: "#8b5cf6",
      topics: [
        { id: "maths-la", name: "Linear Algebra" },
        { id: "maths-calc", name: "Calculus" },
        { id: "maths-prob", name: "Probability & Statistics" },
        { id: "maths-dm", name: "Discrete Mathematics" },
      ],
    },
    {
      id: "dl", name: "Digital Logic", icon: "🔌", marks: 6, color: "#f59e0b",
      topics: [
        { id: "dl-num", name: "Number Representation & Computer Arithmetic" },
        { id: "dl-bool", name: "Boolean Algebra & Minimization" },
        { id: "dl-comb", name: "Combinational Circuits" },
        { id: "dl-seq", name: "Sequential Circuits" },
      ],
    },
    {
      id: "coa", name: "Computer Organization & Architecture", icon: "🖥️", marks: 8, color: "#ef4444",
      topics: [
        { id: "coa-ins", name: "Machine Instructions & Addressing Modes" },
        { id: "coa-alu", name: "ALU, Data-path & Control Unit" },
        { id: "coa-pipe", name: "Instruction Pipelining" },
        { id: "coa-mem", name: "Memory Hierarchy — Cache, Main & Secondary" },
        { id: "coa-io", name: "I/O Interface (Interrupt & DMA)" },
      ],
    },
    {
      id: "dsa", name: "Programming & Data Structures", icon: "🌳", marks: 12, color: "#10b981",
      topics: [
        { id: "dsa-c", name: "Programming in C & Recursion" },
        { id: "dsa-stack", name: "Arrays, Stacks & Queues" },
        { id: "dsa-ll", name: "Linked Lists" },
        { id: "dsa-tree", name: "Trees, BST & Binary Heaps" },
        { id: "dsa-graph", name: "Graphs" },
      ],
    },
    {
      id: "algo", name: "Algorithms", icon: "⚙️", marks: 8, color: "#22d3ee",
      topics: [
        { id: "algo-asym", name: "Asymptotic Analysis" },
        { id: "algo-sort", name: "Searching & Sorting" },
        { id: "algo-hash", name: "Hashing" },
        { id: "algo-dac", name: "Divide & Conquer" },
        { id: "algo-greedy", name: "Greedy Approach" },
        { id: "algo-dp", name: "Dynamic Programming" },
        { id: "algo-graph", name: "Graph Algorithms (Traversals, MST, Shortest Path)" },
      ],
    },
    {
      id: "toc", name: "Theory of Computation", icon: "🔄", marks: 8, color: "#ec4899",
      topics: [
        { id: "toc-re", name: "Regular Expressions & Finite Automata" },
        { id: "toc-cfg", name: "Context-free Grammars & Pushdown Automata" },
        { id: "toc-lang", name: "Regular & Context-free Languages, Pumping Lemma" },
        { id: "toc-tm", name: "Turing Machines & Undecidability" },
      ],
    },
    {
      id: "cd", name: "Compiler Design", icon: "🧩", marks: 5, color: "#a3e635",
      topics: [
        { id: "cd-lex", name: "Lexical Analysis" },
        { id: "cd-parse", name: "Parsing (LL / LR)" },
        { id: "cd-sdt", name: "Syntax-Directed Translation" },
        { id: "cd-rt", name: "Runtime Environments" },
        { id: "cd-ic", name: "Intermediate Code Generation" },
        { id: "cd-opt", name: "Code Optimization" },
        { id: "cd-cg", name: "Code Generation" },
      ],
    },
    {
      id: "os", name: "Operating Systems", icon: "🧠", marks: 8, color: "#f97316",
      topics: [
        { id: "os-proc", name: "Processes, Threads & CPU Scheduling" },
        { id: "os-sync", name: "Process Synchronization & Deadlock" },
        { id: "os-mem", name: "Memory Management & Virtual Memory" },
        { id: "os-fs", name: "File Systems & I/O Systems" },
      ],
    },
    {
      id: "dbms", name: "Databases", icon: "🗄️", marks: 8, color: "#38bdf8",
      topics: [
        { id: "db-er", name: "ER Model" },
        { id: "db-rel", name: "Relational Model & Relational Algebra" },
        { id: "db-sql", name: "SQL" },
        { id: "db-norm", name: "Normalization" },
        { id: "db-txn", name: "Transactions & Concurrency Control" },
        { id: "db-index", name: "File Organization, Indexing & B+ Trees" },
      ],
    },
    {
      id: "cn", name: "Computer Networks", icon: "🌐", marks: 8, color: "#14b8a6",
      topics: [
        { id: "cn-osi", name: "ISO/OSI Stack & TCP/IP" },
        { id: "cn-lan", name: "LAN Technologies (Ethernet etc.)" },
        { id: "cn-flow", name: "Flow Control & Error Control" },
        { id: "cn-ip", name: "IPv4, IPv6 & Subnetting" },
        { id: "cn-route", name: "Routing Algorithms" },
        { id: "cn-tcp", name: "TCP, UDP & Sockets" },
        { id: "cn-app", name: "Application Layer Protocols" },
        { id: "cn-sec", name: "Basics of WiFi & Network Security" },
      ],
    },
    {
      id: "apt", name: "General Aptitude", icon: "🧠", marks: 15, color: "#c084fc",
      topics: [
        { id: "apt-verbal", name: "Verbal Aptitude (Grammar, Vocab, Comprehension)" },
        { id: "apt-quant", name: "Numerical Ability (Arithmetic, Ratios, Percentages)" },
        { id: "apt-di", name: "Data Interpretation & Logical Reasoning" },
      ],
    },
  ],

  plans: {
    heading: "STAY CONSISTENT. CRACK GATE.",
    title: "Pricing",
    subtitle: "Every Pro tool, one simple payment.",
    bullets: ["One-time payment", "No auto-renewal", "Unlocks instantly"],
    checkout: "Secure checkout · UPI, cards, netbanking & wallets · card details are never stored",
    priceMonthly: { amount: "₹29", period: "/month", note: null },
    priceBundle: { amount: "₹129", period: "For 5 Months", note: "Effective cost: ₹25.8/month", badge: "TILL GATE 2027" },
    compare: [
      { feature: "Pomodoro Focus Timer", free: true, pro: true },
      { feature: "Syllabus Tracker", free: true, pro: true },
      { feature: "Concepts & Doubts", free: true, pro: true },
      { feature: "GATE Countdown", free: true, pro: true },
      { feature: "Text & Link Share", free: true, pro: true },
      { feature: "Advanced To-do List", free: false, pro: true },
      { feature: "All Notes, One Place", free: false, pro: true },
      { feature: "Test Series & Analytics", free: false, pro: true },
      { feature: "Calendar", free: false, pro: true },
      { feature: "Profile", free: false, pro: true },
      { feature: "Public Profile", free: false, pro: true },
      { feature: "Konsa Teacher", free: false, pro: true },
      { feature: "Leaderboard", free: false, pro: true },
      { feature: "Practice Arena", free: false, pro: true },
      { feature: "GATE PYQ Find", free: false, pro: true },
      { feature: "Notifications", free: false, pro: true },
    ],
    includes: ["Pomodoro Focus Timer", "Syllabus Tracker", "Concepts & Doubts", "GATE Countdown", "Text & Link Share", "Ad-free experience"],
    foot: ["TRACK. FOCUS. IMPROVE. REPEAT.", "Stay consistent today, thank yourself on exam day.", "BUILT FOR ASPIRANTS, BY ASPIRANTS."],
  },

  leaders: [
    { name: "Aarav Sharma", hours: 312, questions: 1284, streak: 34 },
    { name: "Priya Verma", hours: 298, questions: 1150, streak: 29 },
    { name: "Rohit Kumar", hours: 271, questions: 1098, streak: 41 },
    { name: "Sneha Patel", hours: 254, questions: 966, streak: 22 },
    { name: "Aditya Singh", hours: 231, questions: 890, streak: 18 },
    { name: "Kriti Joshi", hours: 214, questions: 812, streak: 27 },
    { name: "Vikram Reddy", hours: 196, questions: 745, streak: 15 },
    { name: "Ananya Iyer", hours: 182, questions: 690, streak: 12 },
    { name: "Harsh Gupta", hours: 168, questions: 620, streak: 9 },
    { name: "Divya Nair", hours: 154, questions: 588, streak: 7 },
  ],

  // Representative practice questions curated to mirror the GATE pattern.
  pyqs: [
    { subject: "DS", q: "Which data structure is most suitable for implementing a LIFO (Last In First Out) order?", options: ["Queue", "Stack", "Array", "Linked List"], answer: 1, explain: "A stack follows Last-In-First-Out (LIFO) order; push and pop both operate on the top." },
    { subject: "DS", q: "The time complexity of binary search on a sorted array of n elements is:", options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"], answer: 1, explain: "Binary search halves the search space each step, giving O(log n)." },
    { subject: "Algo", q: "Which sorting algorithm is NOT comparison-based?", options: ["Merge Sort", "Quick Sort", "Counting Sort", "Heap Sort"], answer: 2, explain: "Counting sort uses key frequencies, not comparisons, and runs in O(n+k)." },
    { subject: "Algo", q: "The recurrence T(n) = 2T(n/2) + n solves to:", options: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"], answer: 1, explain: "This is the classic Merge Sort recurrence — case 2 of the Master Theorem." },
    { subject: "DBMS", q: "Which normal form removes transitive dependencies?", options: ["1NF", "2NF", "3NF", "BCNF"], answer: 2, explain: "A relation is in 3NF when it is in 2NF and has no transitive dependency of non-key attributes on the key." },
    { subject: "DBMS", q: "The default isolation level that avoids dirty reads but allows non-repeatable reads is:", options: ["READ UNCOMMITTED", "READ COMMITTED", "REPEATABLE READ", "SERIALIZABLE"], answer: 1, explain: "READ COMMITTED prevents dirty reads; non-repeatable reads can still occur." },
    { subject: "OS", q: "A deadlock can be broken by:", options: ["Mutual exclusion", "Hold and wait", "Preemption of resources", "Circular wait"], answer: 2, explain: "Preempting resources from a process breaks one of the four Coffman conditions." },
    { subject: "OS", q: "Which scheduling algorithm can cause starvation?", options: ["Round Robin", "FCFS", "Shortest Job First", "Fair Share"], answer: 2, explain: "SJF favours short jobs; long jobs may be starved indefinitely." },
    { subject: "CN", q: "TCP establishes a connection using a:", options: ["2-way handshake", "3-way handshake", "4-way handshake", "1-way handshake"], answer: 1, explain: "TCP uses SYN → SYN-ACK → ACK, a three-way handshake." },
    { subject: "CN", q: "Which protocol maps IP addresses to MAC addresses?", options: ["DNS", "ARP", "DHCP", "ICMP"], answer: 1, explain: "The Address Resolution Protocol (ARP) resolves IP to MAC within a LAN." },
    { subject: "TOC", q: "Which language class is accepted by a finite automaton?", options: ["Context-free", "Regular", "Context-sensitive", "Recursively enumerable"], answer: 1, explain: "Finite automata accept exactly the regular languages." },
    { subject: "TOC", q: "A PDA with two stacks is equivalent in power to a:", options: ["Finite automaton", "Turing machine", "Regular expression", "CFG"], answer: 1, explain: "Two stacks can simulate a Turing machine tape." },
    { subject: "COA", q: "Pipelining improves CPU performance primarily by:", options: ["Reducing clock period", "Increasing instruction-level parallelism", "Reducing cache misses", "Removing branches"], answer: 1, explain: "Pipelining overlaps the execution of multiple instructions to raise throughput." },
    { subject: "COA", q: "Cache memory is placed between:", options: ["RAM and Disk", "CPU and RAM", "CPU and Registers", "Registers and ALU"], answer: 1, explain: "Cache sits between the CPU and main memory to hide memory latency." },
    { subject: "DL", q: "How many 3-input NAND gates are needed to implement a 3-input AND gate?", options: ["1", "2", "3", "4"], answer: 1, explain: "A 3-input AND is the complement of a 3-input NAND output — feed NAND output through a NAND configured as inverter." },
    { subject: "Maths", q: "The number of edges in a complete graph with n vertices is:", options: ["n(n-1)/2", "n(n+1)/2", "n²/2", "n-1"], answer: 0, explain: "Each of the n vertices connects to n-1 others, halved to avoid double counting." },
    { subject: "Maths", q: "Two events A and B are independent if:", options: ["P(A∩B) = P(A)·P(B)", "P(A∪B) = P(A)+P(B)", "P(A|B) = 0", "P(A) = P(B)"], answer: 0, explain: "Independence is defined by P(A∩B) = P(A)·P(B)." },
    { subject: "CD", q: "Which phase of a compiler builds a symbol table entry for every identifier?", options: ["Lexical analysis", "Code generation", "Optimization", "Linking"], answer: 0, explain: "The lexical analyzer recognizes tokens and records identifiers in the symbol table." },
    { subject: "Apt", q: "If 40% of a number is 60, then the number is:", options: ["120", "150", "140", "160"], answer: 1, explain: "0.4x = 60 → x = 150." },
  ],

  practice: [
    { subject: "DS", q: "The in-order traversal of a binary search tree yields elements in:", options: ["Descending order", "Sorted order", "Level order", "Random order"], answer: 1 },
    { subject: "Algo", q: "The average-case complexity of Quick Sort is:", options: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"], answer: 1 },
    { subject: "DBMS", q: "An attribute that uniquely identifies a tuple is a:", options: ["Foreign key", "Primary key", "Index", "View"], answer: 1 },
    { subject: "OS", q: "Thrashing occurs due to:", options: ["High CPU load", "Excessive paging", "Small TLB", "Disk failure"], answer: 1 },
    { subject: "CN", q: "The size of an IPv4 address is:", options: ["16 bits", "32 bits", "64 bits", "128 bits"], answer: 1 },
    { subject: "TOC", q: "The language {aⁿbⁿ | n ≥ 0} is:", options: ["Regular", "Context-free", "Finite", "Regular and finite"], answer: 1 },
    { subject: "Maths", q: "The determinant of a 2×2 identity matrix is:", options: ["0", "1", "2", "-1"], answer: 1 },
    { subject: "Apt", q: "The next term in 2, 6, 12, 20, 30, … is:", options: ["40", "42", "44", "46"], answer: 1 },
  ],

  teachers: [
    { subject: "Engineering Mathematics", resource: "NPTEL — Engineering Mathematics (IIT)", type: "Course" },
    { subject: "Digital Logic", resource: "NPTEL — Digital Circuits (IIT)", type: "Course" },
    { subject: "Computer Organization & Architecture", resource: "NPTEL — Computer Architecture", type: "Course" },
    { subject: "Programming & Data Structures", resource: "NPTEL — Data Structures & Algorithms", type: "Course" },
    { subject: "Algorithms", resource: "NPTEL — Design & Analysis of Algorithms", type: "Course" },
    { subject: "Theory of Computation", resource: "NPTEL — Theory of Computation", type: "Course" },
    { subject: "Compiler Design", resource: "NPTEL — Compiler Design", type: "Course" },
    { subject: "Operating Systems", resource: "NPTEL — Operating Systems", type: "Course" },
    { subject: "Databases", resource: "NPTEL — Database Management Systems", type: "Course" },
    { subject: "Computer Networks", resource: "NPTEL — Computer Networks", type: "Course" },
    { subject: "General Aptitude", resource: "Daily practice + previous-year aptitude sets", type: "Practice" },
  ],

  faq: [
    {
      q: "Why is there a paid plan?",
      a: "Running a platform like this 24×7 involves real costs for servers, databases, and hosting. These minimal plans ensure the platform remains stable and available for all aspirants until GATE 2027 without compromising on speed or reliability.",
    },
    {
      q: "Is there a free trial?",
      a: "Yes! Every aspirant gets a 21-day free trial so you can experience everything the platform has to offer.",
    },
    {
      q: "Do I need to add payment details for the trial?",
      a: "No, you can start your 21-day free trial without entering any credit card or payment information. It is completely risk-free.",
    },
    {
      q: "What happens after 21 days?",
      a: "After the 21 days, you will be prompted to choose one of our minimal plans (like ₹29/month or ₹129 for 5 months) to continue accessing the tracker and tracking your preparation. If you choose not to subscribe, your data will remain safe, but access may be restricted.",
    },
    {
      q: "Are you doing this to make money?",
      a: "Absolutely not. The prices are intentionally kept as low as possible just to cover the operational and server costs. This tracker was built by an aspirant for aspirants to succeed, not as a business to make profits.",
    },
    {
      q: "Are the plans refundable?",
      a: "No, the amount paid for a plan will be non-refundable. Since a full 21-day free trial is given before any payment is required, we'd request you to explore the platform thoroughly during that period and take your decision accordingly before subscribing.",
    },
  ],
};
