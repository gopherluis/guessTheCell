/* Guess the Cell — content bank.
   Organelles, illustration art, tiered questions and mode definitions.
   Question tiers differ in difficulty two ways: the wording, and how many
   answer options you are given (easy = 3, medium = 4, hard = 5). */
(function (global) {
  "use strict";

  const INK = "#3A3F4A";

  const ORGANELLES = [
    {
      id: "nucleus",
      name: "Nucleus",
      blurb: "The control centre that stores DNA and directs the cell.",
      accent: "#b9a8e0",
      svg:
        '<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<circle cx="60" cy="45" r="33" fill="#DCD3F0" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<circle cx="52" cy="40" r="11" fill="#B9A8E0" stroke="' + INK + '" stroke-width="2"/>' +
        '<circle cx="74" cy="52" r="3" fill="#B9A8E0"/>' +
        '<circle cx="42" cy="55" r="2.5" fill="#B9A8E0"/>' +
        '<circle cx="68" cy="33" r="2" fill="#B9A8E0"/>' +
        '<circle cx="27" cy="45" r="2.5" fill="' + INK + '"/>' +
        '<circle cx="93" cy="45" r="2.5" fill="' + INK + '"/>' +
        '<circle cx="60" cy="12" r="2.5" fill="' + INK + '"/>' +
        '<circle cx="60" cy="78" r="2.5" fill="' + INK + '"/>' +
        '<circle cx="38" cy="23" r="2.5" fill="' + INK + '"/>' +
        '<circle cx="82" cy="23" r="2.5" fill="' + INK + '"/>' +
        '<circle cx="38" cy="67" r="2.5" fill="' + INK + '"/>' +
        '<circle cx="82" cy="67" r="2.5" fill="' + INK + '"/>' +
        "</svg>",
      questions: [
        {
          tier: "easy",
          text: "What is the main job of the nucleus?",
          options: ["Stores DNA and directs the cell", "Makes ATP", "Digests waste"],
          correct: 0
        },
        {
          tier: "medium",
          text: "Which structure inside the nucleus assembles ribosomal subunits?",
          options: ["Nucleolus", "Chromatin", "Nuclear pore", "Karyoplasm"],
          correct: 0
        },
        {
          tier: "hard",
          text: "Which structure regulates the traffic of RNA and proteins in and out of the nucleus?",
          options: [
            "Nuclear pore complex",
            "Nucleolus",
            "Nuclear lamina",
            "Chromatin",
            "Ribosome"
          ],
          correct: 0
        }
      ]
    },
    {
      id: "mitochondria",
      name: "Mitochondria",
      blurb: "The powerhouse that burns fuel to make ATP.",
      accent: "#e8a87c",
      svg:
        '<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<ellipse cx="60" cy="45" rx="44" ry="25" fill="#FBD9C8" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<path d="M28 45 C34 26 42 64 50 45 C56 30 62 60 70 45 C76 32 84 58 92 45" fill="none" stroke="#E8A87C" stroke-width="3" stroke-linecap="round"/>' +
        "</svg>",
      questions: [
        {
          tier: "easy",
          text: "What does the mitochondria produce that powers the cell?",
          options: ["ATP", "DNA", "Proteins"],
          correct: 0
        },
        {
          tier: "medium",
          text: "What folded inner structures give mitochondria extra surface area for ATP production?",
          options: ["Cristae", "Thylakoids", "Vesicles", "Cisternae"],
          correct: 0
        },
        {
          tier: "hard",
          text: "Mitochondria carry their own DNA and are thought to descend from what?",
          options: [
            "Free-living bacteria",
            "Archaea",
            "Viruses",
            "Yeast fungi",
            "Red blood cells"
          ],
          correct: 0
        }
      ]
    },
    {
      id: "ribosome",
      name: "Ribosome",
      blurb: "A molecular machine that assembles proteins from mRNA.",
      accent: "#a9cfea",
      svg:
        '<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<ellipse cx="60" cy="34" rx="27" ry="17" fill="#C9E2F5" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<ellipse cx="60" cy="55" rx="19" ry="12" fill="#A9CFEA" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<rect x="18" y="70" width="84" height="6" rx="3" fill="#F5EAC3" stroke="' + INK + '" stroke-width="2"/>' +
        "</svg>",
      questions: [
        {
          tier: "easy",
          text: "What does a ribosome build?",
          options: ["Proteins", "DNA", "Lipids"],
          correct: 0
        },
        {
          tier: "medium",
          text: "Which molecule do ribosomes read to build proteins?",
          options: ["mRNA", "DNA", "ATP", "Lipids"],
          correct: 0
        },
        {
          tier: "hard",
          text: "How do free ribosomes differ from ribosomes bound to the rough ER?",
          options: [
            "Free ones build proteins used inside the cell",
            "Free ones build proteins for export",
            "Bound ribosomes copy the DNA",
            "Bound ribosomes make ATP",
            "There is no difference at all"
          ],
          correct: 0
        }
      ]
    },
    {
      id: "golgi",
      name: "Golgi apparatus",
      blurb: "The post office: modifies, sorts and ships proteins.",
      accent: "#f7a8bd",
      svg:
        '<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<path d="M28 22 Q60 10 92 22 Q60 34 28 22 Z" fill="#F7D4DE" stroke="' + INK + '" stroke-width="2"/>' +
        '<path d="M24 38 Q60 26 96 38 Q60 50 24 38 Z" fill="#F7D4DE" stroke="' + INK + '" stroke-width="2"/>' +
        '<path d="M28 54 Q60 42 92 54 Q60 66 28 54 Z" fill="#F7D4DE" stroke="' + INK + '" stroke-width="2"/>' +
        '<circle cx="40" cy="74" r="6" fill="#F7D4DE" stroke="' + INK + '" stroke-width="2"/>' +
        '<circle cx="62" cy="78" r="4.5" fill="#F7D4DE" stroke="' + INK + '" stroke-width="2"/>' +
        '<circle cx="82" cy="73" r="5" fill="#F7D4DE" stroke="' + INK + '" stroke-width="2"/>' +
        "</svg>",
      questions: [
        {
          tier: "easy",
          text: "What is the main job of the Golgi apparatus?",
          options: [
            "Modifies, sorts and packages proteins",
            "Produces ATP",
            "Digests cellular waste"
          ],
          correct: 0
        },
        {
          tier: "medium",
          text: "Vesicles that carry cargo away from the Golgi are called what?",
          options: ["Secretory vesicles", "Lysosomes", "Peroxisomes", "Thylakoids"],
          correct: 0
        },
        {
          tier: "hard",
          text: "In a plant cell, the Golgi apparatus also helps build which structure?",
          options: [
            "The cell plate during cytokinesis",
            "The nuclear pore",
            "The thylakoid membrane",
            "The chloroplast stroma",
            "The mitochondrial matrix"
          ],
          correct: 0
        }
      ]
    },
    {
      id: "er",
      name: "Endoplasmic reticulum",
      blurb: "A folded membrane network that folds and ships proteins.",
      accent: "#b9a8e0",
      svg:
        '<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<path d="M12 28 Q35 16 58 28 T108 28" fill="none" stroke="' + INK + '" stroke-width="12" stroke-linecap="round"/>' +
        '<path d="M12 28 Q35 16 58 28 T108 28" fill="none" stroke="#DCD3F0" stroke-width="9" stroke-linecap="round"/>' +
        '<path d="M12 46 Q35 34 58 46 T108 46" fill="none" stroke="' + INK + '" stroke-width="12" stroke-linecap="round"/>' +
        '<path d="M12 46 Q35 34 58 46 T108 46" fill="none" stroke="#DCD3F0" stroke-width="9" stroke-linecap="round"/>' +
        '<path d="M12 64 Q35 52 58 64 T108 64" fill="none" stroke="' + INK + '" stroke-width="12" stroke-linecap="round"/>' +
        '<path d="M12 64 Q35 52 58 64 T108 64" fill="none" stroke="#DCD3F0" stroke-width="9" stroke-linecap="round"/>' +
        '<circle cx="28" cy="23" r="2.4" fill="' + INK + '"/>' +
        '<circle cx="48" cy="22" r="2.4" fill="' + INK + '"/>' +
        '<circle cx="68" cy="25" r="2.4" fill="' + INK + '"/>' +
        '<circle cx="88" cy="25" r="2.4" fill="' + INK + '"/>' +
        '<circle cx="32" cy="41" r="2.4" fill="' + INK + '"/>' +
        '<circle cx="56" cy="41" r="2.4" fill="' + INK + '"/>' +
        '<circle cx="78" cy="42" r="2.4" fill="' + INK + '"/>' +
        '<circle cx="36" cy="59" r="2.4" fill="' + INK + '"/>' +
        '<circle cx="60" cy="59" r="2.4" fill="' + INK + '"/>' +
        '<circle cx="84" cy="60" r="2.4" fill="' + INK + '"/>' +
        "</svg>",
      questions: [
        {
          tier: "easy",
          text: "Which organelle is a network of flattened sacs spread through the cell?",
          options: ["Endoplasmic reticulum", "Golgi apparatus", "Lysosome"],
          correct: 0
        },
        {
          tier: "medium",
          text: "Why is the endoplasmic reticulum called \"rough\"?",
          options: [
            "Ribosomes stud its surface",
            "It has a bumpy membrane",
            "It is covered in sugar",
            "It is usually torn"
          ],
          correct: 0
        },
        {
          tier: "hard",
          text: "The smooth ER is especially rich in enzymes that build which molecules?",
          options: [
            "Lipids and steroid hormones",
            "Proteins and ribosomal subunits",
            "DNA and RNA",
            "Cellulose and lignin",
            "Starch and glycogen"
          ],
          correct: 0
        }
      ]
    },
    {
      id: "lysosome",
      name: "Lysosome",
      blurb: "The recycling centre, full of digestive enzymes.",
      accent: "#e8d98f",
      svg:
        '<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<circle cx="60" cy="45" r="30" fill="#F5EAC3" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<circle cx="50" cy="36" r="4.5" fill="#E8D98F" stroke="' + INK + '" stroke-width="1.5"/>' +
        '<circle cx="68" cy="34" r="3.2" fill="#E8D98F" stroke="' + INK + '" stroke-width="1.5"/>' +
        '<circle cx="60" cy="50" r="5" fill="#E8D98F" stroke="' + INK + '" stroke-width="1.5"/>' +
        '<circle cx="45" cy="54" r="2.8" fill="#E8D98F" stroke="' + INK + '" stroke-width="1.5"/>' +
        '<circle cx="72" cy="52" r="3.4" fill="#E8D98F" stroke="' + INK + '" stroke-width="1.5"/>' +
        '<circle cx="58" cy="64" r="2.6" fill="#E8D98F" stroke="' + INK + '" stroke-width="1.5"/>' +
        "</svg>",
      questions: [
        {
          tier: "easy",
          text: "What is the main role of lysosomes?",
          options: [
            "Digest waste and worn-out organelles",
            "Build the cell wall",
            "Capture light energy"
          ],
          correct: 0
        },
        {
          tier: "medium",
          text: "Lysosomes are packed with which kind of enzyme?",
          options: ["Hydrolytic enzymes", "Polymerases", "Kinases", "Synthases"],
          correct: 0
        },
        {
          tier: "hard",
          text: "Which disorder is caused by a missing enzyme that breaks down a fatty lipid?",
          options: [
            "Tay-Sachs disease",
            "Cystic fibrosis",
            "Sickle cell anaemia",
            "Marfan syndrome",
            "Huntington's disease"
          ],
          correct: 0
        }
      ]
    },
    {
      id: "chloroplast",
      name: "Chloroplast",
      blurb: "The solar panel that traps light to build sugars.",
      accent: "#8fc7a0",
      svg:
        '<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<ellipse cx="60" cy="45" rx="44" ry="26" fill="#C8E6D0" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<ellipse cx="38" cy="34" rx="10" ry="3.5" fill="#8FC7A0" stroke="' + INK + '" stroke-width="1.5"/>' +
        '<ellipse cx="38" cy="41" rx="10" ry="3.5" fill="#8FC7A0" stroke="' + INK + '" stroke-width="1.5"/>' +
        '<ellipse cx="38" cy="48" rx="10" ry="3.5" fill="#8FC7A0" stroke="' + INK + '" stroke-width="1.5"/>' +
        '<ellipse cx="70" cy="36" rx="9" ry="3.2" fill="#8FC7A0" stroke="' + INK + '" stroke-width="1.5"/>' +
        '<ellipse cx="70" cy="42.5" rx="9" ry="3.2" fill="#8FC7A0" stroke="' + INK + '" stroke-width="1.5"/>' +
        '<ellipse cx="70" cy="49" rx="9" ry="3.2" fill="#8FC7A0" stroke="' + INK + '" stroke-width="1.5"/>' +
        '<ellipse cx="54" cy="60" rx="8" ry="3" fill="#8FC7A0" stroke="' + INK + '" stroke-width="1.5"/>' +
        '<ellipse cx="54" cy="66" rx="8" ry="3" fill="#8FC7A0" stroke="' + INK + '" stroke-width="1.5"/>' +
        "</svg>",
      questions: [
        {
          tier: "easy",
          text: "What gas does a plant cell take in to make sugar during photosynthesis?",
          options: ["Carbon dioxide", "Oxygen", "Nitrogen"],
          correct: 0
        },
        {
          tier: "medium",
          text: "Which pigment captures light energy inside chloroplasts?",
          options: ["Chlorophyll", "Keratin", "Melanin", "Haemoglobin"],
          correct: 0
        },
        {
          tier: "hard",
          text: "Chloroplasts are thought to have evolved from which organisms?",
          options: ["Photosynthetic bacteria", "Fungi", "Animals", "Archaea", "Protozoa"],
          correct: 0
        }
      ]
    },
    {
      id: "membrane",
      name: "Cell membrane",
      blurb: "A flexible double layer that decides what gets in and out.",
      accent: "#f0a68c",
      svg:
        '<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<circle cx="16" cy="26" r="5.5" fill="#FBD9C8" stroke="' + INK + '" stroke-width="2"/>' +
        '<circle cx="32" cy="26" r="5.5" fill="#FBD9C8" stroke="' + INK + '" stroke-width="2"/>' +
        '<circle cx="48" cy="26" r="5.5" fill="#FBD9C8" stroke="' + INK + '" stroke-width="2"/>' +
        '<circle cx="64" cy="26" r="5.5" fill="#FBD9C8" stroke="' + INK + '" stroke-width="2"/>' +
        '<circle cx="80" cy="26" r="5.5" fill="#FBD9C8" stroke="' + INK + '" stroke-width="2"/>' +
        '<circle cx="96" cy="26" r="5.5" fill="#FBD9C8" stroke="' + INK + '" stroke-width="2"/>' +
        '<line x1="16" y1="31.5" x2="16" y2="44" stroke="' + INK + '" stroke-width="1.8"/>' +
        '<line x1="32" y1="31.5" x2="32" y2="44" stroke="' + INK + '" stroke-width="1.8"/>' +
        '<line x1="48" y1="31.5" x2="48" y2="44" stroke="' + INK + '" stroke-width="1.8"/>' +
        '<line x1="64" y1="31.5" x2="64" y2="44" stroke="' + INK + '" stroke-width="1.8"/>' +
        '<line x1="80" y1="31.5" x2="80" y2="44" stroke="' + INK + '" stroke-width="1.8"/>' +
        '<line x1="96" y1="31.5" x2="96" y2="44" stroke="' + INK + '" stroke-width="1.8"/>' +
        '<line x1="16" y1="46" x2="16" y2="58.5" stroke="' + INK + '" stroke-width="1.8"/>' +
        '<line x1="32" y1="46" x2="32" y2="58.5" stroke="' + INK + '" stroke-width="1.8"/>' +
        '<line x1="48" y1="46" x2="48" y2="58.5" stroke="' + INK + '" stroke-width="1.8"/>' +
        '<line x1="64" y1="46" x2="64" y2="58.5" stroke="' + INK + '" stroke-width="1.8"/>' +
        '<line x1="80" y1="46" x2="80" y2="58.5" stroke="' + INK + '" stroke-width="1.8"/>' +
        '<line x1="96" y1="46" x2="96" y2="58.5" stroke="' + INK + '" stroke-width="1.8"/>' +
        '<circle cx="16" cy="64" r="5.5" fill="#FBD9C8" stroke="' + INK + '" stroke-width="2"/>' +
        '<circle cx="32" cy="64" r="5.5" fill="#FBD9C8" stroke="' + INK + '" stroke-width="2"/>' +
        '<circle cx="48" cy="64" r="5.5" fill="#FBD9C8" stroke="' + INK + '" stroke-width="2"/>' +
        '<circle cx="64" cy="64" r="5.5" fill="#FBD9C8" stroke="' + INK + '" stroke-width="2"/>' +
        '<circle cx="80" cy="64" r="5.5" fill="#FBD9C8" stroke="' + INK + '" stroke-width="2"/>' +
        '<circle cx="96" cy="64" r="5.5" fill="#FBD9C8" stroke="' + INK + '" stroke-width="2"/>' +
        "</svg>",
      questions: [
        {
          tier: "easy",
          text: "Which part of the cell controls what enters and leaves?",
          options: ["The cell membrane", "The nucleus", "The ribosome"],
          correct: 0
        },
        {
          tier: "medium",
          text: "What mainly forms the cell membrane's bilayer?",
          options: [
            "Phospholipids with embedded proteins",
            "Cellulose and starch",
            "DNA and RNA",
            "Carbohydrates and enzymes"
          ],
          correct: 0
        },
        {
          tier: "hard",
          text: "A cell placed in pure water will most likely do what?",
          options: [
            "Swell, because water enters by osmosis",
            "Shrink, because water leaves",
            "Stay exactly the same size",
            "Divide immediately",
            "Burst, because the membrane dissolves"
          ],
          correct: 0
        }
      ]
    },
    {
      id: "peroxisome",
      name: "Peroxisome",
      blurb: "A tiny bubble that detoxifies the cell.",
      accent: "#f0b7a0",
      svg:
        '<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<circle cx="60" cy="45" r="30" fill="#FBDDD2" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<circle cx="60" cy="45" r="21" fill="#F7C4B0" stroke="' + INK + '" stroke-width="2"/>' +
        '<path d="M44 42 Q52 34 60 42 T76 42" fill="none" stroke="#E89A78" stroke-width="2.6" stroke-linecap="round"/>' +
        '<path d="M44 52 Q52 44 60 52 T76 52" fill="none" stroke="#E89A78" stroke-width="2.6" stroke-linecap="round"/>' +
        '<circle cx="48" cy="30" r="3" fill="' + INK + '"/>' +
        '<circle cx="73" cy="60" r="2.4" fill="' + INK + '"/>' +
        "</svg>",
      questions: [
        {
          tier: "easy",
          text: "Peroxisomes are best known for breaking down which substance?",
          options: ["Hydrogen peroxide", "Glucose", "Protein"],
          correct: 0
        },
        {
          tier: "medium",
          text: "Which organelle is especially abundant in liver cells because it handles toxins?",
          options: ["Peroxisome", "Lysosome", "Golgi apparatus", "Chloroplast"],
          correct: 0
        },
        {
          tier: "hard",
          text: "Peroxisomes are unusual among organelles because they do what?",
          options: [
            "Break down fatty acids, releasing heat and hydrogen peroxide",
            "Carry their own DNA",
            "Produce ATP",
            "Synthesise proteins",
            "Build the cell wall"
          ],
          correct: 0
        }
      ]
    },
    {
      id: "cytoskeleton",
      name: "Cytoskeleton",
      blurb: "A scaffold of fibres that shapes and moves the cell.",
      accent: "#f2c46b",
      svg:
        '<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<path d="M10 24 C40 8 80 40 110 24" fill="none" stroke="#E8B45A" stroke-width="3.4" stroke-linecap="round"/>' +
        '<path d="M10 66 C40 82 80 50 110 66" fill="none" stroke="#E8B45A" stroke-width="3.4" stroke-linecap="round"/>' +
        '<path d="M34 8 C26 36 46 54 34 84" fill="none" stroke="#F2C46B" stroke-width="3.4" stroke-linecap="round"/>' +
        '<path d="M86 8 C94 36 74 54 86 84" fill="none" stroke="#F2C46B" stroke-width="3.4" stroke-linecap="round"/>' +
        '<ellipse cx="60" cy="45" rx="17" ry="13" fill="#DCD3F0" stroke="' + INK + '" stroke-width="2.2"/>' +
        '<circle cx="60" cy="45" r="5.5" fill="#B9A8E0" stroke="' + INK + '" stroke-width="1.6"/>' +
        '<circle cx="22" cy="45" r="3" fill="' + INK + '"/>' +
        '<circle cx="99" cy="45" r="3" fill="' + INK + '"/>' +
        "</svg>",
      questions: [
        {
          tier: "easy",
          text: "What is the network of protein fibres inside a cell called?",
          options: ["Cytoskeleton", "Nucleoplasm", "Cytoplasm"],
          correct: 0
        },
        {
          tier: "medium",
          text: "Which cytoskeleton fibre thickens to form a contractile ring that divides the cell?",
          options: ["Actin", "Microtubule", "Intermediate filament", "Collagen"],
          correct: 0
        },
        {
          tier: "hard",
          text: "Microtubules form the mitotic spindle and also build which moving structures?",
          options: [
            "Cilia and flagella",
            "The nucleolus",
            "The mitochondrial matrix",
            "Golgi cisternae",
            "The nuclear envelope"
          ],
          correct: 0
        }
      ]
    },
    {
      id: "cellwall",
      name: "Cell wall",
      blurb: "A rigid cellulose frame that gives plants their shape.",
      accent: "#c9a27e",
      svg:
        '<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<rect x="10" y="8" width="100" height="74" rx="14" fill="#E3C9AE" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<rect x="19" y="17" width="82" height="56" rx="10" fill="#F3E3D2" stroke="' + INK + '" stroke-width="2"/>' +
        '<rect x="30" y="28" width="60" height="34" rx="9" fill="#C8E6D0" stroke="' + INK + '" stroke-width="2"/>' +
        '<circle cx="45" cy="45" r="8" fill="#DCD3F0" stroke="' + INK + '" stroke-width="1.8"/>' +
        '<circle cx="70" cy="38" r="5" fill="#FBD9C8" stroke="' + INK + '" stroke-width="1.8"/>' +
        '<circle cx="72" cy="55" r="4" fill="#F5EAC3" stroke="' + INK + '" stroke-width="1.8"/>' +
        '<circle cx="14" cy="30" r="2" fill="' + INK + '" opacity="0.55"/>' +
        '<circle cx="106" cy="30" r="2" fill="' + INK + '" opacity="0.55"/>' +
        '<circle cx="14" cy="60" r="2" fill="' + INK + '" opacity="0.55"/>' +
        '<circle cx="106" cy="60" r="2" fill="' + INK + '" opacity="0.55"/>' +
        "</svg>",
      questions: [
        {
          tier: "easy",
          text: "Which structure gives plant cells their rigid shape?",
          options: ["The cell wall", "The cell membrane", "The cytoplasm"],
          correct: 0
        },
        {
          tier: "medium",
          text: "What is the plant cell wall mainly made of?",
          options: ["Cellulose", "Peptidoglycan", "Chitin", "Keratin"],
          correct: 0
        },
        {
          tier: "hard",
          text: "Why is there no cell wall around animal cells?",
          options: [
            "Animals lack the machinery to build cellulose fibres",
            "Animals have no cytoplasm",
            "Animals lack a cell membrane",
            "Animal cells are far too small",
            "Animals make cellulose but cannot use it"
          ],
          correct: 0
        }
      ]
    },
    {
      id: "vacuole",
      name: "Vacuole",
      blurb: "A water-filled store that keeps the plant cell firm.",
      accent: "#8fd0e0",
      svg:
        '<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<ellipse cx="60" cy="45" rx="47" ry="38" fill="#E4F3F7" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<ellipse cx="60" cy="45" rx="34" ry="26" fill="#BFE4EE" stroke="' + INK + '" stroke-width="2"/>' +
        '<path d="M40 52 Q48 44 56 52 T72 52" fill="none" stroke="#7FC3D6" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M44 38 Q52 32 60 38" fill="none" stroke="#7FC3D6" stroke-width="2.4" stroke-linecap="round"/>' +
        '<circle cx="38" cy="26" r="4" fill="#C8E6D0" stroke="' + INK + '" stroke-width="1.8"/>' +
        '<circle cx="86" cy="66" r="4.5" fill="#FBD9C8" stroke="' + INK + '" stroke-width="1.8"/>' +
        '<circle cx="94" cy="30" r="3" fill="#DCD3F0" stroke="' + INK + '" stroke-width="1.8"/>' +
        "</svg>",
      questions: [
        {
          tier: "easy",
          text: "What does a large central vacuole in a plant cell store?",
          options: ["Water and dissolved substances", "DNA", "Ribosomes"],
          correct: 0
        },
        {
          tier: "medium",
          text: "Which organelle keeps a plant cell firm by holding water and maintaining turgor pressure?",
          options: ["Central vacuole", "Golgi apparatus", "Peroxisome", "Lysosome"],
          correct: 0
        },
        {
          tier: "hard",
          text: "Contractile vacuoles in freshwater protists do what?",
          options: [
            "Pump out the excess water that enters by osmosis",
            "Store sugars for winter",
            "Digest nucleic acids",
            "Synthesise proteins",
            "Carry oxygen into the cell"
          ],
          correct: 0
        }
      ]
    }
  ];

  const CARD_BACKS = {
    cell: {
      id: "cell",
      name: "Cell",
      svg:
        '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<circle cx="24" cy="24" r="16" fill="#BFE3CC" stroke="' + INK + '" stroke-width="2"/>' +
        '<circle cx="24" cy="24" r="6" fill="#8FC7A0" stroke="' + INK + '" stroke-width="1.5"/>' +
        '<circle cx="31" cy="17" r="2" fill="' + INK + '"/>' +
        '<circle cx="17" cy="30" r="1.6" fill="' + INK + '"/>' +
        "</svg>"
    },
    atom: {
      id: "atom",
      name: "Atom",
      svg:
        '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<circle cx="24" cy="24" r="3.4" fill="' + INK + '"/>' +
        '<ellipse cx="24" cy="24" rx="16" ry="6.5" fill="none" stroke="' + INK + '" stroke-width="1.8"/>' +
        '<ellipse cx="24" cy="24" rx="16" ry="6.5" fill="none" stroke="' + INK + '" stroke-width="1.8" transform="rotate(60 24 24)"/>' +
        '<ellipse cx="24" cy="24" rx="16" ry="6.5" fill="none" stroke="' + INK + '" stroke-width="1.8" transform="rotate(120 24 24)"/>' +
        "</svg>"
    },
    dna: {
      id: "dna",
      name: "DNA",
      svg:
        '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<path d="M16 6 C30 14 30 34 16 42" fill="none" stroke="' + INK + '" stroke-width="2.2" stroke-linecap="round"/>' +
        '<path d="M32 6 C18 14 18 34 32 42" fill="none" stroke="' + INK + '" stroke-width="2.2" stroke-linecap="round"/>' +
        '<path d="M18 13 h12 M18 24 h12 M18 35 h12" stroke="' + INK + '" stroke-width="1.6" stroke-linecap="round"/>' +
        "</svg>"
    },
    petal: {
      id: "petal",
      name: "Petal",
      svg:
        '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<ellipse cx="24" cy="16" rx="6" ry="9" fill="#BFE3CC" stroke="' + INK + '" stroke-width="1.8"/>' +
        '<ellipse cx="32" cy="24" rx="6" ry="9" fill="#BFE3CC" stroke="' + INK + '" stroke-width="1.8" transform="rotate(72 32 24)"/>' +
        '<ellipse cx="27" cy="33" rx="6" ry="9" fill="#BFE3CC" stroke="' + INK + '" stroke-width="1.8" transform="rotate(144 27 33)"/>' +
        '<ellipse cx="16" cy="33" rx="6" ry="9" fill="#BFE3CC" stroke="' + INK + '" stroke-width="1.8" transform="rotate(216 16 33)"/>' +
        '<ellipse cx="21" cy="15" rx="6" ry="9" fill="#BFE3CC" stroke="' + INK + '" stroke-width="1.8" transform="rotate(288 21 15)"/>' +
        '<circle cx="24" cy="24" r="4" fill="#8FC7A0" stroke="' + INK + '" stroke-width="1.6"/>' +
        "</svg>"
    }
  };

  const MODES = {
    classic: {
      id: "classic",
      name: "Classic",
      tagline: "Balanced board, standard scoring, hints available.",
      pairs: 8,
      reinforcements: 1,
      seconds: null,
      extraOptions: 0,
      penaltyScale: 1,
      basePoints: 100,
      speedBonus: false,
      hints: true
    },
    relax: {
      id: "relax",
      name: "Relaxed",
      tagline: "No clock, softer penalties, one extra answer option.",
      pairs: 6,
      reinforcements: 2,
      seconds: null,
      extraOptions: 1,
      penaltyScale: 0.5,
      basePoints: 80,
      speedBonus: false,
      hints: true
    },
    sprint: {
      id: "sprint",
      name: "Sprint",
      tagline: "Beat the clock. Fast correct answers pay extra.",
      pairs: 8,
      reinforcements: 1,
      seconds: 90,
      extraOptions: 0,
      penaltyScale: 1,
      basePoints: 120,
      speedBonus: true,
      hints: false
    },
    mastery: {
      id: "mastery",
      name: "Mastery",
      tagline: "The fuzzy engine builds the deck around your weak spots.",
      pairs: 10,
      reinforcements: 2,
      seconds: null,
      extraOptions: 0,
      penaltyScale: 1.25,
      basePoints: 100,
      speedBonus: false,
      hints: true
    }
  };

  const TIER_META = {
    easy: { id: "easy", name: "Warm-up", points: 40, hint: "A gentle recall question." },
    medium: { id: "medium", name: "Core", points: 70, hint: "Standard difficulty question." },
    hard: { id: "hard", name: "Challenge", points: 110, hint: "Deeper reasoning required." }
  };

  const DEFAULT_CARD_BACK_SVG = CARD_BACKS.cell.svg;

  global.GTC = global.GTC || {};
  global.GTC.data = {
    organelles: ORGANELLES,
    cardBacks: CARD_BACKS,
    modes: MODES,
    tiers: TIER_META,
    defaultCardBackSvg: DEFAULT_CARD_BACK_SVG
  };

  /* Kept for backwards compatibility with the original build. */
  global.ORGANELLES = ORGANELLES;
  global.CARD_BACK_SVG = DEFAULT_CARD_BACK_SVG;
})(window);
