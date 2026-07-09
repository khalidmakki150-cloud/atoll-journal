// Atoll Journal - main.js
// Khalid Makki, Student ID 24229027

document.addEventListener("DOMContentLoaded", function () {
  initHeaderScroll();
  initNavToggle();
  initScrollReveal();
  stampYear();
  showWelcomeBanner();
  initTripPlanner();
});

// adds a shadow/background to the header once you've scrolled past it
function initHeaderScroll() {
  var header = document.querySelector(".site-header");
  if (!header) return;

  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

// hamburger menu for mobile
function initNavToggle() {
  var toggle = document.querySelector(".nav-toggle");
  var list = document.querySelector(".main-nav ul");
  if (!toggle || !list) return;

  toggle.addEventListener("click", function () {
    var isOpen = toggle.classList.toggle("is-open");
    list.classList.toggle("is-open", isOpen);
    document.body.classList.toggle("no-scroll", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  list.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      toggle.classList.remove("is-open");
      list.classList.remove("is-open");
      document.body.classList.remove("no-scroll");
    });
  });
}

// fades sections in as they scroll into view
function initScrollReveal() {
  var items = document.querySelectorAll("[data-reveal]");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("is-visible"); });
    return;
  }

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  items.forEach(function (el) { io.observe(el); });
}

function stampYear() {
  var year = new Date().getFullYear();
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = year;
  });
}

// welcome message, index.html only (the banner div doesn't exist on other pages)
function showWelcomeBanner() {
  var banner = document.getElementById("welcome-banner");
  if (!banner) return;

  var hour = new Date().getHours();
  var greeting, icon;

  if (hour < 5) {
    greeting = "Welcome to Atoll Journal — the atolls are quiet and starlit at this hour.";
    icon = "\u{1F319}";
  } else if (hour < 12) {
    greeting = "Welcome to Atoll Journal — the lagoon is glass-calm this morning.";
    icon = "\u{1F305}";
  } else if (hour < 17) {
    greeting = "Welcome to Atoll Journal — the light over the reef is perfect right now.";
    icon = "☀️";
  } else if (hour < 21) {
    greeting = "Welcome to Atoll Journal — the sky over the reef is turning gold.";
    icon = "\u{1F307}";
  } else {
    greeting = "Welcome to Atoll Journal — the tide is out, and so are the stars.";
    icon = "\u{1F30C}";
  }

  var textEl = banner.querySelector(".wb-text");
  var iconEl = banner.querySelector(".wb-icon");
  if (textEl) textEl.textContent = greeting;
  if (iconEl) iconEl.textContent = icon;

  banner.hidden = false;
}

// --- Trip Planner (the custom JS feature for the assignment) ---
// takes nights / travel style / budget from the form and builds an
// itinerary + cost estimate on the fly, no page reload

var TRIP_BASE_RATE = 145; // USD per night, essential tier

var TRIP_PROFILES = {
  dive: {
    destination: "Ari Atoll",
    tagline: "drift channels, manta cleaning stations & coral gardens",
    activities: [
      "Sunrise briefing and check-out dive on the house reef",
      "Drift dive through the Maaya Thila channel",
      "Boat excursion to a manta cleaning station",
      "Snorkel the lagoon's coral nursery",
      "Night dive to watch reef sharks hunt",
      "Free morning — self-guided kayak around the lagoon",
      "Seasonal whale shark spotting trip",
      "Guided macro dive for nudibranchs and pipefish",
      "Sandbank picnic between two dive sessions",
      "Wreck dive at a nearby scuttled cargo ship",
    ],
  },
  relax: {
    destination: "Baa Atoll",
    tagline: "overwater villas, biosphere lagoons & very slow mornings",
    activities: [
      "Arrival, welcome tea on your private deck",
      "Sunrise yoga over the water",
      "In-villa spa treatment with reef-safe oils",
      "Slow afternoon: hammock, lagoon, a good book",
      "Sunset dolphin cruise",
      "Private breakfast on a sandbank",
      "Stargazing session with the resident astronomer",
      "Couples massage at the overwater spa pavilion",
      "Paddleboard the calm inner lagoon",
      "Farewell dinner on a floating pontoon",
    ],
  },
  culture: {
    destination: "Malé & South Malé Atoll",
    tagline: "markets, kitchens, drumbeats & island life",
    activities: [
      "Morning walk through Malé's local fish market",
      "Hands-on cooking class: mas huni and garudhiya",
      "Visit to a local island to meet fishing families",
      "Evening of traditional bodu beru drumming",
      "Coconut husking and rope-making demonstration",
      "Street-food crawl through the capital's cafés",
      "Museum visit on the seafaring history of the atolls",
      "Sunset fishing trip with a local crew",
      "Tea-house evening of island elders' stories",
      "Home-hosted dinner on a local island",
    ],
  },
  family: {
    destination: "Lhaviyani Atoll",
    tagline: "shallow lagoons, gentle currents & easy adventure",
    activities: [
      "Check-in and lagoon snorkel safety briefing",
      "Turtle-spotting snorkel on the shallow house reef",
      "Family sandbank games and beach olympics",
      "Junior marine-biology workshop at the reef lab",
      "Glass-bottom boat tour of the lagoon",
      "Kids' cooking class: mini fish cakes",
      "Sunset beach bonfire with marshmallows",
      "Kayak relay races in the calm lagoon",
      "Movie night under the stars on the beach",
      "Farewell reef clean-up with the marine team",
    ],
  },
};

var TRIP_BUDGETS = {
  essential: { label: "Essential", multiplier: 1, note: "guesthouses & local-island stays" },
  refined: { label: "Refined", multiplier: 1.7, note: "beach villas, half-board" },
  signature: { label: "Signature", multiplier: 2.6, note: "overwater villas, full-board" },
};

function initTripPlanner() {
  var form = document.getElementById("trip-planner-form");
  var result = document.getElementById("trip-planner-result");
  if (!form || !result) return; // only exists on index.html

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    renderTripPlan(form, result);
  });
}

function renderTripPlan(form, result) {
  var nightsRaw = parseInt(form.elements["nights"].value, 10);
  var nights = isNaN(nightsRaw) ? 3 : Math.min(Math.max(nightsRaw, 1), 21);

  var interestKey = form.elements["interest"].value;
  var budgetKey = form.elements["budget"].value;

  var profile = TRIP_PROFILES[interestKey] || TRIP_PROFILES.relax;
  var budget = TRIP_BUDGETS[budgetKey] || TRIP_BUDGETS.essential;

  var estimatedCost = Math.round(nights * TRIP_BASE_RATE * budget.multiplier);
  var formattedCost = "$" + estimatedCost.toLocaleString("en-US");

  // cycle through the activity list so longer trips just repeat the pool
  var itineraryItems = "";
  for (var day = 1; day <= nights; day++) {
    var activity = profile.activities[(day - 1) % profile.activities.length];
    itineraryItems += "<li>" + activity + "</li>";
  }

  result.innerHTML =
    '<div class="tp-result-head">' +
      "<div>" +
        '<div class="eyebrow">Recommended for you</div>' +
        "<h3>" + profile.destination + "</h3>" +
        "<p>" + profile.tagline + " &mdash; " + budget.label + " tier (" + budget.note + ")</p>" +
      "</div>" +
      '<div class="tp-cost">' + formattedCost + "<br><small>est. total for " + nights + (nights === 1 ? " night" : " nights") + "</small></div>" +
    "</div>" +
    "<ol>" + itineraryItems + "</ol>";
}
