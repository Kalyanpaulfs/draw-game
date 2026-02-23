const EASY_WORDS = [
    "Apple", "Ball", "Cat", "Dog", "Sun", "Moon", "Star", "Tree", "Fish", "Car",
    "Bus", "Cup", "Hat", "Book", "Cake", "Ship", "Boat", "Lamp", "Shoe", "Key",
    "Door", "Bed", "Ring", "Fork", "Spoon", "Plate", "Chair", "Table", "Cloud", "Rain",
    "Snow", "Leaf", "Bird", "Egg", "Box", "Clock", "Crown", "Drum", "Flag", "Frog",
    "Milk", "Nose", "Pizza", "Plant", "Robot", "Sock", "Train", "Truck", "Watch", "Whale",
    "Ant", "Bee", "Cow", "Duck", "Goat", "Lion", "Tiger", "Horse", "Sheep", "Pig",
    "Deer", "Crab", "Shark", "Snake", "Mouse", "Rabbit", "Bear", "Panda", "Koala", "Zebra",
    "Camel", "Donkey", "Monkey", "Parrot", "Owl", "Peach", "Mango", "Grape", "Lemon", "Cherry",
    "Bread", "Rice", "Soup", "Salad", "Burger", "Fries", "Candy", "Donut", "Ice", "Tea",
    "Coffee", "Juice", "Bottle", "Glass", "Brush", "Comb", "Soap", "Towel", "Pillow", "Blanket",
    "Mirror", "Window", "Wall", "Floor", "Roof", "Gate", "Road", "Bridge", "Park", "Hill",
    "Lake", "River", "Beach", "Island", "Farm", "Barn", "Tent", "Bag", "Cap", "Belt",
    "Glove", "Scarf", "Shirt", "Pants", "Dress", "Skirt", "Boot", "Slipper", "Helmet", "Knife",
    "Pan", "Pot", "Bowl", "Fan", "TV", "Radio", "Phone", "Keyboard", "Pen", "Pencil",
    "Eraser", "Paper", "Map", "Coin", "Money", "Gift", "Balloon", "Candle", "Torch", "Match",
    "Lock", "Chain", "Rope", "Wheel", "Engine", "Tire", "Wing", "Rocket", "Plane", "Sub",
    "Cart", "Van", "Taxi", "Bike", "Scooter", "Skate", "Surf", "Drill", "Hammer", "Nail",
    "Saw", "Axe", "Shovel", "Bucket", "Tap", "Pipe", "Plug", "Wire", "Bell", "Button",
    "Card", "Ticket", "Sign", "Arrow", "Cage", "Nest", "Shell", "Coral", "Stone", "Brick",
    "Sand", "Mud", "Snowman", "Kite", "Swing", "Slide", "Ladder", "Fence", "Alarm", "Calendar",
    "Mask", "Medal", "Trophy", "Camera", "Photo", "Frame", "Paint", "Color", "Crayon", "Ink",
    "Stamp", "Starfish", "Octopus", "Seal", "Penguin", "Swan", "Peacock", "Turkey", "Hen", "Rooster",
    "Bat", "Spider", "Ladybug", "Worm", "Caterpillar", "Butterfly", "Beehive", "Hive", "Honey", "Jam",
    "Butter", "Cheese", "Sandwich", "Hotdog", "Sausage", "Noodles", "Spaghetti", "Cupcake", "Pie", "Chips",
    "Popcorn", "Lollipop", "Cookie", "Chalk", "Board", "Desk", "Bench", "Locker", "Ruler", "Compass",
    "Globe", "AC", "Heater", "Curtain", "Sofa", "Couch", "Shelf", "Drawer", "Closet", "Mug",
    "Jug", "Pitcher", "Tray", "Mat", "Carpet", "Rug", "Pond", "Wave", "Storm", "Rainbow",
    "Thunder", "Lightning", "Volcano", "Mountain", "Cliff", "Cave", "Forest", "Jungle", "Desert", "Oasis",
    "Waterfall", "Tunnel", "Track", "Rail", "Station", "Airport", "Harbor", "Port", "Tower", "Castle",
    "Temple", "Church", "Mosque", "School", "Hospital", "Market", "Shop", "Mall", "Bank", "Hotel",
    "Office", "Factory", "Garage", "Zoo", "Circus", "Garden", "Playground", "Gym", "Pool", "Stadium",
    "Court", "Field", "Goal", "Net", "Racket", "Saddle", "Stroller", "Crib", "Diaper", "Toy",
    "Puzzle", "Blocks", "Doll", "Drone", "Tank", "Cannon", "Sword", "Shield", "Armor", "Treasure",
    "Chest", "Anchor", "Steering", "Hourglass", "Dice", "Joystick", "Controller", "Monitor", "Laptop", "Tablet",
    "Speaker", "Headphone", "Mic", "Remote", "Cable", "Battery", "Charger", "Socket", "Bulb", "Switch",
    "Generator", "Motor", "Blender", "Toaster", "Oven", "Fridge", "Freezer", "Mixer", "Vacuum", "Washer",
    "Dryer", "Iron", "Basket", "Bin", "Trash", "Recycle", "Signal", "Light", "Rock", "Pebble",
    "Gem", "Diamond", "Gold", "Silver", "Note", "Wallet", "Suitcase", "Backpack", "Umbrella", "Sleeping",
    "Lantern", "Matchstick", "Fire", "Smoke", "Ash", "Coal", "Log", "Wood", "Stick", "Branch",
    "Root", "Seed", "Flower", "Rose", "Lily", "Lotus", "Tulip", "Sunflower", "Daisy", "Cactus",
    "Palm", "Pine", "Oak", "Banana", "Orange", "Pear", "Kiwi", "Plum", "Berry", "Coconut",
    "Papaya", "Guava"
];

const MEDIUM_WORDS = [
    "Teacher", "Doctor", "Nurse", "Farmer", "Pilot", "Driver", "Singer", "Dancer", "Painter", "Chef",
    "Police", "Judge", "Lawyer", "Engineer", "Scientist", "Astronaut", "Soldier", "Firefighter", "Plumber", "Carpenter",
    "Electrician", "Barber", "Mechanic", "Tailor", "Fisherman", "Gardener", "Photographer", "Magician", "Clown", "Waiter",
    "Runner", "Swimmer", "Climber", "Skater", "Skier", "Boxer", "Wrestler", "Baker", "Cashier", "Librarian",
    "Reporter", "Director", "Actor", "Model", "Coach", "Trainer", "Guide", "Explorer", "Hunter", "Fighter",
    "Typing", "Drawing", "Singing", "Cooking", "Driving", "Flying", "Jumping", "Running", "Sleeping", "Laughing",
    "Crying", "Falling", "Clapping", "Dancing", "Reading", "Writing", "Fishing", "Hunting", "Camping", "Swimming",
    "Surfing", "Skating", "Climbing", "Diving", "Shooting", "Throwing", "Catching", "Kicking", "Punching", "Building",
    "Fixing", "Cleaning", "Washing", "Brushing", "Painting", "Cutting", "Digging", "Planting", "Watering", "Shopping",
    "Paying", "Selling", "Buying", "Traveling", "Hiking", "Picnic", "Wedding", "Birthday", "Festival", "Parade",
    "Concert", "Meeting", "Interview", "Presentation", "Celebration", "Vacation", "Competition", "Tournament", "Conference", "Debate",
    "Election", "Examination", "Graduation", "Proposal", "Rescue", "Explosion", "Accident", "Traffic", "Construction", "Demolition",
    "Repair", "Investigation", "Discovery", "Experiment", "Launch", "Mission", "Journey", "Adventure", "Treasure", "Battle",
    "Attack", "Defense", "Victory", "Escape", "Chase", "Race", "Clue", "Mystery", "Crime", "Arrest",
    "Trial", "Sentence", "Boating", "Sailing", "Rowing", "Kayaking", "Skydiving", "Parachute", "Helicopter", "Submarine",
    "Rocketship", "Spaceship", "Galaxy", "Planet", "Satellite", "Meteor", "Asteroid", "Alien", "Monster", "Zombie",
    "Wizard", "Knight", "Dragon", "Superhero", "Villain", "Time travel", "Haunted house", "Treasure hunt", "Pirate ship", "Underwater world",
    "Jungle safari", "Desert storm", "Snow battle", "Water fight", "Food fight", "Magic trick", "Fire drill", "Car crash", "Bus stop", "Train station",
    "Airport security", "Police chase", "Bank robbery", "Mountain climb", "River crossing", "Forest fire", "Volcano eruption", "Earthquake", "Tornado", "Hurricane",
    "Thunderstorm", "Camping tent", "Picnic basket", "Birthday cake", "Wedding ring", "Graduation cap", "Doctor visit", "School bus", "Classroom test", "Library study",
    "Hospital room", "Shopping cart", "Coffee shop", "Movie theater", "Video game", "Football match", "Basketball game", "Tennis match", "Swimming race", "Boxing ring",
    "Wrestling match", "Fishing boat", "Treasure map", "Secret code", "Space mission", "Rocket launch", "Alien invasion", "Zombie attack", "Superhero fight", "Dragon battle",
    "Magic potion", "Wizard spell", "Knight armor", "Pirate treasure", "Time machine", "Robot fight", "Robot factory", "Alien spaceship", "Monster truck", "Ghost house",
    "Haunted forest", "Magic wand", "Crystal ball", "Flying carpet", "Golden crown", "Hidden cave", "Secret door", "Trap door", "Treasure chest", "Battlefield",
    "Army camp", "Space station", "Moon landing", "Mars rover", "Ocean dive", "Scuba diver", "Deep sea", "Coral reef", "Shark attack", "Whale jump",
    "Animal rescue", "Fire rescue", "Police patrol", "Traffic jam", "Road trip", "Car race", "Bike race", "Horse race", "Snowboard", "Ski jump",
    "Ice skating", "Skate park", "Gym workout", "Yoga pose", "Meditation", "Karate kick", "Boxing punch", "Climbing rope", "Jump rope", "Treasure island",
    "Lost city", "Hidden temple", "Ancient ruins", "Gold mine", "Diamond hunt", "Secret lab", "Science test", "Magic school", "Flying dragon", "Castle gate",
    "Royal throne", "King crown", "Queen dress", "Royal guard", "Army tank", "War plane", "Naval ship", "Submarine dive", "Rocket blast", "Alien world",
    "Robot army", "Zombie town", "Monster cave", "Magic portal", "Time portal", "Future city", "Underwater city", "Sky city", "Floating island", "Space battle",
    "Final boss"
];

const HARD_WORDS = [
    "Time", "Gravity", "Dream", "Memory", "Shadow", "Silence", "Freedom", "Danger", "History", "Future",
    "Mystery", "Victory", "Failure", "Energy", "Electricity", "Pollution", "Galaxy", "Universe", "Illusion", "Jealousy",
    "Adventure", "Competition", "Strategy", "Technology", "Evolution", "Invention", "Revolution", "Destiny", "Balance", "Chaos",
    "Order", "Fear", "Hope", "Anger", "Love", "Peace", "War", "Trust", "Loyalty", "Greed",
    "Pride", "Wisdom", "Knowledge", "Justice", "Truth", "Lie", "Secret", "Risk", "Power", "Control",
    "Addiction", "Ambition", "Confidence", "Courage", "Disaster", "Emergency", "Survival", "Extinction", "Mutation", "Transformation",
    "Teleportation", "Invisibility", "Immortality", "Rebirth", "Nightmare", "Fantasy", "Imagination", "Creativity", "Depression", "Anxiety",
    "Happiness", "Loneliness", "Friendship", "Partnership", "Leadership", "Teamwork", "Betrayal", "Sacrifice", "Temptation", "Obsession",
    "Revenge", "Regret", "Forgiveness", "Hopeful", "Hopeless", "Heroism", "Villainy", "Corruption", "Rebellion", "Empire",
    "Kingdom", "Democracy", "Dictator", "Capitalism", "Socialism", "Inflation", "Recession", "Economy", "Pandemic", "Virus",
    "Vaccine", "Artificial Intelligence", "Virtual reality", "Augmented reality", "Cyber attack", "Hacking", "Encryption", "Algorithm", "Blockchain", "Quantum",
    "Black hole", "Time loop", "Parallel universe", "Fourth dimension", "Space-time", "Supernova", "Asteroid impact", "Climate change", "Global warming", "Ice age",
    "Apocalypse", "Dystopia", "Utopia", "Mind control", "Brainwash", "Hypnosis", "Prophecy", "Afterlife", "Heaven", "Hell",
    "Judgment", "Soul", "Spirit", "Ghost", "Possession", "Exorcism", "Haunting", "Night vision", "Dark web", "Surveillance",
    "Espionage", "Assassination", "Conspiracy", "Secret society", "Hidden agenda", "World war", "Civil war", "Cold war", "Arms race", "Nuclear bomb",
    "Terrorism", "Hostage", "Blackmail", "Scandal", "Protest", "Censorship", "Freedom speech", "Cyber crime", "Identity theft", "Space colony",
    "Mars mission", "Alien contact", "First contact", "Interstellar travel", "Galactic war", "Starship", "Terraforming", "Clone", "Hybrid", "Android",
    "Cyborg", "Nanotechnology", "Genetic engineering", "Time paradox", "Alternate reality", "Simulation", "Matrix", "Multiverse", "Singularity", "Space invasion",
    "Robot uprising", "Machine learning", "Deep fake", "Surveillance state", "Digital currency", "Virtual world", "Cloud computing", "Data breach", "Dark energy", "Dark matter",
    "Solar flare", "Comet strike", "Meteor shower", "Cosmic storm", "Event horizon", "Wormhole", "Blackout", "Meltdown", "Overload", "Breakdown",
    "Lockdown", "Shutdown", "Takeover", "Collapse", "Awakening", "Enlightenment", "Ascension", "Domination", "Oppression", "Liberation",
    "Resistance", "Invasion", "Migration", "Refugee", "Reform", "Reconstruction", "Expansion", "Exploration", "Discovery", "Conquest",
    "Diplomacy", "Alliance", "Rivalry", "Sabotage", "Infiltration", "Extraction", "Detonation", "Evacuation", "Contamination", "Quarantine",
    "Outbreak", "Annihilation", "Redemption", "Salvation", "Oblivion", "Infinity", "Eternity", "Fate", "Luck", "Chance",
    "Probability", "Gamble", "Prediction", "Forecast", "Investment", "Bankruptcy", "Fraud", "Scam", "Bribery", "Power struggle",
    "Identity crisis", "Midlife crisis", "Existential crisis", "Social media", "Fake news", "Cancel culture", "Viral trend", "Influencer", "Digital addiction", "Screen time",
    "Online shopping", "E-commerce", "Metaverse", "Space race", "Cold fusion", "Fusion reactor", "Nuclear fallout", "Radiation", "Biohazard", "Cyberpunk",
    "Steampunk", "Post-apocalypse", "Dark fantasy", "High fantasy", "Urban legend", "Mythology", "Propaganda", "Brainstorm", "Mindset", "Perspective",
    "Influence", "Negotiation", "Manipulation", "Persuasion", "Motivation", "Discipline", "Consistency", "Perfection", "Improvement", "Productivity",
    "Burnout", "Overthinking", "Self doubt", "Self control", "Inner peace", "Personal growth", "Life lesson", "Turning point", "Breaking point", "Point of no return",
    "Final decision", "Last chance", "Second chance", "New beginning", "End game"
];

import { Difficulty } from "./types";

export function getRandomWords(count: number, difficulty: Difficulty, excludedWords: string[] = []): string[] {
    let pool: string[] = [];

    if (difficulty === "easy") pool = EASY_WORDS;
    else if (difficulty === "medium") pool = MEDIUM_WORDS;
    else pool = HARD_WORDS;

    // Filter out already used words
    const availablePool = pool.filter(word => !excludedWords.includes(word));

    // Fallback if we run out of unique words (highly unlikely with 500+ words)
    const finalPool = availablePool.length >= count ? availablePool : pool;

    const shuffled = [...finalPool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}
