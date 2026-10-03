export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const ADVISOR_QUESTION_BANK: Question[] = [
  {
    id: 'q1',
    text: 'What is the primary cause of Blossom End Rot in tomatoes?',
    options: ['Nitrogen deficiency', 'Overwatering', 'Calcium deficiency or irregular watering', 'Fungal infection'],
    correctIndex: 2,
    explanation: 'Blossom end rot is caused by a lack of calcium in the fruit, often due to inconsistent watering.'
  },
  {
    id: 'q2',
    text: 'Which of these is a macronutrient essential for plant growth?',
    options: ['Iron (Fe)', 'Potassium (K)', 'Zinc (Zn)', 'Copper (Cu)'],
    correctIndex: 1,
    explanation: 'NPK (Nitrogen, Phosphorus, Potassium) are the primary macronutrients.'
  },
  {
    id: 'q3',
    text: 'Yellowing of older leaves starting from the tips and margins is a classic sign of which deficiency?',
    options: ['Nitrogen', 'Magnesium', 'Potassium', 'Iron'],
    correctIndex: 0,
    explanation: 'Nitrogen is mobile in the plant, so it moves from older leaves to newer ones, causing older leaves to yellow first.'
  },
  {
    id: 'q4',
    text: 'What does the term "Hardening off" mean in gardening?',
    options: ['Removing dead branches', 'Gradually exposing indoor seedlings to outdoor conditions', 'Compressing the soil around roots', 'Treating seeds with chemicals'],
    correctIndex: 1,
    explanation: 'Hardening off acclimates indoor-grown seedlings to sunlight, wind, and temperature changes outdoors.'
  },
  {
    id: 'q5',
    text: 'Which of the following is a common biological control for aphids?',
    options: ['Earthworms', 'Ladybugs (Lady beetles)', 'Honey bees', 'Slugs'],
    correctIndex: 1,
    explanation: 'Ladybugs are natural predators that consume large quantities of aphids.'
  },
  {
    id: 'q6',
    text: 'What is the ideal pH range for most vegetable garden soils?',
    options: ['4.5 to 5.5', '6.0 to 7.0', '7.5 to 8.5', '8.5 to 9.5'],
    correctIndex: 1,
    explanation: 'Most vegetables thrive in slightly acidic to neutral soil (pH 6.0-7.0) where nutrients are most available.'
  },
  {
    id: 'q7',
    text: 'Powdery mildew is a common plant disease. What type of pathogen causes it?',
    options: ['Bacteria', 'Virus', 'Fungus', 'Nematode'],
    correctIndex: 2,
    explanation: 'Powdery mildew is a fungal disease that appears as white, powdery spots on leaves.'
  },
  {
    id: 'q8',
    text: 'What is the main purpose of adding compost to sandy soil?',
    options: ['To increase drainage', 'To lower the pH drastically', 'To improve water and nutrient retention', 'To kill weed seeds'],
    correctIndex: 2,
    explanation: 'Compost adds organic matter, which acts like a sponge in sandy soil, holding water and nutrients.'
  },
  {
    id: 'q9',
    text: 'Interveinal chlorosis (yellowing between the veins) on young leaves is typically caused by a deficiency in:',
    options: ['Iron', 'Nitrogen', 'Phosphorus', 'Calcium'],
    correctIndex: 0,
    explanation: 'Iron is immobile, so deficiency shows up in new leaves first as yellowing while veins remain green.'
  },
  {
    id: 'q10',
    text: 'Which plant family do eggplants, tomatoes, and potatoes belong to?',
    options: ['Cucurbitaceae', 'Solanaceae (Nightshades)', 'Brassicaceae', 'Fabaceae'],
    correctIndex: 1,
    explanation: 'They are all members of the Nightshade (Solanaceae) family.'
  },
  {
    id: 'q11',
    text: 'What is companion planting?',
    options: ['Planting the same crop in the same spot every year', 'Planting different crops together for mutual benefit', 'Planting in straight rows', 'Growing plants in containers only'],
    correctIndex: 1,
    explanation: 'Companion planting involves growing complementary plants near each other for pest control, pollination, or nutrient sharing.'
  },
  {
    id: 'q12',
    text: 'What does "bolting" refer to in leafy greens like spinach and lettuce?',
    options: ['Rapidly producing a flower stalk and going to seed', 'Leaves turning yellow and falling off', 'Roots rotting due to excess water', 'Infection by viral diseases'],
    correctIndex: 0,
    explanation: 'Bolting is a survival mechanism triggered by heat or stress, causing the plant to flower and taste bitter.'
  },
  {
    id: 'q13',
    text: 'Which type of fertilizer promotes strong root development and flower/fruit production?',
    options: ['Nitrogen-heavy', 'Phosphorus-heavy', 'Calcium-heavy', 'Sulfur-heavy'],
    correctIndex: 1,
    explanation: 'Phosphorus (the P in NPK) is crucial for root establishment and the production of flowers and fruit.'
  },
  {
    id: 'q14',
    text: 'What is the most effective organic method for controlling root-knot nematodes?',
    options: ['Spraying neem oil', 'Crop rotation with non-host plants (like marigolds)', 'Adding sand to the soil', 'Watering plants at night'],
    correctIndex: 1,
    explanation: 'Crop rotation and planting nematode-suppressive crops like French marigolds help reduce nematode populations.'
  },
  {
    id: 'q15',
    text: 'Why is it generally recommended to water gardens in the early morning?',
    options: ['Plants absorb water faster in the dark', 'It reduces evaporation and allows leaves to dry, preventing fungal diseases', 'It kills soil pests', 'It increases the soil pH'],
    correctIndex: 1,
    explanation: 'Morning watering minimizes evaporation loss and gives leaves time to dry before evening, reducing fungal risks.'
  },
  {
    id: 'q16',
    text: 'What is "Vermicomposting"?',
    options: ['Composting using high heat', 'Composting using specific species of earthworms', 'Composting exclusively with animal manure', 'Liquid fertilizer fermentation'],
    correctIndex: 1,
    explanation: 'Vermicomposting uses earthworms to break down organic waste into nutrient-rich castings.'
  },
  {
    id: 'q17',
    text: 'Which pruning technique encourages bushier growth in plants like basil and mint?',
    options: ['Coppicing', 'Pinching off the growing tips', 'Root pruning', 'Defoliation'],
    correctIndex: 1,
    explanation: 'Pinching removes the apical meristem, encouraging the plant to grow lateral branches and become bushy.'
  },
  {
    id: 'q18',
    text: 'What causes "damping off" in seedlings?',
    options: ['Too much sunlight', 'Soil-borne fungi thriving in wet, poorly ventilated conditions', 'Nitrogen toxicity', 'Aphid infestation'],
    correctIndex: 1,
    explanation: 'Damping off is caused by fungal pathogens (like Pythium or Rhizoctonia) that rot the seedling stem at the soil line.'
  },
  {
    id: 'q19',
    text: 'What is the role of Mycorrhizal fungi in the soil?',
    options: ['They cause diseases in plant roots', 'They form a symbiotic relationship with roots, improving water and phosphorus uptake', 'They fix atmospheric nitrogen', 'They decompose living plant tissue'],
    correctIndex: 1,
    explanation: 'Mycorrhizae extend the root system\'s reach, helping plants absorb water and nutrients (especially phosphorus) in exchange for sugars.'
  },
  {
    id: 'q20',
    text: 'Which of these is a cool-season crop?',
    options: ['Okra', 'Watermelon', 'Broccoli', 'Sweet Potato'],
    correctIndex: 2,
    explanation: 'Broccoli prefers cooler temperatures and will bolt or perform poorly in intense summer heat.'
  },
  {
    id: 'q21',
    text: 'What does a soil EC (Electrical Conductivity) meter primarily measure?',
    options: ['Soil pH', 'Total dissolved salts/nutrient concentration', 'Soil moisture percentage', 'Organic matter content'],
    correctIndex: 1,
    explanation: 'EC measures the salinity or total dissolved fertilizer salts in the soil or hydroponic solution.'
  },
  {
    id: 'q22',
    text: 'What is the best way to treat a severe mealybug infestation on an indoor plant?',
    options: ['Increase watering frequency', 'Dab them with a cotton swab dipped in rubbing alcohol and use insecticidal soap', 'Place the plant in direct sunlight', 'Apply a high-nitrogen fertilizer'],
    correctIndex: 1,
    explanation: 'Alcohol dissolves the mealybug\'s waxy protective coating, and insecticidal soap kills them on contact.'
  },
  {
    id: 'q23',
    text: 'What does N-P-K stand for on a fertilizer label?',
    options: ['Nitrogen, Phosphorus, Potassium', 'Nitrogen, Potassium, Krypton', 'Nickel, Phosphorus, Potassium', 'Nitrogen, Phosphorus, Calcium'],
    correctIndex: 0,
    explanation: 'These represent the three primary macronutrients: Nitrogen (N), Phosphorus (P), and Potassium (K).'
  },
  {
    id: 'q24',
    text: 'What is the term for a plant that lives for more than two years?',
    options: ['Annual', 'Biennial', 'Perennial', 'Ephemeral'],
    correctIndex: 2,
    explanation: 'Perennials live for multiple years, often dying back in winter and returning in spring.'
  },
  {
    id: 'q25',
    text: 'Which practice helps retain soil moisture and suppress weeds in a garden?',
    options: ['Tilling the soil daily', 'Applying a layer of organic mulch', 'Using overhead sprinklers exclusively', 'Removing all organic matter from the surface'],
    correctIndex: 1,
    explanation: 'Mulch covers the soil, reducing evaporation, regulating temperature, and blocking sunlight from weed seeds.'
  },
  {
    id: 'q26',
    text: 'What is hydroponics?',
    options: ['Growing plants in pure compost', 'Growing plants without soil using nutrient-rich water solutions', 'Growing plants in darkness', 'A type of pruning technique'],
    correctIndex: 1,
    explanation: 'Hydroponics is the technique of growing plants using a water-based nutrient solution rather than soil.'
  },
  {
    id: 'q27',
    text: 'Thrips are tiny pests that cause what type of damage to leaves?',
    options: ['Large, irregular holes', 'Silvery stippling or scarring and distorted growth', 'Complete defoliation overnight', 'White powdery coating'],
    correctIndex: 1,
    explanation: 'Thrips puncture plant cells and suck out the contents, leaving a silvery, speckled appearance on the foliage.'
  },
  {
    id: 'q28',
    text: 'What does "deadheading" mean in horticulture?',
    options: ['Removing dead roots', 'Removing spent flowers to encourage more blooming', 'Cutting the main trunk of a tree', 'Applying herbicides to weeds'],
    correctIndex: 1,
    explanation: 'Deadheading redirects the plant\'s energy from seed production back into creating new flowers and roots.'
  },
  {
    id: 'q29',
    text: 'Which of the following is considered a beneficial pollinator?',
    options: ['Spider Mite', 'Whitefly', 'Hoverfly (Syrphid fly)', 'Cabbage Looper'],
    correctIndex: 2,
    explanation: 'Hoverflies are excellent pollinators, and their larvae are aggressive predators of aphids.'
  },
  {
    id: 'q30',
    text: 'A plant requires 12-14 hours of darkness to trigger flowering. What is this called?',
    options: ['Phototropism', 'Short-day (long-night) plant', 'Day-neutral plant', 'Long-day plant'],
    correctIndex: 1,
    explanation: 'Short-day plants require a continuous period of darkness exceeding a critical threshold to initiate flowering.'
  }
];

export const getRandomQuestions = (count: number = 25): Question[] => {
  const shuffled = [...ADVISOR_QUESTION_BANK].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
