const EASY_WORDS = [
    // A (20)
    "Ant", "Ape", "Ark", "Arm", "Axe", "Air", "Ash", "Ace", "Aim", "Ale", "Alp", "Add", "Age", "Ago", "Aha", "Aid", "Ail", "Ajar", "Area", "Away",
    // B (20)
    "Bat", "Bee", "Bed", "Box", "Boy", "Bus", "Bag", "Bar", "Bad", "Big", "Bin", "Bow", "Bud", "Bun", "Buy", "Bye", "Bit", "Bob", "Boat", "Book",
    // C (20)
    "Cat", "Cow", "Cup", "Cap", "Can", "Car", "Cog", "Cot", "Cry", "Cut", "Cab", "Cad", "Cam", "Caw", "Chi", "Cob", "Cod", "Col", "Con", "Cop",
    // D (20)
    "Dog", "Dot", "Day", "Dig", "Die", "Dim", "Din", "Dip", "Doe", "Don", "Dry", "Dub", "Dud", "Due", "Dug", "Duo", "Dye", "Dad", "Den", "Desk",
    // E (20)
    "Ear", "Egg", "Eel", "Elk", "Eat", "Ebb", "Ego", "Elf", "Elm", "End", "Era", "Eve", "Eye", "Eke", "Ell", "Emu", "Err", "Even", "Exit", "Echo",
    // F (20)
    "Fox", "Fly", "Fan", "Fat", "Fed", "Fig", "Fin", "Fir", "Fit", "Fix", "Flu", "Fob", "Foe", "Fog", "For", "Fry", "Fun", "Fur", "Fish", "Flag",
    // G (20)
    "Guy", "Gum", "Gap", "Gas", "Gel", "Gem", "Get", "Gig", "Gin", "Gnu", "Gob", "God", "Goo", "Got", "Gun", "Gut", "Gym", "Gyp", "Gate", "Goat",
    // H (20)
    "Hat", "Hen", "Hog", "Hop", "Hot", "How", "Hub", "Hue", "Hug", "Hum", "Hun", "Hut", "Had", "Hag", "Ham", "Has", "Haw", "Hay", "Head", "Hill",
    // I (20)
    "Ice", "Ink", "Inn", "Ion", "Ire", "Its", "Ivy", "Icy", "Ili", "Ill", "Imp", "Inc", "Ike", "Iris", "Iron", "Isle", "Item", "Into", "Icon", "Idea",
    // J (20)
    "Jar", "Jet", "Jig", "Job", "Jog", "Jot", "Joy", "Jud", "Jug", "Jut", "Jab", "Jag", "Jam", "Jaw", "Jay", "Jeep", "Jerk", "Join", "Joke", "Jump",
    // K (20)
    "Key", "Kid", "Kin", "Kip", "Kit", "Keg", "Ken", "Kep", "Keys", "Kiss", "Kite", "Kiwi", "Knee", "Knot", "Kail", "Kale", "Keel", "Keep", "Kern", "Kilt",
    // L (20)
    "Log", "Leg", "Lip", "Lid", "Low", "Lad", "Lag", "Lam", "Lap", "Lar", "Las", "Lat", "Law", "Lax", "Lay", "Lea", "Led", "Lee", "Lei", "Lake",
    // M (20)
    "Mud", "Mug", "Map", "Mat", "Men", "Met", "Mid", "Mix", "Mob", "Mod", "Moo", "Mop", "Mow", "Mum", "Myo", "Mad", "Mae", "Mag", "Mask", "Milk",
    // N (20)
    "Nut", "Net", "Nap", "Nay", "Neb", "Neo", "New", "Nib", "Nil", "Nip", "Nit", "Nix", "Nob", "Nod", "Nog", "Nor", "Not", "Now", "Nub", "Nose",
    // O (20)
    "Owl", "Oat", "Orb", "Ore", "Oak", "Oar", "Oba", "Obi", "Odd", "Ode", "Off", "Oft", "Ohs", "Oil", "Old", "Ole", "One", "Opt", "Over", "Oven",
    // P (20)
    "Pig", "Pan", "Pen", "Pin", "Pot", "Pug", "Pup", "Pac", "Pad", "Pal", "Pap", "Par", "Pat", "Paw", "Pax", "Pay", "Pea", "Peg", "Pet", "Pear",
    // Q (20)
    "Qua", "Que", "Qui", "Quo", "Quag", "Quad", "Quai", "Quat", "Quay", "Quid", "Quin", "Quip", "Quit", "Quiz", "Quod", "Queen", "Quick", "Quiet", "Quack", "Quilt",
    // R (20)
    "Rat", "Red", "Rib", "Rim", "Rip", "Rob", "Rod", "Roe", "Rot", "Row", "Rub", "Rue", "Rug", "Rum", "Run", "Rut", "Rye", "Rad", "Rag", "Rain",
    // S (20)
    "Sun", "Sky", "Sea", "Sad", "Sap", "Sat", "Saw", "Sax", "Say", "See", "Sen", "Set", "Sew", "Sex", "She", "Shy", "Sib", "Sic", "Sin", "Star",
    // T (20)
    "Ten", "Top", "Toy", "Tea", "Tad", "Tag", "Tam", "Tan", "Tap", "Tar", "Tat", "Tau", "Ted", "Tee", "The", "Tic", "Tie", "Til", "Tree", "Tent",
    // U (20)
    "Urn", "Use", "Ups", "Utu", "Uke", "Ulu", "Umm", "Ump", "Uni", "Uns", "Upas", "Urb", "Urd", "Urp", "Usa", "Undo", "Unit", "Upon", "Urge", "User",
    // V (20)
    "Van", "Vat", "Vet", "Vex", "Via", "Vie", "Vim", "Vin", "Vis", "Voe", "Vow", "Vox", "Var", "Vas", "Vau", "Vav", "Vaw", "Vee", "Vase", "Vest",
    // W (20)
    "Wig", "Web", "Way", "War", "Was", "Wax", "Wed", "Wee", "Wen", "Wet", "Who", "Why", "Win", "Wis", "Wit", "Wiz", "Woe", "Walk", "Wall", "Wave",
    // X (20)
    "Xis", "Xat", "Xeb", "Xer", "Xray", "Xylem", "Xylyl", "Xenic", "Xenon", "Xerox", "Xysti", "Xystus", "Xylol", "Xylos", "Xeric", "Xerox", "Xylem", "Xysti", "Xylyl", "Xenia",
    // Y (20)
    "Yak", "Yam", "Yen", "Yes", "Yet", "Yew", "Yin", "Yap", "Yar", "Yaw", "Yay", "Yea", "Yeh", "Yep", "Yolk", "Yawn", "Yard", "Yarn", "Year", "Yoga",
    // Z (20)
    "Zoo", "Zap", "Zed", "Zee", "Zig", "Zip", "Zit", "Zoe", "Zas", "Zax", "Zek", "Zel", "Zen", "Zep", "Zin", "Zero", "Zest", "Zinc", "Zion", "Zone"
];

const MEDIUM_WORDS = [
    // A (20)
    "Apple", "Angle", "Alarm", "Adult", "Agent", "Album", "Alien", "Aloud", "Amber", "Ample", "Amuse", "Angel", "Anger", "Ankle", "Apply", "Apron", "Arena", "Armor", "Arrow", "Atlas",
    // B (20)
    "Beach", "Bread", "Brick", "Brush", "Brain", "Badge", "Baked", "Baron", "Basic", "Basil", "Basin", "Batch", "Beard", "Beast", "Berry", "Bible", "Birth", "Black", "Blade", "Blame",
    // C (20)
    "Chair", "Chess", "Candy", "Camel", "Canal", "Canoe", "Cargo", "Catch", "Cause", "Cedar", "Chain", "Chalk", "Champ", "Chart", "Check", "Cheek", "Cheer", "Chest", "Chief", "Child",
    // D (20)
    "Dance", "Dream", "Dress", "Drive", "Drink", "Dairy", "Daisy", "Death", "Delay", "Delta", "Depth", "Derby", "Devil", "Diary", "Digit", "Diner", "Dirty", "Ditch", "Diver", "Draft",
    // E (20)
    "Eagle", "Earth", "Eight", "Elbow", "Early", "Ebony", "Elder", "Elect", "Elite", "Empty", "Enemy", "Enjoy", "Entry", "Equal", "Error", "Essay", "Event", "Evict", "Exact", "Exist",
    // F (20)
    "Fairy", "Fence", "Field", "Flame", "Flute", "Fruit", "Faith", "False", "Fancy", "Feast", "Ferry", "Fetch", "Fever", "Fifth", "Fifty", "Fight", "Final", "First", "Flair", "Flash",
    // G (20)
    "Ghost", "Giant", "Glass", "Globe", "Grass", "Green", "Gamer", "Giddy", "Glare", "Glaze", "Gleam", "Glide", "Glory", "Glove", "Gourd", "Grace", "Grade", "Grain", "Grand", "Graph",
    // H (20)
    "Happy", "Heart", "Heavy", "Horse", "House", "Habit", "Hairy", "Harsh", "Hatch", "Hedge", "Hello", "Hobby", "Honey", "Honor", "Hotel", "Hurry", "Hutch", "Hydro", "Hyena", "Hyper",
    // I (20)
    "Image", "Index", "Ideal", "Inner", "Input", "Irony", "Issue", "Italy", "Ivory", "Icing", "Indigo", "Infant", "Inform", "Injury", "Inland", "Insect", "Insert", "Inside", "Insult", "Intent",
    // J (20)
    "Jeans", "Jelly", "Juice", "Jacket", "Jails", "Jargon", "Jaunt", "Jazzy", "Jeeps", "Jerky", "Jests", "Jewel", "Jiffy", "Joker", "Jolly", "Joust", "Judge", "Jumps", "Junky", "Juror",
    // K (20)
    "Knife", "Koala", "Kebab", "Keels", "Keeps", "Kenaf", "Keyed", "Kicks", "Kills", "Kinda", "Kings", "Kiosk", "Kited", "Kites", "Knack", "Knaves", "Knead", "Kneel", "Knelt", "Knock",
    // L (20)
    "Label", "Laser", "Laugh", "Lemon", "Light", "Llama", "Lunch", "Labor", "Lakes", "Lamps", "Lands", "Lanes", "Large", "Lasso", "Lasts", "Latex", "Layer", "Leads", "Leans", "Leap",
    // M (20)
    "Magic", "Mango", "Metal", "Model", "Money", "Month", "Mouse", "Mouth", "Music", "Macro", "Maids", "Major", "Maker", "Males", "Mamma", "Manor", "Maple", "March", "Match", "Mayor",
    // N (20)
    "Night", "Noise", "North", "Nurse", "Naked", "Names", "Nasal", "Naval", "Needs", "Nerve", "Never", "Newly", "Ninja", "Noble", "Novel", "Nutty", "Nylon", "Nymph", "Nudge", "Notch",
    // O (20)
    "Ocean", "Onion", "Opera", "Orbit", "Organ", "Oasis", "Occur", "Octet", "Offer", "Often", "Older", "Olive", "Omega", "Onset", "Order", "Other", "Outer", "Owner", "Oxide", "Overs",
    // P (20)
    "Paint", "Panel", "Paper", "Party", "Peach", "Pearl", "Phone", "Piano", "Pilot", "Pizza", "Plane", "Plant", "Plate", "Point", "Power", "Price", "Pride", "Prize", "Puppy", "Punch",
    // Q (20)
    "Queen", "Quiet", "Quack", "Quads", "Quaff", "Quail", "Quake", "Qualm", "Quark", "Quart", "Quash", "Quasi", "Quays", "Queas", "Queer", "Quell", "Query", "Quest", "Queue", "Quilt",
    // R (20)
    "Radio", "Range", "Raven", "River", "Robot", "Rocket", "Round", "Racer", "Radar", "Raise", "Rally", "Ranch", "Range", "Rapid", "Ratio", "Razor", "Reach", "React", "Ready", "Relax", "Remix",
    // S (20)
    "Scale", "Scene", "Scout", "Shark", "Sheep", "Shell", "Shirt", "Shock", "Snake", "Sound", "South", "Space", "Spoon", "Stage", "Stamp", "Steam", "Stick", "Stone", "Store", "Storm",
    // T (20)
    "Table", "Taste", "Tiger", "Title", "Toast", "Tooth", "Torch", "Touch", "Tower", "Track", "Trade", "Train", "Treat", "Truck", "Trust", "Tacos", "Tails", "Taken", "Tales", "Tasks",
    // U (20)
    "Uncle", "Union", "Unity", "Ultra", "Unarm", "Under", "Unfit", "Unite", "Units", "Unsad", "Unset", "Until", "Upend", "Upper", "Upset", "Urban", "Usage", "Utils", "Using", "Users",
    // V (20)
    "Value", "Valve", "Video", "Virus", "Voice", "Vacation", "Vacuum", "Valet", "Valid", "Vapor", "Vase", "Vault", "Vegan", "Velum", "Venom", "Venue", "Verge", "Verse", "Vicar", "Vocal",
    // W (20)
    "Watch", "Water", "Whale", "Wheel", "White", "Whole", "Window", "Woman", "World", "Worry", "Wreath", "Wrist", "Wagon", "Waist", "Waits", "Walks", "Walls", "Waltz", "Wants", "Waste",
    // X (20)
    "Xenon", "Xerox", "Xylem", "Xebec", "Xysti", "Xenic", "Xylol", "Xeric", "Xenia", "Xeroma", "Xenops", "Xylate", "Xylose", "Xyloid", "Xenial", "Xylopy", "Xerism", "Xeriff", "Xeriff", "Xyrid",
    // Y (20)
    "Yacht", "Yield", "Young", "Youth", "Yards", "Yarns", "Yearn", "Years", "Yeast", "Yodel", "Yogis", "Yucca", "Yukon", "Yummy", "Yurts", "Yells", "Yodle", "Yoked", "Yolks", "Yours",
    // Z (20)
    "Zebra", "Zenith", "Zephyr", "Zeroes", "Zigzag", "Zinced", "Zincs", "Zinnia", "Zipper", "Zither", "Zodiac", "Zonal", "Zoned", "Zones", "Zoning", "Zooish", "Zooms", "Zounds", "Zygote", "Zowie"
];

const HARD_WORDS = [
    // A (20)
    "Airplane", "Alphabet", "Ambulance", "Aquarium", "Astronaut", "Adventure", "Aerobics", "Ageless", "Airborne", "Alchemist", "Algebra", "Alienate", "Allergic", "Alliance", "Alligator", "Altitude", "Aluminum", "Amethyst", "Ancestor", "Anecdote",
    // B (20)
    "Backpack", "Balloon", "Barbecue", "Basement", "Basketball", "Bathroom", "Battery", "Birthday", "Blizzard", "Blossom", "Bookcase", "Bookmark", "Bracelet", "Broccoli", "Building", "Bulldozer", "Butterfly", "Backward", "Bacteria", "Baggage",
    // C (20)
    "Calendar", "Campfire", "Candle", "Carnival", "Carriage", "Cartoon", "Castle", "Cathedral", "Ceiling", "Ceremony", "Champion", "Chemical", "Chimney", "Chocolate", "Classroom", "Clothing", "Cocktail", "Coconut", "Compass", "Computer",
    // D (20)
    "Daughter", "Daylight", "Decision", "Decorate", "Decrease", "Delivery", "Dentist", "Deposit", "Describe", "Desert", "Designer", "Destroy", "Detective", "Diagram", "Dialogue", "Diamond", "Dinosaur", "Diploma", "Director", "Disaster",
    // E (20)
    "Earnings", "Earrings", "Earthworm", "Echoing", "Eclectic", "Economic", "Educate", "Eggplant", "Egyptian", "Elastic", "Election", "Electric", "Elephant", "Elevator", "Emerald", "Employee", "Employer", "Engineer", "Entrance", "Envelope",
    // F (20)
    "Fabric", "Factory", "Failure", "Fairies", "Falcon", "Family", "Fanatic", "Fantasy", "Farewell", "Farmer", "Fashion", "Father", "Faucet", "Feather", "Feature", "February", "Festival", "Fiction", "Figurine", "Finance",
    // G (20)
    "Galactic", "Gallery", "Garbage", "Garment", "Gateway", "Gazette", "Gelatin", "General", "Genetic", "Genting", "Genuine", "Geology", "Geometry", "Geranium", "Gesture", "Getting", "Gherkin", "Gifts", "Gigantic", "Giraffe",
    // H (20)
    "Habitual", "Haircut", "Hallmark", "Halloween", "Hallucin", "Handbag", "Handful", "Handicap", "Handset", "Handsome", "Hangover", "Happily", "Hardware", "Harmful", "Harmony", "Harvest", "Hatchet", "Haunted", "Headband", "Headlamp",
    // I (20)
    "Identity", "Ideology", "Ignorant", "Illusion", "Imaginary", "Immediate", "Immigrant", "Immortal", "Implement", "Implicit", "Important", "Improper", "Improved", "Incident", "Inclusion", "Incoming", "Increase", "Indirect", "Industry", "Infinity",
    // J (20)
    "Japanese", "Jaundice", "Jealously", "Jellyfish", "Jeopardy", "Jetliner", "Jewelry", "Jigsaw", "Jinglebell", "Jittery", "Jointure", "Journalism", "Journalist", "Journeyed", "Joyously", "Jubilant", "Judgment", "Junction", "Juvenile", "Justify",
    // K (20)
    "Kangaroo", "Kaleidoscope", "Keyboard", "Keystone", "Kickback", "Kickoff", "Kidnapper", "Kilogram", "Kilowatt", "Kindred", "Kinetics", "Kingbolt", "Kingdom", "Kingfisher", "Kinsfolk", "Kitchen", "Knapsack", "Kneecap", "Knothole", "Knowledge",
    // L (20)
    "Landscape", "Language", "Lantern", "Laptop", "Lattice", "Laundry", "Lavender", "Laxative", "Layover", "Leaflet", "Learning", "Lecturer", "Leftover", "Legality", "Leggings", "Leisure", "Lemonade", "Leopard", "Lethal", "Leveling",
    // M (20)
    "Machinery", "Magazine", "Magnetic", "Magnify", "Mainland", "Majestic", "Majority", "Mammoths", "Mandrill", "Manicure", "Manifest", "Mahogany", "Mainframe", "Maintain", "Mammals", "Mandolin", "Mangrove", "Mankind", "Manners", "Mariachi",
    // N (20)
    "Narrator", "National", "Natural", "Nautical", "Navigate", "Nebulose", "Necklace", "Negative", "Neglect", "Neighbor", "Neonatal", "Networks", "Neurons", "Neutral", "Nickname", "Nightcap", "Nightfall", "Nightmare", "Nitrogen", "Nocturnal",
    // O (20)
    "Obedient", "Objective", "Oblivion", "Obscure", "Obsessed", "Obstacle", "Obstruct", "Occasion", "Occupant", "Openness", "Operable", "Operator", "Opinion", "Opposite", "Optimism", "Optional", "Oracles", "Orchards", "Orchestral", "Ordinary",
    // P (20)
    "Package", "Pageant", "Painted", "Painter", "Palace", "Palette", "Pancake", "Pandora", "Panther", "Paradox", "Parallel", "Parasite", "Parents", "Particle", "Partner", "Passage", "Passive", "Passport", "Pastries", "Patience",
    // Q (20)
    "Quadrant", "Quadruple", "Quagmire", "Qualify", "Quantity", "Quarrel", "Quartile", "Quartzite", "Quashing", "Quebecer", "Question", "Queueing", "Quickens", "Quickly", "Quieten", "Quietly", "Quilled", "Quilted", "Quoting", "Quotient",
    // R (20)
    "Radiance", "Radical", "Raffia", "Railroad", "Rainbow", "Raincoat", "Rambling", "Rampage", "Randomize", "Ranger", "Rankle", "Rapidity", "Rapture", "Rareness", "Rasberry", "Ratified", "Rational", "Reaction", "Readable", "Realism",
    // S (20)
    "Sapphire", "Satellite", "Saturday", "Sausages", "Scabbard", "Scaffold", "Scalable", "Scarcely", "Scarcity", "Scenario", "Sceptic", "Schedule", "Schooner", "Sci-fi", "Science", "Scissors", "Scorpion", "Scramble", "Scratch", "Scribble",
    // T (20)
    "Tachometer", "Tactless", "Tailgate", "Tailings", "Tailspin", "Takeaway", "Takeover", "Talisman", "Tallied", "Tamarine", "Tangible", "Tankards", "Tapework", "Tapestry", "Tardiest", "Targeted", "Tarnish", "Tasteful", "Tattooing", "Taxation",
    // U (20)
    "Ultimate", "Umbrella", "Unafraid", "Unarmed", "Unaware", "Unbelief", "Unbroken", "Unbutton", "Uncleans", "Uncoated", "Uncommon", "Uncut", "Undead", "Underarm", "Undersea", "Underway", "Undoing", "Unearth", "Unevenly", "Unfaithful",
    // V (20)
    "Vacation", "Vaccines", "Vacuumed", "Vagabond", "Valiant", "Validity", "Valkyrie", "Vanguard", "Vanillas", "Vanished", "Vaporize", "Variable", "Variance", "Vascular", "Vaulting", "Vegetable", "Velocity", "Vendetta", "Venetian", "Ventures",
    // W (20)
    "Wadding", "Waffles", "Waggled", "Wagoned", "Waitress", "Wakeful", "Walkway", "Wallaby", "Walnuts", "Waltham", "Warfare", "Warlocks", "Warlords", "Warmness", "Warnings", "Warships", "Wartimes", "Washable", "Watchful", "Watchman", "Waterbed",
    // X (20)
    "Xylophone", "Xerography", "Xenophobia", "Xanthophyll", "Xylography", "Xenon-lamp", "Xylophones", "Xenophobic", "Xylophonist", "Xerophytic", "Xylographic", "Xenoplastic", "Xerophthal", "Xenomorph", "Xenobiotic", "Xyridaceous", "Xanthic", "Xylotomous", "Xerically", "Xenogamy",
    // Y (20)
    "Yachting", "Yardarm", "Yardstick", "Yearling", "Yearlong", "Yearning", "Yeastily", "Yellowed", "Yeomanry", "Yesperson", "Yesterday", "Yielding", "Yodelled", "Youngish", "Youngest", "Yourself", "Youthful", "YouTubers", "Yuletide", "Yummier",
    // Z (20)
    "Zookeeper", "Zealotry", "Zealously", "Zebra-striped", "Zeniths", "Zephyred", "Zephyrs", "Zero-gravity", "Zigzagged", "Zinc-plate", "Zincite", "Zionism", "Zippers", "Zirconia", "Zodiacal", "Zoolike", "Zoology", "Zoography", "Zygosity", "Zealot"
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
