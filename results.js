const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle");
const missionTitle = document.getElementById("missionTitle");
const missionGrid = document.getElementById("missionGrid");
const makeRealityButton = document.getElementById("makeRealityButton");
const customizeButton = document.getElementById("customizeButton");
const approvalPanel = document.getElementById("approvalPanel");
const approvalList = document.getElementById("approvalList");
const approvalStatus = document.getElementById("approvalStatus");

const STORAGE_KEY = "kastiz-one-theme";
const RESULTS_KEY = "kastiz-one-results";
const MISSION_KEY = "kastiz-one-current-mission";

const fallbackMission = {
  mission: "Plan my Japan trip",
  slug: "plan-my-japan-trip",
  source: "fallback",
  createdAt: new Date().toISOString()
};

const missionDataByType = {
  japan: [
    {
      title: "Flights",
      label: "Recommended",
      value: "Korean Air",
      reason: "Best quality, direct routes, strong schedule reliability, and premium service for Korea to Japan travel.",
      options: [
        ["Best quality", "Korean Air"],
        ["Cheapest", "Jeju Air"],
        ["Best direct flight", "Korean Air"]
      ]
    },
    {
      title: "Hotels",
      label: "Recommended",
      value: "Hilton Tokyo",
      reason: "Strong location, reliable service, airport access, and business-grade comfort.",
      options: [
        ["Best comfort", "Hilton Tokyo"],
        ["Best value", "JR Kyushu Hotel Blossom"],
        ["Best luxury", "Aman Tokyo"]
      ]
    },
    {
      title: "Insurance",
      label: "Protected",
      value: "Travel medical + cancellation",
      reason: "Covers medical emergencies, delays, baggage, and cancellation risks before execution.",
      options: [
        ["Medical", "Included"],
        ["Baggage", "Included"],
        ["Cancellation", "Recommended"]
      ]
    },
    {
      title: "JR Pass",
      label: "Review",
      value: "Route-based decision",
      reason: "ONE checks your exact cities first because JR Pass only makes sense when long-distance rail exceeds pass cost.",
      options: [
        ["Tokyo only", "Skip"],
        ["Tokyo + Kyoto", "Compare"],
        ["Multi-city", "Likely useful"]
      ]
    },
    {
      title: "Restaurants",
      label: "Curated",
      value: "Local + premium mix",
      reason: "Balanced between famous reservations, local hidden spots, and convenient meals near your route.",
      options: [
        ["Sushi", "Reservation-ready"],
        ["Ramen", "Local shortlist"],
        ["Cafe", "Route matched"]
      ]
    },
    {
      title: "Airport Transfer",
      label: "Recommended",
      value: "Airport limousine",
      reason: "Best balance of comfort, luggage handling, cost, and direct access to major hotel zones.",
      options: [
        ["Best comfort", "Private car"],
        ["Best value", "Limousine bus"],
        ["Fastest", "Train"]
      ]
    },
    {
      title: "Budget",
      label: "Estimated",
      value: "₩1.8M – ₩3.2M",
      reason: "Estimated for flights, hotel, meals, transport, insurance, and flexible activity spending.",
      options: [
        ["Economy", "₩1.2M – ₩1.8M"],
        ["Balanced", "₩1.8M – ₩3.2M"],
        ["Premium", "₩3.2M+"]
      ],
      wide: true
    },
    {
      title: "Timeline",
      label: "Ready",
      value: "5-day mission plan",
      reason: "Arrival, hotel check-in, restaurants, transport, shopping, and return route are structured into one editable plan.",
      options: [
        ["Day 1", "Arrival + hotel + dinner"],
        ["Day 2–4", "Core itinerary"],
        ["Day 5", "Return + airport transfer"]
      ],
      wide: true
    }
  ],
  laptop: [
    {
      title: "Best Laptop",
      label: "Recommended",
      value: "MacBook Air 13",
      reason: "Best all-around choice for battery life, portability, reliability, resale value, and everyday performance.",
      options: [
        ["Best overall", "MacBook Air 13"],
        ["Best Windows", "Dell XPS 13"],
        ["Best budget", "Lenovo IdeaPad"]
      ]
    },
    {
      title: "Performance",
      label: "Matched",
      value: "16GB RAM baseline",
      reason: "Keeps the device fast for multitasking, browser-heavy work, documents, AI tools, and long-term use.",
      options: [
        ["Minimum", "8GB"],
        ["Recommended", "16GB"],
        ["Heavy work", "24GB+"]
      ]
    },
    {
      title: "Storage",
      label: "Recommended",
      value: "512GB SSD",
      reason: "Enough for documents, apps, photos, teaching files, downloads, and business workflows without overpaying.",
      options: [
        ["Light use", "256GB"],
        ["Balanced", "512GB"],
        ["Creative work", "1TB+"]
      ]
    },
    {
      title: "Where to Buy",
      label: "Prepared",
      value: "Apple + Coupang + official retailers",
      reason: "ONE compares warranty, return policy, delivery speed, card discounts, and final checkout price.",
      options: [
        ["Warranty", "Official store"],
        ["Fast delivery", "Coupang"],
        ["Discounts", "Card events"]
      ]
    },
    {
      title: "Budget",
      label: "Estimated",
      value: "₩1.3M – ₩1.9M",
      reason: "Balanced range for premium quality without overspending on unnecessary specs.",
      options: [
        ["Budget", "₩700K – ₩1.1M"],
        ["Balanced", "₩1.3M – ₩1.9M"],
        ["Premium", "₩2.0M+"]
      ],
      wide: true
    },
    {
      title: "Setup",
      label: "Included",
      value: "Ready-to-work configuration",
      reason: "ONE prepares account setup, app list, browser setup, cloud backup, and productivity workspace.",
      options: [
        ["Apps", "Prepared"],
        ["Backup", "Prepared"],
        ["Accessories", "Matched"]
      ],
      wide: true
    }
  ],
  business: [
    {
      title: "Business Structure",
      label: "Recommended",
      value: "Lean launch",
      reason: "Start with the smallest legal and operational setup that can validate demand before major spending.",
      options: [
        ["Fastest", "Sole proprietor"],
        ["Scalable", "Corporation"],
        ["Test first", "Landing page"]
      ]
    },
    {
      title: "Brand",
      label: "Prepared",
      value: "Name + positioning",
      reason: "ONE prepares the offer, target customer, pricing angle, and trust-building brand message.",
      options: [
        ["Name", "Shortlist"],
        ["Positioning", "Premium"],
        ["Trust", "Proof system"]
      ]
    },
    {
      title: "Website",
      label: "Ready",
      value: "Landing page first",
      reason: "Fastest path to collecting leads, testing demand, and avoiding unnecessary platform complexity.",
      options: [
        ["Homepage", "Required"],
        ["Payments", "After validation"],
        ["Analytics", "Included"]
      ]
    },
    {
      title: "Legal",
      label: "Review",
      value: "Registration + terms",
      reason: "ONE prepares business registration steps, policy pages, contracts, and compliance checklist before launch.",
      options: [
        ["Registration", "Prepared"],
        ["Terms", "Prepared"],
        ["Privacy", "Prepared"]
      ]
    },
    {
      title: "Budget",
      label: "Estimated",
      value: "₩500K – ₩3M",
      reason: "Launch cost depends on website, registration, branding, ads, tools, and whether outside providers are used.",
      options: [
        ["Lean", "₩500K+"],
        ["Professional", "₩1.5M+"],
        ["Premium", "₩3M+"]
      ],
      wide: true
    },
    {
      title: "Timeline",
      label: "Execution",
      value: "14-day launch sprint",
      reason: "Offer, brand, landing page, lead capture, outreach, payment path, and first customer workflow.",
      options: [
        ["Days 1–3", "Offer"],
        ["Days 4–8", "Build"],
        ["Days 9–14", "Launch"]
      ],
      wide: true
    }
  ],
  default: [
    {
      title: "Mission Plan",
      label: "Recommended",
      value: "Prepared execution path",
      reason: "ONE breaks the mission into clear decisions, provider options, risks, budget, and next actions.",
      options: [
        ["Approach", "Best quality"],
        ["Backup", "Lower cost"],
        ["Execution", "User-approved"]
      ]
    },
    {
      title: "Trusted Providers",
      label: "Shortlist",
      value: "Best-fit providers",
      reason: "ONE compares quality, price, reliability, location, service level, and approval requirements.",
      options: [
        ["Premium", "Best service"],
        ["Value", "Best price"],
        ["Fastest", "Quickest start"]
      ]
    },
    {
      title: "Budget",
      label: "Estimated",
      value: "Editable range",
      reason: "ONE prepares budget ranges before any spending so every decision stays under user control.",
      options: [
        ["Low", "Cost-saving"],
        ["Balanced", "Recommended"],
        ["Premium", "Best quality"]
      ]
    },
    {
      title: "Timeline",
      label: "Ready",
      value: "Step-by-step execution",
      reason: "ONE sequences the mission so the user can approve, customize, and execute without mental overload.",
      options: [
        ["Prepare", "Now"],
        ["Approve", "Before spending"],
        ["Execute", "After approval"]
      ]
    },
    {
      title: "Risk Check",
      label: "Protected",
      value: "Approval-first execution",
      reason: "ONE never commits, books, purchases, signs, or spends money until the user explicitly approves.",
      options: [
        ["Money", "Protected"],
        ["Contracts", "Approval needed"],
        ["Changes", "Editable"]
      ],
      wide: true
    },
    {
      title: "Next Actions",
      label: "Mission Ready",
      value: "Customize or approve",
      reason: "Use Customize to edit every card or Make It Reality to begin the approved execution sequence.",
      options: [
        ["Edit", "Customize"],
        ["Approve", "Make It Reality"],
        ["Control", "Always yours"]
      ],
      wide: true
    }
  ]
};

const approvalSteps = [
  "Booking flights...",
  "Hotel...",
  "Insurance...",
  "Visa...",
  "Restaurants...",
  "Transfers...",
  "Mission Complete."
];

const loadTheme = () => {
  const savedTheme = localStorage.getItem(STORAGE_KEY) || "light";
  root.setAttribute("data-theme", savedTheme);
  themeToggle.setAttribute("aria-pressed", String(savedTheme === "midnight"));

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", savedTheme === "midnight" ? "#211f1c" : "#f7f5f0");
};

const setTheme = (theme) => {
  const nextTheme = theme === "midnight" ? "midnight" : "light";
  localStorage.setItem(STORAGE_KEY, nextTheme);
  loadTheme();
};

const getMission = () => {
  try {
    const resultsRaw = sessionStorage.getItem(RESULTS_KEY);
    const missionRaw = sessionStorage.getItem(MISSION_KEY);
    return JSON.parse(resultsRaw || missionRaw) || fallbackMission;
  } catch {
    return fallbackMission;
  }
};

const getMissionType = (mission) => {
  const text = mission.toLowerCase();

  if (text.includes("japan") || text.includes("tokyo") || text.includes("kyoto") || text.includes("trip") || text.includes("travel")) {
    return "japan";
  }

  if (text.includes("laptop") || text.includes("computer") || text.includes("macbook") || text.includes("pc")) {
    return "laptop";
  }

  if (text.includes("business") || text.includes("startup") || text.includes("company") || text.includes("brand")) {
    return "business";
  }

  return "default";
};

const createCard = (item, index) => {
  const article = document.createElement("article");
  article.className = "mission-card";

  if (item.wide) {
    article.classList.add("is-wide");
  }

  article.style.animationDelay = `${index * 55}ms`;

  const options = item.options
    .map(([key, value]) => {
      return `
        <div class="option-row">
          <span class="option-key">${key}</span>
          <span class="option-value">${value}</span>
        </div>
      `;
    })
    .join("");

  article.innerHTML = `
    <div class="card-top">
      <h2 class="card-title">${item.title}</h2>
      <span class="card-label">${item.label}</span>
    </div>

    <div class="recommendation">
      <p class="recommendation-label">Recommended:</p>
      <p class="recommendation-value">${item.value}</p>
    </div>

    <p class="reason">${item.reason}</p>

    <div class="option-list">
      ${options}
    </div>

    <div class="card-actions">
      <button class="modify-button" type="button" data-card="${item.title}">Modify</button>
    </div>
  `;

  return article;
};

const renderMission = () => {
  const mission = getMission();
  const type = getMissionType(mission.mission);
  const cards = missionDataByType[type];

  missionTitle.textContent = mission.mission;

  missionGrid.innerHTML = "";

  cards.forEach((item, index) => {
    missionGrid.appendChild(createCard(item, index));
  });
};

const renderApprovalList = () => {
  approvalList.innerHTML = approvalSteps
    .map((step) => {
      return `
        <div class="approval-item">
          <span class="approval-check">•</span>
          <span>${step}</span>
        </div>
      `;
    })
    .join("");
};

const runApprovalSequence = () => {
  const items = [...approvalList.querySelectorAll(".approval-item")];

  makeRealityButton.disabled = true;
  customizeButton.disabled = true;
  approvalPanel.hidden = false;
  approvalPanel.scrollIntoView({ behavior: "smooth", block: "start" });

  items.forEach((item, index) => {
    setTimeout(() => {
      item.classList.add("is-complete");
      item.querySelector(".approval-check").textContent = "✓";

      if (index < items.length - 1) {
        approvalStatus.textContent = item.textContent.trim();
      } else {
        approvalStatus.textContent = "Mission Complete";
      }
    }, index * 720);
  });
};

const enableCustomization = () => {
  const buttons = document.querySelectorAll(".modify-button");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".mission-card");
      card.classList.toggle("is-editing");
      button.textContent = card.classList.contains("is-editing") ? "Editing" : "Modify";
    });
  });

  customizeButton.addEventListener("click", () => {
    document.querySelector(".mission-card")?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  });
};

themeToggle.addEventListener("click", () => {
  const currentTheme = root.getAttribute("data-theme") || "light";
  setTheme(currentTheme === "midnight" ? "light" : "midnight");
});

makeRealityButton.addEventListener("click", runApprovalSequence);

loadTheme();
renderMission();
renderApprovalList();
enableCustomization();
