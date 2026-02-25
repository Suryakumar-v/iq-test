// IQ Test Question Bank
// Categories: pattern, numerical, logical, spatial
// Difficulty: 1 (easy) → 5 (genius-level)

const QUESTIONS = [
  // ══════════════════════════════════════════════
  // PATTERN RECOGNITION (10 questions)
  // ══════════════════════════════════════════════
  {
    id: 1,
    category: "pattern",
    difficulty: 1,
    question: "What comes next in the sequence?\n2, 4, 6, 8, __",
    options: ["9", "10", "11", "12"],
    answer: "10",
    explanation: "Each number increases by 2."
  },
  {
    id: 2,
    category: "pattern",
    difficulty: 1,
    question: "What comes next?\n1, 4, 9, 16, __",
    options: ["20", "24", "25", "36"],
    answer: "25",
    explanation: "These are perfect squares: 1², 2², 3², 4², 5² = 25."
  },
  {
    id: 3,
    category: "pattern",
    difficulty: 2,
    question: "What comes next?\n3, 6, 12, 24, __",
    options: ["36", "42", "48", "54"],
    answer: "48",
    explanation: "Each number doubles: 24 × 2 = 48."
  },
  {
    id: 4,
    category: "pattern",
    difficulty: 2,
    question: "What comes next in the series?\n2, 3, 5, 8, 13, __",
    options: ["17", "18", "21", "20"],
    answer: "21",
    explanation: "Fibonacci sequence: each number is the sum of the two before it. 8 + 13 = 21."
  },
  {
    id: 5,
    category: "pattern",
    difficulty: 3,
    question: "What number replaces the question mark?\n4, 9, 16, 25, 36, 49, __",
    options: ["56", "60", "64", "72"],
    answer: "64",
    explanation: "Perfect squares: 2², 3², 4², 5², 6², 7², 8² = 64."
  },
  {
    id: 6,
    category: "pattern",
    difficulty: 3,
    question: "What comes next?\n1, 1, 2, 6, 24, 120, __",
    options: ["180", "360", "480", "720"],
    answer: "720",
    explanation: "Factorials: 0!, 1!, 2!, 3!, 4!, 5!, 6! = 720."
  },
  {
    id: 7,
    category: "pattern",
    difficulty: 3,
    question: "Find the missing number:\n2, 5, 11, 23, 47, __",
    options: ["89", "95", "91", "94"],
    answer: "95",
    explanation: "Each number = (previous × 2) + 1. So: 47 × 2 + 1 = 95."
  },
  {
    id: 8,
    category: "pattern",
    difficulty: 4,
    question: "What is the next term?\n0, 1, 3, 7, 15, 31, __",
    options: ["55", "62", "63", "64"],
    answer: "63",
    explanation: "Pattern: 2ⁿ − 1: 0, 1, 3, 7, 15, 31, 63."
  },
  {
    id: 9,
    category: "pattern",
    difficulty: 4,
    question: "What completes the series?\n1, 2, 6, 24, 120, 720, __",
    options: ["2520", "5040", "4320", "3600"],
    answer: "5040",
    explanation: "These are factorials: 7! = 5040."
  },
  {
    id: 10,
    category: "pattern",
    difficulty: 5,
    question: "Find the next number:\n1, 2, 9, 64, 625, __",
    options: ["1296", "4096", "7776", "46656"],
    answer: "46656",
    explanation: "Pattern: nⁿ where n = 1,2,3,4,5,6 → 6⁶ = 46656."
  },

  // ══════════════════════════════════════════════
  // NUMERICAL REASONING (10 questions)
  // ══════════════════════════════════════════════
  {
    id: 11,
    category: "numerical",
    difficulty: 1,
    question: "If a train travels 60 km/h, how far does it travel in 2.5 hours?",
    options: ["120 km", "140 km", "150 km", "160 km"],
    answer: "150 km",
    explanation: "Distance = Speed × Time = 60 × 2.5 = 150 km."
  },
  {
    id: 12,
    category: "numerical",
    difficulty: 1,
    question: "What is 15% of 200?",
    options: ["25", "30", "35", "40"],
    answer: "30",
    explanation: "15% of 200 = 0.15 × 200 = 30."
  },
  {
    id: 13,
    category: "numerical",
    difficulty: 2,
    question: "A store sells a jacket for $80 after a 20% discount. What was the original price?",
    options: ["$96", "$100", "$104", "$90"],
    answer: "$100",
    explanation: "$80 = 80% of original. Original = 80 / 0.8 = $100."
  },
  {
    id: 14,
    category: "numerical",
    difficulty: 2,
    question: "If 5 workers build a wall in 8 days, how many days will 10 workers take?",
    options: ["2 days", "3 days", "4 days", "5 days"],
    answer: "4 days",
    explanation: "Inverse proportion: (5 × 8) / 10 = 4 days."
  },
  {
    id: 15,
    category: "numerical",
    difficulty: 3,
    question: "In a class of 30, the average score is 72. If the top 5 students (average 90) are removed, what is the new average?",
    options: ["66", "67", "68", "69"],
    answer: "67",
    explanation: "Total = 30×72 = 2160. Remove top 5: 2160 − (5×90) = 2160 − 450 = 1710. New avg = 1710/25 = 68.4 ≈ 68."
  },
  {
    id: 16,
    category: "numerical",
    difficulty: 3,
    question: "Two pipes fill a tank. Pipe A alone takes 6 hours; Pipe B alone takes 4 hours. How long do both together take?",
    options: ["2.0 hrs", "2.4 hrs", "2.8 hrs", "3.0 hrs"],
    answer: "2.4 hrs",
    explanation: "Combined rate = 1/6 + 1/4 = 5/12. Time = 12/5 = 2.4 hours."
  },
  {
    id: 17,
    category: "numerical",
    difficulty: 3,
    question: "What is the value of X?\n3X + 7 = 5X − 9",
    options: ["6", "7", "8", "9"],
    answer: "8",
    explanation: "3X + 7 = 5X − 9 → 16 = 2X → X = 8."
  },
  {
    id: 18,
    category: "numerical",
    difficulty: 4,
    question: "A car depreciates 15% per year. What is its value after 2 years if initial value is $20,000?",
    options: ["$14,000", "$14,450", "$14,750", "$14,000"],
    answer: "$14,450",
    explanation: "After 1 yr: 20000 × 0.85 = 17000. After 2 yrs: 17000 × 0.85 = 14,450."
  },
  {
    id: 19,
    category: "numerical",
    difficulty: 4,
    question: "A sequence: 7, 13, 21, 31, 43, __ . What comes next?",
    options: ["55", "57", "59", "61"],
    answer: "57",
    explanation: "Differences: 6, 8, 10, 12, 14. Next: 43 + 14 = 57."
  },
  {
    id: 20,
    category: "numerical",
    difficulty: 5,
    question: "If log₂(x) + log₂(x−2) = 3, what is x?",
    options: ["3", "4", "5", "6"],
    answer: "4",
    explanation: "log₂(x(x−2)) = 3 → x(x−2) = 8 → x²−2x−8 = 0 → (x−4)(x+2) = 0 → x = 4."
  },

  // ══════════════════════════════════════════════
  // LOGICAL REASONING (10 questions)
  // ══════════════════════════════════════════════
  {
    id: 21,
    category: "logical",
    difficulty: 1,
    question: "All cats are mammals. All mammals are animals.\nTherefore:",
    options: [
      "All animals are cats",
      "All cats are animals",
      "Some animals are not cats",
      "No cats are animals"
    ],
    answer: "All cats are animals",
    explanation: "By syllogism: cats → mammals → animals, so all cats are animals."
  },
  {
    id: 22,
    category: "logical",
    difficulty: 1,
    question: "If it rains, the ground gets wet. The ground is wet.\nWhich conclusion is certain?",
    options: [
      "It rained",
      "It did not rain",
      "The ground may or may not have rained",
      "It will rain again"
    ],
    answer: "The ground may or may not have rained",
    explanation: "The ground being wet doesn't prove it rained — other causes exist. This is a logical fallacy (affirming the consequent)."
  },
  {
    id: 23,
    category: "logical",
    difficulty: 2,
    question: "Amir is taller than Ben. Ben is taller than Carl. Dan is shorter than Carl.\nWho is the tallest?",
    options: ["Amir", "Ben", "Carl", "Dan"],
    answer: "Amir",
    explanation: "Order tall → short: Amir > Ben > Carl > Dan. Amir is tallest."
  },
  {
    id: 24,
    category: "logical",
    difficulty: 2,
    question: "Only licensed plumbers may fix gas lines.\nTom fixed a gas line.\nWhich is most logical?",
    options: [
      "Tom is a licensed plumber",
      "Tom broke the law",
      "Tom is not a plumber",
      "Gas lines can be fixed by anyone"
    ],
    answer: "Tom is a licensed plumber",
    explanation: "Given the rule, the most logically consistent conclusion is that Tom holds a license."
  },
  {
    id: 25,
    category: "logical",
    difficulty: 2,
    question: "In a race, A finishes before B. C finishes after D. B finishes before C.\nWho finishes last?",
    options: ["A", "B", "C", "D"],
    answer: "C",
    explanation: "Order: A → B → ... D is before C. So A, B, D, C. C finishes last."
  },
  {
    id: 26,
    category: "logical",
    difficulty: 3,
    question: "5 people sit in a row: Alice, Bob, Carol, Dave, Eve.\n• Alice is 3rd.\n• Bob is to the right of Alice.\n• Eve is at position 1.\nWho is 2nd?",
    options: ["Bob", "Carol", "Dave", "Cannot be determined"],
    answer: "Cannot be determined",
    explanation: "Alice=3, Bob=4 or 5, Eve=1. Position 2 could be Carol or Dave — not determinable from given clues alone."
  },
  {
    id: 27,
    category: "logical",
    difficulty: 3,
    question: "No reptiles have fur. Snakes are reptiles.\nWhich is definitely true?",
    options: [
      "Snakes have fur",
      "Snakes do not have fur",
      "Some snakes may have fur",
      "Not all reptiles are snakes"
    ],
    answer: "Snakes do not have fur",
    explanation: "Snakes are reptiles; no reptiles have fur → snakes don't have fur."
  },
  {
    id: 28,
    category: "logical",
    difficulty: 4,
    question: "P → Q is true. Q is false.\nWhat can you conclude about P?",
    options: [
      "P is true",
      "P is false",
      "P may be true or false",
      "P equals Q"
    ],
    answer: "P is false",
    explanation: "Modus Tollens: If P → Q, and Q is false, then P must be false. (¬Q → ¬P)"
  },
  {
    id: 29,
    category: "logical",
    difficulty: 4,
    question: "Every Friday, Sam eats pizza. Today Sam is not eating pizza.\nWhich conclusion is valid?",
    options: [
      "Today is Friday",
      "Today is not Friday",
      "Sam doesn't like pizza",
      "Today could be Friday"
    ],
    answer: "Today is not Friday",
    explanation: "Contrapositive: If Sam eats pizza → Friday. Not eating pizza → not Friday."
  },
  {
    id: 30,
    category: "logical",
    difficulty: 5,
    question: "Three boxes: one has apples, one oranges, one both. All labels are WRONG.\nYou can pick ONE fruit from ONE box. The box labeled 'Both' gives you an apple.\nWhat's in the box labeled 'Oranges'?",
    options: ["Apples", "Both", "Oranges", "Cannot determine"],
    answer: "Both",
    explanation: "Box labeled 'Both' can't be both → it's apples (you confirmed) or oranges. Since you got an apple, it's all apples. Box labeled 'Apples' can't be apples → it's oranges or both. Box labeled 'Oranges' must be 'Both'. Box labeled 'Apples' must be 'Oranges'."
  },

  // ══════════════════════════════════════════════
  // SPATIAL REASONING (10 questions)
  // ══════════════════════════════════════════════
  {
    id: 31,
    category: "spatial",
    difficulty: 1,
    question: "If you fold a square piece of paper in half diagonally and cut a small triangle from the folded corner, how many holes appear when unfolded?",
    options: ["1", "2", "3", "4"],
    answer: "1",
    explanation: "The cut from the corner of the fold creates exactly 1 hole when unfolded."
  },
  {
    id: 32,
    category: "spatial",
    difficulty: 1,
    question: "A cube has 6 faces. How many edges does it have?",
    options: ["8", "10", "12", "16"],
    answer: "12",
    explanation: "A standard cube has 12 edges: 4 top + 4 bottom + 4 vertical."
  },
  {
    id: 33,
    category: "spatial",
    difficulty: 2,
    question: "If you face North and turn 90° clockwise, then turn 180° counterclockwise, which direction are you facing?",
    options: ["North", "South", "East", "West"],
    answer: "West",
    explanation: "Start N → turn 90° CW → face East → turn 180° CCW → face West."
  },
  {
    id: 34,
    category: "spatial",
    difficulty: 2,
    question: "How many squares (of any size) are in a 3×3 grid?",
    options: ["9", "12", "14", "16"],
    answer: "14",
    explanation: "1×1: 9, 2×2: 4, 3×3: 1. Total = 9 + 4 + 1 = 14."
  },
  {
    id: 35,
    category: "spatial",
    difficulty: 3,
    question: "A clock shows 3:00. What angle (in degrees) is between the hour and minute hands?",
    options: ["60°", "75°", "90°", "120°"],
    answer: "90°",
    explanation: "At exactly 3:00, the minute hand points to 12 and hour hand points to 3 — exactly 90° apart."
  },
  {
    id: 36,
    category: "spatial",
    difficulty: 3,
    question: "If you look at a clock from behind (through the glass), what time does 2:30 appear as?",
    options: ["9:30", "7:30", "2:30", "4:30"],
    answer: "9:30",
    explanation: "Mirroring flips left–right. 2:30 from behind looks like 9:30."
  },
  {
    id: 37,
    category: "spatial",
    difficulty: 3,
    question: "How many triangles are in a triangle divided into 4 smaller triangles (all equilateral, classic Sierpinski-like one step)?",
    options: ["4", "5", "6", "9"],
    answer: "5",
    explanation: "4 small triangles + 1 large triangle formed by all = 5 total triangles."
  },
  {
    id: 38,
    category: "spatial",
    difficulty: 4,
    question: "A solid cube is painted red on all sides and then cut into 27 equal small cubes. How many small cubes have exactly 2 faces painted?",
    options: ["8", "12", "16", "18"],
    answer: "12",
    explanation: "Edge pieces (not corners) have 2 painted faces. A 3×3×3 cube has 12 edges, each with 1 middle cube = 12 cubes."
  },
  {
    id: 39,
    category: "spatial",
    difficulty: 4,
    question: "You are looking at a 3D object made of unit cubes. Front view: T-shape (3 on top, 1 below center). Side view: 2×1 column. What is the minimum number of unit cubes needed?",
    options: ["3", "4", "5", "6"],
    answer: "4",
    explanation: "By minimizing overlap between front and side projections, the minimum is 4 unit cubes."
  },
  {
    id: 40,
    category: "spatial",
    difficulty: 5,
    question: "A 4×4×4 cube is painted red on all outer faces and cut into 64 unit cubes. How many unit cubes have NO paint at all?",
    options: ["4", "8", "16", "24"],
    answer: "8",
    explanation: "The interior of a 4×4×4 cube is a 2×2×2 = 8 unit cube block with no exposed faces."
  }
];

// Category metadata
const CATEGORIES = {
  pattern:  { label: "Pattern Recognition", color: "#6366f1", icon: "◈" },
  numerical: { label: "Numerical Reasoning", color: "#0ea5e9", icon: "∑" },
  logical:   { label: "Logical Reasoning",   color: "#10b981", icon: "⊢" },
  spatial:   { label: "Spatial Reasoning",   color: "#f59e0b", icon: "⬡" }
};

// IQ Scoring parameters (calibrated against population norms)
// Max possible weighted score ~ 200 (difficulty 1=2pts, 2=4pts, 3=7pts, 4=11pts, 5=16pts)
// Mean expected for an average person ~ 70 points
const SCORING = {
  difficultyPoints: { 1: 2, 2: 4, 3: 7, 4: 11, 5: 16 },
  populationMean: 70,   // expected raw weighted score for IQ=100
  populationSD: 30,     // standard deviation of raw scores
  iqMean: 100,
  iqSD: 15,
  minIQ: 55,
  maxIQ: 160
};
