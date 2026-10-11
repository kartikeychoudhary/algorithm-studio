export const NETWORK_NODES = [
  { label: "A", x: 60, y: 180 },
  { label: "B", x: 185, y: 70 },
  { label: "C", x: 185, y: 280 },
  { label: "D", x: 330, y: 90 },
  { label: "E", x: 330, y: 270 },
  { label: "F", x: 475, y: 180 },
  { label: "G", x: 600, y: 180 },
];
export const NETWORK_EDGES = [
  { from: 0, to: 1, weight: 2 },
  { from: 0, to: 2, weight: 1 },
  { from: 1, to: 3, weight: 9 },
  { from: 1, to: 4, weight: 3 },
  { from: 2, to: 4, weight: 2 },
  { from: 3, to: 5, weight: 1 },
  { from: 4, to: 5, weight: 2 },
  { from: 5, to: 6, weight: 2 },
  { from: 4, to: 6, weight: 8 },
];
export const AIRPORTS = [
  { label: "DEL", name: "Delhi", x: 60, y: 180 },
  { label: "BOM", name: "Mumbai", x: 220, y: 65 },
  { label: "HYD", name: "Hyderabad", x: 220, y: 295 },
  { label: "BLR", name: "Bengaluru", x: 430, y: 70 },
  { label: "MAA", name: "Chennai", x: 600, y: 180 },
  { label: "CCU", name: "Kolkata", x: 430, y: 295 },
];
export const FLIGHTS = [
  { from: 0, to: 4, weight: 700 },
  { from: 0, to: 1, weight: 100 },
  { from: 1, to: 3, weight: 100 },
  { from: 3, to: 4, weight: 100 },
  { from: 0, to: 2, weight: 200 },
  { from: 2, to: 4, weight: 300 },
  { from: 2, to: 5, weight: 100 },
  { from: 5, to: 4, weight: 100 },
  { from: 1, to: 4, weight: 450 },
];
